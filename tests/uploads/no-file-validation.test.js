import request from 'supertest';
import app from '../../app.js';
import { createTestUser } from '../helpers/auth.helpers.js';

/**
 * Tests for upload routes — no-file validation branches.
 *
 * Branches covered:
 *   - uploadChatImage.js L9: !req.file → 400
 *   - uploadImage.js L8: !req.files || req.files.length === 0 → 400
 *   - uploadProfilePic.js L10: !req.file → 400
 */
describe('Upload routes — no-file validation', () => {
  let auth;

  beforeEach(async () => {
    auth = await createTestUser();
  });

  describe('POST /api/uploads/chat-image', () => {
    it('should return 400 when no file is attached', async () => {
      // Branch: !req.file (uploadChatImage.js L9)
      const res = await request(app)
        .post('/api/uploads/chat-image')
        .set('Authorization', `Bearer ${auth.accessToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'No file to upload');
    });
  });

  describe('POST /api/uploads/image', () => {
    it('should return 400 when no files are attached', async () => {
      // Branch: !req.files || req.files.length === 0 (uploadImage.js L8)
      const res = await request(app)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${auth.accessToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'No images provided');
    });
  });

  describe('POST /api/uploads/profile-photo', () => {
    it('should return 400 when no file is attached', async () => {
      // Branch: !req.file (uploadProfilePic.js L10)
      const res = await request(app)
        .post('/api/uploads/profile-photo')
        .set('Authorization', `Bearer ${auth.accessToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'No file to upload');
    });
  });
});
