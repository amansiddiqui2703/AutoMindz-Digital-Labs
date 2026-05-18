import { Router } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import EmailLog from '../models/EmailLog.js';
import Contact from '../models/Contact.js';
import GmailAccount from '../models/GmailAccount.js';
import env from '../config/env.js';
import { PLAN_LIMITS } from '../middleware/planLimits.js';
import authorize from '../middleware/authorize.js';

const router = Router();

const getRazorpay = () => {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) return null;
    return new Razorpay({
        key_id: env.RAZORPAY_KEY_ID,
        key_secret: env.RAZORPAY_KEY_SECRET,
    });
};

const PLAN_MAP = {
    starter: () => env.RAZORPAY_PLAN_STARTER,
    growth: () => env.RAZORPAY_PLAN_GROWTH,
    pro: () => env.RAZORPAY_PLAN_PRO,
};

// Get billing status + plan info
router.get('/status', auth, authorize('admin', 'manager', 'user'), async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('plan razorpayCustomerId razorpaySubscriptionId planExpiresAt').lean();
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
            hasSubscription: !!user.razorpaySubscriptionId,
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

// Create Razorpay Subscription
router.post('/create-subscription', auth, authorize('admin', 'manager', 'user'), async (req, res) => {
    try {
        const rzp = getRazorpay();
        if (!rzp) return res.status(500).json({ error: 'Razorpay is not configured. Add RAZORPAY_KEY_ID to your .env file.' });

        const { plan } = req.body;
        if (!plan || !PLAN_MAP[plan]) {
            return res.status(400).json({ error: 'Invalid plan. Choose: starter, growth, or pro.' });
        }

        const planId = PLAN_MAP[plan]();
        if (!planId) return res.status(500).json({ error: `Razorpay plan ID for "${plan}" not configured.` });

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Create or retrieve Razorpay customer
        let customerId = user.razorpayCustomerId;
        if (!customerId) {
            const customer = await rzp.customers.create({
                name: user.name,
                email: user.email,
                notes: { userId: user._id.toString() },
            });
            customerId = customer.id;
            user.razorpayCustomerId = customerId;
            await user.save();
        }

        // Create subscription
        const subscription = await rzp.subscriptions.create({
            plan_id: planId,
            customer_notify: 1,
            total_count: 120, // max 10 years
            notes: { userId: user._id.toString(), plan },
        });

        res.json({ 
            subscriptionId: subscription.id,
            keyId: env.RAZORPAY_KEY_ID,
            name: user.name,
            email: user.email,
            contact: ''
        });
    } catch (error) {
        console.error('Subscription creation error:', error);
        res.status(500).json({ error: 'Failed to create subscription' });
    }
});

// Cancel Razorpay Subscription
router.post('/cancel-subscription', auth, authorize('admin', 'manager', 'user'), async (req, res) => {
    try {
        const rzp = getRazorpay();
        if (!rzp) return res.status(500).json({ error: 'Razorpay is not configured.' });

        const user = await User.findById(req.user.id);
        if (!user?.razorpaySubscriptionId) {
            return res.status(400).json({ error: 'No active subscription found.' });
        }

        await rzp.subscriptions.cancel(user.razorpaySubscriptionId);
        
        user.plan = 'free';
        user.razorpaySubscriptionId = '';
        user.planExpiresAt = null;
        await user.save();

        res.json({ message: 'Subscription cancelled successfully' });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({ error: 'Failed to cancel subscription' });
    }
});

// Verify Payment
router.post('/verify-payment', auth, authorize('admin', 'manager', 'user'), async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;
        
        if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
            return res.status(400).json({ error: 'Missing payment details' });
        }

        const generatedSignature = crypto
            .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ error: 'Invalid signature. Payment verification failed.' });
        }

        const user = await User.findById(req.user.id);
        
        // Fetch subscription from Razorpay to get the plan notes
        const rzp = getRazorpay();
        const sub = await rzp.subscriptions.fetch(razorpay_subscription_id);
        const plan = sub.notes?.plan || 'starter';

        user.plan = plan;
        user.razorpaySubscriptionId = razorpay_subscription_id;
        user.planExpiresAt = new Date(sub.current_end * 1000);
        await user.save();

        res.json({ success: true, message: 'Payment verified and plan activated' });
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
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

// Create Order for standard checkout
router.post('/create-order', auth, authorize('admin', 'manager', 'user'), async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt = `rcpt_${Date.now()}` } = req.body;
        
        if (!amount || amount < 100) {
            return res.status(400).json({ error: 'Amount is required and must be at least 100 paise' });
        }
        
        const rzp = getRazorpay();
        if (!rzp) return res.status(500).json({ error: 'Razorpay is not configured.' });

        const options = {
            amount, // in paise
            currency,
            receipt
        };

        const order = await rzp.orders.create(options);
        res.json({
            order_id: order.id,
            amount: order.amount,
            currency: order.currency
        });
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Verify Order Payment
router.post('/verify-order-payment', auth, authorize('admin', 'manager', 'user'), async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        
        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return res.status(400).json({ error: 'Missing payment details' });
        }

        const generatedSignature = crypto
            .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ error: 'Invalid signature. Payment verification failed.' });
        }

        res.json({ success: true, message: 'Payment verified successfully' });
    } catch (error) {
        console.error('Order payment verification error:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
});

export default router;
