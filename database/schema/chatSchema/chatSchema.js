import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["dm", "group"]
    },
    description:{
        type:String
    },
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

}, { timestamps: true });

const chatModel=mongoose.model('Chats',chatSchema)
export default chatModel;