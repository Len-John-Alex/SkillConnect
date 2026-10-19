'use strict';

const { Router } = require('express');
const db = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { 
  applicationCreateRules, 
  applicationStatusRules 
} = require('../middleware/validate');

const router = Router();

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const VALID_APPLICATION_STATUSES = ['pending', 'shortlisted', 'accepted', 'rejected', 'withdrawn'];

/**
 * POST /api/applications
 * Apply to an opportunity (student only)
 */
router.post('/', authenticate, authorize('student'), applicationCreateRules, async (req, res) => {
  try {
    const { opportunity_id, cover_letter } = req.body;
    const studentId = req.user.id;
    
    // Check if opportunity exists and is open
    const { rows: opp } = await db.query(
      `SELECT o.id, o.status, o.company_id, o.title,
              u.name as company_name
       FROM opportunities o
       JOIN users u ON u.id = o.company_id
       WHERE o.id = $1`,
      [opportunity_id]
    );
    
    if (opp.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Opportunity not found.' });
    }
    
    if (opp[0].status !== 'open') {
      return res.status(400).json({ status: 'error', message: 'This opportunity is not accepting applications.' });
    }
    
    // Check if already applied
    const { rows: existing } = await db.query(
      'SELECT id, status FROM applications WHERE opportunity_id = $1 AND student_id = $2',
      [opportunity_id, studentId]
    );
    
    if (existing.length > 0) {
      if (existing[0].status === 'withdrawn') {
        const { rows: reactivated } = await db.query(
          `UPDATE applications 
           SET status = 'pending', cover_letter = $1, applied_at = NOW() 
           WHERE id = $2 
           RETURNING id, opportunity_id, student_id, cover_letter, status, applied_at`,
          [cover_letter || null, existing[0].id]
        );
        return res.status(200).json({ status: 'ok', application: reactivated[0] });
      }
      return res.status(409).json({ status: 'error', message: 'You have already applied to this opportunity.' });
    }
    
    // Create application
    const { rows } = await db.query(
      `INSERT INTO applications (opportunity_id, student_id, cover_letter, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id, opportunity_id, student_id, cover_letter, status, applied_at`,
      [opportunity_id, studentId, cover_letter || null]
    );
    
    res.status(201).json({ status: 'ok', application: rows[0] });
  } catch (err) {
    console.error('[applications/create]', err.message);
    if (err.code === '23505') { // unique violation
      return res.status(409).json({ status: 'error', message: 'You have already applied to this opportunity.' });
    }
    res.status(500).json({ status: 'error', message: 'Failed to create application.' });
  }
});

/**
 * GET /api/applications
 * List applications (student: own applications, company: applications to their opportunities)
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, opportunity_id } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let baseQuery = '';
    let countQuery = '';
    const params = [];
    let paramIndex = 1;
    
    if (userRole === 'student') {
      baseQuery = `
        SELECT a.id, a.opportunity_id, a.student_id, a.status, a.cover_letter, a.applied_at,
               o.title, o.opportunity_type, o.location, o.deadline, o.company_id,
               u.name as company_name, cp.company_name as company_display_name
        FROM applications a
        JOIN opportunities o ON o.id = a.opportunity_id
        JOIN users u ON u.id = o.company_id
        LEFT JOIN company_profiles cp ON cp.user_id = u.id
        WHERE a.student_id = $${paramIndex}
      `;
      countQuery = `
        SELECT COUNT(*)
        FROM applications a
        JOIN opportunities o ON o.id = a.opportunity_id
        WHERE a.student_id = $${paramIndex}
      `;
      params.push(userId);
      paramIndex++;
    } else if (userRole === 'company') {
      baseQuery = `
        SELECT a.id, a.opportunity_id, a.student_id, a.status, a.cover_letter, a.applied_at,
               o.title, o.opportunity_type, o.location, o.deadline,
               u.name as student_name, u.email as student_email,
               sp.degree, sp.branch, sp.graduation_year
        FROM applications a
        JOIN opportunities o ON o.id = a.opportunity_id
        JOIN users u ON u.id = a.student_id
        LEFT JOIN student_profiles sp ON sp.user_id = u.id
        WHERE o.company_id = $${paramIndex}
      `;
      countQuery = `
        SELECT COUNT(*)
        FROM applications a
        JOIN opportunities o ON o.id = a.opportunity_id
        WHERE o.company_id = $${paramIndex}
      `;
      params.push(userId);
      paramIndex++;
    } else {
      return res.status(403).json({ status: 'error', message: 'Insufficient permissions.' });
    }
    
    if (status && VALID_APPLICATION_STATUSES.includes(status)) {
      baseQuery += ` AND a.status = $${paramIndex}`;
      countQuery += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (opportunity_id && opportunity_id !== 'undefined' && opportunity_id !== 'null' && UUID_REGEX.test(opportunity_id)) {
      baseQuery += ` AND a.opportunity_id = $${paramIndex}`;
      countQuery += ` AND a.opportunity_id = $${paramIndex}`;
      params.push(opportunity_id);
      paramIndex++;
    }
    
    // Count total
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);
    
    baseQuery += ` ORDER BY a.applied_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const { rows } = await db.query(baseQuery, params);
    
    // For students, batch get skill requirements for opportunities
    if (userRole === 'student' && rows.length > 0) {
      const oppIds = [...new Set(rows.map((app) => app.opportunity_id))];
      const { rows: allOppSkills } = await db.query(
        `SELECT os.opportunity_id, s.id, s.name, s.category, os.required_proficiency, os.importance
         FROM opportunity_skills os
         JOIN skills s ON s.id = os.skill_id
         WHERE os.opportunity_id = ANY($1::uuid[])`,
        [oppIds]
      );
      const oppSkillsMap = {};
      for (const s of allOppSkills) {
        if (!oppSkillsMap[s.opportunity_id]) {
          oppSkillsMap[s.opportunity_id] = [];
        }
        oppSkillsMap[s.opportunity_id].push({
          id: s.id,
          name: s.name,
          category: s.category,
          required_proficiency: s.required_proficiency,
          importance: s.importance,
        });
      }
      for (const app of rows) {
        app.opportunity_skills = oppSkillsMap[app.opportunity_id] || [];
      }
    }
    
    // For companies, batch get student skills
    if (userRole === 'company' && rows.length > 0) {
      const studentIds = [...new Set(rows.map((app) => app.student_id))];
      const { rows: allStudentSkills } = await db.query(
        `SELECT ss.student_id, s.id, s.name, s.category, ss.proficiency_level
         FROM student_skills ss
         JOIN skills s ON s.id = ss.skill_id
         WHERE ss.student_id = ANY($1::uuid[])`,
        [studentIds]
      );
      const studentSkillsMap = {};
      for (const s of allStudentSkills) {
        if (!studentSkillsMap[s.student_id]) {
          studentSkillsMap[s.student_id] = [];
        }
        studentSkillsMap[s.student_id].push({
          id: s.id,
          name: s.name,
          category: s.category,
          proficiency_level: s.proficiency_level,
        });
      }
      for (const app of rows) {
        app.student_skills = studentSkillsMap[app.student_id] || [];
      }
    }
    
    res.json({
      status: 'ok',
      applications: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[applications/list]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to list applications.' });
  }
});

/**
 * GET /api/applications/:id
 * Get a single application with full details
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const appId = req.params.id;
    
    let { rows } = await db.query(
      `SELECT a.id, a.opportunity_id, a.student_id, a.status, a.cover_letter, a.applied_at,
               o.title, o.description, o.opportunity_type, o.location, o.deadline, o.company_id,
               u.name as company_name, u.email as company_email,
               cp.company_name as company_display_name, cp.description as company_description
        FROM applications a
        JOIN opportunities o ON o.id = a.opportunity_id
        JOIN users u ON u.id = o.company_id
        LEFT JOIN company_profiles cp ON cp.user_id = u.id
        WHERE a.id = $1`,
      [appId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Application not found.' });
    }
    
    const application = rows[0];
    
    // Check permissions
    if (userRole === 'student' && application.student_id !== userId) {
      return res.status(403).json({ status: 'error', message: 'Access denied.' });
    }
    if (userRole === 'company' && application.company_id !== userId) {
      return res.status(403).json({ status: 'error', message: 'Access denied.' });
    }
    
    // Get opportunity skills
    const { rows: oppSkills } = await db.query(
      `SELECT s.id, s.name, s.category, os.required_proficiency, os.importance
       FROM opportunity_skills os
       JOIN skills s ON s.id = os.skill_id
       WHERE os.opportunity_id = $1`,
      [application.opportunity_id]
    );
    application.opportunity_skills = oppSkills;
    
    // Get student profile and skills
    const { rows: studentProfile } = await db.query(
      `SELECT sp.degree, sp.branch, sp.graduation_year, sp.bio,
              i.name as institution_name
       FROM student_profiles sp
       LEFT JOIN institutions i ON i.id = sp.institution_id
       WHERE sp.user_id = $1`,
      [application.student_id]
    );
    application.student_profile = studentProfile[0] || null;
    
    const { rows: studentSkills } = await db.query(
      `SELECT s.id, s.name, s.category, ss.proficiency_level
       FROM student_skills ss
       JOIN skills s ON s.id = ss.skill_id
       WHERE ss.student_id = $1`,
      [application.student_id]
    );
    application.student_skills = studentSkills;
    
    res.json({ status: 'ok', application });
  } catch (err) {
    console.error('[applications/get]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to get application.' });
  }
});

/**
 * PATCH /api/applications/:id/status
 * Update application status (company only)
 */
router.patch('/:id/status', authenticate, authorize('company'), applicationStatusRules, async (req, res) => {
  try {
    const { status } = req.body;
    const companyId = req.user.id;
    const appId = req.params.id;
    
    // Verify company owns the opportunity
    const { rows: app } = await db.query(
      `SELECT a.id, a.status, a.student_id, o.company_id, o.title
       FROM applications a
       JOIN opportunities o ON o.id = a.opportunity_id
       WHERE a.id = $1`,
      [appId]
    );
    
    if (app.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Application not found.' });
    }
    
    if (app[0].company_id !== companyId) {
      return res.status(403).json({ status: 'error', message: 'Access denied.' });
    }
    
    // Prevent invalid status transitions
    const currentStatus = app[0].status;
    const validTransitions = {
      pending: ['shortlisted', 'rejected'],
      shortlisted: ['accepted', 'rejected'],
      accepted: [],
      rejected: [],
      withdrawn: [],
    };
    
    if (!validTransitions[currentStatus]?.includes(status)) {
      return res.status(400).json({ 
        status: 'error', 
        message: `Cannot change status from ${currentStatus} to ${status}.` 
      });
    }
    
    const { rows } = await db.query(
      'UPDATE applications SET status = $1 WHERE id = $2 RETURNING id, status',
      [status, appId]
    );
    
    res.json({ status: 'ok', application: rows[0] });
  } catch (err) {
    console.error('[applications/status]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to update application status.' });
  }
});

/**
 * PATCH /api/applications/:id/withdraw
 * Withdraw application (student only)
 */
router.patch('/:id/withdraw', authenticate, authorize('student'), async (req, res) => {
  try {
    const studentId = req.user.id;
    const appId = req.params.id;
    
    const { rows } = await db.query(
      `SELECT a.id, a.status, a.student_id
       FROM applications a
       WHERE a.id = $1 AND a.student_id = $2`,
      [appId, studentId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Application not found.' });
    }
    
    const currentStatus = rows[0].status;
    if (currentStatus !== 'pending' && currentStatus !== 'shortlisted') {
      return res.status(400).json({ 
        status: 'error', 
        message: `Cannot withdraw application with status ${currentStatus}.` 
      });
    }
    
    const { rows: updated } = await db.query(
      'UPDATE applications SET status = $1 WHERE id = $2 RETURNING id, status',
      ['withdrawn', appId]
    );
    
    res.json({ status: 'ok', application: updated[0] });
  } catch (err) {
    console.error('[applications/withdraw]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to withdraw application.' });
  }
});

module.exports = router;