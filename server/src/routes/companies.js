'use strict';

const { Router } = require('express');
const db = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { companyProfileUpdateRules } = require('../middleware/validate');

const router = Router();

/**
 * GET /api/companies/me/profile
 * Get current company's profile
 */
router.get('/me/profile', authenticate, authorize('company'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT cp.user_id, cp.company_name, cp.description, cp.website,
              u.name, u.email, u.role, u.created_at
       FROM company_profiles cp
       JOIN users u ON u.id = cp.user_id
       WHERE cp.user_id = $1`,
      [req.user.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Company profile not found.' });
    }
    
    res.json({ status: 'ok', profile: rows[0] });
  } catch (err) {
    console.error('[company/profile/get]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to get profile.' });
  }
});

/**
 * PATCH /api/companies/me/profile
 * Update current company's profile
 */
router.patch('/me/profile', authenticate, authorize('company'), companyProfileUpdateRules, async (req, res) => {
  try {
    const { company_name, description, website } = req.body;
    
    const updates = [];
    const params = [req.user.id];
    let paramIndex = 2;
    
    if (company_name !== undefined) {
      updates.push(`company_name = $${paramIndex++}`);
      params.push(company_name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(description || null);
    }
    if (website !== undefined) {
      updates.push(`website = $${paramIndex++}`);
      params.push(website || null);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No fields to update.' });
    }
    
    await db.query(
      `UPDATE company_profiles SET ${updates.join(', ')} WHERE user_id = $1`,
      params
    );
    
    const { rows } = await db.query(
      `SELECT cp.user_id, cp.company_name, cp.description, cp.website,
              u.name, u.email, u.role, u.created_at
       FROM company_profiles cp
       JOIN users u ON u.id = cp.user_id
       WHERE cp.user_id = $1`,
      [req.user.id]
    );
    
    res.json({ status: 'ok', profile: rows[0] });
  } catch (err) {
    console.error('[company/profile/update]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to update profile.' });
  }
});

/**
 * GET /api/companies/:id
 * Get public company profile
 */
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT cp.user_id, cp.company_name, cp.description, cp.website,
              u.name, u.email, u.role, u.created_at
       FROM company_profiles cp
       JOIN users u ON u.id = cp.user_id
       WHERE cp.user_id = $1`,
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Company not found.' });
    }
    
    // Also get their opportunities count
    const { rows: oppCount } = await db.query(
      'SELECT COUNT(*) as count FROM opportunities WHERE company_id = $1 AND status = $2',
      [req.params.id, 'open']
    );
    
    const profile = rows[0];
    profile.open_opportunities = parseInt(oppCount[0].count, 10);
    
    res.json({ status: 'ok', profile });
  } catch (err) {
    console.error('[company/public/get]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to get company.' });
  }
});

module.exports = router;