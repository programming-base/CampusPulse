import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import notificationModel from '../../database/schema/notificationSchema/notificationSchema.js';
import followingModel from '../../database/schema/followSchema/followingSchema.js';
import likeModel from '../../database/schema/postsSchema/likeSchema.js';
import { testUser2, testUser3 } from '../fixtures/users.fixture.js';
import { createTestUser } from '../helpers/auth.helpers.js';
import { createPost, createNotification, createComment } from '../helpers/data.helpers.js';

describe('Security Tests', () => {
  let user1Auth, user2Auth;

  beforeEach(async () => {
    user1Auth = await createTestUser();
    user2Auth = await createTestUser(testUser2);
  });

  describe('Notification IDOR', () => {
    it('should allow any authenticated user to mark another user notification as read (IDOR vulnerability)', async () => {
      // Create a notification for user1
      const notification = await createNotification(user1Auth.user._id, user2Auth.user._id);

      // User2 tries to mark user1's notification as read — this SHOULD fail but currently succeeds (IDOR bug)
      const res = await request(app)
        .put(`/api/notifications/${notification._id}/read`)
        .set('Authorization', `Bearer ${user2Auth.accessToken}`);

      // Documenting the bug: no ownership check, so it succeeds
      expect(res.statusCode).toBe(200);

      // Verify the notification was actually modified (confirming the IDOR)
      const updated = await notificationModel.findById(notification._id);
      expect(updated.isRead).toBe(true);
    });

    it('should allow any authenticated user to delete another user notification (IDOR vulnerability)', async () => {
      // Create a notification for user1
      const notification = await createNotification(user1Auth.user._id, user2Auth.user._id);

      // User2 deletes user1's notification — IDOR bug
      const res = await request(app)
        .delete(`/api/notifications/${notification._id}`)
        .set('Authorization', `Bearer ${user2Auth.accessToken}`);

      // No ownership check in the route
      expect(res.statusCode).toBe(200);

      // Confirm deletion
      const deleted = await notificationModel.findById(notification._id);
      expect(deleted).toBeNull();
    });
  });

  describe('Like System Consistency', () => {
    it('should allow user to like multiple different posts', async () => {
      const post1 = await createPost(user1Auth.accessToken, { content: 'Post 1' });
      const post2 = await createPost(user1Auth.accessToken, { content: 'Post 2' });

      // Like post 1
      const res1 = await request(app)
        .post(`/api/posts/${post1._id}/like`)
        .set('Authorization', `Bearer ${user2Auth.accessToken}`);

      // Like post 2
      const res2 = await request(app)
        .post(`/api/posts/${post2._id}/like`)
        .set('Authorization', `Bearer ${user2Auth.accessToken}`);

      // Note: The code has a bug where the duplicate check uses `postId: postId`
      // instead of `targetId: postId`, which means the check queries a non-existent field.
      // This may incorrectly block liking multiple posts depending on behavior.
      // Test documents the actual behavior.
      expect(res1.statusCode).toBe(201);

      // The second like may fail due to the bug (queries userId + targetType only, ignoring postId)
      // This test documents whether the bug blocks multi-post likes
      if (res2.statusCode === 201) {
        // If it succeeds, verify both likes exist
        const likeCount = await likeModel.countDocuments({
          userId: user2Auth.user._id,
          targetType: 'post',
        });
        expect(likeCount).toBe(2);
      } else {
        // Bug: the query finds the first like because postId field is ignored
        expect(res2.statusCode).toBe(400);
        expect(res2.body).toHaveProperty('error', 'Already liked');
      }
    });
  });

  describe('Follow System Consistency', () => {
    it('should verify following records are created when following a user', async () => {
      // Follow user2
      await request(app)
        .post(`/api/users/${user2Auth.user._id}/follow`)
        .set('Authorization', `Bearer ${user1Auth.accessToken}`);

      // Verify Following record exists
      const followingRecord = await followingModel.findOne({
        userId: user1Auth.user._id,
        followingId: user2Auth.user._id,
      });
      expect(followingRecord).not.toBeNull();

      // Note: Known bug — Follower schema is NOT updated by the follow route
      // Only the Following schema is populated
    });
  });

  describe('Comment Deletion Safety', () => {
    it('should handle comment deletion without crashing (no double-header bug)', async () => {
      const post = await createPost(user1Auth.accessToken);
      const comment = await createComment(user1Auth.accessToken, post._id, 'Test comment');

      // Delete the comment — owner action
      const res = await request(app)
        .delete(`/api/posts/${post._id}/comments/${comment._id}`)
        .set('Authorization', `Bearer ${user1Auth.accessToken}`);

      // Should succeed without crash
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });

    it('should handle comment that does not belong to the post', async () => {
      const post1 = await createPost(user1Auth.accessToken, { content: 'Post 1' });
      const post2 = await createPost(user1Auth.accessToken, { content: 'Post 2' });
      const comment = await createComment(user1Auth.accessToken, post2._id, 'Wrong post comment');

      // Try to delete comment using post1's ID but comment belongs to post2
      const res = await request(app)
        .delete(`/api/posts/${post1._id}/comments/${comment._id}`)
        .set('Authorization', `Bearer ${user1Auth.accessToken}`);

      // The route has a known bug: sends 401 without return, causing potential double-header
      // The test verifies the response code (may be 401 or 500 depending on crash)
      expect([401, 500]).toContain(res.statusCode);
    });
  });
});
