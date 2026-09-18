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
        ref: "Users"
    },

    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    }],

    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
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

const chatModel=mongoose.model('Chat',chatSchema)
export default chatModel;