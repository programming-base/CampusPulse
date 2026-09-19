import express from "express";
import followModel from "../../models/followSchema/followSchema.js";
import verifyAccessToken from "../../middlewares/verifyAccessToken.js";
import userValidation from '../../middlewares/userValidation.js'

const router = express.Router();

router.post('/users/:userId/follow',verifyAccessToken,userValidation,async (req,res)=>{
    try{
        const targetUser=req.presentUser._id.toString();
        const client=req.user.userId.toString();
        if (targetUser === client) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }
        const isAlreadyFollowing=await followModel.findOne({followerId:client,followingId:targetUser});
        if(isAlreadyFollowing){
            return res.status(400).json({error:'Already following this user'});
        }
        await followModel.create({followerId:client,followingId:targetUser});
        res.status(200).json({success:true,message:'User followed'});
    }catch(error){
        res.status(500).json({
            success:false,
            error:'Internal server error'
        });
    }
})



export default router;