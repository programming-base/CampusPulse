import request from 'supertest';
import app from '../../app.js';
import { testUser2 } from '../fixtures/users.fixture.js';
import { createTestUser } from '../helpers/auth.helpers.js';
import { followUser } from '../helpers/data.helpers.js';

/**
 * Tests for GET /api/users/:userId/is-following (usersGetRoute.js L106-117).
 *
 * Branches covered:
 *   - targetUser === client → isFollowing: false (self-check, L110)
 *   - !isFollowing → isFollowing: false (L112)
 *   - isFollowing found → isFollowing: true (L113)
 */
describe('GET /api/users/:userId/is-following', () => {
  let user1Auth, user2Auth;

  beforeEach(async () => {
    user1Auth = await createTestUser();
    user2Auth = await createTestUser(testUser2);
  });

  it('should return isFollowing: false for self-check', async () => {
    // Branch: targetUser === client (L110)
    const res = await request(app)
      .get(`/api/users/${user1Auth.user._id}/is-following`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('isFollowing', false);
  });

  it('should return isFollowing: false when not following', async () => {
    // Branch: !isFollowing (L112)
    const res = await request(app)
      .get(`/api/users/${user2Auth.user._id}/is-following`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('isFollowing', false);
  });

  it('should return isFollowing: true when following', async () => {
    // Branch: isFollowing found (L113)
    await followUser(user1Auth.accessToken, user2Auth.user._id);

    const res = await request(app)
      .get(`/api/users/${user2Auth.user._id}/is-following`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('isFollowing', true);
  });

  it('should return 401 without auth', async () => {
    const res = await request(app)
      .get(`/api/users/${user2Auth.user._id}/is-following`);

    expect(res.statusCode).toBe(401);
  });
});
