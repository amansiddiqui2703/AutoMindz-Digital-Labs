import mongoose from 'mongoose';

const trackingEventSchema = new mongoose.Schema({
    trackingId: {
        type: String,
        required: true,
        index: true,
    },
    emailLogId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmailLog',
    },
    type: {
        type: String,
        enum: ['open', 'click', 'reply', 'bounce', 'unsubscribe', 'delivered', 'complained'],
        required: true,
    },
    url: String,
    ip: String,
    userAgent: String,
}, {
    timestamps: true,
});

const TrackingEvent = mongoose.model('TrackingEvent', trackingEventSchema);

// Compound index for efficient event lookups
trackingEventSchema.index({ trackingId: 1, type: 1 });

export default TrackingEvent;
