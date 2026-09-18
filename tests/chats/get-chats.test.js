import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import chatModel from '../../models/chatSchema/chatSchema.js';
import { testUser2, testUser3 } from '../fixtures/users.fixture.js';
import { createTestUser } from '../helpers/auth.helpers.js';

/**
 * Tests for GET /api/chats/:chatId (chatGetRoute.js L53-59).
 * Also covers getUserChats middleware success/empty branches.
 *
 * Branches covered:
 *   - GET /chats/:chatId success → 200
 *   - GET /chats/:chatId non-participant → 404 (chatVerification)
 *   - GET /chats/:chatId invalid ID → 400 (chatVerification)
 */
describe('GET /api/chats/:chatId — chat detail', () => {
  let user1Auth, user2Auth, user3Auth, chatId;

  beforeEach(async () => {
    user1Auth = await createTestUser();
    user2Auth = await createTestUser(testUser2);
    user3Auth = await createTestUser(testUser3);

    const chat = await chatModel.create({
      type: 'group',
      participants: [user1Auth.user._id, user2Auth.user._id],
      admins: [user1Auth.user._id],
      description: 'Test group',
    });
    chatId = chat._id;
  });

  it('should return 200 with chat details for a participant', async () => {
    const res = await request(app)
      .get(`/api/chats/${chatId}`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('type', 'group');
    expect(res.body).toHaveProperty('description', 'Test group');
  });

  it('should return 404 for non-participant', async () => {
    // Branch: chatVerification → !isChatPresent → 404
    const res = await request(app)
      .get(`/api/chats/${chatId}`)
      .set('Authorization', `Bearer ${user3Auth.accessToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error', 'Chat not found');
  });

  it('should return 400 for invalid chatId', async () => {
    // Branch: chatVerification → !mongoose.Types.ObjectId.isValid
    const res = await request(app)
      .get('/api/chats/invalidid')
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid chat ID');
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).get(`/api/chats/${chatId}`);
    expect(res.statusCode).toBe(401);
  });
});
