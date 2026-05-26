
// userId:The client
// followerId:The client's follower
import mongoose from 'mongoose';
const followerSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Users',
        required:true,
    },
    followerId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Users',
        required:true
    }
},{timestamps:true})

const followerModel=mongoose.model("Followers",followerSchema);
export default followerModel;