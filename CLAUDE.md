# SnakeUp — Project Planning & Progress Tracker

## Project Summary

**SnakeUp** is a counter-intuitive sign-up experience: a full-stack web app where form fields flee from the user's cursor. The user steers a snake with arrow keys to "eat" the fields and fill them in. Completions are timed, deaths counted, and results posted to a persistent leaderboard.

- **Theme:** Counter-Intuitive
- **Platform:** Desktop Web Browser
- **Architecture:** Full-Stack Web Application (Monorepo)
- **Spec Version:** v1.0

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 19 (Vite 7) |
| Game Rendering | DOM-based (positioned divs) |
| State Management | React Context + hooks |
| Backend | Node.js + Express 5 |
| Database | SQLite via `better-sqlite3` |
| Styling | Tailwind CSS 4, shadcn/ui, custom pixel-art theme |
| Audio | Howler.js 2.2.4 |
| Routing | React Router 7 |
| Icons | Lucide React |

---

## Repository Structure

```
/
├── client/
│   ├── src/
│   │   ├── game/           # Pure JS — no React imports, no hooks
│   │   │   ├── engine.js   # GameEngine class (tick, collision, field AI, tail chars)
│   │   │   ├── fields.js   # Field class + flee AI + createFormPositionFields + createVerifyField
│   │   │   └── constants.js
│   │   ├── components/
│   │   │   ├── LandingPage.jsx     # Marketing landing page (route: /)
│   │   │   ├── LoginPage.jsx       # Pre-game form + game board + inline post-game overlay (route: /signup)
│   │   │   ├── GameBoard.jsx       # DOM-based snake/field renderer + particle bursts
│   │   │   ├── FireBorder.jsx      # Animated clockwise fire trail + top status bar
│   │   │   ├── InputOverlay.jsx    # Pixel-art input modal on field capture
│   │   │   ├── LeaderboardModal.jsx
│   │   │   └── ui/                 # shadcn/ui components
│   │   ├── context/
│   │   │   └── GameContext.jsx     # Captured form values (name, email, password)
│   │   ├── hooks/
│   │   │   ├── useGameLoop.js      # Mounts GameEngine, exposes gameState via React state
│   │   │   ├── useKeyboard.js      # Arrow/WASD input → engine direction queue
│   │   │   ├── useTimer.js         # 120s countdown + penalize(ms), pauseable
│   │   │   ├── useAudio.js         # Howler.js lazy-init, 8 named sounds
│   │   │   └── useSnakeGame.js     # Consolidated game hook (all state, all handlers)
│   │   ├── styles/
│   │   │   ├── theme.css           # Pixel-art colour scheme + CSS animations
│   │   │   └── tailwind.css
│   │   └── assets/                 # MP3 audio + images
│   └── vite.config.js      # Proxy: /api → localhost:3001
├── server/
│   ├── routes/
│   │   ├── submissions.js  # POST /api/submit, PATCH /:id/name, PATCH /:id/frame-color
│   │   └── leaderboard.js  # GET /api/leaderboard
│   ├── db.js               # SQLite connection + schema init (auto-migrates)
│   └── index.js            # Express entry, CORS, Helmet
└── CLAUDE.md
```

---

## API Contract

### `POST /api/submit`
- **Body:** `{ name, email, timeMs, deaths }`
- **Success:** `201` → `{ rank, id }`
- **Failure:** `400` on invalid input

### `PATCH /api/submit/:id/name`
- **Body:** `{ name }` — one-time display name edit
- **Success:** `200 { ok: true }`
- **Failure:** `403` if already changed, `404` if not found

### `PATCH /api/submit/:id/frame-color`
- **Body:** `{ frameColor, frameColor2? }` — set leaderboard frame colour(s)
- **Success:** `200 { ok: true }`

### `GET /api/leaderboard`
- **Response:** `[{ rank, id, name, timeMs, deaths, frameColor, frameColor2, createdAt }]` (top 10, sorted by `timeMs` ASC, then `deaths` ASC)
- No authentication required.

### `GET /api/health`
- **Response:** `{ status: "ok" }`

---

## Database Schema

**File:** `server/data/snekup.db`

Table: `submissions`

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PRIMARY KEY AUTOINCREMENT | |
| `name` | TEXT NOT NULL | Display name (editable once) |
| `email_hash` | TEXT NOT NULL | SHA-256 of `email.trim().toLowerCase()` — never store plaintext |
| `time_ms` | INTEGER NOT NULL | Completion time in milliseconds |
| `deaths` | INTEGER NOT NULL DEFAULT 0 | |
| `frame_color` | TEXT DEFAULT NULL | Hex string e.g. `#ffd700` |
| `frame_color_2` | TEXT DEFAULT NULL | Second hex for dual-gradient (top 3 only) |
| `name_changed` | INTEGER DEFAULT 0 | Prevents editing display name more than once |
| `created_at` | DATETIME DEFAULT CURRENT_TIMESTAMP | |

**Rank calculation:** `SELECT COUNT(*) FROM submissions WHERE time_ms < ? OR (time_ms = ? AND deaths < ?)` + 1

---

## Game Constants (Actual Values in `constants.js`)

| Constant | Value | Description |
|---|---|---|
| `TICK_RATE_MS` | 30 | Milliseconds per snake tick (initial speed) |
| `TICK_RATE_INCREASE_MS` | 5 | Speed increase per captured field (ms faster) |
| `VERIFY_TICK_RATE_MS` | 15 | Tick rate during Verify Password phase |
| `GRID_COLS` | 100 | Logical grid width |
| `GRID_ROWS` | 75 | Logical grid height |
| `SNAKE_START_COL` | 50 | Snake starting column |
| `SNAKE_START_ROW` | 37 | Snake starting row |
| `SNAKE_START_LENGTH` | 3 | Initial snake body segments |
| `SCATTER_DELAY_MS` | 3000 | Scatter animation duration (ms) |
| Timer | 120 s | Total time per run (in `useTimer.js`) |

**Field constants (in `fields.js`):**

| Constant | Value | Description |
|---|---|---|
| `FIELD_WIDTH` | 8 | Width of Name/Email/Password fields (grid cells) |
| `FIELD_HEIGHT` | 5 | Height of Name/Email/Password fields |
| `VERIFY_FIELD_WIDTH` | 12 | Width of Verify Password field |
| `VERIFY_FIELD_HEIGHT` | 5 | Height of Verify Password field |
| `FIELD_MARGIN` | 2 | Min cell margin from grid edges |
| `LOCK_FLEE_RADIUS` | 15 | Distance at which locked Password field flees |
| `LOCK_FLEE_SPEED` | 4 | Cells per tick locked field moves when fleeing |

---

## Build Stages & Progress

### Stage 1 — Project Scaffolding ✅
- Monorepo root, Vite React client, Express server
- Tailwind CSS, shadcn/ui, Howler.js, React Router DOM installed
- `/api` proxy in `vite.config.js`
- `/api/health` working

### Stage 2 — Game Engine ✅
- `GameEngine` class: `start()`, `stop()`, `resume()`, `_resetSnake()`
- `tick()`: advances snake, checks wall/self collision, runs field flee AI
- `onDeath`, `onFieldCaptured`, `onTick` callbacks
- `useGameLoop.js`: mounts engine, exposes `gameState`, `startGame`, `stopGame`, `resumeGame`
- `useKeyboard.js`: arrow/WASD input, prevents default on arrow keys when active

### Stage 3 — Fleeing Field Entities ✅
- `Field` class: label, grid position, `fleeStep()`, collision rect
- Fields move away from snake head when within flee radius
- DVD-bounce movement pattern when not fleeing
- Field separation: overlapping fields nudge apart

### Stage 4 — Field Capture & Input Mode ✅
- Collision detection in `engine.tick()`
- `InputOverlay.jsx`: pixel-art input modal, field-specific validation
- Timer pauses during input overlay
- `useGameContext`: stores confirmed field values
- Per-character penalty: −1s + snake grows 1 segment with character label

### Stage 5 — Submit Flow & Backend Storage ✅
- Verify Password capture triggers `POST /api/submit`
- Server hashes email with SHA-256 (`crypto.createHash('sha256')`)
- Rank calculated and returned with `{ rank, id }`
- `submitError` graceful degradation if server unavailable

### Stage 6 — Leaderboard ✅
- `GET /api/leaderboard` returns top 10 ranked by `time_ms ASC, deaths ASC`
- `LeaderboardModal.jsx`: ranked table, current user highlight, rank shown even if outside top 10
- `/leaderboard` standalone route

### Architectural Refactor ✅
- Canvas rendering → DOM-based `GameBoard.jsx` (positioned divs)
- `useSnakeGame.js` created: consolidates all game state and handlers
- AllocateMe pixel-art theme applied
- shadcn/ui components throughout

### Stage 7 — HUD & Completion Screen ✅
- Timer HUD: 120s countdown, pauses during input, penalty flash
- Death counter HUD
- 3-2-1 countdown overlay after death
- Time's up overlay; +1 death, restart
- Red screen flash on death (100ms)
- Penalty flash: red HUD 200–400ms with "−Xs" label
- `LandingPage.jsx` marketing page at `/`
- `FireBorder.jsx`: animated clockwise fire trail, top-edge status bar
- Pre-game form: decaying progress bar, auto-advance, card shake, glitch flash
- Progressive password rules (see below)
- Password field locked until Name+Email captured
- Scatter + spiral animation (ease-in quintic, 2s)
- `resetForReplay()` — full in-place reset; no navigation on Play Again
- Post-game leaderboard overlay inline in `LoginPage.jsx`
- One-time name edit + frame colour picker (7 colours)
- Dual-gradient animated border for top 3; rainbow name animation

### Stage 8 — Audio ✅
- Howler.js lazy-initialized on first keydown
- 8 sound effects wired:

| Key | File | Trigger |
|---|---|---|
| `capture` | `food.mp3` | Field captured |
| `scatter` | `move.mp3` | Fields scatter |
| `death` | `geometry-dash-death-sound-effect.mp3` | Snake dies |
| `fieldSwitch` | `fahhhhh.mp3` | Pre-game field advances |
| `countdown` | `countdown.mp3` | 3-2-1 countdown |
| `step` | `zelda-blip.mp3` | Each game tick |
| `validationFail` | `deconstruct-bricks.mp3` | Input validation fails |
| `gameover` | `gameover.mp3` | Time expires |

### Stage 9 — Deployment ✅
- Deployed (Railway or Render)
- `VITE_API_URL` env var for production API routing
- Server serves `/client/dist` as static files in production
- `PORT` and `CLIENT_URL` env vars for server config

---

## Pre-Game Form Details

**Fields (in order):** Name → Email → Verify Email → Secret (spirit animal)

**Progress bar mechanics:**
- Fills +20 per keystroke; decays −1 per 100ms when idle
- Reaches 100% → field locks in, glitch flash (120ms), advance to next field
- Card shake intensity 1–3 scales with number of completed fields (150ms duration)

**Spirit animals:** Axolotl, Capybara, Cassowary, Dingo, Echidna, Narwhal, Okapi, Pangolin, Quokka, Tapir, Wombat

---

## Password Rules (Progressive)

Rules revealed one at a time. Applied in this order if `loginSecret` is set:

1. Must contain your spirit animal, backwards (case-insensitive)
2. At least 8 characters
3. Contains an uppercase letter
4. Digits in the password sum to ≥ 25

If no spirit animal selected, rule 1 is skipped (3 rules total).

**Verify Password:** Must exactly match the first password entry.

---

## Key Design Decisions

- **Game loop separation:** `GameEngine` runs outside React (interval-based). React state only updated on discrete events (field captured, death, game over) — not every tick.
- **Flee AI:** DVD-bounce movement; within `LOCK_FLEE_RADIUS` the locked Password field moves 4 cells/tick toward snake.
- **Tail characters:** Typed characters become snake tail segments with visible char labels. Tail wraps clockwise along inner border (1 cell inward) if it goes off-map.
- **Arrow key prevention:** `event.preventDefault()` on arrow keys when game active; ignores INPUT/TEXTAREA targets so typed chars don't become directions.
- **Audio trigger:** Lazy Howler.js init on first `keydown` satisfies browser autoplay policy.
- **Email privacy:** SHA-256 hash stored; raw email discarded immediately after hashing.
- **Single route for game:** `/signup` handles pre-game form, game board, and post-game overlay. `resetForReplay()` resets everything in-place — no navigation needed.
- **loginValuesRef:** Pre-game form values (name, email, secret) are passed to `beginGame()` and stored in a ref. InputOverlay uses these for in-game validation (Name/Email must match; password must embed the reversed animal name).

---

## Coding Conventions

- Game engine code (`/client/src/game/`) must be **pure JS** — no React imports, no hooks, no JSX.
- React state updates from the game engine must go through **callbacks passed at mount time** — never direct state setters inside the engine.
- All grid positions are `{ col, row }` objects. Pixel conversion happens only in renderer.
- Constants are defined once in `constants.js` and imported everywhere — no magic numbers in engine code.
- `useSnakeGame.js` is the single source of truth for game UI state. Components receive state and callbacks as props from this hook.

---

## Stretch Goals (Post-MVP)

- [ ] Mobile support: on-screen D-pad or swipe controls
- [ ] Difficulty tiers: flee radius / speed scaling per capture
- [ ] Multiplayer: two players race using WebSockets
- [ ] Animated snake skin or per-field easter eggs
- [ ] CAPTCHA parody: second form appears post-completion with faster fields

---

## Known Bugs

- Snake can occasionally die immediately after reset-to-center post-death (wall collision on first tick after resume)
