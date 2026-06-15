import request from 'supertest';
import app from '../../app.js';
import { createTestUser } from '../helpers/auth.helpers.js';
import { createNotificationSettings } from '../helpers/data.helpers.js';

/**
 * Tests for notification settings endpoints (notificationGetRoute.js L58-72, notificationsPutRoute.js L62-82).
 *
 * Branches covered:
 *   - GET /notifications/settings: no settings → null (L60)
 *   - GET /notifications/settings: with settings → data (L60)
 *   - PUT /notifications/settings: empty body → 400 (L65)
 *   - PUT /notifications/settings: upsert new → 200 (L71)
 *   - PUT /notifications/settings: update existing → 200 (L71)
 */
describe('Notification Settings', () => {
  let auth;

  beforeEach(async () => {
    auth = await createTestUser();
  });

  describe('GET /api/notifications/settings', () => {
    it('should return null when no settings exist', async () => {
      // Branch: settings is null (L60)
      const res = await request(app)
        .get('/api/notifications/settings')
        .set('Authorization', `Bearer ${auth.accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toBeNull();
    });

    it('should return settings when they exist', async () => {
      // Branch: settings found (L60)
      await createNotificationSettings(auth.user._id, { likes: false });

      const res = await request(app)
        .get('/api/notifications/settings')
        .set('Authorization', `Bearer ${auth.accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('likes', false);
    });
  });

  describe('PUT /api/notifications/settings', () => {
    it('should return 400 when body is empty', async () => {
      // Branch: Object.keys(settings).length === 0 (L65)
      const res = await request(app)
        .put('/api/notifications/settings')
        .set('Authorization', `Bearer ${auth.accessToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'Update feilds missing');
    });

    it('should upsert new settings', async () => {
      // Branch: upsert: true creates new document (L71)
      const res = await request(app)
        .put('/api/notifications/settings')
        .set('Authorization', `Bearer ${auth.accessToken}`)
        .send({ likes: false, comments: true });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('likes', false);
    });

    it('should update existing settings', async () => {
      // Create settings first
      await createNotificationSettings(auth.user._id, { likes: true });

      // Branch: upsert finds and updates existing (L71)
      const res = await request(app)
        .put('/api/notifications/settings')
        .set('Authorization', `Bearer ${auth.accessToken}`)
        .send({ likes: false });

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('likes', false);
    });
  });
});
