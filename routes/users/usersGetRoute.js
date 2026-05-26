import express, { response } from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.js";
import userValidation from "../../middlewares/userValidation.js";
import userModel from "../../database/schema/authSchema/userSchema.js";
import followerModel from "../../database/schema/followSchema/followerShema.js";
import followingModel from "../../database/schema/followSchema/followingSchema.js";
const router = express.Router();


router.get('/users/search',verifyAccessToken,userValidation,async(req,res)=>{
    try{
        let {query,department,academicYear,college,page ,limit}=req.query;
        if(!query && !department){
            return res.status(400).json({error:'missing fields'})
        }
        let searchJson={};
        if(department) searchJson.department=department;
        if(query) searchJson.$or = [
        { userName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { displayName: { $regex: query, $options: "i" } }];
        if(academicYear) searchJson.academicYear=academicYear;
        if(college) searchJson.college=college;
        page = Math.max(1, Number(page) || 1);
        limit = Math.max(1, Number(limit) || 20);;
        const skip=(page-1)*limit
        const user=await userModel.find(searchJson).skip(skip).limit(limit);
        if(user.length===0){
            return res.status(500).json({error:'Internal server error'})
        }
        let totalUsers=await userModel.find(searchJson)
        let totalPages=Math.ceil(totalUsers.length/limit)
        let responseJson={
            success:true,
            data:user,
            page:page,
            limit:limit,
            totalPages:totalPages,
            hasMore:totalPages>page ? true:false
        }

        res.status(200).json(responseJson)

    }catch(error){
        res.status(500).json({error:'Internal server error '})
    }
})
router.get('/users/:userId/followers',verifyAccessToken,userValidation,async(req,res)=>{
    try{
        const client=req.user;
        const targetUserId=req.presentUser._id;
        let {page,limit}=req.query;
        page=Math.max(1,Number(page)||1);
        limit=Math.max(1,Number(limit)||20)
        let skip=(page-1)*limit
        const followers=await followerModel.find({userId:targetUserId}).skip(skip).limit(limit)
        const totalFollowers=await followerModel.countDocuments({userId:targetUserId});
        const totalPages=Math.ceil(totalFollowers/limit);
        let responseJson={
            success:true,
            data:followers,
            page:page,
            limit:limit,
            totalPages:totalPages,
            hasMore:totalPages>page
        }
        res.status(200).json(responseJson);
    }catch(error){
        res.status(500).json({error:'Internal server error '})
    }
})
router.get('/user/:userId/followings',verifyAccessToken,userValidation,async(req,res)=>{
    try{
        const targetUserId=req.presentUser._id;
        let {page,limit}=req.query;
        page=Math.max(1,Number(page)||1);
        limit=Math.max(1,Number(limit)||20)
        let skip=(page-1)*limit
        const followings=await followingModel.find({userId:targetUserId}).skip(skip).limit(limit)

        const totalFollowings=await followingModel.countDocuments({userId:targetUserId});
        const totalPages=Math.ceil(totalFollowings/limit);
        let responseJson={
            success:true,
            data:followings,
            page:page,
            limit:limit,
            totalPages:totalPages,
            hasMore:totalPages>page
        }
        res.status(200).json(responseJson);
    }catch(error){
        res.status(500).json({error:'Internal server error '})
    }

})

 
router.get('/users/:userId/is-following',verifyAccessToken,userValidation,async(req,res)=>{
    try{
        const targetUser=req.presentUser._id.toString();
        const client =req.user.userId;
        if(targetUser===client) return res.status(200).json({success:true,isFollowing:false})
        const isFollowing=await followingModel.findOne({userId:client,followingId:targetUser});
        if(!isFollowing)return res.status(200).json({success:true,isFollowing:false})
        req.status(200).json({success:true,data:{isFollowing:true}})
    }catch(error){
        return res.status(500).json({error:'Internal server error'})
    }
})
router.get('/users/:userId',verifyAccessToken,userValidation,async(req,res)=>{
    try{
        let presentUserData=req.presentUser;
        const responseJson={
            success:true,
            data:presentUserData
        }
        if(req.user.userId!==req.presentUser._id.toString()){
            delete responseJson.data.email;
            return res.status(200).json(responseJson)
        }
        
        return res.status(200).json(responseJson);
    }catch(error){
        res.status(500).json({error:'Internal server error '})
    }
})

export default router;