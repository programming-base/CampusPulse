import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import chatModel from '../../models/chatSchema/chatSchema.js';
import { testUser2, testUser3 } from '../fixtures/users.fixture.js';
import { createTestUser } from '../helpers/auth.helpers.js';

describe('POST /api/chats/:chatId/members — add members', () => {
  let adminAuth, user2Auth, user3Auth, chatId;

  beforeEach(async () => {
    adminAuth = await createTestUser();
    user2Auth = await createTestUser(testUser2);
    user3Auth = await createTestUser(testUser3);

    // Create group with admin as sole participant and admin
    const chat = await chatModel.create({
      type: 'group',
      participants: [adminAuth.user._id, user2Auth.user._id],
      admins: [adminAuth.user._id],
      description: 'Test group',
    });
    chatId = chat._id;
  });

  it('should allow admin to add new members', async () => {
    const res = await request(app)
      .post(`/api/chats/${chatId}/members`)
      .set('Authorization', `Bearer ${adminAuth.accessToken}`)
      .send({ memberIds: [user3Auth.user._id] });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message', 'Participants Added');

    // Verify member was added
    const chat = await chatModel.findById(chatId);
    const isMember = chat.participants.some(
      (p) => p.toString() === user3Auth.user._id
    );
    expect(isMember).toBe(true);
  });

  it('should return 403 when non-admin tries to add members', async () => {
    const res = await request(app)
      .post(`/api/chats/${chatId}/members`)
      .set('Authorization', `Bearer ${user2Auth.accessToken}`)
      .send({ memberIds: [user3Auth.user._id] });

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('message', 'Only admin can add participants');
  });

  it('should return 400 when memberIds is empty array', async () => {
    const res = await request(app)
      .post(`/api/chats/${chatId}/members`)
      .set('Authorization', `Bearer ${adminAuth.accessToken}`)
      .send({ memberIds: [] });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Please mention participants IDs');
  });

  it('should return 400 when memberIds is missing', async () => {
    const res = await request(app)
      .post(`/api/chats/${chatId}/members`)
      .set('Authorization', `Bearer ${adminAuth.accessToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 when memberIds is not an array', async () => {
    const res = await request(app)
      .post(`/api/chats/${chatId}/members`)
      .set('Authorization', `Bearer ${adminAuth.accessToken}`)
      .send({ memberIds: 'not-an-array' });

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 when member IDs do not exist in database', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post(`/api/chats/${chatId}/members`)
      .set('Authorization', `Bearer ${adminAuth.accessToken}`)
      .send({ memberIds: [fakeId] });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'One or more users does not exist');
  });

  it('should handle adding an already-existing participant (idempotent via $addToSet)', async () => {
    // user2 is already a participant
    const res = await request(app)
      .post(`/api/chats/${chatId}/members`)
      .set('Authorization', `Bearer ${adminAuth.accessToken}`)
      .send({ memberIds: [user2Auth.user._id] });

    expect(res.statusCode).toBe(200);

    // Should not have duplicates
    const chat = await chatModel.findById(chatId);
    const user2Count = chat.participants.filter(
      (p) => p.toString() === user2Auth.user._id
    ).length;
    expect(user2Count).toBe(1);
  });

  it('should return 404 for non-participant trying to add members', async () => {
    const res = await request(app)
      .post(`/api/chats/${chatId}/members`)
      .set('Authorization', `Bearer ${user3Auth.accessToken}`)
      .send({ memberIds: [user3Auth.user._id] });

    // chatVerification returns 404 for non-participants
    expect(res.statusCode).toBe(404);
  });

  it('should return 401 without authorization', async () => {
    const res = await request(app)
      .post(`/api/chats/${chatId}/members`)
      .send({ memberIds: [user3Auth.user._id] });

    expect(res.statusCode).toBe(401);
  });
});
