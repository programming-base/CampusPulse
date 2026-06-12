import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
import userModel from '../../database/schema/authSchema/userSchema.js';
import tokenModel from '../../database/schema/authSchema/tokenSchema.js'
const router=express.Router();

router.post('/auth/login',async (req,res)=>{
    const {email,password}=req.body;
    if(!email || !password) {
        return res.status(400).json({error:'Please enter valid credentials'})
    }
    try{
        const user=await userModel.findOne({email:email});
        if(!user){
            return res.status(401).json({error:"email doesn't exists"})
        }
        let checkPassword=await bcrypt.compare(password,user.password)
        if(!checkPassword){
            return res.status(401).json({error:'Invalid password'})
        }
        const refreshToken=jwt.sign({
            userId:user._id,
            email:email,
            type:'refresh'
        },process.env.JWT_REFRESH,{expiresIn:'7d'})

        if(!refreshToken){
            return res.status(500).json({error:'Internal server error'})
        }
        const hashedToken=await bcrypt.hash(refreshToken,10);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const jsonToken={
            userId:user._id,
            token:hashedToken,
            type:'refresh',
            createdAt:Date.now(),
            expiresIn:expiresAt
        }
        const storeToken=await tokenModel.create(jsonToken);
        if(!storeToken){
            return res.status(404).json({
                success:false,
                message:'Token not found please login again'
            })
        }
        const accessToken=jwt.sign({
            tokenId:storeToken._id,
            userId:user._id,
            email:email,
            type:'access'
        },process.env.JWT_ACCESS,{expiresIn:'5m'})
        if(!accessToken){
            return res.status(500).json({
                success:false,
                message:'Internal server error'
            })
        }
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