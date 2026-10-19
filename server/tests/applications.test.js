process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/skillconnect_test';
process.env.JWT_SECRET = 'test_secret_key_for_testing_only';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_key';
process.env.NODE_ENV = 'test';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.INSTITUTION_INVITE_CODE = 'INST_2026_SKILLCONNECT';

const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');

const applicationsRouter = require('../src/routes/applications');
const opportunitiesRouter = require('../src/routes/opportunities');
const { testPool, setupTestDatabase, teardownTestDatabase, clearTestData, createTestUser, createTestSkill, createTestOpportunity, addSkillToOpportunity, addSkillToStudent, generateToken } = require('./setup');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/applications', applicationsRouter);
  app.use('/api/opportunities', opportunitiesRouter);
  return app;
};

describe('Application Endpoints', () => {
  let app;
  let studentUser;
  let student2;
  let companyUser;
  let skill1, skill2;
  let opportunity;

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
    student2 = await createTestUser({
      name: 'Student Two',
      email: 'student2@test.com',
      role: 'student',
    });
    companyUser = await createTestUser({
      name: 'Test Company',
      email: 'company@test.com',
      role: 'company',
    });
    skill1 = await createTestSkill('JavaScript', 'Programming');
    skill2 = await createTestSkill('React', 'Frontend');

    opportunity = await createTestOpportunity(companyUser.id, {
      title: 'Test Internship',
      opportunity_type: 'internship',
      status: 'open',
    });
    await addSkillToOpportunity(opportunity.id, skill1.id, 3, 3);
    await addSkillToOpportunity(opportunity.id, skill2.id, 2, 1);
  });

  describe('POST /api/applications', () => {
    it('should create application as student', async () => {
      const token = generateToken(studentUser);
      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          opportunity_id: opportunity.id,
          cover_letter: 'I am very interested...',
        });

      expect(res.status).toBe(201);
      expect(res.body.application.student_id).toBe(studentUser.id);
      expect(res.body.application.opportunity_id).toBe(opportunity.id);
      expect(res.body.application.status).toBe('pending');
    });

    it('should reject duplicate application', async () => {
      const token = generateToken(studentUser);
      await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${token}`)
        .send({ opportunity_id: opportunity.id });

      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${token}`)
        .send({ opportunity_id: opportunity.id });

      expect(res.status).toBe(409);
    });

    it('should reject company user', async () => {
      const token = generateToken(companyUser);
      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${token}`)
        .send({ opportunity_id: opportunity.id });

      expect(res.status).toBe(403);
    });

    it('should reject application to closed opportunity', async () => {
      await testPool.query(
        'UPDATE opportunities SET status = $1 WHERE id = $2',
        ['closed', opportunity.id]
      );

      const token = generateToken(studentUser);
      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${token}`)
        .send({ opportunity_id: opportunity.id });

      expect(res.status).toBe(400);
    });

    it('should reject non-existent opportunity', async () => {
      const token = generateToken(studentUser);
      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${token}`)
        .send({ opportunity_id: '00000000-0000-0000-0000-000000000000' });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/applications', () => {
    beforeEach(async () => {
      await testPool.query(
        `INSERT INTO applications (opportunity_id, student_id, status, cover_letter)
         VALUES ($1, $2, $3, $4)`,
        [opportunity.id, studentUser.id, 'pending', 'Cover letter 1']
      );
      await testPool.query(
        `INSERT INTO applications (opportunity_id, student_id, status)
         VALUES ($1, $2, $3)`,
        [opportunity.id, student2.id, 'shortlisted']
      );
    });

    it('should list student applications', async () => {
      const token = generateToken(studentUser);
      const res = await request(app)
        .get('/api/applications')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.applications).toHaveLength(1);
      expect(res.body.applications[0].student_id).toBe(studentUser.id);
      expect(res.body.applications[0].opportunity_skills).toBeDefined();
    });

    it('should list company applications', async () => {
      const token = generateToken(companyUser);
      const res = await request(app)
        .get('/api/applications')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.applications).toHaveLength(2);
      expect(res.body.applications[0].student_skills).toBeDefined();
    });

    it('should filter by status', async () => {
      const token = generateToken(companyUser);
      const res = await request(app)
        .get('/api/applications?status=pending')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.applications).toHaveLength(1);
      expect(res.body.applications[0].status).toBe('pending');
    });

    it('should reject institution user', async () => {
      const instUser = await createTestUser({
        name: 'Institution',
        email: 'inst@test.com',
        role: 'institution',
      });
      const token = generateToken(instUser);
      const res = await request(app)
        .get('/api/applications')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/applications/:id', () => {
    let applicationId;

    beforeEach(async () => {
      const result = await testPool.query(
        `INSERT INTO applications (opportunity_id, student_id, status, cover_letter)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [opportunity.id, studentUser.id, 'pending', 'Test cover letter']
      );
      applicationId = result.rows[0].id;
    });

    it('should return application for student owner', async () => {
      const token = generateToken(studentUser);
      const res = await request(app)
        .get(`/api/applications/${applicationId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.application.id).toBe(applicationId);
      expect(res.body.application.student_profile).toBeDefined();
      expect(res.body.application.opportunity_skills).toBeDefined();
    });

    it('should return application for company owner', async () => {
      const token = generateToken(companyUser);
      const res = await request(app)
        .get(`/api/applications/${applicationId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.application.student_skills).toBeDefined();
    });

    it('should reject unauthorized student', async () => {
      const token = generateToken(student2);
      const res = await request(app)
        .get(`/api/applications/${applicationId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should reject unauthorized company', async () => {
      const otherCompany = await createTestUser({
        name: 'Other Company',
        email: 'other@test.com',
        role: 'company',
      });
      const token = generateToken(otherCompany);
      const res = await request(app)
        .get(`/api/applications/${applicationId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/applications/:id/status', () => {
    let applicationId;

    beforeEach(async () => {
      const result = await testPool.query(
        `INSERT INTO applications (opportunity_id, student_id, status)
         VALUES ($1, $2, $3) RETURNING id`,
        [opportunity.id, studentUser.id, 'pending']
      );
      applicationId = result.rows[0].id;
    });

    it('should update status with valid transition', async () => {
      const token = generateToken(companyUser);
      const res = await request(app)
        .patch(`/api/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'shortlisted' });

      expect(res.status).toBe(200);
      expect(res.body.application.status).toBe('shortlisted');
    });

    it('should reject invalid transition', async () => {
      await testPool.query(
        'UPDATE applications SET status = $1 WHERE id = $2',
        ['shortlisted', applicationId]
      );

      const token = generateToken(companyUser);
      const res = await request(app)
        .patch(`/api/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'pending' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot change status');
    });

    it('should reject student updating status', async () => {
      const token = generateToken(studentUser);
      const res = await request(app)
        .patch(`/api/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'shortlisted' });

      expect(res.status).toBe(403);
    });

    it('should reject unauthorized company', async () => {
      const otherCompany = await createTestUser({
        name: 'Other Company',
        email: 'other@test.com',
        role: 'company',
      });
      const token = generateToken(otherCompany);
      const res = await request(app)
        .patch(`/api/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'shortlisted' });

      expect(res.status).toBe(403);
    });

    it('should reject invalid status', async () => {
      const token = generateToken(companyUser);
      const res = await request(app)
        .patch(`/api/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'invalid_status' });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/applications/:id/withdraw', () => {
    let applicationId;

    beforeEach(async () => {
      const result = await testPool.query(
        `INSERT INTO applications (opportunity_id, student_id, status)
         VALUES ($1, $2, $3) RETURNING id`,
        [opportunity.id, studentUser.id, 'pending']
      );
      applicationId = result.rows[0].id;
    });

    it('should allow student to withdraw pending application', async () => {
      const token = generateToken(studentUser);
      const res = await request(app)
        .patch(`/api/applications/${applicationId}/withdraw`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.application.status).toBe('withdrawn');
    });

    it('should allow student to withdraw shortlisted application', async () => {
      await testPool.query(
        'UPDATE applications SET status = $1 WHERE id = $2',
        ['shortlisted', applicationId]
      );

      const token = generateToken(studentUser);
      const res = await request(app)
        .patch(`/api/applications/${applicationId}/withdraw`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.application.status).toBe('withdrawn');
    });

    it('should reject withdrawing accepted application', async () => {
      await testPool.query(
        'UPDATE applications SET status = $1 WHERE id = $2',
        ['accepted', applicationId]
      );

      const token = generateToken(studentUser);
      const res = await request(app)
        .patch(`/api/applications/${applicationId}/withdraw`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });

    it('should reject company withdrawing', async () => {
      const token = generateToken(companyUser);
      const res = await request(app)
        .patch(`/api/applications/${applicationId}/withdraw`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});