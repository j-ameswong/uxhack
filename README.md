# SnakeUp

**The form that fights back.**

SnakeUp is a counter-intuitive sign-up experience: a full-stack web app where form fields flee from you. Steer a snake with arrow keys to chase and capture the fields, then fill them in. Completions are timed, deaths counted, and results posted to a leaderboard.

- **Theme:** Counter-Intuitive
- **Platform:** Desktop Web Browser

---

## Quick Start

```bash
# Install dependencies
npm install

# Run client and server
npm run dev
```

- **Client:** http://localhost:5173
- **Server:** http://localhost:3001

---

## How to Play

1. **Login page** — Try typing in the password field. The snake game starts instead.
2. **Chase the fields** — Use **arrow keys** or **WASD** to move the snake.
3. **Capture fields** — Collide with Name, Email, or Password fields to capture them.
4. **Fill them in** — When a field is captured, the game pauses. Enter your value and press Enter.
5. **Stay alive** — Avoid walls and don't run into yourself.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React (Vite) |
| Game | HTML5 Canvas |
| State | React Context |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| Styling | Tailwind CSS |

---

## Project Structure

```
uxhack/
├── client/                 # React + Vite frontend
│   └── src/
│       ├── game/           # Pure game engine (snake, collision, flee AI)
│       ├── components/     # LoginPage, InputOverlay
│       ├── context/        # GameContext (form values)
│       └── hooks/          # useGameLoop, useKeyboard
├── server/                 # Express API
│   ├── routes/             # submissions, leaderboard
│   └── db.js               # SQLite setup
└── CLAUDE.md               # Full project spec & progress
```

---

## Routes

| Path | Description |
|------|--------------|
| `/` | Login page — typing in password starts the game |
| `/game` | Direct play (skip login) |
| `/leaderboard` | Leaderboard (coming soon) |

---

## Game Constants

| Constant | Default | Description |
|----------|---------|-------------|
| `TICK_RATE_MS` | 150 | Milliseconds per snake tick |
| `FLEE_RADIUS` | 8 | Grid cells — fields flee when snake is this close |
| `GRID_COLS` × `GRID_ROWS` | 40 × 30 | Logical grid size |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start client + server |
| `npm run build` | Build client for production |
| `npm start` | Start production server |

---

## License

MIT
