
//userId:The client
//followingId:The client's following
import mongoose, { Mongoose } from "mongoose";
const followingSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Users',
        required:true,
    },
    followingId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Users',
        required:true
    },
},{timestamps:true})

const followingModel=mongoose.model("Followings",followingSchema);
export default followingModel;