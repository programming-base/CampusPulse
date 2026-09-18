import request from 'supertest';
import app from '../../app.js';
import chatModel from '../../models/chatSchema/chatSchema.js';
import { testUser2, testUser3 } from '../fixtures/users.fixture.js';
import { createTestUser } from '../helpers/auth.helpers.js';

/**
 * Tests for PUT /api/chats/:chatId (chatPutRoute.js L9-42).
 *
 * Branches covered:
 *   - Object.keys(modifications).length === 0 → 400 (L17)
 *   - Success → 200 with updated chat (L34)
 *   - Non-participant → 404 (chatVerification middleware)
 */
describe('PUT /api/chats/:chatId — chat settings', () => {
  let user1Auth, user2Auth, user3Auth, chatId;

  beforeEach(async () => {
    user1Auth = await createTestUser();
    user2Auth = await createTestUser(testUser2);
    user3Auth = await createTestUser(testUser3);

    const chat = await chatModel.create({
      type: 'group',
      participants: [user1Auth.user._id, user2Auth.user._id],
      admins: [user1Auth.user._id],
      description: 'Original description',
    });
    chatId = chat._id;
  });

  it('should return 400 when body is empty', async () => {
    // Branch: Object.keys(modifications).length === 0 (L17)
    const res = await request(app)
      .put(`/api/chats/${chatId}`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Modification fields are empty');
  });

  it('should return 200 and update description', async () => {
    // Branch: success path (L34)
    const res = await request(app)
      .put(`/api/chats/${chatId}`)
      .set('Authorization', `Bearer ${user1Auth.accessToken}`)
      .send({ description: 'Updated description' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('description', 'Updated description');
  });

  it('should return 404 for non-participant', async () => {
    // Branch: chatVerification → 404
    const res = await request(app)
      .put(`/api/chats/${chatId}`)
      .set('Authorization', `Bearer ${user3Auth.accessToken}`)
      .send({ description: 'Hacked' });

    expect(res.statusCode).toBe(404);
  });

  it('should return 401 without auth', async () => {
    const res = await request(app)
      .put(`/api/chats/${chatId}`)
      .send({ description: 'Test' });

    expect(res.statusCode).toBe(401);
  });
});
