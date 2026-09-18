import request from 'supertest';
import app from '../../app.js';
import chatModel from '../../models/chatSchema/chatSchema.js';
import { testUser2, testUser3 } from '../fixtures/users.fixture.js';
import { createTestUser } from '../helpers/auth.helpers.js';

/**
 * Security-focused tests for chat routes.
 *
 * Protected Chat fields must not be writable through the settings endpoint.
 */
describe('Chat Security Tests', () => {
  let adminAuth, user2Auth, user3Auth, chatId;

  beforeEach(async () => {
    adminAuth = await createTestUser();
    user2Auth = await createTestUser(testUser2);
    user3Auth = await createTestUser(testUser3);

    const chat = await chatModel.create({
      type: 'group',
      participants: [adminAuth.user._id, user2Auth.user._id],
      admins: [adminAuth.user._id],
      description: 'Original description',
    });
    chatId = chat._id;
  });

  describe('Mass Assignment via PUT /api/chats/:chatId', () => {
    it('should not allow overwriting admins via PUT body', async () => {
      // SECURITY BUG: The route applies $set: modifications directly
      // A malicious user can overwrite the admin array
      const res = await request(app)
        .put(`/api/chats/${chatId}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({ admins: [user2Auth.user._id] });

      // The route succeeds because it doesn't validate which fields can be modified
      expect(res.statusCode).toBe(400);

      // Verify: admin was overwritten (this IS the bug — it shouldn't be allowed)
      const chat = await chatModel.findById(chatId);
      const isUser1Admin = chat.admins.some(
        (admin) => admin.toString() === adminAuth.user._id
      );
      // BUG: This passes, proving the mass assignment vulnerability
      expect(isUser1Admin).toBe(true);
    });

    it('should not allow overwriting participants via PUT body', async () => {
      const res = await request(app)
        .put(`/api/chats/${chatId}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({ participants: [user2Auth.user._id] });

      expect(res.statusCode).toBe(400);

      // Verify: admin was removed from participants (shouldn't be possible)
      const chat = await chatModel.findById(chatId);
      const isAdminParticipant = chat.participants.some(
        (p) => p.toString() === adminAuth.user._id
      );
      expect(isAdminParticipant).toBe(true);
    });

    it('should not allow changing chat type via PUT body', async () => {
      const res = await request(app)
        .put(`/api/chats/${chatId}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({ type: 'dm' });

      expect(res.statusCode).toBe(400);

      const chat = await chatModel.findById(chatId);
      expect(chat.type).toBe('group');
    });

    it('should not allow overwriting messageCount via PUT body', async () => {
      const res = await request(app)
        .put(`/api/chats/${chatId}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({ messageCount: 99999 });

      expect(res.statusCode).toBe(400);

      const chat = await chatModel.findById(chatId);
      expect(chat.messageCount).toBe(0);
    });
  });

  describe('Authorization checks', () => {
    it('should return 404 when non-participant accesses chat details', async () => {
      const res = await request(app)
        .get(`/api/chats/${chatId}`)
        .set('Authorization', `Bearer ${user3Auth.accessToken}`);

      expect(res.statusCode).toBe(404);
    });

    it('should return 404 when non-participant tries to send message', async () => {
      const res = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${user3Auth.accessToken}`)
        .send({ text: 'Intruder!', type: 'text' });

      expect(res.statusCode).toBe(404);
    });

    it('should return 404 when non-participant tries to update chat', async () => {
      const res = await request(app)
        .put(`/api/chats/${chatId}`)
        .set('Authorization', `Bearer ${user3Auth.accessToken}`)
        .send({ description: 'Hacked' });

      expect(res.statusCode).toBe(404);
    });
  });
});
