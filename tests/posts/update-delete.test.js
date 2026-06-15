import request from 'supertest';
import app from '../../app.js';
import postModel from '../../database/schema/postsSchema/postSchema.js';
import { createTestUser } from '../helpers/auth.helpers.js';
import { createPost } from '../helpers/data.helpers.js';
import { testUser2 } from '../fixtures/users.fixture.js';

describe('Post Update and Delete', () => {
  let user1Auth, post;

  beforeEach(async () => {
    user1Auth = await createTestUser();
    post = await createPost(user1Auth.accessToken);
  });

  describe('PUT /api/posts/:postId', () => {
    it('should allow owner to update post content', async () => {
      const res = await request(app)
        .put(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${user1Auth.accessToken}`)
        .send({ content: 'Updated content' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('content', 'Updated content');
    });

    it('should allow owner to update post imageUrl', async () => {
      const res = await request(app)
        .put(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${user1Auth.accessToken}`)
        .send({ imageUrl: 'https://example.com/new-image.jpg' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('imageUrl', 'https://example.com/new-image.jpg');
    });

    it('should return 403 when non-owner tries to update', async () => {
      const user2Auth = await createTestUser(testUser2);

      const res = await request(app)
        .put(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${user2Auth.accessToken}`)
        .send({ content: 'Hacked content' });

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should return 400 if no update fields provided', async () => {
      const res = await request(app)
        .put(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${user1Auth.accessToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'No field to update');
    });

    it('should return 401 if unauthorized', async () => {
      const res = await request(app)
        .put(`/api/posts/${post._id}`)
        .send({ content: 'Test' });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/posts/:postId', () => {
    it('should allow owner to delete their post', async () => {
      const res = await request(app)
        .delete(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${user1Auth.accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message', 'post deleted');

      // Verify post is removed from DB
      const deletedPost = await postModel.findById(post._id);
      expect(deletedPost).toBeNull();
    });

    it('should return 403 when non-owner tries to delete', async () => {
      const user2Auth = await createTestUser(testUser2);

      const res = await request(app)
        .delete(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${user2Auth.accessToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should return 401 if unauthorized', async () => {
      const res = await request(app)
        .delete(`/api/posts/${post._id}`);

      expect(res.statusCode).toBe(401);
    });
  });
});
