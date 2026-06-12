import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);
import auth from '../middleware/auth.js';
import GmailAccount from '../models/GmailAccount.js';
import EmailLog from '../models/EmailLog.js';
import { sendEmail } from '../services/emailSender.js';
import { selectAccount, replyViaScript } from '../services/gmailScript.js';
import { replyViaOAuth } from '../services/gmailOAuth.js';
import { replaceMergeTags } from '../utils/mergetags.js';
import User from '../models/User.js';
import env from '../config/env.js';

const router = Router();
// Detailed Email Diagnostics Endpoint
router.post('/test-email', auth, async (req, res) => {
    try {
        const { to, accountId } = req.body;
        if (!to) return res.status(400).json({ error: 'To email is required' });

        const account = await GmailAccount.findOne({ 
            ...(accountId ? { _id: accountId } : {}),
            userId: req.user.id, 
            isActive: true 
        });

        if (!account) return res.status(400).json({ error: 'No active Gmail account available for testing' });

        const domain = to.split('@')[1];
        let mxRecords = [];
        try {
            mxRecords = await resolveMx(domain);
        } catch (e) {
            return res.status(400).json({ 
                error: `DNS resolution failed for domain ${domain}`, 
                details: e.message 
            });
        }

        if (!mxRecords || mxRecords.length === 0) {
            return res.status(400).json({ error: `No MX records found for domain ${domain}` });
        }

        const htmlBody = '<p>This is a <b>diagnostic test email</b> from AutoMindz.</p>';
        const subject = 'AutoMindz Delivery Diagnostic Test';

        const result = await sendEmail(account, {
            to, subject, htmlBody, plainBody: 'This is a diagnostic test email.', 
            contact: { email: to, name: 'Test User' }, 
            userId: req.user.id
        });

        res.json({
            status: result.success ? 'success' : 'failed',
            account: { email: account.email, type: account.connectionType },
            mxRecords,
            result
        });
    } catch (error) {
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

// Send single email
router.post('/send-single', auth, async (req, res) => {
    try {
        const { to, subject, htmlBody, plainBody, accountId, cc, bcc, attachments } = req.body;
        if (!to || !subject || !htmlBody) {
            return res.status(400).json({ error: 'To, subject, and body are required' });
        }

        let account;
        if (accountId) {
            account = await GmailAccount.findOne({ _id: accountId, userId: req.user.id, isActive: true });
        } else {
            const accounts = await GmailAccount.find({ userId: req.user.id, isActive: true });
            account = accounts[0];
        }

        if (!account) return res.status(400).json({ error: 'No Gmail account available' });

        const contact = { email: to, name: '', company: '' };
        const user = await User.findById(req.user.id).select('settings.signature');
        const signature = user?.settings?.signature || '';
        const finalHtmlBody = htmlBody + (signature ? `<br><br>${signature}` : '');

        const result = await sendEmail(account, {
            to, subject, htmlBody: finalHtmlBody, plainBody, contact, userId: req.user.id, cc, bcc, attachments,
        });

        if (result.success) {
            res.json({ message: 'Email sent', trackingId: result.trackingId });
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: error.message || 'Failed to send email' });
    }
});

// Send threaded follow-up reply
router.post('/send-followup', auth, async (req, res) => {
    try {
        const { originalEmailId, htmlBody, plainBody } = req.body;
        if (!originalEmailId || !htmlBody) {
            return res.status(400).json({ error: 'Original email ID and body are required' });
        }

        // Find the original email
        const originalEmail = await EmailLog.findOne({ _id: originalEmailId, userId: req.user.id });
        if (!originalEmail) {
            return res.status(404).json({ error: 'Original email not found' });
        }

        // Get the Gmail account that sent the original email
        const account = await GmailAccount.findOne({ _id: originalEmail.accountId, userId: req.user.id, isActive: true });
        if (!account) {
            return res.status(400).json({ error: 'Gmail account not available. Reconnect it or use a different account.' });
        }

        // Generate tracking for the follow-up
        const trackingId = uuidv4();
        const trackingPixel = `<img src="${env.SERVER_URL}/t/${trackingId}/open" width="1" height="1" style="display:none" alt="" />`;
        const user = await User.findById(req.user.id).select('settings.signature');
        const signature = user?.settings?.signature || '';
        const bodyWithSig = htmlBody + (signature ? `<br><br>${signature}` : '');

        let trackedHtml = bodyWithSig.replace(
            /href="(https?:\/\/[^"]+)"/g,
            (match, url) => `href="${env.SERVER_URL}/t/${trackingId}/click?url=${encodeURIComponent(url)}"`
        );
        trackedHtml += trackingPixel;

        const mergedPlain = plainBody || htmlBody
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<[^>]+>/g, '')
            .trim();

        // Create follow-up email log
        const followUpLog = new EmailLog({
            campaignId: originalEmail.campaignId,
            contactId: originalEmail.contactId,
            accountId: account._id,
            userId: req.user.id,
            to: originalEmail.to,
            subject: `Re: ${originalEmail.subject.replace(/^Re:\s*/i, '')}`,
            trackingId,
            status: 'queued',
            isFollowUp: true,
            followUpIndex: await EmailLog.countDocuments({
                userId: req.user.id,
                to: originalEmail.to,
                isFollowUp: true,
            }) + 1,
        });
        await followUpLog.save();

        try {
            // Send threaded reply via the appropriate method
            const replyPayload = {
                to: originalEmail.to,
                originalSubject: originalEmail.subject,
                htmlBody: trackedHtml,
                plainBody: mergedPlain,
                displayName: account.displayName || account.email,
                previousMessageId: originalEmail.messageId,
                threadId: originalEmail.gmailThreadId,
            };
            const result = account.connectionType === 'oauth'
                ? await replyViaOAuth(account, replyPayload)
                : await replyViaScript(account.scriptUrl, replyPayload);

            // Update log
            followUpLog.status = 'sent';
            followUpLog.sentAt = new Date();
            followUpLog.messageId = result.messageId;
            await followUpLog.save();

            // Update account stats
            account.dailySentCount += 1;
            account.totalSent += 1;
            await account.save();

            res.json({
                message: `Follow-up sent to ${originalEmail.to} in the same thread`,
                trackingId,
                threaded: result.threaded,
            });
        } catch (sendError) {
            followUpLog.status = 'failed';
            followUpLog.error = sendError.message;
            await followUpLog.save();
            res.status(500).json({ error: sendError.message });
        }
    } catch (error) {
        console.error('Follow-up error:', error);
        res.status(500).json({ error: error.message || 'Failed to send follow-up' });
    }
});

// Bulk follow-up — send threaded follow-ups to multiple emails at once
router.post('/send-bulk-followup', auth, async (req, res) => {
    try {
        const { emailIds, htmlBody, plainBody } = req.body;
        if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
            return res.status(400).json({ error: 'At least one email ID is required' });
        }
        if (!htmlBody) {
            return res.status(400).json({ error: 'Follow-up body is required' });
        }

        const results = { success: 0, failed: 0, details: [] };

        for (const emailId of emailIds) {
            try {
                // Find original email
                const originalEmail = await EmailLog.findOne({ _id: emailId, userId: req.user.id });
                if (!originalEmail) {
                    results.failed++;
                    results.details.push({ to: 'Unknown', error: 'Email not found' });
                    continue;
                }

                // Get account
                const account = await GmailAccount.findOne({ _id: originalEmail.accountId, userId: req.user.id, isActive: true });
                if (!account) {
                    results.failed++;
                    results.details.push({ to: originalEmail.to, error: 'Account not available' });
                    continue;
                }

                // Check daily limit
                if (account.dailySentCount >= account.dailyLimit) {
                    results.failed++;
                    results.details.push({ to: originalEmail.to, error: 'Daily limit reached' });
                    continue;
                }

                // Tracking
                const trackingId = uuidv4();
                const trackingPixel = `<img src="${env.SERVER_URL}/t/${trackingId}/open" width="1" height="1" style="display:none" alt="" />`;
                const user = await User.findById(req.user.id).select('settings.signature');
                const signature = user?.settings?.signature || '';
                const bodyWithSig = htmlBody + (signature ? `<br><br>${signature}` : '');

                let trackedHtml = bodyWithSig.replace(
                    /href="(https?:\/\/[^"]+)"/g,
                    (match, url) => `href="${env.SERVER_URL}/t/${trackingId}/click?url=${encodeURIComponent(url)}"`
                );
                trackedHtml += trackingPixel;

                const mergedPlain = plainBody || htmlBody
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/<\/p>/gi, '\n\n')
                    .replace(/<[^>]+>/g, '')
                    .trim();

                // Create follow-up log
                const followUpLog = new EmailLog({
                    campaignId: originalEmail.campaignId,
                    contactId: originalEmail.contactId,
                    accountId: account._id,
                    userId: req.user.id,
                    to: originalEmail.to,
                    subject: `Re: ${originalEmail.subject.replace(/^Re:\s*/i, '')}`,
                    trackingId,
                    status: 'queued',
                    isFollowUp: true,
                    followUpIndex: await EmailLog.countDocuments({
                        userId: req.user.id,
                        to: originalEmail.to,
                        isFollowUp: true,
                    }) + 1,
                });
                await followUpLog.save();

                // Send threaded reply via the appropriate method
                const replyPayload = {
                    to: originalEmail.to,
                    originalSubject: originalEmail.subject,
                    htmlBody: trackedHtml,
                    plainBody: mergedPlain,
                    displayName: account.displayName || account.email,
                    previousMessageId: originalEmail.messageId,
                    threadId: originalEmail.gmailThreadId,
                };
                const result = account.connectionType === 'oauth'
                    ? await replyViaOAuth(account, replyPayload)
                    : await replyViaScript(account.scriptUrl, replyPayload);

                followUpLog.status = 'sent';
                followUpLog.sentAt = new Date();
                followUpLog.messageId = result.messageId;
                await followUpLog.save();

                account.dailySentCount += 1;
                account.totalSent += 1;
                await account.save();

                results.success++;
                results.details.push({ to: originalEmail.to, status: 'sent', trackingId });

                // Small delay between sends to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (sendError) {
                results.failed++;
                results.details.push({ to: emailId, error: sendError.message });
            }
        }

        res.json({
            message: `Bulk follow-up complete: ${results.success} sent, ${results.failed} failed`,
            ...results,
        });
    } catch (error) {
        console.error('Bulk follow-up error:', error);
        res.status(500).json({ error: error.message || 'Failed to send bulk follow-ups' });
    }
});

export default router;
