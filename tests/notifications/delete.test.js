import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import notificationModel from '../../models/notificationSchema/notificationSchema.js';
import { createTestUser } from '../helpers/auth.helpers.js';
import { createNotification } from '../helpers/data.helpers.js';
import { testUser2 } from '../fixtures/users.fixture.js';

describe('Notifications Delete API', () => {
  let user1Auth, user2Auth;

  beforeEach(async () => {
    user1Auth = await createTestUser();
    user2Auth = await createTestUser(testUser2);
  });

  describe('DELETE /api/notifications/:notificationId', () => {
    it('should delete a notification', async () => {
      const notification = await createNotification(user1Auth.user._id, user2Auth.user._id);

      const res = await request(app)
        .delete(`/api/notifications/${notification._id}`)
        .set('Authorization', `Bearer ${user1Auth.accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message', 'Notification deleted');

      // Verify deleted
      const deleted = await notificationModel.findById(notification._id);
      expect(deleted).toBeNull();
    });

    it('should return 400 for invalid notification ID', async () => {
      const res = await request(app)
        .delete('/api/notifications/invalidid')
        .set('Authorization', `Bearer ${user1Auth.accessToken}`);

      expect(res.statusCode).toBe(400);
    });

    it('should return 200 even for non-existing notification (idempotent)', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .delete(`/api/notifications/${fakeId}`)
        .set('Authorization', `Bearer ${user1Auth.accessToken}`);

      // The route doesn't check if the notification exists before deleting
      expect(res.statusCode).toBe(200);
    });
  });

  describe('DELETE /api/notifications/clear-read', () => {
    it('should successfully clear read notifications for the current user', async () => {
      // Create a read notification for user 1
      const readNotifUser1 = await createNotification(user1Auth.user._id, user2Auth.user._id, { isRead: true });
      // Create an unread notification for user 1
      const unreadNotifUser1 = await createNotification(user1Auth.user._id, user2Auth.user._id, { isRead: false });
      // Create a read notification for user 2
      const readNotifUser2 = await createNotification(user2Auth.user._id, user1Auth.user._id, { isRead: true });

      const res = await request(app)
        .delete('/api/notifications/clear-read')
        .set('Authorization', `Bearer ${user1Auth.accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message', 'Read notifications cleared');

      // Verify that user 1's read notification was deleted
      const deletedReadNotif = await notificationModel.findById(readNotifUser1._id);
      expect(deletedReadNotif).toBeNull();

      // Verify that user 1's unread notification was NOT deleted
      const keptUnreadNotif = await notificationModel.findById(unreadNotifUser1._id);
      expect(keptUnreadNotif).not.toBeNull();

      // Verify that user 2's read notification was NOT deleted
      const keptOtherUserNotif = await notificationModel.findById(readNotifUser2._id);
      expect(keptOtherUserNotif).not.toBeNull();
    });
  });
});
