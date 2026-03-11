import { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
    Link as LinkIcon, Plus, Trash2, ExternalLink, RefreshCw, X,
    CheckCircle, XCircle, AlertTriangle, Clock, Eye
} from 'lucide-react';

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: 'bg-surface-100 text-surface-600', icon: Clock },
    live: { label: 'Live', color: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400', icon: CheckCircle },
    removed: { label: 'Removed', color: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400', icon: XCircle },
    broken: { label: 'Broken', color: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400', icon: AlertTriangle },
    nofollow: { label: 'Nofollow', color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400', icon: Eye },
};

export default function Links() {
    const [links, setLinks] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [filter, setFilter] = useState('');
    const [checking, setChecking] = useState(null);
    const [form, setForm] = useState({ targetUrl: '', linkUrl: '', anchorText: '', notes: '' });

    const fetchLinks = () => {
        const params = filter ? `?status=${filter}` : '';
        api.get(`/links${params}`)
            .then(res => { setLinks(res.data.links); setStats(res.data.stats); })
            .catch(() => toast.error('Failed to load links'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchLinks(); }, [filter]);

    const createLink = async (e) => {
        e.preventDefault();
        if (!form.targetUrl.trim()) return;
        try {
            await api.post('/links', form);
            toast.success('Link added!');
            setShowCreate(false);
            setForm({ targetUrl: '', linkUrl: '', anchorText: '', notes: '' });
            fetchLinks();
        } catch { toast.error('Failed to create link'); }
    };

    const checkLink = async (id) => {
        setChecking(id);
        try {
            await api.post(`/links/${id}/check`);
            toast.success('Link checked!');
            fetchLinks();
        } catch { toast.error('Check failed'); }
        finally { setChecking(null); }
    };

    const updateStatus = async (id, status) => {
        try {
            await api.put(`/links/${id}`, { status });
            toast.success('Status updated');
            fetchLinks();
        } catch { toast.error('Failed'); }
    };

    const deleteLink = async (id) => {
        if (!confirm('Delete this link?')) return;
        try {
            await api.delete(`/links/${id}`);
            toast.success('Deleted');
            fetchLinks();
        } catch { toast.error('Failed'); }
    };

    const bulkCheck = async () => {
        try {
            const res = await api.post('/links/bulk-check', {});
            toast.success(res.data.message);
            setTimeout(fetchLinks, 5000);
        } catch { toast.error('Bulk check failed'); }
    };

    if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

    const totalLinks = Object.values(stats).reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Link Monitoring</h1>
                    <p className="text-surface-500 mt-1">Track your acquired backlinks</p>
                </div>
                <div className="flex items-center gap-3">
                    {totalLinks > 0 && (
                        <button onClick={bulkCheck} className="btn-secondary text-sm">
                            <RefreshCw className="w-4 h-4" /> Check All
                        </button>
                    )}
                    <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Link</button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                        <button key={key} onClick={() => setFilter(filter === key ? '' : key)}
                            className={`glass-card p-4 text-center transition-all hover:shadow-md ${filter === key ? 'ring-2 ring-primary-500' : ''}`}>
                            <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: key === 'live' ? '#22c55e' : key === 'removed' ? '#ef4444' : key === 'broken' ? '#f97316' : '#6b7280' }} />
                            <div className="text-2xl font-bold text-surface-900 dark:text-white">{stats[key] || 0}</div>
                            <div className="text-xs text-surface-400">{cfg.label}</div>
                        </button>
                    );
                })}
            </div>

            {/* Links Table */}
            {links.length === 0 ? (
                <div className="glass-card p-16 text-center">
                    <LinkIcon className="w-16 h-16 text-surface-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-surface-700 dark:text-surface-300 mb-2">No links tracked yet</h3>
                    <p className="text-surface-400 mb-6">Add links to monitor your acquired backlinks</p>
                    <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Your First Link</button>
                </div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-surface-200 dark:border-surface-700">
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase">Target URL</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase">Your Link</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase">Anchor</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase">Contact</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase">Status</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase">Last Checked</th>
                                    <th className="text-right px-5 py-3 text-xs font-semibold text-surface-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {links.map(link => {
                                    const statusCfg = STATUS_CONFIG[link.status] || STATUS_CONFIG.pending;
                                    const StatusIcon = statusCfg.icon;
                                    return (
                                        <tr key={link._id} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                                            <td className="px-5 py-3">
                                                <a href={link.targetUrl} target="_blank" rel="noopener" className="text-sm text-primary-500 hover:underline flex items-center gap-1 max-w-[250px] truncate">
                                                    {link.targetUrl.replace(/^https?:\/\//, '')} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                                </a>
                                            </td>
                                            <td className="px-5 py-3 text-sm text-surface-600 dark:text-surface-400 max-w-[200px] truncate">
                                                {link.linkUrl || '—'}
                                            </td>
                                            <td className="px-5 py-3 text-sm text-surface-600 dark:text-surface-400">
                                                {link.anchorText || '—'}
                                            </td>
                                            <td className="px-5 py-3 text-sm text-surface-600 dark:text-surface-400">
                                                {link.contactId?.name || link.contactId?.email || '—'}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${statusCfg.color}`}>
                                                    <StatusIcon className="w-3 h-3" /> {statusCfg.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-xs text-surface-400">
                                                {link.lastCheckedAt ? new Date(link.lastCheckedAt).toLocaleDateString() : 'Never'}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <div className="flex items-center gap-1 justify-end">
                                                    <button onClick={() => checkLink(link._id)} disabled={checking === link._id}
                                                        className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg" title="Check now">
                                                        <RefreshCw className={`w-4 h-4 text-surface-400 ${checking === link._id ? 'animate-spin' : ''}`} />
                                                    </button>
                                                    <button onClick={() => deleteLink(link._id)}
                                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg" title="Delete">
                                                        <Trash2 className="w-4 h-4 text-red-400" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
                    <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-surface-900 dark:text-white">Add Link to Monitor</h2>
                            <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg">
                                <X className="w-5 h-5 text-surface-400" />
                            </button>
                        </div>
                        <form onSubmit={createLink} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Target Page URL *</label>
                                <input type="url" value={form.targetUrl} onChange={e => setForm({ ...form, targetUrl: e.target.value })}
                                    placeholder="https://example.com/blog-post" className="input-field w-full" required />
                                <p className="text-xs text-surface-400 mt-1">The page where your backlink should appear</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Your Link URL</label>
                                <input type="url" value={form.linkUrl} onChange={e => setForm({ ...form, linkUrl: e.target.value })}
                                    placeholder="https://yoursite.com" className="input-field w-full" />
                                <p className="text-xs text-surface-400 mt-1">Your URL that should be linked from the target page</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Anchor Text</label>
                                <input type="text" value={form.anchorText} onChange={e => setForm({ ...form, anchorText: e.target.value })}
                                    placeholder="e.g. best email tool" className="input-field w-full" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Notes</label>
                                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                                    placeholder="Any notes about this link..." rows={2} className="input-field w-full resize-none" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1">Add Link</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
