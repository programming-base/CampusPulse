import express from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.js";
import chatVerification from "../../middlewares/chatsMiddleware/chatVerification.js";
import chatModel from "../../models/chatSchema/chatSchema.js";

const router = express.Router();

// modify the group chat's settings
router.put(
  "/chats/:chatId",
  verifyAccessToken,
  chatVerification,
  async (req, res) => {
    try {
      const modifications = req.body;

      if (Object.keys(modifications).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Modification fields are empty",
        });
      }
      const updatedChat = await chatModel.findByIdAndUpdate(
        req.chat._id,
        { $set: modifications },
        { new: true, runValidators: true },
      );
      if (!updatedChat) {
        return res
          .status(404)
          .json({ success: false, message: "Chat not found" });
      }

      res.json({ success: true, chat: updatedChat });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);
export default router;