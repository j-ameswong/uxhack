import { GRID_COLS, GRID_ROWS } from './constants.js';
import { createInitialFields } from './fields.js';

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
  constructor({ onDeath }) {
    this.onDeath = onDeath ?? (() => {});
    this.snake = [];
    this.direction = 'right';
    this.nextDirection = null;
    this.intervalId = null;
    this.tickCount = 0;
    this.fields = createInitialFields();
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
    // Scatter fields to new random positions on death (Stage 3+)
    this.fields = createInitialFields();
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
    return (
      head.col < 0 ||
      head.col >= GRID_COLS ||
      head.row < 0 ||
      head.row >= GRID_ROWS
    );
  }

  _isSelfCollision(head) {
    return this.snake.some(
      (seg) => seg.col === head.col && seg.row === head.row
    );
  }

  tick(ctx, width, height) {
    this._applyQueuedDirection();
    const newHead = this._advanceHead();

    if (this._isWallCollision(newHead) || this._isSelfCollision(newHead)) {
      this.onDeath();
      this._resetSnake();
      return { snake: [...this.snake], fields: this.fields, gameOver: true };
    }

    this.snake.push(newHead);
    this.tickCount += 1;

    // Only grow when consuming a field (Stage 4). Until then, always remove tail.
    const consumed = false; // TODO: set true on field capture
    if (!consumed) {
      this.snake.shift();
    }

    // Flee AI: each field moves away from snake head if within FLEE_RADIUS
    const head = this.snake[this.snake.length - 1];
    for (const field of this.fields) {
      field.fleeStep(head);
    }

    return { snake: [...this.snake], fields: this.fields, gameOver: false };
  }

  getState() {
    return { snake: [...this.snake], direction: this.direction, fields: this.fields };
  }

  getDimensions() {
    if (!this._ctx) return { width: 0, height: 0 };
    return { width: this._ctx.canvas.width, height: this._ctx.canvas.height };
  }

  start(ctx, getDimensions, draw, tickRateMs) {
    if (this.intervalId) return;
    this._ctx = ctx;
    this._draw = draw;
    const getSize = getDimensions ?? (() => this.getDimensions());
    const tick = () => {
      const { width, height } = getSize();
      const result = this.tick(ctx, width, height);
      draw(ctx, result, width, height);
    };
    tick();
    this.intervalId = setInterval(tick, tickRateMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
