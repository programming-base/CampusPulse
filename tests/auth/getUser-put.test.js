import request from 'supertest';
import app from '../../app.js';
import { createTestUser } from '../helpers/auth.helpers.js';

/**
 * Tests for PUT /api/auth/me (routes/auth/getUser.js L21-61).
 *
 * Branches covered:
 *   - Object.keys(reqBody).length === 0 → 400
 *   - reqBody.photoURL && !validator.isURL → 400
 *   - reqBody.email && !validator.isEmail → 400
 *   - Valid update → 200
 */
describe('PUT /api/auth/me', () => {
  let auth;

  beforeEach(async () => {
    auth = await createTestUser();
  });

  it('should return 400 when body is empty', async () => {
    // Branch: Object.keys(reqBody).length === 0
    const res = await request(app)
      .put('/api/auth/me')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Update fields are missing');
  });

  it('should return 400 for invalid photoURL format', async () => {
    // Branch: reqBody.photoURL && !validator.isURL(reqBody.photoURL)
    const res = await request(app)
      .put('/api/auth/me')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({ photoURL: 'not-a-valid-url' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Incorrect image url format');
  });

  it('should return 400 for invalid email format', async () => {
    // Branch: reqBody.email && !validator.isEmail(reqBody.email)
    const res = await request(app)
      .put('/api/auth/me')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({ email: 'not-an-email' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Incorrect email format');
  });

  it('should return 200 and update displayName', async () => {
    // Branch: valid update path → findOneAndUpdate → 200
    const res = await request(app)
      .put('/api/auth/me')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({ displayName: 'Updated Name' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('displayName', 'Updated Name');
  });

  it('should return 200 with valid photoURL', async () => {
    const res = await request(app)
      .put('/api/auth/me')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({ photoURL: 'https://example.com/photo.jpg' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('should return 200 with valid email update', async () => {
    const res = await request(app)
      .put('/api/auth/me')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({ email: 'newemail@test.com' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app)
      .put('/api/auth/me')
      .send({ displayName: 'Test' });

    expect(res.statusCode).toBe(401);
  });
});
