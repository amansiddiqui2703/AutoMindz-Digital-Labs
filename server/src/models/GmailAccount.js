import mongoose from 'mongoose';
import { encrypt, decrypt } from '../utils/crypto.js';

const gmailAccountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
    },
    displayName: String,
    scriptUrl: {
        type: String,
        default: '',
    },
    connectionType: {
        type: String,
        enum: ['script', 'oauth'],
        default: 'script',
    },
    // OAuth2 tokens (encrypted at rest via pre-save hook)
    accessToken: { type: String, default: '' },
    refreshToken: { type: String, default: '' },
    tokenExpiresAt: { type: Date },
    dailySentCount: {
        type: Number,
        default: 0,
    },
    dailyLimit: {
        type: Number,
        default: 200,
    },
    lastResetDate: {
        type: Date,
        default: Date.now,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    health: {
        type: String,
        enum: ['good', 'warning', 'critical'],
        default: 'good',
    },
    bounceCount: { type: Number, default: 0 },
    totalSent: { type: Number, default: 0 },
}, {
    timestamps: true,
});

// --- Auto-encrypt tokens before saving ---
gmailAccountSchema.pre('save', function (next) {
    if (this.isModified('accessToken') && this.accessToken && !this.accessToken.startsWith('enc:')) {
        this.accessToken = encrypt(this.accessToken);
    }
    if (this.isModified('refreshToken') && this.refreshToken && !this.refreshToken.startsWith('enc:')) {
        this.refreshToken = encrypt(this.refreshToken);
    }
    next();
});

// --- Auto-decrypt tokens after reading ---
const decryptTokens = (doc) => {
    if (!doc) return;
    if (doc.accessToken) doc.accessToken = decrypt(doc.accessToken);
    if (doc.refreshToken) doc.refreshToken = decrypt(doc.refreshToken);
};

gmailAccountSchema.post('findOne', decryptTokens);
gmailAccountSchema.post('find', (docs) => { docs.forEach(decryptTokens); });
gmailAccountSchema.post('save', decryptTokens);

// Strip sensitive fields from API responses
gmailAccountSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.accessToken;
    delete obj.refreshToken;
    delete obj.scriptUrl;
    return obj;
};

gmailAccountSchema.index({ userId: 1, email: 1 }, { unique: true });

const GmailAccount = mongoose.model('GmailAccount', gmailAccountSchema);

export default GmailAccount;
