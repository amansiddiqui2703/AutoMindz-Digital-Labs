import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
    FolderKanban, Plus, Archive, RotateCcw, Trash2, Users, Send, X,
    MoreVertical, Pencil, ChevronRight
} from 'lucide-react';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#6366F1'];

export default function Projects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', color: '#3B82F6' });
    const [showArchived, setShowArchived] = useState(false);
    const [menuOpen, setMenuOpen] = useState(null);

    const fetchProjects = () => {
        api.get(`/projects?archived=${showArchived}`)
            .then(res => setProjects(res.data))
            .catch(() => toast.error('Failed to load projects'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchProjects(); }, [showArchived]);

    const createProject = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        try {
            await api.post('/projects', form);
            toast.success('Project created!');
            setShowCreate(false);
            setForm({ name: '', description: '', color: '#3B82F6' });
            fetchProjects();
        } catch { toast.error('Failed to create project'); }
    };

    const archiveProject = async (id) => {
        try {
            await api.patch(`/projects/${id}/archive`);
            toast.success(showArchived ? 'Project restored' : 'Project archived');
            fetchProjects();
        } catch { toast.error('Failed'); }
        setMenuOpen(null);
    };

    const deleteProject = async (id) => {
        if (!confirm('Delete this project? Contacts will be unlinked but not deleted.')) return;
        try {
            await api.delete(`/projects/${id}`);
            toast.success('Project deleted');
            fetchProjects();
        } catch { toast.error('Failed'); }
        setMenuOpen(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Projects</h1>
                    <p className="text-surface-500 mt-1">Organize your outreach into separate workspaces</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={`btn-secondary text-sm ${showArchived ? '!bg-amber-50 !text-amber-600 dark:!bg-amber-500/10' : ''}`}
                    >
                        <Archive className="w-4 h-4" />
                        {showArchived ? 'Archived' : 'Show Archived'}
                    </button>
                    <button onClick={() => setShowCreate(true)} className="btn-primary">
                        <Plus className="w-4 h-4" /> New Project
                    </button>
                </div>
            </div>

            {/* Projects Grid */}
            {projects.length === 0 ? (
                <div className="glass-card p-16 text-center">
                    <FolderKanban className="w-16 h-16 text-surface-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-surface-700 dark:text-surface-300 mb-2">
                        {showArchived ? 'No archived projects' : 'No projects yet'}
                    </h3>
                    <p className="text-surface-400 mb-6">Create a project to organize your contacts and campaigns</p>
                    {!showArchived && (
                        <button onClick={() => setShowCreate(true)} className="btn-primary">
                            <Plus className="w-4 h-4" /> Create Your First Project
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {projects.map(p => (
                        <div key={p._id} className="glass-card p-5 group hover:shadow-lg transition-all relative">
                            {/* Menu */}
                            <div className="absolute top-4 right-4">
                                <button onClick={() => setMenuOpen(menuOpen === p._id ? null : p._id)}
                                    className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="w-4 h-4 text-surface-400" />
                                </button>
                                {menuOpen === p._id && (
                                    <div className="absolute right-0 top-8 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl p-1.5 z-10 min-w-[150px]">
                                        <button onClick={() => archiveProject(p._id)}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg">
                                            {showArchived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                                            {showArchived ? 'Restore' : 'Archive'}
                                        </button>
                                        <button onClick={() => deleteProject(p._id)}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg">
                                            <Trash2 className="w-4 h-4" /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Project Info */}
                            <Link to={`/projects/${p._id}`} className="block">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: p.color + '20' }}>
                                        <FolderKanban className="w-5 h-5" style={{ color: p.color }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-surface-900 dark:text-white truncate">{p.name}</h3>
                                        {p.description && <p className="text-xs text-surface-400 truncate">{p.description}</p>}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1.5 text-surface-500">
                                        <Users className="w-3.5 h-3.5" />
                                        <span className="font-medium">{p.stats?.contacts || 0}</span>
                                        <span className="text-surface-400">contacts</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-surface-500">
                                        <Send className="w-3.5 h-3.5" />
                                        <span className="font-medium">{p.stats?.campaigns || 0}</span>
                                        <span className="text-surface-400">campaigns</span>
                                    </div>
                                </div>

                                {/* Pipeline Preview */}
                                <div className="mt-4 flex gap-1">
                                    {(p.pipelineStages || []).slice(0, 5).map((s, i) => (
                                        <div key={i} className="flex-1 h-1.5 rounded-full" style={{ background: s.color + '40' }} />
                                    ))}
                                </div>

                                <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Open Project <ChevronRight className="w-3 h-3" />
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
                    <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-surface-900 dark:text-white">New Project</h2>
                            <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg">
                                <X className="w-5 h-5 text-surface-400" />
                            </button>
                        </div>
                        <form onSubmit={createProject} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Project Name *</label>
                                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. Link Building Q1, Guest Post Outreach"
                                    className="input-field w-full" autoFocus required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                    placeholder="What is this project about?" rows={3}
                                    className="input-field w-full resize-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Color</label>
                                <div className="flex gap-2">
                                    {COLORS.map(c => (
                                        <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                                            className={`w-8 h-8 rounded-lg transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : 'hover:scale-105'}`}
                                            style={{ background: c }} />
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1">Create Project</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
