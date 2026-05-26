import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
    targetId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Users',
        required:true
    },
    targetType:{
        type:String,
        enum:['comment','post'],
        required:true
    }
},{timestamps:true})

const likeModel=mongoose.model('Likes',likeSchema);
export default likeModel;