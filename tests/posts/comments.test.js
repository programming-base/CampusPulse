import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import postModel from '../../models/postsSchema/postSchema.js';
import { createTestUser } from '../helpers/auth.helpers.js';
import { createPost, createComment } from '../helpers/data.helpers.js';
import { testUser2 } from '../fixtures/users.fixture.js';

describe('Comments API', () => {
  let accessToken, post;

  beforeEach(async () => {
    const auth = await createTestUser();
    accessToken = auth.accessToken;
    post = await createPost(accessToken);
  });

  describe('POST /api/posts/:postId/comments', () => {
    it('should create a comment successfully', async () => {
      const res = await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'Great post!' });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('content', 'Great post!');
      expect(res.body).toHaveProperty('postId', post._id);
    });

    it('should increment commentCount on the post', async () => {
      await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'First comment' });

      await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'Second comment' });

      const updatedPost = await postModel.findById(post._id);
      expect(updatedPost.commentCount).toBe(2);
    });

    it('should return 400 if content is missing', async () => {
      const res = await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
    });

    it('should return 404 for non-existing post', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post(`/api/posts/${fakeId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'Comment on non-existent post' });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/posts/:postId/comments', () => {
    it('should return comments for a post', async () => {
      await createComment(accessToken, post._id, 'Comment 1');
      await createComment(accessToken, post._id, 'Comment 2');

      const res = await request(app)
        .get(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });

    it('should return empty array when no comments exist', async () => {
      const res = await request(app)
        .get(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('DELETE /api/posts/:postId/comments/:commentId', () => {
    it('should delete own comment and decrement commentCount', async () => {
      const comment = await createComment(accessToken, post._id, 'To be deleted');

      const res = await request(app)
        .delete(`/api/posts/${post._id}/comments/${comment._id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message', 'comment deleted');

      // Verify commentCount decremented
      const updatedPost = await postModel.findById(post._id);
      expect(updatedPost.commentCount).toBe(0);
    });

    it('should return 401 when deleting another user comment', async () => {
      const comment = await createComment(accessToken, post._id, 'Owner comment');

      // Create another user
      const user2Auth = await createTestUser(testUser2);

      const res = await request(app)
        .delete(`/api/posts/${post._id}/comments/${comment._id}`)
        .set('Authorization', `Bearer ${user2Auth.accessToken}`);

      expect(res.statusCode).toBe(401);
    });

    it('should return 404 for non-existing comment', async () => {
      const fakeCommentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .delete(`/api/posts/${post._id}/comments/${fakeCommentId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(404);
    });

    it('should return 400 for invalid comment ID', async () => {
      const res = await request(app)
        .delete(`/api/posts/${post._id}/comments/invalidid`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(400);
    });
  });
});
