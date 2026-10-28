import rateLimit, { MemoryStore } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedis, isRedisQuotaExceeded, handleQuotaExceeded, isQuotaError } from '../config/redis.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';

/**
 * Resilient Rate Limiting Store
 * 
 * Deployment & Architecture Notes:
 * - Single-Process Container (Render): MemoryStore operates in local Node.js process memory.
 * - In-memory limits are tracked per process and reset upon container restart.
 * - When Redis rate-limiting is explicitly enabled (USE_REDIS_RATE_LIMIT=true) and healthy,
 *   RedisStore is used across instances.
 * - If Redis is unavailable, disconnected, disabled, or Upstash quota is exceeded, the store
 *   seamlessly falls back to MemoryStore, ensuring authentication and sensitive endpoints
 *   remain strictly protected without silently disabling rate limits.
 */
export class ResilientStore {
    constructor(prefix = 'rl:') {
        this.prefix = prefix;
        this.memoryStore = new MemoryStore();
        this.redisStore = null;
        this.initOptions = null;
    }

    init(options) {
        this.initOptions = options;
        this.memoryStore.init(options);
        this._setupRedisStore();
    }

    _setupRedisStore() {
        if (!env.USE_REDIS_RATE_LIMIT) return;
        if (isRedisQuotaExceeded()) return;

        try {
            this.redisStore = new RedisStore({
                prefix: this.prefix,
                sendCommand: async (...args) => {
                    if (isRedisQuotaExceeded()) return null;
                    const redis = getRedis();
                    if (!redis) return null;
                    return await redis.call(...args);
                },
            });
            if (this.initOptions) {
                this.redisStore.init(this.initOptions);
            }
        } catch (err) {
            this.redisStore = null;
            if (isQuotaError(err?.message)) {
                handleQuotaExceeded(err.message);
            }
        }
    }

    _shouldUseRedis() {
        if (!env.USE_REDIS_RATE_LIMIT) return false;
        if (isRedisQuotaExceeded()) return false;
        const redis = getRedis();
        if (!redis) return false;
        if (!this.redisStore) {
            this._setupRedisStore();
        }
        return !!this.redisStore;
    }

    async increment(key) {
        if (this._shouldUseRedis()) {
            try {
                return await this.redisStore.increment(key);
            } catch (err) {
                if (isQuotaError(err?.message)) {
                    handleQuotaExceeded(err.message);
                }
                logger.warn(`Redis rate limit error for key "${key}", falling back to MemoryStore: ${err.message}`);
                return await this.memoryStore.increment(key);
            }
        }
        return await this.memoryStore.increment(key);
    }

    async decrement(key) {
        if (this._shouldUseRedis()) {
            try {
                return await this.redisStore.decrement(key);
            } catch (err) {
                if (isQuotaError(err?.message)) {
                    handleQuotaExceeded(err.message);
                }
                return await this.memoryStore.decrement(key);
            }
        }
        return await this.memoryStore.decrement(key);
    }

    async resetKey(key) {
        if (this._shouldUseRedis()) {
            try {
                await this.redisStore.resetKey(key);
            } catch (err) {
                if (isQuotaError(err?.message)) {
                    handleQuotaExceeded(err.message);
                }
            }
        }
        return await this.memoryStore.resetKey(key);
    }

    async get(key) {
        if (this._shouldUseRedis()) {
            try {
                return await this.redisStore.get(key);
            } catch (err) {
                if (isQuotaError(err?.message)) {
                    handleQuotaExceeded(err.message);
                }
                return await this.memoryStore.get(key);
            }
        }
        return await this.memoryStore.get(key);
    }
}

export const createResilientStore = (prefix) => new ResilientStore(prefix);

/**
 * Granular rate limiters per endpoint category.
 * PassOnStoreError: false ensure limits are enforced via memory store rather than bypassed.
 */

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    store: createResilientStore('rl:api:'),
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many auth attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    store: createResilientStore('rl:auth:'),
});

export const inboxSyncLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    message: { error: 'Inbox sync rate limit exceeded. Please wait before syncing again.' },
    standardHeaders: true,
    legacyHeaders: false,
    store: createResilientStore('rl:inbox:'),
});

export const campaignLaunchLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: { error: 'Too many campaign launches. Please wait before launching again.' },
    standardHeaders: true,
    legacyHeaders: false,
    store: createResilientStore('rl:campaign:'),
});

export const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 15,
    message: { error: 'AI rate limit reached. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
    store: createResilientStore('rl:ai:'),
});
