import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import User from '../models/User.js';

const auth = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const token = header.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Null token provided' });
        }

        const decoded = jwt.verify(token, env.JWT_SECRET);
        
        // Optional: Check if user still exists in DB
        const user = await User.findById(decoded.id).select('_id email role isVerified plan planExpiresAt');
        if (!user) {
            return res.status(401).json({ error: 'User no longer exists' });
        }

        if (env.NODE_ENV === 'production' && !user.isVerified) {
            return res.status(403).json({ error: 'Email verification required. Please check your email.' });
        }

        // Admin Override: If user is in ADMIN_EMAILS, force role to admin and plan to pro
        const adminEmails = (env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
        if (adminEmails.includes(user.email.toLowerCase())) {
            user.role = 'admin';
            user.plan = 'pro';
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
};

export default auth;
