import express from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.js";
import mongoose, { startSession } from "mongoose";
import chatModel from "../../models/chatSchema/chatSchema.js";
import messageModel from "../../models/chatSchema/messageSchema.js";
import userModel from "../../models/authSchema/userSchema.js";
import chatVerification from "../../middlewares/chatsMiddleware/chatVerification.js";
import mongoose from "mongoose";
const router = express.Router();

router.post("/chats/group", verifyAccessToken, async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Group name is required",
      });
    }

    if (!Array.isArray(memberIds)) {
      return res.status(400).json({
        success: false,
        message: "memberIds must be an array",
      });
    }
    const creatorId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(creatorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid creator ID",
      });
    }

    const invalidMemberIds = memberIds.filter(
      (memberId) => !mongoose.Types.ObjectId.isValid(memberId),
    );

    if (invalidMemberIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: "One or more member IDs are invalid",
      });
    }

    const uniqueMemberIds = [
      ...new Set([
        ...memberIds.map((memberId) => memberId.toString()),
        creatorId.toString(),
      ]),
    ];

    const users = await userModel
      .find({
        _id: { $in: uniqueMemberIds },
      })
      .select("_id");

    if (users.length !== uniqueMemberIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more users do not exist",
      });
    }

    const chatObject = {
      name: name.trim(),
      type: "group",
      description: description?.trim() || "",
      creatorId: creatorId,
      admins: [creatorId],
      participants: uniqueMemberIds,
    };

    const createdChat = await chatModel.create(chatObject);
    const populatedChat = await chatModel
      .findById(createdChat._id)
      .populate("creatorId", "userName displayName photoURL")
      .populate("admins", "userName displayName photoURL")
      .populate("participants", "userName displayName photoURL");
    return res.status(201).json({
      success: true,
      data: populatedChat,
    });
  } catch (error) {
    console.error("Create group chat error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.post(
  "/chats/dm/messages/:userId",
  verifyAccessToken,
  async (req, res) => {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const { userId } = req.params;
      const messageData = req.body;

      if (!messageData.text?.trim()) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Message text is required",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      const user = await userModel.findById(userId).session(session);
      if (!user) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "User does not exist",
        });
      }

      let chat = await chatModel.findOne({
        type: "dm",
        participants: {
          $all: [req.user.userId, userId],
        },
      }).session(session);

      if (!chat) {
        // Destructure array to get the document
        const [newChat] = await chatModel.create(
          [{
            type: "dm",
            participants: [req.user.userId, userId],
          }],
          { session }
        );
        chat = newChat;
      }

      // Create message (destructure array)
      const [message] = await messageModel.create(
        [{
          chatId: chat._id,
          sender: req.user.userId,
          text: messageData.text,
          type: messageData.type,
        }],
        { session }
      );

      // Update chat with last message
      const updateChat = await chatModel.findByIdAndUpdate(
        chat._id,
        {
          $set: {
            lastMessage: message._id,
            lastActivity: Date.now()
          },
          $inc: { messageCount: 1 }
        },
        { new: true, session }
      );

      if (!updateChat) {
        throw new Error("Chat does not exist");
      }
      await session.commitTransaction();

      res.status(201).json({
        success: true,
        data: message,
      });

    } catch (error) {
      await session.abortTransaction();
      console.error("Create message error:", error);

      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    } finally {
      session.endSession();
    }
  }
);

//message document creation for group chat
router.post(
  "/chats/groupchat/:chatId/messages",
  verifyAccessToken,
  chatVerification,
  async (req, res) => {
    const session=await mongoose.startSession();
    try {
      session.startTransaction();
      //Request body check
      const messageData = req.body;
      if (!messageData.text?.trim()) {
        await session.abortTransaction();
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

      const [message] = await messageModel.create([messageObject],{session});

      const updateChat=await chatModel.findByIdAndUpdate(
        req.chat._id,
        {
          $set: {
            lastMessage: message._id,
            lastActivity: Date.now()
          },
          $inc: { messageCount: 1 } 
        },{new:true,session}
      );
      if(!updateChat){
        throw new Error("Chat does not exist")
      }
      await session.commitTransaction();
      res.status(201).json({
        success: true,
        data: message,
      });
    }catch (error) {
      await session.abortTransaction();
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      })
    }finally{
      session.endSession();
    }
  },
);

router.post(
  "/chats/:chatId/messages/:messageId/read",
  verifyAccessToken,
  chatVerification,
  async (req, res) => {
    
    try {
      const { messageId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(messageId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid message ID",
        });
      }
      const message = await messageModel.findOne({
        _id: messageId,
        chatId: req.chat._id,
      });
      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
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
      const isAdmin = req.chat.admins.some(
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
      const invalidMemberIds = memberIds.filter(
        (memberId) => !mongoose.Types.ObjectId.isValid(memberId),
      );
      if (invalidMemberIds.length > 0) {
        return res.status(400).json({
          success: false,
          message: "One or more member IDs are invalid",
        });
      }
      const validMembers = [
        ...new Set(memberIds.map((memberId) => memberId.toString())),
      ];

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
      // Admin leave handling

      const isAdmin = req.chat.admins.some(
        (admin) => admin.toString() === req.user.userId.toString(),
      );
      if (isAdmin) {
        if (req.chat.admins.length === 1) {
          return res.status(400).json({
            success: false,
            message: "Please choose Admin first",
          });
        }
        const updatedChat = await chatModel.findByIdAndUpdate(req.chat._id, {
          $pull: {
            participants: req.user.userId,
            admins: req.user.userId,
          },
        });
        if (!updatedChat) {
          return res.status(404).json({
            success: false,
            message: "Chat not found",
          });
        }
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
