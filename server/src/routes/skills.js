'use strict';

const { Router } = require('express');
const db = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { 
  skillCreateRules, 
  skillQueryRules 
} = require('../middleware/validate');

const router = Router();

/**
 * GET /api/skills
 * List all skills with optional filtering
 */
router.get('/', skillQueryRules, async (req, res) => {
  try {
    const { category, search } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    const params = [];
    let paramIndex = 1;
    
    if (category) {
      whereClause += ` WHERE category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (search) {
      if (whereClause) {
        whereClause += ` AND`;
      } else {
        whereClause += ` WHERE`;
      }
      whereClause += ` (name ILIKE $${paramIndex} OR category ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    const countResult = await db.query(
      `SELECT COUNT(*) FROM skills${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);
    
    params.push(limit, offset);
    const { rows } = await db.query(
      `SELECT id, name, category
       FROM skills${whereClause}
       ORDER BY name ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );
    
    res.json({
      status: 'ok',
      skills: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[skills/list]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to list skills.' });
  }
});

/**
 * GET /api/skills/:id
 * Get a single skill by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, name, category, created_at FROM skills WHERE id = $1',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Skill not found.' });
    }
    
    res.json({ status: 'ok', skill: rows[0] });
  } catch (err) {
    console.error('[skills/get]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to get skill.' });
  }
});

/**
 * POST /api/skills
 * Create a new skill (admin/institution only)
 */
router.post('/', authenticate, authorize('admin', 'institution'), skillCreateRules, async (req, res) => {
  try {
    const { name, category } = req.body;
    
    const { rows: existing } = await db.query(
      'SELECT id FROM skills WHERE name ILIKE $1 AND (category = $2 OR (category IS NULL AND $2 IS NULL))',
      [name, category || null]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ 
        status: 'error', 
        message: 'A skill with this name and category already exists.' 
      });
    }
    
    const { rows } = await db.query(
      'INSERT INTO skills (name, category) VALUES ($1, $2) RETURNING id, name, category, created_at',
      [name, category || null]
    );
    
    res.status(201).json({ status: 'ok', skill: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        status: 'error',
        message: 'A skill with this name and category already exists.',
      });
    }
    console.error('[skills/create]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to create skill.' });
  }
});

module.exports = router;