import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import { testUser } from '../fixtures/users.fixture.js';

/**
 * Registers a new user via the API and returns auth context.
 * @param {object} overrides - Fields to override in the default testUser fixture.
 * @returns {{ user: object, accessToken: string, refreshToken: string }}
 */
export async function createTestUser(overrides = {}) {
  const userData = { ...testUser, ...overrides };
  const res = await request(app)
    .post('/api/auth/register')
    .send(userData);

  if (res.statusCode !== 201) {
    throw new Error(`createTestUser failed: ${res.statusCode} — ${JSON.stringify(res.body)}`);
  }

  return {
    user: res.body.User,
    accessToken: res.body.accessToken,
    refreshToken: res.body.refreshToken,
  };
}

/**
 * Logs in an existing user via the API and returns tokens.
 * @param {string} email
 * @param {string} password
 * @returns {{ accessToken: string, refreshToken: string }}
 */
export async function loginUser(email, password) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  if (res.statusCode !== 200) {
    throw new Error(`loginUser failed: ${res.statusCode} — ${JSON.stringify(res.body)}`);
  }

  return {
    accessToken: res.body.accessToken,
    refreshToken: res.body.refreshToken,
  };
}

/**
 * Creates and authenticates a user in one call. Convenience wrapper.
 * @param {object} overrides
 * @returns {{ user: object, accessToken: string, refreshToken: string }}
 */
export async function createAuthenticatedUser(overrides = {}) {
  return createTestUser(overrides);
}

/**
 * Generates a valid JWT access token directly (bypasses API).
 * Useful for testing middleware in isolation.
 * @param {string} userId
 * @param {string} email
 * @returns {string}
 */
export function generateAccessToken(userId, email = 'test@test.com') {
  return jwt.sign(
    { userId, email, type: 'access' },
    process.env.JWT_ACCESS,
    { expiresIn: '5m' }
  );
}

/**
 * Generates a valid JWT refresh token directly (bypasses API).
 * @param {string} userId
 * @param {string} email
 * @param {string} tokenId
 * @returns {string}
 */
export function generateRefreshToken(userId, email = 'test@test.com', tokenId = 'fake-token-id') {
  return jwt.sign(
    { tokenId, userId, email, type: 'refresh' },
    process.env.JWT_REFRESH,
    { expiresIn: '7d' }
  );
}

/**
 * Generates an expired JWT token for negative testing.
 * @param {'access' | 'refresh'} type
 * @param {string} userId
 * @returns {string}
 */
export function generateExpiredToken(type = 'access', userId = 'fake-user-id') {
  const secret = type === 'access' ? process.env.JWT_ACCESS : process.env.JWT_REFRESH;
  return jwt.sign(
    { userId, email: 'test@test.com', type },
    secret,
    { expiresIn: '0s' }
  );
}
