// ============================================================
//  SnakeUp — draw.js
//  Pure function: (ctx, state, canvas) → paints one frame.
//  No side effects beyond mutating the canvas context.
// ============================================================

import {
  GRID_COLS,
  GRID_ROWS,
  CELL_PADDING,
  COLORS,
} from './constants.js'

// ── Cell geometry helpers ─────────────────────────────────────

export function getCellSize(canvas) {
  return {
    w: canvas.width  / GRID_COLS,
    h: canvas.height / GRID_ROWS,
  }
}

export function cellToPixel(col, row, cellW, cellH) {
  return {
    x: col * cellW,
    y: row * cellH,
  }
}

// ── Main draw function ────────────────────────────────────────

export function draw(ctx, state, canvas) {
  const { w: cw, h: ch } = getCellSize(canvas)

  // 1. Background
  ctx.fillStyle = COLORS.BACKGROUND
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 2. Subtle grid lines
  drawGrid(ctx, cw, ch, canvas)

  if (!state) return

  // 3. Fields (Stage 3 — rendered here when present)
  for (const field of state.fields || []) {
    drawField(ctx, field, cw, ch)
  }

  // 4. Snake
  drawSnake(ctx, state.snake, state.isDead, cw, ch)
}

// ── Grid ──────────────────────────────────────────────────────

function drawGrid(ctx, cw, ch, canvas) {
  ctx.strokeStyle = COLORS.GRID_LINE
  ctx.lineWidth = 0.5

  for (let col = 0; col <= GRID_COLS; col++) {
    ctx.beginPath()
    ctx.moveTo(col * cw, 0)
    ctx.lineTo(col * cw, canvas.height)
    ctx.stroke()
  }

  for (let row = 0; row <= GRID_ROWS; row++) {
    ctx.beginPath()
    ctx.moveTo(0, row * ch)
    ctx.lineTo(canvas.width, row * ch)
    ctx.stroke()
  }
}

// ── Snake ─────────────────────────────────────────────────────

function drawSnake(ctx, snake, isDead, cw, ch) {
  if (!snake || snake.length === 0) return

  const pad = CELL_PADDING

  snake.forEach((seg, i) => {
    const isHead = i === 0
    const px = seg.col * cw + pad
    const py = seg.row * ch + pad
    const sw = cw - pad * 2
    const sh = ch - pad * 2

    // Body gradient: head is bright, tail fades
    const alpha = isHead ? 1 : Math.max(0.25, 1 - (i / snake.length) * 0.75)

    if (isDead) {
      ctx.fillStyle = COLORS.DEATH_FLASH
    } else if (isHead) {
      ctx.fillStyle = COLORS.SNAKE_HEAD
    } else {
      // Interpolate from bright to dark green
      ctx.fillStyle = `rgba(26, 122, 6, ${alpha})`
    }

    // Rounded rectangle for segments
    const radius = Math.min(sw, sh) * 0.25
    roundRect(ctx, px, py, sw, sh, radius)
    ctx.fill()

    // Outline
    ctx.strokeStyle = isDead ? '#880000' : COLORS.SNAKE_OUTLINE
    ctx.lineWidth = 0.5
    ctx.stroke()

    // Eyes on head
    if (isHead && !isDead) {
      drawEyes(ctx, seg, cw, ch)
    }
  })
}

function drawEyes(ctx, head, cw, ch) {
  const cx = head.col * cw + cw / 2
  const cy = head.row * ch + ch / 2
  const eyeR = Math.min(cw, ch) * 0.1

  // Two eyes, offset slightly
  const offsets = [
    { dx: -cw * 0.15, dy: -ch * 0.15 },
    { dx:  cw * 0.15, dy: -ch * 0.15 },
  ]

  for (const { dx, dy } of offsets) {
    ctx.beginPath()
    ctx.arc(cx + dx, cy + dy, eyeR, 0, Math.PI * 2)
    ctx.fillStyle = '#000'
    ctx.fill()

    // Glint
    ctx.beginPath()
    ctx.arc(cx + dx + eyeR * 0.3, cy + dy - eyeR * 0.3, eyeR * 0.35, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
  }
}

// ── Fields (populated Stage 3) ────────────────────────────────

function drawField(ctx, field, cw, ch) {
  if (field.captured) return  // don't draw captured fields

  const pad = CELL_PADDING * 2
  const x = field.col * cw + pad
  const y = field.row * ch + pad
  const w = field.width  * cw - pad * 2
  const h = field.height * ch - pad * 2

  // Background
  ctx.fillStyle = COLORS.FIELD_BG
  roundRect(ctx, x, y, w, h, 6)
  ctx.fill()

  // Border (pulsing handled via opacity in future)
  ctx.strokeStyle = COLORS.FIELD_BORDER
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Label
  const fontSize = Math.max(10, Math.min(cw * 0.9, 14))
  ctx.font = `bold ${fontSize}px 'Courier New', monospace`
  ctx.fillStyle = COLORS.FIELD_LABEL
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(field.label, x + w / 2, y + h / 2)
}

// ── Utility ───────────────────────────────────────────────────

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
