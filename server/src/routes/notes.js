import { Router } from 'express';
import auth from '../middleware/auth.js';
import Note from '../models/Note.js';
import Contact from '../models/Contact.js';

const router = Router();

// Get notes for a contact
router.get('/contact/:contactId', auth, async (req, res) => {
    try {
        const notes = await Note.find({
            userId: req.user.id,
            contactId: req.params.contactId,
        }).sort({ isPinned: -1, createdAt: -1 }).lean();

        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
});

// Create note
router.post('/', auth, async (req, res) => {
    try {
        const { contactId, projectId, content, type } = req.body;
        if (!contactId || !content?.trim()) {
            return res.status(400).json({ error: 'contactId and content are required' });
        }

        // Verify contact belongs to user
        const contact = await Contact.findOne({ _id: contactId, userId: req.user.id });
        if (!contact) return res.status(404).json({ error: 'Contact not found' });

        const note = await Note.create({
            userId: req.user.id,
            contactId,
            projectId: projectId || contact.projectId,
            content: content.trim(),
            type: type || 'note',
        });

        // Update notes count on contact
        await Contact.findByIdAndUpdate(contactId, { $inc: { notesCount: 1 } });

        res.status(201).json(note);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create note' });
    }
});

// Update note
router.put('/:id', auth, async (req, res) => {
    try {
        const { content, type, isPinned } = req.body;
        const update = {};
        if (content !== undefined) update.content = content.trim();
        if (type !== undefined) update.type = type;
        if (isPinned !== undefined) update.isPinned = isPinned;

        const note = await Note.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            update,
            { new: true }
        );
        if (!note) return res.status(404).json({ error: 'Note not found' });

        res.json(note);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update note' });
    }
});

// Delete note
router.delete('/:id', auth, async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!note) return res.status(404).json({ error: 'Note not found' });

        // Decrement notes count
        await Contact.findByIdAndUpdate(note.contactId, { $inc: { notesCount: -1 } });

        res.json({ message: 'Note deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete note' });
    }
});

// Toggle pin
router.patch('/:id/pin', auth, async (req, res) => {
    try {
        const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });
        if (!note) return res.status(404).json({ error: 'Note not found' });

        note.isPinned = !note.isPinned;
        await note.save();

        res.json(note);
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle pin' });
    }
});

export default router;
