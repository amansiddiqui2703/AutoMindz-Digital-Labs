import Queue from 'bull';
import env from '../config/env.js';
import { sendEmail } from './emailSender.js';
import { selectAccount } from './gmailScript.js';
import Campaign from '../models/Campaign.js';
import Suppression from '../models/Suppression.js';

import Redis from 'ioredis';

import { redis } from '../config/redis.js';

let emailQueue = null;

export const initQueue = () => {
    try {
        if (!redis) return null;

        redis.once('ready', () => {
            emailQueue = new Queue('emailQueue', env.REDIS_URL, {
                defaultJobOptions: {
                    removeOnComplete: 100,
                    removeOnFail: 200,
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 5000 },
                },
            });

            emailQueue.on('error', (err) => {
                console.warn('⚠ Email queue error:', err.message);
            });

            emailQueue.process(async (job) => {
                const { campaignId, recipient, userId, accountIds, subject, htmlBody, plainBody, cc, bcc, attachments } = job.data;

                // Check suppression
                const suppressed = await Suppression.findOne({ userId, email: recipient.email.toLowerCase() });
                if (suppressed) {
                    return { skipped: true, reason: 'suppressed', email: recipient.email };
                }

                // Select account with available quota (round-robin)
                const account = await selectAccount(userId, accountIds);
                if (!account) {
                    throw new Error('No available Gmail accounts (quota exhausted)');
                }

                const contact = {
                    _id: recipient.contactId,
                    email: recipient.email,
                    name: recipient.name || '',
                    company: recipient.company || '',
                    customFields: recipient.customFields || {},
                };

                const result = await sendEmail(account, {
                    to: recipient.email,
                    subject,
                    htmlBody,
                    plainBody,
                    contact,
                    campaignId,
                    userId,
                    cc,
                    bcc,
                    attachments,
                });

                // Update campaign stats and schedule follow-ups
                if (result.success) {
                    await Campaign.findByIdAndUpdate(campaignId, {
                        $inc: { 'stats.sent': 1 },
                    });

                    // Update recipient sentAt
                    await Campaign.updateOne(
                        { _id: campaignId, 'recipients.email': recipient.email },
                        { $set: { 'recipients.$.sentAt': new Date(), 'recipients.$.status': 'sent' } }
                    );

                    // Schedule first follow-up if campaign has follow-up steps
                    const campaign = await Campaign.findById(campaignId);
                    if (campaign?.followUps?.length > 0) {
                        const firstFollowUp = campaign.followUps
                            .sort((a, b) => a.stepNumber - b.stepNumber)
                            .find(f => f.stepNumber === 1);
                        if (firstFollowUp) {
                            const nextDate = new Date();
                            nextDate.setDate(nextDate.getDate() + firstFollowUp.delayDays);
                            await Campaign.updateOne(
                                { _id: campaignId, 'recipients.email': recipient.email },
                                {
                                    $set: {
                                        'recipients.$.nextFollowUpAt': nextDate,
                                        'recipients.$.sequenceStatus': 'active',
                                        'recipients.$.currentStep': 0,
                                    }
                                }
                            );
                        }
                    }

                    // Check if all recipients are processed — mark campaign completed
                    const updatedCampaign = await Campaign.findById(campaignId);
                    if (updatedCampaign) {
                        const pendingCount = updatedCampaign.recipients.filter(r => r.status === 'pending').length;
                        if (pendingCount === 0 && updatedCampaign.followUps.length === 0) {
                            updatedCampaign.status = 'completed';
                            await updatedCampaign.save();
                            console.log(`✅ Campaign "${updatedCampaign.name}" completed`);
                        }
                    }
                } else {
                    await Campaign.findByIdAndUpdate(campaignId, {
                        $inc: { 'stats.failed': 1 },
                    });
                }

                return result;
            });

            emailQueue.on('completed', (job, result) => {
                console.log(`✓ Email job ${job.id} completed:`, result?.success ? 'sent' : 'skipped');
            });

            emailQueue.on('failed', (job, err) => {
                console.error(`✗ Email job ${job.id} failed:`, err.message);
            });

            console.log('✓ Email queue initialized');
        });

        return emailQueue;
    } catch (error) {
        console.warn('⚠ Queue initialization failed:', error.message);
        return null;
    }
};

export const enqueueCampaign = async (campaign) => {
    if (!emailQueue) {
        throw new Error('Queue not available. Is Redis running?');
    }

    const delay = (campaign.delay || 5) * 1000;

    for (let i = 0; i < campaign.recipients.length; i++) {
        const recipient = campaign.recipients[i];
        if (recipient.status !== 'pending') continue;

        await emailQueue.add(
            {
                campaignId: campaign._id,
                recipient: {
                    contactId: recipient.contactId,
                    email: recipient.email,
                    name: recipient.name,
                    company: recipient.company,
                    customFields: recipient.customFields,
                },
                userId: campaign.userId,
                accountIds: campaign.accountIds,
                subject: campaign.subject,
                htmlBody: campaign.htmlBody,
                plainBody: campaign.plainBody,
                cc: campaign.cc,
                bcc: campaign.bcc,
                attachments: campaign.attachments,
            },
            { delay: i * delay }
        );
    }

    campaign.status = 'running';
    campaign.stats.total = campaign.recipients.length;
    await campaign.save();
};

export const pauseQueue = async () => {
    if (emailQueue) await emailQueue.pause();
};

export const resumeQueue = async () => {
    if (emailQueue) await emailQueue.resume();
};

export const getQueueStats = async () => {
    if (!emailQueue) return null;
    const [waiting, active, completed, failed, delayed] = await Promise.all([
        emailQueue.getWaitingCount(),
        emailQueue.getActiveCount(),
        emailQueue.getCompletedCount(),
        emailQueue.getFailedCount(),
        emailQueue.getDelayedCount(),
    ]);
    return { waiting, active, completed, failed, delayed };
};

export { emailQueue };

