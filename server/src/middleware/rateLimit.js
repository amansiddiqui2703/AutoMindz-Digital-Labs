import rateLimit from 'express-rate-limit';

/**
 * HARDENING: Granular rate limiters per endpoint category.
 * Previously a single 200req/15min limiter covered all API routes,
 * making it trivial to spam auth and inbox-sync endpoints.
 */

// General API: 200 requests per 15 minutes per IP
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests to not penalize normal usage
    skipSuccessfulRequests: false,
});

// Auth endpoints (login, register, forgot-password): strict
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many auth attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Inbox sync: limit to prevent Gmail API quota abuse
// Users should not hammer sync more than 10 times per 5 minutes
export const inboxSyncLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    message: { error: 'Inbox sync rate limit exceeded. Please wait before syncing again.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Campaign launch: prevent duplicate launches (max 5 per 10 min)
export const campaignLaunchLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: { error: 'Too many campaign launches. Please wait before launching again.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// AI endpoints: prevent quota exhaustion
export const aiLimiter = rateLimit({
    windowMs: 60 * 1000,       // 1 minute window
    max: 15,
    message: { error: 'AI rate limit reached. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});
