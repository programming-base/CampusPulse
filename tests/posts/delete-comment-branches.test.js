import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import commentModel from '../../models/postsSchema/commentSchema.js';
import { testUser2 } from '../fixtures/users.fixture.js';
import { createTestUser } from '../helpers/auth.helpers.js';
import { createPost, createComment } from '../helpers/data.helpers.js';

/**
 * Tests for DELETE /api/posts/:postId/comments/:commentId (postsDeleteRoute.js L29-87).
 *
 * Branches covered:
 *   - !commentId → 400 (L37) — unlikely via URL param, but tested
 *   - !mongoose.Types.ObjectId.isValid(commentId) → 400 (L43)
 *   - comment not found → 404 (L50)
 *   - postId mismatch → 401 (L55)
 *   - userId mismatch → 401 (L61)
 *   - Success → 200 (L79)
 */
describe('DELETE /api/posts/:postId/comments/:commentId — branches', () => {
  let user1Auth, user2Auth, post, comment;

  beforeEach(async () => {
    user1Auth = await createTestUser();
    user2Auth = await createTestUser(testUser2);
    post = await createPost(user1Auth.accessToken);
    comment = await createComment(user1Auth.accessToken, post._id, 'Test comment');
  });

  it('should return 400 for invalid commentId format', async () => {
    // Branch: !mongoose.Types.ObjectId.isValid(commentId) (L43)
    const res = await request(app)
      .delete(`/api/posts/${post._id}/comments/invalidid`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Invalid comment ID');
  });

  it('should return 404 when comment does not exist', async () => {
    // Branch: !comment (L50)
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .delete(`/api/posts/${post._id}/comments/${fakeId}`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'comment not found');
  });

  it('should return 401 when comment belongs to a different post', async () => {
    // Branch: postId.toString() !== comment.postId.toString() (L55)
    const otherPost = await createPost(user1Auth.accessToken, { content: 'Other post' });
    // comment belongs to `post` but we try to delete it from `otherPost`
    const res = await request(app)
      .delete(`/api/posts/${otherPost._id}/comments/${comment._id}`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'This action is forbidden');
  });

  it('should return 401 when user is not the comment author', async () => {
    // Branch: req.user.userId.toString() !== comment.userId.toString() (L61)
    const res = await request(app)
      .delete(`/api/posts/${post._id}/comments/${comment._id}`)
      .set('Authorization', `Bearer ${user2Auth.accessToken}`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'This action is forbidden');
  });

  it('should return 200 and delete comment successfully', async () => {
    // Branch: success path (L79)
    const res = await request(app)
      .delete(`/api/posts/${post._id}/comments/${comment._id}`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'comment deleted');

    // Verify comment is deleted
    const deletedComment = await commentModel.findById(comment._id);
    expect(deletedComment).toBeNull();
  });
});
