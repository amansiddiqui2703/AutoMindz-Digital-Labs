import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Zap, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        try {
            const res = await api.post(`/auth/reset-password/${token}`, { password });
            setStatus('success');
            setMessage(res.data.message);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.error || 'Failed to reset password');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4">
            <div className="w-full max-w-md animate-in">
                <div className="flex items-center gap-3 mb-8 justify-center">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">AutoMindz</h1>
                </div>

                <div className="glass-card p-8">
                    <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-1">Create New Password</h2>
                    <p className="text-surface-500 mb-6">Enter your new secure password.</p>

                    {status === 'error' && (
                        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {message}
                        </div>
                    )}

                    {status === 'success' ? (
                        <div className="text-center">
                            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                            <p className="text-surface-700 dark:text-surface-300 font-medium mb-2">{message}</p>
                            <p className="text-surface-500 text-sm mb-6">Redirecting to login...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters"
                                        className="input pl-10" required minLength={6} />
                                </div>
                            </div>

                            <button type="submit" disabled={status === 'loading'} className="btn-primary w-full justify-center">
                                {status === 'loading' ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save New Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
