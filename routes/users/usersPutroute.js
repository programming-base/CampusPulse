import express from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.js";
import mongoose from "mongoose";
import userModel from "../../database/schema/authSchema/userSchema.js";

const router=express.Router();

router.put('/users/me',verifyAccessToken,async(req,res)=>{
    try{
        const client=req.user;
        const newData=req.body;
        if(!newData) return res.status(400).json({error:'Insufficient Information'});
        if(!mongoose.Types.ObjectId.isValid(client.userId)) return res.status(400).json({error:'Invalid user ID'})
        const isClientPresent=await userModel.findById(client.userId)
        if(!isClientPresent) return res.status(500).json({error:'Internal server error'});

        const updateUserdata=await userModel.findByIdAndUpdate(client.userId,newData);
        if(!updateUserdata) return res.status(500).json({error:'Internal server error'});
        res.status(200).json(updateUserdata);
    }catch(error){
        res.status(500).json({error:'Internal server error'})
    }
})

export default router;