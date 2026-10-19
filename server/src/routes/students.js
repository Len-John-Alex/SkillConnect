'use strict';

const { Router } = require('express');
const db = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { 
  studentProfileUpdateRules, 
  studentSkillRules,
  studentSkillUpdateRules 
} = require('../middleware/validate');

const router = Router();

/**
 * GET /api/students/me/profile
 * Get current student's profile with skills
 */
router.get('/me/profile', authenticate, authorize('student'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT sp.user_id, sp.institution_id, sp.degree, sp.branch, sp.graduation_year, sp.bio,
              i.name as institution_name, i.location as institution_location,
              u.name, u.email, u.role, u.created_at
       FROM student_profiles sp
       JOIN users u ON u.id = sp.user_id
       LEFT JOIN institutions i ON i.id = sp.institution_id
       WHERE sp.user_id = $1`,
      [req.user.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Student profile not found.' });
    }
    
    const profile = rows[0];
    
    // Get skills with proficiency
    const { rows: skills } = await db.query(
      `SELECT s.id, s.id as skill_id, s.name, s.category, ss.proficiency_level, ss.updated_at
       FROM student_skills ss
       JOIN skills s ON s.id = ss.skill_id
       WHERE ss.student_id = $1
       ORDER BY s.name ASC`,
      [req.user.id]
    );
    profile.skills = skills;
    
    // Get skill progress
    const { rows: progress } = await db.query(
      `SELECT s.id, s.name, sp.status, sp.updated_at
       FROM skill_progress sp
       JOIN skills s ON s.id = sp.skill_id
       WHERE sp.student_id = $1`,
      [req.user.id]
    );
    profile.skill_progress = progress;
    
    res.json({ status: 'ok', profile });
  } catch (err) {
    console.error('[student/profile/get]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to get profile.' });
  }
});

/**
 * PATCH /api/students/me/profile
 * Update current student's profile
 */
router.patch('/me/profile', authenticate, authorize('student'), studentProfileUpdateRules, async (req, res) => {
  try {
    const { institution_id, degree, branch, graduation_year, bio } = req.body;
    
    const updates = [];
    const params = [req.user.id];
    let paramIndex = 2;
    
    if (institution_id !== undefined) {
      updates.push(`institution_id = $${paramIndex++}`);
      params.push(institution_id || null);
    }
    if (degree !== undefined) {
      updates.push(`degree = $${paramIndex++}`);
      params.push(degree || null);
    }
    if (branch !== undefined) {
      updates.push(`branch = $${paramIndex++}`);
      params.push(branch || null);
    }
    if (graduation_year !== undefined) {
      updates.push(`graduation_year = $${paramIndex++}`);
      params.push(graduation_year || null);
    }
    if (bio !== undefined) {
      updates.push(`bio = $${paramIndex++}`);
      params.push(bio || null);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No fields to update.' });
    }
    
    await db.query(
      `UPDATE student_profiles SET ${updates.join(', ')} WHERE user_id = $1`,
      params
    );
    
    // Return updated profile
    const { rows } = await db.query(
      `SELECT sp.user_id, sp.institution_id, sp.degree, sp.branch, sp.graduation_year, sp.bio,
              i.name as institution_name, u.name, u.email, u.role, u.created_at
       FROM student_profiles sp
       JOIN users u ON u.id = sp.user_id
       LEFT JOIN institutions i ON i.id = sp.institution_id
       WHERE sp.user_id = $1`,
      [req.user.id]
    );
    
    res.json({ status: 'ok', profile: rows[0] });
  } catch (err) {
    console.error('[student/profile/update]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to update profile.' });
  }
});

/**
 * GET /api/students/me/skills
 * Get current student's skills
 */
router.get('/me/skills', authenticate, authorize('student'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT s.id, s.id as skill_id, s.name, s.category, ss.proficiency_level, ss.updated_at
       FROM student_skills ss
       JOIN skills s ON s.id = ss.skill_id
       WHERE ss.student_id = $1
       ORDER BY s.name ASC`,
      [req.user.id]
    );
    
    res.json({ status: 'ok', skills: rows });
  } catch (err) {
    console.error('[student/skills/list]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to list skills.' });
  }
});

/**
 * POST /api/students/me/skills
 * Add or update a skill for current student
 */
router.post('/me/skills', authenticate, authorize('student'), studentSkillRules, async (req, res) => {
  try {
    const { skill_id, proficiency_level = 1 } = req.body;
    const studentId = req.user.id;
    
    // Verify skill exists
    const { rows: skill } = await db.query('SELECT id FROM skills WHERE id = $1', [skill_id]);
    if (skill.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Skill not found.' });
    }
    
    const { rows } = await db.query(
      `INSERT INTO student_skills (student_id, skill_id, proficiency_level)
       VALUES ($1, $2, $3)
       ON CONFLICT (student_id, skill_id) DO UPDATE SET
         proficiency_level = EXCLUDED.proficiency_level,
         updated_at = NOW()
       RETURNING student_id, skill_id, proficiency_level, updated_at`,
      [studentId, skill_id, proficiency_level]
    );
    
    res.json({ status: 'ok', skill: rows[0] });
  } catch (err) {
    console.error('[student/skills/add]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to add skill.' });
  }
});

/**
 * PATCH /api/students/me/skills/:skillId
 * Update skill proficiency for current student
 */
router.patch('/me/skills/:skillId', authenticate, authorize('student'), studentSkillUpdateRules, async (req, res) => {
  try {
    const { proficiency_level } = req.body;
    const studentId = req.user.id;
    const skillId = req.params.skillId;
    
    const { rows } = await db.query(
      `UPDATE student_skills 
       SET proficiency_level = $1, updated_at = NOW()
       WHERE student_id = $2 AND skill_id = $3
       RETURNING student_id, skill_id, proficiency_level, updated_at`,
      [proficiency_level, studentId, skillId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Skill not found in your profile.' });
    }
    
    res.json({ status: 'ok', skill: rows[0] });
  } catch (err) {
    console.error('[student/skills/update]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to update skill.' });
  }
});

/**
 * DELETE /api/students/me/skills/:skillId
 * Remove a skill from current student's profile
 */
router.delete('/me/skills/:skillId', authenticate, authorize('student'), async (req, res) => {
  try {
    const studentId = req.user.id;
    const skillId = req.params.skillId;
    
    const { rowCount } = await db.query(
      'DELETE FROM student_skills WHERE student_id = $1 AND skill_id = $2',
      [studentId, skillId]
    );
    
    if (rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Skill not found in your profile.' });
    }
    
    res.json({ status: 'ok', message: 'Skill removed from profile.' });
  } catch (err) {
    console.error('[student/skills/delete]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to remove skill.' });
  }
});

/**
 * GET /api/students/me/skill-progress
 * Get current student's skill progress
 */
router.get('/me/skill-progress', authenticate, authorize('student'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT sp.skill_id, s.name, s.category, sp.status, sp.updated_at
       FROM skill_progress sp
       JOIN skills s ON s.id = sp.skill_id
       WHERE sp.student_id = $1
       ORDER BY sp.updated_at DESC`,
      [req.user.id]
    );
    
    res.json({ status: 'ok', progress: rows });
  } catch (err) {
    console.error('[student/skill-progress/list]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to list skill progress.' });
  }
});

/**
 * POST /api/students/me/skill-progress
 * Update skill progress for current student
 */
router.post('/me/skill-progress', authenticate, authorize('student'), 
  require('../middleware/validate').skillProgressRules, async (req, res) => {
  try {
    const { skill_id, status } = req.body;
    const studentId = req.user.id;
    
    // Verify skill exists
    const { rows: skill } = await db.query('SELECT id FROM skills WHERE id = $1', [skill_id]);
    if (skill.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Skill not found.' });
    }
    
    const { rows } = await db.query(
      `INSERT INTO skill_progress (student_id, skill_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (student_id, skill_id) DO UPDATE SET
         status = EXCLUDED.status,
         updated_at = NOW()
       RETURNING student_id, skill_id, status, updated_at`,
      [studentId, skill_id, status]
    );
    
    res.json({ status: 'ok', progress: rows[0] });
  } catch (err) {
    console.error('[student/skill-progress/update]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to update skill progress.' });
  }
});

/**
 * GET /api/students/me/projects
 * Get current student's projects
 */
router.get('/me/projects', authenticate, authorize('student'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, title, description, project_url, created_at
       FROM projects
       WHERE student_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    
    res.json({ status: 'ok', projects: rows });
  } catch (err) {
    console.error('[student/projects/list]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to list projects.' });
  }
});

/**
 * POST /api/students/me/projects
 * Create a new project for current student
 */
router.post('/me/projects', authenticate, authorize('student'),
  require('../middleware/validate').projectCreateRules, async (req, res) => {
  try {
    const { title, description, project_url } = req.body;
    const studentId = req.user.id;
    
    const { rows } = await db.query(
      `INSERT INTO projects (student_id, title, description, project_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, student_id, title, description, project_url, created_at`,
      [studentId, title, description || null, project_url || null]
    );
    
    res.status(201).json({ status: 'ok', project: rows[0] });
  } catch (err) {
    console.error('[student/projects/create]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to create project.' });
  }
});

/**
 * PATCH /api/students/me/projects/:id
 * Update a project
 */
router.patch('/me/projects/:id', authenticate, authorize('student'),
  require('../middleware/validate').projectUpdateRules, async (req, res) => {
  try {
    const { title, description, project_url } = req.body;
    const studentId = req.user.id;
    const projectId = req.params.id;
    
    const updates = [];
    const params = [projectId, studentId];
    let paramIndex = 3;
    
    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      params.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(description);
    }
    if (project_url !== undefined) {
      updates.push(`project_url = $${paramIndex++}`);
      params.push(project_url);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No fields to update.' });
    }
    
    const { rows } = await db.query(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = $1 AND student_id = $2 RETURNING *`,
      params
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Project not found.' });
    }
    
    res.json({ status: 'ok', project: rows[0] });
  } catch (err) {
    console.error('[student/projects/update]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to update project.' });
  }
});

/**
 * DELETE /api/students/me/projects/:id
 * Delete a project
 */
router.delete('/me/projects/:id', authenticate, authorize('student'), async (req, res) => {
  try {
    const studentId = req.user.id;
    const projectId = req.params.id;
    
    const { rowCount } = await db.query(
      'DELETE FROM projects WHERE id = $1 AND student_id = $2',
      [projectId, studentId]
    );
    
    if (rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Project not found.' });
    }
    
    res.json({ status: 'ok', message: 'Project deleted.' });
  } catch (err) {
    console.error('[student/projects/delete]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to delete project.' });
  }
});

module.exports = router;