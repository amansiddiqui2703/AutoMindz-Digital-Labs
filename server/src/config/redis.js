import Redis from 'ioredis';
import env from './env.js';

let redis = null;
let isQuotaExceeded = false;

/**
 * Check if Redis has exceeded quota limit (e.g., Upstash 500,000 command limit)
 */
export const isRedisQuotaExceeded = () => isQuotaExceeded;

/**
 * Get the current Redis instance.
 * Returns null unless Redis is connected, ready, and quota has NOT been exceeded.
 */
export const getRedis = () => {
    if (isQuotaExceeded) return null;
    if (!redis) return null;
    if (redis.status !== 'ready') return null;
    return redis;
};

const isQuotaError = (msg) => {
    if (!msg) return false;
    const lower = msg.toLowerCase();
    return (
        lower.includes('max requests limit exceeded') ||
        lower.includes('max_requests_limit') ||
        lower.includes('daily_max_requests_limit') ||
        lower.includes('limit: 500000') ||
        lower.includes('oom command not allowed')
    );
};

const handleQuotaExceeded = (errorMsg) => {
    if (isQuotaExceeded) return;
    isQuotaExceeded = true;
    console.warn('\n===============================================================');
    console.warn('⚠️  UPSTASH REDIS LIMIT EXCEEDED DETECTED');
    console.warn(`    Reason: ${errorMsg}`);
    console.warn('    ⚡ Circuit Breaker Activated: AutoMindz has automatically');
    console.warn('    switched to High-Performance In-Memory mode.');
    console.warn('    All campaigns, queues, and API routes will continue running');
    console.warn('    with 100% uptime without crashing.');
    console.warn('===============================================================\n');

    if (redis) {
        try {
            redis.disconnect(false);
        } catch {
            /* ignore */
        }
    }
};

const connectRedis = () => {
    if (env.USE_IN_MEMORY_QUEUE || process.env.NODE_ENV === 'test') {
        console.log('⚡ In-memory mode active — Redis disabled by configuration/test mode');
        isQuotaExceeded = true;
        return null;
    }

    if (!env.REDIS_URL) {
        console.warn('⚠ REDIS_URL not set — running in pure in-memory mode');
        return null;
    }

    try {
        const redisOpts = {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            retryStrategy(times) {
                // If quota is exceeded, in test mode, or exceeded 3 attempts, abort retrying immediately
                if (isQuotaExceeded || process.env.NODE_ENV === 'test' || times > 3) {
                    return null;
                }
                const delay = Math.min(times * 1000, 5000);
                return delay;
            },
            reconnectOnError(err) {
                if (isQuotaError(err.message)) {
                    handleQuotaExceeded(err.message);
                    return false; // Do NOT reconnect!
                }
                const targetError = 'READONLY';
                if (err.message && err.message.includes(targetError)) {
                    return true;
                }
                return false;
            },
        };

        if (env.REDIS_URL.startsWith('rediss://')) {
            redisOpts.tls = { rejectUnauthorized: false };
        }

        redis = new Redis(env.REDIS_URL, redisOpts);

        redis.on('connect', () => {
            if (!isQuotaExceeded) console.log('✓ Redis connecting...');
        });

        redis.on('ready', () => {
            if (!isQuotaExceeded) console.log('✓ Redis ready');
        });

        redis.on('error', (err) => {
            if (isQuotaError(err.message)) {
                handleQuotaExceeded(err.message);
                return;
            }
            if (err.code === 'ECONNREFUSED') {
                // Silently handle to avoid console spam
            } else {
                console.warn('⚠ Redis error:', err.message);
            }
        });

        return redis;
    } catch (error) {
        if (isQuotaError(error.message)) {
            handleQuotaExceeded(error.message);
        } else {
            console.warn('⚠ Redis connection initialization failed:', error.message);
        }
        return null;
    }
};

export { redis, connectRedis, handleQuotaExceeded, isQuotaError };
