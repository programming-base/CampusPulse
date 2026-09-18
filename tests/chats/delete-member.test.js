import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import chatModel from '../../models/chatSchema/chatSchema.js';
import { testUser2, testUser3 } from '../fixtures/users.fixture.js';
import { createTestUser } from '../helpers/auth.helpers.js';

/**
 * Tests for DELETE /api/chats/:chatId/members/:userId (chatDeleteRoute.js L60-115).
 *
 * Branches covered:
 *   - Invalid userId format → 400 (L64)
 *   - User not a participant → 404 (L76)
 *   - userId === req.user.userId (self-leave) → 200 (L84)
 *   - requester not in admins → 403 (L96)
 *   - Admin removes member → 200 (L104)
 */
describe('DELETE /api/chats/:chatId/members/:userId — member removal', () => {
  let user1Auth, user2Auth, user3Auth, chatId;

  beforeEach(async () => {
    user1Auth = await createTestUser();
    user2Auth = await createTestUser(testUser2);
    user3Auth = await createTestUser(testUser3);

    const chat = await chatModel.create({
      type: 'group',
      participants: [user1Auth.user._id, user2Auth.user._id, user3Auth.user._id],
      admins: [user1Auth.user._id],
      description: 'Test group',
    });
    chatId = chat._id;
  });

  it('should return 400 for invalid userId format', async () => {
    // Branch: !mongoose.Types.ObjectId.isValid(userId) (L64)
    const res = await request(app)
      .delete(`/api/chats/${chatId}/members/invalidid`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Invalid user ID');
  });

  it('should return 404 when target user is not a participant', async () => {
    // Branch: !participant (L76)
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .delete(`/api/chats/${chatId}/members/${fakeId}`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'User is not a participant in this chat');
  });

  it('should allow self-leave (user removes themselves)', async () => {
    // Branch: userId === req.user.userId (L84)
    const res = await request(app)
      .delete(`/api/chats/${chatId}/members/${user2Auth.user._id}`)
      .set('Authorization', `Bearer ${user2Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'You left the group');

    // Verify user was removed
    const chat = await chatModel.findById(chatId);
    const isStillParticipant = chat.participants.some(
      p => p.toString() === user2Auth.user._id
    );
    expect(isStillParticipant).toBe(false);
  });

  it('should return 403 when non-admin tries to remove another member', async () => {
    // Branch: requester is not in admins (L96)
    const res = await request(app)
      .delete(`/api/chats/${chatId}/members/${user3Auth.user._id}`)
      .set('Authorization', `Bearer ${user2Auth.accessToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('message', 'Only admins can remove the user');
  });

  it('should allow admin to remove a member', async () => {
    // Branch: admin removal success (L104)
    const res = await request(app)
      .delete(`/api/chats/${chatId}/members/${user2Auth.user._id}`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('Admin removed');

    // Verify member was removed
    const chat = await chatModel.findById(chatId);
    const isStillParticipant = chat.participants.some(
      p => p.toString() === user2Auth.user._id
    );
    expect(isStillParticipant).toBe(false);
  });
});
