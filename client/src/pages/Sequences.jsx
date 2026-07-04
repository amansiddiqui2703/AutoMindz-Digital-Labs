import { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { Plus, Trash2, FileText, ArrowLeft, Save, PlusCircle, Clock } from 'lucide-react';

export default function Sequences() {
    const [sequences, setSequences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list' | 'edit'
    const [editingSeq, setEditingSeq] = useState({ name: '', steps: [{ subject: '', body: '', delayDays: 0 }] });

    const fetchSequences = () => {
        setLoading(true);
        api.get('/sequences').then(r => setSequences(r.data.sequences)).catch(() => {}).finally(() => setLoading(false));
    };

    useEffect(() => { fetchSequences(); }, []);

    const saveSequence = async () => {
        if (!editingSeq.name.trim()) return toast.error('Name is required');
        if (editingSeq.steps.length === 0) return toast.error('At least one step is required');
        if (!editingSeq.steps[0].subject.trim()) return toast.error('First step must have a subject');
        if (editingSeq.steps.some(s => !s.body.trim())) return toast.error('All steps must have email content');

        try {
            if (editingSeq._id) {
                await api.put(`/sequences/${editingSeq._id}`, editingSeq);
                toast.success('Sequence updated');
            } else {
                await api.post('/sequences', editingSeq);
                toast.success('Sequence created');
            }
            setView('list');
            fetchSequences();
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed to save');
        }
    };

    const deleteSequence = async (id) => {
        if (!confirm('Delete this sequence?')) return;
        try {
            await api.delete(`/sequences/${id}`);
            toast.success('Sequence deleted');
            fetchSequences();
        } catch (e) { toast.error(e.response?.data?.error || 'Failed to delete'); }
    };

    const addStep = () => {
        setEditingSeq(prev => ({
            ...prev,
            steps: [...prev.steps, { subject: '', body: '', delayDays: 3 }]
        }));
    };

    const updateStep = (index, field, value) => {
        const newSteps = [...editingSeq.steps];
        newSteps[index][field] = value;
        setEditingSeq({ ...editingSeq, steps: newSteps });
    };

    const removeStep = (index) => {
        setEditingSeq(prev => ({
            ...prev,
            steps: prev.steps.filter((_, i) => i !== index)
        }));
    };

    if (view === 'edit') {
        return (
            <div className="space-y-6 max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView('list')} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-surface-600 dark:text-surface-400" />
                        </button>
                        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                            {editingSeq._id ? 'Edit Sequence' : 'New Sequence'}
                        </h1>
                    </div>
                    <button onClick={saveSequence} className="btn-primary w-full sm:w-auto justify-center">
                        <Save className="w-4 h-4" /> Save Sequence
                    </button>
                </div>

                <div className="glass-card p-6">
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Sequence Name</label>
                    <input 
                        value={editingSeq.name} 
                        onChange={e => setEditingSeq({ ...editingSeq, name: e.target.value })} 
                        className="input w-full text-lg font-medium" 
                        placeholder="e.g. Cold Outreach Q3" 
                        autoFocus 
                    />
                </div>

                <div className="space-y-6">
                    {editingSeq.steps.map((step, idx) => (
                        <div key={idx} className="relative pl-12">
                            {/* Timeline line */}
                            {idx < editingSeq.steps.length - 1 && (
                                <div className="absolute left-5 top-14 bottom-[-40px] w-0.5 bg-surface-200 dark:bg-surface-700"></div>
                            )}
                            
                            {/* Step Number Badge */}
                            <div className="absolute left-0 top-6 w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold flex items-center justify-center border-2 border-white dark:border-surface-900 z-10 shadow-sm">
                                {idx + 1}
                            </div>

                            <div className="glass-card p-6 transition-all hover:border-primary-200 dark:hover:border-primary-800/50">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-lg text-surface-900 dark:text-white">
                                        {idx === 0 ? 'First Touch' : `Follow-up ${idx}`}
                                    </h3>
                                    {idx > 0 && (
                                        <button onClick={() => removeStep(idx)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-1.5 rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {idx > 0 && (
                                    <div className="flex items-center gap-3 mb-4 p-3 bg-surface-50 dark:bg-surface-800/50 rounded-lg border border-surface-200 dark:border-surface-700">
                                        <Clock className="w-4 h-4 text-surface-500" />
                                        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Wait</span>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            value={step.delayDays} 
                                            onChange={e => updateStep(idx, 'delayDays', parseInt(e.target.value) || 0)} 
                                            className="input w-20 h-8 px-2 text-center" 
                                        />
                                        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">days if no reply</span>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {idx === 0 && (
                                        <div>
                                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Subject</label>
                                            <input 
                                                value={step.subject} 
                                                onChange={e => updateStep(idx, 'subject', e.target.value)} 
                                                className="input w-full" 
                                                placeholder="Write an eye-catching subject line..." 
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Email Body</label>
                                        <textarea 
                                            value={step.body} 
                                            onChange={e => updateStep(idx, 'body', e.target.value)} 
                                            className="input w-full min-h-[150px] resize-y font-mono text-sm" 
                                            placeholder="Hi {{first_name}}, ..."
                                        />
                                        <p className="text-xs text-surface-500 mt-2">Available variables: {'{{email}}, {{name}}, {{company}}'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pl-12 pt-4">
                    <button onClick={addStep} className="btn-secondary w-full border-dashed border-2 bg-transparent hover:bg-surface-50 dark:hover:bg-surface-800 py-4 h-auto">
                        <PlusCircle className="w-5 h-5 mx-auto mb-1 text-surface-400" />
                        <span className="text-surface-500 font-medium">Add Step</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Sequences</h1>
                    <p className="text-surface-500 mt-1">Multi-step drip campaigns to automate your outreach</p>
                </div>
                <button 
                    onClick={() => {
                        setEditingSeq({ name: '', steps: [{ subject: '', body: '', delayDays: 0 }] });
                        setView('edit');
                    }} 
                    className="btn-primary w-full sm:w-auto justify-center"
                >
                    <Plus className="w-4 h-4" /> Create Sequence
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : sequences.length === 0 ? (
                <div className="text-center py-16 glass-card border-dashed border-2">
                    <FileText className="w-16 h-16 text-surface-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-2">No sequences yet</h3>
                    <p className="text-surface-500 mb-6 max-w-sm mx-auto">Build an automated sequence with follow-ups to maximize your response rate.</p>
                    <button 
                        onClick={() => {
                            setEditingSeq({ name: '', steps: [{ subject: '', body: '', delayDays: 0 }] });
                            setView('edit');
                        }} 
                        className="btn-primary mx-auto"
                    >
                        <Plus className="w-4 h-4" /> Create Your First Sequence
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {sequences.map(s => (
                        <div key={s._id} className="glass-card p-6 flex flex-col group hover:shadow-lg transition-all border-l-4 border-l-primary-500">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center text-primary-500">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => deleteSequence(s._id)} className="p-2 text-surface-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            
                            <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2 truncate">{s.name}</h3>
                            
                            <div className="mt-auto pt-4 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between text-sm">
                                <span className="font-medium text-surface-500 bg-surface-100 dark:bg-surface-800 px-3 py-1 rounded-full">
                                    {s.steps.length} {s.steps.length === 1 ? 'step' : 'steps'}
                                </span>
                                <button 
                                    onClick={() => {
                                        setEditingSeq({ ...s });
                                        setView('edit');
                                    }} 
                                    className="font-medium text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 group-hover:underline"
                                >
                                    Edit Sequence &rarr;
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
