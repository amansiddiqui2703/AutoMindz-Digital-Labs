import { v4 as uuidv4 } from 'uuid';
import { sendViaScript } from './gmailScript.js';
import { sendViaOAuth } from './gmailOAuth.js';
import { replaceMergeTags } from '../utils/mergetags.js';
import EmailLog from '../models/EmailLog.js';
import InboxMessage from '../models/InboxMessage.js';
import sse from './sse.js';
import env from '../config/env.js';
import logger from '../utils/logger.js';

const TRACKING_PIXEL = (trackingId) =>
    `<img src="${env.SERVER_URL}/t/${trackingId}/open" width="1" height="1" style="display:none" alt="" />`;

const wrapLinks = (html, trackingId) => {
    return html.replace(
        /href="(https?:\/\/[^"]+)"/g,
        (match, url) => `href="${env.SERVER_URL}/t/${trackingId}/click?url=${encodeURIComponent(url)}"`
    );
};

// Bug #33 Fix: Unsubscribe URL must use the /t/ prefix since that's where tracking routes are mounted
const UNSUBSCRIBE_FOOTER = (trackingId) => `
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center;">
  <p>If you no longer wish to receive these emails, <a href="${env.SERVER_URL}/t/unsubscribe/${trackingId}" style="color:#6b7280;text-decoration:underline;">unsubscribe here</a>.</p>
</div>`;

const generatePlainText = (html) => {
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
};

/**
 * Clean HTML body from ReactQuill <p> wrappers.
 * ReactQuill wraps every line in <p>...</p> tags which causes
 * emails to render with excessive paragraph spacing.
 * This converts them to inline content with <br> breaks.
 */
const cleanHtmlBody = (html) => {
    if (!html) return html;
    let cleaned = html;

    // Remove empty Quill placeholders: <p><br></p>
    cleaned = cleaned.replace(/^(<p><br\s*\/?><\/p>\s*)+/gi, '');
    cleaned = cleaned.replace(/(\s*<p><br\s*\/?><\/p>)+$/gi, '');

    // Convert <p>content</p> blocks into content<br>
    cleaned = cleaned.replace(/<p>(.*?)<\/p>/gi, (match, inner) => {
        if (!inner || /^<br\s*\/?>$/i.test(inner.trim())) {
            return '<br>';
        }
        return inner + '<br>';
    });

    // Remove trailing <br> tags
    cleaned = cleaned.replace(/(<br\s*\/?>\s*)+$/gi, '');

    return cleaned.trim();
};

export const sendEmail = async (account, { to, subject, htmlBody, plainBody, contact, campaignId, userId, cc, bcc, attachments, abVariant }) => {
    const trackingId = uuidv4();

    // Clean HTML body to remove <p> wrappers from ReactQuill
    const cleanedHtmlBody = cleanHtmlBody(htmlBody);

    // Merge tags
    const mergedSubject = replaceMergeTags(subject, contact);
    let mergedHtml = replaceMergeTags(cleanedHtmlBody, contact);

    // Add tracking
    mergedHtml = wrapLinks(mergedHtml, trackingId);
    mergedHtml += TRACKING_PIXEL(trackingId);
    mergedHtml += UNSUBSCRIBE_FOOTER(trackingId);

    // Wrap in a proper HTML email document so all clients (Gmail, Outlook, etc.) render correctly
    mergedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#1a1a1a;">
  ${mergedHtml}
</body>
</html>`;

    // Plain text fallback
    const mergedPlain = plainBody
        ? replaceMergeTags(plainBody, contact)
        : generatePlainText(mergedHtml);

    // Create email log
    const emailLog = new EmailLog({
        campaignId,
        contactId: contact?._id,
        accountId: account._id,
        userId,
        to,
        subject: mergedSubject,
        trackingId,
        status: 'queued',
        abVariant: abVariant || 'A',
    });
    await emailLog.save();

    try {
        let result;

        // Send via the appropriate method based on connection type
        if (account.connectionType === 'oauth') {
            result = await sendViaOAuth(account, {
                to,
                subject: mergedSubject,
                htmlBody: mergedHtml,
                plainBody: mergedPlain,
                cc,
                bcc,
                displayName: account.displayName || account.email,
            });
        } else {
            result = await sendViaScript(account.scriptUrl, {
                to,
                subject: mergedSubject,
                htmlBody: mergedHtml,
                plainBody: mergedPlain,
                cc,
                bcc,
                displayName: account.displayName || account.email,
            });
        }

        // Update log
        emailLog.status = 'sent';
        emailLog.sentAt = new Date();
        emailLog.messageId = result.messageId;
        if (result.gmailMessageId) emailLog.gmailMessageId = result.gmailMessageId;
        if (result.gmailThreadId) emailLog.gmailThreadId = result.gmailThreadId;
        await emailLog.save();

        // Update account stats
        account.dailySentCount += 1;
        account.totalSent += 1;
        await account.save();

        // BUG FIX #5/#7: Use actual Gmail IDs for InboxMessage, not the custom RFC message-id
        const inboxMsg = await InboxMessage.create({
            userId,
            accountId: account._id,
            contactId: contact?._id,
            campaignId,
            emailLogId: emailLog._id,
            // Use gmailMessageId if available, fallback to custom message ID
            gmailMessageId: result.gmailMessageId || result.messageId || `sent-${emailLog._id}`,
            // Use gmailThreadId if available, NOT messageId (they're different things)
            gmailThreadId: result.gmailThreadId || `thread-${emailLog._id}`,
            direction: 'outbound',
            from: 'me',
            to: to,
            subject: mergedSubject,
            snippet: mergedSubject.substring(0, 100),
            htmlBody: mergedHtml,
            plainBody: mergedPlain,
            receivedAt: emailLog.sentAt,
            isRead: true,
        });

        // Push real-time event to connected UI clients
        sse.sendEventToUser(userId, 'inbox_update', inboxMsg);

        return { success: true, trackingId, messageId: result.messageId };
    } catch (error) {
        logger.error(`Email send failed to ${to}`, error);
        if (error.response?.data) {
            logger.error('Gmail API error details:', null, error.response.data);
        }
        emailLog.status = 'failed';
        emailLog.error = error.message;
        await emailLog.save();

        return { success: false, error: error.message };
    }
};
