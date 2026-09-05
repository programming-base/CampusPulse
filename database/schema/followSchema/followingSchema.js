
//userId:The client
//followingId:The client's following
import mongoose, { Mongoose } from "mongoose";
const followingSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    followingId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
},{timestamps:true})

const followingModel=mongoose.model("Following",followingSchema);
export default followingModel;