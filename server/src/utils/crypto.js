import CryptoJS from 'crypto-js';
import env from '../config/env.js';

const key = env.ENCRYPTION_KEY;
// SECURITY FIX [MEDIUM-1]: Throw error if ENCRYPTION_KEY is missing
if (!key) throw new Error('ENCRYPTION_KEY not configured');

// --- AES-256 Encryption for tokens at rest ---

export const encrypt = (text) => {
    if (!text) return '';
    return 'enc:' + CryptoJS.AES.encrypt(text, key).toString();
};

export const decrypt = (ciphertext) => {
    if (!ciphertext) return '';
    // Only decrypt if it was encrypted by us
    if (!ciphertext.startsWith('enc:')) return ciphertext;
    const raw = ciphertext.slice(4);
    const bytes = CryptoJS.AES.decrypt(raw, key);
    return bytes.toString(CryptoJS.enc.Utf8);
};

// --- HMAC-signed OAuth state parameter ---

const hmacKey = env.JWT_SECRET || 'dev-secret-change-me';

/**
 * Create a signed state token: userId.hmacSignature
 */
export const signState = (userId) => {
    const sig = CryptoJS.HmacSHA256(userId, hmacKey).toString();
    return `${userId}.${sig}`;
};

/**
 * Verify a signed state token. Returns userId if valid, null if tampered.
 */
export const verifyState = (state) => {
    if (!state || !state.includes('.')) return null;
    const dotIndex = state.indexOf('.');
    const userId = state.substring(0, dotIndex);
    const sig = state.substring(dotIndex + 1);
    const expected = CryptoJS.HmacSHA256(userId, hmacKey).toString();
    if (sig !== expected) return null;
    return userId;
};
