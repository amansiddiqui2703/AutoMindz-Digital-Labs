import User from '../models/User.js';

/**
 * Plan limits configuration
 */
const PLAN_LIMITS = {
    free: { emailsPerDay: 50, contacts: 200, accounts: 1, ai: false, aiCallsPerDay: 0, followUpSteps: 0 },
    starter: { emailsPerDay: 200, contacts: 2000, accounts: 2, ai: 'basic', aiCallsPerDay: 50, followUpSteps: 2 },
    growth: { emailsPerDay: 1000, contacts: 10000, accounts: 5, ai: 'full', aiCallsPerDay: 200, followUpSteps: 5 },
    pro: { emailsPerDay: 5000, contacts: 50000, accounts: 15, ai: 'full', aiCallsPerDay: 999999, followUpSteps: 999 },
};

export { PLAN_LIMITS };

/**
 * Middleware to attach plan limits to request
 */
const planLimits = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('plan planExpiresAt').lean();
        if (!user) return res.status(401).json({ error: 'User not found' });

        let plan = user.plan || 'free';

        // Check if paid plan has expired
        if (plan !== 'free' && user.planExpiresAt) {
            const expiryDate = new Date(user.planExpiresAt);
            if (!isNaN(expiryDate.getTime()) && expiryDate < new Date()) {
                plan = 'free';
                await User.findByIdAndUpdate(req.user.id, { plan: 'free' });
            }
        }

        // Admin Override
        const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
        if (adminEmails.includes(req.user.email?.toLowerCase())) {
            plan = 'pro';
        }

        req.plan = plan;
        req.planLimits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
        next();
    } catch (error) {
        console.error('Plan limits middleware error:', error);
        // SECURITY FIX [HIGH-3]: Do not bypass plan limits on DB error
        return res.status(503).json({ error: 'Service temporarily unavailable. Please try again.' });
    }
};

export default planLimits;
