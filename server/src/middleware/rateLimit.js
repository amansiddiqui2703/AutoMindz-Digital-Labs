import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedis, isRedisQuotaExceeded } from '../config/redis.js';

// Safe store: executes Redis commands if available, but catches any quota/network errors so requests NEVER crash!
const createStore = () => {
    return new RedisStore({
        sendCommand: async (...args) => {
            try {
                if (isRedisQuotaExceeded()) return null;
                const redis = getRedis();
                if (redis) {
                    return await redis.call(...args);
                }
            } catch {
                // Catch any Upstash quota exceeded or network disconnect error
                return null;
            }
            return null;
        },
    });
};

/**
 * Granular rate limiters per endpoint category.
 * passOnStoreError: true ensures that even if Redis fails, legitimate requests are never blocked.
 */

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    passOnStoreError: true,
    store: createStore(),
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many auth attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    store: createStore(),
});

export const inboxSyncLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    message: { error: 'Inbox sync rate limit exceeded. Please wait before syncing again.' },
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    store: createStore(),
});

export const campaignLaunchLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: { error: 'Too many campaign launches. Please wait before launching again.' },
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    store: createStore(),
});

export const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 15,
    message: { error: 'AI rate limit reached. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    store: createStore(),
});
