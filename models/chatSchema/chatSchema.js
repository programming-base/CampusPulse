import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["dm", "group"],
        required: true
    },

    name: {
        type: String,
        trim: true
    },

    description: {
        type: String,
        trim: true
    },

    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],

    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],

    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message"
    },

    messageCount: {
        type: Number,
        default: 0
    },

    lastActivity: {
        type: Date,
        default: Date.now
    }

}, { timestamps: true });;

// User's chats
chatSchema.index({ participants: 1, lastActivity: -1 });

// DM lookup 
chatSchema.index({ type: 1, participants: 1 });

// Admin lookup
chatSchema.index({ admins: 1 });

const chatModel=mongoose.model('Chat',chatSchema)


export default chatModel;