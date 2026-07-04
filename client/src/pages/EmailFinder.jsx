import { useState, useRef } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
    Search, Globe, Plus, Download, Loader2, CheckCircle, AlertCircle, Mail, XCircle, FileText, Play, StopCircle, PieChart,
    Phone, Facebook, Linkedin, Twitter, Instagram, Info
} from 'lucide-react';

export default function EmailFinder() {
    const [domainInput, setDomainInput] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [advancedMode, setAdvancedMode] = useState(false);
    const [selectedEmails, setSelectedEmails] = useState(new Set());
    const [progress, setProgress] = useState({ current: 0, total: 0, scanningUrl: '' });

    const stopRef = useRef(false);

    const processDomains = async (domains) => {
        setLoading(true);
        stopRef.current = false;
        setProgress({ current: 0, total: domains.length, scanningUrl: domains[0] });

        setResults([]);
        setSelectedEmails(new Set());

        const batchSize = 15;
        let count = 0;

        for (let i = 0; i < domains.length; i += batchSize) {
            if (stopRef.current) break;
            const batch = domains.slice(i, i + batchSize);

            // Send requests concurrently and await all per batch
            const batchPromises = batch.map(async (domain) => {
                try {
                    const endpoint = advancedMode ? '/advanced-finder/search' : '/finder/search';
                    const res = await api.post(endpoint, { domain });
                    return res.data.result;
                } catch (e) {
                    return {
                        url: domain,
                        domain,
                        status: 'error',
                        error: e.response?.data?.error || 'Search failed',
                        emails: { contact: [], editorial: [], advertising: [], support: [], other: [] },
                        all_emails_flat: [],
                        phones: [],
                        socials: { linkedin: '', twitter: '', facebook: '', instagram: '' },
                        title: '',
                        description: ''
                    };
                }
            });

            // Update state dynamically as each finishes within batch
            await Promise.all(batchPromises.map(p => p.then(item => {
                if (stopRef.current) return;
                setResults(prev => [...prev, item]);
                count++;
                setProgress({ current: count, total: domains.length, scanningUrl: count < domains.length ? domains[count] : 'Done' });
            })));
        }

        setLoading(false);
        if (!stopRef.current && domains.length > 0) toast.success(`Scanning complete. Found emails for ${results.filter(r => r.status === 'found').length} domains.`);
    };

    const handleSearch = () => {
        const domains = domainInput.split('\n').map(d => d.trim()).filter(Boolean);
        if (!domains.length) return toast.error('Enter at least one domain');
        if (domains.length > 200) return toast.error('Maximum 200 domains per search allowed');
        processDomains(domains);
    };

    const stopSearch = () => {
        stopRef.current = true;
        setLoading(false);
        toast('Stopped search early');
    };

    const toggleEmail = (email) => {
        setSelectedEmails(prev => {
            const next = new Set(prev);
            if (next.has(email)) next.delete(email); else next.add(email);
            return next;
        });
    };

    const selectAll = () => {
        const allEmails = results.flatMap(r => r.all_emails_flat || []);
        setSelectedEmails(new Set(allEmails));
    };

    const addToContacts = async () => {
        if (selectedEmails.size === 0) return toast.error('Select emails first');
        try {
            const emailsMapping = [...selectedEmails].map(email => {
                const result = results.find(r => (r.all_emails_flat || []).includes(email));
                return { 
                    email, 
                    domain: result?.domain || '',
                    phone: result?.phones?.[0] || '',
                    linkedin: result?.socials?.linkedin || '',
                    twitter: result?.socials?.twitter || '',
                    facebook: result?.socials?.facebook || '',
                    instagram: result?.socials?.instagram || '',
                    title: result?.title || '',
                    description: result?.description || '',
                };
            });
            const res = await api.post('/finder/add-to-contacts', { emails: emailsMapping });
            toast.success(`Added ${res.data.added} contacts`);
            setSelectedEmails(new Set());
        } catch { toast.error('Failed to add contacts'); }
    };

    const exportCSV = () => {
        let csv = 'Website URL,Domain,Title,Description,Phones,LinkedIn,Twitter,Facebook,Instagram,Status,Contact Emails,Editorial Emails,Advertising Emails,Support Emails,Other Emails,All Emails (Combined),Contact Form URL,Pages Checked,Confidence,Notes\n';

        results.forEach(r => {
            const escape = (str) => `"${(str || '').toString().replace(/"/g, '""')}"`;
            const joiner = (arr) => escape((arr || []).join('; '));

            csv += `${escape(r.url)},${escape(r.domain)},${escape(r.title)},${escape(r.description)},${joiner(r.phones)},${escape(r.socials?.linkedin)},${escape(r.socials?.twitter)},${escape(r.socials?.facebook)},${escape(r.socials?.instagram)},${escape(r.status)},${joiner(r.emails?.contact)},${joiner(r.emails?.editorial)},${joiner(r.emails?.advertising)},${joiner(r.emails?.support)},${joiner(r.emails?.other)},${joiner(r.all_emails_flat)},${escape(r.contact_form_url)},${joiner(r.pages_checked)},${escape(r.confidence)},${escape(r.notes || r.error)}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `email_finder_results_${new Date().toISOString().split('T')[0]}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'found': return <span className="badge badge-success"><CheckCircle className="w-3 h-3 mr-1" /> Found</span>;
            case 'contact_form_only': return <span className="badge badge-warning"><FileText className="w-3 h-3 mr-1" /> Form Only</span>;
            case 'not_found': return <span className="badge bg-surface-200 text-surface-600"><XCircle className="w-3 h-3 mr-1" /> Not Found</span>;
            case 'timeout': return <span className="badge badge-danger"><AlertCircle className="w-3 h-3 mr-1" /> Timeout</span>;
            case 'blocked': return <span className="badge badge-danger"><XCircle className="w-3 h-3 mr-1" /> Blocked</span>;
            case 'error': return <span className="badge badge-danger"><AlertCircle className="w-3 h-3 mr-1" /> Error</span>;
            default: return <span className="badge badge-info"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Scanning</span>;
        }
    };

    // Calculate Summary Stats
    const totalFound = results.filter(r => r.status === 'found').length;
    const totalForms = results.filter(r => r.status === 'contact_form_only').length;
    const totalNotFound = results.filter(r => r.status === 'not_found' || r.status === 'error' || r.status === 'timeout' || r.status === 'blocked').length;
    const successRate = results.length > 0 ? Math.round(((totalFound + totalForms) / results.length) * 100) : 0;
    const totalEmailsScraped = results.reduce((sum, r) => sum + (r.all_emails_flat?.length || 0), 0);
    const progressPercent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Email Hunter Agent</h1>
                <p className="text-surface-500 mt-1">Autonomous web intelligence agent to extract business emails.</p>
            </div>

            <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-5 h-5 text-primary-500" />
                    <h3 className="font-semibold text-surface-900 dark:text-white">Website URLs</h3>
                    <span className="text-xs text-surface-400 font-normal ml-auto">Paste up to 200 URLs (one per line)</span>
                </div>

                <textarea
                    value={domainInput}
                    onChange={e => setDomainInput(e.target.value)}
                    className="input resize-y min-h-[120px] font-mono text-sm leading-relaxed whitespace-nowrap"
                    placeholder="example.com&#10;https://another-domain.com&#10;technewsworld.com"
                    rows={6}
                    disabled={loading}
                />

                <div className="flex items-center gap-3 mt-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={advancedMode}
                            onChange={(e) => setAdvancedMode(e.target.checked)}
                            className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                            disabled={loading}
                        />
                        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Enable Advanced Stealth Mode (Bypass Cloudflare/Bots)</span>
                    </label>
                </div>

                <div className="flex gap-3 mt-2">
                    {!loading ? (
                        <button onClick={handleSearch} className="btn-primary w-full sm:w-auto px-8">
                            <Play className="w-4 h-4 mr-2" fill="currentColor" />
                            Start Agent
                        </button>
                    ) : (
                        <button onClick={stopSearch} className="btn-danger w-full sm:w-auto px-8">
                            <StopCircle className="w-4 h-4 mr-2" />
                            Stop Agent
                        </button>
                    )}
                </div>
            </div>

            {/* Live Progress Panel */}
            {(loading || results.length > 0) && (
                <div className="glass-card p-6 border-l-4 border-l-primary-500">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h3 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                                <PieChart className="w-4 h-4 text-primary-500" />
                                Agent Dashboard
                            </h3>
                            {loading && (
                                <p className="text-sm text-surface-500 mt-1 flex items-center gap-2 animate-pulse">
                                    <Loader2 className="w-3 h-3 animate-spin text-primary-500" />
                                    Scanning site {progress.current + 1}/{progress.total} — {progress.scanningUrl}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={selectAll} className="btn-secondary !text-sm">Select All</button>
                            <button onClick={addToContacts} disabled={selectedEmails.size === 0} className="btn-primary !text-sm">
                                <Plus className="w-3 h-3" /> Add Contacts ({selectedEmails.size})
                            </button>
                            <button onClick={exportCSV} disabled={results.length === 0} className="btn-secondary !text-sm">
                                <Download className="w-3 h-3 text-primary-600" /> Export CSV
                            </button>
                        </div>
                    </div>

                    {/* Summary Stats Bar */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6 pt-4 border-t border-surface-200 dark:border-surface-700">
                        <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                            <div className="text-xs text-surface-500 uppercase tracking-wider font-semibold">Total Sites</div>
                            <div className="text-xl font-bold text-surface-900 dark:text-white mt-1">{results.length} / {progress.total}</div>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800/30">
                            <div className="text-xs text-green-600 dark:text-green-400 uppercase tracking-wider font-semibold">Emails Found</div>
                            <div className="text-xl font-bold text-green-700 dark:text-green-300 mt-1">{totalEmailsScraped}</div>
                        </div>
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800/30">
                            <div className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider font-semibold">Contact Forms</div>
                            <div className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-1">{totalForms}</div>
                        </div>
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800/30">
                            <div className="text-xs text-red-600 dark:text-red-400 uppercase tracking-wider font-semibold">Not Found</div>
                            <div className="text-xl font-bold text-red-700 dark:text-red-300 mt-1">{totalNotFound}</div>
                        </div>
                        <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-100 dark:border-primary-800/30">
                            <div className="text-xs text-primary-600 dark:text-primary-400 uppercase tracking-wider font-semibold">Success Rate</div>
                            <div className="text-xl font-bold text-primary-700 dark:text-primary-300 mt-1">{successRate}%</div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {loading && (
                        <div className="w-full bg-surface-200 dark:bg-surface-800 rounded-full h-2.5 mb-6 overflow-hidden">
                            <div className="bg-primary-500 h-2.5 rounded-full transition-all duration-300 ease-out relative" style={{ width: `${progressPercent}%` }}>
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Results List */}
            {results.length > 0 && (
                <div className="space-y-4">
                    {[...results].reverse().map((r, i) => (
                        <div key={i} className="glass-card p-5 animate-in slide-in-from-left max-h-[500px] overflow-auto">
                            <div className="flex items-center justify-between mb-3 border-b border-surface-100 dark:border-surface-800 pb-3">
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-primary-500" />
                                    <span className="font-semibold text-surface-900 dark:text-white">{r.domain}</span>
                                    {r.pages_checked?.length > 0 && (
                                        <span className="text-xs text-surface-400 hidden sm:inline-block">({r.pages_checked.length} pages checked)</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    {r.confidence && <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${r.confidence === 'high' ? 'bg-green-100 text-green-700' : r.confidence === 'medium' ? 'bg-blue-100 text-blue-700' : 'bg-surface-200 text-surface-600'}`}>{r.confidence} Conf</span>}
                                    {getStatusBadge(r.status)}
                                </div>
                            </div>

                            {/* Enriched Data Section */}
                            {(r.title || r.description || (r.phones && r.phones.length > 0) || (r.socials && Object.values(r.socials).some(Boolean))) && (
                                <div className="mb-4 p-4 bg-surface-50 dark:bg-surface-800/50 rounded-lg border border-surface-100 dark:border-surface-700">
                                    {r.title && <h4 className="font-bold text-surface-900 dark:text-white mb-1 flex items-center gap-2"><Info className="w-4 h-4 text-primary-500" /> {r.title}</h4>}
                                    {r.description && <p className="text-sm text-surface-600 dark:text-surface-400 mb-3">{r.description}</p>}
                                    
                                    <div className="flex flex-wrap gap-4 mt-2">
                                        {r.phones && r.phones.length > 0 && (
                                            <div className="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300">
                                                <Phone className="w-4 h-4 text-emerald-500" />
                                                <span>{r.phones.join(', ')}</span>
                                            </div>
                                        )}
                                        {r.socials && Object.values(r.socials).some(Boolean) && (
                                            <div className="flex items-center gap-2">
                                                {r.socials.linkedin && <a href={r.socials.linkedin} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700"><Linkedin className="w-4 h-4" /></a>}
                                                {r.socials.twitter && <a href={r.socials.twitter} target="_blank" rel="noreferrer" className="text-sky-500 hover:text-sky-600"><Twitter className="w-4 h-4" /></a>}
                                                {r.socials.facebook && <a href={r.socials.facebook} target="_blank" rel="noreferrer" className="text-blue-700 hover:text-blue-800"><Facebook className="w-4 h-4" /></a>}
                                                {r.socials.instagram && <a href={r.socials.instagram} target="_blank" rel="noreferrer" className="text-pink-600 hover:text-pink-700"><Instagram className="w-4 h-4" /></a>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {r.notes && <p className="text-xs leading-relaxed text-surface-500 mb-4">{r.notes}</p>}

                            {r.status === 'contact_form_only' && r.contact_form_url && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded border border-amber-100 dark:border-amber-800/30 text-sm">
                                    <span className="font-semibold text-amber-800 dark:text-amber-400 mr-2">Contact Form found:</span>
                                    <a href={r.contact_form_url} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">{r.contact_form_url}</a>
                                </div>
                            )}

                            {r.all_emails_flat?.length > 0 && (
                                <div className="space-y-4">
                                    {['contact', 'editorial', 'advertising', 'support', 'other'].map(category => (
                                        r.emails?.[category]?.length > 0 && (
                                            <div key={category} className="space-y-1">
                                                <h4 className="text-xs font-semibold uppercase text-surface-400 pl-1">{category}</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                    {r.emails[category].map((email, j) => (
                                                        <label key={j} className="flex items-center gap-3 p-2.5 rounded-lg border border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-surface-800/50 cursor-pointer transition-all">
                                                            <input type="checkbox" checked={selectedEmails.has(email)} onChange={() => toggleEmail(email)}
                                                                className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500" />
                                                            <Mail className="w-4 h-4 text-surface-400" />
                                                            <span className="text-sm text-surface-900 dark:text-white font-medium truncate">{email}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
