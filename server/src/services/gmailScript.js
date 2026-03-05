import GmailAccount from '../models/GmailAccount.js';

/**
 * Test connection to a Google Apps Script Web App
 */
export const testScriptConnection = async (scriptUrl) => {
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'test' }),
            redirect: 'follow',
        });

        if (!response.ok) {
            throw new Error(`Script responded with status ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Script test failed');
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            redirect: 'follow',
        });

        if (!response.ok) {
            throw new Error(`Script responded with status ${response.status}`);
        }

        const data = await response.json();
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
export const replyViaScript = async (scriptUrl, { to, originalSubject, htmlBody, plainBody, displayName }) => {
    try {
        const payload = {
            action: 'reply',
            to,
            originalSubject,
            htmlBody,
            plainBody: plainBody || '',
            name: displayName || '',
        };

        const response = await fetch(scriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            redirect: 'follow',
        });

        if (!response.ok) {
            throw new Error(`Script responded with status ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Reply failed');
        }

        return { success: true, messageId: data.messageId || `gas-reply-${Date.now()}`, threaded: data.threaded };
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
        // Reset daily count if new day
        const lastReset = new Date(account.lastResetDate);
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
