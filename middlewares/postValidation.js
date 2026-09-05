import mongoose from 'mongoose';
import postModel from '../models/postsSchema/postSchema.js';

const postValidation=async(req,res,next)=>{
    try{
        const {postId}=req.params;
        if(!postId){
            return res.status(404).json({error:'post ID not found'})
        }
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ error: "Invalid postId" });
        }
        const post=await postModel.findById(postId)
        if(!post){
            return res.status(404).json({error:"Post not found"})
        }
        req.post=post
        next();
    }catch(error){
        return res.status(500).json({error:'Internal server error'})
    }
}
export default postValidation;