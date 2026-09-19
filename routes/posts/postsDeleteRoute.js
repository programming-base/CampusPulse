import express from "express";
import postModel from "../../models/postsSchema/postSchema.js";
import verifyAccessToken from "../../middlewares/verifyAccessToken.js";
import postValidation from "../../middlewares/postValidation.js";
import commentModel from "../../models/postsSchema/commentSchema.js";
import mongoose from "mongoose";
import likeModel from "../../models/postsSchema/likeSchema.js";
import notificationModel from "../../models/notificationSchema/notificationSchema.js";
const router = express.Router();
router.delete(
  "/posts/:postId",
  verifyAccessToken,
  postValidation,
  async (req, res) => {
    // Start a MongoDB session for transaction
    const session = await mongoose.startSession();
    
    try {
      // Start transaction
      session.startTransaction();
      
      const postId = req.post._id;
      if (req.user.userId !== req.post.userId.toString()) {
        await session.abortTransaction();
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      // Step 1: Find all comments on this post to get their IDs
      const comments = await commentModel.find({ postId: postId }).select('_id').session(session);
      const commentIds = comments.map(comment => comment._id);
      
      // Step 2: Delete all likes on the post
      await likeModel.deleteMany({ 
        targetId: postId, 
        targetType: 'post' 
      }).session(session);
      
      // Step 3: Delete all likes on comments of this post (if any comments exist)
      if (commentIds.length > 0) {
        await likeModel.deleteMany({ 
          targetId: { $in: commentIds }, 
          targetType: 'comment' 
        }).session(session);
      }
      
      // Step 4: Delete all comments on this post
      await commentModel.deleteMany({ postId: postId }).session(session);
      
      // Step 5: Delete all notifications referencing this post
      await notificationModel.deleteMany({ post: postId }).session(session);
      
      // Step 6: Finally, delete the post itself
      const isDeleted = await postModel.deleteOne({ _id: postId }).session(session);
      
      if (isDeleted.deletedCount === 0) {
        await session.abortTransaction();
        return res.status(404).json({ error: "post not found" });
      }
      
      // Commit transaction - all operations succeed or all fail
      await session.commitTransaction();
      
      res.status(200).json({ 
        success: true, 
        message: "post deleted successfully along with all related data" 
      });
    } catch (error) {
      // Rollback all operations if any step fails
      await session.abortTransaction();
      console.error('Post deletion transaction failed:', error);
      res.status(500).json({ error: "Internal server error" });
    } finally {
      // End session
      session.endSession();
    }
  },
);

router.delete(
  "/posts/:postId/comments/:commentId",
  verifyAccessToken,
  postValidation,
  async (req, res) => {
    // Start a MongoDB session for transaction
    const session = await mongoose.startSession();
    
    try {
      // Start transaction
      session.startTransaction();
      
      const postId = req.post._id;
      const { commentId } = req.params;
      
      if (!commentId) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "comment ID is missing",
        });
      }
      
      if (!mongoose.Types.ObjectId.isValid(commentId)) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Invalid comment ID",
        });
      }
      
      const comment = await commentModel.findOne({ _id: commentId }).session(session);
      if (!comment) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: "comment not found",
        });
      }
      
      if (postId.toString() !== comment.postId.toString()) {
        await session.abortTransaction();
        return res.status(401).json({
          success: false,
          message: 'This action is forbidden',
        });
      }
      
      if (req.user.userId.toString() !== comment.userId.toString()) {
        await session.abortTransaction();
        return res.status(401).json({
          success: false,
          message: 'This action is forbidden',
        });
      }
      
      // Step 1: Delete all likes on this comment
      await likeModel.deleteMany({ 
        targetId: commentId, 
        targetType: 'comment' 
      }).session(session);
      
      // Step 2: Delete the comment itself
      const deletedComment = await commentModel.deleteOne({ _id: commentId }).session(session);
      if (deletedComment.deletedCount === 0) {
        await session.abortTransaction();
        return res.status(500).json({ error: "Failed to delete comment" });
      }
      
      // Step 3: Update the post's comment count
      const updatePostModel = await postModel.findByIdAndUpdate(
        postId,
        { $inc: { commentCount: -1 } },
        { new: true, session: session }
      );
      
      if (!updatePostModel) {
        await session.abortTransaction();
        return res.status(500).json({ error: "Failed to update post count" });
      }
      
      // Commit transaction
      await session.commitTransaction();
      
      res.status(200).json({ 
        success: true, 
        message: "comment deleted along with all likes" 
      });
    } catch (error) {
      // Rollback all operations if any step fails
      await session.abortTransaction();
      console.error('Comment deletion transaction failed:', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    } finally {
      // End session
      session.endSession();
    }
  },
);

router.delete(
  "/posts/:postId/like",
  verifyAccessToken,
  postValidation,
  async (req, res) => {
    // Start a MongoDB session for transaction
    const session = await mongoose.startSession();
    
    try {
      // Start transaction
      session.startTransaction();
      
      const postId = req.post._id.toString();
      const userId = req.user.userId.toString();
      
      // Find the like (within transaction)
      const hasLiked = await likeModel.findOne({
        targetId: postId,
        userId: userId,
        targetType: "post",
      }).session(session);
      
      if (!hasLiked) {
        await session.abortTransaction();
        return res.status(404).json({ error: "Like not found" });
      }
      
      // Delete the like (within transaction)
      const deleteLike = await likeModel.findByIdAndDelete(hasLiked._id).session(session);
      
      if (!deleteLike) {
        await session.abortTransaction();
        return res.status(500).json({ error: "Internal server error" });
      }
      
      // Update post like count (within transaction)
      const updatedLikeOnPost = await postModel.findByIdAndUpdate(
        postId,
        { $inc: { likeCount: -1 } },
        { new: true, session: session }
      );
      
      if (!updatedLikeOnPost) {
        await session.abortTransaction();
        return res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
      
      // Commit transaction
      await session.commitTransaction();
      
      const responseJson = {
        success: true,
        data: {
          likeCount: updatedLikeOnPost.likeCount,
        },
      };
      res.status(200).json(responseJson);
    } catch (error) {
      // Rollback all operations if any step fails
      await session.abortTransaction();
      console.error('Like deletion transaction failed:', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    } finally {
      // End session
      session.endSession();
    }
  },
);
export default router;
