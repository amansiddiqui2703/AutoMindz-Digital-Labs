import Redis from 'ioredis';
import env from './env.js';

let redis = null;

/**
 * Get the current Redis instance.
 *
 * Returns null unless Redis is connected and ready to accept commands.
 */
export const getRedis = () => {
    if (!redis) return null;
    if (redis.status !== 'ready') return null;
    return redis;
};

const connectRedis = () => {
    if (!env.REDIS_URL) {
        console.warn('⚠ REDIS_URL not set — Redis features will be disabled');
        return null;
    }

    try {
        const redisOpts = {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            retryStrategy(times) {
                // If we've failed more than 5 times, stop trying so rapidly
                const delay = Math.min(times * 1000, 15000);
                if (times % 10 === 0) {
                    console.warn(`⚠ Redis still unavailable after ${times} attempts. Retrying in ${delay}ms...`);
                }
                return delay;
            },
            reconnectOnError(err) {
                const targetError = 'READONLY';
                if (err.message.includes(targetError)) {
                    return true;
                }
                return false;
            },
        };

        if (env.REDIS_URL.startsWith('rediss://')) {
            redisOpts.tls = { rejectUnauthorized: false };
        }

        redis = new Redis(env.REDIS_URL, redisOpts);

        redis.on('connect', () => console.log('✓ Redis connecting...'));
        redis.on('ready', () => console.log('✓ Redis ready'));
        redis.on('error', (err) => {
            if (err.code === 'ECONNREFUSED') {
                // Silently handle connection refusal to avoid log spam, 
                // but keep the status check working via getRedis()
            } else {
                console.warn('⚠ Redis error:', err.message);
            }
        });

        return redis;
    } catch (error) {
        console.warn('⚠ Redis connection initialization failed:', error.message);
        return null;
    }
};

export { redis, connectRedis };
