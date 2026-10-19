process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/skillconnect_test';
process.env.JWT_SECRET = 'test_secret_key_for_testing_only';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_key';
process.env.NODE_ENV = 'test';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.INSTITUTION_INVITE_CODE = 'INST_2026_SKILLCONNECT';

const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');

const studentsRouter = require('../src/routes/students');
const skillsRouter = require('../src/routes/skills');
const { testPool, setupTestDatabase, teardownTestDatabase, clearTestData, createTestUser, createTestSkill, addSkillToStudent, generateToken } = require('./setup');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/students', studentsRouter);
  app.use('/api/skills', skillsRouter);
  return app;
};

describe('Student Endpoints', () => {
  let app;
  let studentUser;
  let companyUser;
  let skill1, skill2;

  beforeAll(async () => {
    await setupTestDatabase();
    app = createTestApp();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();
    studentUser = await createTestUser({
      name: 'Test Student',
      email: 'student@test.com',
      role: 'student',
    });
    companyUser = await createTestUser({
      name: 'Test Company',
      email: 'company@test.com',
      role: 'company',
    });
    skill1 = await createTestSkill('JavaScript', 'Programming');
    skill2 = await createTestSkill('React', 'Frontend');
  });

  describe('GET /api/students/me/profile', () => {
    it('should return student profile with skills', async () => {
      await addSkillToStudent(studentUser.id, skill1.id, 4);
      await addSkillToStudent(studentUser.id, skill2.id, 3);

      const token = generateToken(studentUser);
      const res = await request(app)
        .get('/api/students/me/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.profile).toBeDefined();
      expect(res.body.profile.skills).toHaveLength(2);
      expect(res.body.profile.skills[0]).toHaveProperty('proficiency_level');
    });

    it('should reject company user', async () => {
      const token = generateToken(companyUser);
      const res = await request(app)
        .get('/api/students/me/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should reject unauthenticated', async () => {
      const res = await request(app).get('/api/students/me/profile');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/students/me/profile', () => {
    it('should update student profile', async () => {
      const token = generateToken(studentUser);
      const res = await request(app)
        .patch('/api/students/me/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          degree: 'B.Tech',
          branch: 'Computer Science',
          graduation_year: 2026,
          bio: 'Updated bio',
        });

      expect(res.status).toBe(200);
      expect(res.body.profile.degree).toBe('B.Tech');
      expect(res.body.profile.branch).toBe('Computer Science');
      expect(res.body.profile.graduation_year).toBe(2026);
      expect(res.body.profile.bio).toBe('Updated bio');
    });

    it('should reject empty update', async () => {
      const token = generateToken(studentUser);
      const res = await request(app)
        .patch('/api/students/me/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('Student Skills CRUD', () => {
    it('should list student skills', async () => {
      await addSkillToStudent(studentUser.id, skill1.id, 4);
      await addSkillToStudent(studentUser.id, skill2.id, 3);

      const token = generateToken(studentUser);
      const res = await request(app)
        .get('/api/students/me/skills')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.skills).toHaveLength(2);
    });

    it('should add skill to student', async () => {
      const token = generateToken(studentUser);
      const res = await request(app)
        .post('/api/students/me/skills')
        .set('Authorization', `Bearer ${token}`)
        .send({
          skill_id: skill1.id,
          proficiency_level: 4,
        });

      expect(res.status).toBe(200);
      expect(res.body.skill.proficiency_level).toBe(4);
    });

    it('should update skill proficiency', async () => {
      await addSkillToStudent(studentUser.id, skill1.id, 2);

      const token = generateToken(studentUser);
      const res = await request(app)
        .patch(`/api/students/me/skills/${skill1.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ proficiency_level: 5 });

      expect(res.status).toBe(200);
      expect(res.body.skill.proficiency_level).toBe(5);
    });

    it('should remove skill', async () => {
      await addSkillToStudent(studentUser.id, skill1.id, 3);

      const token = generateToken(studentUser);
      const res = await request(app)
        .delete(`/api/students/me/skills/${skill1.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      const listRes = await request(app)
        .get('/api/students/me/skills')
        .set('Authorization', `Bearer ${token}`);
      expect(listRes.body.skills).toHaveLength(0);
    });

    it('should update existing skill when adding duplicate', async () => {
      await addSkillToStudent(studentUser.id, skill1.id, 2);

      const token = generateToken(studentUser);
      const res = await request(app)
        .post('/api/students/me/skills')
        .set('Authorization', `Bearer ${token}`)
        .send({ skill_id: skill1.id, proficiency_level: 5 });

      // POST uses ON CONFLICT DO UPDATE, so it updates instead of rejecting
      expect(res.status).toBe(200);
      expect(res.body.skill.proficiency_level).toBe(5);
    });

    it('should reject invalid skill ID', async () => {
      const token = generateToken(studentUser);
      const res = await request(app)
        .post('/api/students/me/skills')
        .set('Authorization', `Bearer ${token}`)
        .send({ skill_id: 'invalid-uuid' });

      expect(res.status).toBe(400);
    });

    it('should reject proficiency out of range', async () => {
      const token = generateToken(studentUser);
      const res = await request(app)
        .post('/api/students/me/skills')
        .set('Authorization', `Bearer ${token}`)
        .send({ skill_id: skill1.id, proficiency_level: 10 });

      expect(res.status).toBe(400);
    });
  });

  describe('Student Skill Progress', () => {
    it('should list skill progress', async () => {
      await testPool.query(
        `INSERT INTO skill_progress (student_id, skill_id, status) VALUES ($1, $2, $3)`,
        [studentUser.id, skill1.id, 'in_progress']
      );

      const token = generateToken(studentUser);
      const res = await request(app)
        .get('/api/students/me/skill-progress')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.progress).toHaveLength(1);
    });

    it('should update skill progress', async () => {
      const token = generateToken(studentUser);
      const res = await request(app)
        .post('/api/students/me/skill-progress')
        .set('Authorization', `Bearer ${token}`)
        .send({ skill_id: skill1.id, status: 'completed' });

      expect(res.status).toBe(200);
      expect(res.body.progress.status).toBe('completed');
    });
  });

  describe('Student Projects CRUD', () => {
    it('should create project', async () => {
      const token = generateToken(studentUser);
      const res = await request(app)
        .post('/api/students/me/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Project',
          description: 'A test project',
          project_url: 'https://github.com/test/project',
        });

      expect(res.status).toBe(201);
      expect(res.body.project.title).toBe('Test Project');
    });

    it('should list projects', async () => {
      await testPool.query(
        `INSERT INTO projects (student_id, title, description) VALUES ($1, $2, $3)`,
        [studentUser.id, 'Project 1', 'Description 1']
      );

      const token = generateToken(studentUser);
      const res = await request(app)
        .get('/api/students/me/projects')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.projects).toHaveLength(1);
    });

    it('should update project', async () => {
      const projectResult = await testPool.query(
        `INSERT INTO projects (student_id, title, description) VALUES ($1, $2, $3) RETURNING id`,
        [studentUser.id, 'Original', 'Original desc']
      );
      const projectId = projectResult.rows[0].id;

      const token = generateToken(studentUser);
      const res = await request(app)
        .patch(`/api/students/me/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.project.title).toBe('Updated Title');
    });

    it('should delete project', async () => {
      const projectResult = await testPool.query(
        `INSERT INTO projects (student_id, title) VALUES ($1, $2) RETURNING id`,
        [studentUser.id, 'To Delete']
      );
      const projectId = projectResult.rows[0].id;

      const token = generateToken(studentUser);
      const res = await request(app)
        .delete(`/api/students/me/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });
});