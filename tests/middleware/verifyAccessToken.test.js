import request from 'supertest';
import app from '../../app.js';
import { createTestUser, generateExpiredToken } from '../helpers/auth.helpers.js';

describe('verifyAccessToken Middleware', () => {
  // We test through the /api/auth/verify endpoint which uses verifyAccessToken

  it('should pass with a valid access token', async () => {
    const auth = await createTestUser();

    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('should return 401 for expired access token', async () => {
    const expiredToken = generateExpiredToken('access', 'fake-user-id');
    await new Promise((resolve) => setTimeout(resolve, 100));

    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'session expired');
  });

  it('should return 401 for malformed token', async () => {
    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', 'Bearer malformed.jwt.token');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid token');
  });

  it('should return 401 when Authorization header is missing', async () => {
    const res = await request(app)
      .get('/api/auth/verify');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Token is missing');
  });

  it('should return 401 when Authorization header has wrong format', async () => {
    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', 'NotBearer sometoken');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Token is missing');
  });

  it('should return 400 when token references non-existent user', async () => {
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { userId: '507f1f77bcf86cd799439011', email: 'ghost@test.com', type: 'access' },
      process.env.JWT_ACCESS,
      { expiresIn: '5m' }
    );

    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'User not found');
  });

  it('should reject refresh token used as access token', async () => {
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { userId: '507f1f77bcf86cd799439011', email: 'test@test.com', type: 'refresh' },
      process.env.JWT_ACCESS,
      { expiresIn: '5m' }
    );

    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid token');
  });
});
