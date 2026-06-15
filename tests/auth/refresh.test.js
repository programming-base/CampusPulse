import request from 'supertest';
import app from '../../app.js';
import tokenModel from '../../database/schema/authSchema/tokenSchema.js';
import { createTestUser, generateExpiredToken } from '../helpers/auth.helpers.js';

describe('POST /api/auth/refresh', () => {
  let refreshToken;

  beforeEach(async () => {
    const auth = await createTestUser();
    refreshToken = auth.refreshToken;
  });

  it('should return a new access token with a valid refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('accesToken'); // Note: typo in source code
    expect(typeof res.body.accesToken).toBe('string');
  });

  it('should return 401 for an invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', 'Bearer invalidrefreshtoken');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid token');
  });

  it('should return 400 if Authorization header is missing', async () => {
    const res = await request(app)
      .post('/api/auth/refresh');

    expect(res.statusCode).toBe(400);
  });

  it('should return error for a revoked refresh token', async () => {
    // Revoke all tokens for the user
    await tokenModel.updateMany({}, { $set: { isRevoked: true } });

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`);

    expect([401, 404]).toContain(res.statusCode);
  });

  it('should return 401 for an expired refresh token', async () => {
    const expiredToken = generateExpiredToken('refresh');

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.statusCode).toBe(401);
  });

  it('should return 400 for malformed Authorization header', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', 'NotBearer token');

    expect(res.statusCode).toBe(400);
  });
});
