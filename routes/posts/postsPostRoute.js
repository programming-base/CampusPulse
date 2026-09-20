import express from 'express';
import verifyAccessToken from '../../middlewares/verifyAccessToken.js';
import postModel from '../../models/postsSchema/postSchema.js';
import userModel from '../../models/authSchema/userSchema.js';
import commentModel from '../../models/postsSchema/commentSchema.js'
import likeModel from '../../models/postsSchema/likeSchema.js';
import postValidation from '../../middlewares/postValidation.js';
import mongoose from 'mongoose';
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
            return res.status(404).json({
                success:false,
                message:'User not found'
            })
        }
        let post={
                userId:userData.userId,
                content:content,
                visibilityScope:visibilityScope,
                imageUrl:imageUrl,
                college:userInDB.college,
                department:userInDB.department,
                academicYear:userInDB.academicYear,
                likeCount:0,
                commentCount:0,
            }
        post.isAnonymous=isAnonymous??false;
        if(!isAnonymous){
            post.userName=userInDB.userName;
        }
        const createdPost=await postModel.create(post);
        res.status(201).json(createdPost);
    }catch(erro){
        return res.status(500).json({error:"Internal server error"})
    }
})

router.post('/posts/:postId/comments',verifyAccessToken,postValidation,async(req,res)=>{
    const session=await mongoose.startSession();
    try{
        session.startTransaction();
        const postId=req.post._id;
        const {content}=req.body;
        if(!content){
            await session.abortTransaction();
            return res.status(400).json({
                success:false,
                error:'Some field might be missing'
            })
        }
        
        let comment={
            userId:req.user.userId,
            postId:postId,
            content:content,
        }
        const [createdComment]=await commentModel.create([comment],{session});
        const updatedPost=await postModel.findByIdAndUpdate(postId,{$inc:{commentCount:1}},{session,new:true});
        if(!updatedPost){
            await session.abortTransaction();
            return res.status(404).json({
                status:false,
                error:'Post not found'
            })
        }
        await session.commitTransaction();
        res.status(201).json({
            success:true,
            data:createdComment
        });

    }catch(error){
        await session.abortTransaction();
        res.status(500).json({
            status:false,
            error:'Internal server error'
        })
    }finally{
        session.endSession();
    }
    
})


router.post('/posts/:postId/like',verifyAccessToken,postValidation,async (req,res)=>{
    const session=await mongoose.startSession();
    try{
        session.startTransaction();
        const postId=req.post._id;
        const alreadyLiked=await likeModel.findOne({userId:req.user.userId,targetId:postId,targetType:'post'}).session(session);
        if (alreadyLiked) {
            await session.abortTransaction();
            return res.status(400).json({
                status:false,
                error:'Already liked'
            })
        }
        let likeObj={
            targetId:postId,
            userId:req.user.userId,
            targetType:'post'
        }
        const [createdLike]=await likeModel.create([likeObj],{session});
        const postLikeIncreament=await postModel.findByIdAndUpdate(postId,{$inc:{likeCount:1}},{new:true,session})
        if(!postLikeIncreament){
            return res.status(404).json({
                status:false,
                error:"Post not found"
            })
        }
        const responseJson={
            success:true,
            data:{
                likeCount:postLikeIncreament.likeCount
            }
        }
        await session.commitTransaction();
        res.status(201).json(responseJson)
    }catch(error){
        await session.abortTransaction();
        res.status(500).json({
            status:false,
            error:'Internal server error'
        })
    }finally{
        session.endSession();
    }
})
export default router;