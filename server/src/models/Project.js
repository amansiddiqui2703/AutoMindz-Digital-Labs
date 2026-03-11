import mongoose from 'mongoose';

const pipelineStageSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    color: { type: String, default: '#435AFF' },
    order: { type: Number, required: true },
}, { _id: true });

const projectSchema = new mongoose.Schema({
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
        type: [pipelineStageSchema],
        default: [
            { name: 'Identified', color: '#6B7280', order: 0 },
            { name: 'Contacted', color: '#3B82F6', order: 1 },
            { name: 'Responded', color: '#F59E0B', order: 2 },
            { name: 'Negotiating', color: '#8B5CF6', order: 3 },
            { name: 'Won', color: '#10B981', order: 4 },
            { name: 'Lost', color: '#EF4444', order: 5 },
        ],
    },
    stats: {
        contacts: { type: Number, default: 0 },
        campaigns: { type: Number, default: 0 },
        emailsSent: { type: Number, default: 0 },
        linksAcquired: { type: Number, default: 0 },
    },
    isArchived: { type: Boolean, default: false },
}, {
    timestamps: true,
});

projectSchema.index({ userId: 1, isArchived: 1 });

const Project = mongoose.model('Project', projectSchema);

export default Project;
