import { Router } from 'express';
import auth from '../middleware/auth.js';
import InboxMessage from '../models/InboxMessage.js';
import Contact from '../models/Contact.js';
import EmailLog from '../models/EmailLog.js';

const router = Router();

// Get inbox messages (with filters)
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 50, filter, search, campaignId } = req.query;

        const query = { userId: req.user.id };

        if (filter === 'unread') query.isRead = false;
        if (filter === 'starred') query.isStarred = true;
        if (filter === 'needs_reply') query.needsReply = true;
        if (filter === 'inbound') query.direction = 'inbound';
        if (filter === 'outbound') query.direction = 'outbound';
        if (campaignId) query.campaignId = campaignId;

        if (search) {
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.$or = [
                { from: { $regex: escaped, $options: 'i' } },
                { to: { $regex: escaped, $options: 'i' } },
                { subject: { $regex: escaped, $options: 'i' } },
            ];
        }

        const messages = await InboxMessage.find(query)
            .sort({ receivedAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('contactId', 'name email company')
            .populate('campaignId', 'name')
            .lean();

        const total = await InboxMessage.countDocuments(query);

        // Counts for sidebar
        const [totalInbox, unread, needsReply, starred] = await Promise.all([
            InboxMessage.countDocuments({ userId: req.user.id }),
            InboxMessage.countDocuments({ userId: req.user.id, isRead: false }),
            InboxMessage.countDocuments({ userId: req.user.id, needsReply: true }),
            InboxMessage.countDocuments({ userId: req.user.id, isStarred: true }),
        ]);

        res.json({
            messages,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            counts: { totalInbox, unread, needsReply, starred },
        });
    } catch (error) {
        console.error('Inbox error:', error);
        res.status(500).json({ error: 'Failed to fetch inbox' });
    }
});

// Get conversation thread
router.get('/thread/:threadId', auth, async (req, res) => {
    try {
        const messages = await InboxMessage.find({
            userId: req.user.id,
            gmailThreadId: req.params.threadId,
        })
        .sort({ receivedAt: 1 })
        .populate('contactId', 'name email company')
        .populate('campaignId', 'name')
        .lean();

        // Mark all as read
        await InboxMessage.updateMany(
            { userId: req.user.id, gmailThreadId: req.params.threadId, isRead: false },
            { isRead: true }
        );

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch thread' });
    }
});

// Mark message read/unread
router.patch('/:id/read', auth, async (req, res) => {
    try {
        const msg = await InboxMessage.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { isRead: req.body.isRead !== false },
            { new: true }
        );
        if (!msg) return res.status(404).json({ error: 'Message not found' });
        res.json(msg);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update' });
    }
});

// Toggle star
router.patch('/:id/star', auth, async (req, res) => {
    try {
        const msg = await InboxMessage.findOne({ _id: req.params.id, userId: req.user.id });
        if (!msg) return res.status(404).json({ error: 'Message not found' });
        msg.isStarred = !msg.isStarred;
        await msg.save();
        res.json(msg);
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle star' });
    }
});

// Mark needs reply / resolved
router.patch('/:id/needs-reply', auth, async (req, res) => {
    try {
        const msg = await InboxMessage.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { needsReply: req.body.needsReply },
            { new: true }
        );
        if (!msg) return res.status(404).json({ error: 'Message not found' });
        res.json(msg);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update' });
    }
});

// Sync sent emails into inbox (populate outbound messages)
router.post('/sync', auth, async (req, res) => {
    try {
        const emailLogs = await EmailLog.find({
            userId: req.user.id,
            status: 'sent',
        }).sort({ sentAt: -1 }).limit(200).lean();

        let synced = 0;
        for (const log of emailLogs) {
            const exists = await InboxMessage.findOne({
                userId: req.user.id,
                emailLogId: log._id,
            });
            if (exists) continue;

            // Find contact
            const contact = await Contact.findOne({ userId: req.user.id, email: log.to });

            await InboxMessage.create({
                userId: req.user.id,
                accountId: log.accountId,
                contactId: contact?._id,
                campaignId: log.campaignId,
                emailLogId: log._id,
                gmailMessageId: log.messageId || `sent-${log._id}`,
                gmailThreadId: log.messageId || `thread-${log._id}`,
                direction: 'outbound',
                from: 'me',
                to: log.to,
                subject: log.subject || '',
                snippet: (log.subject || '').substring(0, 100),
                receivedAt: log.sentAt || log.createdAt,
                isRead: true,
            });
            synced++;
        }

        res.json({ message: `Synced ${synced} sent emails to inbox`, synced });
    } catch (error) {
        console.error('Inbox sync error:', error);
        res.status(500).json({ error: 'Failed to sync inbox' });
    }
});

// Simulate inbound email (for testing)
router.post('/simulate-inbound', auth, async (req, res) => {
    try {
        const { from, subject, body, threadId } = req.body;
        if (!from) return res.status(400).json({ error: 'From email required' });

        const contact = await Contact.findOne({ userId: req.user.id, email: from.toLowerCase() });

        // Find campaign association via EmailLog
        let campaignId = null;
        const relatedLog = await EmailLog.findOne({ userId: req.user.id, to: from.toLowerCase() }).sort({ sentAt: -1 });
        if (relatedLog) campaignId = relatedLog.campaignId;

        const msg = await InboxMessage.create({
            userId: req.user.id,
            contactId: contact?._id,
            campaignId,
            gmailMessageId: `sim-${Date.now()}`,
            gmailThreadId: threadId || `thread-sim-${Date.now()}`,
            direction: 'inbound',
            from: from.toLowerCase(),
            to: 'me',
            subject: subject || 'Re: Your email',
            snippet: (body || '').substring(0, 150),
            htmlBody: body ? `<p>${body}</p>` : '<p>This is a simulated reply.</p>',
            plainBody: body || 'This is a simulated reply.',
            receivedAt: new Date(),
            isRead: false,
            needsReply: true,
        });

        res.json({ message: `Simulated inbound email from ${from}`, msg });
    } catch (error) {
        res.status(500).json({ error: 'Failed to simulate' });
    }
});

export default router;
