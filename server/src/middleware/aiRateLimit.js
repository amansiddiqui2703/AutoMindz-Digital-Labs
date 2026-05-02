import User from '../models/User.js';
import { PLAN_LIMITS } from './planLimits.js';

/**
 * AI Rate Limit Middleware
 * Tracks and enforces per-user daily AI call limits based on their plan.
 * Uses atomic MongoDB update to prevent race conditions.
 */
const aiRateLimit = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('plan planExpiresAt aiCallsToday aiCallsResetAt');
        if (!user) return res.status(401).json({ error: 'User not found' });

        // Determine effective plan (check expiry)
        let plan = user.plan || 'free';
        if (plan !== 'free' && user.planExpiresAt) {
            const expiryDate = new Date(user.planExpiresAt);
            if (!isNaN(expiryDate.getTime()) && expiryDate < new Date()) {
                plan = 'free';
            }
        }

        // Admin Override
        const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
        if (adminEmails.includes(req.user.email?.toLowerCase())) {
            plan = 'pro';
        }

        const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

        // Check if AI is enabled for this plan
        if (!limits.ai) {
            return res.status(403).json({
                error: 'AI features are not available on your current plan. Please upgrade to Starter or above.',
                code: 'AI_NOT_AVAILABLE',
                currentPlan: plan,
            });
        }

        // Reset counter if a new day has started (past midnight UTC)
        const now = new Date();
        const resetAt = user.aiCallsResetAt ? new Date(user.aiCallsResetAt) : new Date(0);
        const isNewDay = now.toISOString().slice(0, 10) !== resetAt.toISOString().slice(0, 10);

        let currentCalls = user.aiCallsToday || 0;
        if (isNewDay) {
            currentCalls = 0;
        }

        // Check if limit exceeded
        if (currentCalls >= limits.aiCallsPerDay) {
            return res.status(429).json({
                error: `Daily AI limit reached (${limits.aiCallsPerDay} calls/day on ${plan} plan). Resets at midnight UTC.`,
                code: 'AI_LIMIT_EXCEEDED',
                currentPlan: plan,
                used: currentCalls,
                limit: limits.aiCallsPerDay,
            });
        }

        // BUG-10: Atomic increment using findOneAndUpdate
        const updateOp = isNewDay
            ? { $set: { aiCallsToday: 1, aiCallsResetAt: now } }
            : { $inc: { aiCallsToday: 1 } };

        const updated = await User.findByIdAndUpdate(req.user.id, updateOp, { new: true });
        if (!updated) return res.status(500).json({ error: 'Failed to update AI usage counter' });

        // Attach usage info to request for optional use downstream
        req.aiUsage = {
            used: currentCalls + 1,
            limit: limits.aiCallsPerDay,
            remaining: limits.aiCallsPerDay - (currentCalls + 1),
        };

        next();
    } catch (error) {
        console.error('AI rate limit middleware error:', error);
        // BUG-13: Return error on DB failure — do NOT bypass rate limiting
        return res.status(500).json({ error: 'AI rate limit check failed. Please try again.' });
    }
};

export default aiRateLimit;
