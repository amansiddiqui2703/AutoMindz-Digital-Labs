import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
    Sparkles, Send, Eye, Wand2, X, Loader2, Bold, Italic,
    Underline as UIcon, Link2, AlignLeft, AlignCenter, AlignRight,
    List, ListOrdered, Image as ImageIcon, Type,
    Strikethrough, Quote, Heading1, Heading2, Code, Minus, BookTemplate
} from 'lucide-react';
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

const ToolBtn = ({ icon: Icon, active, onClick, title }) => (
    <button onClick={onClick} title={title} type="button"
        className={`p-1.5 rounded-lg transition-all ${active ? 'bg-primary-100 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400' : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800'}`}>
        <Icon className="w-4 h-4" />
    </button>
);

const EditorToolbar = ({ editor }) => {
    if (!editor) return null;
    return (
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
            <div className="relative group z-20">
                <button type="button" className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 px-2 py-1 bg-primary-50 dark:bg-primary-900/20 rounded">
                    {'{{ }}'} Tags
                </button>
                <div className="hidden group-hover:block absolute top-full left-0 mt-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl py-2 min-w-[130px]">
                    {['name', 'first_name', 'email', 'company'].map(tag => (
                        <button key={tag} type="button" onClick={() => editor.commands.insertContent(`{{${tag}}}`)}
                            className="block w-full text-left px-3 py-1.5 text-xs text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700">
                            {`{{${tag}}}`}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default function Compose() {
    const { user, fetchUser } = useAuth();
    const navigate = useNavigate();
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [cc, setCc] = useState('');
    const [bcc, setBcc] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [sending, setSending] = useState(false);
    const [savingSig, setSavingSig] = useState(false);

    // AI
    const [showAi, setShowAi] = useState(false);
    const [aiAction, setAiAction] = useState('cold-email');
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);

    // Sequences
    const [showSequences, setShowSequences] = useState(false);
    const [sequences, setSequences] = useState([]);
    const [loadingSequences, setLoadingSequences] = useState(false);

    const loadSequences = async () => {
        if (sequences.length > 0) return; // already loaded
        setLoadingSequences(true);
        try {
            const res = await api.get('/sequences');
            setSequences(res.data.sequences || []);
        } catch (e) {
            toast.error('Failed to load sequences');
        } finally {
            setLoadingSequences(false);
        }
    };

    const handleLoadSequence = (seq) => {
        if (!seq.steps || seq.steps.length === 0) return;
        const firstStep = seq.steps[0];
        setSubject(firstStep.subject || '');
        if (editor) {
            editor.commands.setContent(firstStep.body + (user?.settings?.signature ? `<p></p><p>${user.settings.signature}</p>` : ''));
        }
        setShowSequences(false);
        toast.success(`Loaded sequence: ${seq.name}`);
    };

    const extensions = [
        StarterKit,
        Underline,
        TextStyle,
        FontFamily,
        Color,
        TImage,
        TLink.configure({ openOnClick: false }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Placeholder.configure({ placeholder: 'Write your email here...' }),
    ];

    const editor = useEditor({
        extensions,
        content: user?.settings?.signature ? `<p></p><p>${user.settings.signature}</p>` : '',
    });

    const sigEditor = useEditor({
        extensions: [
            StarterKit, Underline, TextStyle, FontFamily, Color, TLink.configure({ openOnClick: false })
        ],
        content: user?.settings?.signature || '',
    });

    const handleSend = async () => {
        if (!to || !subject) return toast.error('To and subject are required');
        
        const htmlBody = editor?.getHTML() || '';
        if (!htmlBody || htmlBody === '<p></p>') return toast.error('Email body is required');
        
        setSending(true);
        try {
            await api.post('/emails/send-single', { to, subject, htmlBody, cc, bcc });
            toast.success('Email sent successfully! Redirecting to inbox...');
            setTo(''); setSubject(''); setCc(''); setBcc('');
            if (editor) {
                editor.commands.setContent(user?.settings?.signature ? `<p></p><p>${user.settings.signature}</p>` : '');
            }
            setTimeout(() => navigate('/inbox'), 800);
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed to send email. Check if your Gmail account is connected.');
        } finally { setSending(false); }
    };

    const handleSaveSignature = async () => {
        setSavingSig(true);
        try {
            const signature = sigEditor?.getHTML() || '';
            await api.put('/auth/settings', { settings: { ...user.settings, signature } });
            await fetchUser();
            toast.success('Signature saved! It will be appended to new emails.');
        } catch (e) {
            toast.error('Failed to save signature');
        } finally {
            setSavingSig(false);
        }
    };

    const handleAi = async () => {
        setAiLoading(true);
        try {
            const htmlBody = editor?.getHTML() || '';
            const params = { action: aiAction };
            if (aiAction === 'cold-email') {
                params.purpose = aiPrompt; params.tone = 'professional';
            } else if (aiAction === 'rewrite') {
                params.content = htmlBody; params.instructions = aiPrompt;
            } else if (aiAction === 'improve-tone') {
                params.content = htmlBody; params.tone = aiPrompt || 'professional';
            } else if (aiAction === 'subject-lines') {
                params.content = htmlBody; params.count = 5;
            } else if (aiAction === 'spam-check') {
                params.subject = subject; params.content = htmlBody;
            }

            const res = await api.post('/ai/generate', params);

            if (aiAction === 'subject-lines' || aiAction === 'spam-check') {
                toast(res.data.result, { duration: 10000, style: { maxWidth: '500px', whiteSpace: 'pre-wrap' } });
            } else {
                const newBody = res.data.result + (user?.settings?.signature ? `<p></p><p>${user.settings.signature}</p>` : '');
                if (editor) editor.commands.setContent(newBody);
                toast.success('AI content generated!');
            }
        } catch (e) {
            toast.error(e.response?.data?.error || 'AI generation failed');
        } finally { setAiLoading(false); }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div>
                <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Compose Email</h1>
                <p className="text-surface-500 mt-1">Write and send a single email with rich formatting</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card overflow-hidden flex flex-col min-h-[600px]">
                    <div className="border-b border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 z-10 relative">
                        <div className="flex items-center px-5 py-2.5 border-b border-surface-100 dark:border-surface-800">
                            <span className="text-sm font-medium text-surface-500 w-16">To</span>
                            <input value={to} onChange={e => setTo(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-sm text-surface-900 dark:text-white" placeholder="recipient@example.com" />
                        </div>
                        <div className="flex items-center px-5 py-2.5 border-b border-surface-100 dark:border-surface-800">
                            <span className="text-sm font-medium text-surface-500 w-16">CC</span>
                            <input value={cc} onChange={e => setCc(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-sm text-surface-900 dark:text-white" placeholder="cc@example.com" />
                        </div>
                        <div className="flex items-center px-5 py-2.5 border-b border-surface-100 dark:border-surface-800">
                            <span className="text-sm font-medium text-surface-500 w-16">BCC</span>
                            <input value={bcc} onChange={e => setBcc(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-sm text-surface-900 dark:text-white" placeholder="bcc@example.com" />
                        </div>
                        <div className="flex items-center px-5 py-2.5 border-b border-surface-200 dark:border-surface-700 justify-between">
                            <div className="flex items-center flex-1">
                                <span className="text-sm font-medium text-surface-500 w-16">Subject</span>
                                <input value={subject} onChange={e => setSubject(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-sm text-surface-900 dark:text-white font-medium" placeholder="Email subject" />
                            </div>
                            <div className="group relative flex items-center shrink-0 ml-4">
                                <span className="bg-gradient-to-br from-primary-500/10 to-accent-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary-500/20 flex items-center gap-1 cursor-help">
                                    Spintax Supported
                                </span>
                                <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-surface-900 dark:bg-surface-800 text-white text-xs rounded-xl shadow-lg shadow-primary-500/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    Use Spintax to randomize variations! <br/><br/>
                                    <span className="font-mono text-primary-300">{"{Hi|Hello|Hey}"}</span> {"{{first_name}}"}, we love your work!
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-4 py-2 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                        <div className="flex gap-2 relative">
                            <button onClick={() => setShowPreview(!showPreview)} className="btn-secondary !py-1.5 !px-3 !text-xs">
                                <Eye className="w-3 h-3" /> Preview
                            </button>
                            <button onClick={() => { setShowAi(!showAi); setShowSequences(false); }} className={`btn-primary !py-1.5 !px-3 !text-xs ${showAi ? 'ring-2 ring-primary-500 ring-offset-1' : ''}`}>
                                <Sparkles className="w-3 h-3" /> AI Assistant
                            </button>
                            <button 
                                onClick={() => { 
                                    const nextState = !showSequences;
                                    setShowSequences(nextState); 
                                    setShowAi(false);
                                    if (nextState) loadSequences(); 
                                }} 
                                className={`btn-secondary !py-1.5 !px-3 !text-xs ${showSequences ? 'bg-surface-200 dark:bg-surface-700' : ''}`}
                            >
                                <BookTemplate className="w-3 h-3" /> Load Sequence
                            </button>

                            {/* Sequences Dropdown */}
                            {showSequences && (
                                <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between p-3 border-b border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                                        <h4 className="font-semibold text-sm text-surface-900 dark:text-white">Your Sequences</h4>
                                        <button onClick={() => setShowSequences(false)} className="text-surface-400 hover:text-surface-600"><X className="w-4 h-4" /></button>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto p-2">
                                        {loadingSequences ? (
                                            <div className="p-4 text-center text-sm text-surface-500"><Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" /> Loading...</div>
                                        ) : sequences.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-surface-500">No sequences found.<br/><a href="/sequences" className="text-primary-500 hover:underline mt-1 inline-block">Create one here</a></div>
                                        ) : (
                                            sequences.map(seq => (
                                                <button key={seq._id} onClick={() => handleLoadSequence(seq)} className="w-full text-left p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors group">
                                                    <div className="font-medium text-sm text-surface-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">{seq.name}</div>
                                                    <div className="text-xs text-surface-500 truncate mt-0.5">{seq.steps?.length || 0} steps • {seq.steps?.[0]?.subject || 'No subject'}</div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {showAi && (
                        <div className="p-4 border-b border-surface-200 dark:border-surface-700 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-500/5 dark:to-accent-500/5 animate-in">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Wand2 className="w-4 h-4 text-accent-500" />
                                    <span className="text-sm font-semibold text-surface-900 dark:text-white">Gemini AI</span>
                                </div>
                                <button onClick={() => setShowAi(false)}><X className="w-4 h-4 text-surface-400" /></button>
                            </div>
                            <div className="flex gap-2 mb-3 flex-wrap">
                                {[
                                    { v: 'cold-email', l: '✉️ Draft Email' },
                                    { v: 'rewrite', l: '🔄 Rewrite' },
                                    { v: 'improve-tone', l: '🎭 Tone' },
                                    { v: 'subject-lines', l: '📝 Subjects' },
                                    { v: 'spam-check', l: '🛡️ Spam Check' },
                                ].map(({ v, l }) => (
                                    <button key={v} onClick={() => setAiAction(v)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${aiAction === v ? 'bg-primary-500 text-white' : 'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-700'}`}>
                                        {l}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                                    className="input text-sm" placeholder={aiAction === 'cold-email' ? 'Describe your goal...' : aiAction === 'improve-tone' ? 'e.g. formal, friendly' : 'Instructions...'} />
                                <button onClick={handleAi} disabled={aiLoading} className="btn-primary whitespace-nowrap text-sm">
                                    {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    Generate
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 flex flex-col bg-white dark:bg-surface-900 relative">
                        {showPreview ? (
                            <div className="p-6 flex-1 overflow-auto">
                                <div className="prose dark:prose-invert max-w-none text-sm"
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(editor?.getHTML() || '') }} />
                            </div>
                        ) : (
                            <div className="flex-1 h-full editor-container flex flex-col">
                                <EditorToolbar editor={editor} />
                                <div className="p-4 flex-1 overflow-auto tiptap-editor h-full">
                                    <EditorContent editor={editor} className="h-full min-h-[300px]" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between px-5 py-4 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                        <div className="text-xs text-surface-400">
                            Unsubscribe link & tracking pixel will be auto-added
                        </div>
                        <button onClick={handleSend} disabled={sending} className="btn-primary py-2 px-6">
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Send Now
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="glass-card p-5">
                        <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">Email Signature</h3>
                        <p className="text-xs text-surface-500 mb-4">This signature will be appended to all new emails automatically.</p>
                        <div className="mb-4 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
                            <EditorToolbar editor={sigEditor} />
                            <div className="p-3 tiptap-editor bg-white dark:bg-surface-900">
                                <EditorContent editor={sigEditor} className="min-h-[100px] text-sm" />
                            </div>
                        </div>
                        <button onClick={handleSaveSignature} disabled={savingSig} className="btn-secondary w-full">
                            {savingSig ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Signature'}
                        </button>
                    </div>
                    
                    <div className="glass-card p-5 bg-primary-50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-800">
                        <h4 className="font-semibold text-primary-900 dark:text-primary-100 text-sm mb-2">Why is my email not sending?</h4>
                        <ul className="text-xs text-primary-700 dark:text-primary-300 space-y-2 list-disc pl-4">
                            <li>Make sure you have an <strong>Active Gmail Account</strong> connected in the <a href="/accounts" className="underline">Accounts page</a>.</li>
                            <li>If your token expired, you'll need to reconnect it.</li>
                            <li>Check the <strong>Inbox</strong> page for detailed bounce logs.</li>
                        </ul>
                    </div>
                </div>
            </div>
            
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
