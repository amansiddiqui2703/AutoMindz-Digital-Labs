import { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
    BarChart3, Send, Eye, MousePointerClick, AlertTriangle, TrendingUp,
    UserMinus, Mail, Clock, ExternalLink, RefreshCw, Users, Zap, Activity,
    Inbox, Play, ChevronDown, ChevronUp, Hash, Reply, Loader2, CheckSquare, Square
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const PIE_COLORS = ['#3b82f6', '#22c55e', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

const EVENT_CONFIG = {
    open: { icon: Eye, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10', label: 'Opened' },
    click: { icon: MousePointerClick, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', label: 'Clicked' },
    reply: { icon: TrendingUp, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-500/10', label: 'Replied' },
    bounce: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10', label: 'Bounced' },
    unsubscribe: { icon: UserMinus, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10', label: 'Unsubscribed' },
};

const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

export default function Analytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [tab, setTab] = useState('overview'); // overview | emails
    const [emails, setEmails] = useState([]);
    const [emailsLoading, setEmailsLoading] = useState(false);
    const [expandedEmail, setExpandedEmail] = useState(null);
    const [followUpId, setFollowUpId] = useState(null);
    const [followUpBody, setFollowUpBody] = useState('');
    const [followUpSending, setFollowUpSending] = useState(false);
    const [selectedEmails, setSelectedEmails] = useState([]);
    const [bulkFollowUpBody, setBulkFollowUpBody] = useState('');
    const [bulkSending, setBulkSending] = useState(false);
    const [showBulkCompose, setShowBulkCompose] = useState(false);
    const [filterDaysAgo, setFilterDaysAgo] = useState('');
    const [filterUnreplied, setFilterUnreplied] = useState(false);

    const fetchData = (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        api.get('/analytics/dashboard')
            .then(r => setData(r.data))
            .catch(err => setError(err.response?.data?.error || 'Failed to load analytics'))
            .finally(() => { setLoading(false); setRefreshing(false); });
    };

    const fetchEmails = () => {
        setEmailsLoading(true);
        let url = '/analytics/emails?page=1';
        if (filterDaysAgo) url += `&daysAgo=${filterDaysAgo}`;
        if (filterUnreplied) url += `&unrepliedOnly=${filterUnreplied}`;
        api.get(url)
            .then(r => setEmails(r.data.emails || []))
            .catch(() => toast.error('Failed to load sent emails'))
            .finally(() => setEmailsLoading(false));
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { if (tab === 'emails') fetchEmails(); }, [tab, filterDaysAgo, filterUnreplied]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;
        const url = import.meta.env.DEV ? `http://localhost:5000/api/events?token=${token}` : `/api/events?token=${token}`;
        const source = new EventSource(url);
        source.addEventListener('analytics_update', () => {
            api.get('/analytics/dashboard').then(r => setData(r.data)).catch(() => {});
            if (tab === 'emails') fetchEmails();
        });
        return () => source.close();
    }, [tab]);

    const sendFollowUp = async (emailId) => {
        if (!followUpBody.trim()) return toast.error('Please write a follow-up message');
        setFollowUpSending(true);
        try {
            const res = await api.post('/emails/send-followup', { originalEmailId: emailId, htmlBody: `<p>${followUpBody.replace(/\n/g, '<br/>')}</p>` });
            toast.success(res.data.message);
            setFollowUpId(null);
            setFollowUpBody('');
            fetchEmails();
            fetchData(true);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to send follow-up');
        } finally {
            setFollowUpSending(false);
        }
    };

    const toggleEmailSelect = (emailId) => {
        setSelectedEmails(prev => prev.includes(emailId) ? prev.filter(id => id !== emailId) : [...prev, emailId]);
    };

    const toggleSelectAll = () => {
        const sentEmails = emails.filter(e => e.status === 'sent');
        if (selectedEmails.length === sentEmails.length) setSelectedEmails([]);
        else setSelectedEmails(sentEmails.map(e => e._id));
    };

    const sendBulkFollowUp = async () => {
        if (!bulkFollowUpBody.trim()) return toast.error('Please write a follow-up message');
        setBulkSending(true);
        try {
            const res = await api.post('/emails/send-bulk-followup', {
                emailIds: selectedEmails,
                htmlBody: `<p>${bulkFollowUpBody.replace(/\n/g, '<br/>')}</p>`,
            });
            toast.success(res.data.message);
            setSelectedEmails([]);
            setBulkFollowUpBody('');
            setShowBulkCompose(false);
            fetchEmails();
            fetchData(true);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Bulk follow-up failed');
        } finally {
            setBulkSending(false);
        }
    };

    const simulateEvent = async (trackingId, type) => {
        try {
            const res = await api.post('/analytics/simulate', { trackingId, type });
            toast.success(res.data.message);
            fetchEmails();
            fetchData(true);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Simulation failed');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-surface-400 text-sm">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-center">
                <BarChart3 className="w-14 h-14 text-red-400 mb-4" />
                <h3 className="text-xl font-semibold text-surface-700 dark:text-surface-300">Analytics Unavailable</h3>
                <p className="text-surface-400 mt-2 max-w-md">{error}</p>
                <button onClick={() => fetchData()} className="btn-primary mt-4"><RefreshCw className="w-4 h-4" /> Retry</button>
            </div>
        );
    }

    const o = data?.overview || {};
    const timeline = data?.timeline || [];
    const delivery = data?.deliveryStats || {};
    const activity = data?.recentActivity || [];
    const campaigns = data?.recentCampaigns || [];

    const stats = [
        { icon: Send, label: 'Total Sent', value: o.totalSent || 0, sub: `${o.totalFailed || 0} failed`, color: 'from-primary-500 to-primary-600' },
        { icon: Eye, label: 'Opened', value: o.totalOpened || 0, sub: `${o.openRate || 0}% rate`, color: 'from-green-500 to-green-600' },
        { icon: MousePointerClick, label: 'Clicked', value: o.totalClicked || 0, sub: `${o.clickRate || 0}% rate`, color: 'from-purple-500 to-purple-600' },
        { icon: TrendingUp, label: 'Replied', value: o.totalReplied || 0, sub: `${o.replyRate || 0}% rate`, color: 'from-cyan-500 to-cyan-600' },
        { icon: AlertTriangle, label: 'Bounced', value: o.totalBounced || 0, sub: `${o.bounceRate || 0}% rate`, color: 'from-orange-500 to-orange-600' },
        { icon: UserMinus, label: 'Unsubscribed', value: o.totalUnsubscribed || 0, sub: `${o.unsubRate || 0}% rate`, color: 'from-red-500 to-red-600' },
    ];

    const pieData = [
        { name: 'Sent', value: o.totalSent || 0 },
        { name: 'Opened', value: o.totalOpened || 0 },
        { name: 'Clicked', value: o.totalClicked || 0 },
        { name: 'Replied', value: o.totalReplied || 0 },
        { name: 'Bounced', value: o.totalBounced || 0 },
    ].filter(d => d.value > 0);

    const rateData = [
        { name: 'Open Rate', value: parseFloat(o.openRate) || 0, fill: '#22c55e' },
        { name: 'Click Rate', value: parseFloat(o.clickRate) || 0, fill: '#8b5cf6' },
        { name: 'Reply Rate', value: parseFloat(o.replyRate) || 0, fill: '#06b6d4' },
        { name: 'Bounce Rate', value: parseFloat(o.bounceRate) || 0, fill: '#f59e0b' },
        { name: 'Unsub Rate', value: parseFloat(o.unsubRate) || 0, fill: '#ef4444' },
    ];

    const chartTimeline = timeline.map(t => ({
        ...t,
        label: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Analytics</h1>
                    <p className="text-surface-500 mt-1">Track your email outreach performance</p>
                </div>
                <button onClick={() => fetchData(true)} disabled={refreshing} className="btn-secondary">
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-surface-200 dark:bg-surface-800 p-1 rounded-xl w-fit">
                <button onClick={() => setTab('overview')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'overview' ? 'bg-white dark:bg-surface-900 shadow text-surface-900 dark:text-white' : 'text-surface-500 hover:text-surface-700'}`}>
                    <BarChart3 className="w-4 h-4" /> Overview
                </button>
                <button onClick={() => setTab('emails')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'emails' ? 'bg-white dark:bg-surface-900 shadow text-surface-900 dark:text-white' : 'text-surface-500 hover:text-surface-700'}`}>
                    <Inbox className="w-4 h-4" /> Sent Emails & Tracking
                </button>
            </div>

            {tab === 'overview' && (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        {stats.map((s, i) => (
                            <div key={i} className="stat-card group">
                                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                                    <s.icon className="w-4.5 h-4.5 text-white" />
                                </div>
                                <div className="text-2xl font-bold text-surface-900 dark:text-white">{s.value.toLocaleString()}</div>
                                <div className="text-xs text-surface-500 mt-0.5">{s.label}</div>
                                <div className="text-xs text-surface-400 mt-1">{s.sub}</div>
                            </div>
                        ))}
                    </div>

                    {/* Summary cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { icon: Mail, label: 'Total Campaigns', value: o.totalCampaigns || 0, color: 'from-indigo-500 to-indigo-600' },
                            { icon: Zap, label: 'Active Campaigns', value: o.activeCampaigns || 0, color: 'from-emerald-500 to-emerald-600' },
                            { icon: Users, label: 'Total Contacts', value: o.totalContacts || 0, color: 'from-pink-500 to-pink-600' },
                            { icon: Activity, label: 'Connected Accounts', value: (data?.accounts || []).length, color: 'from-amber-500 to-amber-600' },
                        ].map((item, i) => (
                            <div key={i} className="glass-card p-4 flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                                    <item.icon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-surface-900 dark:text-white">{item.value}</div>
                                    <div className="text-xs text-surface-500">{item.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 30-Day Chart */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-1">Email Activity (Last 30 Days)</h3>
                        <p className="text-xs text-surface-400 mb-6">Daily breakdown of sent, opened, and clicked emails</p>
                        {chartTimeline.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={chartTimeline}>
                                    <defs>
                                        <linearGradient id="gradSent" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gradOpened" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gradClicked" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} interval="preserveStartEnd" />
                                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                                    <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, color: '#fff', fontSize: 13 }} />
                                    <Legend verticalAlign="top" height={36} iconType="circle" />
                                    <Area type="monotone" dataKey="sent" stroke="#3b82f6" fill="url(#gradSent)" strokeWidth={2} name="Sent" />
                                    <Area type="monotone" dataKey="opened" stroke="#22c55e" fill="url(#gradOpened)" strokeWidth={2} name="Opened" />
                                    <Area type="monotone" dataKey="clicked" stroke="#8b5cf6" fill="url(#gradClicked)" strokeWidth={2} name="Clicked" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-surface-400">
                                <div className="text-center">
                                    <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                    <p>No activity data yet. Start sending emails to see your timeline!</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Rate Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-1">Performance Rates</h3>
                            <p className="text-xs text-surface-400 mb-6">Percentage rates based on total emails sent</p>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={rateData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                                    <XAxis type="number" stroke="#94a3b8" fontSize={12} unit="%" domain={[0, 'auto']} />
                                    <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={90} tickLine={false} />
                                    <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, color: '#fff' }} formatter={(v) => [`${v}%`, 'Rate']} />
                                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
                                        {rateData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-1">Email Distribution</h3>
                            <p className="text-xs text-surface-400 mb-6">Breakdown of email engagement</p>
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                            {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, color: '#fff' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-[260px] text-surface-400">
                                    <div className="text-center">
                                        <Send className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                        <p>No data yet. Send some emails first!</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Delivery + Activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Delivery Status</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Delivered', count: delivery.sent || 0, color: 'bg-green-500' },
                                    { label: 'Queued', count: delivery.queued || 0, color: 'bg-blue-500' },
                                    { label: 'Failed', count: delivery.failed || 0, color: 'bg-red-500' },
                                    { label: 'Bounced', count: delivery.bounced || 0, color: 'bg-orange-500' },
                                ].map((item, i) => {
                                    const total = (delivery.sent || 0) + (delivery.failed || 0) + (delivery.bounced || 0) + (delivery.queued || 0);
                                    return (
                                        <div key={i}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-surface-600 dark:text-surface-400">{item.label}</span>
                                                <span className="font-medium text-surface-900 dark:text-white">{item.count}</span>
                                            </div>
                                            <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                                                <div className={`${item.color} h-2 rounded-full transition-all`}
                                                    style={{ width: `${total > 0 ? (item.count / total) * 100 : 0}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="lg:col-span-2 glass-card p-6">
                            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary-500" /> Recent Activity
                            </h3>
                            {activity.length === 0 ? (
                                <div className="text-center py-8">
                                    <Clock className="w-10 h-10 text-surface-300 mx-auto mb-2" />
                                    <p className="text-surface-400 text-sm">No recent activity. Send emails and track engagement here.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2">
                                    {activity.map((a, i) => {
                                        const config = EVENT_CONFIG[a.type] || EVENT_CONFIG.open;
                                        const Icon = config.icon;
                                        return (
                                            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${config.bg} transition-all`}>
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                                                    <Icon className={`w-4 h-4 ${config.color}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-surface-900 dark:text-white truncate">{a.email}</span>
                                                        <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                                                    </div>
                                                    <div className="text-xs text-surface-400 truncate">{a.subject || 'No subject'}</div>
                                                </div>
                                                <div className="text-xs text-surface-400 flex-shrink-0 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {timeAgo(a.timestamp)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Campaign Performance */}
                    {campaigns.length > 0 && (
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Campaign Performance</h3>
                            <div className="overflow-x-auto">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Campaign</th><th>Status</th><th>Sent</th><th>Opened</th><th>Clicked</th><th>Replied</th><th>Bounced</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {campaigns.map((c, i) => (
                                            <tr key={i}>
                                                <td className="font-medium">{c.name}</td>
                                                <td><span className={`badge ${c.status === 'running' ? 'badge-success' : c.status === 'completed' ? 'badge-info' : 'badge-warning'}`}>{c.status}</span></td>
                                                <td>{c.stats?.sent || 0}</td>
                                                <td>{c.stats?.opened || 0}</td>
                                                <td>{c.stats?.clicked || 0}</td>
                                                <td>{c.stats?.replied || 0}</td>
                                                <td>{c.stats?.bounced || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ========== SENT EMAILS & TRACKING TAB ========== */}
            {tab === 'emails' && (
                <div className="space-y-4">
                    {/* Info banner */}
                    <div className="glass-card p-4 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-500/5 dark:to-accent-500/5 flex items-start gap-3">
                        <Hash className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                            <p className="font-medium text-surface-900 dark:text-white">How Tracking Works</p>
                            <p className="text-surface-500 text-xs mt-1">
                                Every email you send includes a <strong>hidden 1x1 tracking pixel</strong> for open detection and
                                all links are <strong>wrapped with click tracking</strong>. When recipients open the email or click links,
                                events are automatically recorded here.
                                Use the <strong>"Simulate"</strong> buttons below to test tracking locally.
                            </p>
                        </div>
                    </div>

                    {emailsLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : emails.length === 0 ? (
                        <div className="text-center py-16 glass-card">
                            <Inbox className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300">No emails sent yet</h3>
                            <p className="text-surface-400 mt-1">Send an email from the Compose page and it will appear here with tracking details.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Filters */}
                            <div className="flex items-center gap-3 bg-surface-50 dark:bg-surface-800/50 p-3 rounded-xl border border-surface-200 dark:border-surface-700">
                                <span className="text-sm font-medium text-surface-700 dark:text-surface-300 flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Filters:</span>
                                <select
                                    className="input text-sm py-1.5 px-3 w-auto bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700"
                                    value={filterDaysAgo}
                                    onChange={e => setFilterDaysAgo(e.target.value)}
                                >
                                    <option value="">All Time</option>
                                    <option value="1">Sent 1 Day Ago</option>
                                    <option value="2">Sent 2 Days Ago</option>
                                    <option value="3">Sent 3 Days Ago</option>
                                    <option value="7">Sent 7 Days Ago</option>
                                </select>
                                <label className="flex items-center gap-2 text-sm cursor-pointer text-surface-700 dark:text-surface-300 ml-2">
                                    <input
                                        type="checkbox"
                                        className="rounded border-surface-300 text-primary-500 focus:ring-primary-500 bg-white dark:bg-surface-900"
                                        checked={filterUnreplied}
                                        onChange={e => setFilterUnreplied(e.target.checked)}
                                    />
                                    Unreplied Only (No Replies & No Bounces)
                                </label>
                            </div>

                            {/* Select all + bulk action bar */}
                            <div className="flex items-center justify-between bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-2.5">
                                <label className="flex items-center gap-2 cursor-pointer text-sm" onClick={(e) => { e.preventDefault(); toggleSelectAll(); }}>
                                    {selectedEmails.length === emails.filter(e => e.status === 'sent').length && emails.filter(e => e.status === 'sent').length > 0
                                        ? <CheckSquare className="w-4 h-4 text-primary-500" />
                                        : <Square className="w-4 h-4 text-surface-400" />}
                                    <span className="text-surface-600 dark:text-surface-400">
                                        {selectedEmails.length > 0 ? `${selectedEmails.length} selected` : 'Select all sent emails'}
                                    </span>
                                </label>
                                {selectedEmails.length > 0 && (
                                    <button
                                        onClick={() => setShowBulkCompose(true)}
                                        className="btn-primary text-xs py-1.5 px-4"
                                    >
                                        <Reply className="w-3.5 h-3.5" /> Bulk Follow-Up ({selectedEmails.length})
                                    </button>
                                )}
                            </div>

                            {/* Bulk compose modal */}
                            {showBulkCompose && selectedEmails.length > 0 && (
                                <div className="glass-card p-5 border-2 border-primary-300 dark:border-primary-600">
                                    <h4 className="text-sm font-semibold text-surface-900 dark:text-white mb-1 flex items-center gap-2">
                                        <Reply className="w-4 h-4 text-primary-500" /> Bulk Threaded Follow-Up
                                    </h4>
                                    <p className="text-xs text-surface-400 mb-3">
                                        Sending follow-up to <strong>{selectedEmails.length}</strong> recipients in their original threads
                                    </p>
                                    <textarea
                                        value={bulkFollowUpBody}
                                        onChange={(e) => setBulkFollowUpBody(e.target.value)}
                                        placeholder="Write your follow-up message here... This will be sent to all selected recipients in their original email threads."
                                        className="input text-sm min-h-[120px] resize-y mb-3"
                                        autoFocus
                                    />
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={sendBulkFollowUp}
                                            disabled={bulkSending || !bulkFollowUpBody.trim()}
                                            className="btn-primary text-xs py-2 px-4"
                                        >
                                            {bulkSending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending {selectedEmails.length} follow-ups...</>
                                                : <><Send className="w-3.5 h-3.5" /> Send to {selectedEmails.length} Recipients</>}
                                        </button>
                                        <button
                                            onClick={() => { setShowBulkCompose(false); setBulkFollowUpBody(''); }}
                                            className="btn-secondary text-xs py-2 px-4"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                            {emails.map((email) => {
                                const isExpanded = expandedEmail === email._id;
                                return (
                                    <div key={email._id} className="glass-card overflow-hidden">
                                        {/* Email row */}
                                        <div
                                            className="p-4 flex items-center gap-4 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                                            onClick={() => setExpandedEmail(isExpanded ? null : email._id)}
                                        >
                                            {/* Checkbox */}
                                            {email.status === 'sent' && (
                                                <div onClick={(e) => { e.stopPropagation(); toggleEmailSelect(email._id); }} className="flex-shrink-0">
                                                    {selectedEmails.includes(email._id)
                                                        ? <CheckSquare className="w-4 h-4 text-primary-500" />
                                                        : <Square className="w-4 h-4 text-surface-300 hover:text-surface-500" />}
                                                </div>
                                            )}
                                            {/* Status indicator */}
                                            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${email.status === 'sent' ? 'bg-green-500' :
                                                email.status === 'failed' ? 'bg-red-500' :
                                                    email.status === 'bounced' ? 'bg-orange-500' : 'bg-blue-500'
                                                }`} />

                                            {/* Email Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-surface-900 dark:text-white text-sm">{email.to}</span>
                                                    <span className={`badge text-[10px] ${email.status === 'sent' ? 'badge-success' :
                                                        email.status === 'failed' ? 'badge-danger' :
                                                            email.status === 'bounced' ? 'badge-warning' : 'badge-info'
                                                        }`}>{email.status}</span>
                                                </div>
                                                <div className="text-xs text-surface-400 truncate">{email.subject || 'No subject'}</div>
                                            </div>

                                            {/* Tracking counts */}
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                {email.opens > 0 && (
                                                    <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                                                        <Eye className="w-3.5 h-3.5" /> {email.opens}
                                                    </span>
                                                )}
                                                {email.clicks > 0 && (
                                                    <span className="flex items-center gap-1 text-xs text-purple-500 font-medium">
                                                        <MousePointerClick className="w-3.5 h-3.5" /> {email.clicks}
                                                    </span>
                                                )}
                                                {email.replies > 0 && (
                                                    <span className="flex items-center gap-1 text-xs text-cyan-500 font-medium">
                                                        <TrendingUp className="w-3.5 h-3.5" /> {email.replies}
                                                    </span>
                                                )}
                                                {email.bounces > 0 && (
                                                    <span className="flex items-center gap-1 text-xs text-orange-500 font-medium">
                                                        <AlertTriangle className="w-3.5 h-3.5" /> {email.bounces}
                                                    </span>
                                                )}
                                                {email.opens === 0 && email.clicks === 0 && email.replies === 0 && email.bounces === 0 && (
                                                    <span className="text-xs text-surface-400">No events</span>
                                                )}
                                            </div>

                                            {/* Time */}
                                            <div className="text-xs text-surface-400 flex-shrink-0">{timeAgo(email.sentAt || email.createdAt)}</div>

                                            {/* Expand */}
                                            {isExpanded ? <ChevronUp className="w-4 h-4 text-surface-400" /> : <ChevronDown className="w-4 h-4 text-surface-400" />}
                                        </div>

                                        {/* Expanded details */}
                                        {isExpanded && (
                                            <div className="border-t border-surface-200 dark:border-surface-700 p-4 bg-surface-50 dark:bg-surface-800/30 animate-in">
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                    {/* Tracking info */}
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-surface-900 dark:text-white mb-2">Tracking Details</h4>
                                                        <div className="space-y-1.5 text-xs">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-surface-500 w-24">Tracking ID:</span>
                                                                <code className="text-primary-500 bg-primary-50 dark:bg-primary-500/10 px-2 py-0.5 rounded text-[10px]">{email.trackingId}</code>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-surface-500 w-24">Open Pixel:</span>
                                                                <span className="text-green-500">✓ Embedded in email</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-surface-500 w-24">Link Tracking:</span>
                                                                <span className="text-green-500">✓ All links wrapped</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-surface-500 w-24">Unsubscribe:</span>
                                                                <span className="text-green-500">✓ Footer added</span>
                                                            </div>
                                                        </div>

                                                        {/* Simulate buttons */}
                                                        <h4 className="text-sm font-semibold text-surface-900 dark:text-white mt-4 mb-2">Simulate Events (Local Testing)</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            <button onClick={(e) => { e.stopPropagation(); simulateEvent(email.trackingId, 'open'); }}
                                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20 transition-all">
                                                                <Play className="w-3 h-3" /> Open
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); simulateEvent(email.trackingId, 'click'); }}
                                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:hover:bg-purple-500/20 transition-all">
                                                                <Play className="w-3 h-3" /> Click
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); simulateEvent(email.trackingId, 'reply'); }}
                                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-50 text-cyan-600 hover:bg-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-400 dark:hover:bg-cyan-500/20 transition-all">
                                                                <Play className="w-3 h-3" /> Reply
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); simulateEvent(email.trackingId, 'bounce'); }}
                                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20 transition-all">
                                                                <Play className="w-3 h-3" /> Bounce
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Follow Up + Event log */}
                                                    <div>
                                                        {/* Follow-up compose */}
                                                        <h4 className="text-sm font-semibold text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                                                            <Reply className="w-4 h-4 text-primary-500" /> Threaded Follow-Up
                                                        </h4>
                                                        {email.isFollowUp && (
                                                            <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-lg mb-2">
                                                                This is follow-up #{email.followUpIndex} in the thread
                                                            </div>
                                                        )}
                                                        {followUpId === email._id ? (
                                                            <div className="space-y-2 mb-4" onClick={(e) => e.stopPropagation()}>
                                                                <div className="text-xs text-surface-400 mb-1">
                                                                    Replying to: <strong>{email.to}</strong> · Re: {email.subject?.replace(/^Re:\s*/i, '')}
                                                                </div>
                                                                <textarea
                                                                    value={followUpBody}
                                                                    onChange={(e) => setFollowUpBody(e.target.value)}
                                                                    placeholder="Write your follow-up message here..."
                                                                    className="input text-sm min-h-[100px] resize-y"
                                                                    autoFocus
                                                                />
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => sendFollowUp(email._id)}
                                                                        disabled={followUpSending || !followUpBody.trim()}
                                                                        className="btn-primary text-xs py-1.5 px-3"
                                                                    >
                                                                        {followUpSending ? <><Loader2 className="w-3 h-3 animate-spin" /> Sending...</> : <><Send className="w-3 h-3" /> Send Follow-Up</>}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { setFollowUpId(null); setFollowUpBody(''); }}
                                                                        className="btn-secondary text-xs py-1.5 px-3"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setFollowUpId(email._id); setFollowUpBody(''); }}
                                                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-500/10 dark:text-primary-400 dark:hover:bg-primary-500/20 transition-all mb-4"
                                                            >
                                                                <Reply className="w-3.5 h-3.5" /> Send Follow-Up in Same Thread
                                                            </button>
                                                        )}

                                                        {/* Event log */}
                                                        <h4 className="text-sm font-semibold text-surface-900 dark:text-white mb-2">Event Log</h4>
                                                        {email.events.length === 0 ? (
                                                            <p className="text-xs text-surface-400 italic">No events recorded yet. Waiting for recipient to open the email or click a link...</p>
                                                        ) : (
                                                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                                                {email.events.map((ev, i) => {
                                                                    const config = EVENT_CONFIG[ev.type] || EVENT_CONFIG.open;
                                                                    const Icon = config.icon;
                                                                    return (
                                                                        <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${config.bg} text-xs`}>
                                                                            <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                                                                            <span className={`font-medium ${config.color}`}>{config.label}</span>
                                                                            <span className="text-surface-400 ml-auto">{timeAgo(ev.timestamp)}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
