import request from 'supertest';
import app from '../../app.js';
import { createTestUser } from '../helpers/auth.helpers.js';

/**
 * Tests for anonymous post creation branch (postsPostRoute.js L33-36).
 *
 * Branches covered:
 *   - isAnonymous: true → post.isAnonymous = true, no userName (L33-34)
 *   - isAnonymous: false → post.isAnonymous = false, userName set (L34-36)
 *   - isAnonymous not provided → defaults to false (L33)
 */
describe('POST /api/posts — anonymous vs non-anonymous', () => {
  let auth;

  beforeEach(async () => {
    auth = await createTestUser();
  });

  it('should create anonymous post without userName', async () => {
    // Branch: isAnonymous true → no userName (L34-36 skipped)
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({
        content: 'Anonymous confession',
        isAnonymous: true,
        visibilityScope: 'college',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('isAnonymous', true);
    expect(res.body.userName).toBeUndefined();
  });

  it('should create non-anonymous post with userName', async () => {
    // Branch: !isAnonymous → post.userName = userInDB.userName (L35)
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({
        content: 'Public post',
        isAnonymous: false,
        visibilityScope: 'college',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('isAnonymous', false);
    expect(res.body).toHaveProperty('userName');
  });

  it('should default isAnonymous to false when not provided', async () => {
    // Branch: isAnonymous ?? false (L33)
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({
        content: 'Default visibility post',
        visibilityScope: 'college',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('isAnonymous', false);
    expect(res.body).toHaveProperty('userName');
  });

  it('should include imageUrl when provided', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({
        content: 'Post with image',
        visibilityScope: 'college',
        imageUrl: 'https://example.com/image.jpg',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('imageUrl', 'https://example.com/image.jpg');
  });
});
