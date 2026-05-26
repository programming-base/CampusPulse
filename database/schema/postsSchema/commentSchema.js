import mongoose from "mongoose";

const commentSchema=new mongoose.Schema({
    postId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'Posts'
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Users',
        required:true,
    },
    
    content:{
        type:String,
        required:true
    },
    likes:{
        type:Number,
        default:0,
        required:true
    }
},{timestamps:true});


const commentModel=mongoose.model('Comments',commentSchema);
export default commentModel;