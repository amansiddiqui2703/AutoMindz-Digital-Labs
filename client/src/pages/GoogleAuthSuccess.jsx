import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap } from 'lucide-react';

/**
 * This page handles the redirect from Google OAuth.
 * It receives the JWT token from the URL, stores it, and redirects to dashboard.
 */
export default function GoogleAuthSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setTokenAndUser } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            setTokenAndUser(token);
            navigate('/dashboard', { replace: true });
        } else {
            navigate('/login?error=google_auth_failed', { replace: true });
        }
    }, []);

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
