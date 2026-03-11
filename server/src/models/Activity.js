import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
    },
    type: {
        type: String,
        enum: [
            'campaign_created', 'campaign_sent', 'campaign_completed',
            'contact_added', 'contact_updated',
            'email_sent', 'email_opened', 'email_replied',
            'task_created', 'task_completed',
            'team_invite', 'team_join',
            'project_created', 'note_added',
            'template_created',
        ],
        required: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    // References
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
}, {
    timestamps: true,
});

activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ teamId: 1, createdAt: -1 });

// Helper to create activity entries easily
activitySchema.statics.log = async function (data) {
    try {
        return await this.create(data);
    } catch {
        // Silent fail — activity logging should never crash the app
    }
};

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
