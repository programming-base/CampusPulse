import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import tokenModel from '../../database/schema/authSchema/tokenSchema.js';
import userModel from '../../database/schema/authSchema/userSchema.js';
import { createTestUser, generateAccessToken } from '../helpers/auth.helpers.js';

describe('POST /api/auth/refresh — branch coverage', () => {
  let user, accessToken, refreshToken;

  beforeEach(async () => {
    const auth = await createTestUser();
    user = auth.user;
    accessToken = auth.accessToken;
    refreshToken = auth.refreshToken;
  });

  it('should return 401 when using an access token instead of refresh token', async () => {
    // Access tokens are signed with JWT_ACCESS, not JWT_REFRESH
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${accessToken}`);

    // verifyRefreshToken verifies with JWT_REFRESH — access token will fail
    expect(res.statusCode).toBe(401);
  });

  it('should return a new access token on sequential refresh', async () => {
    // First refresh
    const res1 = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`);

    expect(res1.statusCode).toBe(200);
    expect(res1.body).toHaveProperty('accesToken');

    // Second refresh with same token should also work
    const res2 = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`);

    expect(res2.statusCode).toBe(200);
    expect(res2.body).toHaveProperty('accesToken');
    // Note: JWT iat has 1-second granularity, so tokens issued within
    // the same second will be identical. We just verify both succeed.
  });

  it('should return error when refresh token DB record is deleted', async () => {
    // Delete all token records
    await tokenModel.deleteMany({});

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`);

    // verifyRefreshToken middleware can't find token in DB → 404
    expect(res.statusCode).toBe(404);
  });

  it('should return 400 for completely empty Authorization header value', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', '');

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 for Bearer prefix with empty token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', 'Bearer ');

    // "Bearer " splits to ['Bearer', ''], token is empty string
    expect([400, 401]).toContain(res.statusCode);
  });

  it('should return error for token signed with wrong secret', async () => {
    const wrongSecretToken = jwt.sign(
      { userId: user._id, email: 'test@test.com', type: 'refresh', tokenId: 'fake' },
      'completely-wrong-secret',
      { expiresIn: '7d' }
    );

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${wrongSecretToken}`);

    expect(res.statusCode).toBe(401);
  });

  it('should return error for token with invalid userId format', async () => {
    const badUserIdToken = jwt.sign(
      { userId: 'not-an-objectid', email: 'test@test.com', type: 'refresh', tokenId: 'fake' },
      process.env.JWT_REFRESH,
      { expiresIn: '7d' }
    );

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${badUserIdToken}`);

    // verifyRefreshToken checks ObjectId.isValid → 400
    expect(res.statusCode).toBe(400);
  });

  it('should verify new access token is functional', async () => {
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`);

    expect(refreshRes.statusCode).toBe(200);

    // Use the new access token to call a protected route
    const verifyRes = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${refreshRes.body.accesToken}`);

    expect(verifyRes.statusCode).toBe(200);
    expect(verifyRes.body).toHaveProperty('success', true);
  });
});
