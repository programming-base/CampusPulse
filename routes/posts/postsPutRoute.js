import express from 'express';
import verifyAccessToken from '../../middlewares/verifyAccessToken.js';
import postModel from '../../models/postsSchema/postSchema.js';
import postValidation from '../../middlewares/postValidation.js';
const router =express.Router();

router.put('/posts/:postId',verifyAccessToken,postValidation,async(req,res)=>{
    try{
        const postId=req.post._id;
        if(req.post.userId.toString()!==req.user.userId){
            return res.status(403).json({error:'Unauthorized'});
        }
        const {content,imageUrl}=req.body;
        if(!content && !imageUrl){
            return res.status(400).json({error:'No field to update'})
        }
        const updatePost={}
        if(content) updatePost.content=content;
        if(imageUrl) updatePost.imageUrl=imageUrl;
        const updatedPost=await postModel.findByIdAndUpdate(postId,{$set:updatePost},{new:true})
        res.status(200).json(updatedPost);
    }catch(error){
        return res.status(500).json({error:'Internal server error'})
    }
})

export default router; 