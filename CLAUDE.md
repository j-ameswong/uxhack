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
| Frontend Framework | React (Vite) |
| Game Rendering | HTML5 Canvas |
| State Management | React Context + useReducer |
| Backend | Node.js + Express |
| Database | SQLite via `better-sqlite3` |
| Styling | Tailwind CSS |
| Audio | Howler.js |
| Deployment | Railway or Render |

---

## Repository Structure

```
/
├── client/
│   ├── src/
│   │   ├── game/           # Pure game engine — snake loop, collision, field AI
│   │   │   ├── engine.js   # GameEngine class
│   │   │   ├── fields.js   # Field class + factory fns (createFormPositionFields, createVerifyField)
│   │   │   ├── constants.js
│   │   │   └── draw.js     # Legacy canvas renderer (kept for reference, not used)
│   │   ├── components/     # React UI components
│   │   │   ├── LandingPage.jsx     # Marketing landing page (route: /)
│   │   │   ├── LoginPage.jsx       # Pre-game glossy form (route: /signup)
│   │   │   ├── GameBoard.jsx       # DOM-based game renderer
│   │   │   ├── FireBorder.jsx      # Animated fire edge effect
│   │   │   ├── InputOverlay.jsx    # Pixel-art input modal on field capture
│   │   │   ├── LeaderboardModal.jsx
│   │   │   └── ui/                 # shadcn/ui components
│   │   ├── context/
│   │   │   └── GameContext.jsx     # Captured form values (name, email, password)
│   │   ├── hooks/
│   │   │   ├── useGameLoop.js      # Mounts engine, exposes gameState
│   │   │   ├── useKeyboard.js      # Arrow/WASD input
│   │   │   ├── useTimer.js         # 120s countdown + penalize(ms)
│   │   │   └── useSnakeGame.js     # Consolidated game state hook
│   │   ├── styles/
│   │   │   ├── theme.css           # AllocateMe pixel-art colour scheme
│   │   │   └── tailwind.css
│   │   └── assets/
│   │       └── happy.gif
│   └── vite.config.js      # Proxy: /api -> localhost:3001
├── server/
│   ├── routes/
│   │   ├── submissions.js  # POST /api/submit, PATCH /:id/name, PATCH /:id/frame-color
│   │   └── leaderboard.js  # GET /api/leaderboard
│   ├── db.js               # SQLite connection and schema init
│   └── index.js
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

Table: `submissions`

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PRIMARY KEY AUTOINCREMENT | |
| `name` | TEXT NOT NULL | |
| `email_hash` | TEXT NOT NULL | SHA-256 of raw email — never store plaintext |
| `time_ms` | INTEGER NOT NULL | Completion time in milliseconds |
| `deaths` | INTEGER NOT NULL DEFAULT 0 | |
| `frame_color` | TEXT DEFAULT NULL | Hex string e.g. `#ffd700` |
| `frame_color_2` | TEXT DEFAULT NULL | Second hex for dual-gradient (top 3 only) |
| `name_changed` | INTEGER DEFAULT 0 | Flag — prevents editing display name more than once |
| `created_at` | DATETIME DEFAULT CURRENT_TIMESTAMP | |

---

## Key Design Decisions

- **Game loop separation:** The canvas game engine runs outside React's render cycle (via `useEffect` + `setInterval`/`requestAnimationFrame`). React state is only updated on discrete events (field captured, game over, all fields collected) — not every tick.
- **Flee AI:** On each tick, if the snake head is within `FLEE_RADIUS` (default: 8 cells) of a field, the field moves one cell along its dominant axis away from the snake. Position is clamped to keep fields catchable.
- **Arrow key prevention:** `event.preventDefault()` on arrow keys when the game is active; re-enabled on blur.
- **Audio trigger:** All sounds triggered on first user interaction (`keydown`), not on page load.
- **Email privacy:** SHA-256 hash stored; raw email discarded immediately.
- **Grid:** Logical coordinate system overlaid on full viewport. Max 40×30 cells. Fields occupy rectangular grid regions.

---

## Game Constants (Configurable)

| Constant | Value | Description |
|---|---|---|
| `TICK_RATE_MS` | 40 | Milliseconds per snake tick (initial speed) |
| `TICK_RATE_INCREASE_MS` | 10 | Speed increase per captured field (floored at 20 ms/tick) |
| `VERIFY_TICK_RATE_MS` | 20 | Tick rate during Verify Password phase |
| `FLEE_RADIUS` | 15 | Grid cells — locked field aggressive flee radius |
| `GRID_COLS` | 100 | Logical grid width |
| `GRID_ROWS` | 75 | Logical grid height |
| `SCATTER_DELAY_MS` | 3000 | Scatter animation duration |

---

## Build Stages & Progress

### Stage 1 — Project Scaffolding ✅
**Goal:** Monorepo running locally; client and server communicating.

- [x] Initialise monorepo root with `package.json` (workspaces or plain scripts)
- [x] Scaffold client with `npm create vite@latest client -- --template react`
- [x] Install client dependencies: `tailwindcss`, `howler`
- [x] Configure Tailwind (`@tailwindcss/vite` plugin, `@import "tailwindcss"` in `index.css`)
- [x] Scaffold server: `npm init` in `/server`, install `express`, `better-sqlite3`, `cors`, `helmet`
- [x] Add `/api` proxy in `vite.config.js` pointing to `localhost:3001`
- [x] Add `dev` scripts (concurrent client + server start via root `package.json`)
- [x] Verify: client builds clean, server at `http://localhost:3001`, `/api/health` returns `{"status":"ok"}`

---

### Stage 2 — Canvas Game Engine (Snake Only)
**Goal:** A playable snake on canvas with wall and self-collision — no fields yet.

- [x] Create `client/src/game/constants.js` — export all configurable constants
- [x] Create `client/src/game/engine.js` — `GameEngine` class with:
  - [x] `start()` / `stop()` / `pause()` / `resume()` / `reset()` methods
  - [x] `tick()` advancing snake position each interval
  - [x] Wall collision → trigger `onDeath` callback
  - [x] Self-collision → trigger `onDeath` callback
  - [x] Direction queue (prevent 180° reversal)
- [x] Create `client/src/game/draw.js` — `draw(ctx, state, canvas)` with grid, snake, eye glints, death flash, field stub
- [x] Create `client/src/game/useKeyboard.js` — arrow keys + WASD, `preventDefault`, feeds engine
- [x] Create `client/src/game/useGameLoop.js` — mounts engine, ResizeObserver on canvas, rAF render loop
- [x] Create `client/src/game/App.jsx` — `GamePage` (canvas + start screen + HUD), `LeaderboardPage` stub, React Router shell

> **NOTE — teammates placed hooks and App.jsx inside `client/src/game/` instead of the planned `src/hooks/` and `src/` directories. Acceptable deviation — do not reorganise mid-project.**

**3 bugs to fix before Stage 2 is shippable:**

- [x] **BUG 1 — app entry not updated:** Fixed `client/src/main.jsx` to import `'./game/App.jsx'`.
- [x] **BUG 2 — wrong hook import paths:** Fixed `App.jsx` imports to `'./useGameLoop.js'` and `'./useKeyboard.js'`.
- [x] **BUG 3 — missing dependency:** Installed `react-router-dom` in `/client`.

### Stage 2 ✅ — Verified: build produces 236 kB (was 193 kB) confirming all game modules are now bundled.

---

### Stage 3 — Fleeing Field Entities ✅
**Goal:** Three field entities on the grid with functional flee AI.

- [x] Create `client/src/game/fields.js` — `Field` class / factory with:
  - [x] Grid position state
  - [x] `label` property (`"Name"`, `"Email"`, `"Password"`)
  - [x] `fleeStep(snakeHeadPos)` — moves one cell away from head if within `FLEE_RADIUS`; clamps to grid bounds with margin
- [x] Integrate fields into `GameEngine` — initialise three `Field` instances with random start positions
- [x] Call `field.fleeStep()` for each field each tick
- [x] Draw fields on canvas as distinct rectangles with label text
- [x] Verify: fields visibly flee when snake approaches, stay within bounds

---

### Stage 4 — Field Capture & Input Mode ✅
**Goal:** Snake head collision with a field triggers capture; snake freezes; user can type.

- [x] Add collision detection in `GameEngine.tick()` — compare snake head cell to each field's grid rect
- [x] On collision: mark field as `captured`, grow snake by one segment, trigger `onFieldCaptured(field)` callback
- [x] `onFieldCaptured` pauses the game loop (snake freezes, fields stop fleeing)
- [x] Create `client/src/components/InputOverlay.jsx`:
  - [x] Fixed HUD position (e.g. bottom-centre)
  - [x] Shows prompt: `"Enter your {field.label}:"`
  - [x] Controlled `<input>` element, auto-focused
  - [x] `Enter` key confirms; runs per-field validation:
    - Name: non-empty
    - Email: basic regex (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
    - Password: min 8 characters
  - [x] On valid confirm: store value in game context, resume game loop
  - [x] On invalid: show inline error, do not resume
- [x] Tooltip: if user presses a letter key when no field is captured and game is active, show mocked tooltip
- [x] Verify: capture flow end-to-end, validation errors, game resumes correctly

**Additional features added during Stage 4:**
- `client/src/context/GameContext.jsx` — React context storing captured form values (name, email, password)
- `client/src/components/LoginPage.jsx` — entry screen; password field click triggers the game
- `client/src/hooks/useTimer.js` — timer hook tracking elapsed ms, pauseable during input mode
- Snake speeds up by `TICK_RATE_INCREASE_MS` per captured field (resets on death); keyboard events guarded against INPUT/TEXTAREA targets so typed characters don't leak into snake direction

---

### Stage 5 — Submit Flow & Backend Storage ✅
**Goal:** All three fields captured → Submit button → POST to server → rank returned.

- [x] After third field confirmed, auto-submit via "Verify Password" capture flow
- [x] On submit: collect `{ name, email, timeMs, deaths }`, POST to `POST /api/submit`
- [x] **Server — `server/db.js`:**
  - [x] Open SQLite database (`./data/snakeup.db`)
  - [x] `CREATE TABLE IF NOT EXISTS submissions (...)` on startup
- [x] **Server — `server/routes/submissions.js`:**
  - [x] Validate all fields (400 on failure)
  - [x] SHA-256 hash the email before storage (`crypto.createHash('sha256')`)
  - [x] Insert row into `submissions`
  - [x] Query rank: count rows with `time_ms < submitted`, or `time_ms = submitted AND deaths < submitted`
  - [x] Return `{ rank, id }` with status `201`
- [x] Client: on `201`, store rank in context, navigate to completion screen
- [x] Client: on error, show friendly message ("Couldn't save your score") and preserve form values client-side
- [x] Verify: submission inserts to DB, rank is accurate

**Implementation notes:**
- After Name/Email/Password captured, engine spawns a "Verify Password" field at higher speed
- Capturing Verify Password triggers the POST — no separate Submit button needed
- `submitError` flag passed to SuccessPage for graceful degradation when server unavailable

---

### Stage 6 — Leaderboard Endpoint & Modal ✅
**Goal:** Top-10 leaderboard accessible on completion screen and at `/leaderboard` route.

- [x] **Server — `server/routes/leaderboard.js`:**
  - [x] `GET /api/leaderboard` returns top 10 rows ordered `time_ms ASC, deaths ASC`
  - [x] Add `rank` field to each row in response
- [x] **Client — `client/src/components/LeaderboardModal.jsx`:**
  - [x] `GET /api/leaderboard` on mount
  - [x] Render ranked table: `rank | name | time | deaths`
  - [x] Highlight the current user's row (matched by `id` from submit response)
  - [x] Show user's own rank even if not in top 10 (append below table with separator)
- [x] **Client — `/leaderboard` route:**
  - [x] Standalone page rendering `<LeaderboardModal>` without playing the game
  - [x] React Router `/leaderboard` route
- [x] Verify: leaderboard populates correctly, current user highlighted, `/leaderboard` route works standalone

---

### Architectural Refactor ✅ (between Stage 6 & 7)
**Goal:** Replace canvas rendering with DOM-based rendering and AllocateMe/Figma design system.

- [x] Replaced HTML5 Canvas game rendering with DOM-based `GameBoard.jsx` (snake/fields as positioned divs)
- [x] Removed `game/draw.js` canvas renderer (replaced by `GameBoard.jsx`); `draw.js` re-added later for field styling
- [x] Modified `engine.js`: added `onTick` callback, removed canvas params from `tick()` and `start()`
- [x] Rewrote `useGameLoop.js`: removed canvasRef, exposes `gameState` via React state, passes onTick to engine
- [x] Created `client/src/hooks/useSnakeGame.js` — consolidates all game state & handlers from LoginPage + App:
  - deaths, started, capturedField, showTooltip, showFailed, timerResetKey
  - handleDeath, handleFieldCaptured, handleInputConfirm, handleTimeUp + full submit flow
- [x] Added shadcn/ui design system components: `badge`, `button`, `card`, `input`, `label`, `avatar`, `progress`, `tabs`
- [x] Added `client/src/styles/theme.css` — AllocateMe colour scheme
- [x] LoginPage: gradient background with animated blobs, glassmorphic Card, lucide-react icons
- [x] App.jsx: Card-based start screen, Badge HUD, SuccessPage with gradient + badge stats
- [x] InputOverlay: restyled with Card, Input, Label, Button; validation logic unchanged
- [x] Fixed server startup issues (`server/index.js`)
- [x] Added `client/src/assets/happy.gif`
- [x] Screen flashes red on death (implemented in `LoginPage.jsx` + `useSnakeGame.js`)
- [x] Background blobs maintained in-game (not just on login screen)

> **NOTE — Hooks previously in `client/src/game/` moved to `client/src/hooks/` during this refactor (`useGameLoop.js`, `useKeyboard.js`, `useTimer.js`, `useSnakeGame.js`). App entry is now `client/src/App.jsx` (not `src/game/App.jsx`).**

---

### Stage 7 — HUD & Completion Screen ✅
**Goal:** Persistent on-screen HUD; polished completion screen.

- [x] Timer — 120s countdown displayed in HUD, paused during input mode; penalised on bad input
- [x] Death counter displayed in HUD
- [x] Completion screen: personal time + death count + rank + leaderboard below
- [x] "Play Again" button resets all state
- [x] Death handling: snake resets to centre, uncaptured fields scatter, death counter increments, timer continues
- [x] Initial animation: fields start in form positions, then spiral/scatter to game positions (3s easing)
- [x] 3-2-1 countdown overlay before game restarts after death
- [x] Time's up: full-screen overlay, 1.5s delay, then restart (death counted)
- [x] Red screen flash on death (100ms)
- [x] Penalty flash on timer deduction (red HUD for 200-400ms) with "-Xs" label

**Additional features added during Stage 7 (beyond original spec):**
- `LandingPage.jsx` — marketing landing page at `/`, routes to `/signup`
- App routes: `/` → LandingPage, `/signup` → LoginPage, `/game` → GamePage, `/leaderboard` → LeaderboardPage
- `FireBorder.jsx` — animated clockwise fire trail around game board edges (spawned on game start)
- Pre-game form (LoginPage): card shakes on typing (intensity scales with completed fields), glitch flash effect (pixel-art overlay), only one field editable at a time
- Morph animation: form inputs cross-fade into game fields (1.8s CSS transition), followed by spiral scatter
- **Progressive password rules** (5 levels): ≥8 chars → uppercase → digit sum ≥25 → emoji → prime number
- Password field locked until Name+Email captured; flees aggressively (4 cells/tick) when locked + near
- Char-typed penalty: each character typed in input costs -1s and grows snake by 1 segment
- Failed validation penalty: -5s
- Leaderboard post-game: one-time display name edit; frame colour picker (single or dual-gradient for top 3)
- Top-3 leaderboard rows: rainbow name animation + dual-colour JS-animated gradient border
- `PATCH /api/submit/:id/name` and `PATCH /api/submit/:id/frame-color` endpoints added to server

---

### Stage 8 — Audio & Visual Polish
**Goal:** Sound effects and particle effects completing the game feel.

- [ ] Trigger all sounds on first `keydown` (satisfies autoplay policy) — `howler` installed but not integrated
- [ ] Sound effects:
  - [ ] Fields scatter (`boing` / `whoosh`) — on initial scatter and on death-reset scatter
  - [ ] Field captured (satisfying `pop` or `chomp`)
- [ ] Particle burst on field capture
- [ ] Verify: audio plays correctly, no autoplay errors in console

---

### Stage 9 — Deployment
**Goal:** Publicly accessible URL for demo; both client and server live.

- [ ] Choose deployment target: Railway or Render
- [ ] Configure build scripts:
  - [ ] `client`: `vite build` → `/client/dist`
  - [ ] `server`: serve `/client/dist` as static files in production (`express.static`)
- [ ] Set environment variables for production (port, any secrets)
- [ ] Push to GitHub; connect repo to Railway/Render
- [ ] Confirm `/api/submit`, `/api/leaderboard`, and `/leaderboard` route all work on production URL
- [ ] Test on a non-dev machine (performance check, audio check)
- [ ] Share public URL with team

---

## Stretch Goals (Post-MVP)

- [ ] Mobile support: on-screen D-pad or swipe controls
- [ ] Difficulty tiers: flee radius increases or snake speed increases after each capture
- [ ] Multiplayer: two players race using WebSockets
- [ ] Animated snake skin or per-field easter eggs (password field harder to catch)
- [ ] CAPTCHA parody: second form appears post-completion with faster fields

---

## Risk Register

---

## Coding Conventions

- Game engine code (`/client/src/game/`) must be **pure JS** — no React imports, no hooks, no JSX. This keeps the game loop fast and testable.
- React state updates from the game engine must go through **callbacks passed at mount time** — never direct state setters inside the engine.
- All grid positions are `{ col, row }` objects. Pixel conversion happens only in `draw.js`.
- Constants are defined once in `constants.js` and imported everywhere — no magic numbers in engine code.
- Commit after each stage is verified working.


