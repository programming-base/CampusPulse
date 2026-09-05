
// userId:The client
// followerId:The client's follower
import mongoose from 'mongoose';
const followerSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    followerId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    }
},{timestamps:true})

const followerModel=mongoose.model("Follower",followerSchema);
export default followerModel;