import request from 'supertest';
import app from '../../app.js';
import { createTestUser } from '../helpers/auth.helpers.js';

/**
 * Tests for PUT /api/users/me (usersPutRoute.js L8-54).
 *
 * Branches covered:
 *   - newData.password → 400 (L17)
 *   - Valid update → 200 (L43)
 *   - Empty body {} — !newData is always false for {} (no 400, goes through)
 */
describe('PUT /api/users/me', () => {
  let auth;

  beforeEach(async () => {
    auth = await createTestUser();
  });

  it('should return 400 when trying to change password', async () => {
    // Branch: newData.password (L17)
    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({ password: 'newpassword123' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Password change is not supported by this route');
  });

  it('should return 200 and update displayName', async () => {
    // Branch: valid update (L43)
    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({ displayName: 'New Display Name' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('displayName', 'New Display Name');
  });

  it('should return 200 and update college', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({ college: 'VJTI' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('college', 'VJTI');
  });

  it('should accept empty body (no validation for empty {})', async () => {
    // Note: !newData is false for {}, so empty body passes through
    // and triggers a no-op findByIdAndUpdate
    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({});

    expect(res.statusCode).toBe(200);
  });

  it('should return 401 without auth', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .send({ displayName: 'Test' });

    expect(res.statusCode).toBe(401);
  });
});
