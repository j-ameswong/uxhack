// ============================================================
//  fields.js
//  Field entities that flee from the snake when within FLEE_RADIUS.
//  Pure JS — no React. Used by GameEngine.
// ============================================================

import { GRID_COLS, GRID_ROWS } from './constants.js'

/** Margin from grid edges — fields stay within this to remain catchable */
export const FIELD_MARGIN = 2

/** Default field size in grid cells (cols × rows) */
export const FIELD_WIDTH = 8
export const FIELD_HEIGHT = 5

/** Verify Password field is wider to fit the longer label */
const VERIFY_FIELD_WIDTH = 12
const VERIFY_FIELD_HEIGHT = 5

/**
 * Field — a form field entity on the grid that flees from the snake.
 * @property {number} col - Grid column (left edge)
 * @property {number} row - Grid row (top edge)
 * @property {string} label - Display label ("Name", "Email", "Password")
 * @property {number} width - Width in cells
 * @property {number} height - Height in cells
 */
/** Distance at which a locked field starts fleeing aggressively from the snake */
const LOCK_FLEE_RADIUS = 15

/** How many cells a locked field jumps per tick when the snake is near */
const LOCK_FLEE_SPEED = 4

export class Field {
  constructor({ col, row, label }) {
    this.col = col
    this.row = row
    this.label = label
    this.width = FIELD_WIDTH
    this.height = FIELD_HEIGHT
    this.captured = false  // Stage 4: set true when snake eats this field
    this.locked = false    // When true, field cannot be captured and flees aggressively
    // DVD screensaver bounce: random diagonal velocity
    this.dCol = Math.random() < 0.5 ? -1 : 1
    this.dRow = Math.random() < 0.5 ? -1 : 1
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
   * DVD screensaver bounce: move diagonally each tick, bounce off walls.
   * If `snakeHead` is provided and this field is locked, flee aggressively.
   */
  bounceStep(snakeHead, snakeBody) {
    if (this.captured) return

    const minCol = FIELD_MARGIN
    const maxCol = GRID_COLS - this.width - FIELD_MARGIN
    const minRow = FIELD_MARGIN
    const maxRow = GRID_ROWS - this.height - FIELD_MARGIN

    // Locked fields flee aggressively when snake is nearby
    if (this.locked && snakeHead) {
      const center = this.getCenter()
      const dx = center.col - snakeHead.col
      const dy = center.row - snakeHead.row
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < LOCK_FLEE_RADIUS && dist > 0) {
        // Flee along the vector away from the snake head
        const nx = dx / dist
        const ny = dy / dist
        const newCol = Math.max(minCol, Math.min(maxCol, Math.round(this.col + nx * LOCK_FLEE_SPEED)))
        const newRow = Math.max(minRow, Math.min(maxRow, Math.round(this.row + ny * LOCK_FLEE_SPEED)))
        this.col = newCol
        this.row = newRow
        return
      }
    }

    let newCol = this.col + this.dCol
    let newRow = this.row + this.dRow

    if (newCol <= minCol || newCol >= maxCol) {
      this.dCol *= -1
      newCol = Math.max(minCol, Math.min(maxCol, newCol))
    }
    if (newRow <= minRow || newRow >= maxRow) {
      this.dRow *= -1
      newRow = Math.max(minRow, Math.min(maxRow, newRow))
    }

    // Bounce off snake body (excluding head) like a wall
    if (snakeBody && snakeBody.length > 0) {
      const overlaps = snakeBody.some(seg =>
        seg.col >= newCol && seg.col < newCol + this.width &&
        seg.row >= newRow && seg.row < newRow + this.height
      )
      if (overlaps) {
        this.dCol *= -1
        this.dRow *= -1
        newCol = this.col
        newRow = this.row
      }
    }

    this.col = newCol
    this.row = newRow
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
  const f = new Field({ col, row, label: 'Verify Password' })
  f.width = VERIFY_FIELD_WIDTH
  f.height = VERIFY_FIELD_HEIGHT
  return f
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

    const field = new Field({ col, row, label })
    if (label === 'Password') field.locked = true
    fields.push(field)
  }

  return fields
}

/**
 * Create three fields at form-like positions — centered and stacked vertically,
 * mimicking the login form layout. Used as starting positions for the scatter animation.
 */
export function createFormPositionFields() {
  const centerCol = Math.floor(GRID_COLS / 2) - Math.floor(FIELD_WIDTH / 2)
  const centerRow = Math.floor(GRID_ROWS / 2)
  const spacing = 3 // vertical spacing between fields in grid cells

  const labels = ['Name', 'Email', 'Password']
  return labels.map((label, i) => {
    const row = centerRow - spacing + (i * spacing)
    const field = new Field({ col: centerCol, row, label })
    if (label === 'Password') field.locked = true
    return field
  })
}

/**
 * Generate well-spaced random target positions for the given fields.
 * Returns an array of { col, row } objects (one per field).
 * Positions are far from each other and from the grid centre (snake spawn).
 */
export function generateSpacedPositions(fields) {
  const centerCol = Math.floor(GRID_COLS / 2)
  const centerRow = Math.floor(GRID_ROWS / 2)
  const avoidRadius = 18
  const minFieldDist = 15
  const positions = []

  for (const field of fields) {
    if (field.captured) {
      positions.push({ col: field.col, row: field.row })
      continue
    }

    const fw = field.width
    const fh = field.height
    let col, row
    let attempts = 0

    do {
      col = FIELD_MARGIN + Math.floor(Math.random() * (GRID_COLS - 2 * FIELD_MARGIN - fw))
      row = FIELD_MARGIN + Math.floor(Math.random() * (GRID_ROWS - 2 * FIELD_MARGIN - fh))
      attempts++
      if (attempts > 200) break

      const cx = col + fw / 2
      const cy = row + fh / 2

      // Avoid snake spawn area
      if (Math.sqrt((cx - centerCol) ** 2 + (cy - centerRow) ** 2) < avoidRadius) continue

      // Ensure minimum distance from already-placed fields
      let tooClose = false
      for (const prev of positions) {
        const px = prev.col + fw / 2
        const py = prev.row + fh / 2
        if (Math.sqrt((cx - px) ** 2 + (cy - py) ** 2) < minFieldDist) {
          tooClose = true
          break
        }
      }
      if (tooClose) continue

      break
    } while (true)

    positions.push({ col, row })
  }

  return positions
}

/**
 * Scatter existing fields to new random positions (modifies in place).
 * Avoids the center where the snake spawns.
 */
export function scatterFieldsToRandom(fields) {
  const centerCol = Math.floor(GRID_COLS / 2)
  const centerRow = Math.floor(GRID_ROWS / 2)
  const avoidRadius = 6

  for (const field of fields) {
    if (field.captured) continue
    let col, row
    let attempts = 0
    do {
      col = FIELD_MARGIN + Math.floor(Math.random() * (GRID_COLS - 2 * FIELD_MARGIN - FIELD_WIDTH))
      row = FIELD_MARGIN + Math.floor(Math.random() * (GRID_ROWS - 2 * FIELD_MARGIN - FIELD_HEIGHT))
      attempts++
      if (attempts > 50) break
    } while (
      Math.abs(col + FIELD_WIDTH / 2 - centerCol) < avoidRadius &&
      Math.abs(row + FIELD_HEIGHT / 2 - centerRow) < avoidRadius
    )
    field.col = col
    field.row = row
  }
}
