import express from "express";
import cloudinary,{uploadBufferToCloudinary,upload} from "./cloudinary.js";
import verifyAccessToken from "../../middlewares/verifyAccessToken.js";
const router=express.Router();

router.post('/uploads/chat-image',verifyAccessToken,upload.single('image'),async(req,res)=>{

    try{
        if(!req.file){
        return res.status(400).json({error:'No file to upload'})
        }
        const Upload=await uploadBufferToCloudinary(req.file.buffer,`campuspulse/chat-image/${req.user.userId}`)

        res.status(200).json({
            success:true,
            data:{
                url:Upload.secure_url
            }
        })
    }catch(error){
        res.status(500).json({error:'Internal server error'})
    }
    
})

export default router;