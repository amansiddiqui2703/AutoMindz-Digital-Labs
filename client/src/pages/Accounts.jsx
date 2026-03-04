import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
    Mail, Trash2, Activity, Shield, Loader2, Chrome
} from 'lucide-react';

export default function Accounts() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [oauthLoading, setOauthLoading] = useState(false);

    const fetchAccounts = () => {
        setLoading(true);
        api.get('/accounts')
            .then(r => setAccounts(r.data.accounts))
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchAccounts();

        // Handle OAuth callback params
        if (searchParams.get('connected') === 'true') {
            const email = searchParams.get('email');
            toast.success(`Gmail connected: ${email || 'Success!'} 🎉`);
            searchParams.delete('connected');
            searchParams.delete('email');
            setSearchParams(searchParams, { replace: true });
        }
        if (searchParams.get('error')) {
            toast.error('Gmail connection failed. Please try again.');
            searchParams.delete('error');
            setSearchParams(searchParams, { replace: true });
        }
    }, []);

    const connectOAuth = async () => {
        setOauthLoading(true);
        try {
            const res = await api.get('/accounts/oauth/connect');
            if (res.data.url) {
                window.location.href = res.data.url;
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to start Gmail connection');
            setOauthLoading(false);
        }
    };

    const deleteAccount = async (id) => {
        if (!confirm('Disconnect this Gmail account?')) return;
        try {
            await api.delete(`/accounts/${id}`);
            toast.success('Account disconnected');
            fetchAccounts();
        } catch { toast.error('Failed'); }
    };

    const updateLimit = async (id, dailyLimit) => {
        try {
            await api.patch(`/accounts/${id}`, { dailyLimit: parseInt(dailyLimit) });
            toast.success('Limit updated');
            fetchAccounts();
        } catch { toast.error('Failed'); }
    };

    const healthBg = (h) => h === 'good' ? 'badge-success' : h === 'warning' ? 'badge-warning' : 'badge-danger';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Gmail Accounts</h1>
                    <p className="text-surface-500 mt-1">Connect your Gmail to start sending emails</p>
                </div>
            </div>

            {/* One-Click OAuth Connection */}
            <div className="glass-card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/5 dark:to-indigo-500/5">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-surface-800 shadow-lg flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" className="w-9 h-9">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-1">Connect with Gmail</h3>
                        <p className="text-sm text-surface-500">One click to connect. No setup required. Securely authorized via Google OAuth2.</p>
                    </div>
                    <button
                        onClick={connectOAuth}
                        disabled={oauthLoading}
                        className="btn-primary !py-3 !px-8 text-base shadow-xl shadow-primary-500/20 hover:shadow-2xl transition-all flex-shrink-0"
                    >
                        {oauthLoading
                            ? <><Loader2 className="w-5 h-5 animate-spin" /> Connecting...</>
                            : <><Chrome className="w-5 h-5" /> Connect Gmail</>
                        }
                    </button>
                </div>
            </div>

            {/* Security info */}
            <div className="glass-card p-5 flex items-start gap-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-500/5 dark:to-emerald-500/5">
                <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-surface-700 dark:text-surface-300">
                    <p className="font-medium mb-1">Your Gmail is Secure</p>
                    <p className="text-surface-500 text-xs">We use Google's official OAuth2 protocol. Your password is never shared. Emails are sent directly via the Gmail API. You can revoke access anytime from your Google Account settings.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : accounts.length === 0 ? (
                <div className="text-center py-16 glass-card">
                    <Mail className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300">No Gmail accounts connected</h3>
                    <p className="text-surface-400 mt-1 mb-4">Click "Connect Gmail" above to get started in seconds</p>
                    <button onClick={connectOAuth} className="btn-primary">
                        <Chrome className="w-4 h-4" /> Connect Gmail
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {accounts.map(a => (
                        <div key={a._id} className="glass-card p-6 hover:shadow-lg transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-surface-900 dark:text-white">{a.email}</div>
                                        <div className="text-xs text-surface-400">{a.displayName || 'Gmail Account'} • 🔑 Google OAuth</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`badge ${healthBg(a.health)}`}>
                                        <Activity className="w-3 h-3 mr-1" />{a.health}
                                    </span>
                                    <button onClick={() => deleteAccount(a._id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Quota */}
                            <div className="mb-4">
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="text-surface-500">Daily Quota</span>
                                    <span className="font-medium text-surface-900 dark:text-white">{a.dailySentCount} / {a.dailyLimit}</span>
                                </div>
                                <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2.5">
                                    <div className={`h-2.5 rounded-full transition-all ${a.dailySentCount / a.dailyLimit > 0.9 ? 'bg-red-500' : a.dailySentCount / a.dailyLimit > 0.7 ? 'bg-yellow-500' : 'bg-gradient-to-r from-primary-500 to-accent-500'}`}
                                        style={{ width: `${Math.min((a.dailySentCount / a.dailyLimit) * 100, 100)}%` }} />
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                                    <div className="text-lg font-bold text-surface-900 dark:text-white">{a.totalSent || 0}</div>
                                    <div className="text-xs text-surface-500">Total Sent</div>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                                    <div className="text-lg font-bold text-surface-900 dark:text-white">{a.bounceCount || 0}</div>
                                    <div className="text-xs text-surface-500">Bounces</div>
                                </div>
                                <div>
                                    <label className="text-xs text-surface-500 block mb-1">Daily Limit</label>
                                    <input type="number" defaultValue={a.dailyLimit} onBlur={e => updateLimit(a._id, e.target.value)}
                                        className="input !text-sm !py-1.5" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
