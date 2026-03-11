import mongoose from 'mongoose';

const filterConditionSchema = new mongoose.Schema({
    field: {
        type: String,
        required: true,
        enum: ['tag', 'source', 'pipelineStage', 'lastEmailed', 'emailCount', 'isUnsubscribed', 'company', 'createdAt'],
    },
    operator: {
        type: String,
        required: true,
        enum: ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'before', 'after', 'is_empty', 'is_not_empty'],
    },
    value: { type: mongoose.Schema.Types.Mixed },
}, { _id: false });

const smartListSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: { type: String, default: '', trim: true },
    color: { type: String, default: '#435AFF' },
    icon: { type: String, default: 'list' },
    filters: [filterConditionSchema],
    matchType: {
        type: String,
        enum: ['all', 'any'],
        default: 'all',
    },
    cachedCount: { type: Number, default: 0 },
    lastRefreshedAt: { type: Date },
}, {
    timestamps: true,
});

smartListSchema.index({ userId: 1 });

const SmartList = mongoose.model('SmartList', smartListSchema);

export default SmartList;
