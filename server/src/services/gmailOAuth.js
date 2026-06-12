import { v4 as uuidv4 } from 'uuid';
import { google } from 'googleapis';
import env from '../config/env.js';
import { signState } from '../utils/crypto.js';
import sse from './sse.js';

/**
 * ISSUE 1 FIX: Encode email header values using RFC 2047 MIME Words (UTF-8 Base64).
 * This prevents special characters (!, @, #, $, %, &, etc.) from being corrupted
 * when email clients parse the Subject header.
 * Only encodes if the string contains non-ASCII characters OR any character that
 * commonly causes issues in raw MIME headers.
 */
const NEEDS_ENCODING_RE = /[^\x20-\x7E]|[()<>@,;:\\"/\[\]?=]|[!#$%&'*+\-/^_`{|}~]/;

const encodeMimeHeader = (value) => {
    if (!value) return '';
    // If string has only safe printable ASCII without special chars, leave it as-is
    // Otherwise, wrap in RFC 2047 encoded word: =?UTF-8?B?<base64>?=
    if (!NEEDS_ENCODING_RE.test(value)) return value;
    const encoded = Buffer.from(value, 'utf8').toString('base64');
    return `=?UTF-8?B?${encoded}?=`;
};

/**
 * Create an OAuth2 client using app credentials.
 */
export const createOAuth2Client = () => {
    // FIX 1: Validate required env vars before creating client
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) {
        throw new Error('Missing required Google OAuth env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI');
    }
    return new google.auth.OAuth2(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
        env.GOOGLE_REDIRECT_URI
    );
};

/**
 * Generate the Google OAuth2 authorization URL.
 */
export const getAuthUrl = (userId) => {
    // FIX 2: Validate userId before signing state
    if (!userId) throw new Error('userId is required to generate OAuth URL');

    const oauth2Client = createOAuth2Client();
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
        ],
        state: signState(userId),
    });
};

/**
 * Exchange authorization code for tokens.
 */
export const getTokensFromCode = async (code) => {
    // FIX 3: Validate code before making API call
    if (!code) throw new Error('Authorization code is required');

    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    // FIX 4: Validate tokens returned from Google
    if (!tokens?.access_token) {
        throw new Error('Google did not return a valid access token');
    }

    return tokens;
};

/**
 * Get the Gmail user's email and name from their OAuth token.
 */
export const getGmailProfile = async (accessToken) => {
    // FIX 5: Validate accessToken before using it
    if (!accessToken) throw new Error('Access token is required to fetch Gmail profile');

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    // FIX 6: Validate response data before returning
    if (!data?.email) {
        throw new Error('Could not retrieve email from Google profile');
    }

    return { email: data.email, name: data.name || data.email };
};

/**
 * Create an authenticated OAuth2 client from stored tokens.
 * Automatically refreshes if the access token has expired.
 */
export const getAuthenticatedClient = async (account) => {
    // FIX 7: Validate account object and required fields
    if (!account) throw new Error('Account is required');
    if (!account.accessToken && !account.refreshToken) {
        throw new Error(`No tokens available for account ${account.email}. Please reconnect.`);
    }

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
        access_token: account.accessToken,
        refresh_token: account.refreshToken,
    });

    // FIX 8: Also refresh if accessToken is missing entirely (not just expired)
    const bufferMs = 5 * 60 * 1000;
    const isExpired =
        !account.accessToken ||
        (account.tokenExpiresAt &&
            new Date(account.tokenExpiresAt).getTime() - bufferMs < Date.now());

    if (isExpired) {
        if (!account.refreshToken) {
            console.error(`✗ No refresh token available for ${account.email}`);
            account.health = 'critical';
            account.isActive = false;
            await account.save();
            throw new Error(
                `Gmail token expired and cannot be refreshed. Please reconnect your Gmail account (${account.email})`
            );
        }

        try {
            console.log(`🔄 Refreshing OAuth token for ${account.email}...`);
            const { credentials } = await oauth2Client.refreshAccessToken();

            // FIX 9: Validate refreshed credentials before saving
            if (!credentials?.access_token) {
                throw new Error('Google did not return a new access token during refresh');
            }

            account.accessToken = credentials.access_token;
            if (credentials.refresh_token) account.refreshToken = credentials.refresh_token;
            // FIX 10: Handle missing expiry_date gracefully
            account.tokenExpiresAt = credentials.expiry_date
                ? new Date(credentials.expiry_date)
                : new Date(Date.now() + 3600 * 1000); // default 1hr if missing
            account.health = 'good';
            await account.save();
            oauth2Client.setCredentials(credentials);
            console.log(`✓ Token refreshed for ${account.email}`);
        } catch (refreshError) {
            console.error(`✗ Token refresh failed for ${account.email}:`, refreshError.message);
            account.health = 'critical';
            account.isActive = false;
            await account.save();

            // BUG FIX #2: Notify the user via SSE so they can see an alert in the dashboard
            try {
                sse.sendEventToUser(account.userId.toString(), 'notification', {
                    title: '⚠️ Gmail Account Disconnected',
                    message: `Your Gmail account (${account.email}) has been disconnected. Please reconnect it to continue sending emails.`,
                    icon: 'AlertCircle',
                    severity: 'critical',
                    accountId: account._id,
                });
            } catch (sseErr) {
                console.warn('Could not send SSE account-health notification:', sseErr.message);
            }

            throw new Error(
                `Gmail token expired. Please reconnect your Gmail account (${account.email}): ${refreshError.message}`
            );
        }
    }

    return oauth2Client;
};

/**
 * Send an email via Google Gmail API using OAuth2.
 */
export const sendViaOAuth = async (account, { to, subject, htmlBody, plainBody, cc, bcc, displayName }) => {
    // FIX 11: Validate required send fields
    if (!to || !subject) {
        throw new Error('Missing required fields: to, subject');
    }
    if (!htmlBody && !plainBody) {
        throw new Error('Email must have either htmlBody or plainBody');
    }

    const oauth2Client = await getAuthenticatedClient(account);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // FIX 12: Sanitize displayName to avoid breaking MIME headers (remove quotes/newlines)
    const safeDisplayName = displayName?.replace(/["'\r\n]/g, '') || null;
    const fromHeader = safeDisplayName ? `"${safeDisplayName}" <${account.email}>` : account.email;
    const boundary = `boundary_${uuidv4().replace(/-/g, '')}`; // FIX 13: Use UUID for truly unique boundary
    const customMessageId = `<${uuidv4()}@automindz.local>`;

    let mimeHeaders = [
        `From: ${fromHeader}`,
        `To: ${to}`,
        // ISSUE 1 FIX: Encode subject using RFC 2047 to prevent corruption of special characters
        `Subject: ${encodeMimeHeader(subject)}`,
        `MIME-Version: 1.0`,
        `Message-ID: ${customMessageId}`,
        // BUG FIX #36: Add List-Unsubscribe header for better deliverability & compliance
        `List-Unsubscribe: <${env.SERVER_URL}/t/unsubscribe/${customMessageId.replace(/[<>]/g, '')}>`,
        `List-Unsubscribe-Post: List-Unsubscribe=One-Click`,
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
        'Content-Transfer-Encoding: 8bit',
        '',
        plainPart,
        `--${boundary}`,
        'Content-Type: text/html; charset="UTF-8"',
        'Content-Transfer-Encoding: 8bit',
        '',
        htmlBody || plainPart,
        `--${boundary}--`,
        '',
    ].join('\r\n');

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
export const replyViaOAuth = async (
    account,
    { to, originalSubject, htmlBody, plainBody, displayName, previousMessageId, threadId: providedThreadId }
) => {
    // FIX 14: Validate required reply fields
    if (!to || !originalSubject) {
        throw new Error('Missing required fields: to, originalSubject');
    }
    if (!htmlBody && !plainBody) {
        throw new Error('Reply must have either htmlBody or plainBody');
    }

    const oauth2Client = await getAuthenticatedClient(account);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    let threadId = providedThreadId || null;
    let inReplyTo = null;

    // FIX 15: Trim subject before removing "Re:" prefix to avoid whitespace bugs
    const cleanSubject = originalSubject.trim().replace(/^(Re:\s*)+/i, '');

    if (providedThreadId) {
        threadId = providedThreadId;
        inReplyTo = previousMessageId;
    } else if (previousMessageId) {
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

    // Fallback: search by subject
    if (!threadId) {
        try {
            const searchResult = await gmail.users.messages.list({
                userId: 'me',
                // FIX 16: Escape quotes in subject to prevent broken Gmail search query
                q: `to:${to} subject:"${cleanSubject.replace(/"/g, '')}" in:sent`,
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
                const msgIdHeader = msg.data.payload?.headers?.find(
                    (h) => h.name.toLowerCase() === 'message-id' // FIX 17: Case-insensitive header match
                );
                if (msgIdHeader) inReplyTo = msgIdHeader.value;
            }
        } catch (err) {
            console.warn(`Thread search by subject failed:`, err.message);
        }
    }

    // FIX 12 (same as above): Sanitize displayName
    const safeDisplayName = displayName?.replace(/["'\r\n]/g, '') || null;
    const fromHeader = safeDisplayName ? `"${safeDisplayName}" <${account.email}>` : account.email;
    const boundary = `boundary_${uuidv4().replace(/-/g, '')}`;
    const replySubject = `Re: ${cleanSubject}`;
    const customMessageId = `<${uuidv4()}@automindz.local>`;

    let mimeHeaders = [
        `From: ${fromHeader}`,
        `To: ${to}`,
        // ISSUE 1 FIX: Encode reply subject using RFC 2047 to prevent corruption of special characters
        `Subject: ${encodeMimeHeader(replySubject)}`,
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
        'Content-Transfer-Encoding: 8bit',
        '',
        plainPart,
        `--${boundary}`,
        'Content-Type: text/html; charset="UTF-8"',
        'Content-Transfer-Encoding: 8bit',
        '',
        htmlBody || plainPart,
        `--${boundary}--`,
        '',
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
