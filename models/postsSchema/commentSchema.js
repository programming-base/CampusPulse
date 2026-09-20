import mongoose from "mongoose";

const commentSchema=new mongoose.Schema({
    postId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'Post'
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
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

// At the end of commentSchema, BEFORE export:

// Comments for a post (most common query)
commentSchema.index({ postId: 1, createdAt: -1 });

// User's comments (profile page)
commentSchema.index({ userId: 1, createdAt: -1 });

// Compound for post + user (check if user commented)
commentSchema.index({ postId: 1, userId: 1 });
const commentModel=mongoose.model('Comment',commentSchema);
export default commentModel;