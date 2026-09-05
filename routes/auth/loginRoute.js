import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userModel from '../../models/authSchema/userSchema.js';
import tokenModel from '../../models/authSchema/tokenSchema.js';
import mongoose from 'mongoose';
import env from '../../config/env.js';

const router=express.Router();

router.post('/auth/login',async (req,res)=>{
    const {email,password}=req.body;
    if(!email || !password) {
        return res.status(400).json({error:'Please enter valid credentials'})
    }
    try{
        const user=await userModel.findOne({email:email});
        if(!user){
            return res.status(401).json({error:"Invalid credentials"})
        }
        let checkPassword=await bcrypt.compare(password,user.password)
        if(!checkPassword){
            return res.status(401).json({error:'Invalid credentials'})
        }
        const tokenId=new mongoose.Types.ObjectId();
        const refreshToken=jwt.sign({
            tokenId:tokenId,
            userId:user._id,
            email:email,
            type:'refresh'
        },env.JWT.REFRESH,{expiresIn:'7d'})
        const hashedToken=await bcrypt.hash(refreshToken,10);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const jsonToken={
            _id:tokenId,
            userId:user._id,
            token:hashedToken,
            type:'refresh',
            createdAt:new Date(),
            expiresIn:expiresAt
        }
        const storeToken=await tokenModel.create(jsonToken);

        const accessToken=jwt.sign({
            userId:user._id,
            email:email,
            type:'access'
        },env.JWT.ACCESS,{expiresIn:'5m'})
        res.status(200).json({
            success:true,
            message:'logged in successfully',
            refreshToken,
            accessToken
        })
    }catch(error){
        res.status(500).json({
            success:false,
            message:'Internal server error',
            error:error.message
        })
    }
})

export default router;