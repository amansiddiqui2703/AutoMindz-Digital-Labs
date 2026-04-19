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

        // Trigger SSE
        import('../services/sse.js').then((sseMod) => {
            sseMod.default.sendEventToUser(req.user.id, 'notification', {
                title: 'New Reply Received',
                message: `${from} replied to your email!`,
                icon: 'MessageSquare'
            });
            sseMod.default.sendEventToUser(req.user.id, 'inbox_update', msg);
            sseMod.default.sendEventToUser(req.user.id, 'analytics_update', { event: 'reply' });
        }).catch(err => console.error(err));

        res.json({ message: `Simulated inbound email from ${from}`, msg });
    } catch (error) {
        res.status(500).json({ error: 'Failed to simulate' });
    }
});

import { replyViaOAuth } from '../services/gmailOAuth.js';
import GmailAccount from '../models/GmailAccount.js';
import sse from '../services/sse.js';
import { v4 as uuidv4 } from 'uuid';

// Native inline reply to a thread
router.post('/reply/:threadId', auth, async (req, res) => {
    try {
        const { htmlBody, plainBody } = req.body;
        if (!htmlBody && !plainBody) return res.status(400).json({ error: 'Message body is required' });

        // Find conversation details from thread
        const threadMessages = await InboxMessage.find({
            userId: req.user.id,
            gmailThreadId: req.params.threadId,
        }).populate('contactId').sort({ receivedAt: 1 });

        if (!threadMessages || threadMessages.length === 0) {
            return res.status(404).json({ error: 'Thread not found' });
        }

        const lastMsg = threadMessages[threadMessages.length - 1];
        
        let targetAccount;
        if (lastMsg.accountId) {
            targetAccount = await GmailAccount.findById(lastMsg.accountId);
        } else {
            // Find account via fallback query if it wasn't statically linked
            targetAccount = await GmailAccount.findOne({ userId: req.user.id });
        }

        if (!targetAccount) return res.status(400).json({ error: 'Email Account missing' });

        // Identify the exact person to reply to
        const toEmail = lastMsg.direction === 'inbound' ? lastMsg.from : lastMsg.to;
        const originalSubject = lastMsg.subject || 'Re: Subject';
        const contactId = lastMsg.contactId?._id;
        const campaignId = lastMsg.campaignId;

        // Perform the OAuth Reply natively
        const replyResult = await replyViaOAuth(targetAccount, {
            to: toEmail,
            originalSubject: originalSubject,
            htmlBody: htmlBody,
            plainBody: plainBody,
            displayName: targetAccount.displayName || targetAccount.email,
            previousMessageId: lastMsg.gmailMessageId
        });

        if (!replyResult.success) {
            return res.status(500).json({ error: 'Failed dispatching reply via Gmail' });
        }

        // Generate Logging and Inbox record locally
        const trackingId = uuidv4();
        const emailLog = new EmailLog({
            campaignId,
            contactId,
            accountId: targetAccount._id,
            userId: req.user.id,
            to: toEmail,
            subject: `Re: ${originalSubject.replace(/^Re:\s*/i, '')}`,
            trackingId,
            status: 'sent',
            sentAt: new Date(),
            messageId: replyResult.messageId,
            isFollowUp: true
        });
        await emailLog.save();

        const inboxMsg = await InboxMessage.create({
            userId: req.user.id,
            accountId: targetAccount._id,
            contactId: contactId,
            campaignId: campaignId,
            emailLogId: emailLog._id,
            gmailMessageId: replyResult.messageId,
            gmailThreadId: req.params.threadId, // maintain the thread constraint
            direction: 'outbound',
            from: targetAccount.email,
            to: toEmail,
            subject: emailLog.subject,
            snippet: (plainBody || htmlBody).substring(0, 100),
            htmlBody: htmlBody,
            plainBody: plainBody,
            receivedAt: new Date(),
            isRead: true,
        });

        // Resolve Needs Reply globally on thread
        await InboxMessage.updateMany(
            { userId: req.user.id, gmailThreadId: req.params.threadId },
            { needsReply: false }
        );

        // Send Native Broadcast Push
        sse.sendEventToUser(req.user.id, 'inbox_update', inboxMsg);

        res.json({ message: 'Reply Sent Successfully', inThread: req.params.threadId });
    } catch (error) {
        console.error('Thread Reply Error:', error);
        res.status(500).json({ error: error.message || 'Failed to reply to thread' });
    }
});

export default router;
