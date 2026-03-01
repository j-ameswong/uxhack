const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data', 'snakeup.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    email_hash  TEXT NOT NULL,
    time_ms     INTEGER NOT NULL,
    deaths      INTEGER NOT NULL DEFAULT 0,
    frame_color TEXT DEFAULT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Add frame_color column if missing (existing databases)
try {
  db.exec(`ALTER TABLE submissions ADD COLUMN frame_color TEXT DEFAULT NULL`);
} catch (_) {
  // Column already exists — ignore
}

module.exports = db;
