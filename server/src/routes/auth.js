import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import { google } from 'googleapis';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import env from '../config/env.js';
import { sendAuthEmail } from '../services/mailer.js';

const router = Router();

/**
 * Create a separate OAuth2 client for login (different redirect URI than Gmail connection).
 */
const createLoginOAuth2Client = () => {
    return new google.auth.OAuth2(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
        `${env.SERVER_URL}/api/auth/google/callback`
    );
};

// Validation middleware helper
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

// Register
router.post('/register', authLimiter, [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6, max: 128 }).withMessage('Password must be 6-128 characters'),
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required (max 100 chars)'),
    validate,
], async (req, res) => {
    try {
        const { email, password, name } = req.body;

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Assign 'admin' role to emails listed in ADMIN_EMAILS env var
        const adminEmails = (env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
        const role = adminEmails.includes(email.toLowerCase()) ? 'admin' : 'user';

        const user = new User({ email, password, name, verificationToken, role });
        await user.save();

        const verifyUrl = `${env.APP_URL}/verify/${verificationToken}`;
        await sendAuthEmail(
            user.email,
            'Verify your AutoMindz account',
            `<p>Hi ${user.name},</p><p>Please <a href="${verifyUrl}">click here</a> to verify your email address.</p>`
        );

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            env.JWT_SECRET,
            { expiresIn: env.JWT_EXPIRES_IN }
        );

        res.status(201).json({ user, token });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', authLimiter, [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
], async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Optional: Block login if unverified (for urgent requirement, often it's warned not fully blocked but we leave warning via UI for now)

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            env.JWT_SECRET,
            { expiresIn: env.JWT_EXPIRES_IN }
        );

        res.json({ user, token });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Verify Email
router.post('/verify/:token', async (req, res) => {
    try {
        const user = await User.findOne({ verificationToken: req.params.token });
        if (!user) return res.status(400).json({ error: 'Invalid verification token' });

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.json({ success: true, message: 'Email verified successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Verification failed' });
    }
});

// Forgot Password
router.post('/forgot-password', authLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.json({ success: true, message: 'If this account exists, an email has been sent.' });

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const resetUrl = `${env.APP_URL}/reset-password/${resetToken}`;
        await sendAuthEmail(
            user.email,
            'Reset your AutoMindz password',
            `<p>Hi ${user.name},</p><p>You requested a password reset. <a href="${resetUrl}">Click here to reset it.</a></p><p>If you didn't request this, ignore this email.</p>`
        );

        res.json({ success: true, message: 'If this account exists, an email has been sent.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to request reset' });
    }
});

// Reset Password
router.post('/reset-password/:token', authLimiter, async (req, res) => {
    try {
        const { password } = req.body;
        if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ success: true, message: 'Password reset successful' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// ─── Google OAuth Login ──────────────────────────────────────────────

// Step 1: Generate Google OAuth URL for login
router.get('/google/url', (req, res) => {
    try {
        if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
            return res.status(500).json({ error: 'Google OAuth not configured' });
        }
        const oauth2Client = createLoginOAuth2Client();
        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: [
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile',
            ],
        });
        res.json({ url });
    } catch (error) {
        console.error('Google URL error:', error);
        res.status(500).json({ error: 'Failed to generate Google login URL' });
    }
});

// Step 2: Google OAuth callback — find/create user and redirect to frontend
router.get('/google/callback', async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) return res.redirect(`${env.APP_URL}/login?error=missing_code`);

        const oauth2Client = createLoginOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Get Google user profile
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data: profile } = await oauth2.userinfo.get();

        if (!profile.email) {
            return res.redirect(`${env.APP_URL}/login?error=no_email`);
        }

        // Find existing user by googleId or email
        let user = await User.findOne({
            $or: [
                { googleId: profile.id },
                { email: profile.email.toLowerCase() }
            ]
        });

        if (user) {
            // Link Google ID if not already linked
            if (!user.googleId) {
                user.googleId = profile.id;
                await user.save();
            }
        } else {
            // Create new user (no password — Google-only)
            const adminEmails = (env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
            const role = adminEmails.includes(profile.email.toLowerCase()) ? 'admin' : 'user';

            user = new User({
                email: profile.email.toLowerCase(),
                name: profile.name || profile.email,
                googleId: profile.id,
                isVerified: true, // Google emails are pre-verified
                role,
            });
            await user.save();
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            env.JWT_SECRET,
            { expiresIn: env.JWT_EXPIRES_IN }
        );

        // Redirect to frontend with token
        res.redirect(`${env.APP_URL}/auth/google/success?token=${token}`);
    } catch (error) {
        console.error('Google callback error:', error);
        res.redirect(`${env.APP_URL}/login?error=google_auth_failed`);
    }
});

export default router;
