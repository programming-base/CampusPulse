import request from 'supertest';
import app from '../../app.js';
import { testUser, testUser2, testUser3 } from '../fixtures/users.fixture.js';
import { createTestUser } from '../helpers/auth.helpers.js';

describe('GET /api/users/search', () => {
  let accessToken;

  beforeEach(async () => {
    const auth1 = await createTestUser();
    accessToken = auth1.accessToken;
    await createTestUser(testUser2);
    await createTestUser(testUser3);
  });

  it('should search users by query (displayName match)', async () => {
    const res = await request(app)
      .get('/api/users/search')
      .query({ query: 'John' })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0]).toHaveProperty('displayName');
  });

  it('should filter by department', async () => {
    const res = await request(app)
      .get('/api/users/search')
      .query({ department: 'Information Technology' })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    res.body.data.forEach((user) => {
      expect(user.department).toBe('Information Technology');
    });
  });

  it('should filter by college', async () => {
    const res = await request(app)
      .get('/api/users/search')
      .query({ query: 'Bob', college: 'VJTI' })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    res.body.data.forEach((user) => {
      expect(user.college).toBe('VJTI');
    });
  });

  it('should filter by academicYear', async () => {
    const res = await request(app)
      .get('/api/users/search')
      .query({ department: 'Information Technology', academicYear: 3 })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('should support pagination', async () => {
    const res = await request(app)
      .get('/api/users/search')
      .query({ query: 'doe', page: 1, limit: 1 })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('page', 1);
    expect(res.body).toHaveProperty('limit', 1);
    expect(res.body).toHaveProperty('totalPages');
    expect(res.body).toHaveProperty('hasMore');
  });

  it('should return empty array when no results match', async () => {
    const res = await request(app)
      .get('/api/users/search')
      .query({ query: 'zzzznonexistent' })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toEqual([]);
  });

  it('should return 400 if query and department are both missing', async () => {
    const res = await request(app)
      .get('/api/users/search')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'missing fields');
  });

  it('should return 401 if unauthorized', async () => {
    const res = await request(app)
      .get('/api/users/search')
      .query({ query: 'John' });

    expect(res.statusCode).toBe(401);
  });
});
