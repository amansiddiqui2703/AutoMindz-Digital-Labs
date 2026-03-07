import { Router } from 'express';
import auth from '../middleware/auth.js';
import GmailAccount from '../models/GmailAccount.js';
import { testScriptConnection } from '../services/gmailScript.js';
import { getAuthUrl, getTokensFromCode, getGmailProfile } from '../services/gmailOAuth.js';
import { verifyState } from '../utils/crypto.js';
import env from '../config/env.js';

const router = Router();

// Generate Google OAuth2 authorization URL
router.get('/oauth/connect', auth, async (req, res) => {
    try {
        if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
            return res.status(500).json({ error: 'Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env' });
        }
        const url = getAuthUrl(req.user.id);
        res.json({ url });
    } catch (error) {
        console.error('OAuth connect error:', error);
        res.status(500).json({ error: 'Failed to start Gmail connection' });
    }
});

// Google OAuth2 callback (user is redirected here by Google)
router.get('/oauth/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
        if (!code || !state) {
            return res.redirect(`${env.APP_URL}/accounts?error=missing_params`);
        }

        // SECURITY: Verify HMAC-signed state parameter
        const userId = verifyState(state);
        if (!userId) {
            return res.redirect(`${env.APP_URL}/accounts?error=invalid_state`);
        }

        // Exchange code for tokens
        const tokens = await getTokensFromCode(code);

        // Get the user's Gmail profile
        const profile = await getGmailProfile(tokens.access_token);

        // Save or update the Gmail account
        const existing = await GmailAccount.findOne({ userId, email: profile.email.toLowerCase() });

        if (existing) {
            existing.accessToken = tokens.access_token;
            existing.refreshToken = tokens.refresh_token || existing.refreshToken;
            existing.tokenExpiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;
            existing.connectionType = 'oauth';
            existing.displayName = profile.name || existing.displayName;
            existing.isActive = true;
            existing.health = 'good';
            await existing.save();
        } else {
            await GmailAccount.create({
                userId,
                email: profile.email.toLowerCase(),
                displayName: profile.name || profile.email,
                connectionType: 'oauth',
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            });
        }

        // Redirect back to the app
        res.redirect(`${env.APP_URL}/accounts?connected=true&email=${encodeURIComponent(profile.email)}`);
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect(`${env.APP_URL}/accounts?error=connection_failed`);
    }
});

// Connect Gmail via Google Apps Script
router.post('/connect-script', auth, async (req, res) => {
    try {
        const { email, displayName, scriptUrl } = req.body;

        if (!email || !scriptUrl) {
            return res.status(400).json({ error: 'Email and Script URL are required' });
        }

        // Validate the script URL format
        if (!scriptUrl.includes('script.google.com')) {
            return res.status(400).json({ error: 'Invalid Google Apps Script URL' });
        }

        // Test the script connection
        const testResult = await testScriptConnection(scriptUrl);

        // Save the account
        const existing = await GmailAccount.findOne({ userId: req.user.id, email: email.toLowerCase() });

        if (existing) {
            existing.scriptUrl = scriptUrl;
            existing.displayName = displayName || existing.displayName;
            existing.isActive = true;
            existing.health = 'good';
            existing.connectionType = 'script';
            await existing.save();
            return res.json({
                message: 'Account updated successfully',
                account: { ...existing.toObject(), scriptUrl: undefined },
            });
        }

        const account = new GmailAccount({
            userId: req.user.id,
            email: email.toLowerCase(),
            displayName: displayName || email,
            scriptUrl,
            connectionType: 'script',
        });

        await account.save();
        res.json({
            message: 'Gmail account connected via Google Apps Script',
            account: { ...account.toObject(), scriptUrl: undefined },
        });
    } catch (error) {
        console.error('Script connection error:', error);
        res.status(500).json({ error: error.message || 'Failed to connect Gmail account' });
    }
});

// List accounts
router.get('/', auth, async (req, res) => {
    try {
        const accounts = await GmailAccount.find({ userId: req.user.id })
            .select('-scriptUrl');
        res.json({ accounts });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
});

// Update account settings
router.patch('/:id', auth, async (req, res) => {
    try {
        const { dailyLimit, isActive } = req.body;
        const account = await GmailAccount.findOne({ _id: req.params.id, userId: req.user.id });
        if (!account) return res.status(404).json({ error: 'Account not found' });

        if (dailyLimit !== undefined) account.dailyLimit = dailyLimit;
        if (isActive !== undefined) account.isActive = isActive;
        await account.save();

        res.json({ account: { ...account.toObject(), scriptUrl: undefined } });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update account' });
    }
});

// Disconnect account
router.delete('/:id', auth, async (req, res) => {
    try {
        await GmailAccount.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        res.json({ message: 'Account disconnected' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to disconnect account' });
    }
});

export default router;
