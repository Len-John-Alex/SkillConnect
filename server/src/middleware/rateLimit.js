'use strict';

const rateLimit = require('express-rate-limit');

const isDevOrTest = process.env.NODE_ENV !== 'production';

/**
 * Rate limiter for authentication endpoints.
 * Allows 15 requests per 15-minute window per IP in production (10,000 in dev/test).
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevOrTest ? 10000 : 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many authentication attempts. Please try again later.',
  },
  skip: (req) => req.method === 'OPTIONS' || isDevOrTest,
});

/**
 * General API rate limiter.
 * Allows 100 requests per 15-minute window per IP in production (10,000 in dev/test).
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevOrTest ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests. Please try again later.',
  },
  skip: (req) => req.method === 'OPTIONS' || isDevOrTest,
});

module.exports = { authLimiter, apiLimiter };
