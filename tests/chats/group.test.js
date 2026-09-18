import request from 'supertest';
import app from '../../app.js';
import chatModel from '../../models/chatSchema/chatSchema.js';
import { testUser2, testUser3 } from '../fixtures/users.fixture.js';
import { createTestUser } from '../helpers/auth.helpers.js';

describe('Group Chat API', () => {
  let user1Auth, user2Auth, user3Auth;

  beforeEach(async () => {
    user1Auth = await createTestUser();
    user2Auth = await createTestUser(testUser2);
    user3Auth = await createTestUser(testUser3);
  });

  describe('POST /api/chats/group', () => {
    it('should create a group chat successfully', async () => {
      const res = await request(app)
        .post('/api/chats/group')
        .set('Authorization', `Bearer ${user1Auth.accessToken}`)
        .send({
          name: 'Study Group',
          description: 'For exam prep',
          memberIds: [user1Auth.user._id, user2Auth.user._id],
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data).toHaveProperty('type', 'group');
      expect(res.body.data.participants).toHaveLength(2);
    });

    it('should return 400 if name is missing', async () => {
      const res = await request(app)
        .post('/api/chats/group')
        .set('Authorization', `Bearer ${user1Auth.accessToken}`)
        .send({
          memberIds: [user1Auth.user._id, user2Auth.user._id],
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'Group name is required');
    });

    it('should return 400 if memberIds is missing', async () => {
      const res = await request(app)
        .post('/api/chats/group')
        .set('Authorization', `Bearer ${user1Auth.accessToken}`)
        .send({ name: 'Empty Group' });

      expect(res.statusCode).toBe(400);
    });

    it('should return 401 if unauthorized', async () => {
      const res = await request(app)
        .post('/api/chats/group')
        .send({
          name: 'Group',
          memberIds: [user1Auth.user._id],
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/chats/:chatId/leave', () => {
    let chatId;

    beforeEach(async () => {
      const chat = await chatModel.create({
        type: 'group',
        participants: [user1Auth.user._id, user2Auth.user._id, user3Auth.user._id],
        admins: [user1Auth.user._id],
        description: 'Test group',
      });
      chatId = chat._id;
    });

    it('should allow a non-admin member to leave the group', async () => {
      const res = await request(app)
        .post(`/api/chats/${chatId}/leave`)
        .set('Authorization', `Bearer ${user2Auth.accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message', 'You left the group');
    });

    it('should return 404 if non-participant tries to leave', async () => {
      const newUserAuth = await createTestUser({
        email: 'outsider@test.com',
        userName: 'outsider',
      });

      const res = await request(app)
        .post(`/api/chats/${chatId}/leave`)
        .set('Authorization', `Bearer ${newUserAuth.accessToken}`);

      // chatVerification middleware returns 404 for non-participant
      expect(res.statusCode).toBe(404);
    });

    it('should return 401 if unauthorized', async () => {
      const res = await request(app)
        .post(`/api/chats/${chatId}/leave`);

      expect(res.statusCode).toBe(401);
    });
  });
});
