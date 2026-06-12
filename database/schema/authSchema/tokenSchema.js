import mongoose from 'mongoose';
const tokenSchema=new mongoose.Schema({
    
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Users',
        required:true
    },
    token:{
        type:String,
        required:true
    },
    type:{
        type:String,
        enum:['refresh','reset','access'],
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    expiresIn:{
        type:Date,
        required:true,
    },
    isRevoked: {
        type: Boolean,
        default: false
    },
})
const tokenModel=mongoose.model('Token',tokenSchema);
export default tokenModel;