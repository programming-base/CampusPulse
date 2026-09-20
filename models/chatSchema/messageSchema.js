import mongoose from "mongoose";
const messageSchema = new mongoose.Schema(
  {
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, trim: true },
    type: {
      type: String,
      enum: ["text", "image", "video", "file"],
      default: "text",
    },
    mediaUrl: { type: String },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

// Messages for chat - CRITICAL
messageSchema.index({ chatId: 1, createdAt: -1 });

// Unread message filtering
messageSchema.index({ chatId: 1, readBy: 1 });

// Sender's messages
messageSchema.index({ sender: 1, createdAt: -1 });
export default mongoose.model("Message", messageSchema);
