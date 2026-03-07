import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TLink from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
    FileText, Plus, Trash2, Edit3, Save, X, Eye, Bold, Italic,
    Underline as UIcon, Link2, AlignLeft, AlignCenter, AlignRight,
    List, ListOrdered, Search, Loader2, Copy, Clock
} from 'lucide-react';

const categories = ['cold-outreach', 'follow-up', 'newsletter', 'transactional', 'custom'];

const ToolBtn = ({ icon: Icon, active, onClick, title }) => (
    <button onClick={onClick} title={title}
        className={`p-1.5 rounded-lg transition-all ${active ? 'bg-primary-100 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400' : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800'}`}>
        <Icon className="w-4 h-4" />
    </button>
);

export default function Templates() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null); // null or template object
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [saving, setSaving] = useState(false);

    // Form state
    const [formName, setFormName] = useState('');
    const [formSubject, setFormSubject] = useState('');
    const [formCategory, setFormCategory] = useState('outreach');
    const [previewId, setPreviewId] = useState(null);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TLink.configure({ openOnClick: false }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Placeholder.configure({ placeholder: 'Write your email template...' }),
        ],
        content: '',
    });

    const fetchTemplates = async () => {
        try {
            const params = filterCategory ? `?category=${filterCategory}` : '';
            const res = await api.get(`/templates${params}`);
            setTemplates(res.data.templates || []);
        } catch {
            toast.error('Failed to fetch templates');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, [filterCategory]);

    const startNew = () => {
        setEditing({ _new: true });
        setFormName('');
        setFormSubject('');
        setFormCategory('cold-outreach');
        if (editor) editor.commands.setContent('');
    };

    const startEdit = (template) => {
        setEditing(template);
        setFormName(template.name);
        setFormSubject(template.subject || '');
        setFormCategory(template.category || 'outreach');
        if (editor) editor.commands.setContent(template.htmlBody || '');
    };

    const handleSave = async () => {
        if (!formName.trim()) return toast.error('Template name is required');
        setSaving(true);
        try {
            const htmlBody = editor?.getHTML() || '';
            const payload = { name: formName, subject: formSubject, htmlBody, category: formCategory };

            if (editing?._new) {
                await api.post('/templates', payload);
                toast.success('Template created!');
            } else {
                await api.put(`/templates/${editing._id}`, payload);
                toast.success('Template updated!');
            }
            setEditing(null);
            fetchTemplates();
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this template?')) return;
        try {
            await api.delete(`/templates/${id}`);
            toast.success('Template deleted');
            fetchTemplates();
        } catch {
            toast.error('Failed to delete');
        }
    };

    const duplicateTemplate = async (template) => {
        try {
            await api.post('/templates', {
                name: `${template.name} (Copy)`,
                subject: template.subject,
                htmlBody: template.htmlBody,
                category: template.category,
            });
            toast.success('Template duplicated');
            fetchTemplates();
        } catch {
            toast.error('Failed to duplicate');
        }
    };

    const filteredTemplates = templates.filter(t =>
        t.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.subject?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        Email Templates
                    </h1>
                    <p className="text-surface-500 mt-1">Create reusable email templates for your campaigns</p>
                </div>
                <button onClick={startNew} className="btn-primary">
                    <Plus className="w-4 h-4" /> New Template
                </button>
            </div>

            {/* Editor Panel */}
            {editing && (
                <div className="glass-card overflow-hidden animate-in">
                    <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
                        <h3 className="font-semibold text-surface-900 dark:text-white">
                            {editing._new ? 'New Template' : `Editing: ${editing.name}`}
                        </h3>
                        <button onClick={() => setEditing(null)} className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg">
                            <X className="w-4 h-4 text-surface-500" />
                        </button>
                    </div>

                    <div className="p-5 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Template Name</label>
                                <input value={formName} onChange={e => setFormName(e.target.value)}
                                    className="input" placeholder="e.g., Cold Outreach - SaaS" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Category</label>
                                <select value={formCategory} onChange={e => setFormCategory(e.target.value)} className="input">
                                    {categories.map(c => (
                                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Subject Line</label>
                            <input value={formSubject} onChange={e => setFormSubject(e.target.value)}
                                className="input" placeholder="Email subject — use {{name}}, {{company}} etc." />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Email Body</label>
                            <div className="border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
                                {editor && (
                                    <div className="flex items-center gap-1 px-3 py-2 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 flex-wrap">
                                        <ToolBtn icon={Bold} active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold" />
                                        <ToolBtn icon={Italic} active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic" />
                                        <ToolBtn icon={UIcon} active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline" />
                                        <div className="w-px h-5 bg-surface-200 dark:bg-surface-700 mx-1" />
                                        <ToolBtn icon={AlignLeft} active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Left" />
                                        <ToolBtn icon={AlignCenter} active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Center" />
                                        <ToolBtn icon={AlignRight} active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Right" />
                                        <div className="w-px h-5 bg-surface-200 dark:bg-surface-700 mx-1" />
                                        <ToolBtn icon={List} active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullets" />
                                        <ToolBtn icon={ListOrdered} active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered" />
                                        <ToolBtn icon={Link2} onClick={() => { const url = prompt('URL:'); if (url) editor.chain().focus().setLink({ href: url }).run(); }} title="Link" />
                                        <div className="w-px h-5 bg-surface-200 dark:bg-surface-700 mx-1" />
                                        <div className="relative group">
                                            <button className="text-xs text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 px-2">{'{{ }}'} Tags</button>
                                            <div className="hidden group-hover:block absolute top-full left-0 mt-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl z-20 py-2 min-w-[130px]">
                                                {['name', 'first_name', 'email', 'company'].map(tag => (
                                                    <button key={tag} onClick={() => editor.commands.insertContent(`{{${tag}}}`)}
                                                        className="block w-full text-left px-3 py-1 text-xs text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700">
                                                        {`{{${tag}}}`}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="tiptap-editor">
                                    <EditorContent editor={editor} className="min-h-[200px]" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="btn-primary">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {editing._new ? 'Create Template' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Search / Filter */}
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        className="input pl-10" placeholder="Search templates..." />
                </div>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                    className="input !w-auto">
                    <option value="">All Categories</option>
                    {categories.map(c => (
                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                </select>
            </div>

            {/* Templates Grid */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filteredTemplates.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <FileText className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-1">
                        {search ? 'No templates found' : 'No templates yet'}
                    </h3>
                    <p className="text-surface-400 mb-4">
                        {search ? 'Try a different search term' : 'Create your first reusable email template'}
                    </p>
                    {!search && (
                        <button onClick={startNew} className="btn-primary mx-auto">
                            <Plus className="w-4 h-4" /> Create Template
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map(t => (
                        <div key={t._id} className="glass-card p-5 flex flex-col group hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-surface-900 dark:text-white truncate">{t.name}</h3>
                                    {t.subject && (
                                        <p className="text-xs text-surface-500 truncate mt-0.5" title={t.subject}>{t.subject}</p>
                                    )}
                                </div>
                                <span className="badge badge-info text-xs ml-2 shrink-0">{t.category || 'other'}</span>
                            </div>

                            {/* Preview */}
                            <div className="flex-1 mb-3">
                                <div className="text-xs text-surface-400 line-clamp-3 leading-relaxed"
                                    dangerouslySetInnerHTML={{
                                        __html: (t.htmlBody || '').replace(/<[^>]+>/g, ' ').substring(0, 150) + '...',
                                    }}
                                />
                            </div>

                            {/* Expand preview */}
                            {previewId === t._id && (
                                <div className="mb-3 p-3 bg-surface-50 dark:bg-surface-800/50 rounded-lg border border-surface-200 dark:border-surface-700 max-h-48 overflow-y-auto animate-in">
                                    <div className="text-sm" dangerouslySetInnerHTML={{ __html: t.htmlBody || '<p class="text-surface-400">No content</p>' }} />
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-surface-100 dark:border-surface-800">
                                <span className="text-xs text-surface-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(t.updatedAt).toLocaleDateString()}
                                </span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setPreviewId(previewId === t._id ? null : t._id)}
                                        className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg text-surface-500" title="Preview">
                                        <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => duplicateTemplate(t)}
                                        className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg text-surface-500" title="Duplicate">
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => startEdit(t)}
                                        className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg text-surface-500" title="Edit">
                                        <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleDelete(t._id)}
                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-red-500" title="Delete">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
