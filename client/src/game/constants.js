// ============================================================
//  SnakeUp — Game Constants
//  All configurable values live here. No magic numbers elsewhere.
// ============================================================

export const GRID_COLS       = 40      // logical grid width
export const GRID_ROWS       = 30      // logical grid height

export const TICK_RATE_MS    = 150     // ms per snake tick
export const FLEE_RADIUS     = 8      // cells — flee AI activation distance
export const SCATTER_DELAY_MS = 1500  // ms before fields scatter on load

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

// Colours (used in draw.js)
export const COLORS = {
  BACKGROUND:    '#0a0a0a',
  GRID_LINE:     '#111111',
  SNAKE_HEAD:    '#39ff14',   // neon green
  SNAKE_BODY:    '#1a7a06',
  SNAKE_OUTLINE: '#0d3d03',
  DEATH_FLASH:   '#ff2222',
  FIELD_BG:      '#1a1a2e',
  FIELD_BORDER:  '#4a4af0',
  FIELD_TEXT:    '#a0a0ff',
  FIELD_LABEL:   '#ffffff',
  HUD_TEXT:      '#39ff14',
}