import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import chatModel from '../../database/schema/chatSchema/chatSchema.js';
import { testUser2 } from '../fixtures/users.fixture.js';
import { createTestUser } from '../helpers/auth.helpers.js';

describe('chatVerification Middleware', () => {
  let user1Auth, user2Auth, chatId;

  beforeEach(async () => {
    user1Auth = await createTestUser();
    user2Auth = await createTestUser(testUser2);

    const chat = await chatModel.create({
      type: 'group',
      participants: [user1Auth.user._id],
      admin: user1Auth.user._id,
      description: 'Test group',
    });
    chatId = chat._id;
  });

  it('should pass when user is a participant', async () => {
    const res = await request(app)
      .get(`/api/chats/${chatId}`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
  });

  it('should return 404 when user is not a participant', async () => {
    const res = await request(app)
      .get(`/api/chats/${chatId}`)
      .set('Authorization', `Bearer ${user2Auth.accessToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error', 'Chat not found');
  });

  it('should return 400 for invalid chat ID format', async () => {
    const res = await request(app)
      .get('/api/chats/invalidchatid')
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid chat ID');
  });

  it('should return 404 for non-existent chat', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/chats/${fakeId}`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error', 'Chat not found');
  });
});
