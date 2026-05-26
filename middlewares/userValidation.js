import mongoose from "mongoose";
import userModel from "../database/schema/authSchema/userSchema.js";


const userValidation=async (req,res,next)=>{
    try{
        const {userId}=req.params;
        if(!userId)return res.status(400).json({error:'user ID missing'});
        if(!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({error:'invalid user id'});
        const isUserPresent =await userModel.findById(userId,{password:0});
        if(!isUserPresent) return res.status(404).json({error:'user not found or invalid user ID'});
        req.presentUser=isUserPresent;
        next()
    }catch(error){
        return res.status(500).json({error:'Internal server error'})
    }
}

export default userValidation;