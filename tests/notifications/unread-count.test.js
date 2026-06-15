import request from 'supertest';
import app from '../../app.js';
import { testUser2 } from '../fixtures/users.fixture.js';
import { createTestUser } from '../helpers/auth.helpers.js';
import { createNotification } from '../helpers/data.helpers.js';

/**
 * Tests for GET /api/notifications/unread-count (notificationGetRoute.js L41-56).
 *
 * Branches covered:
 *   - No notifications → count: 0
 *   - Multiple notifications → correct count
 */
describe('GET /api/notifications/unread-count', () => {
  let user1Auth, user2Auth;

  beforeEach(async () => {
    user1Auth = await createTestUser();
    user2Auth = await createTestUser(testUser2);
  });

  it('should return count 0 when no notifications exist', async () => {
    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('count', 0);
  });

  it('should return correct count with notifications', async () => {
    await createNotification(user1Auth.user._id, user2Auth.user._id);
    await createNotification(user1Auth.user._id, user2Auth.user._id, { type: 'comment' });
    await createNotification(user1Auth.user._id, user2Auth.user._id, { type: 'follow' });

    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('count', 3);
  });

  it('should not count other users notifications', async () => {
    await createNotification(user2Auth.user._id, user1Auth.user._id); // user2's notification

    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('count', 0);
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).get('/api/notifications/unread-count');
    expect(res.statusCode).toBe(401);
  });
});
