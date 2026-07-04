import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import crypto from 'crypto';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import * as Sentry from '@sentry/node';

import env from './config/env.js';
import connectDB from './config/db.js';
import { connectRedis, getRedis } from './config/redis.js';
import { initQueue } from './services/queue.js';
import { apiLimiter, authLimiter, inboxSyncLimiter, campaignLaunchLimiter, aiLimiter } from './middleware/rateLimit.js';
import auth from './middleware/auth.js';
import { startFollowUpScheduler } from './services/followUpScheduler.js';
import { startCampaignScheduler } from './services/campaignScheduler.js';
import logger from './utils/logger.js';
import errorHandler from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/auth.js';
import accountRoutes from './routes/accounts.js';
import campaignRoutes from './routes/campaigns.js';
import contactRoutes from './routes/contacts.js';
import emailRoutes from './routes/emails.js';
import finderRoutes from './routes/finder.js';
import advancedFinderRoutes from './routes/advancedFinder.js';
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
import { handleRazorpayWebhook } from './services/razorpayWebhook.js';
import { handleResendWebhook } from './services/webhookHandler.js';
import sse from './services/sse.js';

// Tracking & unsubscribe (public)
import { recordUnsubscribe } from './services/tracking.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Sentry is initialized in instrument.js via --import flag (ESM requirement)

// Middleware
app.use(compression()); // gzip/brotli compression for all responses
app.use((req, res, next) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
    next();
});
app.use(cors({ origin: env.APP_URL, credentials: true }));
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // Bug #26 Fix: Explicitly deny camera, microphone, geolocation permissions
            permissionsPolicy: {
                features: {
                    camera: ["'none'"],
                    microphone: ["'none'"],
                    geolocation: ["'none'"],
                    payment: ["'self'", "https://checkout.razorpay.com", "https://api.razorpay.com"],
                },
            },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "https://*.razorpay.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://*.razorpay.com", "https://www.googletagmanager.com", "https://www.google-analytics.com"],
      frameSrc: ["'self'", "https://*.razorpay.com"],
      workerSrc: ["'self'", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "http:", "blob:"],
      connectSrc: ["'self'", "https://o4511246035976192.ingest.us.sentry.io", "https://fonts.googleapis.com", "https://fonts.gstatic.com", "https://*.razorpay.com", "https://www.google-analytics.com", "https://analytics.google.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
// Request Tracing and Logging
app.use((req, res, next) => {
  req.id = uuidv4();
  next();
});

morgan.token('req-id', (req) => req.id);

app.use(morgan(':method :url :status :res[content-length] - :response-time ms [req-id: :req-id]', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

app.post('/api/v1/billing/webhook', express.raw({ type: 'application/json' }), handleRazorpayWebhook);

// Add express-json only after the raw webhook route
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security Hardening
app.use(mongoSanitize());
// Note: xss-clean was removed because it escapes valid HTML payloads (e.g. email bodies)
app.use(hpp());

// Rate limiting
app.use('/api/v1/', apiLimiter);
// Rate limiting for specific routes (MUST be before route registration)
app.use('/api/v1/inbox/sync', inboxSyncLimiter);
app.use('/api/v1/inbox/sync-replies', inboxSyncLimiter);
app.use('/api/v1/ai', aiLimiter);

// -------------------------------------------------------------
// Real-Time Event Stream (Server-Sent Events)
// -------------------------------------------------------------
import { rateLimit } from 'express-rate-limit';
const sseTicketLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 tickets per minute
    message: { error: 'Too many SSE tickets created, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.post('/api/v1/events/ticket', auth, sseTicketLimiter, async (req, res) => {
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

app.get('/api/v1/events', async (req, res) => {
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
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/accounts', accountRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/contacts', contactRoutes);
app.use('/api/v1/emails', emailRoutes);
app.use('/api/v1/finder', finderRoutes);
app.use('/api/v1/advanced-finder', advancedFinderRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/templates', templateRoutes);
app.use('/api/v1/chatbot', chatbotRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use('/api/v1/notes', noteRoutes);
app.use('/api/v1/smart-lists', smartListRoutes);
app.use('/api/v1/links', linkRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/activity', activityRoutes);
app.use('/api/v1/inbox', inboxRoutes);
app.use('/api/v1/seo', seoRoutes);
app.use('/api/v1/sequences', sequenceRoutes);


// BUG FIX #29: Legacy aliases for Google OAuth callbacks
// Because we moved to /api/v1, Google Cloud Console's registered redirect URIs
// (which are still /api/...) will return 404. These aliases ensure the callbacks work.
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);

// Tracking routes (public, no auth)
app.use('/t', trackingRoutes);

// Enhanced health check: reports DB + Redis readiness for load balancer probes
app.get('/health', async (req, res) => {
  const checks = { status: 'ok', timestamp: new Date().toISOString() };
  try {
    // Quick Mongoose connection state: 1 = connected
    const mongoose = (await import('mongoose')).default;
    checks.db = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  } catch { checks.db = 'unknown'; }
  try {
    const { getRedis } = await import('./config/redis.js');
    const redis = getRedis();
    checks.redis = redis ? (redis.status === 'ready' ? 'connected' : redis.status) : 'disabled';
  } catch { checks.redis = 'unknown'; }

  const isHealthy = checks.db === 'connected';
  res.status(isHealthy ? 200 : 503).json(checks);
});

// Sentry error handler should be established before other error handlers
Sentry.setupExpressErrorHandler(app);

// Global Error Handler
app.use(errorHandler);

// Serve frontend in production
const distPath = resolve(__dirname, '../../client/dist');
if (fs.existsSync(distPath)) {
  // Immutable cache for hashed assets (JS/CSS/images) — 1 year
  app.use('/assets', express.static(resolve(distPath, 'assets'), {
    maxAge: '1y',
    immutable: true,
  }));
  // Short cache for other static files (favicon, etc.)
  app.use(express.static(distPath, {
    maxAge: '1h',
    etag: true,
  }));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      // no-cache for index.html so users always get the latest version
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(resolve(distPath, 'index.html'));
    }
  });
}

const start = async () => {
  // HARDENING: Capture unhandled rejections in Sentry and prevent silent failures
  process.on('unhandledRejection', (reason) => {
    console.error('[UnhandledRejection]', reason);
    if (Sentry.captureException) Sentry.captureException(reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('[UncaughtException]', err);
    if (Sentry.captureException) Sentry.captureException(err);
    process.exit(1);
  });

  await connectDB();
  const redisConn = connectRedis();
  
  // Wait for Redis to be connected before initializing the queue
  if (redisConn) {
    await new Promise((resolve) => {
      if (redisConn.status === 'ready') { resolve(); return; }
      redisConn.once('ready', resolve);
      setTimeout(() => {
        console.warn('⚠ Redis connection timed out — proceeding with in-memory fallback');
        resolve();
      }, 10000);
    });
  }
  
  initQueue();
  startFollowUpScheduler();
  startCampaignScheduler();

  const server = app.listen(env.PORT, () => {
    console.log(`\n🚀 AutoMindz server running on port ${env.PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   API: ${env.SERVER_URL}/api/v1`);
    console.log(`   Health: ${env.SERVER_URL}/health\n`);
  });

  // HARDENING: Graceful shutdown — closes active connections before exiting.
  // Critical for Docker/Kubernetes to drain in-flight requests cleanly.
  const gracefulShutdown = (signal) => {
    console.log(`\n[${signal}] Graceful shutdown initiated...`);
    server.close(() => {
      console.log('✓ HTTP server closed');
      import('mongoose').then(({ default: mongoose }) => {
        mongoose.connection.close(false, () => {
          console.log('✓ MongoDB connection closed');
          process.exit(0);
        });
      }).catch(() => process.exit(0));
    });
    // Force exit after 15s if connections don't close
    setTimeout(() => {
      console.error('⚠ Forced shutdown after timeout');
      process.exit(1);
    }, 15_000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
};

start().catch(console.error);
