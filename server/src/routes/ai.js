import { Router } from 'express';
import auth from '../middleware/auth.js';
import aiRateLimit from '../middleware/aiRateLimit.js';
import * as gemini from '../services/gemini.js';

const router = Router();

router.post('/generate', auth, aiRateLimit, async (req, res) => {
    try {
        const { action, ...params } = req.body;

        let result;
        switch (action) {
            case 'cold-email':
                result = await gemini.generateColdEmail(params);
                break;
            case 'rewrite':
                result = await gemini.rewriteEmail(params);
                break;
            case 'improve-tone':
                result = await gemini.improveTone(params);
                break;
            case 'subject-lines':
                result = await gemini.generateSubjectLines(params);
                break;
            case 'personalize':
                result = await gemini.personalizeEmail(params);
                break;
            case 'follow-up':
                result = await gemini.generateFollowUp(params);
                break;
            case 'spam-check':
                result = await gemini.spamScoreCheck(params);
                break;
            default:
                return res.status(400).json({ error: `Unknown action: ${action}` });
        }

        res.json({ result, aiUsage: req.aiUsage });
    } catch (error) {
        res.status(500).json({ error: error.message || 'AI generation failed' });
    }
});

export default router;

