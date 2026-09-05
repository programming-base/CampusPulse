import express from "express";
import verifyAccessToken from '../../middlewares/verifyAccessToken.js'
import notificationModel from "../../models/notificationSchema/notificationSchema.js";
import notificationSettingsModel from "../../models/notificationSchema/notificationSettingsSchema.js";
const router=express.Router();

router.get('/notifications',verifyAccessToken,async (req,res)=>{
    try{
        let {page,limit,unreadonly}=req.query;
        page=Math.max(1,Number(page)||1);
        limit=Math.max(1,Number(limit)||20);
        unreadonly=unreadonly==='true'; 
        let skip= (page-1)*limit;   
        let filter={
            recipient: req.user.userId
        } 
        if(unreadonly) filter.isRead=false;
        const notifications=await notificationModel.find(filter)
        .skip(skip).limit(limit).sort({ createdAt: -1 });
        const total_notifications=await notificationModel.countDocuments(filter);
        let responseJson={
            success:true,
            data:{
                items:notifications,
                page:page,
                limit:limit,
                total:total_notifications,
                hasMore:total_notifications>(page*limit)

            }
        }
        res.status(200).json(responseJson);
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
})

router.get('/notifications/unread-count',verifyAccessToken,async(req,res)=>{
    try{
        const notification_count=await notificationModel.countDocuments({recipient:req.user.userId});
        res.status(200).json({
            success:true,
            data:{
                count:notification_count
            }
        })
    }catch(error){
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
})

router.get('/notifications/settings',verifyAccessToken,async(req,res)=>{
    try{   
        const settings=await notificationSettingsModel.findOne({userId:req.user.userId}) 
        res.status(200).json({
            success:true,
            data:settings
        })
    }catch(error){
        res.status(500).json({
            success:true,
            message:'Internal server error',
            error:error.message
        })
    }
})
export default router; 