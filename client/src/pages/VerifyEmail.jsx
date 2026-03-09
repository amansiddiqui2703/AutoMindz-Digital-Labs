import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { CheckCircle2, XCircle, Loader2, Zap } from 'lucide-react';

export default function VerifyEmail() {
    const { token } = useParams();
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) return;

        api.post(`/auth/verify/${token}`)
            .then(res => {
                setStatus('success');
                setMessage(res.data.message);
            })
            .catch(err => {
                setStatus('error');
                setMessage(err.response?.data?.error || 'Verification failed');
            });
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4">
            <div className="w-full max-w-md animate-in">
                <div className="flex items-center gap-3 mb-8 justify-center">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">AutoMindz</h1>
                </div>

                <div className="glass-card p-8 text-center">
                    {status === 'loading' && (
                        <div className="flex flex-col items-center">
                            <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
                            <h2 className="text-xl font-bold text-surface-900 dark:text-white">Verifying Email...</h2>
                            <p className="text-surface-500 mt-2">Please wait while we verify your email address.</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center">
                            <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
                            <h2 className="text-xl font-bold text-surface-900 dark:text-white">Email Verified!</h2>
                            <p className="text-surface-500 mt-2">{message}</p>
                            <Link to="/login" className="btn-primary mt-6 w-full justify-center">Continue to Login</Link>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center">
                            <XCircle className="w-12 h-12 text-red-500 mb-4" />
                            <h2 className="text-xl font-bold text-surface-900 dark:text-white">Verification Failed</h2>
                            <p className="text-surface-500 mt-2">{message}</p>
                            <Link to="/login" className="btn-secondary mt-6 w-full justify-center">Back to Login</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
