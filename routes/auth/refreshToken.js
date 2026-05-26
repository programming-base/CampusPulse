import express from 'express';
import JWT from 'jsonwebtoken'
import verifyRefreshToken from '../../middlewares/verifyRefreshToken.js';
const router = express.Router();
router.post('/auth/refresh',verifyRefreshToken,async(req,res)=>{
    try{
       
        const data=req.user;
        
        const newToken=JWT.sign({
            userId:data.userId,
            email:data.email,
            type:'access',        
        },process.env.JWT_REFRESH,{expiresIn:'10m'});
        if(!newToken){
            return res.status(500).json({error:'Internal server error'});
        }
        res.status(200).json({status:'200',token:newToken});
    }catch(error){
        return res.status(500).json({error:'Internal server error'})
    }
})

export default router;