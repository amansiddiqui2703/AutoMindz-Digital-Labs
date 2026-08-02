import { Router } from 'express';
import User from '../models/User.js';
import EmailLog from '../models/EmailLog.js';
import auth from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import { apiLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Apply auth, rate limiting, and admin-only access to all admin routes
router.use(auth, apiLimiter, authorize('admin'));

// Get summary admin stats
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const verifiedUsers = await User.countDocuments({ isVerified: true });
        const proUsers = await User.countDocuments({ plan: 'pro' });

        res.json({
            success: true,
            totalUsers,
            verifiedUsers,
            proUsers,
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
});

// Get users (paginated)
router.get('/users', async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        // SECURITY FIX [LOW-1]: Bound query parameters for limits
        const safeLimit = Math.min(parseInt(limit) || 50, 100);
        const skip = (parseInt(page) - 1) * safeLimit;

        let users = await User.find({})
            .select('-__v -verificationToken -resetPasswordToken -resetPasswordExpires')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit)
            .lean();

        // Fetch email stats for these users
        const userIds = users.map(u => u._id);
        const emailStats = await EmailLog.aggregate([
            { $match: { userId: { $in: userIds } } },
            {
                $group: {
                    _id: "$userId",
                    totalSent: { $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] } },
                    totalDelivered: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
                    totalFailed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
                    totalBounced: { $sum: { $cond: [{ $eq: ["$status", "bounced"] }, 1, 0] } }
                }
            }
        ]);

        users = users.map(u => {
            const stats = emailStats.find(s => s._id.toString() === u._id.toString()) || { totalSent: 0, totalDelivered: 0, totalFailed: 0, totalBounced: 0 };
            return { ...u, stats };
        });

        const total = await User.countDocuments();

        res.json({ success: true, users, total, page: parseInt(page), pages: Math.ceil(total / safeLimit) });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Force-logout a specific user (invalidates all sessions)
router.post('/users/:id/force-logout', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Set forceLogoutAt to now — any JWT issued before this is rejected
        user.forceLogoutAt = new Date();
        // Clear all refresh tokens — user cannot silently refresh anymore
        user.refreshTokens = [];
        await user.save();

        res.json({ success: true, message: `User ${user.email} has been force-logged out from all sessions.` });
    } catch (err) {
        console.error('Force-logout error:', err);
        res.status(500).json({ error: 'Failed to force-logout user' });
    }
});

export default router;
