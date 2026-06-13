import { useState, useEffect } from 'react';
import api from '../api/client';
import { ShieldOff, Plus, Trash2, Upload, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SuppressionList() {
    const [suppressions, setSuppressions] = useState([]);
    const [bulkInput, setBulkInput] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSuppressions();
    }, []);

    const fetchSuppressions = async () => {
        try {
            const { data } = await api.get('/contacts/suppression');
            setSuppressions(data.data || []);
        } catch (error) {
            toast.error('Failed to load suppression list');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkAdd = async () => {
        if (!bulkInput.trim()) return;
        const emails = bulkInput.split(/[\n,]+/).map(e => e.trim()).filter(e => e);
        
        try {
            await api.post('/contacts/suppression', { emails });
            toast.success(`Added emails to suppression list`);
            setBulkInput('');
            fetchSuppressions();
        } catch (error) {
            toast.error('Failed to add emails');
        }
    };

    const handleDelete = async (email) => {
        try {
            await api.delete(`/contacts/suppression/${encodeURIComponent(email)}`);
            setSuppressions(prev => prev.filter(s => s.email !== email));
            toast.success('Removed from suppression list');
        } catch (error) {
            toast.error('Failed to remove email');
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
                        <ShieldOff className="w-6 h-6 text-red-500" />
                        Global Suppression List
                    </h1>
                    <p className="text-sm text-surface-500 mt-1">Emails listed here will never receive campaigns.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card p-6">
                        <h3 className="font-semibold mb-4 text-surface-800 dark:text-surface-200">Bulk Add Emails</h3>
                        <textarea
                            value={bulkInput}
                            onChange={(e) => setBulkInput(e.target.value)}
                            placeholder="Enter emails separated by commas or new lines..."
                            className="w-full h-40 bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 rounded-xl p-3 text-sm outline-none focus:border-primary-500 transition-colors resize-none mb-4"
                        />
                        <button 
                            onClick={handleBulkAdd}
                            className="w-full py-2.5 bg-gradient-to-br from-primary-500 to-accent-500 text-white rounded-xl font-medium hover:-translate-y-1 transition-transform shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Add to List
                        </button>
                    </div>

                    <div className="glass-card p-6 border-l-4 border-l-accent-500">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-accent-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-surface-600 dark:text-surface-400">
                                You can also use the Contacts page to import a CSV directly into the suppression list using the existing CSV tool.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 glass-card overflow-hidden flex flex-col h-[600px]">
                    <div className="p-4 border-b border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                        <h3 className="font-semibold text-surface-800 dark:text-surface-200">Suppressed Addresses ({suppressions.length})</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {loading ? (
                            <div className="p-8 text-center text-surface-500">Loading...</div>
                        ) : suppressions.length === 0 ? (
                            <div className="p-8 text-center text-surface-500">No emails in suppression list.</div>
                        ) : (
                            <ul className="space-y-1">
                                {suppressions.map((item) => (
                                    <li key={item._id || item.email} className="flex items-center justify-between p-3 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center text-red-500 font-medium text-xs shrink-0">
                                                {item.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">{item.email}</p>
                                                <p className="text-xs text-surface-500">Added {new Date(item.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDelete(item.email)}
                                            className="p-2 text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
