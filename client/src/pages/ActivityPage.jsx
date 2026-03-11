import { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
    Activity, Clock, Send, Users, UserPlus, CheckCircle, Mail, FileText,
    FolderOpen, MessageSquare, Loader2, RefreshCw, Filter
} from 'lucide-react';

const ACTIVITY_CONFIG = {
    campaign_created: { icon: Mail, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-500/10', label: 'Campaign Created' },
    campaign_sent: { icon: Send, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10', label: 'Campaign Sent' },
    campaign_completed: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', label: 'Campaign Completed' },
    contact_added: { icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', label: 'Contact Added' },
    contact_updated: { icon: Users, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-500/10', label: 'Contact Updated' },
    email_sent: { icon: Send, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10', label: 'Email Sent' },
    email_opened: { icon: Mail, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10', label: 'Email Opened' },
    email_replied: { icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', label: 'Email Replied' },
    task_created: { icon: CheckCircle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', label: 'Task Created' },
    task_completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10', label: 'Task Completed' },
    team_invite: { icon: UserPlus, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-500/10', label: 'Team Invite' },
    team_join: { icon: Users, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', label: 'Team Join' },
    project_created: { icon: FolderOpen, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10', label: 'Project Created' },
    note_added: { icon: FileText, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10', label: 'Note Added' },
    template_created: { icon: FileText, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10', label: 'Template Created' },
};

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

export default function ActivityPage() {
    const [activities, setActivities] = useState([]);
    const [teamActivities, setTeamActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('personal');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => { fetchActivities(); }, []);

    const fetchActivities = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const [personal, team] = await Promise.all([
                api.get('/activity?limit=100'),
                api.get('/activity/team?limit=100').catch(() => ({ data: { activities: [] } })),
            ]);
            setActivities(personal.data.activities || []);
            setTeamActivities(team.data.activities || []);
        } catch {
            toast.error('Failed to load activity');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const currentList = tab === 'personal' ? activities : teamActivities;

    // Group activities by date
    const groupedActivities = {};
    for (const activity of currentList) {
        const dateKey = new Date(activity.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        if (!groupedActivities[dateKey]) groupedActivities[dateKey] = [];
        groupedActivities[dateKey].push(activity);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        Activity Feed
                    </h1>
                    <p className="text-surface-500 text-sm mt-1 ml-[52px]">Track everything happening in your workspace</p>
                </div>
                <button onClick={() => fetchActivities(true)} disabled={refreshing} className="btn-secondary">
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1 w-fit">
                <button
                    onClick={() => setTab('personal')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'personal' ? 'bg-white dark:bg-surface-900 shadow text-surface-900 dark:text-white' : 'text-surface-500'}`}
                >
                    <Activity className="w-4 h-4" /> My Activity
                </button>
                <button
                    onClick={() => setTab('team')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'team' ? 'bg-white dark:bg-surface-900 shadow text-surface-900 dark:text-white' : 'text-surface-500'}`}
                >
                    <Users className="w-4 h-4" /> Team Activity
                </button>
            </div>

            {/* Activity List */}
            {currentList.length === 0 ? (
                <div className="text-center py-16 glass-card">
                    <Activity className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300">No activity yet</h3>
                    <p className="text-surface-400 mt-1">Actions like creating campaigns, sending emails, and completing tasks will show up here</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedActivities).map(([dateLabel, items]) => (
                        <div key={dateLabel}>
                            {/* Date header */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider">{dateLabel}</div>
                                <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700" />
                            </div>

                            {/* Activities for this date */}
                            <div className="relative border-l-2 border-surface-200 dark:border-surface-700 ml-3 pl-6 space-y-4">
                                {items.map((activity) => {
                                    const config = ACTIVITY_CONFIG[activity.type] || {
                                        icon: Activity, color: 'text-surface-500', bg: 'bg-surface-100', label: activity.type,
                                    };
                                    const Icon = config.icon;

                                    return (
                                        <div key={activity._id} className="relative group">
                                            {/* Timeline dot */}
                                            <div className={`absolute -left-[31px] w-6 h-6 rounded-full ${config.bg} flex items-center justify-center border-2 border-white dark:border-surface-900 shadow-sm`}>
                                                <Icon className={`w-3 h-3 ${config.color}`} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-surface-900 dark:text-white">
                                                            {activity.title}
                                                        </span>
                                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                                                            {config.label}
                                                        </span>
                                                    </div>
                                                    {activity.description && (
                                                        <p className="text-xs text-surface-500 mt-0.5">{activity.description}</p>
                                                    )}
                                                    {/* Related entities */}
                                                    <div className="flex items-center gap-3 mt-1">
                                                        {activity.campaignId?.name && (
                                                            <span className="text-[10px] text-surface-400">📧 {activity.campaignId.name}</span>
                                                        )}
                                                        {activity.contactId?.email && (
                                                            <span className="text-[10px] text-surface-400">👤 {activity.contactId.name || activity.contactId.email}</span>
                                                        )}
                                                        {activity.projectId?.name && (
                                                            <span className="text-[10px] text-surface-400">📁 {activity.projectId.name}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-surface-400 flex-shrink-0 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {timeAgo(activity.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
