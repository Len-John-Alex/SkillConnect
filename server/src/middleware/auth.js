'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('[auth] JWT_SECRET is not set in environment variables.');
}

/**
 * Middleware: verifies the access token from the Authorization header.
 * Attaches req.user = { id, role } on success.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'Authentication required.' });
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ status: 'error', message: 'Token expired.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ status: 'error', message: 'Invalid token.' });
  }
}

/**
 * Middleware: optionally extracts user from Authorization header if present.
 * Does not fail if header is missing or token is invalid.
 */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;

  if (header && header.startsWith('Bearer ')) {
    const token = header.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = { id: payload.sub, role: payload.role };
    } catch {
      // Ignore invalid or expired token for optional auth
    }
  }

  next();
}

module.exports = { authenticate, optionalAuth };
