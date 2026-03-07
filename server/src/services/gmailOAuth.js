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

    // Auto-refresh if token is expired
    if (account.tokenExpiresAt && new Date(account.tokenExpiresAt) < new Date()) {
        const { credentials } = await oauth2Client.refreshAccessToken();
        account.accessToken = credentials.access_token;
        if (credentials.refresh_token) account.refreshToken = credentials.refresh_token;
        account.tokenExpiresAt = new Date(credentials.expiry_date);
        await account.save();
        oauth2Client.setCredentials(credentials);
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

    let mimeHeaders = [
        `From: ${fromHeader}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
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

    return { success: true, messageId: result.data.id };
};

/**
 * Send a threaded reply via Gmail API using OAuth2.
 */
export const replyViaOAuth = async (account, { to, originalSubject, htmlBody, plainBody, displayName }) => {
    const oauth2Client = await getAuthenticatedClient(account);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Search for the original thread
    const cleanSubject = originalSubject.replace(/^Re:\s*/i, '');
    const searchResult = await gmail.users.messages.list({
        userId: 'me',
        q: `to:${to} subject:"${cleanSubject}" in:sent`,
        maxResults: 1,
    });

    let threadId = null;
    let inReplyTo = null;
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

    // Build MIME
    const fromHeader = displayName ? `"${displayName}" <${account.email}>` : account.email;
    const boundary = `boundary_${Date.now()}`;
    const replySubject = `Re: ${cleanSubject}`;

    let mimeHeaders = [
        `From: ${fromHeader}`,
        `To: ${to}`,
        `Subject: ${replySubject}`,
        `MIME-Version: 1.0`,
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

    return { success: true, messageId: result.data.id, threaded: !!threadId };
};
