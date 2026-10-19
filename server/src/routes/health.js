'use strict';

const { Router } = require('express');
const db = require('../db/pool');

const router = Router();

/**
 * GET /api/health
 * Returns server liveness + database connectivity status.
 * Returns HTTP 200 when database is healthy.
 * Returns HTTP 503 (Service Unavailable) when database is degraded or disconnected
 * so load balancers and orchestrators accurately detect unhealthy state.
 */
router.get('/', async (_req, res) => {
  const response = {
    status: 'ok',
    message: 'SkillConnect API is running',
    timestamp: new Date().toISOString(),
    database: { connected: false, version: null },
  };

  try {
    const dbInfo = await db.testConnection();
    response.database.connected = Boolean(dbInfo?.connected);
    if (!response.database.connected) {
      response.status = 'degraded';
    }
    // Trim the full version string to just the PG version number
    if (dbInfo?.version) {
      response.database.version = dbInfo.version.split(' on ')[0];
    }
  } catch (err) {
    response.status = 'degraded';
    response.database.error = err.message;
  }

  const isHealthy = response.status === 'ok' && response.database.connected === true;
  const statusCode = isHealthy ? 200 : 503;
  res.status(statusCode).json(response);
});

module.exports = router;
