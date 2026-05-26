import express from 'express';
import verifyToken from '../../middlewares/verifyAccessToken.js'
import tokenModel from '../../database/schema/authSchema/tokenSchema.js';

const router=express.Router();

router.get('/auth/logout',verifyToken,async (req,res)=>{
    try{
        let authToken=req.headers.authorization;
        authToken=authToken.split(' ')[1]
        const istokenpresent=await tokenModel.findOne({userId:req.user.userId,token:authToken});
        console.log(istokenpresent);
        if(istokenpresent){
            return res.status(400).json({message:'Token has been revoked'})
        }
        await tokenModel.updateOne({userId:req.user.userId},{$push:{token:authToken}},{upsert:true}); 
        return  res.status(200).json({message:'successfully logged out'})
    }
    catch(err){
        return res.status(500).json({error:err})
    }
})
export default router;