'use strict';

const { Router } = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { registerRules, loginRules } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimit');

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (JWT_SECRET + '_refresh');
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const BCRYPT_ROUNDS = 10;

const INSTITUTION_INVITE_CODE = process.env.INSTITUTION_INVITE_CODE || null;

// ─── Helper: generate tokens ────────────────────────────────────
function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

// ─── Helper: set refresh cookie ─────────────────────────────────
function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/api',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// ─── Helper: safe user object (no password_hash) ─────────────────
function safeUser(row) {
  const { password_hash, ...safe } = row;
  return safe;
}

// ═══════════════════════════════════════════════════════════════════
//  POST /api/auth/register
// ═══════════════════════════════════════════════════════════════════
router.post('/register', authLimiter, registerRules, async (req, res) => {
  try {
    const { name, email, password, role, institutionInviteCode } = req.body;

    // ── Institution admin gate ──────────────────────────────────
    if (role === 'institution') {
      if (!INSTITUTION_INVITE_CODE) {
        return res.status(403).json({
          status: 'error',
          message: 'Institution registration is not currently available.',
        });
      }
      if (institutionInviteCode !== INSTITUTION_INVITE_CODE) {
        return res.status(403).json({
          status: 'error',
          message: 'Invalid institution invite code.',
        });
      }
    }

    // ── Check duplicate email ───────────────────────────────────
    const { rows: existing } = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'An account with this email already exists.',
      });
    }

    // ── Hash password + insert user ─────────────────────────────
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const result = await db.withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, role, created_at`,
        [name, email, passwordHash, role]
      );

      const user = rows[0];

      // Create empty profile for the role
      if (role === 'student') {
        await client.query(
          'INSERT INTO student_profiles (user_id) VALUES ($1)',
          [user.id]
        );
      } else if (role === 'company') {
        const companyName = (req.body.company_name && req.body.company_name.trim()) || name;
        await client.query(
          `INSERT INTO company_profiles (user_id, company_name) VALUES ($1, $2)`,
          [user.id, companyName]
        );
      }

      return user;
    });

    // ── Generate tokens ─────────────────────────────────────────
    const accessToken = generateAccessToken(result);
    const refreshToken = generateRefreshToken(result);
    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      status: 'ok',
      message: 'Registration successful.',
      user: result,
      accessToken,
    });
  } catch (err) {
    console.error('[auth/register]', err.message);
    res.status(500).json({ status: 'error', message: 'Registration failed. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  POST /api/auth/login
// ═══════════════════════════════════════════════════════════════════
router.post('/login', authLimiter, loginRules, async (req, res) => {
  try {
    const { email, password } = req.body;

    const { rows } = await db.query(
      'SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = $1',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshCookie(res, refreshToken);

    res.json({
      status: 'ok',
      message: 'Login successful.',
      user: safeUser(user),
      accessToken,
    });
  } catch (err) {
    console.error('[auth/login]', err.message);
    res.status(500).json({ status: 'error', message: 'Login failed. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  GET /api/auth/me
// ═══════════════════════════════════════════════════════════════════
router.get('/me', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    res.json({ status: 'ok', user: rows[0] });
  } catch (err) {
    console.error('[auth/me]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to load user profile.' });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  POST /api/auth/refresh
// ═══════════════════════════════════════════════════════════════════
router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'No refresh token.' });
  }

  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET);

    // Re-fetch user to ensure they still exist and get current role
    const { rows } = await db.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [payload.sub]
    );

    if (rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'User not found.' });
    }

    const user = rows[0];
    const accessToken = generateAccessToken(user);

    // Rotate refresh token
    const newRefreshToken = generateRefreshToken(user);
    setRefreshCookie(res, newRefreshToken);

    res.json({ status: 'ok', user, accessToken });
  } catch (err) {
    // Clear invalid cookie
    res.clearCookie('refreshToken', { path: '/api' });
    return res.status(401).json({ status: 'error', message: 'Invalid refresh token.' });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  POST /api/auth/logout
// ═══════════════════════════════════════════════════════════════════
router.post('/logout', (_req, res) => {
  res.clearCookie('refreshToken', { path: '/api' });
  res.json({ status: 'ok', message: 'Logged out.' });
});

module.exports = router;
