import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import { createTestUser } from '../helpers/auth.helpers.js';
import { createPost } from '../helpers/data.helpers.js';

describe('postValidation Middleware', () => {
  // Test through /api/posts/:postId endpoint which uses postValidation

  let accessToken;

  beforeEach(async () => {
    const auth = await createTestUser();
    accessToken = auth.accessToken;
  });

  it('should pass with a valid post ID', async () => {
    const post = await createPost(accessToken);

    const res = await request(app)
      .get(`/api/posts/${post._id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('postData');
  });

  it('should return 400 for invalid post ID format', async () => {
    const res = await request(app)
      .get('/api/posts/invalidpostid')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid postId');
  });

  it('should return 404 for non-existent post', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/posts/${fakeId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error', 'Post not found');
  });
});
