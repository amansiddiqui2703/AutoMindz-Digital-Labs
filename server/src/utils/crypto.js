import CryptoJS from 'crypto-js';
import crypto from 'crypto';
import env from '../config/env.js';

const key = env.ENCRYPTION_KEY;
// SECURITY FIX [MEDIUM-1]: Throw error if ENCRYPTION_KEY is missing
if (!key) throw new Error('ENCRYPTION_KEY not configured');

const ALGO = 'aes-256-gcm';
// Ensure the key is exactly 32 bytes (256 bits)
const KEY = Buffer.from(key.length === 64 ? key : crypto.createHash('sha256').update(key).digest('hex'), 'hex');

export const encrypt = (text) => {
    if (!text) return '';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGO, KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');
    return `enc2:${iv.toString('hex')}:${tag}:${encrypted}`;
};

export const decrypt = (ciphertext) => {
    if (!ciphertext) return '';
    
    // Legacy CryptoJS decryption
    if (ciphertext.startsWith('enc:') && !ciphertext.startsWith('enc2:')) {
        try {
            const raw = ciphertext.slice(4);
            const bytes = CryptoJS.AES.decrypt(raw, key);
            return bytes.toString(CryptoJS.enc.Utf8);
        } catch {
            return '';
        }
    }
    
    // New AES-256-GCM decryption
    if (ciphertext.startsWith('enc2:')) {
        try {
            const parts = ciphertext.split(':');
            const iv = Buffer.from(parts[1], 'hex');
            const tag = Buffer.from(parts[2], 'hex');
            const encryptedText = parts[3];
            
            const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
            decipher.setAuthTag(tag);
            let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch {
            return '';
        }
    }

    // Unencrypted or unknown format
    return ciphertext;
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
    // Use timing-safe comparison to prevent timing attacks
    try {
        const sigBuf = Buffer.from(sig, 'hex');
        const expBuf = Buffer.from(expected, 'hex');
        if (sigBuf.length !== expBuf.length) return null;
        if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
    } catch {
        return null;
    }
    return userId;
};
