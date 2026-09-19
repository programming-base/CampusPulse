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
    college:{
        type:String,
        required:true,
        trim:true,
        minlength:[2,'College name must be at least 2 characters'],
        maxlength:[100,'College name must not exceed 100 characters']
    }
    ,
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

const postModel=mongoose.model('Post', postSchema);
export default postModel;