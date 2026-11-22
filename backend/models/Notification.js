
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        title: {
            type: String,
            required: true
        },

        message: {
            type: String,
            required: true
        },

        type: {
            type: String,
            enum: [
                "registration",
                "approval",
                "rejection",
                "event",
                "reminder",
                "general"
            ],
            default: "general"
        },

        relatedEvent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            default: null
        },

        relatedRegistration: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Registration",
            default: null
        },

        isRead: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
