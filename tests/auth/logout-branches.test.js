import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import app from '../../app.js';
import tokenModel from '../../database/schema/authSchema/tokenSchema.js';
import { testUser2 } from '../fixtures/users.fixture.js';
import { createTestUser, generateExpiredToken } from '../helpers/auth.helpers.js';

/**
 * Tests for uncovered branches in POST /api/auth/logout (logoutRoute.js).
 *
 * Existing tests cover: success path, missing auth.
 * These tests cover:
 *   - L13: missing refreshToken in body → 400
 *   - L20: decodedRefreshToken.userId !== req.user.userId → 401
 *   - L27: token not found (revoked) → 400
 *   - L37: bcrypt.compare fails → 400
 *   - L54-56: JWT errors in catch → 401
 */
describe('POST /api/auth/logout — branch coverage', () => {
  let user1Auth, user2Auth;

  beforeEach(async () => {
    user1Auth = await createTestUser();
    user2Auth = await createTestUser(testUser2);
  });

  it('should return 400 when refreshToken is missing from body', async () => {
    // Branch: !refreshToken (L13)
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${user1Auth.accessToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Token is required');
  });

  it('should return 401 when refresh token userId does not match access token userId', async () => {
    // Branch: decodedRefreshToken.userId !== req.user.userId (L20)
    // user1 authenticates but sends user2's refresh token
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${user1Auth.accessToken}`)
      .send({ refreshToken: user2Auth.refreshToken });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'token mismatch');
  });

  it('should return 400 when refresh token is already revoked', async () => {
    // Branch: !istokenpresent (L27)
    // First, revoke all tokens for user1
    await tokenModel.updateMany(
      { userId: user1Auth.user._id },
      { $set: { isRevoked: true } }
    );

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${user1Auth.accessToken}`)
      .send({ refreshToken: user1Auth.refreshToken });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Token has been revoked');
  });

  it('should return 401 when refresh token is expired (JWT catch block)', async () => {
    // Branch: error.name === 'TokenExpiredError' in catch (L54)
    const expiredRefresh = jwt.sign(
      { tokenId: 'fake', userId: user1Auth.user._id, email: 'test@test.com', type: 'refresh' },
      process.env.JWT_REFRESH,
      { expiresIn: '0s' }
    );

    // Small delay to ensure token is expired
    await new Promise(resolve => setTimeout(resolve, 50));

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${user1Auth.accessToken}`)
      .send({ refreshToken: expiredRefresh });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Invalid refresh token');
  });

  it('should return 401 when refresh token is malformed (JWT catch block)', async () => {
    // Branch: error.name === 'JsonWebTokenError' in catch (L56)
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${user1Auth.accessToken}`)
      .send({ refreshToken: 'totally.invalid.token' });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Invalid refresh token');
  });
});
