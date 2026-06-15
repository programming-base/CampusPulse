import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import notificationModel from '../../database/schema/notificationSchema/notificationSchema.js';
import { createTestUser } from '../helpers/auth.helpers.js';
import { createNotification } from '../helpers/data.helpers.js';
import { testUser2 } from '../fixtures/users.fixture.js';

describe('Notifications Update API', () => {
  let user1Auth, user2Auth;

  beforeEach(async () => {
    user1Auth = await createTestUser();
    user2Auth = await createTestUser(testUser2);
  });

  describe('PUT /api/notifications/:notificationId/read', () => {
    it('should mark a notification as read', async () => {
      const notification = await createNotification(user1Auth.user._id, user2Auth.user._id);

      const res = await request(app)
        .put(`/api/notifications/${notification._id}/read`)
        .set('Authorization', `Bearer ${user1Auth.accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message', 'Notification is marked as read');

      // Verify in DB
      const updated = await notificationModel.findById(notification._id);
      expect(updated.isRead).toBe(true);
    });

    it('should return 400 for invalid notification ID', async () => {
      const res = await request(app)
        .put('/api/notifications/invalidid/read')
        .set('Authorization', `Bearer ${user1Auth.accessToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'Invalid notification ID');
    });

    it('should return 404 for non-existing notification', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .put(`/api/notifications/${fakeId}/read`)
        .set('Authorization', `Bearer ${user1Auth.accessToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      await createNotification(user1Auth.user._id, user2Auth.user._id);
      await createNotification(user1Auth.user._id, user2Auth.user._id, {
        title: 'Second',
        message: 'Second notification',
      });

      const res = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${user1Auth.accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('matchedCount', 2);
      expect(res.body).toHaveProperty('modifiedCount', 2);

      // Verify all are read
      const unread = await notificationModel.countDocuments({
        recipient: user1Auth.user._id,
        isRead: false,
      });
      expect(unread).toBe(0);
    });

    it('should return 404 when no notifications exist', async () => {
      const res = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${user1Auth.accessToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/notifications/settings', () => {
    it('should create/update notification settings', async () => {
      const res = await request(app)
        .put('/api/notifications/settings')
        .set('Authorization', `Bearer ${user1Auth.accessToken}`)
        .send({ likes: false, comments: false });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('likes', false);
      expect(res.body.data).toHaveProperty('comments', false);
    });

    it('should upsert settings (create if not existing)', async () => {
      const res = await request(app)
        .put('/api/notifications/settings')
        .set('Authorization', `Bearer ${user1Auth.accessToken}`)
        .send({ emailNotifications: true });

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('emailNotifications', true);
    });

    it('should return 400 if body is empty', async () => {
      const res = await request(app)
        .put('/api/notifications/settings')
        .set('Authorization', `Bearer ${user1Auth.accessToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'Update feilds missing');
    });
  });
});
