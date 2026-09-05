import express from "express";
import mongoose from "mongoose";
import verifyAccessToken from "../../middlewares/verifyAccessToken.js";
import tokenModel from "../../models/authSchema/tokenSchema.js";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import env from '../../config/env.js';

const router = express.Router();

router.post("/auth/logout", verifyAccessToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { refreshToken } = req.body;
    if ( !refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Token is required",
      });
    }
    const decodedRefreshToken=jwt.verify(refreshToken,env.JWT.REFRESH);
    if(decodedRefreshToken.userId!==req.user.userId){
        return res.status(401).json({
            success: false,
            message: "token mismatch",
        });
    }
    const istokenpresent = await tokenModel.findOne({_id:decodedRefreshToken.tokenId,userId:decodedRefreshToken.userId,isRevoked:false});
    if (!istokenpresent) {
      return res.status(400).json({
        success: false,
        message: "Token has been revoked",
      });
    }
    const isTokenValid = await bcrypt.compare(
      refreshToken,
      istokenpresent.token,
    );
    if(!isTokenValid){
        return res.status(400).json({
            success:false,
            message:'Invalid token'
        })
    }

    await tokenModel.findByIdAndUpdate(
      decodedRefreshToken.tokenId,
      { $set: { isRevoked: true } },
      { new: true },
    );
    return res.status(200).json({
      success: true,
      message: "successfully logged out",
    });
  } catch (error) {
    if(
        error.name === "TokenExpiredError" ||
        error.name === "JsonWebTokenError"
    ){
        return res.status(401).json({
            success:false,
            message:"Invalid refresh token"
        });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

export default router;
