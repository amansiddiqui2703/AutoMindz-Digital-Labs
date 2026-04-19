import { Router } from 'express';
import auth from '../middleware/auth.js';
import aiRateLimit from '../middleware/aiRateLimit.js';
import { askChatbot } from '../services/chatbot.js';

const router = Router();

// Ask the chatbot a question
router.post('/ask', auth, aiRateLimit, async (req, res) => {
    try {
        const { question } = req.body;
        if (!question || !question.trim()) {
            return res.status(400).json({ error: 'Please ask a question' });
        }

        // SECURITY FIX [HIGH-4]: Limit chatbot question length to prevent large payload abuse
        if (question.length > 2000) {
            return res.status(400).json({ error: 'Question too long (max 2000 characters).' });
        }

        const result = await askChatbot(req.user.id, question.trim());
        res.json({ answer: result.answer });
    } catch (error) {
        console.error('Chatbot error:', error.message);
        res.status(500).json({ error: error.message || 'Chatbot failed to respond' });
    }
});

export default router;
