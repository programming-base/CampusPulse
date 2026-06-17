import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import chatModel from '../../database/schema/chatSchema/chatSchema.js';
import messageModel from '../../database/schema/chatSchema/messageSchema.js';
import { testUser2, testUser3 } from '../fixtures/users.fixture.js';
import { createTestUser } from '../helpers/auth.helpers.js';

describe('POST /api/chats/:chatId/messages/:messageId/read — branch coverage', () => {
  let user1Auth, user2Auth, user3Auth, chatId;

  beforeEach(async () => {
    user1Auth = await createTestUser();
    user2Auth = await createTestUser(testUser2);
    user3Auth = await createTestUser(testUser3);

    const chat = await chatModel.create({
      type: 'group',
      participants: [user1Auth.user._id, user2Auth.user._id],
      admin: [user1Auth.user._id],
      description: 'Test group',
    });
    chatId = chat._id;
  });

  it('should mark a message as read', async () => {
    const msg = await messageModel.create({
      chatId,
      sender: user2Auth.user._id,
      text: 'Read me',
      type: 'text',
    });

    const res = await request(app)
      .post(`/api/chats/${chatId}/messages/${msg._id}/read`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Message marked as read');

    // Verify readBy
    const updated = await messageModel.findById(msg._id);
    const isRead = updated.readBy.some((id) => id.toString() === user1Auth.user._id);
    expect(isRead).toBe(true);
  });

  it('should handle reading same message twice (idempotent via $addToSet)', async () => {
    const msg = await messageModel.create({
      chatId,
      sender: user2Auth.user._id,
      text: 'Read me twice',
      type: 'text',
    });

    // Read once
    await request(app)
      .post(`/api/chats/${chatId}/messages/${msg._id}/read`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    // Read again
    const res = await request(app)
      .post(`/api/chats/${chatId}/messages/${msg._id}/read`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);

    // Should only appear once in readBy
    const updated = await messageModel.findById(msg._id);
    const readCount = updated.readBy.filter(
      (id) => id.toString() === user1Auth.user._id
    ).length;
    expect(readCount).toBe(1);
  });

  it('should return 403 when message does not belong to chat', async () => {
    // Create a second chat
    const otherChat = await chatModel.create({
      type: 'group',
      participants: [user1Auth.user._id, user3Auth.user._id],
      admin: [user1Auth.user._id],
    });

    // Message belongs to otherChat
    const msg = await messageModel.create({
      chatId: otherChat._id,
      sender: user3Auth.user._id,
      text: 'Wrong chat',
      type: 'text',
    });

    // Try to read it via the first chat
    const res = await request(app)
      .post(`/api/chats/${chatId}/messages/${msg._id}/read`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('message', 'Message does not belong to this chat');
  });

  it('should return 400 for invalid message ID format', async () => {
    const res = await request(app)
      .post(`/api/chats/${chatId}/messages/not-valid-id/read`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Invalid message ID');
  });

  it('should return 400 for non-existent message ID', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post(`/api/chats/${chatId}/messages/${fakeId}/read`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Invalid message ID');
  });

  it('should return 404 for non-participant', async () => {
    const msg = await messageModel.create({
      chatId,
      sender: user1Auth.user._id,
      text: 'Secret',
      type: 'text',
    });

    const res = await request(app)
      .post(`/api/chats/${chatId}/messages/${msg._id}/read`)
      .set('Authorization', `Bearer ${user3Auth.accessToken}`);

    // chatVerification middleware rejects non-participants
    expect(res.statusCode).toBe(404);
  });
});
