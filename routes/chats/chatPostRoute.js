import express from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.js";
import mongoose from "mongoose";
import chatModel from "../../database/schema/chatSchema/chatSchema.js";
import chatVerification from "../../middlewares/chatsMiddleware/chatVerification.js";
import messageModel from "../../database/schema/chatSchema/messageSchema.js";
import userModel from "../../database/schema/authSchema/userSchema.js";
chatVerification;
const router = express.Router();

// router.post('/chats/dm',verifyAccessToken,async (req,res)=>{
//     try{
//         const {participantId}=req.body;
//         if(!participantId){
//             return res.status(400).json({error:'Missing field'});
//         }
//         if(!mongoose.Types.ObjectId.isValid(participantId)){
//             return res.status(400).json({error:'Invalid field provided'})
//         }
//         let chatObject={
//             type:'dm',
//             participants:participantId,
//             lastMessage:
//         }
//         const chat=await chatModel.create({})
//     }catch(error){
//         res.status(500).json({error:'Internal server error'})
//     }
// })
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
      type: "dm",
      description: description ? description : "",
      participants: participantId,
    };

    const createdChat = await chatModel.create(chatObject);
    res.status(200).json(createdChat);
  } catch (error) {
    res.status(500).json({
      success: true,
      message: "Intenal server error",
    });
  }
});

router.post("/chats/:chatId/messages", verifyAccessToken, async (req, res) => {
  try {
    //Request body check
    const chat = req.body;
    if (Object.keys(chat).length === 0) {
      return res.status(400).json({
        success: false,
        message: "text field is empty",
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

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
