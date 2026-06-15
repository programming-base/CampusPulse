import request from 'supertest';
import app from '../../app.js';
import { testUser2 } from '../fixtures/users.fixture.js';
import { createTestUser } from '../helpers/auth.helpers.js';
import { createPost } from '../helpers/data.helpers.js';

/**
 * Tests for GET /api/posts filter and pagination branches (postsGetsRoute.js L8-37).
 *
 * Branches covered:
 *   - scope filter (L17-18)
 *   - department filter (L20-21)
 *   - academicYear filter (L23-24)
 *   - Custom page/limit (L11-14)
 *   - Negative/zero page/limit defaults (L13-14)
 */
describe('GET /api/posts — filters and pagination', () => {
  let user1Auth, user2Auth;

  beforeEach(async () => {
    user1Auth = await createTestUser();
    user2Auth = await createTestUser(testUser2);

    // Create posts with various attributes
    await createPost(user1Auth.accessToken, {
      content: 'IT Post',
      visibilityScope: 'department',
    });
    await createPost(user1Auth.accessToken, {
      content: 'College Post',
      visibilityScope: 'college',
    });
    await createPost(user2Auth.accessToken, {
      content: 'CS Post',
      visibilityScope: 'department',
    });
  });

  it('should filter by scope', async () => {
    // Branch: scope → filter.visibilityScope = scope (L18)
    const res = await request(app)
      .get('/api/posts?scope=college')
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].visibilityScope).toBe('college');
  });

  it('should filter by department', async () => {
    // Branch: department → filter.department = department (L21)
    const res = await request(app)
      .get('/api/posts?department=Computer Science')
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    res.body.data.items.forEach(post => {
      expect(post.department).toBe('Computer Science');
    });
  });

  it('should filter by academicYear', async () => {
    // Branch: academicYear → filter.academicYear = Number(academicYear) (L24)
    const res = await request(app)
      .get('/api/posts?academicYear=3')
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    res.body.data.items.forEach(post => {
      expect(post.academicYear).toBe(3);
    });
  });

  it('should paginate with custom page and limit', async () => {
    // Branch: page/limit parsing (L11-14)
    const res = await request(app)
      .get('/api/posts?page=1&limit=1')
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.limit).toBe(1);
    expect(res.body.data.page).toBe(1);
  });

  it('should default negative page/limit to 1/10', async () => {
    // Branch: page = page > 0 ? page : 1; limit = limit > 0 ? limit : 10 (L13-14)
    const res = await request(app)
      .get('/api/posts?page=-1&limit=0')
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.page).toBe(1);
    expect(res.body.data.limit).toBe(10);
  });

  it('should return all posts without filters', async () => {
    const res = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.items.length).toBe(3);
    expect(res.body.data.total).toBe(3);
  });

  it('should combine scope and department filters', async () => {
    const res = await request(app)
      .get('/api/posts?scope=department&department=Information Technology')
      .set('Authorization', `Bearer ${user1Auth.accessToken}`);

    expect(res.statusCode).toBe(200);
    res.body.data.items.forEach(post => {
      expect(post.visibilityScope).toBe('department');
      expect(post.department).toBe('Information Technology');
    });
  });
});
