import mongoose from "mongoose";
const messageSchema = new mongoose.Schema(
  {
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    text: { type: String, trim: true },
    type: {
      type: String,
      enum: ["text", "image", "video", "file"],
      default: "text",
    },
    mediaUrl: { type: String },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
  },
  { timestamps: true },
);
export default mongoose.model("Message", messageSchema);
