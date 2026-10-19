'use strict';

/**
 * db/migrate.js
 *
 * Database initialization procedure.
 * Reads the versioned SQL migration file and applies it to the database.
 *
 * Usage (CLI):
 *   node src/db/migrate.js            ← apply migrations
 *   node src/db/migrate.js --seed     ← apply migrations + seed data
 *
 * This script NEVER creates the database itself.
 * The database must already exist before running this.
 * See README.md → "Database Setup" for instructions.
 */

require('dotenv').config();

const path = require('path');
const fs   = require('fs');
const db   = require('./pool');

// ─── Migration files (ordered) ───────────────────────────────────
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const SEEDS_DIR      = path.join(__dirname, 'seeds');

async function getMigrationFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // lexicographic order — 001, 002, … must be zero-padded
}

async function readSql(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

// ─── Main ────────────────────────────────────────────────────────
async function migrate({ seed = false } = {}) {
  console.log('\n[migrate] Connecting to PostgreSQL…');

  // Quick connectivity check before touching anything
  try {
    const { rows } = await db.query('SELECT current_database() AS db, version() AS pg');
    console.log(`[migrate] Connected to database "${rows[0].db}"`);
    console.log(`[migrate] ${rows[0].pg.split(',')[0]}`);
  } catch (err) {
    console.error('[migrate] ❌ Cannot connect to PostgreSQL:', err.message);
    console.error('[migrate] Check DATABASE_URL in server/.env');
    process.exit(1);
  }

  // ── Ensure schema_migrations table exists first ───────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    TEXT        PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // ── Apply migration files ─────────────────────────────────────
  const files = await getMigrationFiles();
  console.log(`\n[migrate] Found ${files.length} migration file(s).`);

  for (const file of files) {
    const version = file.replace('.sql', '');

    const { rows: existing } = await db.query(
      'SELECT version FROM schema_migrations WHERE version = $1',
      [version]
    );

    if (existing.length > 0) {
      console.log(`[migrate]   ⏭  ${file} — already applied, skipping.`);
      continue;
    }

    console.log(`[migrate]   ⏳ Applying ${file}…`);
    const sql = await readSql(path.join(MIGRATIONS_DIR, file));

    try {
      await db.query(sql);
      console.log(`[migrate]   ✅ ${file} applied.`);
    } catch (err) {
      console.error(`[migrate]   ❌ Error applying ${file}:`, err.message);
      throw err;
    }
  }

  // ── Optional seed ─────────────────────────────────────────────
  if (seed) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('\n[migrate] ⚠️ Seed data is disabled in production to protect credentials.\n');
      return;
    }
    const seedFile = path.join(SEEDS_DIR, 'seed.sql');
    if (!fs.existsSync(seedFile)) {
      console.warn('[migrate] --seed requested but seed.sql not found.');
    } else {
      console.log('\n[migrate] 🌱 Applying seed data…');
      const seedSql = await readSql(seedFile);
      await db.query(seedSql);
      console.log('[migrate] 🌱 Seed data applied.');
    }
  }

  console.log('\n[migrate] ✅ All migrations complete.\n');
}

// ─── CLI entry point ─────────────────────────────────────────────
if (require.main === module) {
  const args = process.argv.slice(2);
  const seedFlag = args.includes('--seed');

  migrate({ seed: seedFlag })
    .catch((err) => {
      console.error('[migrate] Fatal error:', err.message);
      process.exit(1);
    })
    .finally(() => db.end());
}

module.exports = { migrate };
