import Queue from 'bull';
import env from '../config/env.js';
import { sendEmail } from './emailSender.js';
import { selectAccount } from './gmailScript.js';
import Campaign from '../models/Campaign.js';
import Suppression from '../models/Suppression.js';
import EmailLog from '../models/EmailLog.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { getRedis } from '../config/redis.js';

let emailQueue = null;

// ISSUE 7 FIX: Prevent duplicate campaign enqueue if /launch is called twice rapidly.
// In-process guard — campaign IDs are added before enqueue, removed after.
const _enqueuingCampaigns = new Set();

// BUG-H3 FIX: Per-user in-memory lock to prevent race conditions when selecting accounts concurrently
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

    // BUG-H3 FIX: Acquire lock before selecting account to prevent concurrent quota exhaustion
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
        
        // BUG-M6 FIX: Update recipient status to failed so the campaign doesn't get stuck
        await Campaign.updateOne(
            { _id: campaignId, 'recipients.email': recipient.email },
            { $set: { 'recipients.$.status': 'failed' } }
        );
    }

    return result;
};

export const initQueue = () => {
    try {
        // Bull creates its own ioredis connections from the URL - no need to check getRedis()
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
            logger.warn('Email queue error', { message: err.message });
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

        console.log('✓ Email queue initialized');
        return emailQueue;
    } catch (error) {
        console.warn('⚠ Queue initialization failed:', error.message);
        return null;
    }
};

/**
 * Generate a random delay between min and max seconds (in milliseconds).
 * Defaults reduced to 5-15s to balance deliverability with speed.
 * Gmail rate limit is ~2000/day, not per-second, so 5s gaps are safe.
 */
const randomDelay = (minSec = 5, maxSec = 15) => {
    return (Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec) * 1000;
};

/**
 * Check if the current time is within the allowed sending window (8am-6pm)
 * in the user's configured timezone.
 */
const isWithinSendingWindow = (timezone = 'UTC') => {
    return true; // Window is now 24/7 for immediate sending
};

/**
 * Calculate milliseconds until the next 8am in the user's timezone.
 */
const msUntilNextSendingWindow = (timezone = 'UTC') => {
    return 0; // Immediate
};

export const enqueueCampaign = async (campaign) => {
    const campaignIdStr = campaign._id.toString();

    // ISSUE 7 FIX: Prevent double-enqueue if endpoint is called concurrently
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

    // Get user details for limits and timezone
    let userTimezone = 'UTC';
    let userPlan = 'free';
    try {
        const user = await User.findById(campaign.userId).select('plan settings.timezone');
        if (user?.settings?.timezone) userTimezone = user.settings.timezone;
        if (user?.plan) userPlan = user.plan;
    } catch { /* use defaults */ }

    // Time-window check: if outside sending hours, calculate base delay offset
    // Can be bypassed by setting DISABLE_SENDING_WINDOW=true in .env for testing
    let baseDelay = 0;
    if (!env.DISABLE_SENDING_WINDOW && !isWithinSendingWindow(userTimezone)) {
        baseDelay = msUntilNextSendingWindow(userTimezone);
        logger.info(`⏰ Outside sending window — delaying campaign start by ${Math.round(baseDelay / 60000)} minutes`);
    }

    // Warmup mode: limit how many emails to send today
    let maxToday = campaign.dailyLimit || 200;
    // For Pro users, if dailyLimit is default, use a higher value
    if (userPlan === 'pro' && maxToday === 200) maxToday = 5000;
    if (campaign.warmupMode && campaign.warmupDailyIncrease > 0) {
        const daysSinceCreation = Math.max(1, Math.ceil((Date.now() - new Date(campaign.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
        maxToday = Math.min(maxToday, campaign.warmupDailyIncrease * daysSinceCreation);
    }

    // Build set of already-contacted emails to skip duplicates
    const alreadyContacted = new Set();
    const existingLogs = await EmailLog.find(
        { campaignId: campaign._id, status: { $in: ['sent', 'queued'] } },
        { to: 1 }
    ).lean();
    existingLogs.forEach(l => alreadyContacted.add(l.to.toLowerCase()));

    let enqueued = 0;
    let cumulativeDelay = baseDelay;
    const inMemoryJobs = [];

    for (let i = 0; i < campaign.recipients.length; i++) {
        const recipient = campaign.recipients[i];
        if (recipient.status !== 'pending') continue;
        if (enqueued >= maxToday) break;

        // Skip already-contacted leads (deduplication)
        if (alreadyContacted.has(recipient.email.toLowerCase())) {
            logger.info(`⏭ Skipping already-contacted: ${recipient.email}`);
            continue;
        }

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

        // Random delay between 30-120 seconds per email (more human-like)
        const thisDelay = enqueued === 0 ? baseDelay : cumulativeDelay;

        if (emailQueue) {
            await emailQueue.add(jobData, {
                delay: thisDelay,
                priority: 10, // Normal priority; follow-ups use priority 5 (higher)
            });
        } else {
            inMemoryJobs.push({ jobData, delayMs: thisDelay });
        }

        const isPro = userPlan === 'pro' || userPlan === 'growth';
        let minD, maxD;

        if (env.DISABLE_SENDING_WINDOW) {
            // Test/dev mode: near-instant sending
            minD = 0.5;
            maxD = 1;
        } else if (isPro) {
            // Pro/Growth plans: fast sending (2-5s between emails)
            minD = 2;
            maxD = 5;
        } else {
            // Free/Starter plans: moderate pace (2-6s between emails)
            minD = 2;
            maxD = 6;
        }

        cumulativeDelay += randomDelay(minD, maxD);
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
        if (env.NODE_ENV === 'production') {
            logger.error('CRITICAL: Redis not available in production. In-memory fallback is disabled to prevent duplicate sends across scaled instances. Pausing campaign.');
            campaign.status = 'paused';
            await campaign.save();
            return;
        }

        logger.warn('Redis not available — falling back to in-memory email processing (DEV/TEST ONLY)');
        (async () => {
            for (const { jobData, delayMs } of inMemoryJobs) {
                try {
                    if (delayMs > 0) await new Promise(resolve => setTimeout(resolve, delayMs));
                    const checkCampaign = await Campaign.findById(campaign._id);
                    if (checkCampaign && checkCampaign.status !== 'running') {
                        logger.info(`Campaign ${campaign.name || campaign._id} no longer running — halting in-memory queue`);
                        break;
                    }
                    const res = await processEmailJob(jobData);
                    logger.info('In-memory email job', { sent: res?.success, email: jobData.recipient.email });
                } catch (err) {
                    logger.error('In-memory email job failed', err, { email: jobData?.recipient?.email });
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
