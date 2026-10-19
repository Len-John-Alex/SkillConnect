'use strict';

const { Router } = require('express');
const db = require('../db/pool');

const router = Router();

/**
 * GET /api/institutions
 * List all institutions
 */
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, name, location, description FROM institutions ORDER BY name ASC'
    );
    res.json({ status: 'ok', institutions: rows });
  } catch (err) {
    console.error('[institutions/list]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to list institutions.' });
  }
});

/**
 * GET /api/institutions/:id
 * Get institution by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'SELECT id, name, location, description FROM institutions WHERE id = $1',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Institution not found.' });
    }
    res.json({ status: 'ok', institution: rows[0] });
  } catch (err) {
    console.error('[institutions/get]', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to get institution.' });
  }
});

module.exports = router;
