import TrackingEvent from '../models/TrackingEvent.js';
import EmailLog from '../models/EmailLog.js';
import Campaign from '../models/Campaign.js';
import Suppression from '../models/Suppression.js';
import sse from './sse.js';

export const recordOpen = async (trackingId, ip, userAgent) => {
    // BUG-15: Prevent duplicate open tracking
    const existing = await TrackingEvent.findOne({ trackingId, type: 'open' });
    if (existing) return; // Already tracked

    const event = new TrackingEvent({ trackingId, type: 'open', ip, userAgent });
    await event.save();

    const emailLog = await EmailLog.findOne({ trackingId }).populate('contactId');
    if (emailLog) {
        await Campaign.findByIdAndUpdate(emailLog.campaignId, {
            $inc: { 'stats.opened': 1 },
        });
        
        // Push notification and analytics update to the dashboard
        sse.sendEventToUser(emailLog.userId, 'notification', {
           title: 'Email Opened',
           message: `${emailLog.contactId?.name || emailLog.to} just read your email!`,
           icon: 'MailOpen'
        });
        sse.sendEventToUser(emailLog.userId, 'analytics_update', { event: 'open' });
    }
};

export const recordClick = async (trackingId, url, ip, userAgent) => {
    // BUG-15: Prevent duplicate click tracking
    const existing = await TrackingEvent.findOne({ trackingId, type: 'click' });
    if (existing) return; // Already tracked

    const event = new TrackingEvent({ trackingId, type: 'click', url, ip, userAgent });
    await event.save();

    const emailLog = await EmailLog.findOne({ trackingId }).populate('contactId');
    if (emailLog) {
        await Campaign.findByIdAndUpdate(emailLog.campaignId, {
            $inc: { 'stats.clicked': 1 },
        });

        // Broadcast analytics and precise click notification
        sse.sendEventToUser(emailLog.userId, 'notification', {
           title: 'Link Clicked',
           message: `${emailLog.contactId?.name || emailLog.to} clicked a link.`,
           icon: 'MousePointerClick'
        });
        sse.sendEventToUser(emailLog.userId, 'analytics_update', { event: 'click' });
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
        
        sse.sendEventToUser(emailLog.userId, 'analytics_update', { event: 'bounce' });
    }
};
