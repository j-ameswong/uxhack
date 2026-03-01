const express = require('express');
const db      = require('../db');

const router = express.Router();

// GET /api/leaderboard — top 10 by time_ms ASC, deaths ASC
router.get('/', (_req, res) => {
  const rows = db
    .prepare(`
      SELECT id, name, time_ms, deaths, frame_color, created_at
      FROM submissions
      ORDER BY time_ms ASC, deaths ASC
      LIMIT 10
    `)
    .all();

  const result = rows.map((row, i) => ({
    rank: i + 1,
    id: row.id,
    name: row.name,
    timeMs: row.time_ms,
    deaths: row.deaths,
    frameColor: row.frame_color,
    createdAt: row.created_at,
  }));

  res.json(result);
});

module.exports = router;
