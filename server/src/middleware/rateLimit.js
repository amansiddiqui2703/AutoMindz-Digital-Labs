import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedis } from '../config/redis.js';

// Factory for store to avoid throwing if redis is missing
const createStore = () => {
    return new RedisStore({
        sendCommand: (...args) => {
            const redis = getRedis();
            if (redis) return redis.call(...args);
            // Fallback to avoid crashing the request if Redis is down
            return Promise.reject(new Error('Redis not available'));
        },
    });
};

/**
 * HARDENING: Granular rate limiters per endpoint category.
 * Previously a single 200req/15min limiter covered all API routes,
 * making it trivial to spam auth and inbox-sync endpoints.
 */

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    store: createStore(),
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many auth attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore(),
});

export const inboxSyncLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    message: { error: 'Inbox sync rate limit exceeded. Please wait before syncing again.' },
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore(),
});

export const campaignLaunchLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: { error: 'Too many campaign launches. Please wait before launching again.' },
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore(),
});

export const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 15,
    message: { error: 'AI rate limit reached. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore(),
});
