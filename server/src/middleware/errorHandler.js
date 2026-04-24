import * as Sentry from "@sentry/node";

/**
 * Global Error Handling Middleware
 * Catch-all for Express errors to ensure consistent JSON responses.
 */
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    // Log the error
    console.error(`[Error] ${req.method} ${req.url}:`, {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });

    // Report to Sentry if in production and not a client error (4xx)
    if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
        Sentry.captureException(err);
    }

    res.status(statusCode).json({
        error: message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};

export default errorHandler;
