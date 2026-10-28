import mongoose from 'mongoose';

/**
 * Temporary one-time Google OAuth exchange codes.
 * Used when exchanging OAuth callback codes for session tokens (JWT + refreshToken).
 * 
 * Security:
 * - codeHash: SHA-256 hash of the random code (plaintext code is never stored)
 * - encryptedToken: AES-256-GCM encrypted JWT
 * - encryptedRefreshToken: AES-256-GCM encrypted persistent refresh token
 * - expiresAt: Short 2-minute TTL index for automatic database expiration
 */
const authCodeSchema = new mongoose.Schema({
    codeHash: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    encryptedToken: {
        type: String,
        required: true,
    },
    encryptedRefreshToken: {
        type: String,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: '2m' },
    },
}, {
    timestamps: true,
});

const AuthCode = mongoose.model('AuthCode', authCodeSchema);

export default AuthCode;
