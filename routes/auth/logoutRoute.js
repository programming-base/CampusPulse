import express from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.js";
import tokenModel from "../../database/schema/authSchema/tokenSchema.js";
import bcrypt from "bcrypt";
const router = express.Router();

router.post("/auth/logout", verifyAccessToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tokenId, refreshToken } = req.body;
    if (!tokenId || !refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Token information is missing",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(tokenId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid tokenId" });
    }

    const istokenpresent = await tokenModel.findOne({_id:tokenId,userId:req.user.userId,isRevoked:false});
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

    await tokenModel.findByIdAndUpdate(
      tokenId,
      { $set: { isRevoked: true } },
      { new: true },
    );
    return res.status(200).json({
      success: true,
      message: "successfully logged out",
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
