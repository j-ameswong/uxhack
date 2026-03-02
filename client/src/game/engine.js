import { GRID_COLS, GRID_ROWS, TICK_RATE_MS, TICK_RATE_INCREASE_MS } from './constants.js';
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

  /** Reset snake position only — fields and captured state are preserved.
   *  Used on death so the player doesn't lose progress on already-captured fields. */
  _resetSnakeOnly() {
    const centreCol = Math.floor(GRID_COLS / 2);
    const centreRow = Math.floor(GRID_ROWS / 2);
    this.snake = [
      { col: centreCol - 2, row: centreRow },
      { col: centreCol - 1, row: centreRow },
      { col: centreCol, row: centreRow },
    ];
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

  /** Add a labelled segment at the tail and mark it as permanent growth. */
  growTail(char) {
    const tail = this.snake[0];
    let newSeg;
    if (this.snake.length >= 2) {
      const next = this.snake[1];
      newSeg = { col: tail.col - (next.col - tail.col), row: tail.row - (next.row - tail.row), char };
    } else {
      newSeg = { col: tail.col - 1, row: tail.row, char };
    }
    this.snake.unshift(newSeg);
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
