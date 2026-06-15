import request from 'supertest';
import app from '../../app.js';
import { testUser } from '../fixtures/users.fixture.js';
import { createTestUser } from '../helpers/auth.helpers.js';

describe('Auth /api/auth/me', () => {
  let accessToken;

  beforeEach(async () => {
    const auth = await createTestUser();
    accessToken = auth.accessToken;
  });

  describe('GET /api/auth/me', () => {
    it('should retrieve the authenticated user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('email', testUser.email);
      expect(res.body.data).toHaveProperty('userName', testUser.userName);
      expect(res.body.data).toHaveProperty('displayName', testUser.displayName);
      expect(res.body.data).toHaveProperty('college', testUser.college);
      expect(res.body.data).toHaveProperty('department', testUser.department);
    });

    it('should return 401 if unauthorized', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('PUT /api/auth/me', () => {
    it('should update profile details successfully', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ displayName: 'Updated Name', academicYear: 4 });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('displayName', 'Updated Name');
      expect(res.body.data).toHaveProperty('academicYear', 4);
    });

    it('should return 400 if body is empty', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'Update fields are missing');
    });

    it('should return 400 for invalid photoURL format', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ photoURL: 'not-a-valid-url' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'Incorrect image url format');
    });

    it('should return 401 if unauthorized', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .send({ displayName: 'Test' });

      expect(res.statusCode).toBe(401);
    });
  });
});
