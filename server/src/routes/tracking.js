import { Router } from 'express';
import { recordOpen, recordClick, recordUnsubscribe, recordBounce } from '../services/tracking.js';

const router = Router();

// Tracking pixel (1x1 transparent GIF)
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

router.get('/:trackingId/open', async (req, res) => {
    try {
        await recordOpen(req.params.trackingId, req.ip, req.headers['user-agent']);
    } catch { /* silent */ }

    res.set({
        'Content-Type': 'image/gif',
        'Content-Length': PIXEL.length,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
    });
    res.send(PIXEL);
});

// Click tracking redirect
router.get('/:trackingId/click', async (req, res) => {
    const { url } = req.query;

    // SECURITY: Validate URL to prevent open redirect attacks
    let safeUrl = '/';
    try {
        if (url) {
            const parsed = new URL(url);
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                safeUrl = url;
            }
        }
    } catch { /* invalid URL, redirect to home */ }

    try {
        await recordClick(req.params.trackingId, safeUrl, req.ip, req.headers['user-agent']);
    } catch { /* silent */ }

    res.redirect(safeUrl);
});

// Bounce webhook (requires shared secret)
router.post('/webhook/bounce', async (req, res) => {
    try {
        // SECURITY: Validate webhook secret to prevent unauthenticated access
        const webhookSecret = req.headers['x-webhook-secret'];
        const expectedSecret = process.env.BOUNCE_WEBHOOK_SECRET;
        if (!expectedSecret || !webhookSecret || webhookSecret !== expectedSecret) {
            return res.status(401).json({ ok: false, error: 'Unauthorized' });
        }

        const { trackingId } = req.body;
        if (trackingId) await recordBounce(trackingId);
        res.json({ ok: true });
    } catch {
        res.json({ ok: false });
    }
});

export default router;
