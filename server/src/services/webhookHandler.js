import crypto from 'crypto';
import EmailLog from '../models/EmailLog.js';
import TrackingEvent from '../models/TrackingEvent.js';
import Campaign from '../models/Campaign.js';
import GmailAccount from '../models/GmailAccount.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';

/**
 * Verify Resend webhook signature.
 * Returns true if valid or if no signing secret is configured (dev mode).
 */
const verifyResendSignature = (payload, signature) => {
    const secret = env.RESEND_WEBHOOK_SECRET;
    if (!secret) {
        logger.warn('RESEND_WEBHOOK_SECRET not set — skipping signature verification');
        return true;
    }
    try {
        const expected = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
        return false;
    }
};

/**
 * Handle Resend webhook events.
 * Supported events: email.sent, email.delivered, email.bounced,
 *                   email.complained, email.opened, email.clicked
 */
export const handleResendWebhook = async (req, res) => {
    try {
        const rawBody = req.body.toString('utf8');
        const signature = req.headers['resend-signature'] || req.headers['svix-signature'] || '';

        if (!verifyResendSignature(rawBody, signature)) {
            logger.warn('Invalid Resend webhook signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        const event = JSON.parse(rawBody);
        const { type, data } = event;

        if (!type || !data) {
            return res.status(400).json({ error: 'Invalid webhook payload' });
        }

        logger.info(`📨 Resend webhook: ${type}`, { emailId: data.email_id });

        // Find the EmailLog by messageId or Resend email ID
        const emailLog = await EmailLog.findOne({
            $or: [
                { messageId: data.email_id },
                { messageId: data.message_id },
                { trackingId: data.tags?.tracking_id },
            ]
        });

        if (!emailLog) {
            // Not our email — silently acknowledge
            return res.json({ received: true, matched: false });
        }

        switch (type) {
            case 'email.delivered': {
                emailLog.status = 'delivered';
                await emailLog.save();

                await TrackingEvent.create({
                    trackingId: emailLog.trackingId,
                    emailLogId: emailLog._id,
                    type: 'delivered',
                    ip: req.ip,
                });

                // Update campaign stats
                if (emailLog.campaignId) {
                    await Campaign.findByIdAndUpdate(emailLog.campaignId, {
                        $inc: { 'stats.delivered': 1 }
                    });
                }
                break;
            }

            case 'email.bounced': {
                emailLog.status = 'bounced';
                emailLog.error = data.bounce?.description || 'Bounced';
                await emailLog.save();

                await TrackingEvent.create({
                    trackingId: emailLog.trackingId,
                    emailLogId: emailLog._id,
                    type: 'bounce',
                    ip: req.ip,
                });

                // Update campaign stats
                if (emailLog.campaignId) {
                    await Campaign.findByIdAndUpdate(emailLog.campaignId, {
                        $inc: { 'stats.bounced': 1 }
                    });

                    // Update recipient status
                    await Campaign.updateOne(
                        { _id: emailLog.campaignId, 'recipients.email': emailLog.to },
                        { $set: { 'recipients.$.status': 'bounced', 'recipients.$.sequenceStatus': 'completed' } }
                    );
                }

                // Increment bounce count on the sending account
                if (emailLog.accountId) {
                    await GmailAccount.findByIdAndUpdate(emailLog.accountId, {
                        $inc: { bounceCount: 1 }
                    });
                }
                break;
            }

            case 'email.complained': {
                await TrackingEvent.create({
                    trackingId: emailLog.trackingId,
                    emailLogId: emailLog._id,
                    type: 'complained',
                    ip: req.ip,
                });

                // Mark as unsubscribed to prevent future sends
                if (emailLog.campaignId) {
                    await Campaign.updateOne(
                        { _id: emailLog.campaignId, 'recipients.email': emailLog.to },
                        { $set: { 'recipients.$.status': 'unsubscribed', 'recipients.$.sequenceStatus': 'stopped_unsubscribe' } }
                    );
                    await Campaign.findByIdAndUpdate(emailLog.campaignId, {
                        $inc: { 'stats.unsubscribed': 1 }
                    });
                }
                break;
            }

            case 'email.opened': {
                await TrackingEvent.create({
                    trackingId: emailLog.trackingId,
                    emailLogId: emailLog._id,
                    type: 'open',
                    ip: req.ip,
                    userAgent: req.headers['user-agent'],
                });

                if (emailLog.campaignId) {
                    await Campaign.findByIdAndUpdate(emailLog.campaignId, {
                        $inc: { 'stats.opened': 1 }
                    });
                    await Campaign.updateOne(
                        { _id: emailLog.campaignId, 'recipients.email': emailLog.to, 'recipients.openedAt': null },
                        { $set: { 'recipients.$.openedAt': new Date(), 'recipients.$.status': 'opened' } }
                    );
                }
                break;
            }

            case 'email.clicked': {
                await TrackingEvent.create({
                    trackingId: emailLog.trackingId,
                    emailLogId: emailLog._id,
                    type: 'click',
                    url: data.click?.link,
                    ip: req.ip,
                    userAgent: req.headers['user-agent'],
                });

                if (emailLog.campaignId) {
                    await Campaign.findByIdAndUpdate(emailLog.campaignId, {
                        $inc: { 'stats.clicked': 1 }
                    });
                }
                break;
            }

            default:
                logger.debug(`Unhandled Resend webhook event: ${type}`);
        }

        res.json({ received: true, type });
    } catch (error) {
        logger.error('Resend webhook processing error', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};
