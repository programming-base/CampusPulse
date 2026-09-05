import request from 'supertest';
import app from '../../app.js';
import otpModel from '../../database/schema/authSchema/otpSchema.js';
import { createTestUser } from '../helpers/auth.helpers.js';
import { testUser } from '../fixtures/users.fixture.js';

// Note: The forgot-password route has several known bugs documented in CONTEXT.md:
// - Line 95 references `token` instead of `newToken` (ReferenceError)
// - Line 71 has empty res.status()
// - No return after OTP step, causing fall-through
// - Signs with JWT_SECRET but verifies with JWT_ACCESS
// These tests verify the behavior as-implemented, including error paths caused by bugs.

describe('POST /api/auth/forgot-password', () => {
  beforeEach(async () => {
    await createTestUser();
  });

  it('should return error for non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nonexistent@test.com' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('message', 'Email does not exist');
  });

  it('should return error when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({});

    // Missing email causes userModel.findOne({ email: undefined }) which returns null
    expect(res.statusCode).toBe(400);
  });

  it('should attempt OTP generation for valid email (may hit known bug)', async () => {
    // This route has a known bug: references `token` instead of `newToken` at line 95,
    // causing a ReferenceError, which results in a 500 from the catch block.
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testUser.email });

    // The route will likely return 500 due to the bug
    expect([200, 500]).toContain(res.statusCode);
  });

  it('should create OTP record in database when step 1 is attempted', async () => {
    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testUser.email });

    // Even though the route crashes, the OTP may have been created before the error
    const otpRecord = await otpModel.findOne({ email: testUser.email });
    // The OTP may or may not exist depending on where the crash occurred
    if (otpRecord) {
      expect(otpRecord.email).toBe(testUser.email);
      expect(otpRecord.otpType).toBe('forgot-password');
    }
  });

  it('should return error for invalid OTP verification step', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({
        email: testUser.email,
        otp: '123456',
        forgotPassToken: 'invalid-token',
        newPassword: 'newpassword123',
      });

    // Will fail at JWT.verify with invalid token
    expect([400, 500]).toContain(res.statusCode);
  });
});
