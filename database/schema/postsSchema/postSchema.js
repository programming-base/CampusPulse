import mongoose from 'mongoose';
const postSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
    },
    content: {
        type: String,
        required: true,
    },
    isAnonymous: {
        type: Boolean,
        required: true
    },
    userName: {
        type: String,
    },
    department: String,
    academicYear: {
        type: Number,
        required: true
    },
    visibilityScope: { type: String, enum:['college','department','year'],required: true },
    likeCount: Number,
    commentCount: Number,
    imageUrl: {
        type: String,
    },
},{timestamps:true});

const postModel=mongoose.model('Posts', postSchema);
export default postModel;