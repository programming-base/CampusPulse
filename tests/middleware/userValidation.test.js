import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import { createTestUser } from '../helpers/auth.helpers.js';

describe('userValidation Middleware', () => {
  // Test through /api/users/:userId endpoint which uses userValidation

  let accessToken;

  beforeEach(async () => {
    const auth = await createTestUser();
    accessToken = auth.accessToken;
  });

  it('should pass with a valid user ID', async () => {
    const auth = await createTestUser({
      email: 'target@test.com',
      userName: 'targetuser',
    });

    const res = await request(app)
      .get(`/api/users/${auth.user._id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('should return 400 for invalid user ID format', async () => {
    const res = await request(app)
      .get('/api/users/invalidformat')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'invalid user id');
  });

  it('should return 404 for non-existent user', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/users/${fakeId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error', 'user not found or invalid user ID');
  });
});
