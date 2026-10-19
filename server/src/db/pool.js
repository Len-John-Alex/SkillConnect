'use strict';

const { Pool } = require('pg');

// ─── Validate required env var ───────────────────────────────────
if (!process.env.DATABASE_URL) {
  throw new Error(
    '[db] DATABASE_URL is not set. ' +
    'Copy server/.env.example to server/.env and fill in your credentials.'
  );
}

// ─── Connection Pool ─────────────────────────────────────────────
//
// pg.Pool reads DATABASE_URL from the connection string.
// All credentials (host, port, user, password, dbname) live
// exclusively in the environment variable — never hardcoded here.
//
// Pool settings are tuned for a single-process dev/production server.
// Adjust max, idleTimeoutMillis, and connectionTimeoutMillis for scale.
const isRemoteDb =
  process.env.NODE_ENV === 'production' ||
  (process.env.DATABASE_URL &&
    (process.env.DATABASE_URL.includes('sslmode=') ||
     process.env.DATABASE_URL.includes('.render.com') ||
     process.env.DATABASE_URL.includes('.neon.tech') ||
     process.env.DATABASE_URL.includes('.supabase.co')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // TLS: Automatically handle SSL for remote cloud DBs (Neon, Render, Supabase)
  ...(isRemoteDb
    ? {
        ssl: {
          rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true',
        },
      }
    : {}),

  max: 10,                    // max simultaneous connections
  idleTimeoutMillis: 30_000,  // close idle connections after 30 s
  connectionTimeoutMillis: 15_000, // 15 s timeout for remote cloud handshakes
});

// ─── Error logging for idle clients ──────────────────────────────
pool.on('error', (err) => {
  console.error('[db] Unexpected idle client error:', err.message);
});

// ─── Public helpers ──────────────────────────────────────────────

/**
 * Execute a single parameterized query.
 *
 * @param {string} text   - Parameterized SQL string ($1, $2, …)
 * @param {Array}  [params] - Parameter values
 * @returns {Promise<import('pg').QueryResult>}
 *
 * @example
 *   const { rows } = await query(
 *     'SELECT * FROM users WHERE email = $1',
 *     [email]
 *   );
 */
async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;

  if (process.env.NODE_ENV !== 'test') {
    console.debug(`[db] query ${duration}ms | rows=${result.rowCount} | ${text.slice(0, 80)}`);
  }

  return result;
}

/**
 * Acquire a dedicated client for a transaction.
 * Always call client.release() in a finally block.
 *
 * @returns {Promise<import('pg').PoolClient>}
 *
 * @example
 *   const client = await getClient();
 *   try {
 *     await client.query('BEGIN');
 *     await client.query('INSERT INTO ...');
 *     await client.query('COMMIT');
 *   } catch (err) {
 *     await client.query('ROLLBACK');
 *     throw err;
 *   } finally {
 *     client.release();
 *   }
 */
async function getClient() {
  return pool.connect();
}

/**
 * Convenience wrapper: run a callback inside a transaction.
 * Automatically commits on success or rolls back on any thrown error.
 *
 * @template T
 * @param {(client: import('pg').PoolClient) => Promise<T>} callback
 * @returns {Promise<T>}
 *
 * @example
 *   const result = await withTransaction(async (client) => {
 *     const { rows } = await client.query('INSERT INTO users ... RETURNING id');
 *     await client.query('INSERT INTO student_profiles (user_id) VALUES ($1)', [rows[0].id]);
 *     return rows[0];
 *   });
 */
async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Test connectivity — used by the DB init procedure and health check.
 * @returns {Promise<{ connected: boolean; version: string }>}
 */
async function testConnection() {
  const { rows } = await pool.query('SELECT version() AS version');
  return { connected: true, version: rows[0].version };
}

/**
 * Graceful shutdown — drain the pool before process exit.
 */
async function end() {
  await pool.end();
}

module.exports = { query, getClient, withTransaction, testConnection, end };
