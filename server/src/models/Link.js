import mongoose from 'mongoose';

const linkSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
    },
    contactId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact',
    },
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign',
    },
    targetUrl: {
        type: String,
        required: true,
        trim: true,
    },
    linkUrl: {
        type: String,
        default: '',
        trim: true,
    },
    anchorText: { type: String, default: '', trim: true },
    status: {
        type: String,
        enum: ['pending', 'live', 'removed', 'broken', 'nofollow'],
        default: 'pending',
    },
    lastCheckedAt: { type: Date },
    firstFoundAt: { type: Date },
    removedAt: { type: Date },
    checkHistory: [{
        checkedAt: { type: Date, default: Date.now },
        status: String,
        httpStatus: Number,
    }],
    notes: { type: String, default: '' },
}, {
    timestamps: true,
});

linkSchema.index({ userId: 1, status: 1 });
linkSchema.index({ projectId: 1 });
linkSchema.index({ contactId: 1 });

const Link = mongoose.model('Link', linkSchema);

export default Link;
