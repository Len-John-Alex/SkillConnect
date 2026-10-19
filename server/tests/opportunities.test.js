process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/skillconnect_test';
process.env.JWT_SECRET = 'test_secret_key_for_testing_only';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_key';
process.env.NODE_ENV = 'test';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.INSTITUTION_INVITE_CODE = 'INST_2026_SKILLCONNECT';

const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');

const opportunitiesRouter = require('../src/routes/opportunities');
const { testPool, setupTestDatabase, teardownTestDatabase, clearTestData, createTestUser, createTestSkill, addSkillToOpportunity, generateToken } = require('./setup');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/opportunities', opportunitiesRouter);
  return app;
};

describe('Opportunity Endpoints', () => {
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

  describe('GET /api/opportunities', () => {
    it('should list open opportunities for students', async () => {
      const opp = await testPool.query(
        `INSERT INTO opportunities (company_id, title, description, opportunity_type, status)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [companyUser.id, 'Open Opportunity', 'Desc', 'internship', 'open']
      );
      await addSkillToOpportunity(opp.rows[0].id, skill1.id);

      const token = generateToken(studentUser);
      const res = await request(app)
        .get('/api/opportunities')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.opportunities).toHaveLength(1);
      expect(res.body.opportunities[0].skills).toHaveLength(1);
    });

    it('should list all opportunities for company', async () => {
      await testPool.query(
        `INSERT INTO opportunities (company_id, title, opportunity_type, status)
         VALUES ($1, $2, $3, $4)`,
        [companyUser.id, 'Draft Opp', 'internship', 'draft']
      );
      await testPool.query(
        `INSERT INTO opportunities (company_id, title, opportunity_type, status)
         VALUES ($1, $2, $3, $4)`,
        [companyUser.id, 'Open Opp', 'internship', 'open']
      );

      const token = generateToken(companyUser);
      const res = await request(app)
        .get('/api/opportunities')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.opportunities).toHaveLength(2);
    });

    it('should filter by type', async () => {
      await testPool.query(
        `INSERT INTO opportunities (company_id, title, opportunity_type, status)
         VALUES ($1, $2, $3, $4)`,
        [companyUser.id, 'Internship', 'internship', 'open']
      );
      await testPool.query(
        `INSERT INTO opportunities (company_id, title, opportunity_type, status)
         VALUES ($1, $2, $3, $4)`,
        [companyUser.id, 'Full Time', 'full_time', 'open']
      );

      const token = generateToken(studentUser);
      const res = await request(app)
        .get('/api/opportunities?type=internship')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.opportunities).toHaveLength(1);
      expect(res.body.opportunities[0].opportunity_type).toBe('internship');
    });

    it('should filter by skill', async () => {
      const opp1 = await testPool.query(
        `INSERT INTO opportunities (company_id, title, opportunity_type, status) VALUES ($1, $2, $3, $4) RETURNING *`,
        [companyUser.id, 'JS Opportunity', 'internship', 'open']
      );
      await addSkillToOpportunity(opp1.rows[0].id, skill1.id);

      const opp2 = await testPool.query(
        `INSERT INTO opportunities (company_id, title, opportunity_type, status) VALUES ($1, $2, $3, $4) RETURNING *`,
        [companyUser.id, 'React Opportunity', 'internship', 'open']
      );
      await addSkillToOpportunity(opp2.rows[0].id, skill2.id);

      const token = generateToken(studentUser);
      const res = await request(app)
        .get(`/api/opportunities?skill_id=${skill1.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.opportunities).toHaveLength(1);
    });

    it('should paginate results', async () => {
      for (let i = 0; i < 5; i++) {
        await testPool.query(
          `INSERT INTO opportunities (company_id, title, opportunity_type, status) VALUES ($1, $2, $3, $4)`,
          [companyUser.id, `Opp ${i}`, 'internship', 'open']
        );
      }

      const token = generateToken(studentUser);
      const res = await request(app)
        .get('/api/opportunities?limit=2&page=1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.opportunities).toHaveLength(2);
      expect(res.body.pagination.totalPages).toBe(3);
    });
  });

  describe('GET /api/opportunities/:id', () => {
    it('should return opportunity with skills', async () => {
      const opp = await testPool.query(
        `INSERT INTO opportunities (company_id, title, description, opportunity_type, status)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [companyUser.id, 'Test Opp', 'Description', 'internship', 'open']
      );
      await addSkillToOpportunity(opp.rows[0].id, skill1.id, 3, 3);
      await addSkillToOpportunity(opp.rows[0].id, skill2.id, 2, 1);

      const token = generateToken(studentUser);
      const res = await request(app)
        .get(`/api/opportunities/${opp.rows[0].id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.opportunity.title).toBe('Test Opp');
      expect(res.body.opportunity.skills).toHaveLength(2);
    });

    it('should return 404 for non-existent', async () => {
      const token = generateToken(studentUser);
      const res = await request(app)
        .get('/api/opportunities/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/opportunities', () => {
    it('should create opportunity as company', async () => {
      const token = generateToken(companyUser);
      const res = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'New Internship',
          description: 'Great opportunity',
          opportunity_type: 'internship',
          location: 'Remote',
          deadline: '2027-12-31',
          skills: [
            { skill_id: skill1.id, required_proficiency: 3, importance: 3 },
            { skill_id: skill2.id, required_proficiency: 2, importance: 2 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.opportunity.title).toBe('New Internship');
      expect(res.body.opportunity.skills).toHaveLength(2);
    });

    it('should reject student creating opportunity', async () => {
      const token = generateToken(studentUser);
      const res = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test',
          opportunity_type: 'internship',
        });

      expect(res.status).toBe(403);
    });

    it('should validate required fields', async () => {
      const token = generateToken(companyUser);
      const res = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should reject invalid opportunity type', async () => {
      const token = generateToken(companyUser);
      const res = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test',
          opportunity_type: 'invalid_type',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/opportunities/:id', () => {
    it('should update own opportunity', async () => {
      const opp = await testPool.query(
        `INSERT INTO opportunities (company_id, title, opportunity_type, status) VALUES ($1, $2, $3, $4) RETURNING *`,
        [companyUser.id, 'Original', 'internship', 'draft']
      );

      const token = generateToken(companyUser);
      const res = await request(app)
        .patch(`/api/opportunities/${opp.rows[0].id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title', status: 'open' });

      expect(res.status).toBe(200);
      expect(res.body.opportunity.title).toBe('Updated Title');
      expect(res.body.opportunity.status).toBe('open');
    });

    it('should reject other company updating', async () => {
      const otherCompany = await createTestUser({
        name: 'Other Company',
        email: 'other@test.com',
        role: 'company',
      });

      const opp = await testPool.query(
        `INSERT INTO opportunities (company_id, title, opportunity_type, status) VALUES ($1, $2, $3, $4) RETURNING *`,
        [otherCompany.id, 'Other Opp', 'internship', 'open']
      );

      const token = generateToken(companyUser);
      const res = await request(app)
        .patch(`/api/opportunities/${opp.rows[0].id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Hacked' });

      expect(res.status).toBe(404);
    });

    it('should update skills', async () => {
      const opp = await testPool.query(
        `INSERT INTO opportunities (company_id, title, opportunity_type, status) VALUES ($1, $2, $3, $4) RETURNING *`,
        [companyUser.id, 'Opp', 'internship', 'draft']
      );
      await addSkillToOpportunity(opp.rows[0].id, skill1.id);

      const token = generateToken(companyUser);
      const res = await request(app)
        .patch(`/api/opportunities/${opp.rows[0].id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          skills: [{ skill_id: skill2.id, required_proficiency: 2, importance: 1 }],
        });

      expect(res.status).toBe(200);
      expect(res.body.opportunity.skills).toHaveLength(1);
      expect(res.body.opportunity.skills[0].name).toBe('React');
    });
  });

  describe('DELETE /api/opportunities/:id', () => {
    it('should delete own opportunity', async () => {
      const opp = await testPool.query(
        `INSERT INTO opportunities (company_id, title, opportunity_type, status) VALUES ($1, $2, $3, $4) RETURNING *`,
        [companyUser.id, 'To Delete', 'internship', 'draft']
      );

      const token = generateToken(companyUser);
      const res = await request(app)
        .delete(`/api/opportunities/${opp.rows[0].id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      const check = await testPool.query('SELECT * FROM opportunities WHERE id = $1', [opp.rows[0].id]);
      expect(check.rows).toHaveLength(0);
    });

    it('should reject deleting other company opportunity', async () => {
      const otherCompany = await createTestUser({
        name: 'Other Company',
        email: 'other@test.com',
        role: 'company',
      });

      const opp = await testPool.query(
        `INSERT INTO opportunities (company_id, title, opportunity_type, status) VALUES ($1, $2, $3, $4) RETURNING *`,
        [otherCompany.id, 'Other Opp', 'internship', 'open']
      );

      const token = generateToken(companyUser);
      const res = await request(app)
        .delete(`/api/opportunities/${opp.rows[0].id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/opportunities/my/list', () => {
    it('should return company opportunities with application counts', async () => {
      const opp = await testPool.query(
        `INSERT INTO opportunities (company_id, title, opportunity_type, status) VALUES ($1, $2, $3, $4) RETURNING *`,
        [companyUser.id, 'My Opp', 'internship', 'open']
      );

      const student = await createTestUser({ email: 'student2@test.com', role: 'student' });
      await testPool.query(
        `INSERT INTO applications (opportunity_id, student_id) VALUES ($1, $2)`,
        [opp.rows[0].id, student.id]
      );

      const token = generateToken(companyUser);
      const res = await request(app)
        .get('/api/opportunities/my/list')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.opportunities).toHaveLength(1);
      expect(res.body.opportunities[0].application_count).toBe('1');
    });
  });
});