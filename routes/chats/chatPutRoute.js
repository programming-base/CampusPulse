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
      const { name, description } = req.body;
      const userId = req.user.userId;

      const isAdmin = req.chat.admins.some(
        (admin) => admin.toString() === userId.toString()
      );

      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Only group admins can modify group settings",
        });
      }

      const modifications = {};

      if (name !== undefined) {
        if (typeof name !== "string" || !name.trim()) {
          return res.status(400).json({
            success: false,
            message: "Group name must be a non-empty string",
          });
        }

        modifications.name = name.trim();
      }

      if (description !== undefined) {
        if (typeof description !== "string") {
          return res.status(400).json({
            success: false,
            message: "Group description must be a string",
          });
        }

        modifications.description = description.trim();
      }

      if (Object.keys(modifications).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid group settings provided",
        });
      }

      const updatedChat = await chatModel.findByIdAndUpdate(
        req.chat._id,
        { $set: modifications },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedChat) {
        return res.status(404).json({
          success: false,
          message: "Chat not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: updatedChat,
      });
    } catch (error) {
      console.error("Update group chat error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);


export default router;