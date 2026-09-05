import express from "express";
import mongoose from "mongoose";
import verifyAccessToken from "../../middlewares/verifyAccessToken.js";
import notificationModel from "../../database/schema/notificationSchema/notificationSchema.js";
import notificationSettingsModel from "../../database/schema/notificationSchema/notificationSettingsSchema.js";
const router=express.Router();

router.put('/notifications/:notificationId/read',verifyAccessToken,async (req,res)=>{
    try{
        const { notificationId } = req.params;
        if(!mongoose.Types.ObjectId.isValid(notificationId)){
            return res.status(400).json({
                success:false,
                message:'Invalid notification ID'
            })
        }
        const updatedReadStatus=await notificationModel.findByIdAndUpdate(notificationId,{isRead:true},{new:true});
        if(!updatedReadStatus){
            return res.status(404).json({
                success:false,
                message:"Document not found"
            })
        }
        res.status(200).json({
            success:true,
            message:'Notification is marked as read'
        })
              
    }catch(error){
        res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
})

router.put('/notifications/read-all',verifyAccessToken,async (req,res)=>{
    try{
        
        const result=await notificationModel.updateMany({recipient:req.user.userId},{isRead:true});
        if(!result || result.matchedCount===0){
            return res.status(404).json({
                success:false,
                message:"No notifications found"
            })
        }
        res.status(200).json({
            success:true,
            message:`${result.modifiedCount} is marked as read`,
            matchedCount:result.matchedCount,
            modifiedCount:result.modifiedCount
        })
              
    }catch(error){
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
})

router.put('/notifications/settings',verifyAccessToken,async(req,res)=>{
    try{
        const settings=req.body;
        if(Object.keys(settings).length===0){
            return res.status(400).json({
                success:false,
                message:'Update feilds missing'
            })
        }
        const updateSettings=await notificationSettingsModel.findOneAndUpdate({userId:req.user.userId},{$set:settings},{new:true,upsert:true})
        res.status(200).json({
            success:true,
            data:updateSettings
        })
    }catch(error){
        res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
})
export default router;