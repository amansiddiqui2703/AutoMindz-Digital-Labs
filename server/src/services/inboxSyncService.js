import { google } from 'googleapis';
import InboxMessage from '../models/InboxMessage.js';
import Contact from '../models/Contact.js';
import GmailAccount from '../models/GmailAccount.js';
import Campaign from '../models/Campaign.js';
import { getAuthenticatedClient } from './gmailOAuth.js';
import sse from './sse.js';

export const syncInboundReplies = async (userId) => {
    try {
        const sevenDaysAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);

        const accounts = await GmailAccount.find({
            userId,
            connectionType: 'oauth',
            isActive: true,
        });

        if (accounts.length === 0) return 0;

        let totalSynced = 0;

        for (const account of accounts) {
            try {
                const oauth2Client = await getAuthenticatedClient(account);
                const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

                const listRes = await gmail.users.messages.list({
                    userId: 'me',
                    q: `in:inbox after:${sevenDaysAgo}`,
                    maxResults: 50,
                });

                const messageIds = listRes.data.messages || [];

                for (const { id: gmailMsgId } of messageIds) {
                    const alreadyStored = await InboxMessage.findOne({
                        userId,
                        gmailMessageId: gmailMsgId,
                    });
                    if (alreadyStored) continue;

                    const msgRes = await gmail.users.messages.get({
                        userId: 'me',
                        id: gmailMsgId,
                        format: 'full',
                    });

                    const gmailMsg = msgRes.data;
                    const headers = gmailMsg.payload?.headers || [];
                    const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

                    const fromRaw = getHeader('From');
                    const subject = getHeader('Subject');
                    const threadId = gmailMsg.threadId;

                    const fromEmailMatch = fromRaw.match(/<([^>]+)>/) || [null, fromRaw];
                    const fromEmail = (fromEmailMatch[1] || fromRaw).toLowerCase().trim();

                    const sentMsgInThread = await InboxMessage.findOne({
                        userId,
                        gmailThreadId: threadId,
                        direction: 'outbound',
                    }).populate('campaignId contactId');

                    if (!sentMsgInThread) continue;

                    const getBody = (payload) => {
                        if (!payload) return { html: '', plain: '' };
                        const findPart = (parts, mime) => parts?.find(p => p.mimeType === mime);
                        const htmlPart = findPart(payload.parts, 'text/html');
                        const plainPart = findPart(payload.parts, 'text/plain');
                        const decode = (data) => data ? Buffer.from(data, 'base64').toString('utf-8') : '';
                        return {
                            html: htmlPart ? decode(htmlPart.body?.data) : decode(payload.body?.data),
                            plain: plainPart ? decode(plainPart.body?.data) : '',
                        };
                    };

                    const { html: htmlBody, plain: plainBody } = getBody(gmailMsg.payload);
                    const snippet = gmailMsg.snippet || subject.substring(0, 150);
                    const receivedAt = new Date(parseInt(gmailMsg.internalDate, 10));

                    const contact = await Contact.findOne({ userId, email: fromEmail });

                    const inboxMsg = await InboxMessage.create({
                        userId,
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

                    if (sentMsgInThread.campaignId) {
                        await Campaign.updateOne(
                            { _id: sentMsgInThread.campaignId, 'recipients.email': fromEmail },
                            {
                                $set: {
                                    'recipients.$.status': 'replied',
                                    'recipients.$.repliedAt': receivedAt,
                                    'recipients.$.sequenceStatus': 'stopped_reply',
                                }
                            }
                        );
                    }

                    sse.sendEventToUser(userId.toString(), 'inbox_update', inboxMsg);
                    sse.sendEventToUser(userId.toString(), 'notification', {
                        title: 'New Reply Received',
                        message: `${fromEmail} replied to your email!`,
                        icon: 'MessageSquare',
                    });

                    totalSynced++;
                }
            } catch (err) {
                console.error(`Sync replies error for account ${account.email}:`, err.message);
            }
        }
        return totalSynced;
    } catch (error) {
        console.error('syncInboundReplies error:', error.message);
        return 0;
    }
};
