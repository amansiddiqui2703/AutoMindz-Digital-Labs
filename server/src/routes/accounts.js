// import { Router } from 'express';
// import auth from '../middleware/auth.js';
// import GmailAccount from '../models/GmailAccount.js';
// import { testScriptConnection } from '../services/gmailScript.js';
// import { getAuthUrl, getTokensFromCode, getGmailProfile } from '../services/gmailOAuth.js';
// import { verifyState } from '../utils/crypto.js';
// import env from '../config/env.js';
// import authorize from '../middleware/authorize.js';

// const router = Router();

// // Generate Google OAuth2 authorization URL
// router.get('/oauth/connect', auth, authorize('admin', 'manager', 'user'), async (req, res) => {
//     try {
//         if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
//             return res.status(500).json({ error: 'Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env' });
//         }
//         const url = getAuthUrl(req.user.id);
//         res.json({ url });
//     } catch (error) {
//         console.error('OAuth connect error:', error);
//         res.status(500).json({ error: 'Failed to start Gmail connection' });
//     }
// });

// // Google OAuth2 callback (user is redirected here by Google)
// router.get('/oauth/callback', async (req, res) => {
//     try {
//         const { code, state } = req.query;
//         if (!code || !state) {
//             return res.redirect(`${env.APP_URL}/accounts?error=missing_params`);
//         }

//         // SECURITY: Verify HMAC-signed state parameter
//         const userId = verifyState(state);
//         if (!userId) {
//             return res.redirect(`${env.APP_URL}/accounts?error=invalid_state`);
//         }

//         // Exchange code for tokens
//         const tokens = await getTokensFromCode(code);

//         // Get the user's Gmail profile
//         const profile = await getGmailProfile(tokens.access_token);

//         // Save or update the Gmail account
//         const existing = await GmailAccount.findOne({ userId, email: profile.email.toLowerCase() });

//         if (existing) {
//             existing.accessToken = tokens.access_token;
//             existing.refreshToken = tokens.refresh_token || existing.refreshToken;
//             existing.tokenExpiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;
//             existing.connectionType = 'oauth';
//             existing.displayName = profile.name || existing.displayName;
//             existing.isActive = true;
//             existing.health = 'good';
//             await existing.save();
//         } else {
//             await GmailAccount.create({
//                 userId,
//                 email: profile.email.toLowerCase(),
//                 displayName: profile.name || profile.email,
//                 connectionType: 'oauth',
//                 accessToken: tokens.access_token,
//                 refreshToken: tokens.refresh_token,
//                 tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
//             });
//         }

//         // Redirect back to the app
//         res.redirect(`${env.APP_URL}/accounts?connected=true&email=${encodeURIComponent(profile.email)}`);
//     } catch (error) {
//         console.error('OAuth callback error:', error);
//         res.redirect(`${env.APP_URL}/accounts?error=connection_failed`);
//     }
// });

// // Connect Gmail via Google Apps Script
// router.post('/connect-script', auth, authorize('admin', 'manager', 'user'), async (req, res) => {
//     try {
//         const { email, displayName, scriptUrl } = req.body;

//         if (!email || !scriptUrl) {
//             return res.status(400).json({ error: 'Email and Script URL are required' });
//         }

//         // Validate the script URL format
//         if (!scriptUrl.includes('script.google.com')) {
//             return res.status(400).json({ error: 'Invalid Google Apps Script URL' });
//         }

//         // Test the script connection
//         const testResult = await testScriptConnection(scriptUrl);

//         // Save the account
//         const existing = await GmailAccount.findOne({ userId: req.user.id, email: email.toLowerCase() });

//         if (existing) {
//             existing.scriptUrl = scriptUrl;
//             existing.displayName = displayName || existing.displayName;
//             existing.isActive = true;
//             existing.health = 'good';
//             existing.connectionType = 'script';
//             await existing.save();
//             return res.json({
//                 message: 'Account updated successfully',
//                 account: { ...existing.toObject(), scriptUrl: undefined },
//             });
//         }

//         const account = new GmailAccount({
//             userId: req.user.id,
//             email: email.toLowerCase(),
//             displayName: displayName || email,
//             scriptUrl,
//             connectionType: 'script',
//         });

//         await account.save();
//         res.json({
//             message: 'Gmail account connected via Google Apps Script',
//             account: { ...account.toObject(), scriptUrl: undefined },
//         });
//     } catch (error) {
//         console.error('Script connection error:', error);
//         res.status(500).json({ error: error.message || 'Failed to connect Gmail account' });
//     }
// });

// // List accounts
// router.get('/', auth, async (req, res) => {
//     try {
//         const accounts = await GmailAccount.find({ userId: req.user.id })
//             .select('-scriptUrl');
//         res.json({ accounts });
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to fetch accounts' });
//     }
// });

// // Update account settings
// router.patch('/:id', auth, authorize('admin', 'manager', 'user'), async (req, res) => {
//     try {
//         const { dailyLimit, isActive } = req.body;
//         const account = await GmailAccount.findOne({ _id: req.params.id, userId: req.user.id });
//         if (!account) return res.status(404).json({ error: 'Account not found' });

//         if (dailyLimit !== undefined) account.dailyLimit = dailyLimit;
//         if (isActive !== undefined) account.isActive = isActive;
//         await account.save();

//         res.json({ account: { ...account.toObject(), scriptUrl: undefined } });
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to update account' });
//     }
// });

// // Disconnect account
// router.delete('/:id', auth, authorize('admin', 'manager', 'user'), async (req, res) => {
//     try {
//         await GmailAccount.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
//         res.json({ message: 'Account disconnected' });
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to disconnect account' });
//     }
// });

// export default router;
import { Router } from 'express';
import auth from '../middleware/auth.js';
import GmailAccount from '../models/GmailAccount.js';
import { testScriptConnection } from '../services/gmailScript.js';
import { getAuthUrl, getTokensFromCode, getGmailProfile } from '../services/gmailOAuth.js';
import { verifyState } from '../utils/crypto.js';
import env from '../config/env.js';
import authorize from '../middleware/authorize.js';

const router = Router();

// ─────────────────────────────────────────────
// FIX 1: Added check for APP_URL config
// ─────────────────────────────────────────────
const appUrl = env.APP_URL?.replace(/\/$/, ''); // remove trailing slash if any

// Generate Google OAuth2 authorization URL
router.get('/oauth/connect', auth, authorize('admin', 'manager', 'user'), async (req, res) => {
    try {
        if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
            return res.status(500).json({
                error: 'Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env'
            });
        }

        // ─────────────────────────────────────────────
        // FIX 2: Ensure user ID exists before generating URL
        // ─────────────────────────────────────────────
        if (!req.user?.id) {
            return res.status(401).json({ error: 'Unauthorized. Please log in again.' });
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
        const { code, state, error: oauthError } = req.query;

        // ─────────────────────────────────────────────
        // FIX 3: Handle Google OAuth denial/error (e.g. user clicked "Cancel")
        // ─────────────────────────────────────────────
        if (oauthError) {
            console.warn('OAuth error from Google:', oauthError);
            return res.redirect(`${appUrl}/accounts?error=${encodeURIComponent(oauthError)}`);
        }

        if (!code || !state) {
            return res.redirect(`${appUrl}/accounts?error=missing_params`);
        }

        // SECURITY: Verify HMAC-signed state parameter
        const userId = verifyState(state);
        if (!userId) {
            return res.redirect(`${appUrl}/accounts?error=invalid_state`);
        }

        // Exchange code for tokens
        const tokens = await getTokensFromCode(code);

        // ─────────────────────────────────────────────
        // FIX 4: Validate tokens before proceeding
        // ─────────────────────────────────────────────
        if (!tokens?.access_token) {
            console.error('No access token received from Google');
            return res.redirect(`${appUrl}/accounts?error=no_access_token`);
        }

        // Get the user's Gmail profile
        const profile = await getGmailProfile(tokens.access_token);

        // ─────────────────────────────────────────────
        // FIX 5: Validate profile email before using it
        // ─────────────────────────────────────────────
        if (!profile?.email) {
            console.error('Could not retrieve Gmail profile email');
            return res.redirect(`${appUrl}/accounts?error=profile_fetch_failed`);
        }

        const emailLower = profile.email.toLowerCase();

        // Save or update the Gmail account
        const existing = await GmailAccount.findOne({ userId, email: emailLower });

        if (existing) {
            existing.accessToken = tokens.access_token;
            // ─────────────────────────────────────────────
            // FIX 6: Only overwrite refreshToken if a new one is provided
            // Google only sends refresh_token on FIRST login
            // ─────────────────────────────────────────────
            if (tokens.refresh_token) {
                existing.refreshToken = tokens.refresh_token;
            }
            existing.tokenExpiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;
            existing.connectionType = 'oauth';
            existing.displayName = profile.name || existing.displayName;
            existing.isActive = true;
            existing.health = 'good';
            await existing.save();
        } else {
            // ─────────────────────────────────────────────
            // FIX 7: Warn if refresh_token is missing on new account creation
            // This usually means user needs to re-authorize with prompt=consent
            // ─────────────────────────────────────────────
            if (!tokens.refresh_token) {
                console.warn(`No refresh_token received for new account: ${emailLower}. User may need to re-authorize.`);
            }

            await GmailAccount.create({
                userId,
                email: emailLower,
                displayName: profile.name || profile.email,
                connectionType: 'oauth',
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token || null,
                tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            });
        }

        res.redirect(`${appUrl}/accounts?connected=true&email=${encodeURIComponent(profile.email)}`);
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect(`${appUrl}/accounts?error=connection_failed`);
    }
});

// Connect Gmail via Google Apps Script
router.post('/connect-script', auth, authorize('admin', 'manager', 'user'), async (req, res) => {
    try {
        const { email, displayName, scriptUrl } = req.body;

        if (!email || !scriptUrl) {
            return res.status(400).json({ error: 'Email and Script URL are required' });
        }

        // ─────────────────────────────────────────────
        // FIX 8: Stronger Google Apps Script URL validation using regex
        // ─────────────────────────────────────────────
        const scriptUrlPattern = /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec(\?.*)?$/;
        if (!scriptUrlPattern.test(scriptUrl)) {
            return res.status(400).json({
                error: 'Invalid Google Apps Script URL. It should look like: https://script.google.com/macros/s/.../exec'
            });
        }

        // Test the script connection
        const testResult = await testScriptConnection(scriptUrl);

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
router.patch('/:id', auth, authorize('admin', 'manager', 'user'), async (req, res) => {
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
router.delete('/:id', auth, authorize('admin', 'manager', 'user'), async (req, res) => {
    try {
        await GmailAccount.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        res.json({ message: 'Account disconnected' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to disconnect account' });
    }
});

export default router;
