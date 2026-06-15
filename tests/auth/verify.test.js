import request from 'supertest';
import app from '../../app.js';
import { createTestUser, generateExpiredToken } from '../helpers/auth.helpers.js';

describe('GET /api/auth/verify', () => {
  let accessToken;

  beforeEach(async () => {
    const auth = await createTestUser();
    accessToken = auth.accessToken;
  });

  it('should verify a valid access token', async () => {
    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message', 'Token is valid');
  });

  it('should return 401 if token is missing', async () => {
    const res = await request(app)
      .get('/api/auth/verify');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Token is missing');
  });

  it('should return 401 for an invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', 'Bearer invalidtokenvalue');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid token');
  });

  it('should return 401 for an expired token', async () => {
    const expiredToken = generateExpiredToken('access', 'fake-user-id');

    // Small delay to ensure the 0s token has expired
    await new Promise((resolve) => setTimeout(resolve, 100));

    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.statusCode).toBe(401);
  });
});
