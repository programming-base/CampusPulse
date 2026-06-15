import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import { createTestUser } from '../helpers/auth.helpers.js';
import { createPost } from '../helpers/data.helpers.js';

describe('GET /api/posts', () => {
  let accessToken;

  beforeEach(async () => {
    const auth = await createTestUser();
    accessToken = auth.accessToken;

    // Create multiple posts for pagination testing
    await createPost(accessToken, { content: 'Post 1', visibilityScope: 'college' });
    await createPost(accessToken, { content: 'Post 2', visibilityScope: 'department' });
    await createPost(accessToken, { content: 'Post 3', visibilityScope: 'year' });
    await createPost(accessToken, { content: 'Post 4', visibilityScope: 'college' });
    await createPost(accessToken, { content: 'Post 5', visibilityScope: 'college' });
  });

  it('should return paginated posts', async () => {
    const res = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('items');
    expect(res.body.data.items.length).toBeGreaterThan(0);
    expect(res.body.data).toHaveProperty('page');
    expect(res.body.data).toHaveProperty('limit');
    expect(res.body.data).toHaveProperty('total');
    expect(res.body.data).toHaveProperty('totalPages');
  });

  it('should support pagination with page and limit', async () => {
    const res = await request(app)
      .get('/api/posts')
      .query({ page: 1, limit: 2 })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.items.length).toBeLessThanOrEqual(2);
    expect(res.body.data).toHaveProperty('page', 1);
    expect(res.body.data).toHaveProperty('limit', 2);
  });

  it('should filter by department scope', async () => {
    const res = await request(app)
      .get('/api/posts')
      .query({ scope: 'department' })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    res.body.data.items.forEach((post) => {
      expect(post.visibilityScope).toBe('department');
    });
  });

  it('should filter by year scope', async () => {
    const res = await request(app)
      .get('/api/posts')
      .query({ scope: 'year' })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    res.body.data.items.forEach((post) => {
      expect(post.visibilityScope).toBe('year');
    });
  });

  it('should filter by academicYear', async () => {
    const res = await request(app)
      .get('/api/posts')
      .query({ academicYear: 3 })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    res.body.data.items.forEach((post) => {
      expect(post.academicYear).toBe(3);
    });
  });

  it('should return 401 if unauthorized', async () => {
    const res = await request(app)
      .get('/api/posts');

    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/posts/:postId', () => {
  let accessToken, post;

  beforeEach(async () => {
    const auth = await createTestUser();
    accessToken = auth.accessToken;
    post = await createPost(accessToken);
  });

  it('should return a single post by ID', async () => {
    const res = await request(app)
      .get(`/api/posts/${post._id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('postData');
    expect(res.body.postData).toHaveProperty('_id', post._id);
    expect(res.body.postData).toHaveProperty('content', post.content);
  });

  it('should return 400 for invalid post ID format', async () => {
    const res = await request(app)
      .get('/api/posts/invalidid')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid postId');
  });

  it('should return 404 for non-existing post ID', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/posts/${fakeId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error', 'Post not found');
  });
});
