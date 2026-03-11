import User from '../models/User.js';
import { PLAN_LIMITS } from './planLimits.js';

/**
 * AI Rate Limit Middleware
 * Tracks and enforces per-user daily AI call limits based on their plan.
 * Resets the counter automatically at the start of each new day.
 */
const aiRateLimit = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('plan planExpiresAt aiCallsToday aiCallsResetAt');
        if (!user) return res.status(401).json({ error: 'User not found' });

        // Determine effective plan (check expiry)
        let plan = user.plan || 'free';
        if (plan !== 'free' && user.planExpiresAt && new Date(user.planExpiresAt) < new Date()) {
            plan = 'free';
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

        // Increment counter
        const updateFields = { aiCallsToday: currentCalls + 1 };
        if (isNewDay) {
            updateFields.aiCallsResetAt = now;
        }
        await User.findByIdAndUpdate(req.user.id, updateFields);

        // Attach usage info to request for optional use downstream
        req.aiUsage = {
            used: currentCalls + 1,
            limit: limits.aiCallsPerDay,
            remaining: limits.aiCallsPerDay - (currentCalls + 1),
        };

        next();
    } catch (error) {
        console.error('AI rate limit middleware error:', error);
        // Don't block the request on middleware failure — just continue
        next();
    }
};

export default aiRateLimit;
