import TrackingEvent from '../models/TrackingEvent.js';
import EmailLog from '../models/EmailLog.js';
import Campaign from '../models/Campaign.js';
import Suppression from '../models/Suppression.js';

export const recordOpen = async (trackingId, ip, userAgent) => {
    // BUG-15: Prevent duplicate open tracking
    const existing = await TrackingEvent.findOne({ trackingId, type: 'open' });
    if (existing) return; // Already tracked

    const event = new TrackingEvent({ trackingId, type: 'open', ip, userAgent });
    await event.save();

    const emailLog = await EmailLog.findOne({ trackingId });
    if (emailLog) {
        await Campaign.findByIdAndUpdate(emailLog.campaignId, {
            $inc: { 'stats.opened': 1 },
        });
    }
};

export const recordClick = async (trackingId, url, ip, userAgent) => {
    // BUG-15: Prevent duplicate click tracking
    const existing = await TrackingEvent.findOne({ trackingId, type: 'click' });
    if (existing) return; // Already tracked

    const event = new TrackingEvent({ trackingId, type: 'click', url, ip, userAgent });
    await event.save();

    const emailLog = await EmailLog.findOne({ trackingId });
    if (emailLog) {
        await Campaign.findByIdAndUpdate(emailLog.campaignId, {
            $inc: { 'stats.clicked': 1 },
        });
    }
};

export const recordUnsubscribe = async (trackingId) => {
    const event = new TrackingEvent({ trackingId, type: 'unsubscribe' });
    await event.save();

    const emailLog = await EmailLog.findOne({ trackingId });
    if (emailLog) {
        // Add to suppression list
        await Suppression.findOneAndUpdate(
            { userId: emailLog.userId, email: emailLog.to },
            { userId: emailLog.userId, email: emailLog.to, reason: 'unsubscribe' },
            { upsert: true }
        );

        await Campaign.findByIdAndUpdate(emailLog.campaignId, {
            $inc: { 'stats.unsubscribed': 1 },
        });
    }
};

export const recordBounce = async (trackingId) => {
    const event = new TrackingEvent({ trackingId, type: 'bounce' });
    await event.save();

    const emailLog = await EmailLog.findOne({ trackingId });
    if (emailLog) {
        emailLog.status = 'bounced';
        await emailLog.save();

        await Suppression.findOneAndUpdate(
            { userId: emailLog.userId, email: emailLog.to },
            { userId: emailLog.userId, email: emailLog.to, reason: 'bounce' },
            { upsert: true }
        );

        await Campaign.findByIdAndUpdate(emailLog.campaignId, {
            $inc: { 'stats.bounced': 1 },
        });
    }
};
