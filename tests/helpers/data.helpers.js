import request from 'supertest';
import app from '../../app.js';
import notificationModel from '../../database/schema/notificationSchema/notificationSchema.js';
import notificationSettingsModel from '../../database/schema/notificationSchema/notificationSettingsSchema.js';

/**
 * Creates a post via the API.
 * @param {string} accessToken
 * @param {object} overrides
 * @returns {object} The created post document
 */
export async function createPost(accessToken, overrides = {}) {
  const postData = {
    content: 'Test post content',
    isAnonymous: false,
    visibilityScope: 'college',
    ...overrides,
  };

  const res = await request(app)
    .post('/api/posts')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(postData);

  if (res.statusCode !== 201) {
    throw new Error(`createPost failed: ${res.statusCode} — ${JSON.stringify(res.body)}`);
  }

  return res.body;
}

/**
 * Creates a comment on a post via the API.
 * @param {string} accessToken
 * @param {string} postId
 * @param {string} content
 * @returns {object} The created comment document
 */
export async function createComment(accessToken, postId, content = 'Test comment') {
  const res = await request(app)
    .post(`/api/posts/${postId}/comments`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ content });

  if (res.statusCode !== 201) {
    throw new Error(`createComment failed: ${res.statusCode} — ${JSON.stringify(res.body)}`);
  }

  return res.body;
}

/**
 * Creates a group chat via the API.
 * @param {string} accessToken
 * @param {string[]} memberIds
 * @param {string} name
 * @param {string} description
 * @returns {object} The created chat document
 */
export async function createGroupChat(accessToken, memberIds, name = 'Test Group', description = 'Test group description') {
  const res = await request(app)
    .post('/api/chats/group')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ name, description, memberIds });

  if (res.statusCode !== 200) {
    throw new Error(`createGroupChat failed: ${res.statusCode} — ${JSON.stringify(res.body)}`);
  }

  return res.body;
}

/**
 * Sends a DM via the API (auto-creates DM room if needed).
 * @param {string} accessToken
 * @param {string} userId - recipient user ID
 * @param {string} text
 * @returns {object} The created message document
 */
export async function createDmMessage(accessToken, userId, text = 'Hello!') {
  const res = await request(app)
    .post(`/api/chats/dm/messages/${userId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ text, type: 'text' });

  if (res.statusCode !== 201) {
    throw new Error(`createDmMessage failed: ${res.statusCode} — ${JSON.stringify(res.body)}`);
  }

  return res.body.data;
}

/**
 * Creates a notification directly in the database.
 * @param {string} recipientId
 * @param {string} senderId
 * @param {object} overrides
 * @returns {object} The created notification document
 */
export async function createNotification(recipientId, senderId, overrides = {}) {
  const data = {
    recipient: recipientId,
    sender: senderId,
    type: 'like',
    title: 'Test Notification',
    message: 'Someone liked your post',
    isRead: false,
    ...overrides,
  };

  return await notificationModel.create(data);
}

/**
 * Creates notification settings directly in the database.
 * @param {string} userId
 * @param {object} overrides
 * @returns {object} The created settings document
 */
export async function createNotificationSettings(userId, overrides = {}) {
  const data = {
    userId,
    likes: true,
    comments: true,
    follows: true,
    mentions: true,
    systemAlerts: true,
    emailNotifications: false,
    ...overrides,
  };

  return await notificationSettingsModel.create(data);
}

/**
 * Follows a user via the API.
 * @param {string} accessToken
 * @param {string} targetUserId
 * @returns {object} Response body
 */
export async function followUser(accessToken, targetUserId) {
  const res = await request(app)
    .post(`/api/users/${targetUserId}/follow`)
    .set('Authorization', `Bearer ${accessToken}`);

  if (res.statusCode !== 200) {
    throw new Error(`followUser failed: ${res.statusCode} — ${JSON.stringify(res.body)}`);
  }

  return res.body;
}
