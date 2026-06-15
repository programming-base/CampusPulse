import request from 'supertest';
import app from '../../app.js';
import jwt from 'jsonwebtoken';
import { testUser } from '../fixtures/users.fixture.js';
import { createTestUser } from '../helpers/auth.helpers.js';

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    // Register a user before each login test
    await createTestUser();
  });

  it('should successfully log in with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message', 'logged in successfully');
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('should return 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@test.com', password: 'password123' });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid credentials');
  });

  it('should return 401 for incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid credentials');
  });

  it('should return 400 if email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'password123' });

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 if password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email });

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 if both fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.statusCode).toBe(400);
  });

  it('should return valid access token on login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.statusCode).toBe(200);

    const decoded = jwt.verify(res.body.accessToken, process.env.JWT_ACCESS);
    expect(decoded).toHaveProperty('type', 'access');
    expect(decoded).toHaveProperty('email', testUser.email);
  });

  it('should return valid refresh token on login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.statusCode).toBe(200);

    const decoded = jwt.verify(res.body.refreshToken, process.env.JWT_REFRESH);
    expect(decoded).toHaveProperty('type', 'refresh');
    expect(decoded).toHaveProperty('email', testUser.email);
  });
});
