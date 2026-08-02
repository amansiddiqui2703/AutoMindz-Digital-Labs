import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        minlength: 6,
    },
    googleId: {
        type: String,
        sparse: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    role: {
        type: String,
        enum: ['admin', 'manager', 'user', 'agent'],
        default: 'user',
    },
    settings: {
        defaultDelay: { type: Number, default: 5 },
        defaultDailyLimit: { type: Number, default: 200 },
        timezone: { type: String, default: 'UTC' },
        signature: { type: String, default: '' },
        webhookUrl: { type: String, default: '' },
        webhookEvents: { type: [String], default: ['delivered', 'opened', 'clicked', 'replied', 'bounced'] },
    },
    plan: {
        type: String,
        enum: ['free', 'starter', 'growth', 'pro', 'unlimited'],
        default: 'free',
    },
    stripeCustomerId: { type: String, default: '' },
    stripeSubscriptionId: { type: String, default: '' },
    razorpayCustomerId: { type: String, default: '' },
    razorpaySubscriptionId: { type: String, default: '' },
    planExpiresAt: { type: Date },
    aiCallsToday: { type: Number, default: 0 },
    aiCallsResetAt: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    loginAttempts: { type: Number, required: true, default: 0 },
    lockUntil: { type: Date },
    // Persistent sessions — refresh tokens (hashed) with expiry
    refreshTokens: [{
        tokenHash: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        createdAt: { type: Date, default: Date.now },
    }],
    // Admin force-logout — any JWT issued before this timestamp is invalid
    forceLogoutAt: { type: Date },
}, {
    timestamps: true,
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.incLoginAttempts = async function() {
    // if locked, do nothing
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }
    // otherwise increment
    const updates = { $inc: { loginAttempts: 1 } };
    // lock the account if we've reached 5 attempts
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + 15 * 60 * 1000 }; // 15 minutes lockout
    }
    return this.updateOne(updates);
};

userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.verificationToken;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpires;
    return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
