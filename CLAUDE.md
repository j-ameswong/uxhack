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
│   │   ├── game/          # Pure game engine — snake loop, collision, field AI
│   │   ├── components/    # HUD, leaderboard modal, input capture overlay
│   │   └── hooks/         # useGameLoop, useKeyboard
│   └── vite.config.js     # Proxy: /api -> localhost:3001
├── server/
│   ├── routes/
│   │   ├── submissions.js # POST /api/submit
│   │   └── leaderboard.js # GET /api/leaderboard
│   └── db.js              # SQLite connection and schema init
└── CLAUDE.md
```

---

## API Contract

### `POST /api/submit`
- **Body:** `{ name, email, timeMs, deaths }`
- **Success:** `201` → `{ rank, id }`
- **Failure:** `400` on invalid input

### `GET /api/leaderboard`
- **Response:** `[{ rank, name, timeMs, deaths, createdAt }]` (top 10, sorted by `timeMs` ASC, then `deaths` ASC)
- No authentication required.

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

| Constant | Default | Description |
|---|---|---|
| `TICK_RATE_MS` | 150 | Milliseconds per snake tick |
| `TICK_RATE_INCREASE_MS` | 45 | Speed increase per captured field (floored at 50 ms/tick) |
| `FLEE_RADIUS` | 8 | Grid cells — flee AI activation distance |
| `GRID_COLS` | 40 | Logical grid width |
| `GRID_ROWS` | 30 | Logical grid height |
| `SCATTER_DELAY_MS` | 1500 | Delay before fields scatter on load |

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

### Stage 5 — Submit Flow & Backend Storage
**Goal:** All three fields captured → Submit button → POST to server → rank returned.

- [ ] After third field confirmed, show Submit button (or auto-submit on Enter)
- [ ] On submit: collect `{ name, email, timeMs, deaths }`, POST to `POST /api/submit`
- [ ] **Server — `server/db.js`:**
  - [ ] Open SQLite database (`./data/snakeup.db`)
  - [ ] `CREATE TABLE IF NOT EXISTS submissions (...)` on startup
- [ ] **Server — `server/routes/submissions.js`:**
  - [ ] Validate all fields (400 on failure)
  - [ ] SHA-256 hash the email before storage (`crypto.createHash('sha256')`)
  - [ ] Insert row into `submissions`
  - [ ] Query rank: count rows with `time_ms < submitted`, or `time_ms = submitted AND deaths < submitted`
  - [ ] Return `{ rank, id }` with status `201`
- [ ] Client: on `201`, store rank in context, navigate to completion screen
- [ ] Client: on error, show friendly message and preserve form values client-side
- [ ] Verify: submission inserts to DB, rank is accurate

---

### Stage 6 — Leaderboard Endpoint & Modal
**Goal:** Top-10 leaderboard accessible on completion screen and at `/leaderboard` route.

- [ ] **Server — `server/routes/leaderboard.js`:**
  - [ ] `GET /api/leaderboard` returns top 10 rows ordered `time_ms ASC, deaths ASC`
  - [ ] Add `rank` field to each row in response
- [ ] **Client — `client/src/components/LeaderboardModal.jsx`:**
  - [ ] `GET /api/leaderboard` on mount
  - [ ] Render ranked table: `rank | name | time | deaths`
  - [ ] Highlight the current user's row (matched by `id` from submit response)
  - [ ] Show user's own rank even if not in top 10 (append below table with separator)
- [ ] **Client — `/leaderboard` route:**
  - [ ] Standalone page rendering `<LeaderboardModal>` without playing the game
  - [ ] Use React Router (or Vite file-based routing) for `/leaderboard`
- [ ] Verify: leaderboard populates correctly, current user highlighted, `/leaderboard` route works standalone

---

### Stage 7 — HUD & Completion Screen
**Goal:** Persistent on-screen HUD; polished completion screen.

- [ ] **`client/src/components/HUD.jsx`:**
  - [ ] Timer (elapsed `mm:ss.ms` since game start, paused during input mode)
  - [ ] Death counter
  - [ ] Fields remaining indicator (e.g. `Fields: 2 / 3`)
- [ ] **Completion Screen:**
  - [ ] Display personal time and death count
  - [ ] Display rank (e.g. `#3 of 47`)
  - [ ] Render `<LeaderboardModal>` below
  - [ ] "Play Again" button resets all state
- [ ] Death handling: snake resets to centre, all uncaptured fields scatter to new random positions, death counter increments, timer continues running
- [ ] Initial scatter: 1.5s delay on first load, fields scatter with animation, instruction text appears briefly
- [ ] Verify: HUD updates live, death resets correct, completion screen renders full data

---

### Stage 8 — Audio & Visual Polish
**Goal:** Sound effects and particle effects completing the game feel.

- [ ] Install and configure `howler.js` in client
- [ ] Trigger all sounds on first `keydown` (satisfies autoplay policy)
- [ ] Sound effects:
  - [ ] Fields scatter (`boing` / `whoosh`) — on initial scatter and on death-reset scatter
  - [ ] Field captured (satisfying `pop` or `chomp`)
- [ ] Particle burst on field capture (canvas-drawn; simple radial dots expanding outward)
- [ ] Snake smooth movement: CSS transition or canvas interpolation between grid cells
- [ ] Verify: audio plays correctly, no autoplay errors in console, particles render on capture

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

| Risk | Mitigation |
|---|---|
| Canvas performance on low-end hardware | Keep grid ≤ 40×30. Avoid expensive draw ops. Test early on non-dev machine. |
| Arrow keys scroll the page | `event.preventDefault()` on arrow keys when game active; re-enable on blur |
| Autoplay audio blocked | Trigger all audio on first `keydown`, not page load. Howler handles the policy. |
| CORS issues (dev) | `express cors()` from day one; Vite proxy `/api → localhost:3001` in dev |
| Email storage / GDPR | SHA-256 hash only — raw email never persisted. Mention openly to judges. |
| Time pressure | Build canvas engine first. Leaderboard (only true full-stack req) can be added last. |

---

## Coding Conventions

- Game engine code (`/client/src/game/`) must be **pure JS** — no React imports, no hooks, no JSX. This keeps the game loop fast and testable.
- React state updates from the game engine must go through **callbacks passed at mount time** — never direct state setters inside the engine.
- All grid positions are `{ col, row }` objects. Pixel conversion happens only in `draw.js`.
- Constants are defined once in `constants.js` and imported everywhere — no magic numbers in engine code.
- Commit after each stage is verified working.
