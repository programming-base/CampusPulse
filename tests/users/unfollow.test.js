import request from 'supertest';
import app from '../../app.js';
import followingModel from '../../database/schema/followSchema/followingSchema.js';
import { testUser, testUser2 } from '../fixtures/users.fixture.js';
import { createTestUser } from '../helpers/auth.helpers.js';

describe('DELETE /api/users/:userId/follow', () => {
  let user1Auth, user2Auth;

  beforeEach(async () => {
    user1Auth = await createTestUser();
    user2Auth = await createTestUser(testUser2);

    // user1 follows user2
    await followingModel.create({
      userId: user1Auth.user._id,
      followingId: user2Auth.user._id,
    });
  });

  it('should unfollow a user successfully', async () => {
    const res = await request(app)
      .delete(`/api/users/${user2Auth.user._id}/follow`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message', 'User Unfollowed');

    // Verify in DB
    const followRecord = await followingModel.findOne({
      userId: user1Auth.user._id,
      followingId: user2Auth.user._id,
    });
    expect(followRecord).toBeNull();
  });

  it('should return 401 when unfollowing a non-followed user', async () => {
    // user2 tries to unfollow user1 (not following)
    const res = await request(app)
      .delete(`/api/users/${user1Auth.user._id}/follow`)
      .set('Authorization', `Bearer ${user2Auth.accessToken}`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Unauthorized');
  });

  it('should prevent self-unfollow', async () => {
    const res = await request(app)
      .delete(`/api/users/${user1Auth.user._id}/follow`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(400);
  });

  it('should return 401 if unauthorized', async () => {
    const res = await request(app)
      .delete(`/api/users/${user2Auth.user._id}/follow`);

    expect(res.statusCode).toBe(401);
  });
});
