import config from '../config/index.js';

const logger = {
    info: (message, meta = {}) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] INFO: ${message}`, Object.keys(meta).length ? meta : '');
    },
    error: (message, error = null, meta = {}) => {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] ERROR: ${message}`);
        if (error) {
            console.error(error.stack || error);
        }
        if (Object.keys(meta).length) {
            console.error('Context:', meta);
        }
    },
    warn: (message, meta = {}) => {
        const timestamp = new Date().toISOString();
        console.warn(`[${timestamp}] WARN: ${message}`, Object.keys(meta).length ? meta : '');
    },
    debug: (message, meta = {}) => {
        if (!config.app.isProduction) {
            const timestamp = new Date().toISOString();
            console.debug(`[${timestamp}] DEBUG: ${message}`, Object.keys(meta).length ? meta : '');
        }
    }
};

export default logger;
