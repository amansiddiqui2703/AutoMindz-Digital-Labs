import { Component } from 'react';

/**
 * BUG FIX #35: Error Boundary component to prevent full app crash
 * when individual page components throw unhandled errors.
 * Wraps lazy-loaded routes in App.jsx to isolate crashes per page.
 */
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        // Log to Sentry if available
        if (window.__sentry_initialized) {
            try {
                import('@sentry/react').then(Sentry => {
                    Sentry.captureException(error, { extra: errorInfo });
                });
            } catch { /* non-critical */ }
        }
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4">
                    <div className="max-w-md w-full text-center">
                        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-surface-900 dark:text-white mb-2">Something went wrong</h1>
                        <p className="text-surface-500 text-sm mb-6">
                            This page ran into an unexpected error. Our team has been notified.
                        </p>
                        {this.state.error && (
                            <details className="text-left mb-6 bg-surface-100 dark:bg-surface-800 rounded-lg p-4">
                                <summary className="text-xs font-mono text-surface-600 dark:text-surface-400 cursor-pointer">
                                    Error details
                                </summary>
                                <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-auto whitespace-pre-wrap">
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.href = '/dashboard'}
                                className="px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-700 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
