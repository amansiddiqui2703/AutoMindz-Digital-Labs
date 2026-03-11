import { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { ListFilter, Plus, Trash2, Users, X, ChevronDown } from 'lucide-react';

const FIELDS = [
    { value: 'tag', label: 'Tag' },
    { value: 'source', label: 'Source' },
    { value: 'pipelineStage', label: 'Pipeline Stage' },
    { value: 'company', label: 'Company' },
    { value: 'emailCount', label: 'Email Count' },
    { value: 'lastEmailed', label: 'Last Emailed' },
    { value: 'isUnsubscribed', label: 'Unsubscribed' },
    { value: 'createdAt', label: 'Created At' },
];

const OPERATORS = {
    tag: ['equals', 'not_equals', 'contains', 'is_empty', 'is_not_empty'],
    source: ['equals', 'not_equals'],
    pipelineStage: ['equals', 'not_equals'],
    company: ['equals', 'contains', 'is_empty', 'is_not_empty'],
    emailCount: ['equals', 'greater_than', 'less_than'],
    lastEmailed: ['before', 'after', 'is_empty', 'is_not_empty'],
    isUnsubscribed: ['equals'],
    createdAt: ['before', 'after'],
};

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

export default function SmartLists() {
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [viewList, setViewList] = useState(null);
    const [viewContacts, setViewContacts] = useState([]);
    const [form, setForm] = useState({ name: '', description: '', color: '#3B82F6', matchType: 'all', filters: [{ field: 'tag', operator: 'equals', value: '' }] });

    const fetchLists = () => {
        api.get('/smart-lists')
            .then(res => setLists(res.data))
            .catch(() => toast.error('Failed to load smart lists'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchLists(); }, []);

    const createList = async (e) => {
        e.preventDefault();
        const validFilters = form.filters.filter(f => f.field && f.operator);
        if (!form.name.trim() || validFilters.length === 0) {
            toast.error('Name and at least one filter required');
            return;
        }
        try {
            await api.post('/smart-lists', { ...form, filters: validFilters });
            toast.success('Smart list created!');
            setShowCreate(false);
            setForm({ name: '', description: '', color: '#3B82F6', matchType: 'all', filters: [{ field: 'tag', operator: 'equals', value: '' }] });
            fetchLists();
        } catch { toast.error('Failed to create smart list'); }
    };

    const deleteList = async (id) => {
        if (!confirm('Delete this smart list?')) return;
        try {
            await api.delete(`/smart-lists/${id}`);
            toast.success('Deleted');
            fetchLists();
            if (viewList === id) setViewList(null);
        } catch { toast.error('Failed'); }
    };

    const viewListContacts = async (id) => {
        setViewList(id);
        try {
            const res = await api.get(`/smart-lists/${id}/contacts`);
            setViewContacts(res.data.contacts);
        } catch { toast.error('Failed to fetch contacts'); }
    };

    const addFilter = () => {
        setForm({ ...form, filters: [...form.filters, { field: 'tag', operator: 'equals', value: '' }] });
    };

    const removeFilter = (i) => {
        const filters = form.filters.filter((_, j) => j !== i);
        setForm({ ...form, filters: filters.length ? filters : [{ field: 'tag', operator: 'equals', value: '' }] });
    };

    const updateFilter = (i, key, val) => {
        const filters = [...form.filters];
        filters[i] = { ...filters[i], [key]: val };
        if (key === 'field') filters[i].operator = OPERATORS[val][0];
        setForm({ ...form, filters });
    };

    if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Smart Lists</h1>
                    <p className="text-surface-500 mt-1">Dynamic contact segments based on filters</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Smart List</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lists */}
                <div className="space-y-3">
                    {lists.length === 0 ? (
                        <div className="glass-card p-10 text-center">
                            <ListFilter className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                            <p className="text-surface-500">No smart lists yet</p>
                        </div>
                    ) : lists.map(list => (
                        <div key={list._id}
                            onClick={() => viewListContacts(list._id)}
                            className={`glass-card p-4 cursor-pointer transition-all hover:shadow-md ${viewList === list._id ? 'ring-2 ring-primary-500' : ''}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ background: list.color }} />
                                    <div>
                                        <h3 className="font-semibold text-surface-900 dark:text-white text-sm">{list.name}</h3>
                                        <p className="text-xs text-surface-400">{list.filters?.length || 0} filter(s) · {list.matchType}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-primary-500">{list.cachedCount}</span>
                                    <button onClick={(e) => { e.stopPropagation(); deleteList(list._id); }}
                                        className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100">
                                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contacts View */}
                <div className="lg:col-span-2">
                    {viewList && viewContacts.length > 0 ? (
                        <div className="glass-card p-5">
                            <h3 className="font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary-500" />
                                {viewContacts.length} matching contacts
                            </h3>
                            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                {viewContacts.map(c => (
                                    <div key={c._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                                        <div>
                                            <div className="text-sm font-medium text-surface-900 dark:text-white">{c.name || c.email}</div>
                                            <div className="text-xs text-surface-400">{c.email} {c.company && `· ${c.company}`}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500">{c.pipelineStage}</span>
                                            <span className="text-xs text-surface-400">{c.emailCount || 0} emails</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card p-16 text-center">
                            <ListFilter className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                            <p className="text-surface-500">Select a smart list to view contacts</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
                    <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-surface-900 dark:text-white">New Smart List</h2>
                            <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg">
                                <X className="w-5 h-5 text-surface-400" />
                            </button>
                        </div>
                        <form onSubmit={createList} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Name *</label>
                                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. Not contacted in 30 days" className="input-field w-full" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Match</label>
                                <select value={form.matchType} onChange={e => setForm({ ...form, matchType: e.target.value })} className="input-field w-full">
                                    <option value="all">ALL conditions (AND)</option>
                                    <option value="any">ANY condition (OR)</option>
                                </select>
                            </div>

                            {/* Filters */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">Filters</label>
                                {form.filters.map((f, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <select value={f.field} onChange={e => updateFilter(i, 'field', e.target.value)} className="input-field flex-1 text-sm">
                                            {FIELDS.map(field => <option key={field.value} value={field.value}>{field.label}</option>)}
                                        </select>
                                        <select value={f.operator} onChange={e => updateFilter(i, 'operator', e.target.value)} className="input-field flex-1 text-sm">
                                            {(OPERATORS[f.field] || []).map(op => <option key={op} value={op}>{op.replace(/_/g, ' ')}</option>)}
                                        </select>
                                        {!['is_empty', 'is_not_empty'].includes(f.operator) && (
                                            <input type={f.field.includes('At') || f.field === 'lastEmailed' ? 'date' : 'text'}
                                                value={f.value || ''} onChange={e => updateFilter(i, 'value', e.target.value)}
                                                placeholder="Value" className="input-field flex-1 text-sm" />
                                        )}
                                        <button type="button" onClick={() => removeFilter(i)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg">
                                            <X className="w-4 h-4 text-red-400" />
                                        </button>
                                    </div>
                                ))}
                                <button type="button" onClick={addFilter} className="text-sm text-primary-500 font-medium hover:underline flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Add filter
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Color</label>
                                <div className="flex gap-2">
                                    {COLORS.map(c => (
                                        <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                                            className={`w-7 h-7 rounded-lg transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : ''}`}
                                            style={{ background: c }} />
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1">Create List</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
