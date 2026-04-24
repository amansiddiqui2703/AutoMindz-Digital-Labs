import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Zap, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        try {
            const res = await api.post('/auth/forgot-password', { email });
            setStatus('success');
            const msg = res.data?.resetUrl ? `${res.data.message} (Dev link: ${res.data.resetUrl})` : res.data.message;
            setMessage(msg);
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.error || 'Request failed');
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
                    <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-1">Reset Password</h2>
                    <p className="text-surface-500 mb-6">Enter your email and we'll send a link.</p>

                    {status === 'error' && (
                        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {message}
                        </div>
                    )}

                    {status === 'success' ? (
                        <div className="text-center">
                            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                            <p className="text-surface-700 dark:text-surface-300 font-medium">{message}</p>
                            <Link to="/login" className="btn-secondary mt-6 w-full justify-center">Return to Login</Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com"
                                        className="input pl-10" required />
                                </div>
                            </div>

                            <button type="submit" disabled={status === 'loading'} className="btn-primary w-full justify-center">
                                {status === 'loading' ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Send Reset Link'}
                            </button>
                        </form>
                    )}

                    {status !== 'success' && (
                        <p className="text-center text-sm text-surface-500 mt-6">
                            Remember your password? <Link to="/login" className="text-primary-500 font-semibold hover:underline">Sign in</Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
