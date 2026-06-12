import JWT from 'jsonwebtoken'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import tokenModel from "../database/schema/authSchema/tokenSchema.js";
const verifyRefreshToken= async(req,res,next)=>{
    try{
        const authHeader=req.headers.authorization;
        if(!authHeader || !authHeader.startsWith('Bearer ')) return res.status(400).json({error:'Token not found'})
        const token=authHeader.split(' ')[1];
        let verify=JWT.verify(token,process.env.JWT_REFRESH);
        if(!verify || verify.type !=='refresh'){
            return res.status(400).json({error:'Invalid token'})
        }
        if(!mongoose.Types.ObjectId.isValid(verify.userId)){
            return res.status(400).json({error:"Token invalid id"});
        }
        const checkToken = await tokenModel.findOne({_id:verify.tokenId,userId:verify.userId,type:'refresh',isRevoked:false});
        if(!checkToken){
            return res.status(404).json({error:"Token not found"});
        }
        const isMatch = await bcrypt.compare(token, checkToken.token);
        if(!isMatch){
            return res.status(401).json({ error: 'Invalid token' });
        }
        // check expiration
        if (new Date(checkToken.expiresIn) < new Date()) {
            return res.status(401).json({ error: 'Refresh token expired' });
        }
        req.user=verify;
        next();
            
    }catch(error){
        if(error.name==='TokenExpiredError'){
            return res.status(401).json({ error: 'Refresh token expired' });
        }
        return res.status(401).json({ error: 'Invalid token'});   
    }
}


export default verifyRefreshToken;