import mongoose from 'mongoose';

const recipientSchema = new mongoose.Schema({
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
    email: { type: String, required: true },
    name: String,
    company: String,
    customFields: { type: Map, of: String },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed', 'bounced', 'opened', 'clicked', 'replied', 'unsubscribed'],
        default: 'pending',
    },
    currentStep: { type: Number, default: 0 },
    nextFollowUpAt: Date,
    sequenceStatus: {
        type: String,
        enum: ['active', 'completed', 'stopped_reply', 'stopped_unsubscribe', 'paused'],
        default: 'active',
    },
    sentAt: Date,
    openedAt: Date,
    clickedAt: Date,
    repliedAt: Date,
}, { _id: true });

const followUpSchema = new mongoose.Schema({
    subject: { type: String, default: '' },
    htmlBody: String,
    plainBody: String,
    delayDays: { type: Number, default: 3 },
    condition: {
        type: String,
        enum: ['no_open', 'no_reply', 'no_click', 'all'],
        default: 'no_reply',
    },
    stepNumber: { type: Number, required: true },
}, { _id: true });

const campaignSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: { type: String, default: '', trim: true },
    color: { type: String, default: '#435AFF' },
    icon: { type: String, default: 'folder' },
    pipelineStages: {
        type: [{
            name: { type: String, required: true, trim: true },
            color: { type: String, default: '#435AFF' },
            order: { type: Number, required: true },
        }],
        default: [
            { name: 'Identified', color: '#6B7280', order: 0 },
            { name: 'Contacted', color: '#3B82F6', order: 1 },
            { name: 'Responded', color: '#F59E0B', order: 2 },
            { name: 'Negotiating', color: '#8B5CF6', order: 3 },
            { name: 'Won', color: '#10B981', order: 4 },
            { name: 'Lost', color: '#EF4444', order: 5 },
        ],
    },
    targetLists: [String],
    isArchived: { type: Boolean, default: false },
    subject: { type: String, default: '' },
    subjectB: { type: String, default: '' }, // A/B test
    htmlBody: { type: String, default: '' },
    plainBody: { type: String, default: '' },
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'running', 'paused', 'completed'],
        default: 'draft',
    },
    recipients: [recipientSchema],
    accountIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'GmailAccount' }],
    delay: { type: Number, default: 5 }, // seconds between emails
    dailyLimit: { type: Number, default: 200 },
    scheduledAt: Date,
    followUps: [followUpSchema],
    stats: {
        total: { type: Number, default: 0 },
        sent: { type: Number, default: 0 },
        delivered: { type: Number, default: 0 },
        failed: { type: Number, default: 0 },
        bounced: { type: Number, default: 0 },
        opened: { type: Number, default: 0 },
        clicked: { type: Number, default: 0 },
        replied: { type: Number, default: 0 },
        unsubscribed: { type: Number, default: 0 },
    },
    cc: { type: String, default: '' },
    bcc: { type: String, default: '' },
    attachments: [{ filename: String, path: String, contentType: String }],
    tags: [String],
    warmupMode: { type: Boolean, default: false },
    warmupDailyIncrease: { type: Number, default: 10 },
}, {
    timestamps: true,
});

campaignSchema.index({ userId: 1, status: 1 });
campaignSchema.index({ userId: 1, isArchived: 1 });

const Campaign = mongoose.model('Campaign', campaignSchema);

export default Campaign;
