import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: {
        type: String,
        enum: ['owner', 'admin', 'member', 'viewer'],
        default: 'member',
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'removed'],
        default: 'pending',
    },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    invitedAt: { type: Date, default: Date.now },
    joinedAt: Date,
}, { _id: true });

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    members: [memberSchema],
    settings: {
        allowMemberInvites: { type: Boolean, default: false },
        shareContacts: { type: Boolean, default: true },
        shareTemplates: { type: Boolean, default: true },
        shareCampaigns: { type: Boolean, default: false },
    },
}, {
    timestamps: true,
});

teamSchema.index({ ownerId: 1 });
teamSchema.index({ 'members.userId': 1 });
teamSchema.index({ 'members.email': 1 });

const Team = mongoose.model('Team', teamSchema);

export default Team;
