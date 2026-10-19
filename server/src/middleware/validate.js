'use strict';

const { body, param, query, validationResult } = require('express-validator');

// PostgreSQL-compatible UUID pattern (allows both RFC 4122 v4 UUIDs and deterministic hex seed IDs)
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Runs validation result and returns 400 with errors if any.
 */
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

// ─── Registration Validators ────────────────────────────────────
const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ max: 100 }).withMessage('Name must be 100 characters or fewer.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character (!@#$%^&*).'),

  body('role')
    .trim()
    .notEmpty().withMessage('Account type is required.')
    .isIn(['student', 'company', 'institution']).withMessage('Account type must be student, company, or institution.'),

  body('company_name')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Company name must be 200 characters or fewer.'),

  body('institutionInviteCode')
    .optional()
    .trim(),

  handleValidation,
];

// ─── Login Validators ───────────────────────────────────────────
const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.'),

  handleValidation,
];

// ─── Opportunity Validators ─────────────────────────────────────
const opportunityCreateRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required.')
    .isLength({ max: 200 }).withMessage('Title must be 200 characters or fewer.'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description must be 5000 characters or fewer.'),
  
  body('opportunity_type')
    .notEmpty().withMessage('Opportunity type is required.')
    .isIn(['internship', 'project', 'full_time', 'part_time', 'contract'])
    .withMessage('Invalid opportunity type.'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Location must be 200 characters or fewer.'),
  
  body('deadline')
    .optional()
    .isISO8601().withMessage('Deadline must be a valid date (YYYY-MM-DD).'),
  
  body('status')
    .optional()
    .isIn(['draft', 'open', 'closed', 'cancelled'])
    .withMessage('Invalid opportunity status.'),

  body('skills')
    .optional()
    .isArray().withMessage('Skills must be an array.'),
  
  body('skills.*.skill_id')
    .optional()
    .notEmpty().withMessage('Skill ID is required.')
    .matches(UUID_REGEX).withMessage('Invalid skill ID.'),
  
  body('skills.*.required_proficiency')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Required proficiency must be between 1 and 5.'),
  
  body('skills.*.importance')
    .optional()
    .isInt({ min: 1, max: 3 }).withMessage('Importance must be between 1 and 3.'),

  handleValidation,
];

const opportunityUpdateRules = [
  param('id')
    .notEmpty().withMessage('Invalid opportunity ID.')
    .matches(UUID_REGEX).withMessage('Invalid ID format.'),
  
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Title cannot be empty.')
    .isLength({ max: 200 }).withMessage('Title must be 200 characters or fewer.'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description must be 5000 characters or fewer.'),
  
  body('opportunity_type')
    .optional()
    .isIn(['internship', 'project', 'full_time', 'part_time', 'contract'])
    .withMessage('Invalid opportunity type.'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Location must be 200 characters or fewer.'),
  
  body('deadline')
    .optional()
    .isISO8601().withMessage('Deadline must be a valid date (YYYY-MM-DD).'),
  
  body('status')
    .optional()
    .isIn(['draft', 'open', 'closed', 'cancelled'])
    .withMessage('Invalid status.'),

  handleValidation,
];

const opportunityQueryRules = [
  query('type')
    .optional()
    .isIn(['internship', 'project', 'full_time', 'part_time', 'contract'])
    .withMessage('Invalid opportunity type.'),
  
  query('status')
    .optional()
    .isIn(['draft', 'open', 'closed', 'cancelled'])
    .withMessage('Invalid status.'),
  
  query('location')
    .optional()
    .trim(),
  
  query('skill_id')
    .optional({ nullable: true, checkFalsy: true })
    .matches(UUID_REGEX).withMessage('Invalid skill ID.'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),

  handleValidation,
];

// ─── Application Validators ─────────────────────────────────────
const applicationCreateRules = [
  body('opportunity_id')
    .notEmpty().withMessage('Opportunity ID is required.')
    .matches(UUID_REGEX).withMessage('Invalid opportunity ID.'),
  
  body('cover_letter')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Cover letter must be 5000 characters or fewer.'),

  handleValidation,
];

const applicationStatusRules = [
  param('id')
    .notEmpty().withMessage('Invalid application ID.')
    .matches(UUID_REGEX).withMessage('Invalid ID format.'),
  
  body('status')
    .notEmpty().withMessage('Status is required.')
    .isIn(['pending', 'shortlisted', 'accepted', 'rejected', 'withdrawn'])
    .withMessage('Invalid status.'),

  handleValidation,
];

// ─── Skills Validators ──────────────────────────────────────────
const skillCreateRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Skill name is required.')
    .isLength({ max: 100 }).withMessage('Skill name must be 100 characters or fewer.'),
  
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Category must be 100 characters or fewer.'),

  handleValidation,
];

const skillQueryRules = [
  query('category')
    .optional()
    .trim(),
  
  query('search')
    .optional()
    .trim(),

  handleValidation,
];

// ─── Student Profile Validators ─────────────────────────────────
const studentProfileUpdateRules = [
  body('institution_id')
    .optional({ nullable: true, checkFalsy: true })
    .matches(UUID_REGEX).withMessage('Invalid institution ID.'),
  
  body('degree')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Degree must be 200 characters or fewer.'),
  
  body('branch')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Branch must be 200 characters or fewer.'),
  
  body('graduation_year')
    .optional()
    .isInt({ min: 1950, max: 2100 }).withMessage('Graduation year must be between 1950 and 2100.'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Bio must be 2000 characters or fewer.'),

  handleValidation,
];

const studentSkillRules = [
  body('skill_id')
    .notEmpty().withMessage('Skill ID is required.')
    .matches(UUID_REGEX).withMessage('Invalid skill ID.'),
  
  body('proficiency_level')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Proficiency level must be between 1 and 5.'),
  
  handleValidation,
];

const studentSkillUpdateRules = [
  body('proficiency_level')
    .notEmpty().withMessage('Proficiency level is required.')
    .isInt({ min: 1, max: 5 }).withMessage('Proficiency level must be between 1 and 5.'),
  
  handleValidation,
];

// ─── Company Profile Validators ─────────────────────────────────
const companyProfileUpdateRules = [
  body('company_name')
    .optional()
    .trim()
    .notEmpty().withMessage('Company name cannot be empty.')
    .isLength({ max: 200 }).withMessage('Company name must be 200 characters or fewer.'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description must be 5000 characters or fewer.'),
  
  body('website')
    .optional()
    .trim()
    .isURL().withMessage('Website must be a valid URL.'),

  handleValidation,
];

// ─── Project Validators ─────────────────────────────────────────
const projectCreateRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required.')
    .isLength({ max: 200 }).withMessage('Title must be 200 characters or fewer.'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description must be 5000 characters or fewer.'),
  
  body('project_url')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Project URL must be a valid HTTP or HTTPS URL.'),

  handleValidation,
];

const projectUpdateRules = [
  param('id')
    .notEmpty().withMessage('Invalid project ID.')
    .matches(UUID_REGEX).withMessage('Invalid ID format.'),
  
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Title cannot be empty.')
    .isLength({ max: 200 }).withMessage('Title must be 200 characters or fewer.'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description must be 5000 characters or fewer.'),
  
  body('project_url')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Project URL must be a valid HTTP or HTTPS URL.'),

  handleValidation,
];

// ─── Learning Resource Validators ───────────────────────────────
const learningResourceCreateRules = [
  body('skill_id')
    .notEmpty().withMessage('Skill ID is required.')
    .matches(UUID_REGEX).withMessage('Invalid skill ID.'),
  
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required.')
    .isLength({ max: 200 }).withMessage('Title must be 200 characters or fewer.'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description must be 5000 characters or fewer.'),
  
  body('resource_url')
    .optional()
    .trim()
    .isURL().withMessage('Resource URL must be a valid URL.'),
  
  body('resource_type')
    .optional()
    .isIn(['video', 'article', 'course', 'book', 'tool', 'other'])
    .withMessage('Invalid resource type.'),

  handleValidation,
];

// ─── Skill Progress Validators ──────────────────────────────────
const skillProgressRules = [
  body('skill_id')
    .notEmpty().withMessage('Skill ID is required.')
    .matches(UUID_REGEX).withMessage('Invalid skill ID.'),
  
  body('status')
    .notEmpty().withMessage('Status is required.')
    .isIn(['not_started', 'in_progress', 'completed'])
    .withMessage('Invalid status.'),

  handleValidation,
];

module.exports = {
  registerRules,
  loginRules,
  opportunityCreateRules,
  opportunityUpdateRules,
  opportunityQueryRules,
  applicationCreateRules,
  applicationStatusRules,
  skillCreateRules,
  skillQueryRules,
  studentProfileUpdateRules,
  studentSkillRules,
  studentSkillUpdateRules,
  companyProfileUpdateRules,
  projectCreateRules,
  projectUpdateRules,
  learningResourceCreateRules,
  skillProgressRules,
};
