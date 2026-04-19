import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../../.env') });

const env = {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/automindz',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    APP_URL: process.env.APP_URL || 'http://localhost:5173',
    SERVER_URL: process.env.SERVER_URL || 'http://localhost:5000',
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

// BUG-20: Enforce required secrets in production
if (env.NODE_ENV === 'production') {
    if (!env.JWT_SECRET || env.JWT_SECRET === 'dev-secret-change-me') {
        console.error('⛔ CRITICAL: JWT_SECRET must be set to a secure value in production!');
        console.error('   Set it in your Render/hosting environment variables.');
    }
    if (!env.ENCRYPTION_KEY) {
        console.error('⛔ CRITICAL: ENCRYPTION_KEY must be set in production!');
        console.error('   Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    }
}

export default env;
