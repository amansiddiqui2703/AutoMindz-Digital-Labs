import mongoose from 'mongoose';

const inboxMessageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GmailAccount',
    },
    contactId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact',
    },
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign',
    },
    emailLogId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmailLog',
    },
    gmailMessageId: { type: String },
    gmailThreadId: { type: String },
    direction: {
        type: String,
        enum: ['inbound', 'outbound'],
        required: true,
    },
    from: { type: String, required: true },
    to: { type: String, required: true },
    subject: { type: String, default: '' },
    snippet: { type: String, default: '' },
    htmlBody: { type: String, default: '' },
    plainBody: { type: String, default: '' },
    receivedAt: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false },
    isStarred: { type: Boolean, default: false },
    needsReply: { type: Boolean, default: false },
    repliedAt: { type: Date },
    labels: [String],
}, {
    timestamps: true,
});

inboxMessageSchema.index({ userId: 1, direction: 1, isRead: 1 });
inboxMessageSchema.index({ userId: 1, needsReply: 1 });
inboxMessageSchema.index({ userId: 1, gmailThreadId: 1 });
inboxMessageSchema.index({ contactId: 1 });
inboxMessageSchema.index({ campaignId: 1 });
// DB OPTIMIZATION: Main inbox list sorted by time
inboxMessageSchema.index({ userId: 1, direction: 1, receivedAt: -1 });
// DB OPTIMIZATION: Thread deduplication check in sync-replies (avoids full-collection scan)
inboxMessageSchema.index({ gmailMessageId: 1, userId: 1 }, { unique: true, sparse: true });
// DB OPTIMIZATION: Reply detection by sender for follow-up scheduler
inboxMessageSchema.index({ from: 1, campaignId: 1, direction: 1 });
// DB OPTIMIZATION: Thread lookup for outbound sent matching (sync-replies)
inboxMessageSchema.index({ gmailThreadId: 1, direction: 1 });

const InboxMessage = mongoose.model('InboxMessage', inboxMessageSchema);

export default InboxMessage;
