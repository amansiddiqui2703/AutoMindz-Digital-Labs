import { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
    Globe, TrendingUp, BarChart3, Link as LinkIcon, RefreshCw,
    Search, Loader2, ArrowUpDown, Eye, Zap, Filter, ChevronDown,
    ExternalLink, Award, Activity, Database, CheckCircle, XCircle
} from 'lucide-react';

const DA_GRADES = [
    { min: 80, label: 'Excellent', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { min: 60, label: 'Very Good', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
    { min: 40, label: 'Good', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { min: 20, label: 'Fair', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { min: 0, label: 'Low', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
];

const getGrade = (da) => DA_GRADES.find(g => da >= g.min) || DA_GRADES[DA_GRADES.length - 1];

const formatTraffic = (n) => {
    if (!n) return '0';
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
};

export default function SeoTools() {
    const [tab, setTab] = useState('overview');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('da');
    const [enriching, setEnriching] = useState(new Set());
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [bulkEnriching, setBulkEnriching] = useState(false);

    // Campaign link report state
    const [campaigns, setCampaigns] = useState([]);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [linkReport, setLinkReport] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);

    // Unenriched contacts
    const [unenriched, setUnenriched] = useState([]);
    const [unenrichedLoading, setUnenrichedLoading] = useState(false);

    useEffect(() => {
        fetchOverview();
        fetchCampaigns();
    }, [sortBy]);

    const fetchOverview = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/seo/overview?sortBy=${sortBy}`);
            setData(res.data);
        } catch {
            toast.error('Failed to load SEO data');
        } finally {
            setLoading(false);
        }
    };

    const fetchCampaigns = async () => {
        try {
            const res = await api.get('/campaigns');
            setCampaigns(res.data.campaigns || res.data || []);
        } catch { /* silent */ }
    };

    const fetchUnenriched = async () => {
        setUnenrichedLoading(true);
        try {
            const res = await api.get('/contacts?limit=100');
            const contacts = res.data.contacts || res.data || [];
            setUnenriched(contacts.filter(c => !c.enrichment?.enrichedAt));
        } catch {
            toast.error('Failed to load contacts');
        } finally {
            setUnenrichedLoading(false);
        }
    };

    const enrichContact = async (contactId) => {
        setEnriching(prev => new Set(prev).add(contactId));
        try {
            const res = await api.post(`/seo/enrich/${contactId}`);
            toast.success(res.data.message);
            fetchOverview();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Enrichment failed');
        } finally {
            setEnriching(prev => {
                const next = new Set(prev);
                next.delete(contactId);
                return next;
            });
        }
    };

    const bulkEnrich = async () => {
        const ids = unenriched.map(c => c._id);
        if (!ids.length) return toast.error('No contacts to enrich');
        setBulkEnriching(true);
        try {
            const res = await api.post('/seo/enrich-bulk', { contactIds: ids });
            toast.success(res.data.message);
            fetchOverview();
            fetchUnenriched();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Bulk enrichment failed');
        } finally {
            setBulkEnriching(false);
        }
    };

    const fetchLinkReport = async (campaignId) => {
        setSelectedCampaign(campaignId);
        setReportLoading(true);
        try {
            const res = await api.get(`/seo/campaign-links/${campaignId}`);
            setLinkReport(res.data);
        } catch {
            toast.error('Failed to load link report');
        } finally {
            setReportLoading(false);
        }
    };

    const summary = data?.summary || {};

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">SEO Tools</h1>
                        <p className="text-surface-500 text-sm">Domain metrics, link monitoring & campaign reports</p>
                    </div>
                </div>
                <button onClick={fetchOverview} className="btn-secondary">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1 w-fit">
                {[
                    { key: 'overview', label: 'SEO Overview', icon: BarChart3 },
                    { key: 'enrich', label: 'Enrich Contacts', icon: Zap },
                    { key: 'reports', label: 'Campaign Links', icon: LinkIcon },
                ].map(t => (
                    <button
                        key={t.key}
                        onClick={() => { setTab(t.key); if (t.key === 'enrich') fetchUnenriched(); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key
                            ? 'bg-white dark:bg-surface-900 shadow text-surface-900 dark:text-white' : 'text-surface-500'}`}
                    >
                        <t.icon className="w-4 h-4" /> {t.label}
                    </button>
                ))}
            </div>

            {/* =================== SEO OVERVIEW =================== */}
            {tab === 'overview' && (
                <>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        {[
                            { icon: Database, label: 'Enriched Contacts', value: summary.totalEnriched || 0, color: 'from-emerald-500 to-emerald-600' },
                            { icon: Award, label: 'Avg DA', value: summary.avgDA || 0, color: 'from-blue-500 to-blue-600' },
                            { icon: TrendingUp, label: 'Avg DR', value: summary.avgDR || 0, color: 'from-purple-500 to-purple-600' },
                            { icon: LinkIcon, label: 'Total Links', value: summary.totalLinks || 0, color: 'from-amber-500 to-amber-600' },
                            { icon: CheckCircle, label: 'Live Links', value: summary.liveLinks || 0, color: 'from-green-500 to-green-600' },
                        ].map((s, i) => (
                            <div key={i} className="glass-card p-4 flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                                    <s.icon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-surface-900 dark:text-white">{s.value}</div>
                                    <div className="text-xs text-surface-500">{s.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-surface-500">Sort by:</span>
                        {[
                            { key: 'da', label: 'Domain Authority' },
                            { key: 'dr', label: 'Domain Rating' },
                            { key: 'traffic', label: 'Traffic' },
                            { key: 'recent', label: 'Recently Enriched' },
                        ].map(opt => (
                            <button key={opt.key} onClick={() => setSortBy(opt.key)}
                                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${sortBy === opt.key
                                    ? 'bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400'
                                    : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800'}`}>
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Contacts Table */}
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (data?.contacts || []).length === 0 ? (
                        <div className="text-center py-16 glass-card">
                            <Globe className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300">No enriched contacts</h3>
                            <p className="text-surface-400 mt-1">Go to "Enrich Contacts" tab to add DA/DR data</p>
                        </div>
                    ) : (
                        <div className="glass-card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Contact</th><th>Website</th><th>DA</th><th>DR</th><th>Traffic</th><th>Links</th><th>Stage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.contacts.map(c => {
                                            const grade = getGrade(c.enrichment?.domainAuthority || 0);
                                            return (
                                                <tr key={c._id}>
                                                    <td>
                                                        <div className="font-medium text-surface-900 dark:text-white">{c.name || c.email}</div>
                                                        <div className="text-xs text-surface-400">{c.company || c.email}</div>
                                                    </td>
                                                    <td>
                                                        {c.website ? (
                                                            <a href={c.website} target="_blank" rel="noopener noreferrer"
                                                                className="text-xs text-primary-500 hover:underline flex items-center gap-1">
                                                                {c.website.replace(/^https?:\/\//, '').substring(0, 25)}
                                                                <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        ) : <span className="text-xs text-surface-400">—</span>}
                                                    </td>
                                                    <td>
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-bold ${grade.bg} ${grade.color}`}>
                                                            {c.enrichment?.domainAuthority || '—'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="text-sm font-semibold text-surface-900 dark:text-white">
                                                            {c.enrichment?.domainRating || '—'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="text-sm text-surface-700 dark:text-surface-300">
                                                            {formatTraffic(c.enrichment?.monthlyTraffic)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm">{c.links?.live || 0}</span>
                                                            <span className="text-[10px] text-surface-400">/ {c.links?.total || 0}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="badge badge-info text-[10px]">{c.pipelineStage}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* =================== ENRICH CONTACTS =================== */}
            {tab === 'enrich' && (
                <div className="space-y-4">
                    <div className="glass-card p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/5 dark:to-teal-500/5 flex items-start gap-3">
                        <Zap className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                            <p className="font-medium text-surface-900 dark:text-white">Contact Enrichment</p>
                            <p className="text-surface-500 text-xs mt-1">
                                Enrich contacts with <strong>Domain Authority (DA)</strong>, <strong>Domain Rating (DR)</strong>, and <strong>Monthly Traffic</strong> data.
                                This helps prioritize high-value outreach targets.
                            </p>
                        </div>
                    </div>

                    {unenriched.length > 0 && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-surface-500">{unenriched.length} contacts without enrichment data</span>
                            <button onClick={bulkEnrich} disabled={bulkEnriching} className="btn-primary">
                                {bulkEnriching ? <><Loader2 className="w-4 h-4 animate-spin" /> Enriching...</> : <><Zap className="w-4 h-4" /> Enrich All ({unenriched.length})</>}
                            </button>
                        </div>
                    )}

                    {unenrichedLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : unenriched.length === 0 ? (
                        <div className="text-center py-12 glass-card">
                            <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                            <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300">All contacts enriched!</h3>
                            <p className="text-surface-400 text-sm mt-1">Check the SEO Overview tab for results</p>
                        </div>
                    ) : (
                        <div className="glass-card overflow-hidden">
                            <table className="data-table">
                                <thead>
                                    <tr><th>Contact</th><th>Email</th><th>Domain</th><th>Action</th></tr>
                                </thead>
                                <tbody>
                                    {unenriched.map(c => (
                                        <tr key={c._id}>
                                            <td className="font-medium">{c.name || '—'}</td>
                                            <td className="text-sm text-surface-500">{c.email}</td>
                                            <td className="text-sm text-primary-500">{c.website || c.email.split('@')[1]}</td>
                                            <td>
                                                <button
                                                    onClick={() => enrichContact(c._id)}
                                                    disabled={enriching.has(c._id)}
                                                    className="btn-primary text-xs !py-1.5"
                                                >
                                                    {enriching.has(c._id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                                    Enrich
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* =================== CAMPAIGN LINK REPORTS =================== */}
            {tab === 'reports' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-surface-500">Select campaign:</span>
                        <select
                            onChange={e => { if (e.target.value) fetchLinkReport(e.target.value); }}
                            className="input !py-2 w-auto min-w-[250px]"
                            value={selectedCampaign || ''}
                        >
                            <option value="">-- Choose campaign --</option>
                            {campaigns.map(c => (
                                <option key={c._id} value={c._id}>{c.name} ({c.status})</option>
                            ))}
                        </select>
                    </div>

                    {reportLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : linkReport ? (
                        <div className="space-y-4">
                            {/* Report Stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                                {[
                                    { label: 'Emails Sent', value: linkReport.stats.emailsSent, color: 'from-primary-500 to-primary-600' },
                                    { label: 'Links Found', value: linkReport.stats.totalLinks, color: 'from-emerald-500 to-emerald-600' },
                                    { label: 'Live Links', value: linkReport.stats.live, color: 'from-green-500 to-green-600' },
                                    { label: 'Acquisition Rate', value: `${linkReport.stats.linkAcquisitionRate}%`, color: 'from-purple-500 to-purple-600' },
                                    { label: 'Pending', value: linkReport.stats.pending, color: 'from-amber-500 to-amber-600' },
                                ].map((s, i) => (
                                    <div key={i} className="glass-card p-4 text-center">
                                        <div className={`text-2xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</div>
                                        <div className="text-xs text-surface-500 mt-1">{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Link Status Breakdown */}
                            <div className="glass-card p-6">
                                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Link Status Breakdown</h3>
                                <div className="flex gap-4 mb-4">
                                    {[
                                        { status: 'live', count: linkReport.stats.live, color: 'bg-green-500' },
                                        { status: 'pending', count: linkReport.stats.pending, color: 'bg-amber-500' },
                                        { status: 'removed', count: linkReport.stats.removed, color: 'bg-red-500' },
                                        { status: 'broken', count: linkReport.stats.broken, color: 'bg-orange-500' },
                                        { status: 'nofollow', count: linkReport.stats.nofollow, color: 'bg-surface-400' },
                                    ].map((s, i) => {
                                        const total = linkReport.stats.totalLinks || 1;
                                        return (
                                            <div key={i} className="flex-1">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="capitalize text-surface-600 dark:text-surface-400">{s.status}</span>
                                                    <span className="font-medium">{s.count}</span>
                                                </div>
                                                <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full">
                                                    <div className={`h-2 rounded-full ${s.color}`} style={{ width: `${(s.count / total) * 100}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Links Table */}
                            {linkReport.links.length > 0 ? (
                                <div className="glass-card overflow-hidden">
                                    <table className="data-table">
                                        <thead>
                                            <tr><th>Target URL</th><th>Link From</th><th>Contact</th><th>Status</th><th>DA</th></tr>
                                        </thead>
                                        <tbody>
                                            {linkReport.links.map(link => (
                                                <tr key={link._id}>
                                                    <td>
                                                        <a href={link.targetUrl} target="_blank" rel="noopener noreferrer"
                                                            className="text-xs text-primary-500 hover:underline flex items-center gap-1">
                                                            {link.targetUrl.substring(0, 40)} <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    </td>
                                                    <td className="text-xs text-surface-500">{link.linkUrl?.substring(0, 35) || '—'}</td>
                                                    <td className="text-xs">{link.contactId?.name || link.contactId?.email || '—'}</td>
                                                    <td>
                                                        <span className={`badge text-[10px] ${link.status === 'live' ? 'badge-success' : link.status === 'removed' ? 'badge-danger' : 'badge-warning'}`}>
                                                            {link.status}
                                                        </span>
                                                    </td>
                                                    <td className="font-semibold">{link.contactId?.enrichment?.domainAuthority || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12 glass-card">
                                    <LinkIcon className="w-10 h-10 text-surface-300 mx-auto mb-2" />
                                    <p className="text-surface-500 text-sm">No links tracked for this campaign yet.</p>
                                    <p className="text-surface-400 text-xs mt-1">Add links from the Links page and associate them with this campaign.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-16 glass-card">
                            <BarChart3 className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300">Select a campaign</h3>
                            <p className="text-surface-400 mt-1">Choose a campaign above to see its link acquisition report</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
