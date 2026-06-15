import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import chatModel from '../../database/schema/chatSchema/chatSchema.js';
import { testUser2, testUser3 } from '../fixtures/users.fixture.js';
import { createTestUser } from '../helpers/auth.helpers.js';

describe('Chat Members & Settings API', () => {
  let user1Auth, user2Auth, user3Auth, chatId;

  beforeEach(async () => {
    user1Auth = await createTestUser();
    user2Auth = await createTestUser(testUser2);
    user3Auth = await createTestUser(testUser3);

    // Create a group chat with user1 as admin
    const chat = await chatModel.create({
      type: 'group',
      participants: [user1Auth.user._id, user2Auth.user._id],
      admin: user1Auth.user._id,
      description: 'Test group',
    });
    chatId = chat._id;
  });

  describe('GET /api/chats', () => {
    it('should return user chat rooms', async () => {
      const res = await request(app)
        .get('/api/chats')
        .set('Authorization', `Bearer ${user1Auth.accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 404 when user has no chats', async () => {
      const res = await request(app)
        .get('/api/chats')
        .set('Authorization', `Bearer ${user3Auth.accessToken}`);

      // getUserChats middleware returns 404 when no chats found
      expect(res.statusCode).toBe(404);
    });

    it('should return 401 if unauthorized', async () => {
      const res = await request(app)
        .get('/api/chats');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/chats/:chatId', () => {
    it('should return chat metadata', async () => {
      const res = await request(app)
        .get(`/api/chats/${chatId}`)
        .set('Authorization', `Bearer ${user1Auth.accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('type', 'group');
      expect(res.body).toHaveProperty('description', 'Test group');
    });

    it('should return 404 for non-participant', async () => {
      const res = await request(app)
        .get(`/api/chats/${chatId}`)
        .set('Authorization', `Bearer ${user3Auth.accessToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/chats/:chatId', () => {
    it('should update chat settings', async () => {
      const res = await request(app)
        .put(`/api/chats/${chatId}`)
        .set('Authorization', `Bearer ${user1Auth.accessToken}`)
        .send({ description: 'Updated description' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.chat).toHaveProperty('description', 'Updated description');
    });

    it('should return 400 if body is empty', async () => {
      const res = await request(app)
        .put(`/api/chats/${chatId}`)
        .set('Authorization', `Bearer ${user1Auth.accessToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'Modification fields are empty');
    });
  });

  describe('DELETE /api/chats/:chatId/members/:userId', () => {
    it('should allow admin to remove a member', async () => {
      const res = await request(app)
        .delete(`/api/chats/${chatId}/members/${user2Auth.user._id}`)
        .set('Authorization', `Bearer ${user1Auth.accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);

      // Verify member was removed
      const chat = await chatModel.findById(chatId);
      const isMember = chat.participants.some(
        (p) => p.toString() === user2Auth.user._id
      );
      expect(isMember).toBe(false);
    });

    it('should allow a user to remove themselves', async () => {
      const res = await request(app)
        .delete(`/api/chats/${chatId}/members/${user2Auth.user._id}`)
        .set('Authorization', `Bearer ${user2Auth.accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'You left the group');
    });

    it('should return 403 when non-admin tries to remove another user', async () => {
      // Add user3 to the chat first
      await chatModel.findByIdAndUpdate(chatId, {
        $addToSet: { participants: user3Auth.user._id },
      });

      const res = await request(app)
        .delete(`/api/chats/${chatId}/members/${user1Auth.user._id}`)
        .set('Authorization', `Bearer ${user2Auth.accessToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('should return 400 for invalid user ID', async () => {
      const res = await request(app)
        .delete(`/api/chats/${chatId}/members/invalidid`)
        .set('Authorization', `Bearer ${user1Auth.accessToken}`);

      expect(res.statusCode).toBe(400);
    });
  });
});
