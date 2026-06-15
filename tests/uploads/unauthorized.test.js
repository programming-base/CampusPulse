import request from 'supertest';
import app from '../../app.js';

/**
 * Tests for upload routes — unauthorized access.
 *
 * Branches covered:
 *   - verifyAccessToken middleware → 401 for all upload endpoints
 */
describe('Upload routes — unauthorized access', () => {
  it('should return 401 for POST /api/uploads/chat-image without auth', async () => {
    const res = await request(app).post('/api/uploads/chat-image');
    expect(res.statusCode).toBe(401);
  });

  it('should return 401 for POST /api/uploads/image without auth', async () => {
    const res = await request(app).post('/api/uploads/image');
    expect(res.statusCode).toBe(401);
  });

  it('should return 401 for POST /api/uploads/profile-photo without auth', async () => {
    const res = await request(app).post('/api/uploads/profile-photo');
    expect(res.statusCode).toBe(401);
  });
});
