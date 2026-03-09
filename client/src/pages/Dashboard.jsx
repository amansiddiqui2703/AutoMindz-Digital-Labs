import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import {
    Send, Users, Eye, MousePointerClick, BarChart3, TrendingUp,
    ArrowUpRight, Mail, Zap, AlertTriangle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import OnboardingModal from '../components/OnboardingModal';

const StatCard = ({ icon: Icon, label, value, trend, color }) => (
    <div className="stat-card group">
        <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            {trend && (
                <span className="flex items-center gap-1 text-xs font-semibold text-green-500">
                    <ArrowUpRight className="w-3 h-3" />{trend}
                </span>
            )}
        </div>
        <div className="text-2xl font-bold text-surface-900 dark:text-white">{value}</div>
        <div className="text-sm text-surface-500 mt-1">{label}</div>
    </div>
);

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/analytics/dashboard')
            .then(res => setData(res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const o = data?.overview || {};

    // Use real timeline data from API (take last 7 days)
    const timeline = data?.timeline || [];
    const last7 = timeline.slice(-7);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const chartData = last7.map(t => ({
        name: dayNames[new Date(t.date).getDay()],
        sent: t.sent || 0,
        opened: t.opened || 0,
        clicked: t.clicked || 0,
    }));

    return (
        <div className="space-y-8">
            <OnboardingModal />
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Dashboard</h1>
                <p className="text-surface-500 mt-1">Your email outreach at a glance</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard icon={Send} label="Emails Sent" value={o.totalSent || 0} trend="+12%" color="bg-gradient-to-br from-primary-500 to-primary-600" />
                <StatCard icon={Eye} label="Open Rate" value={`${o.openRate || 0}%`} trend="+5%" color="bg-gradient-to-br from-green-500 to-green-600" />
                <StatCard icon={MousePointerClick} label="Click Rate" value={`${o.clickRate || 0}%`} color="bg-gradient-to-br from-accent-500 to-accent-600" />
                <StatCard icon={AlertTriangle} label="Bounce Rate" value={`${o.bounceRate || 0}%`} color="bg-gradient-to-br from-orange-500 to-orange-600" />
            </div>

            {/* Chart + Recent */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card p-6">
                    <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-6">Weekly Activity</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} />
                            <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, color: '#fff', fontSize: 13 }} />
                            <Area type="monotone" dataKey="sent" stroke="#3b82f6" fill="url(#colorSent)" strokeWidth={2.5} />
                            <Area type="monotone" dataKey="opened" stroke="#22c55e" fill="url(#colorOpened)" strokeWidth={2.5} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Recent Campaigns</h3>
                    <div className="space-y-3">
                        {(data?.recentCampaigns || []).length === 0 ? (
                            <p className="text-surface-400 text-sm">No campaigns yet</p>
                        ) : (
                            data.recentCampaigns.map((c, i) => (
                                <Link key={i} to={`/campaigns`} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-all">
                                    <div>
                                        <div className="text-sm font-medium text-surface-900 dark:text-white">{c.name}</div>
                                        <div className="text-xs text-surface-400">{c.stats?.sent || 0} sent</div>
                                    </div>
                                    <span className={`badge ${c.status === 'running' ? 'badge-success' :
                                        c.status === 'paused' ? 'badge-warning' :
                                            c.status === 'completed' ? 'badge-info' : 'badge-purple'
                                        }`}>{c.status}</span>
                                </Link>
                            ))
                        )}
                    </div>

                    <Link to="/campaigns" className="block text-center text-primary-500 text-sm font-semibold mt-4 hover:underline">
                        View All Campaigns →
                    </Link>
                </div>
            </div>

            {/* Accounts */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Connected Accounts</h3>
                {(data?.accounts || []).length === 0 ? (
                    <div className="text-center py-8">
                        <Mail className="w-10 h-10 text-surface-300 mx-auto mb-3" />
                        <p className="text-surface-500 mb-3">No Gmail accounts connected</p>
                        <Link to="/accounts" className="btn-primary">Connect Gmail</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.accounts.map((a, i) => (
                            <div key={i} className="p-4 rounded-xl border border-surface-200 dark:border-surface-700">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-surface-900 dark:text-white truncate">{a.email}</span>
                                    <span className={`badge ${a.health === 'good' ? 'badge-success' : a.health === 'warning' ? 'badge-warning' : 'badge-danger'}`}>
                                        {a.health}
                                    </span>
                                </div>
                                <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                                    <div className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full transition-all"
                                        style={{ width: `${Math.min((a.dailySentCount / a.dailyLimit) * 100, 100)}%` }} />
                                </div>
                                <div className="text-xs text-surface-400 mt-1">{a.dailySentCount}/{a.dailyLimit} daily quota</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
