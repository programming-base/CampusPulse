import express from "express";
import mongoose, { modelNames, mongo } from "mongoose";
import verifyAccessToken from "../../middlewares/verifyAccessToken.js";
import chatVerification from "../../middlewares/chatsMiddleware/chatVerification.js";
import chatModel from "../../database/schema/chatSchema/chatSchema.js";
import messageModel from "../../database/schema/chatSchema/messageSchema,js";
const router = express.Router();

router.delete("/chats/:chatId/messages/:messageId",verifyAccessToken,chatVerification,
  async (req, res) => {
    try {
      const { messageId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(messageId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid message ID",
        });
      }
      const isMember =
        (await chatModel.countDocuments({
          _id: req.chat._id,
          participants: req.user.userId,
        })) > 0;

      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: "You are not a participant in this chat",
        });
      }
      const message = await messageModel.findById(messageId);
      if (!message) {
        return res.status(401).json({
          success: false,
          message: "Message not found",
        });
      }
      if (!message.sender.equals(req.user.userId)) {
        return res.status(401).json({
          success: false,
          message: "You can only delete your own messages",
        });
      }

      await messageModel.findByIdAndDelete(messageId);
      res.status(200).json({
        success: true,
        message: "Message deleted",
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

router.delete("/chats/:chatId/members/:userId",verifyAccessToken,chatVerification,
  async (req, res) => {
    try {
      const { userId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }
      const chat = await req.chat.populate({
        path: "participants",
        match: { _id: userId },
        select:"userName"
      });
      const participant = chat.participants[0];
      if (!participant) {
        return res.status(404).json({
          success: false,
          message: 'User is not a participant in this chat',
        });
      }

      //Regular users  
      if(userId===req.user.userId){
        await chatModel.findByIdAndUpdate(chat._id,{
            $pull:{
                participants:userId
            }
        })
        return res.status(200).json({
            success:true,
            message:"You left the group"
        })
      }

      if(!chat.admin.equals(req.user.userId)){
        return res.status(200).json({
            success:false,
            message:'Only admins can remove the user'
        })
      }
      //Admin actions 
        await chatModel.findByIdAndUpdate(chat._id,{$pull:{participants:userId}})
        return res.status(200).json({
            success:true,
            message:`Admin removed ${participant.userName}`
        })         
    } catch (error) {
        res.status(500).json({
            success:false,
            message:"Internal server error",
            error:error.message
        })
    }
  });
