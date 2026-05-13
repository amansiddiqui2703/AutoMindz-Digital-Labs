import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { google } from 'googleapis';
import auth from '../middleware/auth.js';
import InboxMessage from '../models/InboxMessage.js';
import Contact from '../models/Contact.js';
import EmailLog from '../models/EmailLog.js';
import GmailAccount from '../models/GmailAccount.js';
import Campaign from '../models/Campaign.js';
import { replyViaOAuth } from '../services/gmailOAuth.js';
import { getAuthenticatedClient } from '../services/gmailOAuth.js';
import sse from '../services/sse.js';

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

/**
 * ISSUE 3 FIX: Sync real inbound replies from Gmail API.
 *
 * Root cause: The previous /sync endpoint only imported OUTBOUND sent emails
 * from EmailLog. There was no mechanism to fetch actual replies sent BY recipients
 * back to the connected Gmail inboxes. Gmail replies live in Gmail's inbox — they
 * must be explicitly fetched via the Gmail API.
 *
 * This endpoint:
 *  1. Iterates all connected OAuth Gmail accounts for the user.
 *  2. Calls gmail.users.messages.list() with query "is:inbox" filtered to recent messages.
 *  3. For each message, checks if it is a reply to one of our sent emails (via threadId).
 *  4. Stores new inbound replies as InboxMessage documents (direction: 'inbound').
 *  5. Marks Campaign recipient status as 'replied' and stops their follow-up sequence.
 *  6. Broadcasts real-time SSE events so the UI updates without a manual refresh.
 */
router.post('/sync-replies', auth, async (req, res) => {
    try {
        // Only fetch messages from the last 7 days to limit API calls
        const sevenDaysAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);

        const accounts = await GmailAccount.find({
            userId: req.user.id,
            connectionType: 'oauth',
            isActive: true,
        });

        if (accounts.length === 0) {
            return res.json({ message: 'No OAuth Gmail accounts to sync', synced: 0 });
        }

        let totalSynced = 0;

        for (const account of accounts) {
            try {
                const oauth2Client = await getAuthenticatedClient(account);
                const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

                // Fetch messages in inbox received recently
                const listRes = await gmail.users.messages.list({
                    userId: 'me',
                    q: `in:inbox after:${sevenDaysAgo}`,
                    maxResults: 50,
                });

                const messageIds = listRes.data.messages || [];

                for (const { id: gmailMsgId } of messageIds) {
                    // Skip if already stored
                    const alreadyStored = await InboxMessage.findOne({
                        userId: req.user.id,
                        gmailMessageId: gmailMsgId,
                    });
                    if (alreadyStored) continue;

                    // Fetch full message details
                    const msgRes = await gmail.users.messages.get({
                        userId: 'me',
                        id: gmailMsgId,
                        format: 'full',
                    });

                    const gmailMsg = msgRes.data;
                    const headers = gmailMsg.payload?.headers || [];
                    const getHeader = (name) =>
                        headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

                    const fromRaw = getHeader('From');
                    const subject = getHeader('Subject');
                    const threadId = gmailMsg.threadId;

                    // Extract plain email from "Name <email>" format
                    const fromEmailMatch = fromRaw.match(/<([^>]+)>/) || [null, fromRaw];
                    const fromEmail = (fromEmailMatch[1] || fromRaw).toLowerCase().trim();

                    // ISSUE 3 FIX: Only store messages that are replies to our sent emails
                    // (i.e. the threadId must match an outbound InboxMessage we sent)
                    const sentMsgInThread = await InboxMessage.findOne({
                        userId: req.user.id,
                        gmailThreadId: threadId,
                        direction: 'outbound',
                    }).populate('campaignId contactId');

                    if (!sentMsgInThread) continue; // Not a reply to our email

                    // Extract body
                    const getBody = (payload) => {
                        if (!payload) return { html: '', plain: '' };
                        const findPart = (parts, mime) =>
                            parts?.find(p => p.mimeType === mime);

                        const htmlPart = findPart(payload.parts, 'text/html');
                        const plainPart = findPart(payload.parts, 'text/plain');

                        const decode = (data) =>
                            data ? Buffer.from(data, 'base64').toString('utf-8') : '';

                        return {
                            html: htmlPart ? decode(htmlPart.body?.data) : decode(payload.body?.data),
                            plain: plainPart ? decode(plainPart.body?.data) : '',
                        };
                    };

                    const { html: htmlBody, plain: plainBody } = getBody(gmailMsg.payload);
                    const snippet = gmailMsg.snippet || subject.substring(0, 150);
                    const receivedAt = new Date(parseInt(gmailMsg.internalDate, 10));

                    // Resolve contact
                    const contact = await Contact.findOne({
                        userId: req.user.id,
                        email: fromEmail,
                    });

                    // Store inbound reply
                    const inboxMsg = await InboxMessage.create({
                        userId: req.user.id,
                        accountId: account._id,
                        contactId: contact?._id || sentMsgInThread.contactId,
                        campaignId: sentMsgInThread.campaignId,
                        gmailMessageId: gmailMsgId,
                        gmailThreadId: threadId,
                        direction: 'inbound',
                        from: fromEmail,
                        to: account.email,
                        subject: subject || `Re: ${sentMsgInThread.subject}`,
                        snippet,
                        htmlBody,
                        plainBody,
                        receivedAt,
                        isRead: false,
                        needsReply: true,
                    });

                    // ISSUE 2 + 3 FIX: Mark campaign recipient as 'replied' so follow-ups stop
                    if (sentMsgInThread.campaignId) {
                        await Campaign.updateOne(
                            {
                                _id: sentMsgInThread.campaignId,
                                'recipients.email': fromEmail,
                            },
                            {
                                $set: {
                                    'recipients.$.status': 'replied',
                                    'recipients.$.repliedAt': receivedAt,
                                    'recipients.$.sequenceStatus': 'stopped_reply',
                                }
                            }
                        );
                    }

                    // ISSUE 3 FIX: Broadcast real-time SSE so UI updates without refresh
                    sse.sendEventToUser(req.user.id.toString(), 'inbox_update', inboxMsg);

                    // Notify user of new reply
                    sse.sendEventToUser(req.user.id.toString(), 'notification', {
                        title: 'New Reply Received',
                        message: `${fromEmail} replied to your email!`,
                        icon: 'MessageSquare',
                    });

                    totalSynced++;
                }
            } catch (accountErr) {
                // Continue with other accounts if one fails (e.g. token expired)
                console.error(`Gmail sync-replies error for account ${account.email}:`, accountErr.message);
            }
        }

        res.json({ message: `Synced ${totalSynced} new inbound reply(ies)`, synced: totalSynced });
    } catch (error) {
        console.error('sync-replies error:', error);
        res.status(500).json({ error: 'Failed to sync replies' });
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
        // Send SSE notifications
        sse.sendEventToUser(req.user.id, 'notification', {
            title: 'New Reply Received',
            message: `${from} replied to your email!`,
            icon: 'MessageSquare'
        });
        sse.sendEventToUser(req.user.id, 'inbox_update', msg);
        sse.sendEventToUser(req.user.id, 'analytics_update', { event: 'reply' });

        res.json({ message: `Simulated inbound email from ${from}`, msg });
    } catch (error) {
        res.status(500).json({ error: 'Failed to simulate' });
    }
});



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
        // ISSUE 4 FIX: Must pass threadId so Gmail keeps the reply in the same thread.
        // Previously threadId was missing from the payload, causing Gmail to create a NEW thread.
        const replyResult = await replyViaOAuth(targetAccount, {
            to: toEmail,
            originalSubject: originalSubject,
            htmlBody: htmlBody,
            plainBody: plainBody,
            displayName: targetAccount.displayName || targetAccount.email,
            previousMessageId: lastMsg.gmailMessageId,
            // ISSUE 4 FIX: Pass the threadId so Gmail appends to the correct thread
            threadId: req.params.threadId,
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
