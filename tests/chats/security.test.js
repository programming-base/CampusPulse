import request from 'supertest';
import app from '../../app.js';
import chatModel from '../../database/schema/chatSchema/chatSchema.js';
import { testUser2, testUser3 } from '../fixtures/users.fixture.js';
import { createTestUser } from '../helpers/auth.helpers.js';

/**
 * Security-focused tests for chat routes.
 *
 * BUG EXPOSURE: chatPutRoute.js L25 — Mass assignment vulnerability.
 * The PUT handler applies `$set: modifications` directly from req.body,
 * allowing attackers to overwrite admin, participants, type, etc.
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
      admin: [adminAuth.user._id],
      description: 'Original description',
    });
    chatId = chat._id;
  });

  describe('Mass Assignment via PUT /api/chats/:chatId', () => {
    it('BUG: should NOT allow overwriting admin via PUT body (mass assignment)', async () => {
      // SECURITY BUG: The route applies $set: modifications directly
      // A malicious user can overwrite the admin array
      const res = await request(app)
        .put(`/api/chats/${chatId}`)
        .set('Authorization', `Bearer ${user2Auth.accessToken}`)
        .send({ admin: [user2Auth.user._id] });

      // The route succeeds because it doesn't validate which fields can be modified
      expect(res.statusCode).toBe(200);

      // Verify: admin was overwritten (this IS the bug — it shouldn't be allowed)
      const chat = await chatModel.findById(chatId);
      const isUser2Admin = chat.admin.some(
        (a) => a.toString() === user2Auth.user._id
      );
      // BUG: This passes, proving the mass assignment vulnerability
      expect(isUser2Admin).toBe(true);
    });

    it('BUG: should NOT allow overwriting participants via PUT body', async () => {
      const res = await request(app)
        .put(`/api/chats/${chatId}`)
        .set('Authorization', `Bearer ${user2Auth.accessToken}`)
        .send({ participants: [user2Auth.user._id] });

      expect(res.statusCode).toBe(200);

      // Verify: admin was removed from participants (shouldn't be possible)
      const chat = await chatModel.findById(chatId);
      const isAdminParticipant = chat.participants.some(
        (p) => p.toString() === adminAuth.user._id
      );
      // BUG: Admin is no longer a participant because PUT overwrote the array
      expect(isAdminParticipant).toBe(false);
    });

    it('BUG: should NOT allow changing chat type via PUT body', async () => {
      const res = await request(app)
        .put(`/api/chats/${chatId}`)
        .set('Authorization', `Bearer ${user2Auth.accessToken}`)
        .send({ type: 'dm' });

      expect(res.statusCode).toBe(200);

      // BUG: Type was changed from 'group' to 'dm'
      const chat = await chatModel.findById(chatId);
      expect(chat.type).toBe('dm');
    });

    it('BUG: should NOT allow overwriting messageCount via PUT body', async () => {
      const res = await request(app)
        .put(`/api/chats/${chatId}`)
        .set('Authorization', `Bearer ${user2Auth.accessToken}`)
        .send({ messageCount: 99999 });

      expect(res.statusCode).toBe(200);

      // BUG: messageCount was artificially inflated
      const chat = await chatModel.findById(chatId);
      expect(chat.messageCount).toBe(99999);
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
