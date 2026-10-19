process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/skillconnect_test';
process.env.JWT_SECRET = 'test_secret_key_for_testing_only';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_key';
process.env.NODE_ENV = 'test';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.INSTITUTION_INVITE_CODE = 'INST_2026_SKILLCONNECT';

const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');

const authRouter = require('../src/routes/auth');
const { testPool, setupTestDatabase, teardownTestDatabase, clearTestData, createTestUser, generateToken } = require('./setup');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRouter);
  return app;
};

describe('Authentication Endpoints', () => {
  let app;
  let testUser;

  beforeAll(async () => {
    await setupTestDatabase();
    app = createTestApp();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();
    testUser = await createTestUser({
      name: 'Test Student',
      email: 'student@test.com',
      role: 'student',
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new student', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New Student',
          email: 'newstudent@test.com',
          password: 'Password123!',
          role: 'student',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('ok');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('newstudent@test.com');
      expect(res.body.user.role).toBe('student');
      expect(res.body.accessToken).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should register a new company', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Company',
          email: 'company@test.com',
          password: 'Password123!',
          role: 'company',
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('company');
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Student',
          email: 'student@test.com',
          password: 'Password123!',
          role: 'student',
        });

      expect(res.status).toBe(409);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('already exists');
    });

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test',
          email: 'invalid-email',
          password: 'Password123!',
          role: 'student',
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('should reject weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test',
          email: 'test@test.com',
          password: 'weak',
          role: 'student',
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('should reject institution without invite code', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Institution',
          email: 'inst@test.com',
          password: 'Password123!',
          role: 'institution',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Invalid institution invite code');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student@test.com',
          password: 'TestPassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('student@test.com');
      expect(res.body.accessToken).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'TestPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student@test.com',
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('should reject missing credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user with valid token', async () => {
      const token = generateToken(testUser);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.user.id).toBe(testUser.id);
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('should reject missing token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('should reject expired token', async () => {
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { sub: testUser.id, role: testUser.role },
        'test_secret_key_for_testing_only',
        { expiresIn: '-1h' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('TOKEN_EXPIRED');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh with valid cookie', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student@test.com',
          password: 'TestPassword123!',
        });

      const cookies = loginRes.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.accessToken).toBeDefined();
    });

    it('should reject without cookie', async () => {
      const res = await request(app)
        .post('/api/auth/refresh');

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout and clear cookie', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student@test.com',
          password: 'TestPassword123!',
        });

      const cookies = loginRes.headers['set-cookie'];

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.headers['set-cookie'][0]).toContain('refreshToken=;');
    });
  });
});