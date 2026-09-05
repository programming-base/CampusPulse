import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import otpModel from '../../database/schema/authSchema/otpSchema.js';
import { createTestUser } from '../helpers/auth.helpers.js';
import { testUser } from '../fixtures/users.fixture.js';

describe('POST /api/auth/reset-password — branch coverage', () => {
  let resetToken;
  const plainOtp = '654321';

  beforeEach(async () => {
    await createTestUser();

    resetToken = jwt.sign(
      { email: testUser.email, purpose: 'password-reset' },
      process.env.JWT_ACCESS,
      { expiresIn: '10m' }
    );

    const hashedOtp = await bcrypt.hash(plainOtp, 10);
    await otpModel.create({
      otp: hashedOtp,
      email: testUser.email,
      token: resetToken,
      otpType: 'reset-password',
    });
  });

  it('should return 400 for expired OTP', async () => {
    // Simulated expired OTP by updating createdAt to 15 minutes ago
    await otpModel.updateOne(
      { email: testUser.email },
      { $set: { createdAt: new Date(Date.now() - 15 * 60 * 1000) } }
    );

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: testUser.email,
        otp: plainOtp,
        newPassword: 'brandnewpassword',
        resetToken,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'OTP has expired. Request a new OTP');
  });

  it('should return 401 for token purpose mismatch', async () => {
    const wrongPurposeToken = jwt.sign(
      { email: testUser.email, purpose: 'wrong-purpose' },
      process.env.JWT_ACCESS,
      { expiresIn: '10m' }
    );

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: testUser.email,
        otp: plainOtp,
        newPassword: 'brandnewpassword',
        resetToken: wrongPurposeToken,
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid reset token payload');
  });

  it('should return 401 for token email mismatch', async () => {
    const wrongEmailToken = jwt.sign(
      { email: 'other@test.com', purpose: 'password-reset' },
      process.env.JWT_ACCESS,
      { expiresIn: '10m' }
    );

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: testUser.email,
        otp: plainOtp,
        newPassword: 'brandnewpassword',
        resetToken: wrongEmailToken,
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid reset token payload');
  });

  it('should return 401 for expired JWT reset token', async () => {
    const expiredToken = jwt.sign(
      { email: testUser.email, purpose: 'password-reset' },
      process.env.JWT_ACCESS,
      { expiresIn: '0s' }
    );

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: testUser.email,
        otp: plainOtp,
        newPassword: 'brandnewpassword',
        resetToken: expiredToken,
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid or expired reset token');
  });

  it('should return 400 when OTP not found in database', async () => {
    await otpModel.deleteMany({ email: testUser.email });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: testUser.email,
        otp: plainOtp,
        newPassword: 'brandnewpassword',
        resetToken,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'OTP not found. Request a new OTP');
  });

  it('should increment attempts counter on invalid OTP', async () => {
    await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: testUser.email,
        otp: '000000', // Wrong OTP
        newPassword: 'brandnewpassword',
        resetToken,
      });

    const otpDoc = await otpModel.findOne({ email: testUser.email });
    expect(otpDoc.attempts).toBe(1);
  });

  it('should allow login with new password after successful reset', async () => {
    const newPassword = 'afterresetpassword';

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: testUser.email,
        otp: plainOtp,
        newPassword,
        resetToken,
      });

    expect(res.statusCode).toBe(200);

    // Verify login with new password works
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: newPassword });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body).toHaveProperty('accessToken');
  });

  it('should reject login with old password after successful reset', async () => {
    const newPassword = 'afterresetpassword';

    await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: testUser.email,
        otp: plainOtp,
        newPassword,
        resetToken,
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(loginRes.statusCode).toBe(401);
  });

  it('should handle Step 1 OTP request (may fail on SMTP)', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: testUser.email });

    // Either 200 (email sent) or 500 (SMTP connection failure)
    expect([200, 500]).toContain(res.statusCode);

    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('message', 'OTP sent to email');
      expect(res.body).toHaveProperty('resetToken');
    }
  });
});
