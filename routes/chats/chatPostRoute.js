import express from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.js";
import mongoose from "mongoose";
import chatModel from "../../database/schema/chatSchema/chatSchema.js";
import chatVerification from "../../middlewares/chatsMiddleware/chatVerification.js";
import messageModel from "../../database/schema/chatSchema/messageSchema.js";
chatVerification
const router=express.Router();

// router.post('/chats/dm',verifyAccessToken,async (req,res)=>{
//     try{
//         const {participantId}=req.body;
//         if(!participantId){
//             return res.status(400).json({error:'Missing field'});
//         }
//         if(!mongoose.Types.ObjectId.isValid(participantId)){
//             return res.status(400).json({error:'Invalid field provided'})
//         }
//         let chatObject={
//             type:'dm',
//             participants:participantId,
//             lastMessage:
//         }
//         const chat=await chatModel.create({})
//     }catch(error){
//         res.status(500).json({error:'Internal server error'})
//     }
// })
router.post('/chats/group',verifyAccessToken,async (req,res)=>{
    try{
        const {name,description,memberIds}=req.body;
        if(!name ||!memberIds){
            return res.status(400).json({
                success:false,
                message:'Necessary fields are missing'
            })
        }
        
        let chatObject={
            type:'dm',
            description:description? description:'',
            participants:participantId,            
        }

        const createdChat=await chatModel.create(chatObject);
        res.status(200).json(createdChat);
    }catch(error){
        res.status(500).json({
            success:true,
            message:'Intenal server error'
        })
    }
}) 

router.post('/chats/:chatId/messages',verifyAccessToken,chatVerification,async(req,res)=>{
    try{
        //Request body check
        const chat=req.body;
        if(Object.keys(chat).length===0){
            return res.status(400).json({
                success:false,
                message:'text field is empty'
            })
        }
        const message=await messageModel.create({
            chatId:chatId,
            sender:req.user.userId,
            text:chat.text,
            type:chat.type,
        })
        res.status(200).json(message)
    }catch(error){
        res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
})

router.post('/chats/:chatId/read',verifyAccessToken,chatVerification,async (req,res)=>{
    try{
        const chat=req.chat;
        
    }catch(error){

    }
})