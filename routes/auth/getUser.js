import express from 'express';
import verifyAccessToken from '../../middlewares/verifyAccessToken.js';
import userModel from '../../database/schema/authSchema/userSchema.js';

const router = express.Router();

router.get('/auth/me',verifyAccessToken, async (req,res)=>{
    try{
        
        const user =await userModel.findOne({_id:req.user.userId});
        if(!user) return res.status(400).json({error:'Bad request'});
        responseJson={
            success:true,
            data:user
        }
        return res.status(201).json(responseJson);
    }
    catch(err){
        return res.status(500).json({error:err})
    }
})

router.put('/auth/me',verifyAccessToken,async(req,res)=>{
     try{
              
        delete updatedUser.password;
        if(JSON.stringify(updatedUser).length===0) return res.status(400).json({message:'No valid field to update'})
        const storeUpdatedUser=await userModel.findOneAndUpdate({_id:req.user.userId},{$set:{updatedUser}},{new:true});
        return res.status(200).json({user:storeUpdatedUser});
     }catch(err){
        return res.status(500).json({ error: "Server error" });
     }
})

export default router;
