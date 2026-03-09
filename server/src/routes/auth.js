import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import env from '../config/env.js';
import { sendAuthEmail } from '../services/mailer.js';

const router = Router();

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

        const user = new User({ email, password, name, verificationToken });
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
        if (!user) return res.status(404).json({ error: 'If this account exists, an email has been sent.' });

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

export default router;
