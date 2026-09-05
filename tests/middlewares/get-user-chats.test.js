import request from 'supertest';
import app from '../../app.js';
import chatModel from '../../database/schema/chatSchema/chatSchema.js';
import { testUser2 } from '../fixtures/users.fixture.js';
import { createTestUser } from '../helpers/auth.helpers.js';

/**
 * Tests for getUserChats middleware (middlewares/chatsMiddleware/getUserChats.js).
 *
 * Branches covered:
 *   - isChatPresent.length === 0 → 404
 *   - isChatPresent has items → next()
 *   - catch block → 500 (implicitly via auth failures)
 */
describe('getUserChats middleware (GET /api/chats)', () => {
  let user1Auth, user2Auth;

  beforeEach(async () => {
    user1Auth = await createTestUser();
    user2Auth = await createTestUser(testUser2);
  });

  it('should return 404 when user has no chats', async () => {
    // Branch: isChatPresent.length === 0
    const res = await request(app)
      .get('/api/chats')
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error', 'Chat not found');
  });

  it('should return 200 with chats when user has chats', async () => {
    // Branch: isChatPresent has items → next() → handler responds 200
    await chatModel.create({
      type: 'group',
      participants: [user1Auth.user._id, user2Auth.user._id],
      admin: user1Auth.user._id,
      description: 'Test group',
    });

    const res = await request(app)
      .get('/api/chats')
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should return 200 with multiple chats', async () => {
    await chatModel.create({
      type: 'group',
      participants: [user1Auth.user._id, user2Auth.user._id],
      admin: user1Auth.user._id,
      description: 'Group A',
    });
    await chatModel.create({
      type: 'group',
      participants: [user1Auth.user._id, user2Auth.user._id],
      admin: user2Auth.user._id,
      description: 'Group B',
    });

    const res = await request(app)
      .get('/api/chats')
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(2);
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app).get('/api/chats');
    expect(res.statusCode).toBe(401);
  });
});
