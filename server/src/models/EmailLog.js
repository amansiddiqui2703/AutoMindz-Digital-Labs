import mongoose from 'mongoose';

const emailLogSchema = new mongoose.Schema({
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign',
    },
    contactId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact',
    },
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GmailAccount',
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    to: { type: String, required: true },
    subject: String,
    status: {
        type: String,
        enum: ['queued', 'sent', 'failed', 'bounced'],
        default: 'queued',
    },
    trackingId: { type: String, unique: true },
    messageId: String,
    gmailMessageId: String,
    gmailThreadId: String,
    sentAt: Date,
    error: String,
    isFollowUp: { type: Boolean, default: false },
    followUpIndex: Number,
    abVariant: { type: String, enum: ['A', 'B'], default: 'A' },
}, {
    timestamps: true,
});

emailLogSchema.index({ campaignId: 1, status: 1 });

const EmailLog = mongoose.model('EmailLog', emailLogSchema);

export default EmailLog;
