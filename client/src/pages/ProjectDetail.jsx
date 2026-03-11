import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
    ArrowLeft, Users, Send, Mail, GripVertical,
    ChevronRight, Building, Globe, ExternalLink
} from 'lucide-react';

export default function ProjectDetail() {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dragging, setDragging] = useState(null);
    const [dragOver, setDragOver] = useState(null);

    const fetchPipeline = () => {
        api.get(`/projects/${id}/pipeline`)
            .then(res => {
                setProject(res.data.project);
                setColumns(res.data.columns);
            })
            .catch(() => toast.error('Failed to load project'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchPipeline(); }, [id]);

    const moveContact = async (contactId, newStage) => {
        try {
            await api.patch(`/projects/${id}/pipeline/move`, { contactId, stage: newStage });
            fetchPipeline();
        } catch { toast.error('Failed to move contact'); }
    };

    const handleDragStart = (e, contactId) => {
        setDragging(contactId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, stageName) => {
        e.preventDefault();
        setDragOver(stageName);
    };

    const handleDrop = (e, stageName) => {
        e.preventDefault();
        if (dragging) {
            moveContact(dragging, stageName);
        }
        setDragging(null);
        setDragOver(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="text-center py-20">
                <p className="text-surface-500">Project not found</p>
                <Link to="/projects" className="text-primary-500 hover:underline mt-2 inline-block">← Back to Projects</Link>
            </div>
        );
    }

    const totalContacts = columns.reduce((sum, col) => sum + col.contacts.length, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/projects" className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-surface-400" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: project.color + '20' }}>
                            <Send className="w-6 h-6" style={{ color: project.color }} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{project.name}</h1>
                            {project.description && <p className="text-sm text-surface-400">{project.description}</p>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-6 text-sm text-surface-500">
                    <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        <span className="font-semibold text-surface-700 dark:text-surface-300">{totalContacts}</span> contacts
                    </div>
                </div>
            </div>

            {/* Pipeline Stage Summary */}
            <div className="flex gap-2">
                {columns.map((col, i) => (
                    <div key={i} className="flex-1 glass-card p-3 text-center">
                        <div className="text-xs font-medium text-surface-400 mb-1">{col.name}</div>
                        <div className="text-xl font-bold" style={{ color: col.color }}>{col.contacts.length}</div>
                    </div>
                ))}
            </div>

            {/* Kanban Board */}
            <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '500px' }}>
                {columns.map((col, i) => (
                    <div
                        key={i}
                        className={`flex-shrink-0 w-72 rounded-2xl transition-all ${dragOver === col.name ? 'bg-primary-50 dark:bg-primary-500/5 ring-2 ring-primary-300 ring-dashed' : 'bg-surface-50 dark:bg-surface-900/50'
                            }`}
                        onDragOver={(e) => handleDragOver(e, col.name)}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={(e) => handleDrop(e, col.name)}
                    >
                        {/* Column Header */}
                        <div className="px-4 py-3 flex items-center justify-between border-b-2" style={{ borderColor: col.color }}>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                                <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">{col.name}</span>
                            </div>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: col.color + '20', color: col.color }}>
                                {col.contacts.length}
                            </span>
                        </div>

                        {/* Cards */}
                        <div className="p-2 space-y-2 min-h-[400px]">
                            {col.contacts.length === 0 && (
                                <div className="text-center py-8 text-xs text-surface-400">
                                    Drop contacts here
                                </div>
                            )}
                            {col.contacts.map(contact => (
                                <div
                                    key={contact._id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, contact._id)}
                                    onDragEnd={() => { setDragging(null); setDragOver(null); }}
                                    className={`bg-white dark:bg-surface-800 rounded-xl p-3 shadow-sm border border-surface-200 dark:border-surface-700 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group ${dragging === contact._id ? 'opacity-50 scale-95' : ''
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 min-w-0">
                                            <Link to={`/contacts/${contact._id}`} className="text-sm font-semibold text-surface-900 dark:text-white hover:text-primary-500 truncate block">
                                                {contact.name || contact.email}
                                            </Link>
                                            <p className="text-xs text-surface-400 truncate">{contact.email}</p>
                                        </div>
                                        <GripVertical className="w-4 h-4 text-surface-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                    </div>

                                    {contact.company && (
                                        <div className="flex items-center gap-1 text-xs text-surface-400 mb-1">
                                            <Building className="w-3 h-3" /> {contact.company}
                                        </div>
                                    )}
                                    {contact.website && (
                                        <div className="flex items-center gap-1 text-xs text-surface-400">
                                            <Globe className="w-3 h-3" /> {contact.website}
                                        </div>
                                    )}

                                    {/* Tags */}
                                    {contact.tags?.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {contact.tags.slice(0, 3).map((tag, j) => (
                                                <span key={j} className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {contact.emailCount > 0 && (
                                        <div className="mt-2 flex items-center gap-1 text-[10px] text-surface-400">
                                            <Mail className="w-3 h-3" /> {contact.emailCount} emails sent
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
