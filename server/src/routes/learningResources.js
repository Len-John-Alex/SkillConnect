'use strict';

const { Router } = require('express');
const db = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { learningResourceCreateRules } = require('../middleware/validate');

const router = Router();

/**
 * GET /api/learning-resources
 * List learning resources with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { skill_id, resource_type } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (skill_id) {
      whereClause += ` AND lr.skill_id = $${paramIndex}`;
      params.push(skill_id);
      paramIndex++;
    }
    
    if (resource_type) {
      whereClause += ` AND lr.resource_type = $${paramIndex}`;
      params.push(resource_type);
      paramIndex++;
    }
    
    const countResult = await db.query(
      `SELECT COUNT(*) FROM learning_resources lr ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);
    
    params.push(limit, offset);
    const { rows } = await db.query(
      `SELECT lr.id, lr.skill_id, lr.title, lr.description, lr.resource_url, lr.resource_type, lr.created_at,
              s.name as skill_name, s.category as skill_category
       FROM learning_resources lr
       JOIN skills s ON s.id = lr.skill_id
       ${whereClause}
       ORDER BY lr.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );
    
    res.json({
      status: 'ok',
      resources: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[learning-resources/list]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to list learning resources.' });
  }
});

/**
 * GET /api/learning-resources/skill/:skillId
 * Get learning resources for a specific skill
 */
router.get('/skill/:skillId', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT lr.id, lr.skill_id, lr.title, lr.description, lr.resource_url, lr.resource_type, lr.created_at,
              s.name as skill_name, s.category as skill_category
       FROM learning_resources lr
       JOIN skills s ON s.id = lr.skill_id
       WHERE lr.skill_id = $1
       ORDER BY lr.created_at DESC`,
      [req.params.skillId]
    );
    
    res.json({ status: 'ok', resources: rows });
  } catch (err) {
    console.error('[learning-resources/skill]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to get learning resources.' });
  }
});

/**
 * POST /api/learning-resources
 * Create a new learning resource (admin/institution only)
 */
router.post('/', authenticate, authorize('admin', 'institution'), learningResourceCreateRules, async (req, res) => {
  try {
    const { skill_id, title, description, resource_url, resource_type = 'other' } = req.body;
    
    // Verify skill exists
    const { rows: skill } = await db.query('SELECT id FROM skills WHERE id = $1', [skill_id]);
    if (skill.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Skill not found.' });
    }
    
    const { rows } = await db.query(
      `INSERT INTO learning_resources (skill_id, title, description, resource_url, resource_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, skill_id, title, description, resource_url, resource_type, created_at`,
      [skill_id, title, description || null, resource_url || null, resource_type]
    );
    
    res.status(201).json({ status: 'ok', resource: rows[0] });
  } catch (err) {
    console.error('[learning-resources/create]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to create learning resource.' });
  }
});

/**
 * DELETE /api/learning-resources/:id
 * Delete a learning resource (admin/institution only)
 */
router.delete('/:id', authenticate, authorize('admin', 'institution'), async (req, res) => {
  try {
    const { rowCount } = await db.query(
      'DELETE FROM learning_resources WHERE id = $1',
      [req.params.id]
    );
    
    if (rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Learning resource not found.' });
    }
    
    res.json({ status: 'ok', message: 'Learning resource deleted.' });
  } catch (err) {
    console.error('[learning-resources/delete]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to delete learning resource.' });
  }
});

module.exports = router;