# SnekUp

> Submission for the [UXHack 2026 Hackathon](https://techvision-uxhack.devpost.com/?ref_feature=challenge&ref_medium=discover)

![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white&labelColor=20232a)
![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white&labelColor=1a1a2e)
![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?logo=node.js&logoColor=white&labelColor=1a1a2e)
![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003b57?logo=sqlite&logoColor=white&labelColor=1a1a2e)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white&labelColor=1a1a2e)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-555?logo=anthropic&logoColor=fff)](https://claude.ai/code)


https://github.com/user-attachments/assets/9d6b67b2-40ea-4fee-8e4b-cb674dba622b

| [Hackathons UK](https://www.hackathons.org.uk/) | [UoS Techvision Society](https://linktr.ee/techvisionsociety) |
| - | - |
| <img width="300" height="100" alt="image" src="https://github.com/user-attachments/assets/2afc2379-38fb-4852-bfe7-a78553b8a815" /> | <img width="250" height="250" alt="image" src="https://github.com/user-attachments/assets/7b11e768-c1d5-4b8c-aa86-c0a9b9c5f06e" /> |


---

SnekUp is a counter-intuitive sign-up experience. You land on what looks like a ~~completely~~ normal registration form  - but you quickly realize there's a gimmick, and the moment you try to submit it, the fields run away!

**The only way to fill them in is to *eat* them.**

You are a snake. Use the arrow/WASD keys. Chase the fields down and swallow them whole. Each capture freezes the game and drops an input prompt. Fill in the field correctly, and the snake speeds up, the timer ticks on, and the next field runs for cover.

1. Miss the wall. 
2. Don't eat yourself. 
3. Don't let the clock hit zero. (You get punished for typing!)
4. Complete the form and get on the leaderboard!

It's a sign-up form that's-- hear me out--  also a snake game!

---

## The Flow

1. A normal-looking marketing page. Send this to someone who's clueless
2. `/signup`: a glossy, totally innocent sign-up card. One field active at a time. The card shakes when you type. Something is wrong.
3. Click the submit button -> The form dissolves. Fields scatter in all directions. The game begins.
4. Steer the snake with arrow keys or WASD. Fields bounce like DVD screensavers and the password field runs away until you catch the other fields. You have to catch them to fill them in.
5. Once Name, Email, and Password are captured, a "Verify Password" field spawns at max speed.
6. Your time, deaths, and rank is saved to a persistent leaderboard. You can edit your display name once and pick a frame colour; the top 3 get an animated dual-gradient border and a rainbow name.

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
- **Time's up** → counts as perma death, restart

---

## Pre-Game Form

Before the game starts, you fill in a "normal" sign-up form. It has a twist:

- **One field active at a time** — tabbing/clicking doesn't work, the form decides when you're ready
- **Progress bar** — fills with each keystroke; decays when you stop; hits 100% → field locks in, glitch flash, advance
- **Card shake** — the card shakes harder as you fill in more fields
- **Fields:**
  - Name
  - Email
  - Verify Email
  - Secret (choose your spirit animal — you'll need it for the password)

**Spirit animals to choose from:** Axolotl, Capybara, Cassowary, Dingo, Echidna, Narwhal, Okapi, Pangolin, Quokka, Tapir, Wombat

---

## Password Rules (Progressive)

The password field is **locked** until Name and Email are both captured. Once unlocked it flees aggressively. When you catch it, the rules are revealed one at a time as each is satisfied:

| Step | Rule |
|---|---|
| 1 | Must contain your spirit animal, backwards |
| 2 | At least 8 characters |
| 3 | Contains an uppercase letter |
| 4 | Digits in your password must add up to 25 |

**Example:** Secret = "Narwhal" → password must contain "lahwran" (case-insensitive)

---

## Scoring

Runs are ranked by **time** (fastest first), then **deaths** (fewest first).

| Event | Effect on score |
|---|---|
| Character typed | −1 second |
| Failed validation | −5 seconds |
| Death (wall/self) | +1 death counter |
| Time expired | +1 death, full restart |

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
| Frontend | React 19 (Vite 7), DOM-based rendering |
| Styling | Tailwind CSS 4, shadcn/ui, custom pixel-art theme |
| Game Engine | Vanilla JS class (`engine.js`), 30 ms initial tick |
| State | React Context + hooks |
| Backend | Node.js + Express 5 |
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
│       │   ├── fields.js       # Field class + flee AI + factory functions
│       │   └── constants.js    # All magic numbers live here
│       ├── components/
│       │   ├── LandingPage.jsx       # Marketing page (/)
│       │   ├── LoginPage.jsx         # Pre-game form + inline post-game overlay (/signup)
│       │   ├── GameBoard.jsx         # DOM-based snake + field renderer
│       │   ├── FireBorder.jsx        # Animated fire trail + status bar
│       │   ├── InputOverlay.jsx      # Pixel-art input modal on capture
│       │   └── LeaderboardModal.jsx  # Leaderboard table (post-game + standalone)
│       ├── hooks/
│       │   ├── useSnakeGame.js  # Consolidated game state + all handlers
│       │   ├── useGameLoop.js   # Mounts GameEngine, exposes gameState
│       │   ├── useKeyboard.js   # Arrow/WASD input → engine direction queue
│       │   ├── useTimer.js      # 120s countdown, pauseable, penalize(ms)
│       │   └── useAudio.js      # Howler.js lazy-init audio system
│       └── context/
│           └── GameContext.jsx  # Captured form values (name, email, password)
└── server/
    ├── routes/
    │   ├── submissions.js   # POST /api/submit, 2× PATCH endpoints
    │   └── leaderboard.js   # GET /api/leaderboard (top 10)
    ├── db.js                # SQLite connection + schema init
    └── index.js             # Express server entry point
```

---

## Game Constants

| Constant | Value | Description |
|---|---|---|
| `TICK_RATE_MS` | 30 ms | Initial snake speed |
| `TICK_RATE_INCREASE_MS` | 5 ms | Speed gain per captured field |
| `VERIFY_TICK_RATE_MS` | 15 ms | Tick rate during Verify Password phase |
| `LOCK_FLEE_RADIUS` | 15 cells | Distance at which locked Password field flees |
| `LOCK_FLEE_SPEED` | 4 cells/tick | Speed of locked field fleeing |
| `GRID_COLS × GRID_ROWS` | 100 × 75 | Logical grid dimensions |
| `SCATTER_DELAY_MS` | 3000 ms | Scatter animation duration |
| Timer | 120 s | Total time per run |

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start client + server concurrently |
| `npm run dev:client` | Client (Vite) only |
| `npm run dev:server` | Server only |
| `cd client && npm run build` | Build client for production |

---

## Stretch Goals (RIP)

- Mobile support (on-screen D-pad or swipe controls)
- Update your submission with a new high score on replays
- Difficulty tiers (flee radius / speed scaling per capture)
- Multiplayer race via WebSockets
- Animated snake skin or per-field easter eggs
- CAPTCHA parody: second form post-completion with faster fields

---

Built for a UX hackathon. Theme: *Counter-Intuitive*.
