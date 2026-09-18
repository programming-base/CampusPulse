import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
    targetId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    targetType:{
        type:String,
        enum:['comment','post'],
        required:true
    }
},{timestamps:true})
likeSchema.index({targetId:1,userId:1,targetType:1},{unique:true})
const likeModel=mongoose.model('Like',likeSchema);

export default likeModel;