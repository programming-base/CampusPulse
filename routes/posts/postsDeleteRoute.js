import express from "express";
import postModel from "../../models/postsSchema/postSchema.js";
import verifyAccessToken from "../../middlewares/verifyAccessToken.js";
import postValidation from "../../middlewares/postValidation.js";
import commentModel from "../../models/postsSchema/commentSchema.js";
import mongoose from "mongoose";
import likeModel from "../../models/postsSchema/likeSchema.js";
const router = express.Router();
router.delete(
  "/posts/:postId",
  verifyAccessToken,
  postValidation,
  async (req, res) => {
    try {
      const postId = req.post._id;
      if (req.user.userId !== req.post.userId.toString())
        return res.status(403).json({ error: "Unauthorized" });
      const isDeleted = await postModel.deleteOne({ _id: postId });
      if (isDeleted.deletedCount === 0) {
        return res.status(404).json({ error: "post not found" });
      }
      res.status(200).json({ success: true, message: "post deleted" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.delete(
  "/posts/:postId/comments/:commentId",
  verifyAccessToken,
  postValidation,
  async (req, res) => {
    try {
      const postId = req.post._id;
      const { commentId } = req.params;
      if (!commentId) {
        return res.status(400).json({
          success: false,
          message: "comment ID is missing",
        });
      }
      if (!mongoose.Types.ObjectId.isValid(commentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid comment ID",
        });
      }
      const comment = await commentModel.findOne({ _id: commentId });
      if (!comment)
        return res.status(404).json({
          success: false,
          message: "comment not found",
        });
      if (postId.toString() !== comment.postId.toString()){
        res.status(401).json({
            success:false,
            message:'This action is forbidden',
        })
    }
      if (req.user.userId.toString() !== comment.userId.toString()){
        return res.status(401).json({
            success:false,
            message:'This action is forbidden',
        })
    }
      const deletedComment = await commentModel.deleteOne({ _id: commentId });
      if (deletedComment.deletedCount === 0) {
        return res.status(500).json({ error: "Failed to delete comment" });
      }
      const updatePostModel = await postModel.findByIdAndUpdate(
        postId,
        { $inc: { commentCount: -1 } },
        { new: true },
      );
      if (!updatePostModel) {
        return res.status(500).json({ error: "Failed to update post count" });
      }
      res.status(200).json({ success: true, message: "comment deleted" });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },
);

router.delete(
  "/posts/:postId/like",
  verifyAccessToken,
  postValidation,
  async (req, res) => {
    try {
      const postId = req.post._id.toString();
      const userId = req.user.userId.toString();
      const hasLiked = await likeModel.findOne({
        targetId: postId,
        userId: userId,
        targetType: "post",
      });
      if (!hasLiked) {
        return res.status(404).json({ error: "Like not found" });
      }
      const deleteLike = await likeModel.findByIdAndDelete(hasLiked._id);
      if (!deleteLike)
        return res.status(500).json({ error: "Internal server error" });
      const updatedLikeOnPost = await postModel.findByIdAndUpdate(
        postId,
        { $inc: { likeCount: -1 } },
        { new: true },
      );
      if (!updatedLikeOnPost) {
        await likeModel.create(hasLiked);
        return res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
      const responseJson = {
        success: true,
        data: {
          likeCount: updatedLikeOnPost.likeCount,
        },
      };
      res.status(200).json(responseJson);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },
);
export default router;
