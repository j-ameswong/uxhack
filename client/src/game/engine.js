import { GRID_COLS, GRID_ROWS, TICK_RATE_MS, TICK_RATE_INCREASE_MS } from './constants.js';

// ---------------------------------------------------------------------------
// Inner perimeter — one cell inside the fire border, clockwise order.
// Used so growTail() can wrap char segments around the border instead of
// placing them off-map.
//   Top:    row=1,            col 1 → GRID_COLS-2
//   Right:  col=GRID_COLS-2,  row 2 → GRID_ROWS-2
//   Bottom: row=GRID_ROWS-2,  col GRID_COLS-3 → 1
//   Left:   col=1,            row GRID_ROWS-3 → 2
// ---------------------------------------------------------------------------
const INNER_PERIMETER = (() => {
  const cells = [];
  const maxC = GRID_COLS - 2, maxR = GRID_ROWS - 2;
  for (let c = 1;      c <= maxC; c++) cells.push({ col: c,    row: 1    }); // top
  for (let r = 2;      r <= maxR; r++) cells.push({ col: maxC, row: r    }); // right
  for (let c = maxC-1; c >= 1;   c--) cells.push({ col: c,    row: maxR }); // bottom
  for (let r = maxR-1; r >= 2;   r--) cells.push({ col: 1,    row: r    }); // left
  return cells;
})();

// O(1) lookup: "col,row" → index in INNER_PERIMETER
const INNER_PERIM_IDX = new Map(
  INNER_PERIMETER.map((p, i) => [`${p.col},${p.row}`, i])
);
import { createInitialFields, createFormPositionFields, scatterFieldsToRandom, createVerifyField } from './fields.js';

const DIRECTIONS = {
  up: { col: 0, row: -1 },
  down: { col: 0, row: 1 },
  left: { col: -1, row: 0 },
  right: { col: 1, row: 0 },
};

const OPPOSITES = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export class GameEngine {
  constructor({ onDeath, onFieldCaptured, onTick }) {
    this.onDeath = onDeath ?? (() => {});
    this.onFieldCaptured = onFieldCaptured ?? (() => {});
    this.onTick = onTick ?? (() => {});
    this.snake = [];
    this.direction = 'right';
    this.nextDirection = null;
    this.intervalId = null;
    this.tickCount = 0;
    this.capturedCount = 0;
    this.tickRateMs = TICK_RATE_MS;
    this.pendingGrowth = 0;
    this.fields = createFormPositionFields();
    this._resetSnake();
  }

  _resetSnake() {
    const centreCol = Math.floor(GRID_COLS / 2);
    const centreRow = Math.floor(GRID_ROWS / 2);
    this.snake = [
      { col: centreCol - 2, row: centreRow },
      { col: centreCol - 1, row: centreRow },
      { col: centreCol, row: centreRow },
    ];
    this.direction = 'right';
    this.nextDirection = null;
    this.capturedCount = 0;
    this.pendingGrowth = 0;
    this.tickRateMs = TICK_RATE_MS;
    // Full reset: recreate all fields
    this.fields = createInitialFields();
  }

  /** Reset snake position only — fields, captured state, and typed-char tail
   *  segments are preserved.  Used on death; full wipe happens in _resetSnake(). */
  _resetSnakeOnly() {
    const centreCol = Math.floor(GRID_COLS / 2);
    const centreRow = Math.floor(GRID_ROWS / 2);

    // Rescue char segments from the old snake so the penalty tail survives death.
    const charSegs = this.snake.filter(s => s.char);
    const L = Math.max(3, this.snake.length);

    // Rebuild a horizontal snake of the same length at center:
    //   index 0 (tail) … charCount-1 : preserved char segments
    //   charCount … L-1              : plain body segments + head
    const newSnake = [];
    for (let i = 0; i < L; i++) {
      const col = centreCol - L + 1 + i;
      newSnake.push(
        i < charSegs.length
          ? { col, row: centreRow, char: charSegs[i].char }
          : { col, row: centreRow }
      );
    }

    this.snake = newSnake;
    this.direction = 'right';
    this.nextDirection = null;
    this.pendingGrowth = 0;
    // Recalculate capturedCount and tick rate from surviving captured fields
    this.capturedCount = this.fields.filter(f => f.captured).length;
    this.tickRateMs = Math.max(20, TICK_RATE_MS - this.capturedCount * TICK_RATE_INCREASE_MS);
  }

  setDirection(dir) {
    if (dir && dir !== this.direction && dir !== OPPOSITES[this.direction]) {
      this.nextDirection = dir;
    }
  }

  _applyQueuedDirection() {
    if (this.nextDirection) {
      this.direction = this.nextDirection;
      this.nextDirection = null;
    }
  }

  _advanceHead() {
    const delta = DIRECTIONS[this.direction];
    const head = this.snake[this.snake.length - 1];
    return {
      col: head.col + delta.col,
      row: head.row + delta.row,
    };
  }

  _isWallCollision(head) {
    // Die one cell inward from the edge (the fire border occupies row/col 0
    // and the last row/col)
    return (
      head.col < 1 ||
      head.col >= GRID_COLS - 1 ||
      head.row < 1 ||
      head.row >= GRID_ROWS - 1
    );
  }

  _isSelfCollision(head) {
    return this.snake.some(
      (seg) => seg.col === head.col && seg.row === head.row
    );
  }

  /** Check if head overlaps any uncaptured, unlocked field's grid rect */
  _getCapturedField(head) {
    for (const field of this.fields) {
      if (field.captured || field.locked) continue;
      const r = field.getRect();
      const inCol = head.col >= r.col && head.col < r.col + r.width;
      const inRow = head.row >= r.row && head.row < r.row + r.height;
      if (inCol && inRow) return field;
    }
    return null;
  }

  tick() {
    this._applyQueuedDirection();
    const newHead = this._advanceHead();

    if (this._isWallCollision(newHead) || this._isSelfCollision(newHead)) {
      this.stop(); // Stop engine immediately — countdown will restart it
      this.onDeath();
      this._resetSnakeOnly(); // Preserve captured fields; only reset snake position
      const state = { snake: [...this.snake], fields: this.fields, gameOver: true };
      this.onTick(state);
      return state;
    }

    this.snake.push(newHead);
    this.tickCount += 1;

    const head = this.snake[this.snake.length - 1];
    const capturedField = this._getCapturedField(head);

    if (capturedField) {
      // Stage 4: capture field, grow snake, trigger callback, pause
      capturedField.captured = true;
      this.capturedCount += 1;
      this.tickRateMs = Math.max(20, TICK_RATE_MS - this.capturedCount * TICK_RATE_INCREASE_MS);
      this.onFieldCaptured(capturedField);
      this.stop(); // Pause game loop — resume when user confirms input
    } else if (this.pendingGrowth > 0) {
      // Don't remove tail — absorb one pending growth segment
      this.pendingGrowth -= 1;
    } else {
      // Count leading char segments at the tail (index 0…charCount-1).
      // They are permanent — slither them forward instead of shifting them off.
      let charCount = 0;
      while (charCount < this.snake.length && this.snake[charCount].char) {
        charCount++;
      }

      if (charCount === 0 || charCount >= this.snake.length) {
        // No char segments at tail — normal removal.
        this.snake.shift();
      } else {
        // Ripple each char segment into the position of the one ahead of it,
        // then remove the first non-char segment (at index charCount).
        for (let i = 0; i < charCount - 1; i++) {
          this.snake[i].col = this.snake[i + 1].col;
          this.snake[i].row = this.snake[i + 1].row;
        }
        this.snake[charCount - 1].col = this.snake[charCount].col;
        this.snake[charCount - 1].row = this.snake[charCount].row;
        this.snake.splice(charCount, 1);
      }
    }

    // DVD bounce: fields drift diagonally and bounce off walls and snake body
    const snakeHead = this.snake[this.snake.length - 1];
    const snakeBody = this.snake.slice(0, -1); // everything except the head
    for (const field of this.fields) {
      field.bounceStep(snakeHead, snakeBody);
    }

    // Separation pass: nudge any two overlapping fields apart
    for (let i = 0; i < this.fields.length; i++) {
      for (let j = i + 1; j < this.fields.length; j++) {
        this.fields[i].separateFrom(this.fields[j]);
        this.fields[j].separateFrom(this.fields[i]);
      }
    }

    const state = { snake: [...this.snake], fields: this.fields, gameOver: false };
    this.onTick(state);
    return state;
  }

  /** Scatter fields to random positions (for scatter animation). */
  scatterFields() {
    scatterFieldsToRandom(this.fields)
    this.onTick({ snake: [...this.snake], fields: this.fields, gameOver: false })
  }

  /** Spawn the verify-password field after all 3 main fields are confirmed. */
  spawnVerifyField() {
    this.fields.push(createVerifyField())
  }

  /** Add a labelled segment at the tail and mark it as permanent growth.
   *  If the extrapolated position would leave the playable area, the segment
   *  wraps clockwise along the inner border instead of going off-map. */
  growTail(char) {
    const tail = this.snake[0];
    let newCol, newRow;
    if (this.snake.length >= 2) {
      const next = this.snake[1];
      newCol = tail.col * 2 - next.col;
      newRow = tail.row * 2 - next.row;
    } else {
      newCol = tail.col - 1;
      newRow = tail.row;
    }

    // If the computed position is outside the playable area, wrap clockwise
    // along the inner border (one cell inside the fire border).
    if (newCol < 1 || newCol > GRID_COLS - 2 || newRow < 1 || newRow > GRID_ROWS - 2) {
      const idx = INNER_PERIM_IDX.get(`${tail.col},${tail.row}`);
      if (idx !== undefined) {
        const next = INNER_PERIMETER[(idx + 1) % INNER_PERIMETER.length];
        newCol = next.col;
        newRow = next.row;
      } else {
        // Fallback: clamp (shouldn't normally be reached)
        newCol = Math.max(1, Math.min(GRID_COLS - 2, newCol));
        newRow = Math.max(1, Math.min(GRID_ROWS - 2, newRow));
      }
    }

    this.snake.unshift({ col: newCol, row: newRow, char });
    this.pendingGrowth += 1;
    this.onTick({ snake: [...this.snake], fields: this.fields, gameOver: false });
  }

  getState() {
    return { snake: [...this.snake], direction: this.direction, fields: this.fields };
  }

  start(tickRateMs) {
    if (this.intervalId) return;
    const rate = tickRateMs ?? this.tickRateMs;
    const tick = () => this.tick();
    tick();
    this.intervalId = setInterval(tick, rate);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
