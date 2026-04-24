import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

import env from './config/env.js';
import connectDB from './config/db.js';
import { connectRedis, getRedis } from './config/redis.js';
import { initQueue } from './services/queue.js';
import { apiLimiter, authLimiter } from './middleware/rateLimit.js';
import auth from './middleware/auth.js';
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

import noteRoutes from './routes/notes.js';
import smartListRoutes from './routes/smartLists.js';
import linkRoutes from './routes/links.js';
import teamRoutes from './routes/teams.js';
import taskRoutes from './routes/tasks.js';
import activityRoutes from './routes/activity.js';
import inboxRoutes from './routes/inbox.js';
import seoRoutes from './routes/seo.js';
import sequenceRoutes from './routes/sequences.js';
import { handleStripeWebhook } from './services/stripeWebhook.js';
import { handleResendWebhook } from './services/webhookHandler.js';
import sse from './services/sse.js';

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

// Resend webhook needs raw body for signature verification
app.post('/api/webhooks/resend', express.raw({ type: 'application/json' }), handleResendWebhook);

// Middleware
app.use((req, res, next) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
    next();
});
app.use(cors({ origin: env.APP_URL, credentials: true }));
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
      workerSrc: ["'self'", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://o4511246035976192.ingest.us.sentry.io", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
    },
  },
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', apiLimiter);

// -------------------------------------------------------------
// Real-Time Event Stream (Server-Sent Events)
// -------------------------------------------------------------
app.post('/api/events/ticket', auth, async (req, res) => {
    try {
        const ticket = crypto.randomBytes(32).toString('hex');
        const redis = getRedis();
        if (!redis) return res.status(503).json({ error: 'Redis is not available for SSE ticket.' });
        await redis.set(`sse_ticket:${ticket}`, req.user.id, 'EX', 30);
        res.json({ ticket });
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate SSE ticket' });
    }
});

app.get('/api/events', async (req, res) => {
    const ticket = req.query.ticket;
    if (!ticket) return res.status(401).json({ error: 'Auth ticket missing' });

    try {
        const redis = getRedis();
        if (!redis) return res.status(503).json({ error: 'Redis is not available.' });
        
        const userId = await redis.get(`sse_ticket:${ticket}`);
        if (!userId) return res.status(401).json({ error: 'Invalid or expired ticket' });
        
        // Delete ticket so it is one-time use
        await redis.del(`sse_ticket:${ticket}`);

        // Establish SSE Connection Context
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        // Tell nginx to stop buffering immediately if there's a proxy between us
        res.setHeader('X-Accel-Buffering', 'no');
        
        // Push initial connect handshake
        res.write('data: {"connected": true}\n\n');

        // Hand over to the manager which controls memory leakage automatically handling closing
        sse.addClient(userId, res);

    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

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

app.use('/api/notes', noteRoutes);
app.use('/api/smart-lists', smartListRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/inbox', inboxRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/sequences', sequenceRoutes);

// Tracking routes (public, no auth)
app.use('/t', trackingRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Sentry error handler should be established before other error handlers
Sentry.setupExpressErrorHandler(app);

// Global Error Handler
import errorHandler from './middleware/errorHandler.js';
app.use(errorHandler);

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

// Start server
const start = async () => {
  process.on('unhandledRejection', (reason) => { console.error('Unhandled Rejection:', reason); });
  process.on('uncaughtException', (err) => { console.error('Uncaught Exception:', err); process.exit(1); });

  await connectDB();
  const redisConn = connectRedis();
  
  // Wait for Redis to be connected before initializing the queue
  if (redisConn) {
    await new Promise((resolve) => {
      // If already connected, resolve immediately
      if (redisConn.status === 'ready') {
        resolve();
        return;
      }
      redisConn.once('ready', resolve);
      // Don't block startup forever if Redis fails
      setTimeout(() => {
        console.warn('⚠ Redis connection timed out — proceeding with in-memory fallback');
        resolve();
      }, 10000);
    });
  }
  
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
