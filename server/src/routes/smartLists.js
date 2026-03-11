import { Router } from 'express';
import auth from '../middleware/auth.js';
import SmartList from '../models/SmartList.js';
import Contact from '../models/Contact.js';

const router = Router();

/**
 * Build MongoDB filter from smart list filter conditions
 */
function buildContactFilter(userId, filters, matchType) {
    const conditions = filters.map(f => {
        switch (f.field) {
            case 'tag':
                if (f.operator === 'equals') return { tags: f.value };
                if (f.operator === 'not_equals') return { tags: { $ne: f.value } };
                if (f.operator === 'contains') return { tags: { $regex: f.value, $options: 'i' } };
                if (f.operator === 'is_empty') return { tags: { $size: 0 } };
                if (f.operator === 'is_not_empty') return { 'tags.0': { $exists: true } };
                break;
            case 'source':
                if (f.operator === 'equals') return { source: f.value };
                if (f.operator === 'not_equals') return { source: { $ne: f.value } };
                break;
            case 'pipelineStage':
                if (f.operator === 'equals') return { pipelineStage: f.value };
                if (f.operator === 'not_equals') return { pipelineStage: { $ne: f.value } };
                break;
            case 'lastEmailed':
                if (f.operator === 'before') return { lastEmailed: { $lt: new Date(f.value) } };
                if (f.operator === 'after') return { lastEmailed: { $gt: new Date(f.value) } };
                if (f.operator === 'is_empty') return { lastEmailed: { $exists: false } };
                if (f.operator === 'is_not_empty') return { lastEmailed: { $exists: true } };
                break;
            case 'emailCount':
                if (f.operator === 'equals') return { emailCount: Number(f.value) };
                if (f.operator === 'greater_than') return { emailCount: { $gt: Number(f.value) } };
                if (f.operator === 'less_than') return { emailCount: { $lt: Number(f.value) } };
                break;
            case 'isUnsubscribed':
                if (f.operator === 'equals') return { isUnsubscribed: f.value === 'true' || f.value === true };
                break;
            case 'company':
                if (f.operator === 'equals') return { company: f.value };
                if (f.operator === 'contains') return { company: { $regex: f.value, $options: 'i' } };
                if (f.operator === 'is_empty') return { $or: [{ company: '' }, { company: { $exists: false } }] };
                if (f.operator === 'is_not_empty') return { company: { $nin: ['', null] } };
                break;
            case 'createdAt':
                if (f.operator === 'before') return { createdAt: { $lt: new Date(f.value) } };
                if (f.operator === 'after') return { createdAt: { $gt: new Date(f.value) } };
                break;
            default:
                return null;
        }
        return null;
    }).filter(Boolean);

    if (conditions.length === 0) return { userId };

    const logicOp = matchType === 'any' ? '$or' : '$and';
    return { userId, [logicOp]: conditions };
}

// List all smart lists
router.get('/', auth, async (req, res) => {
    try {
        const { projectId } = req.query;
        const filter = { userId: req.user.id };
        if (projectId) filter.projectId = projectId;

        const lists = await SmartList.find(filter).sort({ updatedAt: -1 }).lean();

        // Get live counts
        const listsWithCounts = await Promise.all(lists.map(async (list) => {
            const contactFilter = buildContactFilter(req.user.id, list.filters, list.matchType);
            if (list.projectId) contactFilter.projectId = list.projectId;
            const count = await Contact.countDocuments(contactFilter);
            return { ...list, cachedCount: count };
        }));

        res.json(listsWithCounts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch smart lists' });
    }
});

// Create smart list
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, color, icon, filters, matchType, projectId } = req.body;
        if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
        if (!filters || !Array.isArray(filters) || filters.length === 0) {
            return res.status(400).json({ error: 'At least one filter is required' });
        }

        const smartList = await SmartList.create({
            userId: req.user.id,
            projectId,
            name: name.trim(),
            description: description || '',
            color: color || '#435AFF',
            icon: icon || 'list',
            filters,
            matchType: matchType || 'all',
            lastRefreshedAt: new Date(),
        });

        // Get initial count
        const contactFilter = buildContactFilter(req.user.id, filters, matchType || 'all');
        if (projectId) contactFilter.projectId = projectId;
        smartList.cachedCount = await Contact.countDocuments(contactFilter);
        await smartList.save();

        res.status(201).json(smartList);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create smart list' });
    }
});

// Get contacts in a smart list
router.get('/:id/contacts', auth, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const list = await SmartList.findOne({ _id: req.params.id, userId: req.user.id }).lean();
        if (!list) return res.status(404).json({ error: 'Smart list not found' });

        const contactFilter = buildContactFilter(req.user.id, list.filters, list.matchType);
        if (list.projectId) contactFilter.projectId = list.projectId;

        const [contacts, total] = await Promise.all([
            Contact.find(contactFilter)
                .sort({ updatedAt: -1 })
                .skip((page - 1) * limit)
                .limit(Number(limit))
                .lean(),
            Contact.countDocuments(contactFilter),
        ]);

        // Update cached count
        await SmartList.findByIdAndUpdate(list._id, { cachedCount: total, lastRefreshedAt: new Date() });

        res.json({ contacts, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch smart list contacts' });
    }
});

// Update smart list
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, description, color, icon, filters, matchType } = req.body;
        const update = {};
        if (name !== undefined) update.name = name.trim();
        if (description !== undefined) update.description = description;
        if (color !== undefined) update.color = color;
        if (icon !== undefined) update.icon = icon;
        if (filters !== undefined) update.filters = filters;
        if (matchType !== undefined) update.matchType = matchType;

        const list = await SmartList.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            update,
            { new: true }
        );
        if (!list) return res.status(404).json({ error: 'Smart list not found' });

        res.json(list);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update smart list' });
    }
});

// Delete smart list
router.delete('/:id', auth, async (req, res) => {
    try {
        const list = await SmartList.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!list) return res.status(404).json({ error: 'Smart list not found' });
        res.json({ message: 'Smart list deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete smart list' });
    }
});

export default router;
