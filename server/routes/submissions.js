const express = require('express');

const router = express.Router();

// POST /api/submit — implemented in Stage 5
router.post('/', (_req, res) => {
  res.status(501).json({ error: 'Not yet implemented' });
});

module.exports = router;
