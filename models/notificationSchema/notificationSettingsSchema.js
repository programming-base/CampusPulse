import mongoose, { mongo } from "mongoose";
const notificationSettingsSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    likes: {
        type: Boolean,
        default: true
    },
    comments: {
        type: Boolean,
        default: true
    },

    follows: {
        type: Boolean,
        default: true
    },

    mentions: {
        type: Boolean,
        default: true
    },

    systemAlerts: {
        type: Boolean,
        default: true
    },

    emailNotifications: {
        type: Boolean,
        default: false
    }
})
const notificationSettingsModel=mongoose.model('NotificationSetting',notificationSettingsSchema);
export default notificationSettingsModel;