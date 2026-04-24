import env from './env.js';

const config = {
    app: {
        name: 'AutoMindz',
        url: env.APP_URL || 'http://localhost:5173',
        serverUrl: env.SERVER_URL || 'http://localhost:5000',
        env: env.NODE_ENV || 'development',
        isProduction: env.NODE_ENV === 'production',
        port: env.PORT || 5000,
    },
    db: {
        uri: env.MONGODB_URI,
    },
    redis: {
        url: env.REDIS_URL,
    },
    auth: {
        jwtSecret: env.JWT_SECRET,
        jwtExpiresIn: env.JWT_EXPIRES_IN || '7d',
        encryptionKey: env.ENCRYPTION_KEY,
    },
    email: {
        resendApiKey: env.RESEND_API_KEY,
        fromSupport: env.EMAIL_FROM_SUPPORT || '"AutoMindz Support" <support@automindz.com>',
        fromOnboarding: env.EMAIL_FROM_ONBOARDING || '"AutoMindz Team" <onboarding@automindz.com>',
    },
    stripe: {
        secretKey: env.STRIPE_SECRET_KEY,
        webhookSecret: env.STRIPE_WEBHOOK_SECRET,
        prices: {
            starter: env.STRIPE_PRICE_STARTER,
            growth: env.STRIPE_PRICE_GROWTH,
            pro: env.STRIPE_PRICE_PRO,
        },
    },
    google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        redirectUri: env.GOOGLE_REDIRECT_URI,
    },
    tracking: {
        pixel: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    },
    sentry: {
        dsn: env.SENTRY_DSN,
    }
};

export default config;
