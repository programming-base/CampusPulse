import request from 'supertest';
import app from '../../app.js';
import tokenModel from '../../models/authSchema/tokenSchema.js';
import { createTestUser, generateExpiredToken } from '../helpers/auth.helpers.js';

describe('verifyRefreshToken Middleware', () => {
  // We test through the /api/auth/refresh endpoint which uses verifyRefreshToken

  it('should pass with a valid refresh token', async () => {
    const auth = await createTestUser();

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${auth.refreshToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('accesToken');
  });

  it('should reject a revoked refresh token', async () => {
    const auth = await createTestUser();

    // Revoke the token
    await tokenModel.updateMany(
      { userId: auth.user._id },
      { $set: { isRevoked: true } }
    );

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${auth.refreshToken}`);

    expect([401, 404]).toContain(res.statusCode);
  });

  it('should reject an expired refresh token', async () => {
    const expiredToken = generateExpiredToken('refresh');
    await new Promise((resolve) => setTimeout(resolve, 100));

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Refresh token expired');
  });

  it('should reject an invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', 'Bearer invalidtoken');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid token');
  });

  it('should reject when Authorization header is missing', async () => {
    const res = await request(app)
      .post('/api/auth/refresh');

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'Token not found');
  });
});
