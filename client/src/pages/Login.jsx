import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Mail, Lock, AlertCircle } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-surface-50 dark:bg-surface-950">
            {/* Left decorative panel */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 relative overflow-hidden flex-col justify-center px-16">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
                    <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-accent-400/20 blur-3xl" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white">AutoMindz</h1>
                    </div>
                    <h2 className="text-4xl font-bold text-white leading-tight mb-4">
                        Smart Email Outreach<br />Made Simple
                    </h2>
                    <p className="text-primary-100 text-lg max-w-md">
                        AI-powered email campaigns with built-in contact finder, tracking, and multi-account support.
                    </p>
                    <div className="mt-12 grid grid-cols-3 gap-6">
                        {[{ n: '10x', l: 'Faster Outreach' }, { n: '99%', l: 'Delivery Rate' }, { n: 'AI', l: 'Powered' }].map((s, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                                <div className="text-2xl font-bold text-white">{s.n}</div>
                                <div className="text-primary-200 text-xs mt-1">{s.l}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right login form */}
            <div className="flex-1 flex items-center justify-center px-8">
                <div className="w-full max-w-md animate-in">
                    <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">AutoMindz</h1>
                    </div>

                    <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-1">Welcome back</h2>
                    <p className="text-surface-500 mb-8">Sign in to your account</p>

                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com"
                                    className="input pl-10" required id="login-email" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">Password</label>
                                <Link to="/forgot-password" className="text-xs font-semibold text-primary-500 hover:underline">Forgot password?</Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                                    className="input pl-10" required id="login-password" />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full justify-center" id="login-submit">
                            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-surface-500 mt-6">
                        Don't have an account? <Link to="/register" className="text-primary-500 font-semibold hover:underline">Sign up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
