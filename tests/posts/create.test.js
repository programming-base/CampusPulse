import request from 'supertest';
import app from '../../app.js';
import { testUser } from '../fixtures/users.fixture.js';
import { createTestUser } from '../helpers/auth.helpers.js';

describe('POST /api/posts', () => {
  let accessToken;

  beforeEach(async () => {
    const auth = await createTestUser();
    accessToken = auth.accessToken;
  });

  it('should create a post successfully', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        content: 'Hello CampusPulse!',
        isAnonymous: false,
        visibilityScope: 'college',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('content', 'Hello CampusPulse!');
    expect(res.body).toHaveProperty('isAnonymous', false);
    expect(res.body).toHaveProperty('visibilityScope', 'college');
    expect(res.body).toHaveProperty('userName', testUser.userName);
    expect(res.body).toHaveProperty('department', testUser.department);
    expect(res.body).toHaveProperty('academicYear', testUser.academicYear);
    expect(res.body).toHaveProperty('likeCount', 0);
    expect(res.body).toHaveProperty('commentCount', 0);
  });

  it('should create an anonymous post without userName', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        content: 'Anonymous confession',
        isAnonymous: true,
        visibilityScope: 'department',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('isAnonymous', true);
    expect(res.body.userName).toBeUndefined();
  });

  it('should create post with department visibility scope', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        content: 'Department specific post',
        isAnonymous: false,
        visibilityScope: 'department',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('visibilityScope', 'department');
  });

  it('should create post with year visibility scope', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        content: 'Year specific post',
        isAnonymous: false,
        visibilityScope: 'year',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('visibilityScope', 'year');
  });

  it('should return 400 if content is missing', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        isAnonymous: false,
        visibilityScope: 'college',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'Insufficient information');
  });

  it('should return 400 if visibilityScope is missing', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        content: 'Some content',
        isAnonymous: false,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'Insufficient information');
  });

  it('should create post with image URL', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        content: 'Post with image',
        isAnonymous: false,
        visibilityScope: 'college',
        imageUrl: 'https://example.com/image.jpg',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('imageUrl', 'https://example.com/image.jpg');
  });

  it('should return 401 if unauthorized', async () => {
    const res = await request(app)
      .post('/api/posts')
      .send({
        content: 'Test post',
        isAnonymous: false,
        visibilityScope: 'college',
      });

    expect(res.statusCode).toBe(401);
  });
});
