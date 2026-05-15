import { getRedis } from '../config/redis.js';
import logger from './logger.js';

/**
 * Express middleware to cache GET requests in Redis
 * @param {number} ttlSeconds - Time to live in seconds
 */
export const cacheMiddleware = (ttlSeconds = 300) => async (req, res, next) => {
    if (req.method !== 'GET') {
        return next();
    }

    const redis = getRedis();
    if (!redis || redis.status !== 'ready') {
        return next();
    }

    const cacheKey = `cache:${req.user ? req.user.id : 'anon'}:${req.originalUrl}`;

    try {
        const cachedData = await redis.get(cacheKey);
        
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        // Intercept res.json to save the response to cache
        const originalJson = res.json.bind(res);
        res.json = (body) => {
            // Only cache successful responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
                redis.setex(cacheKey, ttlSeconds, JSON.stringify(body)).catch(err => {
                    logger.error(`Redis cache set error for ${cacheKey}`, err);
                });
            }
            return originalJson(body);
        };

        next();
    } catch (error) {
        logger.error(`Redis cache get error for ${cacheKey}`, error);
        next();
    }
};

export const clearCache = async (userId, pattern) => {
    const redis = getRedis();
    if (!redis || redis.status !== 'ready') return;

    try {
        const keys = await redis.keys(`cache:${userId}:${pattern}`);
        if (keys.length > 0) {
            await redis.del(keys);
        }
    } catch (error) {
        logger.error(`Redis cache clear error for pattern ${pattern}`, error);
    }
};
