'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

// ─── Routes ──────────────────────────────────────────────────────
const healthRouter = require('./routes/health');
const authRouter   = require('./routes/auth');
const skillsRouter = require('./routes/skills');
const opportunitiesRouter = require('./routes/opportunities');
const applicationsRouter = require('./routes/applications');
const studentsRouter = require('./routes/students');
const companiesRouter = require('./routes/companies');
const institutionsRouter = require('./routes/institutions');
const learningResourcesRouter = require('./routes/learningResources');

// ─── App Setup ───────────────────────────────────────────────────
const app = express();

// ─── Security Headers (Helmet) ───────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'deny' },
}));

// ─── Health Check & Root (No CORS / credentials required) ────────
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'SkillConnect API',
    version: '1.0.0',
  });
});
app.use('/api/health', healthRouter);

// ─── CORS ────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, direct browser GET, Render health checks)
      if (!origin) {
        return callback(null, true);
      }
      const normalizedOrigin = origin.replace(/\/$/, '');
      const isAllowed = allowedOrigins.some((o) => o === '*' || o.replace(/\/$/, '') === normalizedOrigin);
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin "${origin}" not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // 24 hours
  })
);

// ─── Body Parsers ────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Rate Limiting ───────────────────────────────────────────────
const { apiLimiter } = require('./middleware/rateLimit');
app.use('/api', apiLimiter);

// ─── API Routes ──────────────────────────────────────────────────
app.use('/api/auth',   authRouter);
app.use('/api/skills', skillsRouter);
app.use('/api/opportunities', opportunitiesRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/students', studentsRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/institutions', institutionsRouter);
app.use('/api/learning-resources', learningResourcesRouter);

// ─── 404 Handler ─────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

// ─── Global Error Handler ────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // Always log full stack trace to server logs for debugging
  console.error(err.stack || err);

  // Return a safe, sanitized message to the client (never leak SQL queries or paths)
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ status: 'error', message: err.message });
  }

  const statusCode = err.status || (err.statusCode && err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 500);
  const message = statusCode < 500 ? (err.message || 'Client error') : 'Internal server error';

  res.status(statusCode).json({ status: 'error', message });
});

// ─── Start ───────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000', 10);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[SkillConnect API] Server running on http://localhost:${PORT}`);
    console.log(`[SkillConnect API] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;
