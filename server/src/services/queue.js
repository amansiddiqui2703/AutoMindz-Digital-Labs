import Queue from 'bull';
import env from '../config/env.js';
import { sendEmail } from './emailSender.js';
import { selectAccount } from './gmailScript.js';
import Campaign from '../models/Campaign.js';
import Suppression from '../models/Suppression.js';

import { getRedis } from '../config/redis.js';

let emailQueue = null;

export const processEmailJob = async (data) => {
    const { campaignId, recipient, userId, accountIds, subject, htmlBody, plainBody, cc, bcc, attachments, abVariant } = data;

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
        abVariant: abVariant || 'A',
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
};

export const initQueue = () => {
    try {
        const redisInstance = getRedis();
        if (!redisInstance) {
            console.warn('⚠ Redis not available — email queue will use in-memory fallback');
            return null;
        }

        // Bull creates its own ioredis connections from the URL
        // For Upstash (rediss://), we need to pass TLS options through the redis key
        const isUpstash = env.REDIS_URL.startsWith('rediss://');

        emailQueue = new Queue('emailQueue', env.REDIS_URL, {
            redis: {
                maxRetriesPerRequest: null,
                enableReadyCheck: false,
                ...(isUpstash ? { tls: { rejectUnauthorized: false } } : {}),
            },
            defaultJobOptions: {
                removeOnComplete: 100, // Keep last 100 successful jobs
                removeOnFail: 500,     // Keep last 500 failed jobs for debugging
                attempts: 5,           // Retry 5 times
                backoff: { 
                    type: 'exponential', 
                    delay: 10000 // Start with 10s delay
                },
            },
        });

        emailQueue.on('error', (err) => {
            console.warn('⚠ Email queue error:', err.message);
        });

        emailQueue.process(async (job) => {
            return processEmailJob(job.data);
        });

        emailQueue.on('completed', (job, result) => {
            console.log(`✓ Email job ${job.id} completed:`, result?.success ? 'sent' : 'skipped');
        });

        emailQueue.on('failed', (job, err) => {
            console.error(`✗ Email job ${job.id} failed:`, err.message);
        });

        console.log('✓ Email queue initialized');
        return emailQueue;
    } catch (error) {
        console.warn('⚠ Queue initialization failed:', error.message);
        return null;
    }
};

export const enqueueCampaign = async (campaign) => {
    const delay = (campaign.delay || 5) * 1000;
    const hasABTest = !!campaign.subjectB;

    // Warmup mode: limit how many emails to send today
    let maxToday = Infinity;
    if (campaign.warmupMode && campaign.warmupDailyIncrease > 0) {
        const daysSinceCreation = Math.max(1, Math.ceil((Date.now() - new Date(campaign.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
        maxToday = campaign.warmupDailyIncrease * daysSinceCreation;
    }

    let enqueued = 0;
    const inMemoryJobs = [];
    
    for (let i = 0; i < campaign.recipients.length; i++) {
        const recipient = campaign.recipients[i];
        if (recipient.status !== 'pending') continue;
        if (enqueued >= maxToday) break;

        // A/B test: randomly pick subject B for ~50% of recipients
        const useVariantB = hasABTest && Math.random() < 0.5;
        const selectedSubject = useVariantB ? campaign.subjectB : campaign.subject;

        const jobData = {
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
            subject: selectedSubject,
            htmlBody: campaign.htmlBody,
            plainBody: campaign.plainBody,
            cc: campaign.cc,
            bcc: campaign.bcc,
            attachments: campaign.attachments,
            abVariant: useVariantB ? 'B' : 'A',
        };

        if (emailQueue) {
            await emailQueue.add(jobData, { delay: enqueued * delay });
        } else {
            inMemoryJobs.push({ jobData, delayMs: enqueued * delay });
        }
        enqueued++;
    }

    campaign.status = 'running';
    campaign.stats.total = campaign.recipients.length;
    await campaign.save();

    if (campaign.warmupMode && enqueued < campaign.recipients.filter(r => r.status === 'pending').length) {
        console.log(`🔥 Warmup mode: enqueued ${enqueued} of ${campaign.recipients.length} recipients today`);
    }

    // If Redis is not available, process jobs in-memory in the background
    if (!emailQueue && inMemoryJobs.length > 0) {
        console.warn('⚠ Redis not available — falling back to in-memory email processing');
        (async () => {
            for (const { jobData, delayMs } of inMemoryJobs) {
                try {
                    if (delayMs > 0) {
                        await new Promise(resolve => setTimeout(resolve, delayMs));
                    }
                    
                    // Allow pause: check if campaign is still running before processing
                    const checkCampaign = await Campaign.findById(campaign._id);
                    // It can be paused, completed, or failed
                    if (checkCampaign && checkCampaign.status !== 'running') {
                        console.log(`⏸️ Campaign ${campaign.name || campaign._id} paused or stopped, halting in-memory queue.`);
                        break;
                    }

                    console.log(`⏳ Processing in-memory job for ${jobData.recipient.email}`);
                    const res = await processEmailJob(jobData);
                    console.log(`✓ Email job completed in-memory:`, res?.success ? 'sent' : 'skipped');
                } catch (err) {
                    console.error(`✗ Email job failed in-memory:`, err.message);
                }
            }
        })();
    }
};

export const pauseQueue = async (campaignId) => {
    if (!emailQueue) return;
    // Remove waiting/delayed jobs for this specific campaign
    const jobs = await emailQueue.getJobs(['waiting', 'delayed']);
    for (const job of jobs) {
        if (job.data.campaignId?.toString() === campaignId?.toString()) {
            await job.remove();
        }
    }
};

export const resumeQueue = async (campaignId) => {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || campaign.status !== 'running') return;
    await enqueueCampaign(campaign);
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
