import { Router } from 'express';
import auth from '../middleware/auth.js';
import { crawlDomainStealth } from '../services/stealthCrawler.js';
import planLimits from '../middleware/planLimits.js';

const router = Router();

// Search single domain using advanced stealth crawler
router.post('/search', auth, async (req, res) => {
    try {
        const { domain } = req.body;
        if (!domain) return res.status(400).json({ error: 'Domain required' });

        const result = await crawlDomainStealth(domain);
        
        // Convert the flat array into the expected 'emails' object structure used by the frontend
        if (result.all_emails_flat && result.all_emails_flat.length > 0) {
            result.emails = {
                contact: [],
                editorial: [],
                advertising: [],
                support: [],
                other: result.all_emails_flat
            };
        } else {
            result.emails = { contact: [], editorial: [], advertising: [], support: [], other: [] };
        }

        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: 'Advanced Search failed' });
    }
});

export default router;
