// ============================================================
//  SnakeUp — GameEngine
//  Pure JS class. No React imports. No hooks. No JSX.
//  Communicates with React exclusively through callbacks.
// ============================================================

import {
  GRID_COLS,
  GRID_ROWS,
  TICK_RATE_MS,
  SNAKE_START_COL,
  SNAKE_START_ROW,
  SNAKE_START_LENGTH,
  DIR,
} from './constants.js'

// ── Helpers ──────────────────────────────────────────────────

function makeStartSnake() {
  // Snake starts horizontal, moving RIGHT
  // Head is at centre; body trails to the left
  const segments = []
  for (let i = 0; i < SNAKE_START_LENGTH; i++) {
    segments.push({ col: SNAKE_START_COL - i, row: SNAKE_START_ROW })
  }
  return segments  // segments[0] = head
}

function areOpposite(a, b) {
  return a.col + b.col === 0 && a.row + b.row === 0
}

// ── GameEngine class ─────────────────────────────────────────

export class GameEngine {
  constructor(callbacks = {}) {
    // Callbacks wired from React at mount time
    this.onDeath     = callbacks.onDeath     || (() => {})
    this.onTick      = callbacks.onTick      || (() => {})  // called each tick with state snapshot
    this.onGrow      = callbacks.onGrow      || (() => {})  // placeholder for field capture later

    this._intervalId = null
    this._state      = null

    this._initState()
  }

  // ── Public API ────────────────────────────────────────────

  start() {
    if (this._intervalId !== null) return  // already running
    this._intervalId = setInterval(() => this._tick(), TICK_RATE_MS)
  }

  stop() {
    if (this._intervalId === null) return
    clearInterval(this._intervalId)
    this._intervalId = null
  }

  /** Pause without resetting state (used during field capture) */
  pause() {
    this.stop()
    this._state.paused = true
  }

  /** Resume from pause */
  resume() {
    this._state.paused = false
    this.start()
  }

  /** Full reset — snake returns to centre */
  reset() {
    this.stop()
    this._initState()
  }

  /** Feed a new direction from keyboard input */
  enqueueDirection(dir) {
    const queue = this._state.directionQueue
    // Use last queued direction (or current) as reference to prevent reversals
    const last = queue.length > 0 ? queue[queue.length - 1] : this._state.direction

    if (!areOpposite(dir, last)) {
      // Limit queue to 2 to avoid "buffered" over-turns
      if (queue.length < 2) {
        queue.push(dir)
      }
    }
  }

  /** Read-only snapshot of current state for drawing */
  getState() {
    return this._state
  }

  /** Grow snake by one segment (called on field capture) */
  grow() {
    this._state.pendingGrowth += 1
    this.onGrow()
  }

  // ── Internal ──────────────────────────────────────────────

  _initState() {
    this._state = {
      snake:          makeStartSnake(),
      direction:      { ...DIR.RIGHT },
      directionQueue: [],
      fields:         [],   // populated in Stage 3
      pendingGrowth:  0,
      isDead:         false,
      paused:         false,
      deathFlash:     0,    // ticks remaining for red flash
    }
  }

  _tick() {
    const s = this._state
    if (s.paused || s.isDead) return

    // ── 1. Consume direction queue ──────────────────────────
    if (s.directionQueue.length > 0) {
      s.direction = s.directionQueue.shift()
    }

    // ── 2. Calculate next head position ─────────────────────
    const head    = s.snake[0]
    const nextHead = {
      col: head.col + s.direction.col,
      row: head.row + s.direction.row,
    }

    // ── 3. Wall collision ────────────────────────────────────
    if (
      nextHead.col < 0 || nextHead.col >= GRID_COLS ||
      nextHead.row < 0 || nextHead.row >= GRID_ROWS
    ) {
      this._die()
      return
    }

    // ── 4. Self collision ────────────────────────────────────
    //    Check all segments except the tail (tail will vacate this tick)
    const checkLength = s.pendingGrowth > 0
      ? s.snake.length          // growing: tail stays, check all
      : s.snake.length - 1      // not growing: tail moves, skip it

    for (let i = 0; i < checkLength; i++) {
      if (s.snake[i].col === nextHead.col && s.snake[i].row === nextHead.row) {
        this._die()
        return
      }
    }

    // ── 5. Move snake ────────────────────────────────────────
    s.snake.unshift(nextHead)  // add new head

    if (s.pendingGrowth > 0) {
      s.pendingGrowth -= 1     // keep tail (snake grows)
    } else {
      s.snake.pop()            // remove tail
    }

    // ── 6. Field flee AI (stubbed — Stage 3 fills this) ─────
    for (const field of s.fields) {
      if (typeof field.fleeStep === 'function') {
        field.fleeStep(nextHead)
      }
    }

    // ── 7. Field capture check (stubbed — Stage 4) ──────────
    // ...

    // ── 8. Notify React of new state ────────────────────────
    this.onTick({ ...s, snake: [...s.snake] })
  }

  _die() {
    const s = this._state
    s.isDead      = true
    s.deathFlash  = 4
    this.stop()
    this.onDeath()
  }
}
