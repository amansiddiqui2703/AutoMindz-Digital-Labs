import cron from 'node-cron';
import Campaign from '../models/Campaign.js';
import { enqueueCampaign, isCampaignEnqueued } from './queue.js';
import logger from '../utils/logger.js';

/**
 * Recover eligible interrupted campaigns after a server restart.
 * 
 * Reliability & Idempotency Guarantees:
 * 1. Persistent Source of Truth: Uses MongoDB Campaign records.
 * 2. Idempotency: Only recipients with status: 'pending' and not in EmailLog are enqueued.
 * 3. Atomic Updates: Prevents duplicate execution via concurrency guards.
 * 4. Respects Campaign State: Skips paused, archived, and completed campaigns.
 * 5. Provider Confirmation: Never marks emails as sent until provider confirms success.
 */
export const recoverInterruptedCampaigns = async () => {
    try {
        logger.info('🔍 Checking for interrupted running campaigns to recover...');

        // Find campaigns that were marked 'running' before restart with pending recipients
        const runningCampaigns = await Campaign.find({
            status: 'running',
            isArchived: { $ne: true },
            'recipients.status': 'pending',
        });

        if (runningCampaigns.length === 0) {
            logger.info('✓ No interrupted running campaigns found');
            return 0;
        }

        let recoveredCount = 0;
        for (const campaign of runningCampaigns) {
            const campaignIdStr = campaign._id.toString();

            // Prevent duplicate recovery if already enqueued
            if (isCampaignEnqueued(campaignIdStr)) {
                logger.info(`Campaign "${campaign.name}" (${campaignIdStr}) already being processed — skipping`);
                continue;
            }

            const pendingCount = campaign.recipients.filter(r => r.status === 'pending').length;

            if (pendingCount === 0) {
                // If no recipients are pending and no follow-ups are configured, finalize campaign
                if (!campaign.followUps || campaign.followUps.length === 0) {
                    await Campaign.updateOne(
                        { _id: campaign._id, status: 'running' },
                        { $set: { status: 'completed' } }
                    );
                    logger.info(`✅ Campaign "${campaign.name}" had no pending recipients; auto-completed during recovery`);
                }
                continue;
            }

            try {
                console.log(`🔄 Auto-recovering interrupted campaign: "${campaign.name}" (${pendingCount} pending emails)`);
                await enqueueCampaign(campaign);
                recoveredCount++;
            } catch (err) {
                logger.error(`✗ Failed to recover campaign "${campaign.name}":`, err.message);
            }
        }

        logger.info(`✓ Campaign restart recovery completed (${recoveredCount} campaign(s) recovered)`);
        return recoveredCount;
    } catch (error) {
        logger.error('✗ Campaign restart recovery error:', error.message);
        return 0;
    }
};

/**
 * Campaign scheduler — auto-launches scheduled campaigns and handles warmup re-enqueue.
 * Runs every minute.
 */
export const runCampaignScheduler = async () => {
    try {
        const now = new Date();

        // 1. Launch scheduled campaigns whose time has arrived
        const scheduledCampaigns = await Campaign.find({
            status: 'scheduled',
            scheduledAt: { $lte: now },
        });

        for (const item of scheduledCampaigns) {
            try {
                // Atomic status transition to 'running' to prevent duplicate execution across ticks/instances
                const campaign = await Campaign.findOneAndUpdate(
                    { _id: item._id, status: 'scheduled' },
                    { $set: { status: 'running' } },
                    { new: true }
                );

                if (!campaign) {
                    // Another scheduler tick or instance claimed this campaign
                    continue;
                }

                console.log(`🚀 Auto-launching scheduled campaign: "${campaign.name}"`);
                await enqueueCampaign(campaign);
            } catch (error) {
                console.error(`✗ Failed to launch scheduled campaign "${item.name}":`, error.message);
                // Revert status to scheduled if enqueue failed so it can be retried on next tick
                await Campaign.updateOne(
                    { _id: item._id, status: 'running' },
                    { $set: { status: 'scheduled' } }
                );
            }
        }

        // 2. Warmup mode: re-enqueue daily batch for running warmup campaigns
        //    Only runs at the start of each day (check if it's the first minute of the hour between 8-9am)
        const hour = now.getHours();
        const minute = now.getMinutes();
        if (hour === 8 && minute === 0) {
            const warmupCampaigns = await Campaign.find({
                status: 'running',
                warmupMode: true,
                'recipients.status': 'pending',
            });

            for (const campaign of warmupCampaigns) {
                const pendingCount = campaign.recipients.filter(r => r.status === 'pending').length;
                if (pendingCount === 0) continue;

                try {
                    console.log(`🔥 Warmup re-enqueue for "${campaign.name}" (${pendingCount} pending)`);
                    await enqueueCampaign(campaign);
                } catch (error) {
                    console.error(`✗ Warmup re-enqueue failed for "${campaign.name}":`, error.message);
                }
            }
        }
    } catch (error) {
        console.error('✗ Campaign scheduler error:', error.message);
    }
};

export const startCampaignScheduler = () => {
    // Check every minute for scheduled campaigns
    cron.schedule('* * * * *', () => {
        runCampaignScheduler();
    });

    console.log('✓ Campaign scheduler started (checks every minute)');

    // On startup: First run restart recovery for interrupted campaigns, then launch scheduled
    setTimeout(async () => {
        await recoverInterruptedCampaigns();
        await runCampaignScheduler();
    }, 2500);
};
