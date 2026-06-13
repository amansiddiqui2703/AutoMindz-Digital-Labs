import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import {
    User, Shield, Moon, Sun, Mail, Globe, BookOpen, CheckCircle, ExternalLink
} from 'lucide-react';

export default function SettingsPage() {
    const { user } = useAuth();
    const { dark, toggle } = useTheme();

    return (
        <div className="max-w-3xl space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Settings</h1>
                <p className="text-surface-500 mt-1">Manage your account and preferences</p>
            </div>

            {/* Profile */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                    <User className="w-5 h-5 text-primary-500" />
                    <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Profile</h3>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="text-sm text-surface-500">Name</label>
                        <p className="text-surface-900 dark:text-white font-medium">{user?.name || '—'}</p>
                    </div>
                    <div>
                        <label className="text-sm text-surface-500">Email</label>
                        <p className="text-surface-900 dark:text-white font-medium">{user?.email || '—'}</p>
                    </div>
                </div>
            </div>

            {/* Appearance */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                    {dark ? <Moon className="w-5 h-5 text-accent-500" /> : <Sun className="w-5 h-5 text-yellow-500" />}
                    <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Appearance</h3>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
                    <div>
                        <p className="font-medium text-surface-900 dark:text-white">Dark Mode</p>
                        <p className="text-sm text-surface-500">{dark ? 'Dark theme active' : 'Light theme active'}</p>
                    </div>
                    <button onClick={toggle} className={`relative w-14 h-7 rounded-full transition-colors ${dark ? 'bg-primary-500' : 'bg-surface-300'}`}>
                        <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${dark ? 'translate-x-7' : 'translate-x-0.5'}`} />
                    </button>
                </div>
            </div>

            {/* Deliverability Guide */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-5 h-5 text-green-500" />
                    <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Email Deliverability Guide</h3>
                </div>
                <div className="space-y-4">
                    {[
                        {
                            title: 'SPF Record',
                            description: 'Add a TXT record to your domain DNS: v=spf1 include:_spf.google.com ~all',
                            link: 'https://support.google.com/a/answer/33786',
                        },
                        {
                            title: 'DKIM Signing',
                            description: 'Enable DKIM in Google Workspace Admin → Gmail → Authenticate email',
                            link: 'https://support.google.com/a/answer/174124',
                        },
                        {
                            title: 'DMARC Policy',
                            description: 'Add TXT record: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com',
                            link: 'https://support.google.com/a/answer/2466580',
                        },
                        {
                            title: 'Unsubscribe Headers',
                            description: 'AutoMindz automatically adds List-Unsubscribe headers and one-click unsubscribe links.',
                            auto: true,
                        },
                        {
                            title: 'Plain Text Fallback',
                            description: 'AutoMindz auto-generates plain text versions of your HTML emails for better deliverability.',
                            auto: true,
                        },
                    ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-surface-900 dark:text-white">{item.title}</p>
                                    {item.auto && <span className="badge badge-success !text-[10px]">Auto</span>}
                                </div>
                                <p className="text-sm text-surface-500 mt-0.5">{item.description}</p>
                                {item.link && (
                                    <a href={item.link} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-primary-500 text-xs font-medium mt-1 hover:underline">
                                        Learn more <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Compliance */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                    <BookOpen className="w-5 h-5 text-accent-500" />
                    <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Compliance</h3>
                </div>
                <div className="text-sm text-surface-600 dark:text-surface-400 space-y-2">
                    <p>• All emails include an automatic unsubscribe link and List-Unsubscribe header</p>
                    <p>• Suppression list is enforced — unsubscribed and bounced contacts are never emailed</p>
                    <p>• GDPR-ready: contacts can be permanently deleted from the Contacts page</p>
                    <p>• Rate limiting prevents excessive sending</p>
                    <p>• No spam bypass techniques are used</p>
                </div>
            </div>
            {/* Webhooks */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Webhooks</h3>
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-surface-500 mb-1 block">Webhook URL</label>
                        <div className="flex gap-2">
                            <input 
                                type="url" 
                                className="input flex-1" 
                                placeholder="https://your-server.com/webhook" 
                                value={user?.settings?.webhookUrl || ''} 
                                onChange={async (e) => {
                                    const val = e.target.value;
                                    // Normally we would have local state and a save button,
                                    // but we can optimistic update via api if needed, or better, 
                                    // let's just make it a controlled local state in a real app.
                                    // For now we'll do a quick save.
                                    try {
                                        await api.put('/auth/settings', { settings: { ...user.settings, webhookUrl: val } });
                                        toast.success('Webhook URL saved');
                                    } catch {
                                        toast.error('Failed to save webhook URL');
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm text-surface-500 mb-2 block">Events to send</label>
                        <div className="flex flex-wrap gap-2">
                            {['delivered', 'opened', 'clicked', 'replied', 'bounced'].map(evt => {
                                const active = (user?.settings?.webhookEvents || []).includes(evt);
                                return (
                                    <button 
                                        key={evt}
                                        onClick={async () => {
                                            const currentEvents = user?.settings?.webhookEvents || [];
                                            const newEvents = active ? currentEvents.filter(e => e !== evt) : [...currentEvents, evt];
                                            try {
                                                await api.put('/auth/settings', { settings: { ...user.settings, webhookEvents: newEvents } });
                                                toast.success('Webhook events updated');
                                            } catch {
                                                toast.error('Failed to update events');
                                            }
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${active ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400' : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-500'}`}
                                    >
                                        {evt}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
