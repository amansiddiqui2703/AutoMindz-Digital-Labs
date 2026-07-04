import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { Plus, Upload, Download, Trash2, Search, Users, X, Filter, Globe, Phone, Facebook, Linkedin, Twitter, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Contacts() {
    const navigate = useNavigate();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');
    const [listFilter, setListFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [activeTab, setActiveTab] = useState('contacts'); // 'contacts' | 'finders'
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ email: '', name: '', company: '', source: 'manual', lists: '' });

    const fetchContacts = () => {
        if (activeTab !== 'contacts') return;
        setLoading(true);
        const params = { page, search, limit: 50 };
        if (sourceFilter) params.source = sourceFilter;
        if (listFilter) params.list = listFilter;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        api.get('/contacts', { params })
            .then(r => { setContacts(r.data.contacts); setTotal(r.data.total); })
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchContacts(); }, [page, search, sourceFilter, listFilter, startDate, endDate, activeTab]);

    const addContact = async () => {
        if (!form.email) return;
        try {
            const payload = { ...form, lists: form.lists ? [form.lists] : [] };
            await api.post('/contacts', payload);
            toast.success('Contact added');
            setForm({ email: '', name: '', company: '', source: 'manual', lists: '' });
            setShowAdd(false);
            fetchContacts();
        } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    };

    const deleteContact = async (id) => {
        if (!confirm('Delete contact permanently (GDPR)?')) return;
        try {
            await api.delete(`/contacts/${id}`);
            toast.success('Contact deleted');
            fetchContacts();
        } catch { toast.error('Failed'); }
    };

    const onDrop = useCallback(async (files) => {
        if (!files.length) return;
        const formData = new FormData();
        formData.append('file', files[0]);
        try {
            const res = await api.post('/contacts/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success(`Imported ${res.data.imported} contacts (${res.data.skipped} skipped)`);
            fetchContacts();
        } catch { toast.error('Upload failed'); }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'text/csv': ['.csv'] }, maxFiles: 1 });

    const exportCSV = async () => {
        try {
            const res = await api.get('/contacts/export', { responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url; a.download = 'contacts.csv'; a.click();
            URL.revokeObjectURL(url);
            toast.success('Contacts exported');
        } catch { toast.error('Export failed'); }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Master Audience</h1>
                    <p className="text-surface-500 mt-1">{total} total contacts in your CRM</p>
                </div>
                {activeTab === 'contacts' && (
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={exportCSV} className="btn-secondary flex-1 sm:flex-none justify-center"><Download className="w-4 h-4" /> Export</button>
                        <button onClick={() => setShowAdd(true)} className="btn-primary flex-1 sm:flex-none justify-center"><Plus className="w-4 h-4" /> Add Contact</button>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-surface-200 dark:border-surface-800">
                <button
                    onClick={() => setActiveTab('contacts')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'contacts' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-surface-500 hover:text-surface-700'}`}
                >
                    All Contacts
                </button>
                <button
                    onClick={() => setActiveTab('finders')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'finders' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-surface-500 hover:text-surface-700'}`}
                >
                    Lead Finders
                </button>
            </div>

            {activeTab === 'finders' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in">
                    <Link to="/finder" className="glass-card p-6 flex flex-col items-center text-center hover:border-primary-500 transition-colors group">
                        <div className="w-16 h-16 bg-primary-50 dark:bg-primary-500/10 rounded-2xl flex items-center justify-center text-primary-500 mb-4 group-hover:scale-110 transition-transform">
                            <Search className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-surface-900 dark:text-white">Website Email Extractor</h3>
                        <p className="text-surface-500 text-sm mt-2">Automatically crawl websites to find decision-maker emails and bulk add them to your audience.</p>
                    </Link>
                    <Link to="/seo" className="glass-card p-6 flex flex-col items-center text-center hover:border-accent-500 transition-colors group">
                        <div className="w-16 h-16 bg-accent-50 dark:bg-accent-500/10 rounded-2xl flex items-center justify-center text-accent-500 mb-4 group-hover:scale-110 transition-transform">
                            <Globe className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-surface-900 dark:text-white">SEO Domain Checker</h3>
                        <p className="text-surface-500 text-sm mt-2">Check Domain Authority and backlink stats before pitching specific blogs or journalists.</p>
                    </Link>
                </div>
            )}

            {activeTab === 'contacts' && (
                <>
                    {/* CSV Upload */}
            <div {...getRootProps()} className={`glass-card p-8 text-center cursor-pointer border-2 border-dashed transition-all ${isDragActive ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-500/5' : 'border-surface-300 dark:border-surface-600'}`}>
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 text-surface-400 mx-auto mb-3" />
                <p className="text-surface-600 dark:text-surface-300 text-sm font-medium">
                    {isDragActive ? 'Drop CSV file here...' : 'Drag & drop CSV file here, or click to browse'}
                </p>
                <p className="text-surface-400 text-xs mt-1">Columns: email, name, company (+ any custom fields)</p>
            </div>

            {/* Add manual contact */}
            {showAdd && (
                <div className="glass-card p-6 animate-in">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-surface-900 dark:text-white">Add Contact</h3>
                        <button onClick={() => setShowAdd(false)}><X className="w-4 h-4 text-surface-400" /></button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" placeholder="Any email address" />
                        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" placeholder="Name (optional)" />
                        <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="input" placeholder="Company (optional)" />
                        <input value={form.lists} onChange={e => setForm({ ...form, lists: e.target.value })} className="input" placeholder="List Name (e.g. SEO Leads)" />
                    </div>
                    <button onClick={addContact} className="btn-primary mt-4">Add Contact</button>
                </div>
            )}

            {/* Advanced Filters */}
            <div className="flex flex-wrap items-center gap-4 p-4 glass-card rounded-xl">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search name/email..." className="input pl-10 h-10 w-full" />
                </div>
                <select value={sourceFilter} onChange={e => { setSourceFilter(e.target.value); setPage(1); }} className="input h-10 w-auto">
                    <option value="">All Sources</option>
                    <option value="manual">Manual Entry</option>
                    <option value="csv">CSV Upload</option>
                    <option value="finder">Website Finder</option>
                </select>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-surface-500">From:</span>
                    <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} className="input h-10" />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-surface-500">To:</span>
                    <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} className="input h-10" />
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : contacts.length === 0 ? (
                <div className="text-center py-16 glass-card">
                    <Users className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300">No contacts</h3>
                    <p className="text-surface-400 mt-1">Upload a CSV or add contacts manually</p>
                </div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="data-table min-w-[800px]">
                        <thead>
                            <tr>
                                <th>Email</th><th>Name</th><th>Company</th><th>Enrichment</th><th>Source</th><th>Status</th><th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {contacts.map(c => (
                                <tr
                                    key={c._id}
                                    onClick={() => navigate(`/contacts/${c._id}`)}
                                    className="cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors group"
                                >
                                    <td className="font-medium text-primary-600 dark:text-primary-400 group-hover:underline">{c.email}</td>
                                    <td>{c.name || '—'}</td>
                                    <td>{c.company || '—'}</td>
                                    <td>
                                        <div className="flex gap-1.5 items-center">
                                            {c.phone && <Phone className="w-3.5 h-3.5 text-emerald-500" title={c.phone} />}
                                            {c.linkedIn && <Linkedin className="w-3.5 h-3.5 text-blue-600" title={c.linkedIn} />}
                                            {c.twitter && <Twitter className="w-3.5 h-3.5 text-sky-500" title={c.twitter} />}
                                            {c.customFields?.facebook && <Facebook className="w-3.5 h-3.5 text-blue-700" title={c.customFields.facebook} />}
                                            {c.customFields?.instagram && <Instagram className="w-3.5 h-3.5 text-pink-600" title={c.customFields.instagram} />}
                                            {!c.phone && !c.linkedIn && !c.twitter && !c.customFields?.facebook && !c.customFields?.instagram && <span className="text-surface-300 text-xs">—</span>}
                                        </div>
                                    </td>
                                    <td><span className="badge badge-info">{c.source}</span></td>
                                    <td>{c.isUnsubscribed ? <span className="badge badge-danger">Unsubscribed</span> : <span className="badge badge-success">Active</span>}</td>
                                    <td>
                                        <button onClick={() => deleteContact(c._id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {total > 50 && (
                <div className="flex justify-center gap-2">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary !text-sm">Previous</button>
                    <span className="px-4 py-2 text-sm text-surface-500">Page {page}</span>
                    <button disabled={contacts.length < 50} onClick={() => setPage(p => p + 1)} className="btn-secondary !text-sm">Next</button>
                </div>
            )}
                </>
            )}
        </div>
    );
}
