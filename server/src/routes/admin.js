import { Router } from 'express';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import authorize from '../middleware/rbac.js';
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

        const users = await User.find({})
            .select('-__v -verificationToken -resetPasswordToken -resetPasswordExpires')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit);

        const total = await User.countDocuments();

        res.json({ success: true, users, total, page: parseInt(page), pages: Math.ceil(total / safeLimit) });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

export default router;
