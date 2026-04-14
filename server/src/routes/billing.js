import { Router } from 'express';
import Stripe from 'stripe';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import EmailLog from '../models/EmailLog.js';
import Contact from '../models/Contact.js';
import GmailAccount from '../models/GmailAccount.js';
import env from '../config/env.js';
import { PLAN_LIMITS } from '../middleware/planLimits.js';
import authorize from '../middleware/authorize.js';

const router = Router();

const getStripe = () => {
    if (!env.STRIPE_SECRET_KEY) return null;
    return new Stripe(env.STRIPE_SECRET_KEY);
};

const PRICE_MAP = {
    starter: () => env.STRIPE_PRICE_STARTER,
    growth: () => env.STRIPE_PRICE_GROWTH,
    pro: () => env.STRIPE_PRICE_PRO,
};

// Get billing status + plan info
router.get('/status', auth, authorize('admin', 'manager', 'user'), async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('plan stripeCustomerId stripeSubscriptionId planExpiresAt').lean();
        if (!user) return res.status(404).json({ error: 'User not found' });

        const limits = PLAN_LIMITS[user.plan || 'free'] || PLAN_LIMITS.free;

        // Get current daily usage
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const emailsSentToday = await EmailLog.countDocuments({
            userId: req.user.id,
            sentAt: { $gte: today },
            status: 'sent',
        });

        const totalContacts = await Contact.countDocuments({ userId: req.user.id });

        const totalAccounts = await GmailAccount.countDocuments({ userId: req.user.id });

        res.json({
            plan: user.plan || 'free',
            planExpiresAt: user.planExpiresAt,
            hasSubscription: !!user.stripeSubscriptionId,
            limits,
            usage: {
                emailsSentToday,
                totalContacts,
                totalAccounts,
            },
        });
    } catch (error) {
        console.error('Billing status error:', error);
        res.status(500).json({ error: 'Failed to fetch billing status' });
    }
});

// Create Stripe Checkout session
router.post('/create-checkout', auth, authorize('admin', 'manager', 'user'), async (req, res) => {
    try {
        const stripe = getStripe();
        if (!stripe) return res.status(500).json({ error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to your .env file.' });

        const { plan } = req.body;
        if (!plan || !PRICE_MAP[plan]) {
            return res.status(400).json({ error: 'Invalid plan. Choose: starter, growth, or pro.' });
        }

        const priceId = PRICE_MAP[plan]();
        if (!priceId) return res.status(500).json({ error: `Stripe price ID for "${plan}" not configured.` });

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Create or retrieve Stripe customer
        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name,
                metadata: { userId: user._id.toString() },
            });
            customerId = customer.id;
            user.stripeCustomerId = customerId;
            await user.save();
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${env.APP_URL}/billing?success=true&plan=${plan}`,
            cancel_url: `${env.APP_URL}/billing?cancelled=true`,
            metadata: { userId: user._id.toString(), plan },
            subscription_data: { metadata: { userId: user._id.toString(), plan } },
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

// Create Stripe Customer Portal session
router.post('/create-portal', auth, authorize('admin', 'manager', 'user'), async (req, res) => {
    try {
        const stripe = getStripe();
        if (!stripe) return res.status(500).json({ error: 'Stripe is not configured.' });

        const user = await User.findById(req.user.id);
        if (!user?.stripeCustomerId) {
            return res.status(400).json({ error: 'No billing account found. Subscribe to a plan first.' });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${env.APP_URL}/billing`,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Portal error:', error);
        res.status(500).json({ error: 'Failed to open billing portal' });
    }
});

// Get all available plans (public info)
router.get('/plans', async (req, res) => {
    res.json({
        plans: [
            { id: 'free', name: 'Free', price: 0, ...PLAN_LIMITS.free },
            { id: 'starter', name: 'Starter', price: 37, ...PLAN_LIMITS.starter },
            { id: 'growth', name: 'Growth', price: 74, ...PLAN_LIMITS.growth },
            { id: 'pro', name: 'Pro', price: 124, ...PLAN_LIMITS.pro },
        ],
    });
});

export default router;
