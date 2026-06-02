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

        // Admin Override: If user is in ADMIN_EMAILS, force role to admin, plan to unlimited, and auto-verify
        const adminEmails = (env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
        if (adminEmails.includes(user.email.toLowerCase())) {
            user.role = 'admin';
            user.plan = 'unlimited';
            user.isVerified = true; // BUG FIX: Auto-verify admins so they don't get locked out during sign-in
        }

        // NOTE: Email verification is encouraged via UI but not enforced as an API blocker.
        // Forcing 403 on all routes for unverified users makes the app unusable after signup.
        // Admins are auto-verified above via the ADMIN_EMAILS check.

        req.user = user;

        // BUG FIX #17: Sliding JWT — silently renew token if it expires within 3 days (72 hours)
        // This prevents active users from being unexpectedly logged out
        const expiresAt = decoded.exp * 1000; // convert to ms
        const seventyTwoHours = 72 * 60 * 60 * 1000;
        if (expiresAt - Date.now() < seventyTwoHours) {
            try {
                const newToken = jwt.sign(
                    { id: user._id, email: user.email, role: user.role },
                    env.JWT_SECRET,
                    { expiresIn: env.JWT_EXPIRES_IN || '7d' }
                );
                res.setHeader('X-Renewed-Token', newToken);
            } catch { /* non-critical, don't block the request */ }
        }

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
};

export default auth;
