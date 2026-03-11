import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

import env from './config/env.js';
import connectDB from './config/db.js';
import { connectRedis } from './config/redis.js';
import { initQueue } from './services/queue.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { startFollowUpScheduler } from './services/followUpScheduler.js';
import { startCampaignScheduler } from './services/campaignScheduler.js';

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
import chatbotRoutes from './routes/chatbot.js';
import billingRoutes from './routes/billing.js';
import adminRoutes from './routes/admin.js';
import projectRoutes from './routes/projects.js';
import noteRoutes from './routes/notes.js';
import smartListRoutes from './routes/smartLists.js';
import linkRoutes from './routes/links.js';
import teamRoutes from './routes/teams.js';
import taskRoutes from './routes/tasks.js';
import activityRoutes from './routes/activity.js';
import inboxRoutes from './routes/inbox.js';
import seoRoutes from './routes/seo.js';
import { handleStripeWebhook } from './services/stripeWebhook.js';

// Tracking & unsubscribe (public)
import { recordUnsubscribe } from './services/tracking.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

// Stripe webhook needs raw body — must come BEFORE express.json()
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Middleware
app.use(cors({ origin: env.APP_URL, credentials: true }));
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],   // inline script on unsubscribe page
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
}));
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
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/smart-lists', smartListRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/inbox', inboxRoutes);
app.use('/api/seo', seoRoutes);

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

// Sentry error handler should be established before other error handlers
Sentry.setupExpressErrorHandler(app);

// Start server
const start = async () => {
  await connectDB();
  connectRedis();
  initQueue();
  startFollowUpScheduler();
  startCampaignScheduler();

  app.listen(env.PORT, () => {
    console.log(`\n🚀 AutoMindz server running on port ${env.PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   API: ${env.SERVER_URL}/api`);
    console.log(`   Health: ${env.SERVER_URL}/health\n`);
  });
};

start().catch(console.error);
