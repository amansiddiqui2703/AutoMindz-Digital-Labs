import { Router } from 'express';
import auth from '../middleware/auth.js';
import Sequence from '../models/Sequence.js';
import Campaign from '../models/Campaign.js';

const router = Router();

// Get all sequences
router.get('/', auth, async (req, res) => {
    try {
        const sequences = await Sequence.find({ userId: req.user.id, isArchived: false })
            .sort({ createdAt: -1 });
        res.json({ sequences });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sequences' });
    }
});

// Get single sequence
router.get('/:id', auth, async (req, res) => {
    try {
        const sequence = await Sequence.findOne({ _id: req.params.id, userId: req.user.id });
        if (!sequence) return res.status(404).json({ error: 'Sequence not found' });
        res.json({ sequence });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sequence' });
    }
});

// Create new sequence
router.post('/', auth, async (req, res) => {
    try {
        const { name, steps } = req.body;
        if (!name || !steps || !Array.isArray(steps) || steps.length === 0) {
            return res.status(400).json({ error: 'Name and at least one step are required' });
        }

        // Validate steps
        for (let i = 0; i < steps.length; i++) {
            if (!steps[i].body) {
                return res.status(400).json({ error: `Step ${i + 1} requires a body` });
            }
            if (i === 0 && !steps[i].subject) {
                 return res.status(400).json({ error: 'The first step must have a subject' });
            }
            steps[i].stepNumber = i + 1; // Enforce ordering
        }

        const sequence = new Sequence({
            userId: req.user.id,
            name,
            steps
        });

        await sequence.save();
        res.status(201).json({ sequence });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create sequence' });
    }
});

// Update sequence
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, steps } = req.body;
        
        const updateData = {};
        if (name) updateData.name = name;
        
        if (steps && Array.isArray(steps)) {
             // Validate steps
            for (let i = 0; i < steps.length; i++) {
                if (!steps[i].body) {
                    return res.status(400).json({ error: `Step ${i + 1} requires a body` });
                }
                if (i === 0 && !steps[i].subject) {
                     return res.status(400).json({ error: 'The first step must have a subject' });
                }
                steps[i].stepNumber = i + 1;
            }
            updateData.steps = steps;
        }

        const sequence = await Sequence.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            updateData,
            { new: true }
        );

        if (!sequence) return res.status(404).json({ error: 'Sequence not found' });
        res.json({ sequence });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update sequence' });
    }
});

// Delete (archive) sequence
router.delete('/:id', auth, async (req, res) => {
    try {
        // Check if sequence is in use by an active campaign
        const activeCampaigns = await Campaign.countDocuments({ 
            userId: req.user.id, 
            sequenceId: req.params.id,
            isArchived: false
        });

        if (activeCampaigns > 0) {
            return res.status(400).json({ error: 'Cannot delete sequence as it is currently attached to active campaigns.' });
        }

        const sequence = await Sequence.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { isArchived: true },
            { new: true }
        );

        if (!sequence) return res.status(404).json({ error: 'Sequence not found' });
        res.json({ message: 'Sequence deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete sequence' });
    }
});

export default router;
