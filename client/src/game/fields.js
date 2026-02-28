// ============================================================
//  fields.js
//  Field entities that flee from the snake when within FLEE_RADIUS.
//  Pure JS — no React. Used by GameEngine.
// ============================================================

import { GRID_COLS, GRID_ROWS, FLEE_RADIUS } from './constants.js'

/** Margin from grid edges — fields stay within this to remain catchable */
const FIELD_MARGIN = 2

/** Default field size in grid cells (cols × rows) */
const FIELD_WIDTH = 4
const FIELD_HEIGHT = 1.5

/**
 * Field — a form field entity on the grid that flees from the snake.
 * @property {number} col - Grid column (left edge)
 * @property {number} row - Grid row (top edge)
 * @property {string} label - Display label ("Name", "Email", "Password")
 * @property {number} width - Width in cells
 * @property {number} height - Height in cells
 */
export class Field {
  constructor({ col, row, label }) {
    this.col = col
    this.row = row
    this.label = label
    this.width = FIELD_WIDTH
    this.height = FIELD_HEIGHT
    this.captured = false  // Stage 4: set true when snake eats this field
  }

  /**
   * Get the center of the field in grid coordinates (for distance calc).
   */
  getCenter() {
    return {
      col: this.col + this.width / 2,
      row: this.row + this.height / 2,
    }
  }

  /**
   * Chebyshev distance (max of col/row diff) — appropriate for grid movement.
   */
  _distanceTo(headPos) {
    const center = this.getCenter()
    return Math.max(
      Math.abs(headPos.col - center.col),
      Math.abs(headPos.row - center.row)
    )
  }

  /**
   * Move one cell away from snake head if within FLEE_RADIUS.
   * Uses dominant axis: move along the axis where the snake is furthest.
   * Clamps to grid bounds with FIELD_MARGIN.
   * @param {{ col: number, row: number }} snakeHeadPos - Snake head grid position
   */
  fleeStep(snakeHeadPos) {
    if (this.captured) return  // Don't flee when already captured
    const dist = this._distanceTo(snakeHeadPos)
    if (dist > FLEE_RADIUS) return

    const center = this.getCenter()
    const dCol = snakeHeadPos.col - center.col
    const dRow = snakeHeadPos.row - center.row

    // Dominant axis: move along the axis with larger absolute difference
    const moveCol = Math.abs(dCol) >= Math.abs(dRow)
    let newCol = this.col
    let newRow = this.row

    if (moveCol) {
      // Move horizontally away from snake
      newCol = dCol > 0 ? this.col - 1 : this.col + 1
    } else {
      // Move vertically away from snake
      newRow = dRow > 0 ? this.row - 1 : this.row + 1
    }

    // Clamp to grid bounds with margin (keep fields catchable)
    this.col = Math.max(FIELD_MARGIN, Math.min(GRID_COLS - this.width - FIELD_MARGIN, newCol))
    this.row = Math.max(FIELD_MARGIN, Math.min(GRID_ROWS - this.height - FIELD_MARGIN, newRow))
  }

  /**
   * If this field overlaps `other`, nudge this field one cell away along the
   * dominant axis. Called after fleeStep so stacked fields separate over time.
   * @param {Field} other
   */
  separateFrom(other) {
    if (this.captured || other.captured) return
    const noOverlap =
      this.col >= other.col + other.width ||
      this.col + this.width <= other.col ||
      this.row >= other.row + other.height ||
      this.row + this.height <= other.row
    if (noOverlap) return

    const dCol = this.getCenter().col - other.getCenter().col
    const dRow = this.getCenter().row - other.getCenter().row

    let newCol = this.col
    let newRow = this.row

    if (Math.abs(dCol) >= Math.abs(dRow)) {
      // Separate horizontally; if perfectly aligned default to moving right
      newCol = dCol >= 0 ? this.col + 1 : this.col - 1
    } else {
      newRow = dRow >= 0 ? this.row + 1 : this.row - 1
    }

    this.col = Math.max(FIELD_MARGIN, Math.min(GRID_COLS - this.width - FIELD_MARGIN, newCol))
    this.row = Math.max(FIELD_MARGIN, Math.min(GRID_ROWS - this.height - FIELD_MARGIN, newRow))
  }

  /**
   * Get the grid rect for collision/drawing: { col, row, width, height }
   */
  getRect() {
    return {
      col: this.col,
      row: this.row,
      width: this.width,
      height: this.height,
    }
  }
}

/**
 * Create the bonus "Verify Password" field at a random position.
 * Called after all three initial fields are captured and confirmed.
 */
export function createVerifyField() {
  const centerCol = Math.floor(GRID_COLS / 2)
  const centerRow = Math.floor(GRID_ROWS / 2)
  const avoidRadius = 6
  let col, row, attempts = 0
  do {
    col = FIELD_MARGIN + Math.floor(Math.random() * (GRID_COLS - 2 * FIELD_MARGIN - FIELD_WIDTH))
    row = FIELD_MARGIN + Math.floor(Math.random() * (GRID_ROWS - 2 * FIELD_MARGIN - FIELD_HEIGHT))
    attempts++
    if (attempts > 50) break
  } while (
    Math.abs(col + FIELD_WIDTH / 2 - centerCol) < avoidRadius &&
    Math.abs(row + FIELD_HEIGHT / 2 - centerRow) < avoidRadius
  )
  return new Field({ col, row, label: 'Verify Password' })
}

/**
 * Create three fields with random positions, avoiding the center (snake spawn).
 */
export function createInitialFields() {
  const centerCol = Math.floor(GRID_COLS / 2)
  const centerRow = Math.floor(GRID_ROWS / 2)
  const avoidRadius = 6 // Don't spawn on/near snake

  const labels = ['Name', 'Email', 'Password']
  const fields = []

  for (const label of labels) {
    let col, row
    let attempts = 0
    do {
      col = FIELD_MARGIN + Math.floor(Math.random() * (GRID_COLS - 2 * FIELD_MARGIN - FIELD_WIDTH))
      row = FIELD_MARGIN + Math.floor(Math.random() * (GRID_ROWS - 2 * FIELD_MARGIN - FIELD_HEIGHT))
      attempts++
      if (attempts > 50) break // Fallback if RNG is unlucky
    } while (
      Math.abs(col + FIELD_WIDTH / 2 - centerCol) < avoidRadius &&
      Math.abs(row + FIELD_HEIGHT / 2 - centerRow) < avoidRadius
    )

    fields.push(new Field({ col, row, label }))
  }

  return fields
}
