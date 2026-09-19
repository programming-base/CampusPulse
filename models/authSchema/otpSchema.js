import mongoose from 'mongoose';

const otpSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    },
    email:{
        type:String,
        required:true,        
    },
    otp:{
        type:String,
        required:true
    },
    token:{
        type:String,
    },
    jti:{
        type:String,
        required:true
    },
    otpType:{
        type:String,
        required:true,
        enum:['forgot-password','reset-password']
    },
    createdAt:{
        type:Date,
        default:Date.now,
        expires:10 * 60
    },
    attempts:{
        type:Number,
        default:0,
        max:5
    },
    otpUsed:{
        type:Boolean,
        default:false
    }
})

const otpModel=mongoose.model('Otp',otpSchema);
export default otpModel;