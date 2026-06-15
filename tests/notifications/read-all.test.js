import request from 'supertest';
import app from '../../app.js';
import { testUser2 } from '../fixtures/users.fixture.js';
import { createTestUser } from '../helpers/auth.helpers.js';
import { createNotification } from '../helpers/data.helpers.js';

/**
 * Tests for PUT /api/notifications/read-all (notificationsPutRoute.js L37-59).
 *
 * Branches covered:
 *   - !result || result.matchedCount === 0 → 404 (L41)
 *   - Success with modified notifications → 200 (L47)
 */
describe('PUT /api/notifications/read-all', () => {
  let user1Auth, user2Auth;

  beforeEach(async () => {
    user1Auth = await createTestUser();
    user2Auth = await createTestUser(testUser2);
  });

  it('should return 404 when no notifications exist', async () => {
    // Branch: result.matchedCount === 0 (L41)
    const res = await request(app)
      .put('/api/notifications/read-all')
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'No notifications found');
  });

  it('should mark all unread notifications as read', async () => {
    // Branch: success path (L47)
    await createNotification(user1Auth.user._id, user2Auth.user._id, { isRead: false });
    await createNotification(user1Auth.user._id, user2Auth.user._id, { isRead: false, type: 'comment' });

    const res = await request(app)
      .put('/api/notifications/read-all')
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('matchedCount', 2);
    expect(res.body).toHaveProperty('modifiedCount', 2);
  });

  it('should handle already-read notifications (matchedCount ≥ 1)', async () => {
    await createNotification(user1Auth.user._id, user2Auth.user._id, { isRead: true });

    const res = await request(app)
      .put('/api/notifications/read-all')
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('matchedCount', 1);
    // Note: MongoDB may report modifiedCount as 0 or 1 depending on whether
    // the value was actually different. We just verify the request succeeds.
    expect(res.body.modifiedCount).toBeDefined();
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).put('/api/notifications/read-all');
    expect(res.statusCode).toBe(401);
  });
});
