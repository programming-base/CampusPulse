import express from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.js";
import getUserChats from "../../middlewares/chatsMiddleware/getUserChats.js";
import chatVerification from "../../middlewares/chatsMiddleware/chatVerification.js";
import messageModel from "../../models/chatSchema/messageSchema.js";
const router = express.Router();

router.get("/chats", verifyAccessToken, getUserChats, async (req, res) => {
  try {
    const chat = req.chat;
    const responseJson = {
      success: true,
      data: chat,
    };
    res.status(200).json(responseJson);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get(
  "/chats/:chatId/messages",
  verifyAccessToken,
  chatVerification,
  async (req, res) => {
    try {
      let { page = 1, limit = 50 } = req.query;
      const chatId = req.chat._id;
      page = Number.parseInt(page, 10);
      limit = Number.parseInt(limit, 10);
      page = Number.isInteger(page) && page > 0 ? page : 1;
      limit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 50;
      const skip = (page - 1) * limit;
      const messages = await messageModel
        .find({ chatId: chatId })
        .skip(skip)
        .limit(limit)
        .populate("chatId")
        .populate("sender")
        .sort({ createdAt: 1 });
      const totalMessages = await messageModel.countDocuments({
        chatId: chatId,
      });
      if (messages.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            messages,
            page: page,
            limit: limit,
            total: totalMessages,
            hasMore: totalMessages > skip + messages.length,
          },
        });
      }

      res.status(200).json({
        success: true,
        data: messages,
        page: page,
        limit: limit,
        total: totalMessages,
        hasMore: totalMessages > skip + messages.length,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.get(
  "/chats/:chatId",
  verifyAccessToken,
  chatVerification,
  async (req, res) => {
    try {
      res.status(200).json(req.chat);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);
export default router;
