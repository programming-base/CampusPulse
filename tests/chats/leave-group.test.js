import request from 'supertest';
import app from '../../app.js';
import chatModel from '../../models/chatSchema/chatSchema.js';
import { testUser2, testUser3 } from '../fixtures/users.fixture.js';
import { createTestUser } from '../helpers/auth.helpers.js';

describe('POST /api/chats/:chatId/leave — leave group', () => {
  let adminAuth, user2Auth, user3Auth;

  beforeEach(async () => {
    adminAuth = await createTestUser();
    user2Auth = await createTestUser(testUser2);
    user3Auth = await createTestUser(testUser3);
  });

  it('should allow regular member to leave group', async () => {
    const chat = await chatModel.create({
      type: 'group',
      participants: [adminAuth.user._id, user2Auth.user._id, user3Auth.user._id],
      admins: [adminAuth.user._id],
      description: 'Test group',
    });

    const res = await request(app)
      .post(`/api/chats/${chat._id}/leave`)
      .set('Authorization', `Bearer ${user2Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message', 'You left the group');

    // Verify user was removed from participants
    const updatedChat = await chatModel.findById(chat._id);
    const isMember = updatedChat.participants.some(
      (p) => p.toString() === user2Auth.user._id
    );
    expect(isMember).toBe(false);
  });

  it('should return 400 when sole admin tries to leave without assigning new admin', async () => {
    const chat = await chatModel.create({
      type: 'group',
      participants: [adminAuth.user._id, user2Auth.user._id],
      admins: [adminAuth.user._id], // Only admin
      description: 'Test group',
    });

    const res = await request(app)
      .post(`/api/chats/${chat._id}/leave`)
      .set('Authorization', `Bearer ${adminAuth.accessToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Please choose Admin first');
  });

  it('should allow admin to leave when other admins exist', async () => {
    const chat = await chatModel.create({
      type: 'group',
      participants: [adminAuth.user._id, user2Auth.user._id, user3Auth.user._id],
      admins: [adminAuth.user._id, user2Auth.user._id], // Two admins
      description: 'Test group',
    });

    const res = await request(app)
      .post(`/api/chats/${chat._id}/leave`)
      .set('Authorization', `Bearer ${adminAuth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'You left the group');

    // Verify admin was removed from both participants and admin arrays
    const updatedChat = await chatModel.findById(chat._id);
    const isParticipant = updatedChat.participants.some(
      (p) => p.toString() === adminAuth.user._id
    );
    const isAdmin = updatedChat.admins.some(
      (a) => a.toString() === adminAuth.user._id
    );
    expect(isParticipant).toBe(false);
    expect(isAdmin).toBe(false);
  });

  it('should return 404 when non-participant tries to leave', async () => {
    const chat = await chatModel.create({
      type: 'group',
      participants: [adminAuth.user._id, user2Auth.user._id],
      admins: [adminAuth.user._id],
      description: 'Test group',
    });

    const res = await request(app)
      .post(`/api/chats/${chat._id}/leave`)
      .set('Authorization', `Bearer ${user3Auth.accessToken}`);

    // chatVerification returns 404 for non-participants
    expect(res.statusCode).toBe(404);
  });

  it('should return 401 without authorization', async () => {
    const chat = await chatModel.create({
      type: 'group',
      participants: [adminAuth.user._id],
      admins: [adminAuth.user._id],
    });

    const res = await request(app)
      .post(`/api/chats/${chat._id}/leave`);

    expect(res.statusCode).toBe(401);
  });
});
