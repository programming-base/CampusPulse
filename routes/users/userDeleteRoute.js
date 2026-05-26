import express from "express";
import verifyRefreshToken from "../../middlewares/verifyAccessToken.js";
import userValidation from '../../middlewares/userValidation.js'
import followingModel from "../../database/schema/followSchema/followingSchema.js";
const router=express.Router();


router.delete('/users/:userId/follow',verifyRefreshToken,userValidation,async (req,res)=>{
    try{
        const client =req.user.userId;
        const targetUser=req.presentUser._id.toString();
        if(client=== targetUser){
            return res.status(400).json({error:'Bad requesst'})
        }
        const isTargetValid= await followingModel.findOne({userId:client,followingId:targetUser})
        if(!isTargetValid) return res.status(401).json({error:'Unauthorized'})
        const deleteTheFollowing=await followingModel.deleteOne({userId:client,followingId:targetUser})
        res.status(200).json({success:true,message:'User Unfollowed'})
    }catch(error){
        res.status(500).json({error:'Internal server error'})
    }
})

export default router;