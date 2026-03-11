import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    contactId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact',
        required: true,
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    isPinned: { type: Boolean, default: false },
    type: {
        type: String,
        enum: ['note', 'call', 'meeting', 'task', 'reminder'],
        default: 'note',
    },
}, {
    timestamps: true,
});

noteSchema.index({ contactId: 1, createdAt: -1 });
noteSchema.index({ userId: 1, type: 1 });

const Note = mongoose.model('Note', noteSchema);

export default Note;
