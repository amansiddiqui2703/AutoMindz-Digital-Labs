import Queue from 'bull';
import env from '../config/env.js';
import { sendEmail } from './emailSender.js';
import { selectAccount } from './gmailScript.js';
import Campaign from '../models/Campaign.js';
import Suppression from '../models/Suppression.js';
import EmailLog from '../models/EmailLog.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { getRedis, isRedisQuotaExceeded, handleQuotaExceeded, isQuotaError } from '../config/redis.js';

let emailQueue = null;

// Dedicated High-Performance In-Memory Queue (Used when Redis is down or Upstash quota exceeded)
class InMemoryQueueManager {
    constructor() {
        this.activeCount = 0;
        this.completedCount = 0;
        this.failedCount = 0;
        this.jobs = new Map(); // jobId -> { jobData, timer, status, campaignId }
        this.jobCounter = 1;
    }

    async add(jobData, { delay = 0 } = {}) {
        const jobId = `mem_${Date.now()}_${this.jobCounter++}`;
        const campaignIdStr = jobData.campaignId?.toString();

        const jobEntry = {
            id: jobId,
            campaignId: campaignIdStr,
            jobData,
            delay,
            status: delay > 0 ? 'delayed' : 'waiting',
            timer: null,
        };

        this.jobs.set(jobId, jobEntry);

        jobEntry.timer = setTimeout(async () => {
            jobEntry.status = 'active';
            this.activeCount++;
            try {
                // Ensure campaign hasn't been paused or canceled while waiting
                if (campaignIdStr) {
                    const currentCampaign = await Campaign.findById(campaignIdStr).select('status');
                    if (currentCampaign && currentCampaign.status !== 'running') {
                        logger.info(`In-memory job skipped: Campaign ${campaignIdStr} status is ${currentCampaign.status}`);
                        return;
                    }
                }

                const result = await processEmailJob(jobData);
                this.completedCount++;
                logger.info(`✓ In-memory email job completed (${jobId})`, { sent: result?.success, email: jobData.recipient?.email });
            } catch (err) {
                this.failedCount++;
                logger.error(`❌ In-memory email job failed (${jobId}):`, err?.message || err);
            } finally {
                this.activeCount = Math.max(0, this.activeCount - 1);
                this.jobs.delete(jobId);
            }
        }, Math.max(0, delay));

        return { id: jobId };
    }

    pause(campaignId) {
        const idStr = campaignId?.toString();
        let cleared = 0;
        for (const [jobId, entry] of this.jobs.entries()) {
            if (entry.campaignId === idStr) {
                if (entry.timer) clearTimeout(entry.timer);
                this.jobs.delete(jobId);
                cleared++;
            }
        }
        if (cleared > 0) {
            logger.info(`Cleared ${cleared} pending in-memory jobs for campaign ${idStr}`);
        }
    }

    getStats() {
        let waiting = 0;
        let delayed = 0;
        for (const entry of this.jobs.values()) {
            if (entry.status === 'delayed') delayed++;
            else if (entry.status === 'waiting') waiting++;
        }
        return {
            waiting,
            active: this.activeCount,
            completed: this.completedCount,
            failed: this.failedCount,
            delayed,
        };
    }
}

export const inMemoryQueue = new InMemoryQueueManager();

// Prevent duplicate campaign enqueue if /launch is called twice rapidly
const _enqueuingCampaigns = new Set();

// Per-user in-memory lock to prevent race conditions when selecting accounts concurrently
const userLocks = new Map();
const acquireLock = async (userId) => {
    const idStr = userId.toString();
    while (userLocks.get(idStr)) {
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    userLocks.set(idStr, true);
};
const releaseLock = (userId) => {
    userLocks.delete(userId.toString());
};

export const processEmailJob = async (data) => {
    const { campaignId, recipient, userId, accountIds, subject, htmlBody, plainBody, cc, bcc, attachments, abVariant } = data;

    // Check suppression list before sending
    const suppressed = await Suppression.findOne({ userId, email: recipient.email.toLowerCase() });
    if (suppressed) {
        return { skipped: true, reason: 'suppressed', email: recipient.email };
    }

    await acquireLock(userId);
    let account;
    try {
        account = await selectAccount(userId, accountIds);
    } finally {
        releaseLock(userId);
    }
    
    if (!account) {
        logger.error(`❌ No available Gmail accounts for user ${userId} — all accounts exhausted or unhealthy`);
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
        
        await Campaign.updateOne(
            { _id: campaignId, 'recipients.email': recipient.email },
            { $set: { 'recipients.$.status': 'failed' } }
        );
    }

    return result;
};

export const initQueue = () => {
    // If Redis quota is already exceeded or in-memory mode requested, run pure in-memory
    if (isRedisQuotaExceeded() || env.USE_IN_MEMORY_QUEUE === 'true' || !env.REDIS_URL) {
        console.log('⚡ Running Email Queue in In-Memory Mode (No Redis quota used, zero limits)');
        emailQueue = null;
        return null;
    }

    try {
        const isUpstash = env.REDIS_URL.startsWith('rediss://');

        emailQueue = new Queue('emailQueue', env.REDIS_URL, {
            redis: {
                maxRetriesPerRequest: null,
                enableReadyCheck: false,
                retryStrategy: (times) => {
                    if (isRedisQuotaExceeded()) return null;
                    return Math.min(times * 1000, 15000);
                },
                reconnectOnError: (err) => {
                    if (isQuotaError(err.message)) {
                        handleQuotaExceeded(err.message);
                        return false;
                    }
                    return false;
                },
                ...(isUpstash ? { tls: { rejectUnauthorized: false } } : {}),
            },
            defaultJobOptions: {
                removeOnComplete: 50,
                removeOnFail: 200,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 10000,
                },
            },
        });

        emailQueue.on('error', (err) => {
            if (isQuotaError(err.message)) {
                handleQuotaExceeded(err.message);
                try {
                    emailQueue.close().catch(() => {});
                } catch {
                    /* ignore */
                }
                emailQueue = null;
                console.warn('⚠️ Bull Queue disabled due to Redis quota limit — seamless switch to In-Memory Queue completed.');
            } else {
                logger.warn('Email queue error', { message: err.message });
            }
        });

        // Process up to 3 emails concurrently for faster delivery
        emailQueue.process(3, async (job) => {
            return processEmailJob(job.data);
        });

        emailQueue.on('completed', (job, result) => {
            logger.info(`Email job ${job.id} completed`, { sent: result?.success, skipped: result?.skipped });
        });

        emailQueue.on('failed', (job, err) => {
            logger.error(`Email job ${job.id} failed`, err, { email: job.data?.recipient?.email });
        });

        console.log('✓ Email queue initialized with Redis');
        return emailQueue;
    } catch (error) {
        if (isQuotaError(error.message)) {
            handleQuotaExceeded(error.message);
        }
        console.warn('⚠ Redis Queue initialization bypassed, using In-Memory Queue:', error.message);
        emailQueue = null;
        return null;
    }
};

const randomDelay = (minSec = 5, maxSec = 15) => {
    return (Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec) * 1000;
};

const isWithinSendingWindow = (timezone = 'UTC') => {
    return true; // 24/7 sending enabled
};

const msUntilNextSendingWindow = (timezone = 'UTC') => {
    return 0;
};

export const enqueueCampaign = async (campaign) => {
    const campaignIdStr = campaign._id.toString();

    if (_enqueuingCampaigns.has(campaignIdStr)) {
        logger.warn(`Campaign ${campaignIdStr} is already being enqueued — ignoring duplicate call`);
        return;
    }
    _enqueuingCampaigns.add(campaignIdStr);

    try {
        await _enqueueCampaignInternal(campaign);
    } finally {
        _enqueuingCampaigns.delete(campaignIdStr);
    }
};

const _enqueueCampaignInternal = async (campaign) => {
    const hasABTest = !!campaign.subjectB;

    let userTimezone = 'UTC';
    let userPlan = 'free';
    let userSignature = '';
    try {
        const user = await User.findById(campaign.userId).select('plan settings.timezone settings.signature');
        if (user?.settings?.timezone) userTimezone = user.settings.timezone;
        if (user?.plan) userPlan = user.plan;
        if (user?.settings?.signature) userSignature = user.settings.signature;
    } catch { /* use defaults */ }

    let baseDelay = 0;
    if (!env.DISABLE_SENDING_WINDOW && !isWithinSendingWindow(userTimezone)) {
        baseDelay = msUntilNextSendingWindow(userTimezone);
        logger.info(`⏰ Outside sending window — delaying campaign start by ${Math.round(baseDelay / 60000)} minutes`);
    }

    let maxToday = campaign.dailyLimit || 200;
    if (userPlan === 'pro' && maxToday === 200) maxToday = 5000;
    if (campaign.warmupMode && campaign.warmupDailyIncrease > 0) {
        const daysSinceCreation = Math.max(1, Math.ceil((Date.now() - new Date(campaign.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
        maxToday = Math.min(maxToday, campaign.warmupDailyIncrease * daysSinceCreation);
    }

    const alreadyContacted = new Set();
    const existingLogs = await EmailLog.find(
        { campaignId: campaign._id, status: { $in: ['sent', 'queued'] } },
        { to: 1 }
    ).lean();
    existingLogs.forEach(l => alreadyContacted.add(l.to.toLowerCase()));

    let enqueued = 0;
    let cumulativeDelay = baseDelay;

    for (let i = 0; i < campaign.recipients.length; i++) {
        const recipient = campaign.recipients[i];
        if (recipient.status !== 'pending') continue;
        if (enqueued >= maxToday) break;

        if (alreadyContacted.has(recipient.email.toLowerCase())) {
            logger.info(`⏭ Skipping already-contacted: ${recipient.email}`);
            continue;
        }

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
            htmlBody: campaign.htmlBody + (userSignature ? `<p></p>${userSignature}` : ''),
            plainBody: campaign.plainBody,
            cc: campaign.cc,
            bcc: campaign.bcc,
            attachments: campaign.attachments,
            abVariant: useVariantB ? 'B' : 'A',
        };

        const thisDelay = enqueued === 0 ? baseDelay : cumulativeDelay;

        // Queue dispatch: Bull if available and healthy, otherwise In-Memory Queue
        if (emailQueue && !isRedisQuotaExceeded()) {
            try {
                await emailQueue.add(jobData, {
                    delay: thisDelay,
                    priority: 10,
                });
            } catch (err) {
                if (isQuotaError(err.message)) {
                    handleQuotaExceeded(err.message);
                    emailQueue = null;
                }
                // Seamless fallback to in-memory on error
                await inMemoryQueue.add(jobData, { delay: thisDelay });
            }
        } else {
            // High-reliability In-Memory Queue
            await inMemoryQueue.add(jobData, { delay: thisDelay });
        }

        const isPro = userPlan === 'pro' || userPlan === 'growth';
        let minD, maxD;

        if (env.DISABLE_SENDING_WINDOW) {
            minD = 0.5;
            maxD = 1;
        } else if (isPro) {
            minD = 2;
            maxD = 5;
        } else {
            minD = 2;
            maxD = 6;
        }

        cumulativeDelay += randomDelay(minD, maxD);
        enqueued++;
    }

    campaign.status = 'running';
    campaign.stats.total = campaign.recipients.length;
    await campaign.save();

    console.log(`🚀 Campaign "${campaign.name}" launched with ${enqueued} emails queued (${emailQueue ? 'Bull/Redis' : 'In-Memory'})`);
};

export const pauseQueue = async (campaignId) => {
    // 1. Pause In-Memory Queue
    inMemoryQueue.pause(campaignId);

    // 2. Pause Bull Queue if active
    if (emailQueue && !isRedisQuotaExceeded()) {
        try {
            const jobs = await emailQueue.getJobs(['waiting', 'delayed']);
            for (const job of jobs) {
                if (job.data.campaignId?.toString() === campaignId?.toString()) {
                    await job.remove();
                }
            }
        } catch {
            /* ignore */
        }
    }
};

export const resumeQueue = async (campaignId) => {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || campaign.status !== 'running') return;
    await enqueueCampaign(campaign);
};

export const getQueueStats = async () => {
    if (emailQueue && !isRedisQuotaExceeded()) {
        try {
            const [waiting, active, completed, failed, delayed] = await Promise.all([
                emailQueue.getWaitingCount(),
                emailQueue.getActiveCount(),
                emailQueue.getCompletedCount(),
                emailQueue.getFailedCount(),
                emailQueue.getDelayedCount(),
            ]);
            return { waiting, active, completed, failed, delayed };
        } catch {
            return inMemoryQueue.getStats();
        }
    }
    return inMemoryQueue.getStats();
};

export { emailQueue };
