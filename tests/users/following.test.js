import request from 'supertest';
import app from '../../app.js';
import followingModel from '../../database/schema/followSchema/followingSchema.js';
import { testUser, testUser2 } from '../fixtures/users.fixture.js';
import { createTestUser } from '../helpers/auth.helpers.js';

// Note: The following endpoint uses /user/ (singular) not /users/
describe('GET /api/user/:userId/following', () => {
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

  it('should return following list for a user', async () => {
    const res = await request(app)
      .get(`/api/user/${user1Auth.user._id}/following`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0]).toHaveProperty('followingId');
  });

  it('should return empty data when user is not following anyone', async () => {
    const res = await request(app)
      .get(`/api/user/${user2Auth.user._id}/following`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveLength(0);
  });

  it('should support pagination for following', async () => {
    const res = await request(app)
      .get(`/api/user/${user1Auth.user._id}/following`)
      .query({ page: 1, limit: 10 })
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('page', 1);
    expect(res.body).toHaveProperty('totalPages');
    expect(res.body).toHaveProperty('hasMore');
  });

  it('should return 401 if unauthorized', async () => {
    const res = await request(app)
      .get(`/api/user/${user1Auth.user._id}/following`);

    expect(res.statusCode).toBe(401);
  });
});
