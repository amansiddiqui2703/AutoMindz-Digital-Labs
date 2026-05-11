import GmailAccount from '../models/GmailAccount.js';

/**
 * Test connection to a Google Apps Script Web App
 */
export const testScriptConnection = async (scriptUrl) => {
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            // Bug #22 Fix: explicitly set Content-Type so the Apps Script web app parses JSON body
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'test' }),
            redirect: 'follow',
        });

        if (!response.ok) {
            throw new Error(`Script responded with HTTP ${response.status} ${response.statusText}`);
        }

        // Bug #22 Fix: check Content-Type before calling .json() to avoid 'invalid JSON' errors
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json') && !contentType.includes('text/plain')) {
            throw new Error(`Script returned unexpected content-type: ${contentType}. Expected JSON response.`);
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Script test failed — ensure your script handles the "test" action');
        }

        return { success: true, email: data.email };
    } catch (error) {
        throw new Error(`Script connection failed: ${error.message}`);
    }
};

/**
 * Send an email via Google Apps Script Web App
 */
export const sendViaScript = async (scriptUrl, { to, subject, htmlBody, plainBody, cc, bcc, displayName }) => {
    try {
        const payload = {
            action: 'send',
            to,
            subject,
            htmlBody,
            plainBody: plainBody || '',
            cc: cc || '',
            bcc: bcc || '',
            name: displayName || '',
        };

        const response = await fetch(scriptUrl, {
            method: 'POST',
            // Bug #22 Fix: always set Content-Type for JSON payloads
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            redirect: 'follow',
        });

        if (!response.ok) {
            const body = await response.text().catch(() => '');
            throw new Error(`Script responded with HTTP ${response.status}: ${body.substring(0, 200)}`);
        }

        // Bug #22 Fix: safe JSON parsing
        let data;
        try {
            data = await response.json();
        } catch {
            throw new Error('Script returned invalid JSON. Ensure your Apps Script returns a proper JSON response.');
        }

        if (!data.success) {
            throw new Error(data.error || 'Send failed');
        }

        return { success: true, messageId: data.messageId || `gas-${Date.now()}` };
    } catch (error) {
        throw new Error(`Failed to send via script: ${error.message}`);
    }
};

/**
 * Send a threaded follow-up reply via Google Apps Script
 * This will search for the original email thread and reply in it
 */
export const replyViaScript = async (scriptUrl, { to, originalSubject, htmlBody, plainBody, displayName, previousMessageId, threadId }) => {
    try {
        const payload = {
            action: 'reply',
            to,
            originalSubject,
            htmlBody,
            plainBody: plainBody || '',
            name: displayName || '',
            previousMessageId: previousMessageId || null,
            // Bug #27 Fix: pass threadId so the script can use it for threading if supported
            threadId: threadId || null,
        };

        const response = await fetch(scriptUrl, {
            method: 'POST',
            // Bug #22 Fix: always set Content-Type for JSON payloads
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            redirect: 'follow',
        });

        if (!response.ok) {
            const body = await response.text().catch(() => '');
            throw new Error(`Script responded with HTTP ${response.status}: ${body.substring(0, 200)}`);
        }

        // Bug #22 Fix: safe JSON parsing for reply too
        let data;
        try {
            data = await response.json();
        } catch {
            throw new Error('Script returned invalid JSON for reply action. Check your Apps Script implementation.');
        }

        if (!data.success) {
            throw new Error(data.error || 'Reply failed');
        }

        return {
            success: true,
            messageId: data.messageId || `gas-reply-${Date.now()}`,
            threaded: data.threaded || false,
        };
    } catch (error) {
        throw new Error(`Failed to send follow-up via script: ${error.message}`);
    }
};

/**
 * Select an available Gmail account with remaining quota (round-robin)
 */
export const selectAccount = async (userId, accountIds) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort by dailySentCount ascending for round-robin distribution
    const accounts = await GmailAccount.find({
        _id: { $in: accountIds },
        userId,
        isActive: true,
    }).sort({ dailySentCount: 1 });

    for (const account of accounts) {
        // BUG FIX #19: Handle null/undefined lastResetDate safely
        // new Date(null) = epoch (Jan 1 1970), which is always < today — that's fine
        // but undefined/missing field must also be handled
        const lastResetRaw = account.lastResetDate;
        const lastReset = lastResetRaw ? new Date(lastResetRaw) : new Date(0);
        lastReset.setHours(0, 0, 0, 0);

        if (lastReset < today) {
            account.dailySentCount = 0;
            account.lastResetDate = new Date();
            await account.save();
        }

        if (account.dailySentCount < account.dailyLimit && account.health !== 'critical') {
            return account;
        }
    }

    return null; // All accounts exhausted
};
