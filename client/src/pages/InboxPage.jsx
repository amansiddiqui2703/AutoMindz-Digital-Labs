import { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
    Inbox, Mail, Send, Star, StarOff, Clock, Eye, EyeOff,
    MessageSquare, RefreshCw, Search, ChevronDown, ChevronUp,
    AlertCircle, ArrowLeft, Loader2, Play, Filter, MailOpen,
    TrendingUp as ChartLineUp
} from 'lucide-react';

const FILTERS = [
    { key: 'all', label: 'All Messages', icon: Inbox },
    { key: 'unread', label: 'Unread', icon: Mail },
    { key: 'needs_reply', label: 'Needs Reply', icon: AlertCircle },
    { key: 'starred', label: 'Starred', icon: Star },
    { key: 'inbound', label: 'Received', icon: Inbox },
    { key: 'outbound', label: 'Sent', icon: Send },
];

const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function InboxPage() {
    const [messages, setMessages] = useState([]);
    const [counts, setCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedMsg, setSelectedMsg] = useState(null);
    const [thread, setThread] = useState([]);
    const [threadLoading, setThreadLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [simulating, setSimulating] = useState(false);
    const [simForm, setSimForm] = useState({ from: '', subject: '', body: '' });
    const [showSimulate, setShowSimulate] = useState(false);
    const [updatingStage, setUpdatingStage] = useState(false);

    const PIPELINE_STAGES = ['Identified', 'Contacted', 'Replied', 'Negotiating', 'Link Secured', 'Lost'];

    useEffect(() => {
        fetchMessages();

        const token = localStorage.getItem('token');
        if (!token) return;
        const url = import.meta.env.DEV ? `http://localhost:5000/api/events?token=${token}` : `/api/events?token=${token}`;
        const source = new EventSource(url);

        source.addEventListener('inbox_update', (e) => {
            try {
                const newMsg = JSON.parse(e.data);
                // Prepend dynamically
                setMessages(prev => {
                    const exists = prev.find(p => p._id === newMsg._id);
                    if (exists) return prev;
                    // Auto open into thread if it currently is selected
                    setThread(t => {
                        if (t && t.length > 0 && t[0].gmailThreadId === newMsg.gmailThreadId) {
                            return [...t, newMsg];
                        }
                        return t;
                    });
                    return [newMsg, ...prev];
                });
            } catch (err) { }
        });

        return () => source.close();
    }, [filter, search]);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            let url = `/inbox?filter=${filter}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;
            const res = await api.get(url);
            setMessages(res.data.messages || []);
            setCounts(res.data.counts || {});
        } catch {
            toast.error('Failed to load inbox');
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await api.post('/inbox/sync');
            toast.success(res.data.message);
            fetchMessages();
        } catch {
            toast.error('Sync failed');
        } finally {
            setSyncing(false);
        }
    };

    const openThread = async (msg) => {
        setSelectedMsg(msg);
        if (msg.gmailThreadId) {
            setThreadLoading(true);
            try {
                const res = await api.get(`/inbox/thread/${msg.gmailThreadId}`);
                setThread(res.data);
                fetchMessages(); // refresh counts
            } catch {
                setThread([msg]);
            } finally {
                setThreadLoading(false);
            }
        } else {
            setThread([msg]);
        }
    };

    const toggleStar = async (e, msgId) => {
        e.stopPropagation();
        try {
            await api.patch(`/inbox/${msgId}/star`);
            fetchMessages();
        } catch { /* silent */ }
    };

    const toggleNeedsReply = async (msgId, value) => {
        try {
            await api.patch(`/inbox/${msgId}/needs-reply`, { needsReply: value });
            toast.success(value ? 'Marked as needs reply' : 'Marked as resolved');
            fetchMessages();
        } catch { /* silent */ }
    };

    const handleStageChange = async (contactId, newStage) => {
        if (!contactId) return toast.error('No contact associated with this thread');
        setUpdatingStage(true);
        try {
            await api.patch(`/contacts/${contactId}/stage`, { pipelineStage: newStage });
            toast.success(`Pipeline updated to ${newStage}`);
            
            // Update local state to reflect UI change immediately
            if (selectedMsg && selectedMsg.contactId && typeof selectedMsg.contactId === 'object') {
                setSelectedMsg({
                    ...selectedMsg,
                    contactId: { ...selectedMsg.contactId, pipelineStage: newStage }
                });
            }
        } catch (err) {
            toast.error('Failed to update pipeline stage');
        } finally {
            setUpdatingStage(false);
        }
    };

    const handleSimulate = async () => {
        if (!simForm.from) return toast.error('From email is required');
        setSimulating(true);
        try {
            const res = await api.post('/inbox/simulate-inbound', simForm);
            toast.success(res.data.message);
            setShowSimulate(false);
            setSimForm({ from: '', subject: '', body: '' });
            fetchMessages();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed');
        } finally {
            setSimulating(false);
        }
    };

    const [replyBody, setReplyBody] = useState('');
    const [replying, setReplying] = useState(false);

    const handleInlineReply = async () => {
        if (!replyBody.trim() || !selectedMsg?.gmailThreadId) return;
        setReplying(true);
        try {
            await api.post(`/inbox/reply/${selectedMsg.gmailThreadId}`, {
                htmlBody: `<p>${replyBody.replace(/\n/g, '<br/>')}</p>`,
                plainBody: replyBody
            });
            toast.success('Reply Sent Successfully');
            setReplyBody('');
            // Optional: The SSE will push the new outbound msg back instantly anyway
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to dispatch reply');
        } finally {
            setReplying(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-4">
            {/* Sidebar Filters */}
            <div className="w-56 flex-shrink-0 space-y-1">
                <div className="glass-card p-3 mb-3">
                    <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Inbox</h3>
                    {FILTERS.map(f => (
                        <button
                            key={f.key}
                            onClick={() => { setFilter(f.key); setSelectedMsg(null); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${filter === f.key
                                ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400'
                                : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800'}`}
                        >
                            <f.icon className="w-4 h-4" />
                            <span className="flex-1 text-left">{f.label}</span>
                            {f.key === 'unread' && counts.unread > 0 && (
                                <span className="bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{counts.unread}</span>
                            )}
                            {f.key === 'needs_reply' && counts.needsReply > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{counts.needsReply}</span>
                            )}
                        </button>
                    ))}
                </div>
                <div className="space-y-2 px-1">
                    <button onClick={handleSync} disabled={syncing} className="btn-secondary w-full text-xs">
                        <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} /> Sync Emails
                    </button>
                    <button onClick={() => setShowSimulate(!showSimulate)} className="btn-secondary w-full text-xs">
                        <Play className="w-3.5 h-3.5" /> Simulate Inbound
                    </button>
                </div>
            </div>

            {/* Message List */}
            <div className={`${selectedMsg ? 'w-80' : 'flex-1'} flex-shrink-0 flex flex-col glass-card overflow-hidden transition-all`}>
                {/* Search */}
                <div className="p-3 border-b border-surface-200 dark:border-surface-700">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="input pl-9 !py-2 text-sm"
                            placeholder="Search emails..."
                        />
                    </div>
                </div>

                {/* Simulate Panel */}
                {showSimulate && (
                    <div className="p-3 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 space-y-2 animate-in">
                        <p className="text-xs font-medium text-surface-700 dark:text-surface-300">Simulate incoming email</p>
                        <input value={simForm.from} onChange={e => setSimForm({ ...simForm, from: e.target.value })}
                            className="input text-xs !py-1.5" placeholder="from@example.com" />
                        <input value={simForm.subject} onChange={e => setSimForm({ ...simForm, subject: e.target.value })}
                            className="input text-xs !py-1.5" placeholder="Subject" />
                        <textarea value={simForm.body} onChange={e => setSimForm({ ...simForm, body: e.target.value })}
                            className="input text-xs !py-1.5 min-h-[60px]" placeholder="Body..." />
                        <button onClick={handleSimulate} disabled={simulating} className="btn-primary text-xs w-full !py-1.5">
                            {simulating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />} Send Simulated Email
                        </button>
                    </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-6 h-6 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <MailOpen className="w-10 h-10 text-surface-300 mx-auto mb-2" />
                            <p className="text-surface-500 text-sm">No messages. Click "Sync Emails" to pull in sent emails.</p>
                        </div>
                    ) : (
                        messages.map(msg => (
                            <div
                                key={msg._id}
                                onClick={() => openThread(msg)}
                                className={`flex items-start gap-3 px-4 py-3 border-b border-surface-100 dark:border-surface-800 cursor-pointer transition-all hover:bg-surface-50 dark:hover:bg-surface-800/50 ${selectedMsg?._id === msg._id ? 'bg-primary-50/50 dark:bg-primary-500/5' : ''} ${!msg.isRead ? 'bg-blue-50/30 dark:bg-blue-500/5' : ''}`}
                            >
                                {/* Direction indicator */}
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${msg.direction === 'inbound'
                                    ? 'bg-green-100 dark:bg-green-500/10' : 'bg-primary-100 dark:bg-primary-500/10'}`}>
                                    {msg.direction === 'inbound'
                                        ? <Inbox className="w-3 h-3 text-green-500" />
                                        : <Send className="w-3 h-3 text-primary-500" />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm truncate ${!msg.isRead ? 'font-semibold text-surface-900 dark:text-white' : 'text-surface-700 dark:text-surface-300'}`}>
                                            {msg.direction === 'inbound' ? msg.from : msg.to}
                                        </span>
                                        {msg.needsReply && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />}
                                    </div>
                                    <p className={`text-xs truncate mt-0.5 ${!msg.isRead ? 'text-surface-700 dark:text-surface-300' : 'text-surface-500'}`}>
                                        {msg.subject || '(no subject)'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {msg.campaignId && (
                                            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-primary-50 dark:bg-primary-500/10 text-primary-500">
                                                {msg.campaignId.name}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-surface-400">{timeAgo(msg.receivedAt)}</span>
                                    </div>
                                </div>

                                <button onClick={e => toggleStar(e, msg._id)} className="flex-shrink-0 p-1">
                                    {msg.isStarred
                                        ? <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                        : <Star className="w-3.5 h-3.5 text-surface-300 hover:text-amber-400" />}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Message Detail / Thread */}
            {selectedMsg && (
                <div className="flex-1 glass-card overflow-hidden flex flex-col animate-in">
                    {/* Header */}
                    <div className="p-4 border-b border-surface-200 dark:border-surface-700">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setSelectedMsg(null)} className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg">
                                <ArrowLeft className="w-4 h-4 text-surface-500" />
                            </button>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-surface-900 dark:text-white truncate">
                                    {selectedMsg.subject || '(no subject)'}
                                </h3>
                                <p className="text-xs text-surface-500">
                                    {selectedMsg.direction === 'inbound' ? `From: ${selectedMsg.from}` : `To: ${selectedMsg.to}`}
                                    {selectedMsg.campaignId && ` • Campaign: ${selectedMsg.campaignId.name}`}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedMsg.contactId && (
                                    <div className="relative group">
                                        <select 
                                            value={selectedMsg.contactId?.pipelineStage || 'Identified'}
                                            onChange={(e) => handleStageChange(selectedMsg.contactId._id, e.target.value)}
                                            disabled={updatingStage}
                                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border-0 cursor-pointer appearance-none pr-8 transition-colors ${
                                                selectedMsg.contactId?.pipelineStage === 'Link Secured' 
                                                ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' 
                                                : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300'
                                            }`}
                                        >
                                            {PIPELINE_STAGES.map(stage => (
                                                <option key={stage} value={stage}>{stage}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                                    </div>
                                )}
                                <button
                                    onClick={() => toggleNeedsReply(selectedMsg._id, !selectedMsg.needsReply)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedMsg.needsReply
                                        ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                                        : 'bg-surface-100 text-surface-500 dark:bg-surface-800'}`}
                                >
                                    {selectedMsg.needsReply ? '⚠ Needs Reply' : '✓ Resolved'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Thread messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {threadLoading ? (
                            <div className="flex justify-center py-8">
                                <div className="w-6 h-6 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : thread.map((msg, i) => (
                            <div key={msg._id || i} className={`rounded-xl p-4 ${msg.direction === 'inbound'
                                ? 'bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700'
                                : 'bg-primary-50/50 dark:bg-primary-500/5 border border-primary-200 dark:border-primary-800'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${msg.direction === 'inbound'
                                        ? 'bg-green-100 dark:bg-green-500/20 text-green-600' : 'bg-primary-100 dark:bg-primary-500/20 text-primary-600'}`}>
                                        {msg.direction === 'inbound' ? msg.from.charAt(0).toUpperCase() : 'Me'}
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-surface-900 dark:text-white">
                                            {msg.direction === 'inbound' ? msg.from : 'You'}
                                        </span>
                                        <span className="text-[10px] text-surface-400 ml-2">
                                            → {msg.direction === 'inbound' ? 'you' : msg.to}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-surface-400">{timeAgo(msg.receivedAt)}</span>
                                </div>
                                {msg.htmlBody ? (
                                    <div className="text-sm text-surface-700 dark:text-surface-300 prose prose-sm dark:prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{ __html: msg.htmlBody }} />
                                ) : msg.snippet ? (
                                    <p className="text-sm text-surface-700 dark:text-surface-300">{msg.snippet}</p>
                                ) : (
                                    <p className="text-sm text-surface-400 italic">No preview available</p>
                                )}
                            </div>
                        ))}
                        
                        {/* Inline Reply Box */}
                        {!threadLoading && thread.length > 0 && (
                            <div className="mt-4 border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
                                <textarea
                                    value={replyBody}
                                    onChange={e => setReplyBody(e.target.value)}
                                    placeholder="Write your reply here... (Sends directly via connected Gmail account)"
                                    className="w-full bg-transparent border-0 resize-none p-4 text-sm text-surface-900 dark:text-white placeholder:text-surface-400 focus:ring-0 min-h-[100px]"
                                />
                                <div className="flex justify-between items-center px-4 py-3 bg-surface-50 dark:bg-surface-800/50 border-t border-surface-100 dark:border-surface-800">
                                    <span className="text-xs text-surface-500 flex items-center gap-1">
                                        <MessageSquare className="w-3.5 h-3.5" /> Replies are threaded automatically
                                    </span>
                                    <button 
                                        onClick={handleInlineReply} 
                                        disabled={replying || !replyBody.trim()}
                                        className="btn-primary py-1.5 px-4 text-sm shadow-sm flex items-center gap-2"
                                    >
                                        {replying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        Send Reply
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
