import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

import env from './config/env.js';
import connectDB from './config/db.js';
import { connectRedis } from './config/redis.js';
import { initQueue } from './services/queue.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { startFollowUpScheduler } from './services/followUpScheduler.js';

// Routes
import authRoutes from './routes/auth.js';
import accountRoutes from './routes/accounts.js';
import campaignRoutes from './routes/campaigns.js';
import contactRoutes from './routes/contacts.js';
import emailRoutes from './routes/emails.js';
import finderRoutes from './routes/finder.js';
import aiRoutes from './routes/ai.js';
import analyticsRoutes from './routes/analytics.js';
import trackingRoutes from './routes/tracking.js';
import templateRoutes from './routes/templates.js';
import followupRoutes from './routes/followups.js';
import chatbotRoutes from './routes/chatbot.js';

// Tracking & unsubscribe (public)
import { recordUnsubscribe } from './services/tracking.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(cors({ origin: env.APP_URL, credentials: true }));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', apiLimiter);

// Static files for uploads
app.use('/uploads', express.static(resolve(__dirname, '../uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/finder', finderRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/followups', followupRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Tracking routes (public, no auth)
app.use('/t', trackingRoutes);

// Unsubscribe page (public)
app.get('/unsubscribe/:trackingId', async (req, res) => {
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
            await fetch('/unsubscribe/${req.params.trackingId}', { method: 'POST' });
            document.getElementById('content').innerHTML = '<h2 class="success">✓ Unsubscribed</h2><p>You have been successfully unsubscribed.</p>';
          } catch { document.getElementById('content').innerHTML = '<h2>Error</h2><p>Please try again later.</p>'; }
        }
      </script>
    </body>
    </html>
  `);
});

app.post('/unsubscribe/:trackingId', async (req, res) => {
  try {
    await recordUnsubscribe(req.params.trackingId);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Unsubscribe failed' });
  }
});

// Serve frontend in production
const distPath = resolve(__dirname, '../../client/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(resolve(distPath, 'index.html'));
    }
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const start = async () => {
  await connectDB();
  connectRedis();
  initQueue();
  startFollowUpScheduler();

  app.listen(env.PORT, () => {
    console.log(`\n🚀 AutoMindz server running on port ${env.PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   API: ${env.SERVER_URL}/api`);
    console.log(`   Health: ${env.SERVER_URL}/health\n`);
  });
};

start().catch(console.error);
