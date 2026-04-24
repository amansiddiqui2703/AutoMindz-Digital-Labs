import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../../.env') });

const normalizeBaseUrl = (value, fallback) => {
    const url = (value || fallback || '').trim();
    return url.endsWith('/') ? url.slice(0, -1) : url;
};

const env = {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/automindz',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    APP_URL: normalizeBaseUrl(process.env.APP_URL, 'http://localhost:5173'),
    SERVER_URL: normalizeBaseUrl(process.env.SERVER_URL, 'http://localhost:5000'),
    // Stripe
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
    STRIPE_PRICE_STARTER: process.env.STRIPE_PRICE_STARTER || '',
    STRIPE_PRICE_GROWTH: process.env.STRIPE_PRICE_GROWTH || '',
    STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO || '',
    // Google OAuth2
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || '',
    // Admin
    ADMIN_EMAILS: process.env.ADMIN_EMAILS || '',
    // Sentry
    SENTRY_DSN: process.env.SENTRY_DSN || '',
};

// Validation schema for required variables
const REQUIRED_ENV_VARS = [
    'MONGODB_URI',
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'APP_URL',
    'SERVER_URL'
];

// Additional requirements for production
const PRODUCTION_REQUIRED = [
    'RESEND_API_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET'
];

const validateEnv = () => {
    const missing = [];
    
    REQUIRED_ENV_VARS.forEach(key => {
        if (!process.env[key]) missing.push(key);
    });

    if (env.NODE_ENV === 'production') {
        PRODUCTION_REQUIRED.forEach(key => {
            if (!process.env[key]) missing.push(key);
        });

        if (env.JWT_SECRET === 'dev-secret-change-me') {
            console.error('⛔ FATAL: JWT_SECRET using insecure default in production!');
            process.exit(1);
        }
    }

    if (missing.length > 0) {
        console.error('⛔ FATAL: Missing required environment variables:');
        missing.forEach(key => console.error(`  - ${key}`));
        process.exit(1);
    }
};

// Only validate if not running in a script context that doesn't need full env
if (process.env.NODE_ENV !== 'test') {
    validateEnv();
}

export default env;
