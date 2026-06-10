import express from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.js";
import mongoose from "mongoose";
import userModel from "../../database/schema/authSchema/userSchema.js";

const router = express.Router();

router.put("/users/me", verifyAccessToken, async (req, res) => {
  try {
    const client = req.user;
    const newData = req.body;
    if (!newData)
      return res.status(400).json({
        success:false,
        message: "Insufficient Information",
      });
    if(newData.password){
        return res.status(400).json({
        success:false,
        message: "Password change is not supported by this route",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(client.userId)){
      return res.status(400).json({
        success:false,
        message:"Invalid user ID" });
    }
    const isClientPresent = await userModel.findById(client.userId);
    if (!isClientPresent)
      return res.status(500).json({ error: "Internal server error" });

    const updateUserdata = await userModel.findByIdAndUpdate(
      client.userId,
      newData,
      { new: true },
    );
    if (!updateUserdata){
        return res.status(404).json({
            success:false,
            message:'User not found'
        });
    }
    res.status(200).json({
        success:true,
        data:updateUserdata
    });
  } catch (error) {
    res.status(500).json({
        success:false,
        message:'Internal servert error',
        error:error.message
    });
  }
});

export default router;
