import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    admin:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    }],
    type: {
        type: String,
        enum: ["dm", "group"]
    },
    description:{
        type:String
    },
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

}, { timestamps: true });

const chatModel=mongoose.model('Chat',chatSchema)
export default chatModel;