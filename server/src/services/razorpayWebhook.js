import crypto from 'crypto';
import User from '../models/User.js';
import env from '../config/env.js';

export const handleRazorpayWebhook = async (req, res) => {
    try {
        const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'];
        
        // Verify signature
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (expectedSignature !== signature) {
            return res.status(400).send('Invalid signature');
        }

        const event = req.body;
        const eventType = event.event;
        const payload = event.payload;

        if (eventType === 'subscription.charged') {
            const subscriptionId = payload.subscription.entity.id;
            const currentEnd = payload.subscription.entity.current_end;
            
            await User.findOneAndUpdate(
                { razorpaySubscriptionId: subscriptionId },
                { planExpiresAt: new Date(currentEnd * 1000) }
            );
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
