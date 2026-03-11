import { Router } from 'express';
import auth from '../middleware/auth.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';

const router = Router();

// Get user's team (or create default)
router.get('/', auth, async (req, res) => {
    try {
        let team = await Team.findOne({
            $or: [
                { ownerId: req.user.id },
                { 'members.userId': req.user.id, 'members.status': 'active' },
            ]
        }).populate('members.userId', 'name email')
            .populate('ownerId', 'name email');

        if (!team) {
            // Auto-create a team for the user
            team = new Team({
                name: `${req.user.name}'s Team`,
                ownerId: req.user.id,
                members: [{
                    userId: req.user.id,
                    email: req.user.email,
                    role: 'owner',
                    status: 'active',
                    joinedAt: new Date(),
                }],
            });
            await team.save();
            team = await Team.findById(team._id)
                .populate('members.userId', 'name email')
                .populate('ownerId', 'name email');
        }

        res.json(team);
    } catch (error) {
        console.error('Get team error:', error);
        res.status(500).json({ error: 'Failed to fetch team' });
    }
});

// Update team settings
router.put('/settings', auth, async (req, res) => {
    try {
        const team = await Team.findOne({ ownerId: req.user.id });
        if (!team) return res.status(404).json({ error: 'Team not found' });

        // Only owner/admin can update settings
        const member = team.members.find(m => m.userId?.toString() === req.user.id);
        if (!member || !['owner', 'admin'].includes(member.role)) {
            return res.status(403).json({ error: 'Only owners and admins can update settings' });
        }

        const { name, settings } = req.body;
        if (name) team.name = name.trim();
        if (settings) {
            if (settings.allowMemberInvites !== undefined) team.settings.allowMemberInvites = settings.allowMemberInvites;
            if (settings.shareContacts !== undefined) team.settings.shareContacts = settings.shareContacts;
            if (settings.shareTemplates !== undefined) team.settings.shareTemplates = settings.shareTemplates;
            if (settings.shareCampaigns !== undefined) team.settings.shareCampaigns = settings.shareCampaigns;
        }

        await team.save();
        res.json(team);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update team' });
    }
});

// Invite member
router.post('/invite', auth, async (req, res) => {
    try {
        const { email, role } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const cleanEmail = email.trim().toLowerCase();

        let team = await Team.findOne({
            $or: [
                { ownerId: req.user.id },
                { 'members.userId': req.user.id, 'members.status': 'active', 'members.role': { $in: ['owner', 'admin'] } },
            ]
        });

        if (!team) return res.status(403).json({ error: 'You must be team owner or admin to invite' });

        // Check if already a member
        const existing = team.members.find(m => m.email === cleanEmail);
        if (existing && existing.status === 'active') {
            return res.status(400).json({ error: 'This person is already a team member' });
        }

        // Check if invited user exists
        const invitedUser = await User.findOne({ email: cleanEmail });

        if (existing && existing.status === 'pending') {
            // Re-send invite
            return res.json({ message: 'Invite already pending', member: existing });
        }

        // Remove old record if it was 'removed'
        if (existing && existing.status === 'removed') {
            team.members = team.members.filter(m => m.email !== cleanEmail);
        }

        const memberData = {
            userId: invitedUser?._id || null,
            email: cleanEmail,
            role: ['admin', 'member', 'viewer'].includes(role) ? role : 'member',
            status: 'pending',
            invitedBy: req.user.id,
            invitedAt: new Date(),
        };

        team.members.push(memberData);
        await team.save();

        // Log activity
        await Activity.log({
            userId: req.user.id,
            teamId: team._id,
            type: 'team_invite',
            title: `Invited ${cleanEmail} to the team`,
            description: `Role: ${memberData.role}`,
        });

        res.json({ message: `Invitation sent to ${cleanEmail}`, member: memberData });
    } catch (error) {
        console.error('Invite error:', error);
        res.status(500).json({ error: 'Failed to send invite' });
    }
});

// Accept invite (the invited user calls this)
router.post('/accept', auth, async (req, res) => {
    try {
        const team = await Team.findOne({
            'members.email': req.user.email,
            'members.status': 'pending',
        });

        if (!team) return res.status(404).json({ error: 'No pending invitations found' });

        const member = team.members.find(m => m.email === req.user.email && m.status === 'pending');
        if (!member) return res.status(404).json({ error: 'No pending invitation' });

        member.status = 'active';
        member.userId = req.user.id;
        member.joinedAt = new Date();

        await team.save();

        await Activity.log({
            userId: req.user.id,
            teamId: team._id,
            type: 'team_join',
            title: `${req.user.name} joined the team`,
        });

        res.json({ message: 'You have joined the team!', team });
    } catch (error) {
        res.status(500).json({ error: 'Failed to accept invitation' });
    }
});

// Update member role
router.patch('/members/:memberId/role', auth, async (req, res) => {
    try {
        const { role } = req.body;
        if (!['admin', 'member', 'viewer'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be admin, member, or viewer' });
        }

        const team = await Team.findOne({ ownerId: req.user.id });
        if (!team) return res.status(403).json({ error: 'Only team owner can change roles' });

        const member = team.members.id(req.params.memberId);
        if (!member) return res.status(404).json({ error: 'Member not found' });
        if (member.role === 'owner') return res.status(400).json({ error: 'Cannot change owner role' });

        member.role = role;
        await team.save();

        res.json({ message: `Role updated to ${role}`, member });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update role' });
    }
});

// Remove member
router.delete('/members/:memberId', auth, async (req, res) => {
    try {
        const team = await Team.findOne({
            $or: [
                { ownerId: req.user.id },
                { 'members.userId': req.user.id, 'members.role': { $in: ['owner', 'admin'] } },
            ]
        });
        if (!team) return res.status(403).json({ error: 'Insufficient permissions' });

        const member = team.members.id(req.params.memberId);
        if (!member) return res.status(404).json({ error: 'Member not found' });
        if (member.role === 'owner') return res.status(400).json({ error: 'Cannot remove the owner' });

        member.status = 'removed';
        await team.save();

        res.json({ message: 'Member removed' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

// Check pending invites for current user
router.get('/invites', auth, async (req, res) => {
    try {
        const teams = await Team.find({
            'members.email': req.user.email,
            'members.status': 'pending',
        }).populate('ownerId', 'name email').select('name ownerId members');

        const invites = teams.map(t => ({
            teamId: t._id,
            teamName: t.name,
            owner: t.ownerId,
            invitedAt: t.members.find(m => m.email === req.user.email)?.invitedAt,
            role: t.members.find(m => m.email === req.user.email)?.role,
        }));

        res.json(invites);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch invites' });
    }
});

export default router;
