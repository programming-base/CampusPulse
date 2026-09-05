import express from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.js";
import userModel from "../../models/authSchema/userSchema.js";
import validator from 'validator'
const router = express.Router();

router.get("/auth/me", verifyAccessToken, async (req, res) => {
  try {
    const user = await userModel.findOne({ _id: req.user.userId });
    if (!user) return res.status(400).json({ error: "Bad request" });
    let responseJson = {
      success: true,
      data: user,
    };
    return res.status(200).json(responseJson);
  } catch (err) {
    return res.status(500).json({ error: err });
  }
});

router.put("/auth/me", verifyAccessToken, async (req, res) => {
  try {
    const reqBody=req.body;
    if(Object.keys(reqBody).length===0){
        return res.status(400).json({
            success:false,
            message:'Update fields are missing'
        })
    }

   if (reqBody.photoURL && !validator.isURL(reqBody.photoURL)) {
      return res.status(400).json({
        success: false,
        message: "Incorrect image url format",
      });
    }

    if (reqBody.email && !validator.isEmail(reqBody.email)) {
      return res.status(400).json({
        success: false,
        message: "Incorrect email format",
      });
    }
    
    const storeUpdatedUser = await userModel.findOneAndUpdate(
      { _id: req.user.userId },
      { $set:reqBody},
      { new: true },
    );
    res.status(200).json({ 
        success:true,
        data: storeUpdatedUser 
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

export default router;
