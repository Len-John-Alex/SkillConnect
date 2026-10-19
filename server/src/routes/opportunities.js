'use strict';

const { Router } = require('express');
const db = require('../db/pool');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { 
  opportunityCreateRules, 
  opportunityUpdateRules, 
  opportunityQueryRules 
} = require('../middleware/validate');

const router = Router();

/**
 * GET /api/opportunities
 * List opportunities with filtering and pagination
 */
router.get('/', optionalAuth, opportunityQueryRules, async (req, res) => {
  try {
    const { type, status, location, skill_id } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (type) {
      whereClause += ` AND o.opportunity_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    if (status) {
      whereClause += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (location) {
      whereClause += ` AND o.location ILIKE $${paramIndex}`;
      params.push(`%${location}%`);
      paramIndex++;
    }
    
    if (skill_id) {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM opportunity_skills os WHERE os.opportunity_id = o.id AND os.skill_id = $${paramIndex}
      )`;
      params.push(skill_id);
      paramIndex++;
    }
    
    // Default to only open opportunities for students/public unless status is explicitly specified
    if (!status && req.user?.role !== 'company') {
      whereClause += ` AND o.status = 'open'`;
    }
    
    const countResult = await db.query(
      `SELECT COUNT(*) FROM opportunities o ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);
    
    params.push(limit, offset);
    const { rows } = await db.query(
      `SELECT o.id, o.company_id, o.title, o.description, o.opportunity_type, 
              o.location, o.deadline, o.status, o.created_at,
              u.name as company_name, cp.company_name as company_display_name
       FROM opportunities o
       JOIN users u ON u.id = o.company_id
       LEFT JOIN company_profiles cp ON cp.user_id = u.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );
    
    // Get skills for opportunities in a single batch query
    if (rows.length > 0) {
      const oppIds = rows.map((r) => r.id);
      const { rows: allSkills } = await db.query(
        `SELECT os.opportunity_id, s.id, s.id as skill_id, s.name, s.category, os.required_proficiency, os.importance
         FROM opportunity_skills os
         JOIN skills s ON s.id = os.skill_id
         WHERE os.opportunity_id = ANY($1::uuid[])`,
        [oppIds]
      );

      const skillsMap = {};
      for (const s of allSkills) {
        if (!skillsMap[s.opportunity_id]) {
          skillsMap[s.opportunity_id] = [];
        }
        skillsMap[s.opportunity_id].push({
          id: s.id,
          skill_id: s.id,
          name: s.name,
          category: s.category,
          required_proficiency: s.required_proficiency,
          importance: s.importance,
        });
      }

      for (const opp of rows) {
        opp.skills = skillsMap[opp.id] || [];
      }
    }
    
    res.json({
      status: 'ok',
      opportunities: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[opportunities/list]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to list opportunities.' });
  }
});

/**
 * GET /api/opportunities/:id
 * Get a single opportunity with full details
 */
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT o.id, o.company_id, o.title, o.description, o.opportunity_type, 
              o.location, o.deadline, o.status, o.created_at,
              u.name as company_name, u.email as company_email,
              cp.company_name as company_display_name, cp.description as company_description, cp.website as company_website
       FROM opportunities o
       JOIN users u ON u.id = o.company_id
       LEFT JOIN company_profiles cp ON cp.user_id = u.id
       WHERE o.id = $1`,
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Opportunity not found.' });
    }
    
    const opportunity = rows[0];
    
    // Get required skills
    const { rows: skills } = await db.query(
      `SELECT s.id, s.id as skill_id, s.name, s.category, os.required_proficiency, os.importance
       FROM opportunity_skills os
       JOIN skills s ON s.id = os.skill_id
       WHERE os.opportunity_id = $1`,
      [opportunity.id]
    );
    opportunity.skills = skills;
    
    res.json({ status: 'ok', opportunity });
  } catch (err) {
    console.error('[opportunities/get]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to get opportunity.' });
  }
});

/**
 * POST /api/opportunities
 * Create a new opportunity (company only)
 */
router.post('/', authenticate, authorize('company'), opportunityCreateRules, async (req, res) => {
  try {
    const { title, description, opportunity_type, location, deadline, status = 'open', skills } = req.body;
    const companyId = req.user.id;
    
    const result = await db.withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO opportunities (company_id, title, description, opportunity_type, location, deadline, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, company_id, title, description, opportunity_type, location, deadline, status, created_at`,
        [companyId, title, description, opportunity_type, location || null, deadline || null, status || 'open']
      );
      
      const opportunity = rows[0];
      
      // Add skills if provided
      if (skills && skills.length > 0) {
        for (const skill of skills) {
          await client.query(
            `INSERT INTO opportunity_skills (opportunity_id, skill_id, required_proficiency, importance)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (opportunity_id, skill_id) DO UPDATE SET
               required_proficiency = EXCLUDED.required_proficiency,
               importance = EXCLUDED.importance`,
            [opportunity.id, skill.skill_id, skill.required_proficiency || 1, skill.importance || 1]
          );
        }
      }
      
      return opportunity;
    });
    
    // Fetch with skills for response
    const { rows: oppSkills } = await db.query(
      `SELECT s.id, s.name, s.category, os.required_proficiency, os.importance
       FROM opportunity_skills os
       JOIN skills s ON s.id = os.skill_id
       WHERE os.opportunity_id = $1`,
      [result.id]
    );
    result.skills = oppSkills;
    
    res.status(201).json({ status: 'ok', opportunity: result });
  } catch (err) {
    console.error('[opportunities/create]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to create opportunity.' });
  }
});

/**
 * PATCH /api/opportunities/:id
 * Update an opportunity (owner only)
 */
router.patch('/:id', authenticate, authorize('company'), opportunityUpdateRules, async (req, res) => {
  try {
    const { title, description, opportunity_type, location, deadline, status, skills } = req.body;
    const companyId = req.user.id;
    const opportunityId = req.params.id;
    
    // Check ownership
    const { rows: existing } = await db.query(
      'SELECT id FROM opportunities WHERE id = $1 AND company_id = $2',
      [opportunityId, companyId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Opportunity not found or access denied.' });
    }
    
    const updates = [];
    const params = [opportunityId];
    let paramIndex = 2;
    
    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      params.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(description);
    }
    if (opportunity_type !== undefined) {
      updates.push(`opportunity_type = $${paramIndex++}`);
      params.push(opportunity_type);
    }
    if (location !== undefined) {
      updates.push(`location = $${paramIndex++}`);
      params.push(location);
    }
    if (deadline !== undefined) {
      updates.push(`deadline = $${paramIndex++}`);
      params.push(deadline);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    
    if (updates.length === 0 && !skills) {
      return res.status(400).json({ status: 'error', message: 'No fields to update.' });
    }
    
    if (updates.length > 0) {
      await db.query(
        `UPDATE opportunities SET ${updates.join(', ')} WHERE id = $1`,
        params
      );
    }
    
    // Update skills if provided
    if (skills) {
      await db.withTransaction(async (client) => {
        // Delete existing skills
        await client.query(
          'DELETE FROM opportunity_skills WHERE opportunity_id = $1',
          [opportunityId]
        );
        
        // Insert new skills
        for (const skill of skills) {
          await client.query(
            `INSERT INTO opportunity_skills (opportunity_id, skill_id, required_proficiency, importance)
             VALUES ($1, $2, $3, $4)`,
            [opportunityId, skill.skill_id, skill.required_proficiency || 1, skill.importance || 1]
          );
        }
      });
    }
    
    // Return updated opportunity
    const { rows } = await db.query(
      `SELECT o.id, o.company_id, o.title, o.description, o.opportunity_type, 
              o.location, o.deadline, o.status, o.created_at,
              u.name as company_name, cp.company_name as company_display_name
       FROM opportunities o
       JOIN users u ON u.id = o.company_id
       LEFT JOIN company_profiles cp ON cp.user_id = u.id
       WHERE o.id = $1`,
      [opportunityId]
    );
    
    const opportunity = rows[0];
    const { rows: oppSkills } = await db.query(
      `SELECT s.id, s.name, s.category, os.required_proficiency, os.importance
       FROM opportunity_skills os
       JOIN skills s ON s.id = os.skill_id
       WHERE os.opportunity_id = $1`,
      [opportunityId]
    );
    opportunity.skills = oppSkills;
    
    res.json({ status: 'ok', opportunity });
  } catch (err) {
    console.error('[opportunities/update]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to update opportunity.' });
  }
});

/**
 * DELETE /api/opportunities/:id
 * Delete an opportunity (owner only)
 */
router.delete('/:id', authenticate, authorize('company'), async (req, res) => {
  try {
    const companyId = req.user.id;
    const opportunityId = req.params.id;
    
    const { rowCount } = await db.query(
      'DELETE FROM opportunities WHERE id = $1 AND company_id = $2',
      [opportunityId, companyId]
    );
    
    if (rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Opportunity not found or access denied.' });
    }
    
    res.json({ status: 'ok', message: 'Opportunity deleted.' });
  } catch (err) {
    console.error('[opportunities/delete]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to delete opportunity.' });
  }
});

/**
 * GET /api/opportunities/my/list
 * Get current company's opportunities
 */
router.get('/my/list', authenticate, authorize('company'), async (req, res) => {
  try {
    const { page, limit } = req.query;

    const countResult = await db.query(
      'SELECT COUNT(*) FROM opportunities WHERE company_id = $1',
      [req.user.id]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    let query = `
      SELECT o.id, o.title, o.opportunity_type, o.location, o.deadline, o.status, o.created_at,
             COUNT(a.id) as application_count
      FROM opportunities o
      LEFT JOIN applications a ON a.opportunity_id = o.id
      WHERE o.company_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
    const params = [req.user.id];

    if (page !== undefined || limit !== undefined) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(Math.max(1, parseInt(limit, 10) || 10), 100);
      const offset = (pageNum - 1) * limitNum;
      query += ` LIMIT $2 OFFSET $3`;
      params.push(limitNum, offset);

      const { rows } = await db.query(query, params);
      return res.json({
        status: 'ok',
        opportunities: rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.max(1, Math.ceil(total / limitNum)),
        },
      });
    }

    const { rows } = await db.query(query, params);
    res.json({
      status: 'ok',
      opportunities: rows,
      pagination: {
        page: 1,
        limit: total || 10,
        total,
        totalPages: 1,
      },
    });
  } catch (err) {
    console.error('[opportunities/my]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to list opportunities.' });
  }
});

module.exports = router;