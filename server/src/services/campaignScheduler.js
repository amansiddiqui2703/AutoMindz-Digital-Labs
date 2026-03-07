import cron from 'node-cron';
import Campaign from '../models/Campaign.js';
import { enqueueCampaign } from './queue.js';

/**
 * Campaign scheduler — auto-launches scheduled campaigns and handles warmup re-enqueue.
 * Runs every minute.
 */
const runCampaignScheduler = async () => {
    try {
        const now = new Date();

        // 1. Launch scheduled campaigns whose time has arrived
        const scheduledCampaigns = await Campaign.find({
            status: 'scheduled',
            scheduledAt: { $lte: now },
        });

        for (const campaign of scheduledCampaigns) {
            try {
                console.log(`🚀 Auto-launching scheduled campaign: "${campaign.name}"`);
                await enqueueCampaign(campaign);
            } catch (error) {
                console.error(`✗ Failed to launch scheduled campaign "${campaign.name}":`, error.message);
                // Don't crash the scheduler — continue with other campaigns
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

    // Run once on startup
    setTimeout(() => runCampaignScheduler(), 3000);
};
