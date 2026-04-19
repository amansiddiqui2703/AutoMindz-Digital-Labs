import Stripe from 'stripe';
import User from '../models/User.js';
import env from '../config/env.js';

/**
 * Handle Stripe webhook events.
 * Call this from the webhook route handler.
 */
export async function handleStripeWebhook(req, res) {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = session.metadata?.userId;
                const plan = session.metadata?.plan;
                if (userId && plan) {
                    await User.findByIdAndUpdate(userId, {
                        plan,
                        stripeSubscriptionId: session.subscription,
                        stripeCustomerId: session.customer,
                        planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    });
                    console.log(`✅ User ${userId} upgraded to ${plan}`);
                } else {
                    // BUG FIX [BUG-3]: Log silent skips
                    console.error('Stripe webhook: missing userId or plan in checkout metadata', { sessionId: session.id });
                }
                break;
            }

            case 'invoice.paid': {
                const invoice = event.data.object;
                const subId = invoice.subscription;
                if (subId) {
                    const sub = await stripe.subscriptions.retrieve(subId);
                    const userId = sub.metadata?.userId;
                    const plan = sub.metadata?.plan;
                    if (userId) {
                        await User.findByIdAndUpdate(userId, {
                            plan: plan || 'starter',
                            planExpiresAt: new Date(sub.current_period_end * 1000),
                        });
                    } else {
                        // BUG FIX [BUG-3]: Log silent skips
                        console.error('Stripe webhook: missing userId in subscription metadata for invoice.paid', { subId });
                    }
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const sub = event.data.object;
                const userId = sub.metadata?.userId;
                if (userId) {
                    await User.findByIdAndUpdate(userId, {
                        plan: 'free',
                        stripeSubscriptionId: '',
                        planExpiresAt: null,
                    });
                    console.log(`⬇ User ${userId} downgraded to free (subscription cancelled)`);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const sub = event.data.object;
                const userId = sub.metadata?.userId;
                if (userId) {
                    const plan = sub.metadata?.plan || 'starter';
                    await User.findByIdAndUpdate(userId, {
                        plan,
                        planExpiresAt: new Date(sub.current_period_end * 1000),
                    });
                }
                break;
            }
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook handler error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
}
