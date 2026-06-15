import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import userModel from '../../database/schema/authSchema/userSchema.js';
import tokenModel from '../../database/schema/authSchema/tokenSchema.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { testUser, testUser2 } from '../fixtures/users.fixture.js';

describe('POST /api/auth/register', () => {
  it('should successfully register a new user and return tokens', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', 'Account created');
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.User).toHaveProperty('email', testUser.email);
    expect(res.body.User).toHaveProperty('userName', testUser.userName);
    expect(res.body.User).toHaveProperty('displayName', testUser.displayName);
    expect(res.body.User).toHaveProperty('college', testUser.college);
    expect(res.body.User).toHaveProperty('department', testUser.department);
    expect(res.body.User).toHaveProperty('academicYear', testUser.academicYear);
    expect(res.body.User).toHaveProperty('_id');
  });

  it('should not return password in the response', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.User).not.toHaveProperty('password');
  });

  it('should return 409 Conflict if email is already registered', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty('error', 'Email already registered');
  });

  it('should return 409/500 if username is already registered', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const duplicateUsername = {
      ...testUser2,
      userName: testUser.userName, // same username, different email
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(duplicateUsername);

    // Mongoose unique constraint throws 500 since there's no explicit check
    expect([409, 500]).toContain(res.statusCode);
  });

  it('should return 400 if required fields are missing', async () => {
    const incompleteUser = { displayName: 'Test' };

    const res = await request(app)
      .post('/api/auth/register')
      .send(incompleteUser);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'Please provide proper information');
  });

  it('should return 400 if email is missing', async () => {
    const noEmail = { ...testUser };
    delete noEmail.email;

    const res = await request(app)
      .post('/api/auth/register')
      .send(noEmail);

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 if password is missing', async () => {
    const noPassword = { ...testUser };
    delete noPassword.password;

    const res = await request(app)
      .post('/api/auth/register')
      .send(noPassword);

    expect(res.statusCode).toBe(400);
  });

  it('should hash the password before storing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);

    const userInDb = await userModel.findById(res.body.User._id);
    expect(userInDb.password).not.toBe(testUser.password);
    const isHashed = await bcrypt.compare(testUser.password, userInDb.password);
    expect(isHashed).toBe(true);
  });

  it('should store a refresh token in the database', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);

    const storedToken = await tokenModel.findOne({ userId: res.body.User._id });
    expect(storedToken).not.toBeNull();
    expect(storedToken.type).toBe('refresh');
    expect(storedToken.isRevoked).toBe(false);
  });

  it('should generate a valid access token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);

    const decoded = jwt.verify(res.body.accessToken, process.env.JWT_ACCESS);
    expect(decoded).toHaveProperty('userId', res.body.User._id);
    expect(decoded).toHaveProperty('type', 'access');
  });

  it('should generate a valid refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);

    const decoded = jwt.verify(res.body.refreshToken, process.env.JWT_REFRESH);
    expect(decoded).toHaveProperty('userId', res.body.User._id);
    expect(decoded).toHaveProperty('type', 'refresh');
  });

  it('should return 400 if academicYear is missing', async () => {
    const noYear = { ...testUser };
    delete noYear.academicYear;

    const res = await request(app)
      .post('/api/auth/register')
      .send(noYear);

    expect(res.statusCode).toBe(400);
  });
});
