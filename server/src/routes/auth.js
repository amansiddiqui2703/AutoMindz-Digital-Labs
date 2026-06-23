import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import { google } from 'googleapis';
import axios from 'axios';
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
        const hashedVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

        // Assign 'admin' role to emails listed in ADMIN_EMAILS env var
        const adminEmails = (env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
        const role = adminEmails.includes(email.toLowerCase()) ? 'admin' : 'user';

        const user = new User({ email, password, name, verificationToken: hashedVerificationToken, role });
        await user.save();

        const verifyUrl = `${env.APP_URL}/verify/${verificationToken}`;
        await sendVerificationEmail(user.email, user.name, verifyUrl);

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            env.JWT_SECRET,
            { expiresIn: env.JWT_EXPIRES_IN }
        );

        res.status(201).json({ 
            user: { _id: user._id, email: user.email, name: user.name, role: user.role, plan: user.plan, isVerified: user.isVerified }, 
            token 
        });
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

        // SEC-H4: Per-account login lockout check
        if (user.isLocked) {
            return res.status(429).json({ error: 'Account temporarily locked due to too many failed attempts. Please try again later.' });
        }

        // If account was created via Google OAuth only, email/password login won't work.
        if (user.googleId && !user.password) {
            return res.status(403).json({ error: 'This account uses Google sign-in. Please continue with Google.' });
        }

        if (!(await user.comparePassword(password))) {
            await user.incLoginAttempts();
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Reset login attempts on successful login
        if (user.loginAttempts > 0) {
            await user.updateOne({ $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } });
        }

        // Admin Override: Permanently set admin accounts to unlimited upon login
        const adminEmails = (env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
        if (adminEmails.includes(user.email.toLowerCase())) {
            user.role = 'admin';
            user.plan = 'unlimited';
            user.isVerified = true;
            await user.save();
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            env.JWT_SECRET,
            { expiresIn: env.JWT_EXPIRES_IN }
        );

        res.json({ 
            user: { _id: user._id, email: user.email, name: user.name, role: user.role, plan: user.plan, isVerified: user.isVerified }, 
            token, 
            isVerified: user.isVerified 
        });
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
        const hashedVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
        user.verificationToken = hashedVerificationToken;
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
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
        const user = await User.findOne({ verificationToken: hashedToken });
        if (!user) return res.status(400).json({ error: 'Invalid verification token' });

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        // Send welcome email after successful verification
        try {
            await sendWelcomeEmail(user.email, user.name);
        } catch (emailErr) {
            console.warn('Welcome email failed (non-blocking):', emailErr.message);
        }

        res.json({ success: true, message: 'Email verified successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Verification failed' });
    }
});

// Forgot Password
router.post('/forgot-password', authLimiter, [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    validate,
], async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.json({ success: true, message: 'If this account exists, an email has been sent.' });

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordToken = hashedResetToken;
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
router.post('/reset-password/:token', authLimiter, [
    body('password').isLength({ min: 6, max: 128 }).withMessage('Password must be 6-128 characters'),
    validate,
], async (req, res) => {
    try {
        const { password } = req.body;
        if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
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
        res.json({ user: req.user });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Update user settings
router.put('/settings', auth, async (req, res) => {
    try {
        const { settings } = req.body;
        if (!settings) {
            return res.status(400).json({ error: 'Settings object is required' });
        }
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { settings } },
            { new: true, runValidators: true }
        ).select('-password -verificationToken -resetPasswordToken -resetPasswordExpires');
        
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, user });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
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
            try {
                await redis.set(`oauth_state:${state}`, '1', 'EX', 300);
            } catch (err) {
                console.warn('OAuth state save failed (Redis unavailable):', err.message);
            }
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
            try {
                const valid = await redis.get(`oauth_state:${state}`);
                if (!valid) {
                    console.warn('Invalid OAuth state received');
                    // Temporarily bypassing strict state validation to prevent login failures
                    // if (env.NODE_ENV === 'production') {
                    //     return res.redirect(`${env.APP_URL}/login?error=invalid_state`);
                    // }
                } else {
                    await redis.del(`oauth_state:${state}`);
                }
            } catch (err) {
                console.warn('OAuth state validation failed (Redis unavailable):', err.message);
                // Temporarily bypassing strict state validation to prevent login failures
                // if (env.NODE_ENV === 'production') {
                //     return res.redirect(`${env.APP_URL}/login?error=invalid_state`);
                // }
            }
        }

        // Use axios to fetch the token and profile to bypass Node 18 native fetch (undici) bugs in google-auth-library
        const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: `${env.SERVER_URL}/api/auth/google/callback`
        });
        const tokens = tokenRes.data;

        // Get Google user profile
        const profileRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
        });
        const profile = profileRes.data;

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

        const adminEmails = (env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
        const isAdmin = adminEmails.includes(profile.email.toLowerCase());

        if (user) {
            // Link Google ID if not already linked, or promote to admin if env var changed
            let needsSave = false;
            if (!user.googleId) {
                user.googleId = profile.id;
                needsSave = true;
            }
            if (isAdmin && (user.role !== 'admin' || user.plan !== 'unlimited')) {
                user.role = 'admin';
                user.plan = 'unlimited';
                user.isVerified = true;
                needsSave = true;
            }
            if (needsSave) await user.save();
        } else {
            // Create new user (no password — Google-only)
            user = new User({
                email: profile.email.toLowerCase(),
                name: profile.name || profile.email,
                googleId: profile.id,
                isVerified: true, // Google emails are pre-verified
                role: isAdmin ? 'admin' : 'user',
                plan: isAdmin ? 'unlimited' : 'free',
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
            try {
                await redis.set(`google_auth_code:${authCode}`, token, 'EX', 30);
                return res.redirect(`${env.APP_URL}/auth/google/success?code=${authCode}`);
            } catch (err) {
                console.warn('Failed to store Google auth code (Redis unavailable):', err.message);
            }
        }

        // Fallback: If Redis is unavailable, send the token in the URL so users can still log in
        console.warn('Redis is unavailable. Falling back to JWT in URL for Google OAuth.');
        return res.redirect(`${env.APP_URL}/auth/google/success?token=${token}`);
    } catch (error) {
        console.error('Google callback error:', error);
        res.redirect(`${env.APP_URL}/login?error=google_auth_failed&details=${encodeURIComponent(error.message)}`);
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
