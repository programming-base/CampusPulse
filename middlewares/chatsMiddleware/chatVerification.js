import mongoose from "mongoose";
import chatModel from '../../models/chatSchema/chatSchema.js'

const chatVerification=async(req,res,next)=>{
    try{
        const {chatId}=req.params;
        const userID=req.user.userId
        if(!chatId){
            return res.status(400).json({error:'Chat ID missing'})
        }
        if(!mongoose.Types.ObjectId.isValid(chatId)){
            return res.status(400).json({error:'Invalid chat ID'});
        }
        const isChatPresent=await chatModel.findOne({_id:chatId,participants:userID});
        if(!isChatPresent) return res.status(404).json({error:'Chat not found'});
        req.chat=isChatPresent;
        next();
    }catch(error){
        res.status(500).json({error:'Internal server error'})                                                                                                                  
    }

}
export default chatVerification;
