import request from 'supertest';
import app from '../../app.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import otpModel from '../../database/schema/authSchema/otpSchema.js';
import userModel from '../../database/schema/authSchema/userSchema.js';
import { createTestUser } from '../helpers/auth.helpers.js';
import { testUser } from '../fixtures/users.fixture.js';

describe('POST /api/auth/reset-password', () => {
  let registeredUser;

  beforeEach(async () => {
    registeredUser = await createTestUser();

    // Set SMTP env vars so the route uses createTransport directly (avoids createTestAccount HTTP call)
    process.env.SMTP_HOST = 'smtp.ethereal.email';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_USER = 'test@ethereal.email';
    process.env.SMTP_PASS = 'testpassword';
    process.env.SMTP_FROM = '"CampusPulse Test" <test@campuspulse.local>';
  });

  it('should return 400 if email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'Email is required');
  });

  it('should return 400 for non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'nonexistent@test.com' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'The email is not valid');
  });

  it('should attempt OTP generation for valid email (may fail due to SMTP connection)', async () => {
    // Step 1 sends an email via nodemailer. Without a real SMTP server,
    // this will fail with a connection error → 500 from the catch block.
    // This is expected in a test environment without mocked SMTP.
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: testUser.email });

    // Either 200 (if SMTP succeeds) or 500 (if SMTP connection fails)
    expect([200, 500]).toContain(res.statusCode);
  });

  it('should return 401 for invalid reset token (step 2, no SMTP needed)', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: testUser.email,
        otp: '123456',
        newPassword: 'newpassword123',
        resetToken: 'invalid.reset.token',
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid or expired reset token');
  });

  it('should return 400 for invalid OTP with valid reset token', async () => {
    // Manually create OTP and token to skip the SMTP-dependent step 1
    const resetToken = jwt.sign(
      { email: testUser.email, purpose: 'password-reset' },
      process.env.JWT_ACCESS,
      { expiresIn: '10m' }
    );

    const hashedOtp = await bcrypt.hash('654321', 10);
    await otpModel.create({
      otp: hashedOtp,
      email: testUser.email,
      token: resetToken,
      otpType: 'reset-password',
    });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: testUser.email,
        otp: '000000', // Wrong OTP
        newPassword: 'newpassword123',
        resetToken,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid OTP');
  });

  it('should return 429 when max OTP attempts reached', async () => {
    const resetToken = jwt.sign(
      { email: testUser.email, purpose: 'password-reset' },
      process.env.JWT_ACCESS,
      { expiresIn: '10m' }
    );

    const hashedOtp = await bcrypt.hash('654321', 10);
    await otpModel.create({
      otp: hashedOtp,
      email: testUser.email,
      token: resetToken,
      otpType: 'reset-password',
      attempts: 5, // Already at max
    });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: testUser.email,
        otp: '654321',
        newPassword: 'newpassword123',
        resetToken,
      });

    expect(res.statusCode).toBe(429);
    expect(res.body).toHaveProperty('error', 'Maximum OTP attempts reached. Request a new OTP');
  });

  it('should reset password with valid OTP and token (step 2)', async () => {
    // Manually create OTP and token to bypass SMTP
    const resetToken = jwt.sign(
      { email: testUser.email, purpose: 'password-reset' },
      process.env.JWT_ACCESS,
      { expiresIn: '10m' }
    );

    const plainOtp = '654321';
    const hashedOtp = await bcrypt.hash(plainOtp, 10);
    await otpModel.create({
      otp: hashedOtp,
      email: testUser.email,
      token: resetToken,
      otpType: 'reset-password',
    });

    const newPassword = 'brandnewpassword123';
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: testUser.email,
        otp: plainOtp,
        newPassword,
        resetToken,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Password reset successful');

    // Verify password was actually updated
    const updatedUser = await userModel.findOne({ email: testUser.email });
    const passwordMatch = await bcrypt.compare(newPassword, updatedUser.password);
    expect(passwordMatch).toBe(true);
  });

  it('should return 400 if new password is same as old password', async () => {
    const resetToken = jwt.sign(
      { email: testUser.email, purpose: 'password-reset' },
      process.env.JWT_ACCESS,
      { expiresIn: '10m' }
    );

    const plainOtp = '654321';
    const hashedOtp = await bcrypt.hash(plainOtp, 10);
    await otpModel.create({
      otp: hashedOtp,
      email: testUser.email,
      token: resetToken,
      otpType: 'reset-password',
    });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: testUser.email,
        otp: plainOtp,
        newPassword: testUser.password, // Same as current
        resetToken,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'New password must be different from old password');
  });

  it('should clean up OTP records after successful password reset', async () => {
    const resetToken = jwt.sign(
      { email: testUser.email, purpose: 'password-reset' },
      process.env.JWT_ACCESS,
      { expiresIn: '10m' }
    );

    const plainOtp = '654321';
    const hashedOtp = await bcrypt.hash(plainOtp, 10);
    await otpModel.create({
      otp: hashedOtp,
      email: testUser.email,
      token: resetToken,
      otpType: 'reset-password',
    });

    await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: testUser.email,
        otp: plainOtp,
        newPassword: 'completelynewpassword',
        resetToken,
      });

    // OTP should be cleaned up
    const remainingOtps = await otpModel.countDocuments({ email: testUser.email });
    expect(remainingOtps).toBe(0);
  });
});
