import express from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.js";
import userValidation from '../../middlewares/userValidation.js'
import followModel from "../../models/followSchema/followSchema.js";
const router=express.Router();


router.delete('/users/:userId/follow',verifyAccessToken,userValidation,async (req,res)=>{
    try{
        const client =req.user.userId;
        const targetUser=req.presentUser._id.toString();
        if(client=== targetUser){
            return res.status(400).json({error:'Bad requesst'})
        }
        const isTargetValid= await followModel.findOne({followerId:client,followingId:targetUser})
        if(!isTargetValid) return res.status(401).json({error:'Unauthorized'})
        const deleteTheFollowing=await followModel.deleteOne({followerId:client,followingId:targetUser})
        res.status(200).json({success:true,message:'User Unfollowed'})
    }catch(error){
        res.status(500).json({error:'Internal server error'})
    }
})

export default router;