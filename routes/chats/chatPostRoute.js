import express, { text } from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.js";
import mongoose from "mongoose";
import chatModel from "../../models/chatSchema/chatSchema.js";
import chatVerification from "../../middlewares/chatsMiddleware/chatVerification.js";
import messageModel from "../../models/chatSchema/messageSchema.js";
import userModel from "../../models/authSchema/userSchema.js";
chatVerification;
const router = express.Router();

router.post("/chats/group", verifyAccessToken, async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;
    if (!name || !memberIds) {
      return res.status(400).json({
        success: false,
        message: "Necessary fields are missing",
      });
    }

    let chatObject = {
      type: "group",
      description: description ? description : "",
      participants: memberIds,
    };

    const createdChat = await chatModel.create(chatObject);
    res.status(200).json(createdChat);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Intenal server error",
    });
  }
});

// message document creation for chat
router.post(
  "/chats/dm/messages/:userId",
  verifyAccessToken,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const messageData = req.body;
      if (!messageData.text?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Message text is required",
        });
      }
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid chat ID or user ID",
        });
      }
      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "user does not exist",
        });
      }
      let chat = await chatModel.findOne({
        type: "dm",
        participants: {
          $all: [req.user.userId, userId],
        },
      });

      if (!chat) {
        const newChat = await chatModel.create({
          type: "dm",
          participants: [req.user.userId, userId],
        });

        chat = newChat;
      }
      const message = await messageModel.create({
        chatId: chat._id,
        sender: req.user.userId,
        text: messageData.text,
        type: messageData.type,
      });
      const updateChat = await chatModel.findByIdAndUpdate(
        chat._id,
        {
          $set: {
            lastMessage: message._id,
          },
        },
        { new: true },
      );
      if (!updateChat) {
        await messageModel.findByIdAndDelete(message._id);
        return res.status(404).json({
          success: false,
          message: "Chat does not exist",
        });
      }
      res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },
);

//message document creation for group chat
router.post(
  "/chats/:chatId/messages",
  verifyAccessToken,
  chatVerification,
  async (req, res) => {
    try {
      //Request body check
      const messageData = req.body;
      if (!messageData.text?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Message text is required",
        });
      }

      let messageObject = {
        chatId: req.chat._id,
        sender: req.user.userId,
        text: messageData.text,
        type: messageData.type,
      };
      const message = await messageModel.create(messageObject);

      res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },
);

router.post(
  "/chats/:chatId/messages/:messageId/read",
  verifyAccessToken,
  chatVerification,
  async (req, res) => {
    try {
      const isMember = req.chat.participants.some(
        (participant) => participant.toString() === req.user.userId,
      );
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: "Your are not a participant in this chat",
        });
      }
      const { messageId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(messageId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid message ID",
        });
      }

      const message = await messageModel.findById(messageId);
      if (!message) {
        return res.status(400).json({
          success: false,
          message: "Invalid message ID",
        });
      }

      if (message.chatId.toString() !== req.chat._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Message does not belong to this chat",
        });
      }
      await messageModel.findByIdAndUpdate(messageId, {
        $addToSet: { readBy: req.user.userId },
      });

      res.status(200).json({
        success: true,
        message: "Message marked as read",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },
);

router.post(
  "/chats/:chatId/members",
  verifyAccessToken,
  chatVerification,
  async (req, res) => {
    try {
      //Admin check
      const isAdmin = req.chat.admin.some(
        (admin) => admin.toString() === req.user.userId,
      );
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Only admin can add participants",
        });
      }

      //Members check
      const { memberIds } = req.body;
      if (!Array.isArray(memberIds) || memberIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please mention participants IDs",
        });
      }
      let validMembers = memberIds.filter((memberId) =>
        mongoose.Types.ObjectId.isValid(memberId),
      );

      //checking if there are invalid member IDs
      const members = await userModel.find({
        _id: {
          $in: validMembers,
        },
      });
      if (members.length !== validMembers.length) {
        return res.status(400).json({
          success: false,
          message: "One or more users does not exist",
        });
      }
      //Updating participants field with valid members in the chat document
      const chat = await chatModel.findByIdAndUpdate(req.chat._id, {
        $addToSet: {
          participants: {
            $each: validMembers,
          },
        },
      });
      if (!chat) {
        return res.status(404).json({
          success: false,
          message: "chat does not exist",
        });
      }

      //sending a response
      res.status(200).json({
        success: true,
        message: "Participants Added",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },
);
router.post(
  "/chats/:chatId/leave",
  verifyAccessToken,
  chatVerification,
  async (req, res) => {
    try {
      const isMember = req.chat.participants.some(
        (participant) => participant.toString() === req.user.userId,
      );

      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this group chat",
        });
      }

      // Admin leave handling
      const isAdmin = req.chat.admin.some(
        (admin) => admin.toString() === req.user.userId,
      );
      if (isAdmin) {
        if (req.chat.admin.length === 1) {
          return res.status(400).json({
            success: false,
            message: "Please choose Admin first",
          });
        }
        await chatModel.findByIdAndUpdate(req.chat._id, {
          $pull: {
            participants: req.user.userId,
            admin: req.user.userId,
          },
        });
        return res.status(200).json({
          success: true,
          message: "You left the group",
        });
      }
      //Regular leave handling
      await chatModel.findByIdAndUpdate(req.chat._id, {
        $pull: {
          participants: req.user.userId,
        },
      });
      res.status(200).json({
        success: true,
        message: "You left the group",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);
export default router;