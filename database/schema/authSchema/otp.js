import mongoose from 'mongoose';

const otpCollection=new mongoose.Schema({
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
        expires:120
    },
    attempts:{
        type:Number,
        default:0,
        max:5
    }
})

const otpModel=mongoose.model('otps',otpCollection);
export default otpModel;