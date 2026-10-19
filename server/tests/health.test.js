'use strict';

process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/skillconnect_test';
process.env.JWT_SECRET = 'test_secret_key_for_testing_only';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_key';
process.env.NODE_ENV = 'test';
process.env.CLIENT_URL = 'http://localhost:5173';

const request = require('supertest');
const express = require('express');
const healthRouter = require('../src/routes/health');
const db = require('../src/db/pool');
const { setupTestDatabase, teardownTestDatabase } = require('./setup');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/health', healthRouter);
  return app;
};

describe('Health Check Endpoint', () => {
  let app;

  beforeAll(async () => {
    await setupTestDatabase();
    app = createTestApp();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('should return 200 and healthy status when database is reachable', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database.connected).toBe(true);
    expect(res.body.database.version).toBeDefined();
    expect(res.body.timestamp).toBeDefined();
  });

  it('should return 503 and degraded status when database is unreachable', async () => {
    const spy = jest.spyOn(db, 'testConnection').mockRejectedValueOnce(new Error('Connection refused'));

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.database.connected).toBe(false);
    expect(res.body.database.error).toBe('Connection refused');

    spy.mockRestore();
  });
});
