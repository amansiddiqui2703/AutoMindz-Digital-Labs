import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    name: { type: String, default: '', trim: true },
    company: { type: String, default: '', trim: true },
    website: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    linkedIn: { type: String, default: '', trim: true },
    twitter: { type: String, default: '', trim: true },
    customFields: {
        type: Map,
        of: String,
        default: {},
    },
    tags: [String],
    source: {
        type: String,
        enum: ['csv', 'manual', 'finder', 'api', 'extension'],
        default: 'manual',
    },
    pipelineStage: { type: String, default: 'Identified' },
    pipelineStageMovedAt: { type: Date },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    isUnsubscribed: { type: Boolean, default: false },
    unsubscribedAt: Date,
    lastEmailed: Date,
    lastContactedAt: Date,
    emailCount: { type: Number, default: 0 },
    enrichment: {
        domainAuthority: { type: Number },
        domainRating: { type: Number },
        monthlyTraffic: { type: Number },
        enrichedAt: { type: Date },
    },
    notesCount: { type: Number, default: 0 },
}, {
    timestamps: true,
});

contactSchema.index({ userId: 1, email: 1 }, { unique: true });
contactSchema.index({ userId: 1, projectId: 1, pipelineStage: 1 });
contactSchema.index({ userId: 1, tags: 1 });

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;

