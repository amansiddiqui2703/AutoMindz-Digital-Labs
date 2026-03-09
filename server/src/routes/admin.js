import { Router } from 'express';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Middleware to check for Admin role
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied: Requires admin privileges' });
    }
};

// Apply auth and rate limiting to all admin routes
router.use(auth, apiLimiter, isAdmin);

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

// Get recent users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({})
            .select('-password -__v -verificationToken -resetPasswordToken -resetPasswordExpires')
            .sort({ createdAt: -1 })
            .limit(50);
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

export default router;
