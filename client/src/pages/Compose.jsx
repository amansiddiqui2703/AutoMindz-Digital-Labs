import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
    Sparkles, Send, Eye, Wand2, X, Loader2
} from 'lucide-react';
import DOMPurify from 'dompurify';

export default function Compose() {
    const { user, fetchUser } = useAuth();
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [cc, setCc] = useState('');
    const [bcc, setBcc] = useState('');
    const [htmlBody, setHtmlBody] = useState('');
    const [signature, setSignature] = useState(user?.settings?.signature || '');
    const [showPreview, setShowPreview] = useState(false);
    const [sending, setSending] = useState(false);
    const [savingSig, setSavingSig] = useState(false);

    // AI
    const [showAi, setShowAi] = useState(false);
    const [aiAction, setAiAction] = useState('cold-email');
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        if (user?.settings?.signature && !htmlBody) {
            setHtmlBody(`<br><br>${user.settings.signature}`);
            setSignature(user.settings.signature);
        }
    }, [user]);

    const handleSend = async () => {
        if (!to || !subject) return toast.error('To and subject are required');
        if (!htmlBody || htmlBody === '<p><br></p>') return toast.error('Email body is required');
        
        setSending(true);
        try {
            await api.post('/emails/send-single', { to, subject, htmlBody, cc, bcc });
            toast.success('Email sent successfully!');
            setTo(''); setSubject(''); setCc(''); setBcc('');
            setHtmlBody(user?.settings?.signature ? `<br><br>${user.settings.signature}` : '');
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed to send email. Check if your Gmail account is connected.');
        } finally { setSending(false); }
    };

    const handleSaveSignature = async () => {
        setSavingSig(true);
        try {
            await api.put('/users/settings', { settings: { ...user.settings, signature } });
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
                // Ensure signature is preserved
                const newBody = res.data.result + (user?.settings?.signature ? `<br><br>${user.settings.signature}` : '');
                setHtmlBody(newBody);
                toast.success('AI content generated!');
            }
        } catch (e) {
            toast.error(e.response?.data?.error || 'AI generation failed');
        } finally { setAiLoading(false); }
    };

    const insertMergeTag = (tag) => {
        setHtmlBody(prev => prev + `{{${tag}}}`);
    };

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            [{ 'font': [] }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['link', 'image'],
            ['clean']
        ],
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div>
                <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Compose Email</h1>
                <p className="text-surface-500 mt-1">Write and send a single email with rich formatting</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card overflow-hidden flex flex-col min-h-[600px]">
                    {/* Top fields */}
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
                        <div className="flex items-center px-5 py-2.5 border-b border-surface-200 dark:border-surface-700">
                            <span className="text-sm font-medium text-surface-500 w-16">Subject</span>
                            <input value={subject} onChange={e => setSubject(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-sm text-surface-900 dark:text-white font-medium" placeholder="Email subject" />
                        </div>
                    </div>

                    {/* Toolbar Actions */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                        <div className="relative group z-20">
                            <button className="btn-secondary !py-1.5 !px-3 !text-xs">
                                {'{{ }}'} Merge Tags
                            </button>
                            <div className="hidden group-hover:block absolute top-full left-0 mt-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl py-2 min-w-[150px]">
                                {['name', 'first_name', 'email', 'company'].map(tag => (
                                    <button key={tag} onClick={() => insertMergeTag(tag)}
                                        className="block w-full text-left px-4 py-1.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700">
                                        {`{{${tag}}}`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => setShowPreview(!showPreview)} className="btn-secondary !py-1.5 !px-3 !text-xs">
                                <Eye className="w-3 h-3" /> Preview
                            </button>
                            <button onClick={() => setShowAi(!showAi)} className="btn-primary !py-1.5 !px-3 !text-xs">
                                <Sparkles className="w-3 h-3" /> AI Assistant
                            </button>
                        </div>
                    </div>

                    {/* AI Panel */}
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

                    {/* Editor area - Using ReactQuill */}
                    <div className="flex-1 flex flex-col bg-white dark:bg-surface-900 relative">
                        {showPreview ? (
                            <div className="p-6 flex-1 overflow-auto">
                                <div className="prose dark:prose-invert max-w-none text-sm"
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlBody) }} />
                            </div>
                        ) : (
                            <div className="flex-1 h-full editor-container">
                                <ReactQuill 
                                    theme="snow" 
                                    value={htmlBody} 
                                    onChange={setHtmlBody}
                                    modules={quillModules}
                                    className="h-full flex flex-col"
                                    placeholder="Write your email here..."
                                />
                            </div>
                        )}
                    </div>

                    {/* Footer */}
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

                {/* Sidebar for Signature */}
                <div className="space-y-6">
                    <div className="glass-card p-5">
                        <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">Email Signature</h3>
                        <p className="text-xs text-surface-500 mb-4">This signature will be appended to all new emails automatically. You can use HTML formatting here.</p>
                        <div className="mb-4">
                            <ReactQuill 
                                theme="snow" 
                                value={signature} 
                                onChange={setSignature}
                                modules={{
                                    toolbar: [
                                        ['bold', 'italic', 'underline', 'link'],
                                        [{ 'color': [] }]
                                    ]
                                }}
                                className="bg-white dark:bg-surface-900 rounded-lg"
                                placeholder="Best regards,&#10;Your Name..."
                            />
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
            
            {/* Custom CSS for Quill in Dark Mode and full height */}
            <style dangerouslySetInnerHTML={{__html: `
                .editor-container .quill {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    min-height: 400px;
                }
                .editor-container .ql-container {
                    flex: 1;
                    font-size: 14px;
                    font-family: inherit;
                    overflow-y: auto;
                    border-bottom-left-radius: 0.5rem;
                    border-bottom-right-radius: 0.5rem;
                }
                .editor-container .ql-toolbar {
                    border-top: none;
                    border-left: none;
                    border-right: none;
                    background-color: transparent;
                }
                .dark .ql-snow .ql-picker { color: #e5e7eb; }
                .dark .ql-snow .ql-stroke { stroke: #e5e7eb; }
                .dark .ql-snow .ql-fill { fill: #e5e7eb; }
                .dark .ql-snow .ql-picker-options { background-color: #1f2937; border-color: #374151; }
                .dark .ql-editor.ql-blank::before { color: #6b7280; }
                .dark .ql-snow.ql-toolbar button:hover .ql-stroke, .dark .ql-snow .ql-toolbar button:hover .ql-stroke { stroke: #3b82f6; }
            `}} />
        </div>
    );
}
