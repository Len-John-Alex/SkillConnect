const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Test database configuration
const TEST_DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'skillconnect_test',
  user: 'postgres',
  password: 'password',
};

// Create a test pool
const testPool = new Pool(TEST_DB_CONFIG);

// Test utilities
const TEST_JWT_SECRET = 'test_secret_key_for_testing_only';
const TEST_JWT_REFRESH_SECRET = 'test_refresh_secret_key';
const BCRYPT_ROUNDS = 10;

const TEST_USER_PASSWORD = 'TestPassword123!';
let testPasswordHash = null;
let migrationsRun = false;

async function setupTestDatabase() {
  // Check if test database exists, create if not
  const adminPool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'password',
  });

  try {
    await adminPool.query('CREATE DATABASE skillconnect_test');
    console.log('Test database created');
  } catch (err) {
    if (err.code !== '42P04') { // database already exists
      console.error('Error creating test database:', err.message);
    } else {
      console.log('Test database already exists');
    }
  } finally {
    await adminPool.end();
  }

  // Run migrations on test database (only once, without seed)
  if (!migrationsRun) {
    process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/skillconnect_test';
    const { migrate } = require('../src/db/migrate');
    await migrate({ seed: false });
    migrationsRun = true;
  }

  // Ensure cover_letter column exists
  try {
    await testPool.query('ALTER TABLE applications ADD COLUMN IF NOT EXISTS cover_letter TEXT');
  } catch (err) {
    console.log('cover_letter column check:', err.message);
  }

  // Generate test password hash
  testPasswordHash = await bcrypt.hash(TEST_USER_PASSWORD, BCRYPT_ROUNDS);

  // Clear any existing test data so test suites start from clean slate
  await clearTestData();
}

async function teardownTestDatabase() {
  await clearTestData();
  await testPool.end();
}

async function clearTestData() {
  const tables = [
    'applications',
    'opportunity_skills',
    'opportunities',
    'student_skills',
    'skill_progress',
    'projects',
    'learning_resources',
    'student_profiles',
    'company_profiles',
    'skills',
    'institutions',
    'users',
  ];

  for (const table of tables) {
    try {
      await testPool.query(`TRUNCATE TABLE ${table} CASCADE`);
    } catch (err) {
      // Ignore truncation errors during cleanup
    }
  }
}

async function createTestUser(overrides = {}) {
  const defaults = {
    name: 'Test User',
    email: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
    password: 'TestPassword123!',
    role: 'student',
  };

  const userData = { ...defaults, ...overrides };
  const passwordHash = await bcrypt.hash(userData.password, BCRYPT_ROUNDS);

  const result = await testPool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
    [userData.name, userData.email, passwordHash, userData.role]
  );

  const user = result.rows[0];

  // Create profile based on role
  if (userData.role === 'student') {
    await testPool.query(
      'INSERT INTO student_profiles (user_id) VALUES ($1)',
      [user.id]
    );
  } else if (userData.role === 'company') {
    await testPool.query(
      'INSERT INTO company_profiles (user_id, company_name) VALUES ($1, $2)',
      [user.id, userData.company_name || userData.name]
    );
  }

  return { ...user, password: userData.password };
}

async function createTestOpportunity(companyId, overrides = {}) {
  const defaults = {
    title: 'Test Opportunity',
    description: 'Test description',
    opportunity_type: 'internship',
    location: 'Remote',
    deadline: '2027-12-31',
    status: 'open',
  };

  const oppData = { ...defaults, ...overrides };

  const result = await testPool.query(
    `INSERT INTO opportunities (company_id, title, description, opportunity_type, location, deadline, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [companyId, oppData.title, oppData.description, oppData.opportunity_type, oppData.location, oppData.deadline, oppData.status]
  );

  return result.rows[0];
}

async function createTestSkill(name, category) {
  const result = await testPool.query(
    'INSERT INTO skills (name, category) VALUES ($1, $2) ON CONFLICT (name, category) DO NOTHING RETURNING *',
    [name, category]
  );

  if (result.rows.length === 0) {
    const existing = await testPool.query('SELECT * FROM skills WHERE name = $1 AND category = $2', [name, category]);
    return existing.rows[0];
  }
  return result.rows[0];
}

async function addSkillToStudent(studentId, skillId, proficiency = 3) {
  // Ensure student profile exists
  await testPool.query(
    'INSERT INTO student_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
    [studentId]
  );
  
  await testPool.query(
    `INSERT INTO student_skills (student_id, skill_id, proficiency_level)
     VALUES ($1, $2, $3)
     ON CONFLICT (student_id, skill_id) DO UPDATE SET proficiency_level = $3`,
    [studentId, skillId, proficiency]
  );
}

async function addSkillToOpportunity(opportunityId, skillId, requiredProficiency = 3, importance = 2) {
  await testPool.query(
    `INSERT INTO opportunity_skills (opportunity_id, skill_id, required_proficiency, importance)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (opportunity_id, skill_id) DO UPDATE SET required_proficiency = $3, importance = $4`,
    [opportunityId, skillId, requiredProficiency, importance]
  );
}

function generateToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    'test_secret_key_for_testing_only',
    { expiresIn: '1h' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    'test_refresh_secret_key',
    { expiresIn: '7d' }
  );
}

module.exports = {
  testPool,
  setupTestDatabase,
  teardownTestDatabase,
  clearTestData,
  createTestUser,
  createTestOpportunity,
  createTestSkill,
  addSkillToStudent,
  addSkillToOpportunity,
  generateToken,
  generateRefreshToken,
  TEST_JWT_SECRET: 'test_secret_key_for_testing_only',
  TEST_JWT_REFRESH_SECRET: 'test_refresh_secret_key',
  TEST_USER_PASSWORD: 'TestPassword123!',
};