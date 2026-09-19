import JWT from 'jsonwebtoken';
import userModel from '../models/authSchema/userSchema.js';
import env from '../config/env.js';

const verifyAccessToken= async (req,res,next)=>{
    try{
        const authHeader=req.headers.authorization;
        if(!authHeader || !authHeader.startsWith('Bearer ')){
            return res.status(401).json({error:'Token is missing'})
        }
        const token = authHeader.split(' ')[1];
        let verify;
        verify=JWT.verify(token,env.JWT.ACCESS);
        if(verify.type !=='access'){
            return res.status(401).json({error:'Invalid token'})
        }
        const isUser=await userModel.findById(verify.userId,{password:0});
        if(!isUser){
            return res.status(400).json({error:'User not found'})
        }
        req.userProfile=isUser;
        req.user=verify;
        next();
    }catch(err){
        if(err.name==='JsonWebTokenError'){
            return res.status(401).json({error:"Invalid token"})
        }
        if(err.name==='TokenExpiredError'){
            return res.status(401).json({error:'session expired'})
        }
        return res.status(500).json({error:err.name})   
    }
}

export default verifyAccessToken;