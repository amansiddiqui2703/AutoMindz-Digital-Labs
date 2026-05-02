import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TLink from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
    ArrowLeft, Save, Play, Pause, Plus, Trash2, ChevronDown, ChevronUp,
    Mail, Users, Settings as SettingsIcon, Zap, Clock, Send, Eye,
    Bold, Italic, Underline as UIcon, Link2, AlignLeft, AlignCenter, AlignRight,
    List, ListOrdered, Type, Code, Loader2, BarChart3, CheckCircle, XCircle,
    StopCircle, Timer, Sparkles, Wand2, X, GripVertical, Copy, FlaskConical,
    CalendarClock, Flame, FileText
} from 'lucide-react';

const conditionLabels = {
    no_reply: '📬 If no reply',
    no_open: '👁️ If not opened',
    no_click: '🔗 If no click',
    all: '📤 Send to all',
};

const seqStatusColors = {
    active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    stopped_reply: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    stopped_unsubscribe: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const seqStatusLabels = {
    active: 'Active',
    completed: 'Completed',
    stopped_reply: 'Replied',
    stopped_unsubscribe: 'Unsubscribed',
    paused: 'Paused',
};

const ToolBtn = ({ icon: Icon, active, onClick, title }) => (
    <button onClick={onClick} title={title}
        className={`p-1.5 rounded-lg transition-all ${active ? 'bg-primary-100 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400' : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800'}`}>
        <Icon className="w-4 h-4" />
    </button>
);

export default function CampaignDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [campaign, setCampaign] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('content');
    const [accounts, setAccounts] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [sequenceStats, setSequenceStats] = useState(null);

    // Form state
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [subjectB, setSubjectB] = useState('');
    const [abTestEnabled, setAbTestEnabled] = useState(false);
    const [abStats, setAbStats] = useState(null);
    const [cc, setCc] = useState('');
    const [bcc, setBcc] = useState('');
    const [delay, setDelay] = useState(5);
    const [dailyLimit, setDailyLimit] = useState(200);
    const [selectedAccounts, setSelectedAccounts] = useState([]);
    const [recipients, setRecipients] = useState([]);
    const [followUps, setFollowUps] = useState([]);
    const [warmupMode, setWarmupMode] = useState(false);
    const [warmupDailyIncrease, setWarmupDailyIncrease] = useState(10);
    const [scheduledAt, setScheduledAt] = useState('');
    const [templates, setTemplates] = useState([]);
    const [showTemplates, setShowTemplates] = useState(false);

    // Follow-up editor state
    const [editingStep, setEditingStep] = useState(null);
    const [stepSubject, setStepSubject] = useState('');
    const [stepHtml, setStepHtml] = useState('');
    const [stepDelay, setStepDelay] = useState(3);
    const [stepCondition, setStepCondition] = useState('no_reply');

    // Recipient add
    const [showAddRecipients, setShowAddRecipients] = useState(false);
    const [recipientSearch, setRecipientSearch] = useState('');
    const [filterSource, setFilterSource] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [addingLeads, setAddingLeads] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TLink.configure({ openOnClick: false }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Placeholder.configure({ placeholder: 'Write your email body here...' }),
        ],
        content: '',
    });

    const stepEditor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TLink.configure({ openOnClick: false }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Placeholder.configure({ placeholder: 'Write your follow-up email body...' }),
        ],
        content: '',
    });

    const fetchCampaign = useCallback(async () => {
        try {
            const res = await api.get(`/campaigns/${id}`);
            const c = res.data.campaign;
            setCampaign(c);
            setName(c.name);
            setSubject(c.subject || '');
            setSubjectB(c.subjectB || '');
            setAbTestEnabled(!!c.subjectB);
            setCc(c.cc || '');
            setBcc(c.bcc || '');
            setWarmupMode(c.warmupMode || false);
            setWarmupDailyIncrease(c.warmupDailyIncrease || 10);
            setDelay(c.delay || 5);
            setDailyLimit(c.dailyLimit || 200);
            setSelectedAccounts(c.accountIds || []);
            setRecipients(c.recipients || []);
            setFollowUps(
                (c.followUps || [])
                    .sort((a, b) => a.stepNumber - b.stepNumber)
                    .map(f => ({ ...f, _key: f._id || `step-${f.stepNumber}` }))
            );
            if (editor && c.htmlBody) {
                editor.commands.setContent(c.htmlBody);
            }
        } catch {
            toast.error('Failed to load campaign');
            navigate('/campaigns');
        } finally {
            setLoading(false);
        }
    }, [id, navigate, editor]);

    const fetchAccounts = async () => {
        try {
            const res = await api.get('/accounts');
            setAccounts(res.data.accounts || []);
        } catch { toast.error('Failed to load accounts'); }
    };

    const fetchContacts = async () => {
        try {
            const res = await api.get('/contacts?limit=500');
            setContacts(res.data.contacts || []);
        } catch { toast.error('Failed to load contacts'); }
    };

    const fetchSequenceStats = async () => {
        try {
            const res = await api.get(`/campaigns/${id}/sequence-stats`);
            setSequenceStats(res.data);
        } catch { toast.error('Failed to load sequence stats'); }
    };

    const fetchAbStats = async () => {
        try {
            const res = await api.get(`/campaigns/${id}/ab-stats`);
            if (res.data.abTest) setAbStats(res.data);
        } catch { toast.error('Failed to load A/B stats'); }
    };

    const fetchTemplates = async () => {
        try {
            const res = await api.get('/templates');
            setTemplates(res.data.templates || []);
        } catch { toast.error('Failed to load templates'); }
    };

    useEffect(() => {
        fetchCampaign();
        fetchAccounts();
        fetchContacts();
        fetchTemplates();
    }, [fetchCampaign]);

    useEffect(() => {
        if (activeTab === 'sequence' && campaign?.followUps?.length > 0) {
            fetchSequenceStats();
        }
        if (activeTab === 'content' && campaign?.status !== 'draft') {
            fetchAbStats();
        }
    }, [activeTab]);

    const handleSave = async () => {
        if (!name.trim()) return toast.error('Campaign name is required');
        setSaving(true);
        try {
            const htmlBody = editor?.getHTML() || '';
            const payload = {
                name, subject, subjectB: abTestEnabled ? subjectB : '', htmlBody, cc, bcc, delay, dailyLimit,
                warmupMode, warmupDailyIncrease,
                accountIds: selectedAccounts,
                recipients,
                followUps: followUps.map((f, i) => ({
                    subject: f.subject || '',
                    htmlBody: f.htmlBody || '',
                    plainBody: f.plainBody || '',
                    delayDays: f.delayDays || 3,
                    condition: f.condition || 'no_reply',
                    stepNumber: i + 1,
                })),
            };
            await api.put(`/campaigns/${id}`, payload);
            toast.success('Campaign saved!');
            fetchCampaign();
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleSend = async () => {
        try {
            await api.post(`/campaigns/${id}/send`);
            toast.success('Campaign started!');
            fetchCampaign();
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed to start');
        }
    };

    const handleSchedule = async () => {
        if (!scheduledAt) return toast.error('Please select a date and time');
        try {
            // Convert to absolute UTC before passing to backend
            const utcDateStr = new Date(scheduledAt).toISOString();
            await api.post(`/campaigns/${id}/schedule`, { scheduledAt: utcDateStr });
            toast.success('Campaign scheduled!');
            fetchCampaign();
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed to schedule');
        }
    };

    const handlePause = async () => {
        try {
            await api.post(`/campaigns/${id}/pause`);
            toast.success('Campaign paused');
            fetchCampaign();
        } catch {
            toast.error('Failed to pause');
        }
    };

    const loadTemplate = (template) => {
        setSubject(template.subject || subject);
        if (editor && template.htmlBody) {
            editor.commands.setContent(template.htmlBody);
        }
        setShowTemplates(false);
        toast.success(`Template "${template.name}" loaded`);
    };

    // --- Follow-up management ---
    const addFollowUp = () => {
        const nextStep = followUps.length + 1;
        if (nextStep > 4) return toast.error('Maximum 4 follow-up steps');
        setFollowUps([...followUps, {
            _key: `new-${Date.now()}`,
            subject: '',
            htmlBody: '',
            plainBody: '',
            delayDays: 3,
            condition: 'no_reply',
            stepNumber: nextStep,
        }]);
    };

    const removeFollowUp = (index) => {
        const updated = followUps.filter((_, i) => i !== index)
            .map((f, i) => ({ ...f, stepNumber: i + 1 }));
        setFollowUps(updated);
        if (editingStep === index) setEditingStep(null);
    };

    const openStepEditor = (index) => {
        const step = followUps[index];
        setEditingStep(index);
        setStepSubject(step.subject || '');
        setStepHtml(step.htmlBody || '');
        setStepDelay(step.delayDays || 3);
        setStepCondition(step.condition || 'no_reply');
        if (stepEditor) {
            stepEditor.commands.setContent(step.htmlBody || '');
        }
    };

    const saveStepEdit = () => {
        if (editingStep === null) return;
        const updated = [...followUps];
        updated[editingStep] = {
            ...updated[editingStep],
            subject: stepSubject,
            htmlBody: stepEditor?.getHTML() || stepHtml,
            delayDays: stepDelay,
            condition: stepCondition,
        };
        setFollowUps(updated);
        setEditingStep(null);
        toast.success(`Follow-up step ${editingStep + 1} updated`);
    };

    // --- Recipient management ---
    const addRecipient = (contact) => {
        if (recipients.find(r => r.email === contact.email)) {
            return toast.error('Already added');
        }
        setRecipients([...recipients, {
            contactId: contact._id,
            email: contact.email,
            name: contact.name || '',
            company: contact.company || '',
            status: 'pending',
        }]);
    };

    const removeRecipient = (index) => {
        setRecipients(recipients.filter((_, i) => i !== index));
    };

    const toggleAccount = (accountId) => {
        setSelectedAccounts(prev =>
            prev.includes(accountId)
                ? prev.filter(id => id !== accountId)
                : [...prev, accountId]
        );
    };

    const isEditable = campaign?.status === 'draft' || campaign?.status === 'paused';

    const handleAddSelectedContacts = async (contactsToAdd) => {
        const newRecipients = contactsToAdd.map(c => ({
            contactId: c._id,
            email: c.email,
            name: c.name || '',
            company: c.company || '',
            status: 'pending',
        }));

        if (isEditable) {
            // Just update local state, user will click Save
            setRecipients([...recipients, ...newRecipients]);
            toast.success(`${newRecipients.length} contacts added to draft! Click Save.`);
            setShowAddRecipients(false);
            setRecipientSearch('');
        } else {
            // Campaign is running/scheduled, hit the API directly
            setAddingLeads(true);
            try {
                const contactIds = contactsToAdd.map(c => c._id);
                const res = await api.post(`/campaigns/${id}/add-leads`, { contactIds });
                toast.success(res.data.message || 'Contacts added to campaign!');
                setShowAddRecipients(false);
                setRecipientSearch('');
                fetchCampaign(); // Refresh everything
            } catch (err) {
                toast.error(err.response?.data?.error || 'Failed to add leads');
            } finally {
                setAddingLeads(false);
            }
        }
    };

    const filteredContacts = contacts.filter(c => {
        // Exclude already added
        if (recipients.find(r => r.email === c.email)) return false;
        
        // Name/Email search
        if (recipientSearch && !c.email?.toLowerCase().includes(recipientSearch.toLowerCase()) && !c.name?.toLowerCase().includes(recipientSearch.toLowerCase())) {
            return false;
        }

        // Source filter
        if (filterSource && c.source !== filterSource) return false;

        // Date filters
        if (filterStartDate || filterEndDate) {
            const createdAt = new Date(c.createdAt);
            if (filterStartDate && createdAt < new Date(filterStartDate)) return false;
            if (filterEndDate) {
                const end = new Date(filterEndDate);
                end.setHours(23, 59, 59, 999);
                if (createdAt > end) return false;
            }
        }

        return true;
    });

    // Extract unique sources for the filter dropdown
    const availableSources = [...new Set(contacts.map(c => c.source).filter(Boolean))];

    const handleDragStart = (e, contact) => {
        e.dataTransfer.setData('contactId', contact._id);
    };

    const handleDrop = async (e, newStage) => {
        e.preventDefault();
        const contactId = e.dataTransfer.getData('contactId');
        if (!contactId) return;

        try {
            await api.patch(`/contacts/${contactId}/stage`, { pipelineStage: newStage });
            toast.success(`Moved to ${newStage}`);
            fetchContacts();
        } catch {
            toast.error('Failed to move contact');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/campaigns')} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-all">
                        <ArrowLeft className="w-5 h-5 text-surface-500" />
                    </button>
                    <div>
                        <input
                            value={name} onChange={e => setName(e.target.value)}
                            className="text-2xl font-bold bg-transparent border-none outline-none text-surface-900 dark:text-white"
                            placeholder="Campaign Name"
                            disabled={!isEditable}
                        />
                        <div className="flex items-center gap-3 mt-1">
                            <span className={`badge ${campaign?.status === 'draft' ? 'badge-purple' : campaign?.status === 'running' ? 'badge-success' : campaign?.status === 'paused' ? 'badge-warning' : campaign?.status === 'scheduled' ? 'badge-info' : 'badge-info'}`}>
                                {campaign?.status}
                            </span>
                            <span className="text-sm text-surface-500">{recipients.length} recipients</span>
                            {followUps.length > 0 && (
                                <span className="text-sm text-surface-500">• {followUps.length} follow-up{followUps.length > 1 ? 's' : ''}</span>
                            )}
                            {abTestEnabled && <span className="badge badge-info">A/B Test</span>}
                            {warmupMode && <span className="badge badge-warning">🔥 Warmup</span>}
                            {campaign?.status === 'scheduled' && campaign?.scheduledAt && (
                                <span className="text-sm text-surface-500">📅 {new Date(campaign.scheduledAt).toLocaleString()}</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isEditable && (
                        <button onClick={handleSave} disabled={saving} className="btn-secondary" id="save-campaign">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save
                        </button>
                    )}
                    {campaign?.status === 'draft' && (
                        <>
                            <div className="flex items-center gap-2">
                                <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                                    className="input !py-1.5 !text-xs !w-44" />
                                <button onClick={handleSchedule} className="btn-secondary !py-1.5" title="Schedule for later">
                                    <CalendarClock className="w-4 h-4" /> Schedule
                                </button>
                            </div>
                            <button onClick={handleSend} className="btn-primary" id="send-campaign">
                                <Play className="w-4 h-4" /> Send Now
                            </button>
                        </>
                    )}
                    {campaign?.status === 'scheduled' && (
                        <span className="badge badge-info text-sm">📅 Scheduled for {new Date(campaign.scheduledAt).toLocaleString()}</span>
                    )}
                    {campaign?.status === 'running' && (
                        <button onClick={handlePause} className="btn-warning">
                            <Pause className="w-4 h-4" /> Pause
                        </button>
                    )}
                </div>
            </div>

            {/* Stats bar */}
            {campaign?.status !== 'draft' && (
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                    {[
                        { label: 'Total', value: campaign?.stats?.total || 0, icon: Users },
                        { label: 'Sent', value: campaign?.stats?.sent || 0, icon: Send },
                        { label: 'Opened', value: campaign?.stats?.opened || 0, icon: Eye },
                        { label: 'Clicked', value: campaign?.stats?.clicked || 0, icon: Link2 },
                        { label: 'Replied', value: campaign?.stats?.replied || 0, icon: CheckCircle },
                        { label: 'Failed', value: campaign?.stats?.failed || 0, icon: XCircle },
                        { label: 'Unsubs', value: campaign?.stats?.unsubscribed || 0, icon: StopCircle },
                    ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="glass-card p-3 text-center">
                            <Icon className="w-4 h-4 mx-auto text-surface-400 mb-1" />
                            <div className="text-lg font-bold text-surface-900 dark:text-white">{value}</div>
                            <div className="text-xs text-surface-500">{label}</div>
                        </div>
                    ))}
                </div>
            )}
            {/* Tabs */}
            <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1">
                {[
                    { key: 'content', label: 'Email Content', icon: Mail },
                    { key: 'sequence', label: 'Sequence Builder', icon: Zap },
                    { key: 'pipeline', label: 'Pipeline', icon: GripVertical },
                    { key: 'recipients', label: 'Recipients', icon: Users },
                    { key: 'settings', label: 'Settings', icon: SettingsIcon },
                ].map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === key
                            ? 'bg-white dark:bg-surface-900 shadow text-surface-900 dark:text-white'
                            : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                            }`}
                    >
                        <Icon className="w-4 h-4" /> {label}
                    </button>
                ))}
            </div>

            {/* === TAB: Email Content === */}
            {activeTab === 'content' && (
                <div className="space-y-4">
                    <div className="glass-card overflow-hidden">
                        <div className="border-b border-surface-200 dark:border-surface-700">
                            <div className="flex items-center px-5 py-2.5">
                                <span className="text-sm font-medium text-surface-500 w-20">Subject</span>
                                <input value={subject} onChange={e => setSubject(e.target.value)}
                                    className="flex-1 bg-transparent border-none outline-none text-sm text-surface-900 dark:text-white font-medium"
                                    placeholder="Email subject — use {{name}}, {{company}} etc."
                                    disabled={!isEditable} />
                            </div>
                        </div>

                        {/* A/B Test Subject */}
                        <div className="border-b border-surface-200 dark:border-surface-700">
                            <div className="flex items-center px-5 py-2">
                                <button onClick={() => setAbTestEnabled(!abTestEnabled)} disabled={!isEditable}
                                    className={`flex items-center gap-2 text-xs font-medium mr-3 px-3 py-1.5 rounded-lg transition-all ${abTestEnabled ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                                        }`}>
                                    <FlaskConical className="w-3.5 h-3.5" />
                                    A/B Test {abTestEnabled ? 'ON' : 'OFF'}
                                </button>
                                {abTestEnabled && (
                                    <>
                                        <span className="text-xs font-medium text-purple-500 w-16">Subject B</span>
                                        <input value={subjectB} onChange={e => setSubjectB(e.target.value)}
                                            className="flex-1 bg-transparent border-none outline-none text-sm text-surface-900 dark:text-white"
                                            placeholder="Alternative subject for 50% of recipients"
                                            disabled={!isEditable} />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Load Template */}
                        <div className="border-b border-surface-200 dark:border-surface-700">
                            <div className="flex items-center px-5 py-2">
                                <button onClick={() => setShowTemplates(!showTemplates)} className="flex items-center gap-2 text-xs font-medium text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 px-3 py-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-all">
                                    <FileText className="w-3.5 h-3.5" /> Load Template
                                </button>
                            </div>
                            {showTemplates && (
                                <div className="px-5 pb-3 max-h-40 overflow-y-auto">
                                    {templates.length === 0 ? (
                                        <p className="text-xs text-surface-400">No templates saved yet. Go to Templates page to create one.</p>
                                    ) : templates.map(t => (
                                        <button key={t._id} onClick={() => loadTemplate(t)}
                                            className="block w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface-100 dark:hover:bg-surface-800 transition-all">
                                            <span className="font-medium text-surface-900 dark:text-white">{t.name}</span>
                                            {t.subject && <span className="text-xs text-surface-400 ml-2">— {t.subject}</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Toolbar */}
                        {isEditable && editor && (
                            <div className="flex items-center gap-1 px-4 py-2 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 flex-wrap">
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
                                    <button className="btn-secondary !py-1.5 !px-3 !text-xs">{'{{ }}'} Merge Tags</button>
                                    <div className="hidden group-hover:block absolute top-full left-0 mt-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl z-20 py-2 min-w-[150px]">
                                        {['name', 'first_name', 'email', 'company'].map(tag => (
                                            <button key={tag} onClick={() => editor.commands.insertContent(`{{${tag}}}`)}
                                                className="block w-full text-left px-4 py-1.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700">
                                                {`{{${tag}}}`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="tiptap-editor">
                            <EditorContent editor={editor} className="min-h-[300px]" />
                        </div>
                    </div>

                    {/* A/B Test Results (shown after campaign runs) */}
                    {abStats && (
                        <div className="glass-card p-5">
                            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                                <FlaskConical className="w-5 h-5 text-purple-500" /> A/B Test Results
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                {[{ label: 'A', subject: abStats.subjectA, stats: abStats.variantA, color: 'blue' },
                                { label: 'B', subject: abStats.subjectB, stats: abStats.variantB, color: 'purple' }].map(v => (
                                    <div key={v.label} className={`p-4 rounded-xl border-2 ${v.stats.openRate > (v.label === 'A' ? abStats.variantB : abStats.variantA).openRate ? 'border-green-500 bg-green-50 dark:bg-green-500/10' : 'border-surface-200 dark:border-surface-700'}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`badge badge-${v.color === 'blue' ? 'info' : 'purple'}`}>Variant {v.label}</span>
                                            {v.stats.openRate > (v.label === 'A' ? abStats.variantB : abStats.variantA).openRate && (
                                                <span className="text-xs text-green-600 font-medium">⭐ Winner</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-surface-600 dark:text-surface-400 mb-3 truncate" title={v.subject}>"{v.subject}"</p>
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div><div className="text-lg font-bold text-surface-900 dark:text-white">{v.stats.openRate}%</div><div className="text-xs text-surface-500">Opens</div></div>
                                            <div><div className="text-lg font-bold text-surface-900 dark:text-white">{v.stats.clickRate}%</div><div className="text-xs text-surface-500">Clicks</div></div>
                                            <div><div className="text-lg font-bold text-surface-900 dark:text-white">{v.stats.replyRate}%</div><div className="text-xs text-surface-500">Replies</div></div>
                                        </div>
                                        <p className="text-xs text-surface-400 mt-2">{v.stats.sent} sent</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* === TAB: Sequence Builder === */}
            {activeTab === 'sequence' && (
                <div className="space-y-4">
                    {/* Initial Email (Step 0) */}
                    <div className="glass-card p-5 border-l-4 border-primary-500">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm">0</div>
                            <div>
                                <h3 className="font-semibold text-surface-900 dark:text-white">Initial Email</h3>
                                <p className="text-xs text-surface-500">Sent immediately when campaign starts</p>
                            </div>
                            <div className="flex-1" />
                            <span className="badge badge-info">Day 0</span>
                        </div>
                        <div className="ml-11 text-sm text-surface-600 dark:text-surface-400">
                            <p><strong>Subject:</strong> {subject || <span className="text-surface-400 italic">Not set</span>}</p>
                        </div>
                    </div>

                    {/* Follow-up connector */}
                    {followUps.length > 0 && (
                        <div className="flex justify-center">
                            <div className="w-px h-6 bg-surface-300 dark:bg-surface-600" />
                        </div>
                    )}

                    {/* Follow-up Steps */}
                    {followUps.map((step, index) => {
                        const cumulativeDelay = followUps.slice(0, index + 1).reduce((sum, s) => sum + (s.delayDays || 3), 0);
                        return (
                            <div key={step._key || index}>
                                <div className={`glass-card p-5 border-l-4 transition-all ${editingStep === index
                                    ? 'border-accent-500 ring-2 ring-accent-500/20'
                                    : 'border-surface-300 dark:border-surface-600'
                                    }`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-accent-100 dark:bg-accent-500/20 flex items-center justify-center text-accent-600 dark:text-accent-400 font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-surface-900 dark:text-white">
                                                Follow-up #{index + 1}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-surface-500">
                                                    {conditionLabels[step.condition] || conditionLabels.no_reply}
                                                </span>
                                                <span className="text-xs text-surface-400">•</span>
                                                <span className="text-xs text-surface-500">
                                                    {step.subject ? `Subject: ${step.subject}` : 'Re: (same thread)'}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="badge badge-purple">Day {cumulativeDelay}</span>
                                        {isEditable && (
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => editingStep === index ? setEditingStep(null) : openStepEditor(index)}
                                                    className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg text-surface-500" title="Edit">
                                                    {editingStep === index ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                                <button onClick={() => removeFollowUp(index)}
                                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-red-500" title="Remove">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Expanded editor */}
                                    {editingStep === index && (
                                        <div className="mt-4 ml-11 space-y-4 animate-in">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">
                                                        Delay (days after previous step)
                                                    </label>
                                                    <input type="number" min="1" max="30" value={stepDelay}
                                                        onChange={e => setStepDelay(Number(e.target.value))}
                                                        className="input !py-2" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">
                                                        Condition
                                                    </label>
                                                    <select value={stepCondition} onChange={e => setStepCondition(e.target.value)}
                                                        className="input !py-2">
                                                        {Object.entries(conditionLabels).map(([val, label]) => (
                                                            <option key={val} value={val}>{label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">
                                                    Subject (leave empty for "Re: original subject")
                                                </label>
                                                <input value={stepSubject} onChange={e => setStepSubject(e.target.value)}
                                                    className="input !py-2" placeholder="Optional custom subject" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">
                                                    Email Body
                                                </label>
                                                <div className="border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
                                                    {stepEditor && (
                                                        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                                                            <ToolBtn icon={Bold} active={stepEditor.isActive('bold')} onClick={() => stepEditor.chain().focus().toggleBold().run()} title="Bold" />
                                                            <ToolBtn icon={Italic} active={stepEditor.isActive('italic')} onClick={() => stepEditor.chain().focus().toggleItalic().run()} title="Italic" />
                                                            <ToolBtn icon={UIcon} active={stepEditor.isActive('underline')} onClick={() => stepEditor.chain().focus().toggleUnderline().run()} title="Underline" />
                                                            <div className="w-px h-4 bg-surface-200 dark:bg-surface-700 mx-1" />
                                                            <ToolBtn icon={List} active={stepEditor.isActive('bulletList')} onClick={() => stepEditor.chain().focus().toggleBulletList().run()} title="Bullets" />
                                                            <ToolBtn icon={Link2} onClick={() => { const url = prompt('URL:'); if (url) stepEditor.chain().focus().setLink({ href: url }).run(); }} title="Link" />
                                                            <div className="w-px h-4 bg-surface-200 dark:bg-surface-700 mx-1" />
                                                            <div className="relative group">
                                                                <button className="text-xs text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 px-2">{'{{ }}'}</button>
                                                                <div className="hidden group-hover:block absolute top-full left-0 mt-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl z-20 py-2 min-w-[130px]">
                                                                    {['name', 'first_name', 'email', 'company'].map(tag => (
                                                                        <button key={tag} onClick={() => stepEditor.commands.insertContent(`{{${tag}}}`)}
                                                                            className="block w-full text-left px-3 py-1 text-xs text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700">
                                                                            {`{{${tag}}}`}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="tiptap-editor">
                                                        <EditorContent editor={stepEditor} className="min-h-[150px]" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setEditingStep(null)} className="btn-secondary !py-2">Cancel</button>
                                                <button onClick={saveStepEdit} className="btn-primary !py-2">
                                                    <CheckCircle className="w-4 h-4" /> Save Step
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Connector line */}
                                {index < followUps.length - 1 && (
                                    <div className="flex justify-center">
                                        <div className="w-px h-6 bg-surface-300 dark:bg-surface-600" />
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Add follow-up button */}
                    {isEditable && followUps.length < 4 && (
                        <div className="flex justify-center">
                            {followUps.length > 0 && <div className="w-px h-4 bg-surface-300 dark:bg-surface-600 mb-2" />}
                            <button onClick={addFollowUp}
                                className="btn-secondary !border-dashed !border-2 w-full max-w-md mx-auto">
                                <Plus className="w-4 h-4" />
                                Add Follow-Up Step ({followUps.length}/4)
                            </button>
                        </div>
                    )}

                    {/* Sequence Stats (if campaign has been sent) */}
                    {sequenceStats && sequenceStats.summary.totalSteps > 0 && (
                        <div className="glass-card p-5 mt-6">
                            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-primary-500" /> Sequence Progress
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
                                {[
                                    { label: 'Active', value: sequenceStats.summary.activeSequences, color: 'text-blue-500' },
                                    { label: 'Completed', value: sequenceStats.summary.completedSequences, color: 'text-green-500' },
                                    { label: 'Replied', value: sequenceStats.summary.stoppedByReply, color: 'text-purple-500' },
                                    { label: 'Unsubscribed', value: sequenceStats.summary.stoppedByUnsubscribe, color: 'text-red-500' },
                                    { label: 'Total Steps', value: sequenceStats.summary.totalSteps, color: 'text-surface-500' },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className="text-center">
                                        <div className={`text-2xl font-bold ${color}`}>{value}</div>
                                        <div className="text-xs text-surface-500">{label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Recipient progress table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-surface-500 border-b border-surface-200 dark:border-surface-700">
                                            <th className="pb-2 font-medium">Recipient</th>
                                            <th className="pb-2 font-medium">Step</th>
                                            <th className="pb-2 font-medium">Status</th>
                                            <th className="pb-2 font-medium">Next Follow-up</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sequenceStats.recipients.slice(0, 20).map((r, i) => (
                                            <tr key={i} className="border-b border-surface-100 dark:border-surface-800">
                                                <td className="py-2">
                                                    <div className="text-surface-900 dark:text-white">{r.name || r.email}</div>
                                                    {r.name && <div className="text-xs text-surface-500">{r.email}</div>}
                                                </td>
                                                <td className="py-2">
                                                    <span className="text-surface-700 dark:text-surface-300">
                                                        {r.currentStep}/{r.totalSteps}
                                                    </span>
                                                </td>
                                                <td className="py-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${seqStatusColors[r.sequenceStatus] || ''}`}>
                                                        {seqStatusLabels[r.sequenceStatus] || r.sequenceStatus}
                                                    </span>
                                                </td>
                                                <td className="py-2 text-surface-500 text-xs">
                                                    {r.nextFollowUpAt ? new Date(r.nextFollowUpAt).toLocaleDateString() : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {sequenceStats.recipients.length > 20 && (
                                    <p className="text-xs text-surface-400 mt-2">Showing 20 of {sequenceStats.recipients.length} recipients</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* === TAB: Pipeline (Kanban) === */}
            {activeTab === 'pipeline' && (
                <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 min-h-[600px] scrollbar-thin scrollbar-thumb-surface-200 dark:scrollbar-thumb-surface-700">
                    {(campaign?.pipelineStages || []).map(stage => {
                        const stageContacts = contacts.filter(c => c.pipelineStage === stage.name);
                        return (
                            <div 
                                key={stage.name} 
                                className="flex-shrink-0 w-72 flex flex-col gap-3"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDrop(e, stage.name)}
                            >
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: stage.color }} />
                                        <h3 className="font-bold text-surface-900 dark:text-white text-sm uppercase tracking-wider">{stage.name}</h3>
                                        <span className="bg-surface-100 dark:bg-surface-800 text-surface-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                            {stageContacts.length}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 bg-surface-50/50 dark:bg-surface-800/20 rounded-2xl p-2 border border-surface-200/50 dark:border-surface-700/50 space-y-3">
                                    {stageContacts.length === 0 ? (
                                        <div className="py-12 text-center">
                                            <div className="text-[10px] font-bold text-surface-300 uppercase tracking-widest">Empty Stage</div>
                                        </div>
                                    ) : (
                                        stageContacts.map(contact => (
                                            <div
                                                key={contact._id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, contact)}
                                                onClick={() => navigate(`/contacts/${contact._id}`)}
                                                className="glass-card !p-3 cursor-pointer hover:shadow-md transition-all group border-l-2"
                                                style={{ borderLeftColor: stage.color }}
                                            >
                                                <div className="font-semibold text-sm text-surface-900 dark:text-white truncate group-hover:text-primary-500 transition-colors">
                                                    {contact.name || contact.email}
                                                </div>
                                                <div className="text-[10px] text-surface-400 truncate mt-0.5">{contact.company || 'No company'}</div>
                                                
                                                <div className="mt-3 flex items-center justify-between text-[10px] text-surface-500 pt-2 border-t border-surface-100 dark:border-surface-800">
                                                    <span>{contact.emailCount || 0} emails</span>
                                                    {contact.lastEmailed && (
                                                        <span>{new Date(contact.lastEmailed).toLocaleDateString()}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* === TAB: Recipients === */}
            {activeTab === 'recipients' && (
                <div className="space-y-4">
                    <div className="glass-card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                                Recipients ({recipients.length})
                            </h3>
                            {/* Removed isEditable restriction here so we can always add recipients */}
                            <button onClick={() => setShowAddRecipients(!showAddRecipients)} className="btn-primary !py-2">
                                <Plus className="w-4 h-4" /> Add Contacts
                            </button>
                        </div>

                        {/* Add recipients panel */}
                        {showAddRecipients && (
                            <div className="mb-4 p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-200 dark:border-surface-700 animate-in">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                                    <div className="md:col-span-2">
                                        <input value={recipientSearch} onChange={e => setRecipientSearch(e.target.value)}
                                            className="input w-full" placeholder="Search name or email..." autoFocus />
                                    </div>
                                    <div>
                                        <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className="input w-full">
                                            <option value="">All Sources</option>
                                            {availableSources.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex gap-1">
                                        <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="input w-full !text-xs !px-2" title="Start Date" />
                                        <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="input w-full !text-xs !px-2" title="End Date" />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm font-medium text-surface-600 dark:text-surface-400">
                                        {filteredContacts.length} contacts match filters
                                    </span>
                                    {filteredContacts.length > 0 && (
                                        <button 
                                            onClick={() => handleAddSelectedContacts(filteredContacts)} 
                                            disabled={addingLeads}
                                            className="btn-secondary !py-2 whitespace-nowrap"
                                        >
                                            {addingLeads ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />} 
                                            Add All Matched ({filteredContacts.length})
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-48 overflow-y-auto space-y-1">
                                    {filteredContacts.length === 0 ? (
                                        <p className="text-sm text-surface-400 text-center py-3">No contacts found</p>
                                    ) : filteredContacts.slice(0, 50).map(c => (
                                        <button key={c._id} onClick={() => handleAddSelectedContacts([c])} disabled={addingLeads}
                                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-all text-left">
                                            <div>
                                                <span className="text-sm font-medium text-surface-900 dark:text-white">{c.name || c.email}</span>
                                                {c.name && <span className="text-xs text-surface-500 ml-2">{c.email}</span>}
                                            </div>
                                            <Plus className="w-4 h-4 text-primary-500" />
                                        </button>
                                    ))}
                                    {filteredContacts.length > 50 && (
                                        <p className="text-xs text-surface-400 text-center py-1">
                                            Showing 50 of {filteredContacts.length} — use search to narrow down, or click "Add All"
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Recipients list */}
                        {recipients.length === 0 ? (
                            <div className="text-center py-8">
                                <Users className="w-10 h-10 text-surface-300 mx-auto mb-2" />
                                <p className="text-surface-500">No recipients added yet</p>
                            </div>
                        ) : (
                            <div className="space-y-1 max-h-[400px] overflow-y-auto">
                                {recipients.map((r, i) => (
                                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800/50 group">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-xs font-bold">
                                                {(r.name || r.email)[0].toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium text-surface-900 dark:text-white truncate">{r.name || r.email}</div>
                                                {r.name && <div className="text-xs text-surface-500 truncate">{r.email}</div>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`badge text-xs ${r.status === 'pending' ? 'badge-purple' : r.status === 'sent' ? 'badge-success' : r.status === 'failed' ? 'badge-danger' : 'badge-info'}`}>
                                                {r.status}
                                            </span>
                                            {isEditable && (
                                                <button onClick={() => removeRecipient(i)}
                                                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-500/10 rounded text-red-500 transition-all">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* === TAB: Settings === */}
            {activeTab === 'settings' && (
                <div className="space-y-4">
                    {/* Gmail Accounts */}
                    <div className="glass-card p-5">
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Gmail Accounts</h3>
                        <p className="text-sm text-surface-500 mb-3">Select which accounts to send from (round-robin rotation)</p>
                        {accounts.length === 0 ? (
                            <p className="text-sm text-surface-400">No Gmail accounts connected. Go to Accounts page to connect.</p>
                        ) : (
                            <div className="space-y-2">
                                {accounts.map(a => (
                                    <label key={a._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/50 cursor-pointer transition-all">
                                        <input type="checkbox" checked={selectedAccounts.includes(a._id)}
                                            onChange={() => toggleAccount(a._id)} disabled={!isEditable}
                                            className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500" />
                                        <Mail className="w-4 h-4 text-surface-400" />
                                        <div>
                                            <span className="text-sm font-medium text-surface-900 dark:text-white">{a.email}</span>
                                            <span className="text-xs text-surface-500 ml-2">({a.connectionType})</span>
                                        </div>
                                        <div className="flex-1" />
                                        <span className="text-xs text-surface-400">{a.dailySentCount || 0}/{a.dailyLimit} today</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Send Settings */}
                    <div className="glass-card p-5">
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Send Settings</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                    Delay Between Emails (seconds)
                                </label>
                                <input type="number" value={delay} onChange={e => setDelay(Number(e.target.value))}
                                    min="1" max="60" className="input" disabled={!isEditable} />
                                <p className="text-xs text-surface-400 mt-1">Seconds between each email send</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                    Daily Limit Per Account
                                </label>
                                <input type="number" value={dailyLimit} onChange={e => setDailyLimit(Number(e.target.value))}
                                    min="1" max="500" className="input" disabled={!isEditable} />
                                <p className="text-xs text-surface-400 mt-1">Max emails per account per day</p>
                            </div>
                        </div>
                    </div>

                    {/* Warmup Mode */}
                    <div className="glass-card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                                    <Flame className="w-5 h-5 text-orange-500" /> Warmup Mode
                                </h3>
                                <p className="text-sm text-surface-500 mt-0.5">Gradually increase sending volume to build domain reputation</p>
                            </div>
                            <button onClick={() => setWarmupMode(!warmupMode)} disabled={!isEditable}
                                className={`relative w-12 h-6 rounded-full transition-colors ${warmupMode ? 'bg-orange-500' : 'bg-surface-300 dark:bg-surface-600'}`}>
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${warmupMode ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                        {warmupMode && (
                            <div className="ml-0 sm:ml-7">
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                    Daily Increase (emails per day)
                                </label>
                                <input type="number" value={warmupDailyIncrease} onChange={e => setWarmupDailyIncrease(Number(e.target.value))}
                                    min="1" max="100" className="input !w-32" disabled={!isEditable} />
                                <p className="text-xs text-surface-400 mt-1">
                                    Day 1: {warmupDailyIncrease} emails, Day 2: {warmupDailyIncrease * 2}, Day 3: {warmupDailyIncrease * 3}...
                                </p>
                            </div>
                        )}
                    </div>

                    {/* CC/BCC */}
                    <div className="glass-card p-5">
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">CC / BCC</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">CC</label>
                                <input value={cc} onChange={e => setCc(e.target.value)} className="input"
                                    placeholder="cc@example.com" disabled={!isEditable} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">BCC</label>
                                <input value={bcc} onChange={e => setBcc(e.target.value)} className="input"
                                    placeholder="bcc@example.com" disabled={!isEditable} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
