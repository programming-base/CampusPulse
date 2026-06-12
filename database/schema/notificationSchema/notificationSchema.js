import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
{
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true,
        index: true
    },

    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    },

    type: {
        type: String,
        enum: [
            "like",
            "comment",
            "follow",
            "mention",
            "system"
        ],
        required: true
    },

    title: {
        type: String,
        required: true,
        trim: true
    },

    message: {
        type: String,
        required: true,
        trim: true
    },

    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Posts",
        default: null
    },

    isRead: {
        type: Boolean,
        default: false
    }

},
{
    timestamps: true
});

notificationSchema.index({
    recipient: 1,
    createdAt: -1
});

const notificationModel =
mongoose.model(
    "Notifications",
    notificationSchema
);

export default notificationModel;
