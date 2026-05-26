import chatModel from '../../database/schema/chatSchema/chatSchema.js'

const getUserChats= async (req,res,next)=>{
    try{
        const user=req.user.userId;
        const isChatPresent=await chatModel.find({participants:user}).populate('participants');
        if(isChatPresent.length===0){
            return res.status(404).json({error:'Chat not found'});
        }
        req.chat=isChatPresent;
        next();
    }catch(error){
        return res.status(500).json({error:'Internal server error'});
    }
}

export default getUserChats;