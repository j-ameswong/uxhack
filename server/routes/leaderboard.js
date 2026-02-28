const express = require('express');

const router = express.Router();

// GET /api/leaderboard — implemented in Stage 6
router.get('/', (_req, res) => {
  res.json([]);
});

module.exports = router;
