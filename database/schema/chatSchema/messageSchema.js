import mongoose from "mongoose";
const messageSchema = new mongoose.Schema(
  {
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
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
    mediaUrl: { type: String, default: null },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);
export default mongoose.model("Message", messageSchema);
