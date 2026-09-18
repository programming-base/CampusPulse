import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import chatModel from '../../models/chatSchema/chatSchema.js';
import { testUser2 } from '../fixtures/users.fixture.js';
import { createTestUser } from '../helpers/auth.helpers.js';

describe('DM Chat API', () => {
  let user1Auth, user2Auth;

  beforeEach(async () => {
    user1Auth = await createTestUser();
    user2Auth = await createTestUser(testUser2);
  });

  describe('POST /api/chats/dm/messages/:userId', () => {
    it('should send a DM successfully (creates DM room)', async () => {
      const res = await request(app)
        .post(`/api/chats/dm/messages/${user2Auth.user._id}`)
        .set('Authorization', `Bearer ${user1Auth.accessToken}`)
        .send({ text: 'Hello there!', type: 'text' });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('text', 'Hello there!');
    });

    it('should return 400 if message text is missing', async () => {
      const res = await request(app)
        .post(`/api/chats/dm/messages/${user2Auth.user._id}`)
        .set('Authorization', `Bearer ${user1Auth.accessToken}`)
        .send({ type: 'text' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'Message text is required');
    });

    it('should return 400 if message text is empty', async () => {
      const res = await request(app)
        .post(`/api/chats/dm/messages/${user2Auth.user._id}`)
        .set('Authorization', `Bearer ${user1Auth.accessToken}`)
        .send({ text: '   ', type: 'text' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'Message text is required');
    });

    it('should return 400 for invalid user ID', async () => {
      const res = await request(app)
        .post('/api/chats/dm/messages/invalidid')
        .set('Authorization', `Bearer ${user1Auth.accessToken}`)
        .send({ text: 'Hello', type: 'text' });

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post(`/api/chats/dm/messages/${fakeId}`)
        .set('Authorization', `Bearer ${user1Auth.accessToken}`)
        .send({ text: 'Hello', type: 'text' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'user does not exist');
    });

    it('should return 401 if unauthorized', async () => {
      const res = await request(app)
        .post(`/api/chats/dm/messages/${user2Auth.user._id}`)
        .send({ text: 'Hello', type: 'text' });

      expect(res.statusCode).toBe(401);
    });
  });
});
