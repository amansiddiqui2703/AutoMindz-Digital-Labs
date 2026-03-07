import { Router } from 'express';
import auth from '../middleware/auth.js';
import Campaign from '../models/Campaign.js';
import EmailLog from '../models/EmailLog.js';
import TrackingEvent from '../models/TrackingEvent.js';
import { enqueueCampaign, pauseQueue, resumeQueue, getQueueStats } from '../services/queue.js';

const router = Router();

// List campaigns
router.get('/', auth, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const filter = { userId: req.user.id };
        if (status) filter.status = status;

        const campaigns = await Campaign.find(filter)
            .select('-recipients -htmlBody -plainBody')
            .sort({ updatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Campaign.countDocuments(filter);

        res.json({ campaigns, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
});

// Get single campaign
router.get('/:id', auth, async (req, res) => {
    try {
        const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user.id });
        if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
        res.json({ campaign });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch campaign' });
    }
});

// Allowed fields for campaign create/update
const CAMPAIGN_FIELDS = ['name', 'subject', 'subjectB', 'htmlBody', 'plainBody', 'accountIds', 'recipients', 'followUps', 'warmupMode', 'warmupDailyIncrease', 'delaySeconds'];

const pickFields = (body, fields) => {
    const picked = {};
    for (const f of fields) {
        if (body[f] !== undefined) picked[f] = body[f];
    }
    return picked;
};

// Create campaign
router.post('/', auth, async (req, res) => {
    try {
        const data = pickFields(req.body, CAMPAIGN_FIELDS);
        if (data.name && data.name.length > 200) return res.status(400).json({ error: 'Campaign name too long (max 200)' });
        if (data.subject && data.subject.length > 500) return res.status(400).json({ error: 'Subject too long (max 500)' });
        const campaign = new Campaign({ ...data, userId: req.user.id });
        await campaign.save();
        res.status(201).json({ campaign });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create campaign' });
    }
});

// Update campaign
router.put('/:id', auth, async (req, res) => {
    try {
        const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user.id });
        if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
        if (campaign.status === 'running') return res.status(400).json({ error: 'Cannot edit a running campaign' });

        const data = pickFields(req.body, CAMPAIGN_FIELDS);
        if (data.name && data.name.length > 200) return res.status(400).json({ error: 'Campaign name too long (max 200)' });
        if (data.subject && data.subject.length > 500) return res.status(400).json({ error: 'Subject too long (max 500)' });
        Object.assign(campaign, data);

        // Keep stats.total in sync with actual recipients count
        if (campaign.recipients) {
            campaign.stats.total = campaign.recipients.length;
        }

        await campaign.save();
        res.json({ campaign });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update campaign' });
    }
});

// Delete campaign
router.delete('/:id', auth, async (req, res) => {
    try {
        await Campaign.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        res.json({ message: 'Campaign deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete campaign' });
    }
});

// Duplicate campaign
router.post('/:id/duplicate', auth, async (req, res) => {
    try {
        const original = await Campaign.findOne({ _id: req.params.id, userId: req.user.id });
        if (!original) return res.status(404).json({ error: 'Campaign not found' });

        const duplicate = new Campaign({
            ...original.toObject(),
            _id: undefined,
            name: `${original.name} (Copy)`,
            status: 'draft',
            stats: { total: 0, sent: 0, failed: 0, bounced: 0, opened: 0, clicked: 0, replied: 0, unsubscribed: 0 },
            createdAt: undefined,
            updatedAt: undefined,
        });
        // Reset recipient statuses and sequence fields
        duplicate.recipients = duplicate.recipients.map(r => ({
            ...r,
            status: 'pending',
            sentAt: null,
            openedAt: null,
            clickedAt: null,
            repliedAt: null,
            currentStep: 0,
            nextFollowUpAt: null,
            sequenceStatus: 'active',
        }));
        await duplicate.save();
        res.status(201).json({ campaign: duplicate });
    } catch (error) {
        res.status(500).json({ error: 'Failed to duplicate campaign' });
    }
});

// Start / Send campaign
router.post('/:id/send', auth, async (req, res) => {
    try {
        const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user.id });
        if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
        if (campaign.status === 'running') return res.status(400).json({ error: 'Campaign already running' });
        if (!campaign.recipients.length) return res.status(400).json({ error: 'No recipients in campaign' });
        if (!campaign.accountIds.length) return res.status(400).json({ error: 'No Gmail accounts selected' });

        await enqueueCampaign(campaign);
        res.json({ message: 'Campaign started', status: campaign.status });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Failed to start campaign' });
    }
});

// Pause campaign
router.post('/:id/pause', auth, async (req, res) => {
    try {
        const campaign = await Campaign.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id, status: 'running' },
            { status: 'paused' },
            { new: true }
        );
        if (!campaign) return res.status(404).json({ error: 'Running campaign not found' });
        await pauseQueue();
        res.json({ message: 'Campaign paused', campaign });
    } catch (error) {
        res.status(500).json({ error: 'Failed to pause campaign' });
    }
});

// Resume campaign
router.post('/:id/resume', auth, async (req, res) => {
    try {
        const campaign = await Campaign.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id, status: 'paused' },
            { status: 'running' },
            { new: true }
        );
        if (!campaign) return res.status(404).json({ error: 'Paused campaign not found' });
        await resumeQueue();
        res.json({ message: 'Campaign resumed', campaign });
    } catch (error) {
        res.status(500).json({ error: 'Failed to resume campaign' });
    }
});

// Queue stats
router.get('/:id/queue-stats', auth, async (req, res) => {
    try {
        const stats = await getQueueStats();
        res.json({ stats });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get queue stats' });
    }
});

// Sequence stats — per-recipient follow-up progress
router.get('/:id/sequence-stats', auth, async (req, res) => {
    try {
        const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user.id });
        if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

        const totalSteps = campaign.followUps?.length || 0;
        const recipients = campaign.recipients.map(r => ({
            email: r.email,
            name: r.name,
            status: r.status,
            currentStep: r.currentStep || 0,
            totalSteps,
            sequenceStatus: r.sequenceStatus || 'active',
            nextFollowUpAt: r.nextFollowUpAt,
            sentAt: r.sentAt,
            openedAt: r.openedAt,
            clickedAt: r.clickedAt,
            repliedAt: r.repliedAt,
        }));

        const summary = {
            totalRecipients: recipients.length,
            activeSequences: recipients.filter(r => r.sequenceStatus === 'active').length,
            completedSequences: recipients.filter(r => r.sequenceStatus === 'completed').length,
            stoppedByReply: recipients.filter(r => r.sequenceStatus === 'stopped_reply').length,
            stoppedByUnsubscribe: recipients.filter(r => r.sequenceStatus === 'stopped_unsubscribe').length,
            totalSteps,
        };

        res.json({ recipients, summary });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get sequence stats' });
    }
});

// A/B test stats — compare variant performance
router.get('/:id/ab-stats', auth, async (req, res) => {
    try {
        const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user.id });
        if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
        if (!campaign.subjectB) return res.json({ abTest: false });

        const logs = await EmailLog.find({ campaignId: campaign._id }).lean();
        const variantA = logs.filter(l => l.abVariant === 'A' || !l.abVariant);
        const variantB = logs.filter(l => l.abVariant === 'B');

        const getStats = async (variantLogs) => {
            const sent = variantLogs.filter(l => l.status === 'sent').length;
            const trackingIds = variantLogs.map(l => l.trackingId).filter(Boolean);
            let opened = 0, clicked = 0, replied = 0;
            if (trackingIds.length > 0) {
                [opened, clicked, replied] = await Promise.all([
                    TrackingEvent.countDocuments({ trackingId: { $in: trackingIds }, type: 'open' }),
                    TrackingEvent.countDocuments({ trackingId: { $in: trackingIds }, type: 'click' }),
                    TrackingEvent.countDocuments({ trackingId: { $in: trackingIds }, type: 'reply' }),
                ]);
            }
            return {
                sent, opened, clicked, replied,
                openRate: sent ? ((opened / sent) * 100).toFixed(1) : '0',
                clickRate: sent ? ((clicked / sent) * 100).toFixed(1) : '0',
                replyRate: sent ? ((replied / sent) * 100).toFixed(1) : '0',
            };
        };

        const [statsA, statsB] = await Promise.all([getStats(variantA), getStats(variantB)]);

        res.json({
            abTest: true,
            subjectA: campaign.subject,
            subjectB: campaign.subjectB,
            variantA: statsA,
            variantB: statsB,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get A/B stats' });
    }
});

// Schedule campaign for future send
router.post('/:id/schedule', auth, async (req, res) => {
    try {
        const { scheduledAt } = req.body;
        if (!scheduledAt) return res.status(400).json({ error: 'scheduledAt is required' });

        const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user.id });
        if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
        if (campaign.status !== 'draft') return res.status(400).json({ error: 'Only draft campaigns can be scheduled' });
        if (!campaign.recipients.length) return res.status(400).json({ error: 'No recipients in campaign' });
        if (!campaign.accountIds.length) return res.status(400).json({ error: 'No Gmail accounts selected' });

        const scheduleDate = new Date(scheduledAt);
        if (scheduleDate <= new Date()) return res.status(400).json({ error: 'Schedule time must be in the future' });

        campaign.scheduledAt = scheduleDate;
        campaign.status = 'scheduled';
        await campaign.save();

        res.json({ message: `Campaign scheduled for ${scheduleDate.toISOString()}`, campaign });
    } catch (error) {
        res.status(500).json({ error: 'Failed to schedule campaign' });
    }
});

export default router;
