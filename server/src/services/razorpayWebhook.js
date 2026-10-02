import crypto from 'crypto';
import User from '../models/User.js';
import env from '../config/env.js';

export const handleRazorpayWebhook = async (req, res) => {
    try {
        const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET || '';
        if (!webhookSecret) return res.status(400).send('Webhook secret not configured');
        const signature = req.headers['x-razorpay-signature'] || '';
        
        // Verify signature using the raw body Buffer
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(req.body)
            .digest('hex');

        // SECURITY FIX [CRITICAL-5]: Use timing-safe comparison
        const sigBuf = Buffer.from(signature, 'hex');
        const expBuf = Buffer.from(expectedSignature, 'hex');
        if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
            return res.status(400).send('Invalid signature');
        }

        // Parse the event from the raw Buffer
        const event = JSON.parse(req.body.toString('utf8'));
        const eventType = event.event;
        const payload = event.payload;

        if (eventType === 'subscription.charged' || eventType === 'subscription.activated') {
            const subscriptionId = payload.subscription.entity.id;
            const currentEnd = payload.subscription.entity.current_end;
            const notes = payload.subscription.entity.notes || {};
            const userId = notes.userId;
            const plan = notes.plan || 'starter';
            
            if (userId) {
                await User.findByIdAndUpdate(userId, { 
                    plan,
                    razorpaySubscriptionId: subscriptionId,
                    planExpiresAt: new Date(currentEnd * 1000) 
                });
            } else {
                await User.findOneAndUpdate(
                    { razorpaySubscriptionId: subscriptionId },
                    { planExpiresAt: new Date(currentEnd * 1000) }
                );
            }
        } else if (eventType === 'subscription.cancelled' || eventType === 'subscription.halted') {
            const subscriptionId = payload.subscription.entity.id;
            
            await User.findOneAndUpdate(
                { razorpaySubscriptionId: subscriptionId },
                { 
                    plan: 'free',
                    razorpaySubscriptionId: '',
                    planExpiresAt: null
                }
            );
        }

        res.json({ received: true });
    } catch (err) {
        console.error('Razorpay Webhook Error:', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
};
