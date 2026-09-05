import request from 'supertest';
import app from '../../app.js';
import followerModel from '../../database/schema/followSchema/followerSchema.js';
import { testUser, testUser2 } from '../fixtures/users.fixture.js';
import { createTestUser } from '../helpers/auth.helpers.js';

describe('GET /api/users/:userId/followers', () => {
  let user1Auth, user2Auth;

  beforeEach(async () => {
    user1Auth = await createTestUser();
    user2Auth = await createTestUser(testUser2);

    // Manually create a follower record (user2 follows user1)
    await followerModel.create({
      userId: user1Auth.user._id,
      followerId: user2Auth.user._id,
    });
  });

  it('should return followers of a user', async () => {
    const res = await request(app)
      .get(`/api/users/${user1Auth.user._id}/followers`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0]).toHaveProperty('followerId');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('totalPages');
    expect(res.body).toHaveProperty('hasMore');
  });

  it('should return empty data when user has no followers', async () => {
    const res = await request(app)
      .get(`/api/users/${user2Auth.user._id}/followers`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveLength(0);
  });

  it('should support pagination for followers', async () => {
    const res = await request(app)
      .get(`/api/users/${user1Auth.user._id}/followers`)
      .query({ page: 1, limit: 1 })
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('page', 1);
    expect(res.body).toHaveProperty('limit', 1);
  });

  it('should return 401 if unauthorized', async () => {
    const res = await request(app)
      .get(`/api/users/${user1Auth.user._id}/followers`);

    expect(res.statusCode).toBe(401);
  });
});
