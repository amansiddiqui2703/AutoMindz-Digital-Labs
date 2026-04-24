import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import { google } from 'googleapis';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import env from '../config/env.js';
import { sendPasswordResetEmail, sendVerificationEmail, sendWelcomeEmail } from '../services/mailer.js';
import { getRedis } from '../config/redis.js';

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
            if (existingUser.googleId && !existingUser.password) {
                return res.status(400).json({ error: 'This email is linked to Google sign-in. Please continue with Google.' });
            }
            if (!existingUser.isVerified) {
                return res.status(409).json({ error: 'Email already registered but not verified. Please verify your email or resend the verification link.' });
            }
            return res.status(400).json({ error: 'Email already registered' });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Assign 'admin' role to emails listed in ADMIN_EMAILS env var
        const adminEmails = (env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
        const role = adminEmails.includes(email.toLowerCase()) ? 'admin' : 'user';

        const user = new User({ email, password, name, verificationToken, role });
        await user.save();

        const verifyUrl = `${env.APP_URL}/verify/${verificationToken}`;
        await sendVerificationEmail(user.email, user.name, verifyUrl);

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
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // If account was created via Google OAuth only, email/password login won't work.
        if (user.googleId && !user.password) {
            return res.status(403).json({ error: 'This account uses Google sign-in. Please continue with Google.' });
        }

        if (!(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // SECURITY FIX [HIGH-1]: Block login if unverified
        if (!user.isVerified) {
            return res.status(403).json({ error: 'Please verify your email before logging in.' });
        }

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

// Resend Email Verification Link
router.post('/resend-verification', authLimiter, [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    validate,
], async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });

        // Avoid account enumeration â€” always return a generic success message.
        if (!user) {
            return res.json({ success: true, message: 'If this account exists, a verification email has been sent.' });
        }

        if (user.isVerified) {
            return res.json({ success: true, message: 'Email already verified. Please log in.' });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.verificationToken = verificationToken;
        await user.save();

        const verifyUrl = `${env.APP_URL}/verify/${verificationToken}`;
        await sendVerificationEmail(user.email, user.name, verifyUrl);

        const payload = { success: true, message: 'Verification email sent. Please check your inbox.' };
        // In dev (no email provider), return the URL so the UI can show it.
        if (env.NODE_ENV !== 'production' && !process.env.RESEND_API_KEY) {
            payload.verifyUrl = verifyUrl;
        }

        res.json(payload);
    } catch (err) {
        res.status(500).json({ error: 'Failed to resend verification email' });
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
        await sendPasswordResetEmail(user.email, user.name, resetUrl);

        const payload = { success: true, message: 'If this account exists, an email has been sent.' };
        if (env.NODE_ENV !== 'production' && !process.env.RESEND_API_KEY) {
            payload.resetUrl = resetUrl;
        }

        res.json(payload);
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
router.get('/google/url', async (req, res) => {
    try {
        if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
            return res.status(500).json({ error: 'Google OAuth not configured' });
        }
        
        // SECURITY FIX [HIGH-2]: Prevent CSRF with state parameter
        const state = crypto.randomBytes(16).toString('hex');
        const redis = getRedis();
        if (redis) {
            await redis.set(`oauth_state:${state}`, '1', 'EX', 300);
        }

        const oauth2Client = createLoginOAuth2Client();
        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            state, // SECURITY FIX [HIGH-2]
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
        const { code, state } = req.query;
        if (!code) return res.redirect(`${env.APP_URL}/login?error=missing_code`);

        // SECURITY FIX [HIGH-2]: Validate state parameter
        const redis = getRedis();
        if (redis) {
            const valid = await redis.get(`oauth_state:${state}`);
            if (!valid) {
                console.warn('Invalid OAuth state received');
                return res.redirect(`${env.APP_URL}/login?error=invalid_state`);
            }
            await redis.del(`oauth_state:${state}`);
        }

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
            
            // Send welcome email because this is a brand new Google registration
            await sendWelcomeEmail(user.email, user.name);
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            env.JWT_SECRET,
            { expiresIn: env.JWT_EXPIRES_IN }
        );

        // SECURITY FIX [CRITICAL-2]: One-time code exchange instead of token in URL
        const authCode = crypto.randomBytes(32).toString('hex');
        if (redis) {
            await redis.set(`google_auth_code:${authCode}`, token, 'EX', 30);
            res.redirect(`${env.APP_URL}/auth/google/success?code=${authCode}`);
        } else {
            // Fallback if Redis is down (less secure but keeps app working)
            res.redirect(`${env.APP_URL}/auth/google/success?token=${token}`);
        }
    } catch (error) {
        console.error('Google callback error:', error);
        res.redirect(`${env.APP_URL}/login?error=google_auth_failed`);
    }
});

// Step 3: Exchange short-lived code for JWT
router.get('/google/token', async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) return res.status(400).json({ error: 'Code is required' });

        const redis = getRedis();
        if (!redis) return res.status(503).json({ error: 'Service Unavailable' });

        const token = await redis.get(`google_auth_code:${code}`);
        if (!token) return res.status(401).json({ error: 'Invalid or expired code' });

        await redis.del(`google_auth_code:${code}`);
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
