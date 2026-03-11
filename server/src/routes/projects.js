import { Router } from 'express';
import auth from '../middleware/auth.js';
import Project from '../models/Project.js';
import Contact from '../models/Contact.js';
import Campaign from '../models/Campaign.js';

const router = Router();

// List all projects
router.get('/', auth, async (req, res) => {
    try {
        const { archived } = req.query;
        const filter = { userId: req.user.id };
        if (archived === 'true') filter.isArchived = true;
        else filter.isArchived = false;

        const projects = await Project.find(filter).sort({ updatedAt: -1 }).lean();

        // Get live stats for each project
        const projectsWithStats = await Promise.all(projects.map(async (p) => {
            const [contactCount, campaignCount] = await Promise.all([
                Contact.countDocuments({ userId: req.user.id, projectId: p._id }),
                Campaign.countDocuments({ userId: req.user.id, projectId: p._id }),
            ]);
            return { ...p, stats: { ...p.stats, contacts: contactCount, campaigns: campaignCount } };
        }));

        res.json(projectsWithStats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Create project
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, color, icon } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: 'Project name is required' });

        const project = await Project.create({
            userId: req.user.id,
            name: name.trim(),
            description: description || '',
            color: color || '#435AFF',
            icon: icon || 'folder',
        });

        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Get single project with pipeline stats
router.get('/:id', auth, async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, userId: req.user.id }).lean();
        if (!project) return res.status(404).json({ error: 'Project not found' });

        // Get pipeline stage counts
        const stageCounts = await Contact.aggregate([
            { $match: { userId: project.userId, projectId: project._id } },
            { $group: { _id: '$pipelineStage', count: { $sum: 1 } } },
        ]);

        const pipeline = project.pipelineStages.map(stage => ({
            ...stage,
            count: stageCounts.find(s => s._id === stage.name)?.count || 0,
        }));

        // Get recent contacts
        const recentContacts = await Contact.find({ userId: req.user.id, projectId: project._id })
            .sort({ updatedAt: -1 })
            .limit(10)
            .lean();

        res.json({ project, pipeline, recentContacts });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

// Update project
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, description, color, icon, pipelineStages } = req.body;
        const update = {};
        if (name !== undefined) update.name = name.trim();
        if (description !== undefined) update.description = description;
        if (color !== undefined) update.color = color;
        if (icon !== undefined) update.icon = icon;
        if (pipelineStages !== undefined) update.pipelineStages = pipelineStages;

        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            update,
            { new: true }
        );
        if (!project) return res.status(404).json({ error: 'Project not found' });

        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// Archive/unarchive project
router.patch('/:id/archive', auth, async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, userId: req.user.id });
        if (!project) return res.status(404).json({ error: 'Project not found' });

        project.isArchived = !project.isArchived;
        await project.save();

        res.json({ message: project.isArchived ? 'Project archived' : 'Project restored', project });
    } catch (error) {
        res.status(500).json({ error: 'Failed to archive project' });
    }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
    try {
        const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!project) return res.status(404).json({ error: 'Project not found' });

        // Remove project reference from contacts (don't delete contacts)
        await Contact.updateMany(
            { userId: req.user.id, projectId: project._id },
            { $unset: { projectId: 1 } }
        );

        res.json({ message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// Get pipeline (Kanban) data for a project
router.get('/:id/pipeline', auth, async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, userId: req.user.id }).lean();
        if (!project) return res.status(404).json({ error: 'Project not found' });

        const contacts = await Contact.find({ userId: req.user.id, projectId: project._id })
            .sort({ pipelineStageMovedAt: -1, updatedAt: -1 })
            .lean();

        // Group contacts by pipeline stage
        const columns = project.pipelineStages.map(stage => ({
            ...stage,
            contacts: contacts.filter(c => c.pipelineStage === stage.name),
        }));

        res.json({ project, columns });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pipeline' });
    }
});

// Move contact to a different pipeline stage
router.patch('/:id/pipeline/move', auth, async (req, res) => {
    try {
        const { contactId, stage } = req.body;
        if (!contactId || !stage) return res.status(400).json({ error: 'contactId and stage are required' });

        const contact = await Contact.findOneAndUpdate(
            { _id: contactId, userId: req.user.id, projectId: req.params.id },
            { pipelineStage: stage, pipelineStageMovedAt: new Date() },
            { new: true }
        );
        if (!contact) return res.status(404).json({ error: 'Contact not found in this project' });

        res.json(contact);
    } catch (error) {
        res.status(500).json({ error: 'Failed to move contact' });
    }
});

export default router;
