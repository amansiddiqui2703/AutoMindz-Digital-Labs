import { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
    Users, UserPlus, Shield, Mail, Clock, Check, X, Crown,
    Settings, Eye, Edit3, Trash2, Loader2, ChevronDown, UserCheck, AlertCircle
} from 'lucide-react';

const ROLE_CONFIG = {
    owner: { label: 'Owner', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', icon: Crown },
    admin: { label: 'Admin', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', icon: Shield },
    member: { label: 'Member', color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-500/10', icon: Users },
    viewer: { label: 'Viewer', color: 'text-surface-500', bg: 'bg-surface-100 dark:bg-surface-800', icon: Eye },
};

const STATUS_CONFIG = {
    active: { label: 'Active', color: 'badge-success' },
    pending: { label: 'Pending', color: 'badge-warning' },
    removed: { label: 'Removed', color: 'badge-danger' },
};

export default function TeamPage() {
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('member');
    const [inviting, setInviting] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [teamName, setTeamName] = useState('');
    const [pendingInvites, setPendingInvites] = useState([]);

    useEffect(() => {
        fetchTeam();
        fetchInvites();
    }, []);

    const fetchTeam = async () => {
        setLoading(true);
        try {
            const res = await api.get('/teams');
            setTeam(res.data);
            setTeamName(res.data.name);
        } catch {
            toast.error('Failed to load team');
        } finally {
            setLoading(false);
        }
    };

    const fetchInvites = async () => {
        try {
            const res = await api.get('/teams/invites');
            setPendingInvites(res.data);
        } catch { /* silent */ }
    };

    const handleInvite = async () => {
        if (!inviteEmail.trim()) return toast.error('Enter an email address');
        setInviting(true);
        try {
            const res = await api.post('/teams/invite', { email: inviteEmail, role: inviteRole });
            toast.success(res.data.message);
            setInviteEmail('');
            setShowInvite(false);
            fetchTeam();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to invite');
        } finally {
            setInviting(false);
        }
    };

    const handleAcceptInvite = async () => {
        try {
            await api.post('/teams/accept');
            toast.success('Joined the team!');
            fetchTeam();
            fetchInvites();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to accept');
        }
    };

    const handleRoleChange = async (memberId, role) => {
        try {
            await api.patch(`/teams/members/${memberId}/role`, { role });
            toast.success(`Role updated to ${role}`);
            fetchTeam();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update role');
        }
    };

    const handleRemove = async (memberId) => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            await api.delete(`/teams/members/${memberId}`);
            toast.success('Member removed');
            fetchTeam();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to remove');
        }
    };

    const handleSaveSettings = async () => {
        try {
            await api.put('/teams/settings', {
                name: teamName,
                settings: team.settings,
            });
            toast.success('Settings saved');
            setEditingName(false);
            fetchTeam();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to save');
        }
    };

    const toggleSetting = async (key) => {
        try {
            const newSettings = { ...team.settings, [key]: !team.settings[key] };
            await api.put('/teams/settings', { settings: newSettings });
            setTeam(prev => ({ ...prev, settings: newSettings }));
            toast.success('Setting updated');
        } catch {
            toast.error('Failed to update setting');
        }
    };

    const currentMember = team?.members?.find(m => m.userId?._id === team?.ownerId?._id || m.role === 'owner');
    const isOwnerOrAdmin = team?.members?.some(m => m.userId && ['owner', 'admin'].includes(m.role));
    const activeMembers = team?.members?.filter(m => m.status !== 'removed') || [];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Pending Invites Banner */}
            {pendingInvites.length > 0 && (
                <div className="glass-card p-4 border-2 border-primary-300 dark:border-primary-600 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-500/5 dark:to-accent-500/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-primary-500" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-surface-900 dark:text-white">
                                You have a team invitation!
                            </h3>
                            <p className="text-sm text-surface-500">
                                {pendingInvites[0].owner?.name} invited you to join <strong>{pendingInvites[0].teamName}</strong> as {pendingInvites[0].role}
                            </p>
                        </div>
                        <button onClick={handleAcceptInvite} className="btn-primary">
                            <Check className="w-4 h-4" /> Accept
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                        <Users className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        {editingName ? (
                            <div className="flex items-center gap-2">
                                <input
                                    value={teamName}
                                    onChange={e => setTeamName(e.target.value)}
                                    className="input !py-1.5 text-xl font-bold"
                                    autoFocus
                                />
                                <button onClick={handleSaveSettings} className="btn-primary !py-1.5 text-xs">Save</button>
                                <button onClick={() => { setEditingName(false); setTeamName(team.name); }} className="btn-secondary !py-1.5 text-xs">Cancel</button>
                            </div>
                        ) : (
                            <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
                                {team?.name}
                                <button onClick={() => setEditingName(true)} className="p-1 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg">
                                    <Edit3 className="w-4 h-4 text-surface-400" />
                                </button>
                            </h1>
                        )}
                        <p className="text-surface-500 text-sm">{activeMembers.length} member{activeMembers.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowSettings(!showSettings)} className="btn-secondary">
                        <Settings className="w-4 h-4" /> Settings
                    </button>
                    <button onClick={() => setShowInvite(!showInvite)} className="btn-primary">
                        <UserPlus className="w-4 h-4" /> Invite
                    </button>
                </div>
            </div>

            {/* Team Settings */}
            {showSettings && (
                <div className="glass-card p-6 animate-in">
                    <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-surface-400" /> Team Settings
                    </h3>
                    <div className="space-y-4">
                        {[
                            { key: 'shareContacts', label: 'Share Contacts', desc: 'All team members can view and manage contacts' },
                            { key: 'shareTemplates', label: 'Share Templates', desc: 'All team members can use shared templates' },
                            { key: 'shareCampaigns', label: 'Share Campaigns', desc: 'All team members can view campaign performance' },
                            { key: 'allowMemberInvites', label: 'Members Can Invite', desc: 'Allow non-admin members to invite others' },
                        ].map(setting => (
                            <div key={setting.key} className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                                <div>
                                    <div className="text-sm font-medium text-surface-900 dark:text-white">{setting.label}</div>
                                    <div className="text-xs text-surface-500">{setting.desc}</div>
                                </div>
                                <button
                                    onClick={() => toggleSetting(setting.key)}
                                    className={`relative w-11 h-6 rounded-full transition-colors ${team?.settings?.[setting.key] ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'}`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${team?.settings?.[setting.key] ? 'translate-x-5' : ''}`} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Invite Panel */}
            {showInvite && (
                <div className="glass-card p-6 border-2 border-primary-200 dark:border-primary-700 animate-in">
                    <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-primary-500" /> Invite Team Member
                    </h3>
                    <div className="flex items-end gap-3">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">Email Address</label>
                            <input
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                className="input"
                                placeholder="colleague@company.com"
                                type="email"
                            />
                        </div>
                        <div className="w-36">
                            <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">Role</label>
                            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="input">
                                <option value="admin">Admin</option>
                                <option value="member">Member</option>
                                <option value="viewer">Viewer</option>
                            </select>
                        </div>
                        <button onClick={handleInvite} disabled={inviting} className="btn-primary whitespace-nowrap">
                            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                            Send Invite
                        </button>
                    </div>
                    <div className="mt-4 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 text-xs text-surface-500">
                        <p className="flex items-start gap-2">
                            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span>
                                <strong>Admin</strong>: Can invite members, manage settings, view all data<br />
                                <strong>Member</strong>: Can create campaigns, manage contacts, send emails<br />
                                <strong>Viewer</strong>: Can only view data, cannot edit or send
                            </span>
                        </p>
                    </div>
                </div>
            )}

            {/* Members List */}
            <div className="glass-card overflow-hidden">
                <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700">
                    <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Team Members</h3>
                </div>
                <div className="divide-y divide-surface-200 dark:divide-surface-700">
                    {activeMembers.map(member => {
                        const roleConf = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
                        const statusConf = STATUS_CONFIG[member.status] || STATUS_CONFIG.pending;
                        const RoleIcon = roleConf.icon;
                        const memberName = member.userId?.name || member.email.split('@')[0];
                        const memberEmail = member.userId?.email || member.email;

                        return (
                            <div key={member._id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors">
                                {/* Avatar */}
                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                                    {memberName.charAt(0).toUpperCase()}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-surface-900 dark:text-white text-sm truncate">
                                            {memberName}
                                        </span>
                                        <span className={`badge ${statusConf.color} text-[10px]`}>{statusConf.label}</span>
                                    </div>
                                    <div className="text-xs text-surface-500 truncate">{memberEmail}</div>
                                    {member.joinedAt && (
                                        <div className="text-[10px] text-surface-400 flex items-center gap-1 mt-0.5">
                                            <Clock className="w-3 h-3" /> Joined {new Date(member.joinedAt).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>

                                {/* Role Badge */}
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${roleConf.bg}`}>
                                    <RoleIcon className={`w-3.5 h-3.5 ${roleConf.color}`} />
                                    <span className={`text-xs font-medium ${roleConf.color}`}>{roleConf.label}</span>
                                </div>

                                {/* Actions (only for owner/admin) */}
                                {member.role !== 'owner' && (
                                    <div className="flex items-center gap-1">
                                        <div className="relative group">
                                            <button className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg text-surface-400 transition-colors">
                                                <ChevronDown className="w-4 h-4" />
                                            </button>
                                            <div className="hidden group-hover:block absolute right-0 top-full mt-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl z-20 py-2 min-w-[140px]">
                                                {['admin', 'member', 'viewer'].filter(r => r !== member.role).map(role => (
                                                    <button
                                                        key={role}
                                                        onClick={() => handleRoleChange(member._id, role)}
                                                        className="block w-full text-left px-4 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700"
                                                    >
                                                        Make {ROLE_CONFIG[role]?.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemove(member._id)}
                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-red-500 transition-colors"
                                            title="Remove member"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {member.role === 'owner' && (
                                    <div className="w-20" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
