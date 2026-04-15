import Redis from 'ioredis';
import env from './env.js';

let redis = null;

const connectRedis = () => {
    try {
        const redisOpts = {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            retryStrategy(times) {
                if (times > 3) {
                    console.warn('⚠ Redis unavailable — queue features disabled');
                    return null;
                }
                return Math.min(times * 200, 2000);
            },
        };

        // Upstash uses rediss:// (TLS) — ioredis needs explicit tls option
        if (env.REDIS_URL.startsWith('rediss://')) {
            redisOpts.tls = { rejectUnauthorized: false };
        }

        redis = new Redis(env.REDIS_URL, redisOpts);

        redis.on('connect', () => console.log('✓ Redis connected'));
        redis.on('error', (err) => console.warn('⚠ Redis error:', err.message));

        return redis;
    } catch (error) {
        console.warn('⚠ Redis connection failed:', error.message);
        return null;
    }
};

export { redis, connectRedis };
