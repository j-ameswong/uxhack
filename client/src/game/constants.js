// ============================================================
//  SnakeUp — Game Constants
//  All configurable values live here. No magic numbers elsewhere.
// ============================================================

export const GRID_COLS       = 100      // logical grid width
export const GRID_ROWS       = 75      // logical grid height

export const TICK_RATE_MS    = 40     // ms per snake tick (initial)
export const TICK_RATE_INCREASE_MS = 10 // ms faster per captured field

// Verify-password phase — fixed speed, faster than normal
export const VERIFY_TICK_RATE_MS = 20
export const SCATTER_DELAY_MS = 3000  // ms total shuffle duration before game starts

// Visual
export const CELL_PADDING    = 1      // px gap between cells when drawing

// Snake start
export const SNAKE_START_COL = Math.floor(GRID_COLS / 2)
export const SNAKE_START_ROW = Math.floor(GRID_ROWS / 2)
export const SNAKE_START_LENGTH = 3

// Directions (unit vectors)
export const DIR = {
  UP:    { col:  0, row: -1 },
  DOWN:  { col:  0, row:  1 },
  LEFT:  { col: -1, row:  0 },
  RIGHT: { col:  1, row:  0 },
}

