import express from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.js";
import getUserChats from "../../middlewares/chatsMiddleware/getUserChats.js";
import chatVerification from '../../middlewares/chatsMiddleware/chatVerification.js';
import messageModel from '../../database/schema/chatSchema/messageSchema.js'
const router=express.Router();

router.get('/chats',verifyAccessToken,getUserChats,async(req,res)=>{
    try{
        const chat=req.chat;
        const responseJson={
            success:true,
            data:chat
        };
        res.status(200).json(responseJson)
        }catch(error){
            res.status(500).json({error:'Internal server error'})
    }
})

router.get('/chats/:chatId/messages',verifyAccessToken,chatVerification,async(req,res)=>{
    try{
        let {page,limit}=req.query;
        const chatId=req.chat._id; 
        page=Number(page) || 1;
        limit=Math.min(Number(limit) || 50, 100);
        const skip=(page-1)*limit
        const messages=await messageModel.find({chat:chatId}).skip(skip).limit(limit).populate('chat').populate('sender').sort({createdAt:1});
        const totalMessages=await messageModel.countDocuments({chat:chatId});
        if(messages.length===0) {
            return res.status(200).json({ success:true,
                data:messages,
                page:page,
                limit:limit,
                total:totalMessages,
                hasMore:totalMessages>skip+messages.length});
        }

        res.status(200).json({
            success:true,
            data:messages,
            page:page,
            limit:limit,
            total:totalMessages,
            hasMore:totalMessages>skip+messages.length
        })       
        
    }catch(error){
        res.status(500).json({error:'Internal server error'})
    }
})

router.get('/chats/:chatId',verifyAccessToken,chatVerification,async(req,res)=>{
    try{
        res.status(200).json(req.chat);
    }catch(error){
        return res.status(500).json({error:'Internal server error'})
    }
})