import { Router } from 'express';
import auth from '../middleware/auth.js';
import Activity from '../models/Activity.js';

const router = Router();

// Get activity feed
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 50, type } = req.query;

        const query = { userId: req.user.id };
        if (type) query.type = type;

        const activities = await Activity.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('campaignId', 'name')
            .populate('contactId', 'name email')
            .populate('projectId', 'name')
            .populate('taskId', 'title status')
            .lean();

        const total = await Activity.countDocuments(query);

        res.json({
            activities,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
        });
    } catch (error) {
        console.error('Activity feed error:', error);
        res.status(500).json({ error: 'Failed to fetch activity feed' });
    }
});

// Get team activity feed
router.get('/team', auth, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;

        // Find user's team
        const Team = (await import('../models/Team.js')).default;
        const team = await Team.findOne({
            $or: [
                { ownerId: req.user.id },
                { 'members.userId': req.user.id, 'members.status': 'active' },
            ]
        });

        if (!team) return res.json({ activities: [], total: 0 });

        const activities = await Activity.find({ teamId: team._id })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('userId', 'name email')
            .populate('campaignId', 'name')
            .populate('contactId', 'name email')
            .lean();

        const total = await Activity.countDocuments({ teamId: team._id });

        res.json({
            activities,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch team activity' });
    }
});

export default router;
