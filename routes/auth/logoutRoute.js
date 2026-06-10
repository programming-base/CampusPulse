import express from 'express';
import verifyAccessToken from '../../middlewares/verifyAccessToken.js'
import tokenModel from '../../database/schema/authSchema/tokenSchema.js';
import bcrypt from 'bcrypt'
const router=express.Router();

router.post('/auth/logout',verifyAccessToken,async (req,res)=>{
    try{
        const headers=req.headers.authorization
        let token=headers?.split(' ')[1]
        if(!token){
            return res.status(400).json({
                success:false,
                message:'missing token'
            })
        }
        let hashedToken=await bcrypt.hash(token,10);
        const istokenpresent=await tokenModel.findOne({userId:req.user.userId,token:hashedToken});
        if(!istokenpresent){
            return res.status(400).json({
                success:false,
                message:'Token has been revoked'
            })
        }
        await tokenModel.updateOne({userId:req.user.userId,token:hashedToken},{$set:{isRevoked:true}},{new:true}); 
        return  res.status(200).json({
            success:true,
            message:'successfully logged out'
        })
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:'Internal server error',
            error:error.message
        })
    }
})
export default router;