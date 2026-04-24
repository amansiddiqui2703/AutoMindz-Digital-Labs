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

// Unsubscribe page (public)
router.get('/unsubscribe/:trackingId', async (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Unsubscribe</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f9fafb; }
        .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
        .btn { background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; cursor: pointer; margin-top: 16px; }
        .btn:hover { background: #2563eb; }
        .success { color: #059669; }
      </style>
      </head>
      <body>
        <div class="card" id="content">
          <h2>Unsubscribe</h2>
          <p>Click below to unsubscribe from future emails.</p>
          <button class="btn" onclick="doUnsubscribe()">Unsubscribe</button>
        </div>
        <script>
          async function doUnsubscribe() {
            try {
              await fetch('/t/unsubscribe/${req.params.trackingId}', { method: 'POST' });
              document.getElementById('content').innerHTML = '<h2 class="success">✓ Unsubscribed</h2><p>You have been successfully unsubscribed.</p>';
            } catch { document.getElementById('content').innerHTML = '<h2>Error</h2><p>Please try again later.</p>'; }
          }
        </script>
      </body>
      </html>
    `);
});

router.post('/unsubscribe/:trackingId', async (req, res) => {
    try {
        await recordUnsubscribe(req.params.trackingId);
        res.json({ ok: true });
    } catch {
        res.status(500).json({ ok: false });
    }
});

export default router;
