import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
    ArrowLeft, Mail, Building, Tag, Calendar, Database,
    Trash2, Edit2, Send, Clock, Eye, MousePointerClick, TrendingUp, AlertTriangle, Reply, Loader2
} from 'lucide-react';

const EVENT_CONFIG = {
    contact_created: { icon: Database, color: 'text-surface-500', bg: 'bg-surface-100 dark:bg-surface-800' },
    email_sent: { icon: Send, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-500/10' },
    tracking_open: { icon: Eye, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
    tracking_click: { icon: MousePointerClick, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
    tracking_reply: { icon: TrendingUp, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-500/10' },
    tracking_bounce: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
    tracking_unsubscribe: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
};

export default function ContactDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [contact, setContact] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);

    // Follow-up state
    const [followUpEmailId, setFollowUpEmailId] = useState(null);
    const [followUpBody, setFollowUpBody] = useState('');
    const [followUpSending, setFollowUpSending] = useState(false);

    useEffect(() => {
        fetchContactData();
    }, [id]);

    const fetchContactData = () => {
        setLoading(true);
        api.get(`/contacts/${id}`)
            .then(res => {
                setContact(res.data.contact);
                setTimeline(res.data.timeline);
                setEditForm({
                    name: res.data.contact.name || '',
                    company: res.data.contact.company || '',
                    email: res.data.contact.email || ''
                });
            })
            .catch(err => {
                toast.error('Failed to load contact records');
                navigate('/contacts');
            })
            .finally(() => setLoading(false));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/contacts/${id}`, editForm);
            toast.success('Contact updated');
            setIsEditing(false);
            fetchContactData();
        } catch (err) {
            toast.error('Failed to update contact');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to completely delete this contact? This action cannot be reversed.')) return;
        try {
            await api.delete(`/contacts/${id}`);
            toast.success('Contact deleted');
            navigate('/contacts');
        } catch (err) {
            toast.error('Failed to delete contact');
        }
    };

    const sendFollowUp = async (emailId) => {
        if (!followUpBody.trim()) return toast.error('Please write a message');
        setFollowUpSending(true);
        try {
            await api.post('/emails/send-followup', {
                originalEmailId: emailId,
                htmlBody: `<p>${followUpBody.replace(/\n/g, '<br/>')}</p>`
            });
            toast.success('Follow-up sent successfully!');
            setFollowUpEmailId(null);
            setFollowUpBody('');
            fetchContactData(); // refresh timeline
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to send follow-up');
        } finally {
            setFollowUpSending(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
        );
    }

    if (!contact) return null;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header / Back */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/contacts')} className="p-2 hover:bg-surface-200 dark:hover:bg-surface-800 rounded-lg text-surface-500 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Contact CRM Record</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT COL: Contact Info */}
                <div className="space-y-6">
                    <div className="glass-card p-6">
                        <div className="flex items-start justify-between mb-6">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary-500/20">
                                {contact.email.charAt(0).toUpperCase()}
                            </div>
                            {!isEditing ? (
                                <div className="flex gap-2">
                                    <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg text-surface-500 transition-colors" title="Edit Contact">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={handleDelete} className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-red-500 transition-colors" title="Delete Contact">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={() => setIsEditing(false)} className="btn-secondary text-xs py-1.5 px-3">Cancel</button>
                                    <button onClick={handleSave} disabled={saving} className="btn-primary text-xs py-1.5 px-3">
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="space-y-4">
                                <div><label className="text-xs font-semibold text-surface-500 mb-1 block">Full Name</label><input className="input text-sm" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
                                <div><label className="text-xs font-semibold text-surface-500 mb-1 block">Email</label><input className="input text-sm" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
                                <div><label className="text-xs font-semibold text-surface-500 mb-1 block">Company</label><input className="input text-sm" value={editForm.company} onChange={e => setEditForm({ ...editForm, company: e.target.value })} /></div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <h2 className="text-xl font-bold text-surface-900 dark:text-white break-words">{contact.name || contact.email}</h2>
                                    {contact.name && <p className="flex items-center gap-2 text-surface-500 text-sm mt-1"><Mail className="w-3.5 h-3.5" /> {contact.email}</p>}
                                </div>
                                <div className="pt-4 border-t border-surface-200 dark:border-surface-700">
                                    <div className="flex items-center gap-3 text-sm text-surface-700 dark:text-surface-300 mb-3">
                                        <Building className="w-4 h-4 text-surface-400" />
                                        {contact.company ? <span className="font-medium">{contact.company}</span> : <span className="italic text-surface-400">No company specified</span>}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-surface-700 dark:text-surface-300 mb-3">
                                        <Database className="w-4 h-4 text-surface-400" />
                                        <span>Source: <span className="badge badge-info">{contact.source}</span></span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-surface-700 dark:text-surface-300">
                                        <Calendar className="w-4 h-4 text-surface-400" />
                                        <span>Added: {new Date(contact.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Custom Fields (from CSV) */}
                    {contact.customFields && Object.keys(contact.customFields).length > 0 && (
                        <div className="glass-card p-6">
                            <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
                                <Tag className="w-4 h-4" /> Custom Data Fields
                            </h3>
                            <div className="space-y-3">
                                {Object.entries(contact.customFields).map(([key, value]) => (
                                    <div key={key} className="bg-surface-50 dark:bg-surface-800/50 p-2.5 rounded-lg border border-surface-200 dark:border-surface-700">
                                        <div className="text-[10px] uppercase font-bold text-surface-500 tracking-wider mb-0.5">{key}</div>
                                        <div className="text-sm font-medium text-surface-900 dark:text-white break-words">{value || <span className="italic text-surface-400">Empty</span>}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COL: Timeline */}
                <div className="lg:col-span-2">
                    <div className="glass-card p-6 min-h-[600px]">
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-6 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary-500" /> Timeline & History
                        </h3>

                        {timeline.length === 0 ? (
                            <p className="text-surface-500 italic text-center py-10">No interactions recorded yet.</p>
                        ) : (
                            <div className="relative border-l-2 border-surface-200 dark:border-surface-700 ml-3 pl-6 space-y-8 pb-4">
                                {timeline.map((event, index) => {
                                    const config = EVENT_CONFIG[event.type] || { icon: Database, color: 'text-surface-500', bg: 'bg-surface-100' };
                                    const Icon = config.icon;

                                    return (
                                        <div key={event.id} className="relative group">
                                            {/* Node */}
                                            <div className={`absolute -left-[35px] w-8 h-8 rounded-full flex items-center justify-center border-4 border-white dark:border-surface-900 ${config.bg} shadow-sm transition-transform group-hover:scale-110`}>
                                                <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                                            </div>

                                            {/* Event Content */}
                                            <div className="bg-surface-50 dark:bg-surface-800/30 rounded-xl p-4 border border-surface-200 dark:border-surface-700 transition-all hover:shadow-md">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className="font-semibold text-surface-900 dark:text-white text-sm">{event.title}</h4>
                                                    <span className="text-xs text-surface-400 whitespace-nowrap ml-4">{formatDate(event.timestamp)}</span>
                                                </div>

                                                {/* Email specifics */}
                                                {event.type === 'email_sent' && event.data && (
                                                    <div className="mt-3">
                                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                                            {event.data.status && (
                                                                <span className={`badge text-[10px] ${event.data.status === 'sent' ? 'badge-success' :
                                                                    event.data.status === 'bounced' ? 'badge-warning' : 'badge-danger'
                                                                    }`}>{event.data.status.toUpperCase()}</span>
                                                            )}
                                                            {event.campaignName && (
                                                                <span className="badge badge-info text-[10px]">
                                                                    📧 {event.campaignName}
                                                                </span>
                                                            )}
                                                            {event.isFollowUp && (
                                                                <span className="badge badge-purple text-[10px]">
                                                                    🔄 Follow-up #{(event.followUpStep || 0) + 1}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="text-xs text-surface-500 bg-white dark:bg-surface-900 p-3 rounded border border-surface-200 dark:border-surface-700">
                                                            {event.data.error ? (
                                                                <p className="text-red-500">Error: {event.data.error}</p>
                                                            ) : (
                                                                <p>Track ID: <code className="text-primary-500">{event.data.trackingId}</code></p>
                                                            )}
                                                        </div>

                                                        {/* Threaded Follow-up Compose Box */}
                                                        <div className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
                                                            {followUpEmailId === event.data._id ? (
                                                                <div className="space-y-2 animate-in">
                                                                    <div className="text-xs text-primary-500 font-medium mb-1 flex items-center gap-1.5"><Reply className="w-3.5 h-3.5" /> Writing follow-up to this thread...</div>
                                                                    <textarea
                                                                        value={followUpBody}
                                                                        onChange={(e) => setFollowUpBody(e.target.value)}
                                                                        placeholder="Type your message here..."
                                                                        className="input text-sm min-h-[100px] resize-y"
                                                                        autoFocus
                                                                    />
                                                                    <div className="flex items-center gap-2">
                                                                        <button onClick={() => sendFollowUp(event.data._id)} disabled={followUpSending || !followUpBody.trim()} className="btn-primary text-xs py-1.5 px-4 shadow-md">
                                                                            {followUpSending ? <><Loader2 className="w-3 h-3 animate-spin" /> Sending...</> : 'Send Threaded Reply'}
                                                                        </button>
                                                                        <button onClick={() => { setFollowUpEmailId(null); setFollowUpBody(''); }} className="btn-secondary text-xs py-1.5 px-3">Cancel</button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <button onClick={() => { setFollowUpEmailId(event.data._id); setFollowUpBody(''); }} className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 hover:underline flex items-center gap-1 transition-colors">
                                                                    <Reply className="w-3.5 h-3.5" /> Reply / Follow-Up in this Thread
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Tracking specifics */}
                                                {event.campaignName && event.type.startsWith('tracking_') && (
                                                    <p className="mt-2 text-[10px] text-surface-400">
                                                        Campaign: <span className="font-medium text-surface-600 dark:text-surface-300">{event.campaignName}</span>
                                                    </p>
                                                )}
                                                {(event.type === 'tracking_click' && event.data.url) && (
                                                    <p className="mt-2 text-xs text-primary-500 truncate bg-primary-50 dark:bg-primary-500/10 p-2 rounded">
                                                        Link: {event.data.url}
                                                    </p>
                                                )}

                                                {/* Contact created specifics */}
                                                {event.type === 'contact_created' && (
                                                    <div className="mt-2 text-xs text-surface-500">
                                                        Joined system. Source logged as: {event.data.source}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
