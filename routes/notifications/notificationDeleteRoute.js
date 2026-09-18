import express from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.js";
import mongoose from "mongoose";
import notificationModel from "../../models/notificationSchema/notificationSchema.js";
const router=express.Router();


router.delete('/notifications/clear-read',verifyAccessToken,async(req,res)=>{
    try{
        const deleteAllNotification=await notificationModel.deleteMany({recipient:req.user.userId,isRead:true})
        if(!deleteAllNotification.acknowledged){
            return res.status(500).json({
                success:false,
                message:'Internal server error'
            })
        }
        res.status(200).json({
            success:true,
            message:'Read notifications cleared'
        })
    }catch(error){
        res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
})

router.delete('/notifications/:notificationId',verifyAccessToken,async (req,res)=>{
    try{
        const recipient=req.user.userId;
        const {notificationId}=req.params;
        if(!mongoose.Types.ObjectId.isValid(notificationId)){
            return res.status(400).json({
                success:false,
                message:'Invalid notification ID'
            })
        }
        const deleteNotification=await notificationModel.findOneAndDelete({_id:notificationId,recipient});
        if(!deleteNotification){
            return res.status(404).json({
                success:true,
                message:"Notification not found"
            })
        }
        res.status(200).json({
            success:true,
            message:"Notification deleted"
        })

    }catch(error){
        res.status(500).json({
            success:false,
            message:'Internal server error'
        })
    }
})  
export default router;