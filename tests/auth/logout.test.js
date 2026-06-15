import request from 'supertest';
import app from '../../app.js';
import tokenModel from '../../database/schema/authSchema/tokenSchema.js';
import { createTestUser } from '../helpers/auth.helpers.js';

describe('POST /api/auth/logout', () => {
  let accessToken, refreshToken, userId;

  beforeEach(async () => {
    const auth = await createTestUser();
    accessToken = auth.accessToken;
    refreshToken = auth.refreshToken;
    userId = auth.user._id;
  });

  it('should successfully log out and revoke the refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message', 'successfully logged out');

    // Verify token is revoked in DB
    const dbToken = await tokenModel.findOne({ userId });
    expect(dbToken.isRevoked).toBe(true);
  });

  it('should reject reuse of a revoked refresh token', async () => {
    // First logout
    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    // Try to logout again with same refresh token
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Token has been revoked');
  });

  it('should return 400 if refresh token is missing from body', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Token is required');
  });

  it('should return 401 if refresh token is invalid JWT', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken: 'invalid.token.value' });

    expect(res.statusCode).toBe(401);
  });

  it('should return 401 if access token is missing', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken });

    expect(res.statusCode).toBe(401);
  });
});
