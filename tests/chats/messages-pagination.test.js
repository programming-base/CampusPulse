import request from 'supertest';
import app from '../../app.js';
import chatModel from '../../models/chatSchema/chatSchema.js';
import messageModel from '../../models/chatSchema/messageSchema.js';
import { testUser2, testUser3 } from '../fixtures/users.fixture.js';
import { createTestUser } from '../helpers/auth.helpers.js';

describe('GET /api/chats/:chatId/messages — pagination', () => {
  let user1Auth, user2Auth, chatId;

  beforeEach(async () => {
    user1Auth = await createTestUser();
    user2Auth = await createTestUser(testUser2);

    const chat = await chatModel.create({
      type: 'group',
      participants: [user1Auth.user._id, user2Auth.user._id],
      admins: [user1Auth.user._id],
      description: 'Test group',
    });
    chatId = chat._id;
  });

  it('should return empty array for chat with no messages', async () => {
    const res = await request(app)
      .get(`/api/chats/${chatId}/messages`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveLength(0);
    expect(res.body).toHaveProperty('total', 0);
    expect(res.body).toHaveProperty('hasMore', false);
  });

  it('should return messages with default pagination', async () => {
    // Create 3 messages
    for (let i = 0; i < 3; i++) {
      await messageModel.create({
        chatId,
        sender: user1Auth.user._id,
        text: `Message ${i + 1}`,
        type: 'text',
      });
    }

    const res = await request(app)
      .get(`/api/chats/${chatId}/messages`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body).toHaveProperty('page', 1);
    expect(res.body).toHaveProperty('limit', 50); // Default
    expect(res.body).toHaveProperty('total', 3);
    expect(res.body).toHaveProperty('hasMore', false);
  });

  it('should respect custom page and limit', async () => {
    // Create 5 messages
    for (let i = 0; i < 5; i++) {
      await messageModel.create({
        chatId,
        sender: user1Auth.user._id,
        text: `Message ${i + 1}`,
        type: 'text',
      });
    }

    const res = await request(app)
      .get(`/api/chats/${chatId}/messages?page=1&limit=2`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body).toHaveProperty('page', 1);
    expect(res.body).toHaveProperty('limit', 2);
    expect(res.body).toHaveProperty('hasMore', true);
  });

  it('should return correct hasMore for last page', async () => {
    // Create 5 messages
    for (let i = 0; i < 5; i++) {
      await messageModel.create({
        chatId,
        sender: user1Auth.user._id,
        text: `Message ${i + 1}`,
        type: 'text',
      });
    }

    const res = await request(app)
      .get(`/api/chats/${chatId}/messages?page=3&limit=2`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(1); // 5th message
    expect(res.body).toHaveProperty('hasMore', false);
  });

  it('should cap limit at 100', async () => {
    const res = await request(app)
      .get(`/api/chats/${chatId}/messages?limit=200`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('limit', 100);
  });

  it('should default page to 1 and limit to 50 for invalid values', async () => {
    const res = await request(app)
      .get(`/api/chats/${chatId}/messages?page=abc&limit=xyz`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('page', 1);
    expect(res.body).toHaveProperty('limit', 50);
  });

  it('should return 404 for non-participant', async () => {
    const user3Auth = await createTestUser(testUser3);
    const res = await request(app)
      .get(`/api/chats/${chatId}/messages`)
      .set('Authorization', `Bearer ${user3Auth.accessToken}`);

    expect(res.statusCode).toBe(404);
  });

  it('should return 401 without authorization', async () => {
    const res = await request(app)
      .get(`/api/chats/${chatId}/messages`);

    expect(res.statusCode).toBe(401);
  });
});
