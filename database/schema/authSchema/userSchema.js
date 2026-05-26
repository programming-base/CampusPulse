import mongoose from 'mongoose';
const userSchema=new mongoose.Schema({
    photoURL: {
        url: {
            type: String,
        },
        publicID: {
            type: String,
        },
    },
    displayName:{
        type:String,
        required:true,
        trim:true,
    },
    userName:{
        type:String,
        required:true,
        unique:true,
    },
    email: {
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type:String,
        required:true,
    },
    college: {
        type:String,
        required:true,
    },
    department: {
        type:String,
        required:true,
    },
    academicYear: {
        type:Number,
        required:true
    }
});
const userModel=mongoose.model("Users",userSchema)
export default userModel;
