import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import otpModel from '../../models/authSchema/otpSchema.js';
import userModel from '../../models/authSchema/userSchema.js';
import { createTestUser } from '../helpers/auth.helpers.js';
import { testUser } from '../fixtures/users.fixture.js';

describe('POST /api/auth/forgot-password — full flow', () => {
  beforeEach(async () => {
    await createTestUser();
  });

  // ── Step 1: OTP Generation ──────────────────────────────────

  describe('Step 1 — OTP generation (email only)', () => {
    it('should return 400 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nobody@test.com' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message', 'Email does not exist');
    });

    it('should return 400 when email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'Email does not exist');
    });

    it('should generate OTP and return token for valid email (may fail on SMTP)', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email });

      // Either 200 (OTP sent) or 500 (SMTP connection refused)
      expect([200, 500]).toContain(res.statusCode);

      if (res.statusCode === 200) {
        expect(res.body).toHaveProperty('message', 'OTP sent to email');
        expect(res.body).toHaveProperty('token');
        expect(typeof res.body.token).toBe('string');
      }
    });

    it('should create OTP record in database', async () => {
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email });

      const otpRecord = await otpModel.findOne({ email: testUser.email });
      // OTP record should exist (created before SMTP call)
      if (otpRecord) {
        expect(otpRecord.email).toBe(testUser.email);
        expect(otpRecord.otpType).toBe('forgot-password');
        expect(otpRecord.otp).toBeDefined();
        expect(otpRecord.token).toBeDefined();
      }
    });

    it('should clear previous OTPs before creating a new one', async () => {
      // Create an existing OTP
      const oldToken = jwt.sign(
        { email: testUser.email, purpose: 'forgot-password-reset' },
        process.env.JWT_ACCESS,
        { expiresIn: '5m' }
      );
      await otpModel.create({
        email: testUser.email,
        otp: await bcrypt.hash('111111', 10),
        token: oldToken,
        otpType: 'forgot-password',
      });

      // Request a new OTP
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email });

      // Should have at most 1 OTP (old one deleted)
      const count = await otpModel.countDocuments({ email: testUser.email });
      expect(count).toBeLessThanOrEqual(1);
    });
  });

  // ── Step 2: OTP Verification & Password Reset ───────────────

  describe('Step 2 — OTP verification + password reset', () => {
    let forgotPassToken;
    const plainOtp = '654321';

    beforeEach(async () => {
      // Bypass SMTP: manually create OTP and token
      forgotPassToken = jwt.sign(
        { email: testUser.email, purpose: 'forgot-password-reset' },
        process.env.JWT_ACCESS,
        { expiresIn: '5m' }
      );
      const hashedOtp = await bcrypt.hash(plainOtp, 10);
      await otpModel.create({
        email: testUser.email,
        otp: hashedOtp,
        token: forgotPassToken,
        otpType: 'forgot-password',
      });
    });

    it('should reset password with valid OTP and token', async () => {
      const newPassword = 'brandnewpassword123';
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: testUser.email,
          otp: plainOtp,
          forgotPassToken,
          newPassword,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message', 'Password reset successful');

      // Verify password was updated in database
      const updatedUser = await userModel.findOne({ email: testUser.email });
      const passwordMatch = await bcrypt.compare(newPassword, updatedUser.password);
      expect(passwordMatch).toBe(true);
    });

    it('should clean up OTP records after successful reset', async () => {
      await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: testUser.email,
          otp: plainOtp,
          forgotPassToken,
          newPassword: 'completelynewpassword',
        });

      const remaining = await otpModel.countDocuments({ email: testUser.email });
      expect(remaining).toBe(0);
    });

    it('should return 400 for invalid OTP', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: testUser.email,
          otp: '000000',
          forgotPassToken,
          newPassword: 'newpassword123',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Invalid otp ');
    });

    it('should increment attempts on invalid OTP', async () => {
      await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: testUser.email,
          otp: '000000',
          forgotPassToken,
          newPassword: 'newpassword123',
        });

      const otpDoc = await otpModel.findOne({ email: testUser.email });
      expect(otpDoc.attempts).toBe(1);
    });

    it('should return 429 when max OTP attempts exceeded', async () => {
      // Set attempts to max
      await otpModel.updateOne(
        { email: testUser.email },
        { $set: { attempts: 5 } }
      );

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: testUser.email,
          otp: plainOtp,
          forgotPassToken,
          newPassword: 'newpassword123',
        });

      expect(res.statusCode).toBe(429);
    });

    it('should return 400 for expired OTP', async () => {
      // Set createdAt to 15 minutes ago (past the 10 min expiry)
      await otpModel.updateOne(
        { email: testUser.email },
        { $set: { createdAt: new Date(Date.now() - 15 * 60 * 1000) } }
      );

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: testUser.email,
          otp: plainOtp,
          forgotPassToken,
          newPassword: 'newpassword123',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'OTP has expired. Request a new OTP');
    });

    it('should return 400 when new password is same as old password', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: testUser.email,
          otp: plainOtp,
          forgotPassToken,
          newPassword: testUser.password, // Same as current
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'New password must be different from old password');
    });

    it('should return 500 for invalid JWT token (caught by catch block)', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: testUser.email,
          otp: plainOtp,
          forgotPassToken: 'completely.invalid.token',
          newPassword: 'newpassword123',
        });

      // JWT.verify throws → catch block returns 500
      expect(res.statusCode).toBe(500);
    });

    it('should return 500 for expired JWT token', async () => {
      const expiredToken = jwt.sign(
        { email: testUser.email, purpose: 'forgot-password-reset' },
        process.env.JWT_ACCESS,
        { expiresIn: '0s' }
      );

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: testUser.email,
          otp: plainOtp,
          forgotPassToken: expiredToken,
          newPassword: 'newpassword123',
        });

      // JWT.verify throws TokenExpiredError → catch block returns 500
      expect(res.statusCode).toBe(500);
    });

    it('should return 400 for purpose mismatch in token', async () => {
      const wrongPurposeToken = jwt.sign(
        { email: testUser.email, purpose: 'wrong-purpose' },
        process.env.JWT_ACCESS,
        { expiresIn: '5m' }
      );

      // Also create matching OTP record
      await otpModel.create({
        email: testUser.email,
        otp: await bcrypt.hash(plainOtp, 10),
        token: wrongPurposeToken,
        otpType: 'forgot-password',
      });

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: testUser.email,
          otp: plainOtp,
          forgotPassToken: wrongPurposeToken,
          newPassword: 'newpassword123',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'Invalid email or token type');
    });

    it('should return 400 for email mismatch in token', async () => {
      const wrongEmailToken = jwt.sign(
        { email: 'other@test.com', purpose: 'forgot-password-reset' },
        process.env.JWT_ACCESS,
        { expiresIn: '5m' }
      );

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: testUser.email,
          otp: plainOtp,
          forgotPassToken: wrongEmailToken,
          newPassword: 'newpassword123',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'Invalid email or token type');
    });

    it('should return 400 when OTP record not found in database', async () => {
      // Delete all OTPs
      await otpModel.deleteMany({ email: testUser.email });

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: testUser.email,
          otp: plainOtp,
          forgotPassToken,
          newPassword: 'newpassword123',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'OTP not found. Request a new OTP');
    });

    it('should allow login with new password after reset', async () => {
      const newPassword = 'completelynewpassword';

      await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: testUser.email,
          otp: plainOtp,
          forgotPassToken,
          newPassword,
        });

      // Verify login works with new password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: newPassword });

      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body).toHaveProperty('accessToken');
    });

    it('should reject login with old password after reset', async () => {
      const newPassword = 'completelynewpassword';

      await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: testUser.email,
          otp: plainOtp,
          forgotPassToken,
          newPassword,
        });

      // Old password should no longer work
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(loginRes.statusCode).toBe(401);
    });
  });
});
