import express from "express";
import JWT from "jsonwebtoken";
import verifyRefreshToken from "../../middlewares/verifyRefreshToken.js";
const router = express.Router();
router.post("/auth/refresh", verifyRefreshToken, async (req, res) => {
  try {
    const data = req.user;
    const newToken = JWT.sign(
      {
        userId: data.userId,
        email: data.email,
        type: "access",
      },
      process.env.JWT_ACCESS,
      { expiresIn: "5m" },
    );
    if (!newToken) {
      return res.status(500).json({
        success: false,
        message: "Token generation failed",
      });
    }
    res.status(200).json({
      success: true,
      accesToken: newToken,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Token generation failed",
      error:error.message
    });
  }
});

export default router;
