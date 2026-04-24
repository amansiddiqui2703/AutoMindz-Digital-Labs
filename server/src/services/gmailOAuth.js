import { v4 as uuidv4 } from 'uuid';
import { google } from 'googleapis';
import env from '../config/env.js';
import { signState } from '../utils/crypto.js';

/**
 * Create an OAuth2 client using app credentials.
 */
export const createOAuth2Client = () => {
    return new google.auth.OAuth2(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
        env.GOOGLE_REDIRECT_URI
    );
};

/**
 * Generate the Google OAuth2 authorization URL.
 * The `state` parameter carries a signed userId so we know who to link the account to after callback.
 */
export const getAuthUrl = (userId) => {
    const oauth2Client = createOAuth2Client();
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',  // gets refresh_token
        prompt: 'consent',       // always ask for consent to get refresh_token
        scope: [
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
        ],
        state: signState(userId),  // HMAC-signed state to prevent spoofing
    });
};

/**
 * Exchange authorization code for tokens.
 */
export const getTokensFromCode = async (code) => {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
};

/**
 * Get the Gmail user's email and name from their OAuth token.
 */
export const getGmailProfile = async (accessToken) => {
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    return { email: data.email, name: data.name || data.email };
};

/**
 * Create an authenticated OAuth2 client from stored tokens.
 * Automatically refreshes if the access token has expired.
 */
export const getAuthenticatedClient = async (account) => {
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
        access_token: account.accessToken,
        refresh_token: account.refreshToken,
    });

    // Auto-refresh if token is expired or about to expire (5 min buffer)
    const bufferMs = 5 * 60 * 1000;
    const isExpired = account.tokenExpiresAt && new Date(account.tokenExpiresAt).getTime() - bufferMs < Date.now();
    
    if (isExpired) {
        if (!account.refreshToken) {
            console.error(`✗ No refresh token available for ${account.email}`);
            account.health = 'critical';
            account.isActive = false;
            await account.save();
            throw new Error(`Gmail token expired and cannot be refreshed. Please reconnect your Gmail account (${account.email})`);
        }
        
        try {
            console.log(`🔄 Refreshing OAuth token for ${account.email}...`);
            const { credentials } = await oauth2Client.refreshAccessToken();
            account.accessToken = credentials.access_token;
            if (credentials.refresh_token) account.refreshToken = credentials.refresh_token;
            account.tokenExpiresAt = new Date(credentials.expiry_date);
            account.health = 'good'; // Reset health status after successful refresh
            await account.save();
            oauth2Client.setCredentials(credentials);
            console.log(`✓ Token refreshed for ${account.email}`);
        } catch (refreshError) {
            console.error(`✗ Token refresh failed for ${account.email}:`, refreshError.message);
            // Mark account as critical so user knows to reconnect
            account.health = 'critical';
            account.isActive = false;
            await account.save();
            throw new Error(`Gmail token expired. Please reconnect your Gmail account (${account.email}): ${refreshError.message}`);
        }
    }

    return oauth2Client;
};

/**
 * Send an email via Google Gmail API using OAuth2.
 */
export const sendViaOAuth = async (account, { to, subject, htmlBody, plainBody, cc, bcc, displayName }) => {
    const oauth2Client = await getAuthenticatedClient(account);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Build the raw MIME email
    const fromHeader = displayName ? `"${displayName}" <${account.email}>` : account.email;
    const boundary = `boundary_${Date.now()}`;
    const customMessageId = `<${uuidv4()}@automindz.local>`;

    let mimeHeaders = [
        `From: ${fromHeader}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Message-ID: ${customMessageId}`,
    ];
    if (cc) mimeHeaders.push(`Cc: ${cc}`);
    if (bcc) mimeHeaders.push(`Bcc: ${bcc}`);
    mimeHeaders.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);

    const plainPart = plainBody || htmlBody?.replace(/<[^>]+>/g, '').trim() || '';

    const rawEmail = [
        ...mimeHeaders,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset="UTF-8"',
        '',
        plainPart,
        `--${boundary}`,
        'Content-Type: text/html; charset="UTF-8"',
        '',
        htmlBody || plainPart,
        `--${boundary}--`,
    ].join('\r\n');

    // Base64url encode
    const encodedMessage = Buffer.from(rawEmail)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encodedMessage },
    });

    return { 
        success: true, 
        messageId: customMessageId,
        gmailMessageId: result.data.id,
        gmailThreadId: result.data.threadId,
    };
};

/**
 * Send a threaded reply via Gmail API using OAuth2.
 */
export const replyViaOAuth = async (account, { to, originalSubject, htmlBody, plainBody, displayName, previousMessageId, threadId: providedThreadId }) => {
    const oauth2Client = await getAuthenticatedClient(account);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    let threadId = providedThreadId || null;
    let inReplyTo = null;
    const cleanSubject = originalSubject.replace(/^Re:\s*/i, '');

    // 1. If we have a direct threadId from previous email log, use it
    if (providedThreadId) {
        threadId = providedThreadId;
        inReplyTo = previousMessageId; // Use the Gmail messageId for In-Reply-To header
    }
    // 2. If we have just the messageId, search for threadId
    else if (previousMessageId) {
        inReplyTo = previousMessageId;
        try {
            const msg = await gmail.users.messages.list({
                userId: 'me',
                q: `rfc822msgid:${previousMessageId}`,
                maxResults: 1,
            });
            if (msg.data.messages?.length > 0) {
                threadId = msg.data.messages[0].threadId;
            }
        } catch (err) {
            console.warn(`Could not find threadId by RFC Message-ID ${previousMessageId}:`, err.message);
        }
    }

    // 3. Fallback: Search for the original thread by subject if threadId still not found
    if (!threadId) {
        try {
            const searchResult = await gmail.users.messages.list({
                userId: 'me',
                q: `to:${to} subject:"${cleanSubject}" in:sent`,
                maxResults: 1,
            });

            if (searchResult.data.messages?.length > 0) {
                const msg = await gmail.users.messages.get({
                    userId: 'me',
                    id: searchResult.data.messages[0].id,
                    format: 'metadata',
                    metadataHeaders: ['Message-ID'],
                });
                threadId = msg.data.threadId;
                const msgIdHeader = msg.data.payload?.headers?.find(h => h.name === 'Message-ID');
                if (msgIdHeader) inReplyTo = msgIdHeader.value;
            }
        } catch (err) {
            console.warn(`Thread search by subject failed:`, err.message);
        }
    }

    // Build MIME
    const fromHeader = displayName ? `"${displayName}" <${account.email}>` : account.email;
    const boundary = `boundary_${Date.now()}`;
    const replySubject = `Re: ${cleanSubject}`;

    const customMessageId = `<${uuidv4()}@automindz.local>`;

    let mimeHeaders = [
        `From: ${fromHeader}`,
        `To: ${to}`,
        `Subject: ${replySubject}`,
        `MIME-Version: 1.0`,
        `Message-ID: ${customMessageId}`,
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ];
    if (inReplyTo) {
        mimeHeaders.push(`In-Reply-To: ${inReplyTo}`);
        mimeHeaders.push(`References: ${inReplyTo}`);
    }

    const plainPart = plainBody || htmlBody?.replace(/<[^>]+>/g, '').trim() || '';
    const rawEmail = [
        ...mimeHeaders,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset="UTF-8"',
        '',
        plainPart,
        `--${boundary}`,
        'Content-Type: text/html; charset="UTF-8"',
        '',
        htmlBody || plainPart,
        `--${boundary}--`,
    ].join('\r\n');

    const encodedMessage = Buffer.from(rawEmail)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    const sendPayload = { raw: encodedMessage };
    if (threadId) sendPayload.threadId = threadId;

    const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: sendPayload,
    });

    return {
        success: true,
        messageId: customMessageId,
        gmailMessageId: result.data.id,
        gmailThreadId: result.data.threadId,
    };
};
