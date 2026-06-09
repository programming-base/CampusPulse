import express from 'express';
import verifyAccessToken from '../../middlewares/verifyAccessToken.js';
import postModel from '../../database/schema/postsSchema/postSchema.js';
import userModel from '../../database/schema/authSchema/userSchema.js';
import commentModel from '../../database/schema/postsSchema/commentSchema.js'
import likeModel from '../../database/schema/postsSchema/likeSchema.js';
import postValidation from '../../middlewares/postValidation.js';
const router=express.Router();
router.post('/posts',verifyAccessToken,async(req,res)=>{
    try{
        const {content,isAnonymous,visibilityScope,imageUrl}=req.body;
        if(!content || !visibilityScope){
            return res.status(400).json({error:'Insufficient information'})
        }
        const userData=req.user;
        const userInDB=await userModel.findById(userData.userId,{password:0})
        if(!userInDB){
            return res.status(404).json({error:'user not found'})
        }
        let post={
                userId:userData.userId,
                content:content,
                visibilityScope:visibilityScope,
                imageUrl:imageUrl,
                department:userInDB.department,
                academicYear:userInDB.academicYear,
                likeCount:0,
                commentCount:0,
            }
        post.isAnonymous=isAnonymous??false;
        if(!isAnonymous){
            post.userName=userName;
        }
        const createdPost=await postModel.create(post);
        res.status(201).json(createdPost);
    }catch(erro){
        return res.status(500).json({error:"Internal server error"})
    }
})

router.post('/posts/:postId/comments',verifyAccessToken,postValidation,async(req,res)=>{
    try{
        const postId=req.post._id;
        const {content}=req.body;
        if(!content){
            return res.status(400).json({error:'some field might be missing'})
        }
        
        let comment={
            userId:req.user.userId,
            postId:postId,
            content:content,
        }
        const createdComment=await commentModel.create(comment);
        const incrementCommentCount=await postModel.updateOne({_id:postId},{$inc:{commentCount:1}});
        if(incrementCommentCount.modifiedCount===0){
            await commentModel.findByIdAndDelete(createdComment._id)
            return res.status(500).json({error:'Internal server error '})
        }
        res.status(201).json(createdComment);

    }catch(error){
        return res.status(500).json({error:'Internal server error'})
    }
    
})


router.post('/posts/:postId/like',verifyAccessToken,postValidation,async (req,res)=>{
    try{
        const postId=req.post._id;
        const alreadyLiked=await likeModel.findOne({userId:req.user.userId,postId:postId,targetType:'post'});
        if (alreadyLiked) return res.status(400).json({error:'Already liked'});
        let likeStructure={
            targetId:postId,
            userId:req.user.userId,
            targetType:'post'
        }
        const createdLikeStructure=await likeModel.create(likeStructure)
        const postLikeIncreament=await postModel.findByIdAndUpdate(postId,{$inc:{likeCount:1}},{new:true})
        if(!postLikeIncreament){
            await likeModel.findByIdAndDelete(createdLikeStructure._id)
            return res.status(500).json({error:"Internal server error"})
        }
        const responseJson={
            success:true,
            data:{
                likeCount:postLikeIncreament.likeCount
            }
        }
        res.status(201).json(responseJson)
    }catch(error){
        return res.status(500).json({error:'Internal server error'})
    }
})
export default router;