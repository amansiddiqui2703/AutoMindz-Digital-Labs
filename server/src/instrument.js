/*
 * Sentry Instrumentation — loaded via `node --import ./src/instrument.js`
 * Must run BEFORE any other imports so Sentry can monkey-patch Express, HTTP, etc.
 * See: https://docs.sentry.io/platforms/javascript/guides/express/install/esm/
 */
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
    dsn: process.env.SENTRY_DSN || "",
    integrations: [
        nodeProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Profiling sample rate is relative to tracesSampleRate
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});
