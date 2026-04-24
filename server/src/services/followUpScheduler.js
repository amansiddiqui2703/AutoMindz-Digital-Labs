import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import Campaign from '../models/Campaign.js';
import EmailLog from '../models/EmailLog.js';
import GmailAccount from '../models/GmailAccount.js';
import TrackingEvent from '../models/TrackingEvent.js';
import Suppression from '../models/Suppression.js';
import { replyViaScript } from './gmailScript.js';
import { replyViaOAuth } from './gmailOAuth.js';
import { selectAccount } from './gmailScript.js';
import { replaceMergeTags } from '../utils/mergetags.js';
import env from '../config/env.js';

/**
 * Check if a recipient has replied based on tracking events & recipient status.
 */
const hasRecipientReplied = async (campaignId, recipientEmail) => {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return false;
    const recipient = campaign.recipients.find(
        r => r.email.toLowerCase() === recipientEmail.toLowerCase()
    );
    if (recipient && (recipient.status === 'replied' || recipient.repliedAt)) return true;

    // Also check tracking events
    const logs = await EmailLog.find({ campaignId, to: recipientEmail.toLowerCase() });
    for (const log of logs) {
        const replyEvent = await TrackingEvent.findOne({ trackingId: log.trackingId, type: 'reply' });
        if (replyEvent) return true;
    }
    return false;
};

/**
 * Check if a recipient has opened any email from this campaign.
 */
const hasRecipientOpened = async (campaignId, recipientEmail) => {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return false;
    const recipient = campaign.recipients.find(
        r => r.email.toLowerCase() === recipientEmail.toLowerCase()
    );
    if (recipient && (recipient.status === 'opened' || recipient.status === 'clicked' || recipient.openedAt)) return true;

    const logs = await EmailLog.find({ campaignId, to: recipientEmail.toLowerCase() });
    for (const log of logs) {
        const openEvent = await TrackingEvent.findOne({ trackingId: log.trackingId, type: 'open' });
        if (openEvent) return true;
    }
    return false;
};

/**
 * Check if a recipient has clicked any link.
 */
const hasRecipientClicked = async (campaignId, recipientEmail) => {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return false;
    const recipient = campaign.recipients.find(
        r => r.email.toLowerCase() === recipientEmail.toLowerCase()
    );
    if (recipient && (recipient.status === 'clicked' || recipient.clickedAt)) return true;

    const logs = await EmailLog.find({ campaignId, to: recipientEmail.toLowerCase() });
    for (const log of logs) {
        const clickEvent = await TrackingEvent.findOne({ trackingId: log.trackingId, type: 'click' });
        if (clickEvent) return true;
    }
    return false;
};

/**
 * Check if the follow-up condition is met for a recipient.
 */
const isConditionMet = async (condition, campaignId, recipientEmail) => {
    switch (condition) {
        case 'no_reply':
            return !(await hasRecipientReplied(campaignId, recipientEmail));
        case 'no_open':
            return !(await hasRecipientOpened(campaignId, recipientEmail));
        case 'no_click':
            return !(await hasRecipientClicked(campaignId, recipientEmail));
        case 'all':
            return true;
        default:
            return true;
    }
};

/**
 * Process a single recipient's follow-up for a campaign.
 */
const processRecipientFollowUp = async (campaign, recipient) => {
    try {
        // 1. Check if recipient has replied → auto-stop
        const replied = await hasRecipientReplied(campaign._id, recipient.email);
        if (replied) {
            await Campaign.updateOne(
                { _id: campaign._id, 'recipients._id': recipient._id },
                {
                    $set: {
                        'recipients.$.sequenceStatus': 'stopped_reply',
                        'recipients.$.status': 'replied',
                        'recipients.$.repliedAt': new Date(),
                    }
                }
            );
            console.log(`🛑 Sequence stopped (reply detected): ${recipient.email}`);
            return;
        }

        // 2. Check if recipient is unsubscribed
        const suppressed = await Suppression.findOne({ userId: campaign.userId, email: recipient.email.toLowerCase() });
        if (suppressed) {
            await Campaign.updateOne(
                { _id: campaign._id, 'recipients._id': recipient._id },
                { $set: { 'recipients.$.sequenceStatus': 'stopped_unsubscribe' } }
            );
            console.log(`🛑 Sequence stopped (unsubscribed): ${recipient.email}`);
            return;
        }

        // 3. Find the next follow-up step
        const nextStepNumber = recipient.currentStep + 1;
        const followUpStep = campaign.followUps
            .sort((a, b) => a.stepNumber - b.stepNumber)
            .find(f => f.stepNumber === nextStepNumber);

        if (!followUpStep) {
            // No more steps — sequence completed
            await Campaign.updateOne(
                { _id: campaign._id, 'recipients._id': recipient._id },
                { $set: { 'recipients.$.sequenceStatus': 'completed' } }
            );
            console.log(`✅ Sequence completed for ${recipient.email} (${recipient.currentStep} steps)`);
            return;
        }

        // 4. Check the condition for this step
        const conditionMet = await isConditionMet(followUpStep.condition, campaign._id, recipient.email);
        if (!conditionMet) {
            // Condition not met — skip this step and move to next
            const nextStep = campaign.followUps.find(f => f.stepNumber === nextStepNumber + 1);
            if (nextStep) {
                const nextDate = new Date();
                nextDate.setDate(nextDate.getDate() + nextStep.delayDays);
                await Campaign.updateOne(
                    { _id: campaign._id, 'recipients._id': recipient._id },
                    {
                        $set: {
                            'recipients.$.currentStep': nextStepNumber,
                            'recipients.$.nextFollowUpAt': nextDate,
                        }
                    }
                );
                console.log(`⏭ Skipping step ${nextStepNumber} for ${recipient.email} (condition not met), next in ${nextStep.delayDays} days`);
            } else {
                await Campaign.updateOne(
                    { _id: campaign._id, 'recipients._id': recipient._id },
                    { $set: { 'recipients.$.sequenceStatus': 'completed', 'recipients.$.currentStep': nextStepNumber } }
                );
                console.log(`✅ Sequence completed for ${recipient.email} (condition not met, no more steps)`);
            }
            return;
        }

        // 5. Select an account (round-robin)
        const account = await selectAccount(campaign.userId, campaign.accountIds);
        if (!account) {
            console.warn(`⚠ Follow-up delayed (no accounts available): ${recipient.email}`);
            return; // Will retry next cycle
        }

        // 6. Build the follow-up email
        const trackingId = uuidv4();
        const originalSubject = campaign.subject;
        const followUpSubject = followUpStep.subject || `Re: ${originalSubject.replace(/^Re:\s*/i, '')}`;

        // Merge tags
        const contact = {
            _id: recipient.contactId,
            email: recipient.email,
            name: recipient.name || '',
            company: recipient.company || '',
            customFields: recipient.customFields ? Object.fromEntries(recipient.customFields) : {},
        };
        const mergedSubject = replaceMergeTags(followUpSubject, contact);
        let mergedHtml = replaceMergeTags(followUpStep.htmlBody || '', contact);

        // Add tracking pixel and link wrapping
        mergedHtml = mergedHtml.replace(
            /href="(https?:\/\/[^"]+)"/g,
            (match, url) => `href="${env.SERVER_URL}/t/${trackingId}/click?url=${encodeURIComponent(url)}"`
        );
        const trackingPixel = `<img src="${env.SERVER_URL}/t/${trackingId}/open" width="1" height="1" style="display:none" alt="" />`;
        mergedHtml += trackingPixel;

        const plainBody = followUpStep.plainBody
            ? replaceMergeTags(followUpStep.plainBody, contact)
            : mergedHtml.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<[^>]+>/g, '').trim();

        // 7. Create email log
        const followUpLog = new EmailLog({
            campaignId: campaign._id,
            contactId: recipient.contactId,
            accountId: account._id,
            userId: campaign.userId,
            to: recipient.email,
            subject: mergedSubject,
            trackingId,
            status: 'queued',
            isFollowUp: true,
            followUpIndex: nextStepNumber,
        });
        await followUpLog.save();

        // Find the previous message ID for threading
        const previousLog = await EmailLog.findOne({
            campaignId: campaign._id,
            to: recipient.email.toLowerCase(),
            status: 'sent',
            gmailMessageId: { $ne: null }
        }).sort({ createdAt: -1 });

        const previousMessageId = previousLog ? previousLog.gmailMessageId : null;
        const threadId = previousLog ? previousLog.gmailThreadId : null;

        // 8. Send threaded reply via appropriate method
        let result;
        const sendPayload = {
            to: recipient.email,
            originalSubject: originalSubject.replace(/^Re:\s*/i, ''),
            htmlBody: mergedHtml,
            plainBody,
            displayName: account.displayName || account.email,
            previousMessageId,
            threadId,
        };

        if (account.connectionType === 'oauth') {
            result = await replyViaOAuth(account, sendPayload);
        } else {
            result = await replyViaScript(account.scriptUrl, sendPayload);
        }

        // 9. Update email log
        followUpLog.status = 'sent';
        followUpLog.sentAt = new Date();
        followUpLog.messageId = result.messageId;
        if (result.gmailMessageId) followUpLog.gmailMessageId = result.gmailMessageId;
        if (result.gmailThreadId) followUpLog.gmailThreadId = result.gmailThreadId;
        await followUpLog.save();

        // 10. Update account stats
        account.dailySentCount += 1;
        account.totalSent += 1;
        await account.save();

        // 11. Update campaign stats
        await Campaign.findByIdAndUpdate(campaign._id, { $inc: { 'stats.sent': 1 } });

        // 12. Update recipient sequence state
        const nextFollowUp = campaign.followUps
            .sort((a, b) => a.stepNumber - b.stepNumber)
            .find(f => f.stepNumber === nextStepNumber + 1);

        if (nextFollowUp) {
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + nextFollowUp.delayDays);
            await Campaign.updateOne(
                { _id: campaign._id, 'recipients._id': recipient._id },
                {
                    $set: {
                        'recipients.$.currentStep': nextStepNumber,
                        'recipients.$.nextFollowUpAt': nextDate,
                    }
                }
            );
            console.log(`📧 Follow-up #${nextStepNumber} sent to ${recipient.email} — next in ${nextFollowUp.delayDays} days`);
        } else {
            // Last step done
            await Campaign.updateOne(
                { _id: campaign._id, 'recipients._id': recipient._id },
                {
                    $set: {
                        'recipients.$.currentStep': nextStepNumber,
                        'recipients.$.sequenceStatus': 'completed',
                        'recipients.$.nextFollowUpAt': null,
                    }
                }
            );
            console.log(`✅ Follow-up sequence completed for ${recipient.email} (${nextStepNumber} steps sent)`);
        }

    } catch (error) {
        console.error(`✗ Follow-up failed for ${recipient.email}:`, error.message);
    }
};

/**
 * Main scheduler tick: find campaigns with due follow-ups and process them.
 */
const runScheduler = async () => {
    try {
        const now = new Date();

        // Find campaigns that have follow-up steps and are running/completed
        const campaigns = await Campaign.find({
            'followUps.0': { $exists: true },
            status: { $in: ['running', 'completed'] },
            'recipients.sequenceStatus': 'active',
            'recipients.nextFollowUpAt': { $lte: now },
        });

        if (campaigns.length === 0) return;

        let totalDue = 0;

        for (const campaign of campaigns) {
            // Find recipients due for follow-up
            const dueRecipients = campaign.recipients.filter(
                r => r.sequenceStatus === 'active' && r.nextFollowUpAt && new Date(r.nextFollowUpAt) <= now
            );

            if (dueRecipients.length === 0) continue;
            totalDue += dueRecipients.length;

            console.log(`⏰ Campaign "${campaign.name}": ${dueRecipients.length} follow-ups due`);

            for (const recipient of dueRecipients) {
                await processRecipientFollowUp(campaign, recipient);
                // Small delay between sends to avoid rate limiting
                await new Promise(r => setTimeout(r, 2000));
            }

            // Check if all sequences are done — mark campaign completed
            const updatedCampaign = await Campaign.findById(campaign._id);
            if (updatedCampaign) {
                const activeSequences = updatedCampaign.recipients.filter(r => r.sequenceStatus === 'active').length;
                const pendingEmails = updatedCampaign.recipients.filter(r => r.status === 'pending').length;
                if (activeSequences === 0 && pendingEmails === 0 && updatedCampaign.status !== 'completed') {
                    updatedCampaign.status = 'completed';
                    await updatedCampaign.save();
                    console.log(`✅ Campaign "${updatedCampaign.name}" fully completed (all sequences done)`);
                }
            }
        }

        if (totalDue > 0) {
            console.log(`⏰ Follow-up scheduler: processed ${totalDue} follow-up(s)`);
        }
    } catch (error) {
        console.error('✗ Follow-up scheduler error:', error.message);
    }
};

/**
 * Start the follow-up scheduler cron job.
 * Runs every 15 minutes to check for due follow-ups.
 */
export const startFollowUpScheduler = () => {
    // Run every 15 minutes
    cron.schedule('*/15 * * * *', () => {
        runScheduler();
    });

    console.log('✓ Follow-up scheduler started (checks every 15 min)');

    // Also run once immediately on startup (after a short delay)
    setTimeout(() => runScheduler(), 5000);
};
