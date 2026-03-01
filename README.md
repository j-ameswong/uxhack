# SnekUp

> Submission for the UXHack 2026 Hackathon

---

SnekUp is a counter-intuitive sign-up experience. You land on what looks like a completely normal registration form with Name, Email, Password, but the moment you try to interact with it, the fields run away!

**The only way to fill them in is to *eat* them.**

You are a snake. Use the arrow/wasd keys. Chase the fields down and swallow them whole. Each capture freezes the game and drops an input prompt. Fill in the field correctly, and the snake speeds up, the timer ticks on, and the next field runs for cover.

Miss the wall. Don't eat yourself. Don't let the clock hit zero. Complete the form. Get on the leaderboard.

It's a sign-up form. It's also a snake game!

---

## The Flow

1. **Landing** — a normal-looking marketing page. CTA: "Create Account."
2. **Pre-game form** (`/signup`) — a glossy, totally innocent sign-up card. One field active at a time. The card shakes when you type. Something is wrong.
3. **The reveal** — click the password field. The form dissolves. Fields scatter in all directions. The game begins.
4. **The game** (`/game`) — steer the snake with arrow keys or WASD. Fields flee when you get close. Catch them to fill them in. Miss and lose time.
5. **Verify Password** — once Name, Email, and Password are captured, a "Verify Password" field spawns at full throttle. One last chase.
6. **The leaderboard** — your time, your deaths, your rank. Edit your display name once. Pick a frame colour. Top 3 get an animated dual-gradient border and a rainbow name.

---

## How to Play

| Key | Action |
|---|---|
| `↑ ↓ ← →` or `WASD` | Move the snake |
| `Enter` | Confirm field input |

- **Capture a field** — steer the snake head into it; the game pauses and an input prompt appears
- **Valid input** → snake grows, game resumes at higher speed
- **Invalid input** → −5 seconds, try again
- **Each character typed** → −1 second + snake grows 1 segment (every keystroke costs you)
- **Death** (wall or self) → red flash, 3-2-1 countdown, fields scatter, death added to your count
- **Time's up** → counts as a death, restart

---

## Password Rules (Progressive)

The password field is locked until Name and Email are both captured. Then it starts demanding things:

| Step | Rule |
|---|---|
| 1 | At least 8 characters |
| 2 | Contains an uppercase letter |
| 3 | Digits in the password sum to 25 or more |
| 4 | Contains an emoji |
| 5 | Contains a prime number |

---

## Quick Start

```bash
# From the repo root — install client + server deps
cd client && npm install && cd ..
cd server && npm install && cd ..

# Start both (client :5173, server :3001)
npm run dev
```

The Vite dev server proxies `/api` to `localhost:3001` automatically.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), DOM-based rendering |
| Styling | Tailwind CSS, shadcn/ui, pixel-art theme |
| Game Engine | Vanilla JS class (`engine.js`), 40 ms tick |
| State | React Context + useReducer |
| Backend | Node.js + Express |
| Database | SQLite via `better-sqlite3` |
| Audio | Howler.js |

---

## API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check — `{ status: "ok" }` |
| `POST` | `/api/submit` | Submit a run: `{ name, email, timeMs, deaths }` → `{ rank, id }` |
| `GET` | `/api/leaderboard` | Top 10, sorted by time then deaths |
| `PATCH` | `/api/submit/:id/name` | One-time display name edit |
| `PATCH` | `/api/submit/:id/frame-color` | Set leaderboard frame colour(s) |

Email is SHA-256 hashed before storage. Raw email is never persisted.

---

## Project Structure

```
/
├── client/
│   └── src/
│       ├── game/               # Pure JS — no React, no hooks
│       │   ├── engine.js       # GameEngine class (tick, collision, callbacks)
│       │   ├── fields.js       # Field class + flee AI
│       │   └── constants.js    # All magic numbers live here
│       ├── components/
│       │   ├── LandingPage.jsx
│       │   ├── LoginPage.jsx        # Pre-game form with morph animation
│       │   ├── GameBoard.jsx        # DOM-based snake + field renderer
│       │   ├── FireBorder.jsx       # Animated fire trail around game edges
│       │   ├── InputOverlay.jsx     # Pixel-art input modal on capture
│       │   └── LeaderboardModal.jsx
│       ├── hooks/
│       │   ├── useSnakeGame.js      # Consolidated game state + handlers
│       │   ├── useGameLoop.js
│       │   ├── useKeyboard.js
│       │   └── useTimer.js
│       └── context/
│           └── GameContext.jsx
└── server/
    ├── routes/
    │   ├── submissions.js
    │   └── leaderboard.js
    ├── db.js
    └── index.js
```

---

## Game Constants

| Constant | Value | Description |
|---|---|---|
| `TICK_RATE_MS` | 40 ms | Initial snake speed |
| `TICK_RATE_INCREASE_MS` | 10 ms | Speed gain per captured field |
| `VERIFY_TICK_RATE_MS` | 20 ms | Tick rate during Verify Password phase |
| `FLEE_RADIUS` | 15 cells | Distance at which fields start fleeing |
| `GRID_COLS × GRID_ROWS` | 100 × 75 | Logical grid dimensions |
| `SCATTER_DELAY_MS` | 3000 ms | Scatter animation duration |

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start client + server concurrently |
| `cd client && npm run build` | Build client for production |

---

## Stretch Goals

- Mobile support (on-screen D-pad or swipe controls)
- Difficulty tiers (flee radius / speed scaling per capture)
- Multiplayer race via WebSockets
- Animated snake skin or per-field easter eggs
- CAPTCHA parody: second form post-completion with faster fields

---

Built for a UX hackathon. Theme: *Counter-Intuitive*.
