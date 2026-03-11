import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    contactId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact',
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: { type: String, default: '' },
    type: {
        type: String,
        enum: ['follow_up', 'call', 'meeting', 'review', 'outreach', 'other'],
        default: 'other',
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
    },
    status: {
        type: String,
        enum: ['todo', 'in_progress', 'done', 'cancelled'],
        default: 'todo',
    },
    dueDate: Date,
    completedAt: Date,
}, {
    timestamps: true,
});

taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ teamId: 1 });
taskSchema.index({ dueDate: 1 });

const Task = mongoose.model('Task', taskSchema);

export default Task;
