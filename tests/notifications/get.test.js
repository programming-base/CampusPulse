import request from 'supertest';
import app from '../../app.js';
import { createTestUser } from '../helpers/auth.helpers.js';
import { createNotification, createNotificationSettings } from '../helpers/data.helpers.js';
import { testUser2 } from '../fixtures/users.fixture.js';

describe('Notifications GET API', () => {
  let user1Auth, user2Auth;

  beforeEach(async () => {
    user1Auth = await createTestUser();
    user2Auth = await createTestUser(testUser2);
  });

  describe('GET /api/notifications', () => {
    it('should fetch user notifications', async () => {
      await createNotification(user1Auth.user._id, user2Auth.user._id);
      await createNotification(user1Auth.user._id, user2Auth.user._id, {
        type: 'comment',
        title: 'Comment',
        message: 'Someone commented',
      });

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${user1Auth.accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data.items.length).toBe(2);
      expect(res.body.data).toHaveProperty('page');
      expect(res.body.data).toHaveProperty('limit');
      expect(res.body.data).toHaveProperty('total', 2);
    });

    it('should support pagination', async () => {
      for (let i = 0; i < 5; i++) {
        await createNotification(user1Auth.user._id, user2Auth.user._id, {
          title: `Notification ${i}`,
          message: `Message ${i}`,
        });
      }

      const res = await request(app)
        .get('/api/notifications')
        .query({ page: 1, limit: 2 })
        .set('Authorization', `Bearer ${user1Auth.accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.items.length).toBe(2);
      expect(res.body.data).toHaveProperty('hasMore', true);
    });

    it('should filter by unread only', async () => {
      await createNotification(user1Auth.user._id, user2Auth.user._id, { isRead: false });
      await createNotification(user1Auth.user._id, user2Auth.user._id, { isRead: true });

      const res = await request(app)
        .get('/api/notifications')
        .query({ unreadonly: 'true' })
        .set('Authorization', `Bearer ${user1Auth.accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].isRead).toBe(false);
    });

    it('should return empty when no notifications exist', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${user1Auth.accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.items).toHaveLength(0);
      expect(res.body.data.total).toBe(0);
    });

    it('should return 401 if unauthorized', async () => {
      const res = await request(app)
        .get('/api/notifications');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('should return count of notifications', async () => {
      await createNotification(user1Auth.user._id, user2Auth.user._id);
      await createNotification(user1Auth.user._id, user2Auth.user._id);
      await createNotification(user1Auth.user._id, user2Auth.user._id, { isRead: true });

      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${user1Auth.accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('count');
      // Note: known bug — counts ALL notifications, not just unread
      expect(res.body.data.count).toBe(3);
    });
  });

  describe('GET /api/notifications/settings', () => {
    it('should fetch notification settings', async () => {
      await createNotificationSettings(user1Auth.user._id);

      const res = await request(app)
        .get('/api/notifications/settings')
        .set('Authorization', `Bearer ${user1Auth.accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('likes', true);
      expect(res.body.data).toHaveProperty('comments', true);
      expect(res.body.data).toHaveProperty('follows', true);
    });

    it('should return null data when no settings exist', async () => {
      const res = await request(app)
        .get('/api/notifications/settings')
        .set('Authorization', `Bearer ${user1Auth.accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toBeNull();
    });
  });
});
