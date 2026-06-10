import express from 'express';
import verifyAccessToken from '../../middlewares/verifyAccessToken.js';
import postModel from '../../database/schema/postsSchema/postSchema.js';
import postValidation from '../../middlewares/postValidation.js';
import commentModel from '../../database/schema/postsSchema/commentSchema.js';
const router=express.Router();

router.get('/posts',verifyAccessToken,async(req,res)=>{ 
    let {page=1,limit=10,scope,department,academicYear}=req.query;

    page=Number(page);
    limit=Number(limit);
    page = page > 0 ? page : 1;
    limit = limit > 0 ? limit : 10;
    const Skip=(page-1)*limit;
    let filter={};
    if(scope){
        filter.visibilityScope=scope;
    }
    if(department){
        filter.department=department;
    }
    if(academicYear){
        filter.academicYear=Number(academicYear)
    }
    const posts=await postModel.find(filter).skip(Skip).limit(limit);

    const totalCount=await postModel.countDocuments(filter);
    const responseJson={
        items:posts,
        page:page,
        limit:limit,
        total:totalCount,
        totalPages:Math.ceil(totalCount/limit),
        hasMore: page < totalCount
    }
    res.status(200).json({success:true,data:responseJson})
})

router.get('/posts/:postId',verifyAccessToken,postValidation,async(req,res)=>{

    try{
        const postData=req.post;
        res.status(200).json({postData});
    }catch(error){
        res.status(500).json({error:'Internal server error'})
    }
})

router.get('/posts/:postId/comments',verifyAccessToken,postValidation,async (req,res)=>{
    try{
        const postId=req.post._id;
        let {page=1,limit=10}=req.query;
        if(page) page=Number(page);
        if(limit) limit=Number(limit);
        const skip=(page-1)*limit;
        const paginatedComments=await commentModel.find({postId:postId}).skip(skip).limit(limit).sort({createdAt:-1});
        res.status(200).json(paginatedComments);
    }catch(error){
        return res.status(500).json({error:'Internal server error'})
    }
})
export default router;