import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap } from 'lucide-react';
import api from '../api/client';

/**
 * This page handles the redirect from Google OAuth.
 * It receives either a JWT token or a one-time code from the URL,
 * stores the token, and redirects to dashboard.
 */
export default function GoogleAuthSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setTokenAndUser } = useAuth();
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = searchParams.get('token');
        const code = searchParams.get('code');

        const handle = async () => {
            try {
                let jwt = token;

                if (!jwt && code) {
                    // Exchange short-lived server code for JWT
                    const res = await api.get(`/auth/google/token?code=${code}`);
                    jwt = res.data.token;
                }

                if (jwt) {
                    await setTokenAndUser(jwt);
                    navigate('/dashboard', { replace: true });
                    return;
                }

                setError('No token received from Google. Please try again.');
            } catch (err) {
                console.error('Google auth flow failed:', err);
                setError('Google sign-in failed. The link may have expired. Please try again.');
            }
        };

        handle();
    }, []); // Run only once on mount

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <Zap className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">Sign-in Failed</h2>
                    <p className="text-surface-500 mb-4">{error}</p>
                    <button 
                        onClick={() => navigate('/login', { replace: true })}
                        className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
            <div className="text-center animate-in">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">Signing you in...</h2>
                <div className="w-8 h-8 mx-auto border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        </div>
    );
}
