const express = require('express');
const crypto  = require('crypto');
const db      = require('../db');

const router = express.Router();

// POST /api/submit
router.post('/', (req, res) => {
  const { name, email, timeMs, deaths } = req.body;

  // Validate
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'name is required' });
  }
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'valid email is required' });
  }
  if (typeof timeMs !== 'number' || timeMs < 0) {
    return res.status(400).json({ error: 'timeMs must be a non-negative number' });
  }
  if (typeof deaths !== 'number' || deaths < 0) {
    return res.status(400).json({ error: 'deaths must be a non-negative number' });
  }

  const emailHash  = crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
  const intTimeMs  = Math.round(timeMs);
  const intDeaths  = Math.round(deaths);

  const { lastInsertRowid: id } = db
    .prepare('INSERT INTO submissions (name, email_hash, time_ms, deaths) VALUES (?, ?, ?, ?)')
    .run(name.trim(), emailHash, intTimeMs, intDeaths);

  // Rank = count of rows that strictly beat this submission + 1
  const { count } = db
    .prepare('SELECT COUNT(*) AS count FROM submissions WHERE time_ms < ? OR (time_ms = ? AND deaths < ?)')
    .get(intTimeMs, intTimeMs, intDeaths);

  return res.status(201).json({ rank: count + 1, id });
});

module.exports = router;
