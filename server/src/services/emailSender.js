import { v4 as uuidv4 } from 'uuid';
import { sendViaScript } from './gmailScript.js';
import { sendViaOAuth } from './gmailOAuth.js';
import { replaceMergeTags } from '../utils/mergetags.js';
import EmailLog from '../models/EmailLog.js';
import env from '../config/env.js';

const TRACKING_PIXEL = (trackingId) =>
    `<img src="${env.SERVER_URL}/t/${trackingId}/open" width="1" height="1" style="display:none" alt="" />`;

const wrapLinks = (html, trackingId) => {
    return html.replace(
        /href="(https?:\/\/[^"]+)"/g,
        (match, url) => `href="${env.SERVER_URL}/t/${trackingId}/click?url=${encodeURIComponent(url)}"`
    );
};

const UNSUBSCRIBE_FOOTER = (trackingId) => `
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center;">
  <p>If you no longer wish to receive these emails, <a href="${env.SERVER_URL}/unsubscribe/${trackingId}" style="color:#6b7280;text-decoration:underline;">unsubscribe here</a>.</p>
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

export const sendEmail = async (account, { to, subject, htmlBody, plainBody, contact, campaignId, userId, cc, bcc, attachments, abVariant }) => {
    const trackingId = uuidv4();

    // Merge tags
    const mergedSubject = replaceMergeTags(subject, contact);
    let mergedHtml = replaceMergeTags(htmlBody, contact);

    // Add tracking
    mergedHtml = wrapLinks(mergedHtml, trackingId);
    mergedHtml += TRACKING_PIXEL(trackingId);
    mergedHtml += UNSUBSCRIBE_FOOTER(trackingId);

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
        await emailLog.save();

        // Update account stats
        account.dailySentCount += 1;
        account.totalSent += 1;
        await account.save();

        return { success: true, trackingId, messageId: result.messageId };
    } catch (error) {
        emailLog.status = 'failed';
        emailLog.error = error.message;
        await emailLog.save();

        return { success: false, error: error.message };
    }
};
