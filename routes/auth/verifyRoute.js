import express from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.js";

const router =express.Router();
router.get('/auth/verify',verifyAccessToken,(req,res)=>{
    try{
        res.status(200).json({success:true,message:'Token is valid'});
    }catch(error){
        res.status(500).json({error:'Internal server error'})
    }
})

export default router;
