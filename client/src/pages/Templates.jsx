import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Link as TLink } from '@tiptap/extension-link';
import { TextAlign } from '@tiptap/extension-text-align';
import { Placeholder } from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Color } from '@tiptap/extension-color';
import { Image as TImage } from '@tiptap/extension-image';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
    FileText, Plus, Trash2, Edit3, Save, X, Eye, Bold, Italic,
    Underline as UIcon, Link2, AlignLeft, AlignCenter, AlignRight,
    List, ListOrdered, Search, Loader2, Copy, Clock,
    Strikethrough, Quote, Heading1, Heading2, Code, Minus, Image as ImageIcon
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
            TextStyle,
            FontFamily,
            Color,
            TImage,
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
                                        <select 
                                            onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
                                            className="text-xs bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded p-1 mr-1 outline-none"
                                            title="Font Family"
                                        >
                                            <option value="inherit">Default Font</option>
                                            <option value="Arial">Arial</option>
                                            <option value="Times New Roman">Times New Roman</option>
                                            <option value="Courier New">Courier New</option>
                                            <option value="Georgia">Georgia</option>
                                            <option value="Verdana">Verdana</option>
                                            <option value="Trebuchet MS">Trebuchet MS</option>
                                            <option value="Tahoma">Tahoma</option>
                                            <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                                            <option value="Impact">Impact</option>
                                            <option value="'Lucida Console', Monaco, monospace">Lucida Console</option>
                                            <option value="Garamond">Garamond</option>
                                            <option value="Helvetica">Helvetica</option>
                                        </select>
                                        
                                        <input 
                                            type="color" 
                                            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                                            value={editor.getAttributes('textStyle').color || '#000000'}
                                            className="w-6 h-6 p-0 border-0 rounded cursor-pointer mr-1"
                                            title="Text Color"
                                        />

                                        <ToolBtn icon={Bold} active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold" />
                                        <ToolBtn icon={Italic} active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic" />
                                        <ToolBtn icon={UIcon} active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline" />
                                        <ToolBtn icon={Strikethrough} active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough" />
                                        <ToolBtn icon={Code} active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="Code" />
                                        <div className="w-px h-5 bg-surface-200 dark:bg-surface-700 mx-1" />
                                        <ToolBtn icon={Heading1} active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1" />
                                        <ToolBtn icon={Heading2} active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2" />
                                        <ToolBtn icon={Quote} active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote" />
                                        <div className="w-px h-5 bg-surface-200 dark:bg-surface-700 mx-1" />
                                        <ToolBtn icon={AlignLeft} active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Left" />
                                        <ToolBtn icon={AlignCenter} active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Center" />
                                        <ToolBtn icon={AlignRight} active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Right" />
                                        <div className="w-px h-5 bg-surface-200 dark:bg-surface-700 mx-1" />
                                        <ToolBtn icon={List} active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullets" />
                                        <ToolBtn icon={ListOrdered} active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered" />
                                        <ToolBtn icon={Minus} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule" />
                                        <div className="w-px h-5 bg-surface-200 dark:bg-surface-700 mx-1" />
                                        <ToolBtn icon={Link2} active={editor.isActive('link')} onClick={() => { const url = prompt('URL:'); if (url) editor.chain().focus().setLink({ href: url }).run(); }} title="Link" />
                                        <ToolBtn icon={ImageIcon} onClick={() => { const url = prompt('Image URL:'); if (url) editor.chain().focus().setImage({ src: url }).run(); }} title="Image" />
                                        <div className="w-px h-5 bg-surface-200 dark:bg-surface-700 mx-1" />
                                        <div className="relative group">
                                            <button type="button" className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 px-2 py-1 bg-primary-50 dark:bg-primary-900/20 rounded">{'{{ }}'} Tags</button>
                                            <div className="hidden group-hover:block absolute top-full left-0 mt-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl z-20 py-2 min-w-[130px]">
                                                {['name', 'first_name', 'email', 'company'].map(tag => (
                                                    <button key={tag} type="button" onClick={() => editor.commands.insertContent(`{{${tag}}}`)}
                                                        className="block w-full text-left px-3 py-1.5 text-xs text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700">
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
                                        __html: DOMPurify.sanitize((t.htmlBody || '').replace(/<[^>]+>/g, ' ').substring(0, 150) + '...'),
                                    }}
                                />
                            </div>

                            {/* Expand preview */}
                            {previewId === t._id && (
                                <div className="mb-3 p-3 bg-surface-50 dark:bg-surface-800/50 rounded-lg border border-surface-200 dark:border-surface-700 max-h-48 overflow-y-auto animate-in">
                                    <div className="text-sm" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t.htmlBody || '<p class="text-surface-400">No content</p>') }} />
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

            <style dangerouslySetInnerHTML={{__html: `
                .tiptap-editor .ProseMirror {
                    min-height: 100%;
                    outline: none;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    word-break: break-word;
                }
                .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
                    color: #9ca3af;
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
                .tiptap-editor .ProseMirror p {
                    margin-top: 0;
                    margin-bottom: 0.75em;
                }
                .tiptap-editor .ProseMirror img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 4px;
                }
                .tiptap-editor .ProseMirror a {
                    color: #2563eb;
                    text-decoration: underline;
                }
                .tiptap-editor .ProseMirror ul {
                    list-style-type: disc;
                    padding-left: 1.5rem;
                    margin-bottom: 0.75em;
                }
                .tiptap-editor .ProseMirror ol {
                    list-style-type: decimal;
                    padding-left: 1.5rem;
                    margin-bottom: 0.75em;
                }
                .tiptap-editor .ProseMirror blockquote {
                    border-left: 3px solid #e5e7eb;
                    padding-left: 1rem;
                    color: #6b7280;
                    font-style: italic;
                    margin: 1em 0;
                }
                .tiptap-editor .ProseMirror hr {
                    border: none;
                    border-top: 1px solid #e5e7eb;
                    margin: 1.5em 0;
                }
                .tiptap-editor .ProseMirror code {
                    background-color: #f3f4f6;
                    padding: 0.2em 0.4em;
                    border-radius: 3px;
                    font-size: 0.9em;
                }
                .dark .tiptap-editor .ProseMirror blockquote {
                    border-left-color: #374151;
                    color: #9ca3af;
                }
                .dark .tiptap-editor .ProseMirror hr {
                    border-top-color: #374151;
                }
                .dark .tiptap-editor .ProseMirror code {
                    background-color: #374151;
                }
            `}} />
        </div>
    );
}
