import { useState, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TLink from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
    Bold, Italic, Underline as UIcon, Link2, AlignLeft, AlignCenter, AlignRight,
    List, ListOrdered, Sparkles, Send, Eye, Code, Type, Wand2, X, Loader2
} from 'lucide-react';

const ToolBtn = ({ icon: Icon, active, onClick, title }) => (
    <button onClick={onClick} title={title}
        className={`p-1.5 rounded-lg transition-all ${active ? 'bg-primary-100 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400' : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800'}`}>
        <Icon className="w-4 h-4" />
    </button>
);

export default function Compose() {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [cc, setCc] = useState('');
    const [bcc, setBcc] = useState('');
    const [mode, setMode] = useState('rich'); // rich | html | plain
    const [htmlSource, setHtmlSource] = useState('');
    const [plainText, setPlainText] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [sending, setSending] = useState(false);

    // AI
    const [showAi, setShowAi] = useState(false);
    const [aiAction, setAiAction] = useState('cold-email');
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TLink.configure({ openOnClick: false }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Placeholder.configure({ placeholder: 'Write your email here...' }),
        ],
        content: '',
    });

    const handleSend = async () => {
        if (!to || !subject) return toast.error('To and subject are required');
        setSending(true);
        try {
            let htmlBody = '';
            if (mode === 'rich') htmlBody = editor?.getHTML() || '';
            else if (mode === 'html') htmlBody = htmlSource;
            else htmlBody = `<pre>${plainText}</pre>`;

            await api.post('/emails/send-single', { to, subject, htmlBody, cc, bcc });
            toast.success('Email sent!');
            setTo(''); setSubject(''); setCc(''); setBcc('');
            editor?.commands.clearContent();
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed to send');
        } finally { setSending(false); }
    };

    const handleAi = async () => {
        setAiLoading(true);
        try {
            const params = { action: aiAction };
            if (aiAction === 'cold-email') {
                params.purpose = aiPrompt; params.tone = 'professional';
            } else if (aiAction === 'rewrite') {
                params.content = editor?.getHTML() || ''; params.instructions = aiPrompt;
            } else if (aiAction === 'improve-tone') {
                params.content = editor?.getHTML() || ''; params.tone = aiPrompt || 'professional';
            } else if (aiAction === 'subject-lines') {
                params.content = editor?.getHTML() || ''; params.count = 5;
            } else if (aiAction === 'spam-check') {
                params.subject = subject; params.content = editor?.getHTML() || '';
            }

            const res = await api.post('/ai/generate', params);

            if (aiAction === 'subject-lines' || aiAction === 'spam-check') {
                toast(res.data.result, { duration: 10000, style: { maxWidth: '500px', whiteSpace: 'pre-wrap' } });
            } else {
                editor?.commands.setContent(res.data.result);
                toast.success('AI content generated!');
            }
        } catch (e) {
            toast.error(e.response?.data?.error || 'AI generation failed');
        } finally { setAiLoading(false); }
    };

    const insertMergeTag = (tag) => {
        editor?.commands.insertContent(`{{${tag}}}`);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Compose Email</h1>
                <p className="text-surface-500 mt-1">Write and send a single email</p>
            </div>

            <div className="glass-card overflow-hidden">
                {/* Top fields */}
                <div className="border-b border-surface-200 dark:border-surface-700">
                    <div className="flex items-center px-5 py-2.5 border-b border-surface-100 dark:border-surface-800">
                        <span className="text-sm font-medium text-surface-500 w-16">To</span>
                        <input value={to} onChange={e => setTo(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-sm text-surface-900 dark:text-white" placeholder="recipient@example.com" id="compose-to" />
                    </div>
                    <div className="flex items-center px-5 py-2.5 border-b border-surface-100 dark:border-surface-800">
                        <span className="text-sm font-medium text-surface-500 w-16">CC</span>
                        <input value={cc} onChange={e => setCc(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-sm text-surface-900 dark:text-white" placeholder="cc@example.com" />
                    </div>
                    <div className="flex items-center px-5 py-2.5 border-b border-surface-100 dark:border-surface-800">
                        <span className="text-sm font-medium text-surface-500 w-16">BCC</span>
                        <input value={bcc} onChange={e => setBcc(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-sm text-surface-900 dark:text-white" placeholder="bcc@example.com" />
                    </div>
                    <div className="flex items-center px-5 py-2.5">
                        <span className="text-sm font-medium text-surface-500 w-16">Subject</span>
                        <input value={subject} onChange={e => setSubject(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-sm text-surface-900 dark:text-white font-medium" placeholder="Email subject" id="compose-subject" />
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-1 px-4 py-2 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 flex-wrap">
                    {mode === 'rich' && editor && (
                        <>
                            <ToolBtn icon={Bold} active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold" />
                            <ToolBtn icon={Italic} active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic" />
                            <ToolBtn icon={UIcon} active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline" />
                            <div className="w-px h-5 bg-surface-200 dark:bg-surface-700 mx-1" />
                            <ToolBtn icon={AlignLeft} active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Align Left" />
                            <ToolBtn icon={AlignCenter} active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Align Center" />
                            <ToolBtn icon={AlignRight} active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Align Right" />
                            <div className="w-px h-5 bg-surface-200 dark:bg-surface-700 mx-1" />
                            <ToolBtn icon={List} active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List" />
                            <ToolBtn icon={ListOrdered} active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List" />
                            <ToolBtn icon={Link2} onClick={() => {
                                const url = prompt('URL:');
                                if (url) editor.chain().focus().setLink({ href: url }).run();
                            }} title="Link" />
                            <div className="w-px h-5 bg-surface-200 dark:bg-surface-700 mx-1" />
                        </>
                    )}

                    {/* Merge Tags */}
                    <div className="relative group">
                        <button className="btn-secondary !py-1.5 !px-3 !text-xs">
                            {'{{ }}'} Merge Tags
                        </button>
                        <div className="hidden group-hover:block absolute top-full left-0 mt-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl z-20 py-2 min-w-[150px]">
                            {['name', 'first_name', 'email', 'company'].map(tag => (
                                <button key={tag} onClick={() => insertMergeTag(tag)}
                                    className="block w-full text-left px-4 py-1.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700">
                                    {`{{${tag}}}`}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1" />

                    {/* Mode toggles */}
                    <div className="flex items-center bg-surface-200 dark:bg-surface-700 rounded-lg p-0.5">
                        {[{ m: 'rich', icon: Type, l: 'Rich' }, { m: 'html', icon: Code, l: 'HTML' }, { m: 'plain', icon: AlignLeft, l: 'Plain' }].map(({ m, icon: I, l }) => (
                            <button key={m} onClick={() => setMode(m)}
                                className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-all ${mode === m ? 'bg-white dark:bg-surface-900 shadow text-surface-900 dark:text-white' : 'text-surface-500'}`}>
                                <I className="w-3 h-3" />{l}
                            </button>
                        ))}
                    </div>

                    <button onClick={() => setShowPreview(!showPreview)} className="btn-secondary !py-1.5 !px-3 !text-xs">
                        <Eye className="w-3 h-3" /> Preview
                    </button>

                    <button onClick={() => setShowAi(!showAi)} className="btn-primary !py-1.5 !px-3 !text-xs">
                        <Sparkles className="w-3 h-3" /> AI
                    </button>
                </div>

                {/* AI Panel */}
                {showAi && (
                    <div className="p-4 border-b border-surface-200 dark:border-surface-700 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-500/5 dark:to-accent-500/5 animate-in">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Wand2 className="w-4 h-4 text-accent-500" />
                                <span className="text-sm font-semibold text-surface-900 dark:text-white">AI Assistant</span>
                            </div>
                            <button onClick={() => setShowAi(false)}><X className="w-4 h-4 text-surface-400" /></button>
                        </div>
                        <div className="flex gap-2 mb-3 flex-wrap">
                            {[
                                { v: 'cold-email', l: '✉️ Cold Email' },
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
                                className="input" placeholder={aiAction === 'cold-email' ? 'Describe your outreach purpose...' : aiAction === 'improve-tone' ? 'formal, friendly, sales...' : 'Instructions...'} />
                            <button onClick={handleAi} disabled={aiLoading} className="btn-primary whitespace-nowrap">
                                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                Generate
                            </button>
                        </div>
                    </div>
                )}

                {/* Editor area */}
                <div className="tiptap-editor">
                    {mode === 'rich' && <EditorContent editor={editor} className="min-h-[300px]" />}
                    {mode === 'html' && (
                        <textarea value={htmlSource} onChange={e => setHtmlSource(e.target.value)}
                            className="w-full min-h-[300px] p-4 bg-transparent font-mono text-sm text-surface-900 dark:text-surface-100 border-none outline-none resize-y"
                            placeholder="<p>Write HTML here...</p>" />
                    )}
                    {mode === 'plain' && (
                        <textarea value={plainText} onChange={e => setPlainText(e.target.value)}
                            className="w-full min-h-[300px] p-4 bg-transparent text-sm text-surface-900 dark:text-surface-100 border-none outline-none resize-y"
                            placeholder="Plain text email..." />
                    )}
                </div>

                {/* Preview */}
                {showPreview && (
                    <div className="border-t border-surface-200 dark:border-surface-700 p-6">
                        <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">Preview</h4>
                        <div className="prose dark:prose-invert max-w-none text-sm"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(mode === 'rich' ? editor?.getHTML() : mode === 'html' ? htmlSource : `<pre>${plainText}</pre>`) }} />
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-4 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                    <div className="text-xs text-surface-400">
                        Compliance footer & tracking pixel will be auto-added
                    </div>
                    <button onClick={handleSend} disabled={sending} className="btn-primary" id="compose-send">
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Send Email
                    </button>
                </div>
            </div>
        </div>
    );
}
