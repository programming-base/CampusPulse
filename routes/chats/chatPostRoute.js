import express from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken";
import mongoose from "mongoose";
const router=express.Router();

router.post('/chats/dm',verifyAccessToken,async (req,res)=>{
    try{
        const {participantId}=req.body;
        if(!participantId){
            return res.status(400).json({error:'Missing field'});
        }
        if(!mongoose.Types.ObjectId.isValid(participantId)){
            return res.status(400).json({error:'Invalid field provided'})
        }
        
    }catch(error){
        res.status(500).json({error:'Internal server error'})
    }
})