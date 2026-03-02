// ============================================================
//  FireBorder.jsx
//  Animated "ring of fire" effect along the game board edges.
//  Renders edge cells as positioned divs with a clockwise
//  fire-gradient trail (~4s full loop).
//  Uses refs + direct DOM style updates to avoid re-renders.
// ============================================================

import { useRef, useEffect, useMemo } from 'react'
import { GRID_COLS, GRID_ROWS } from '../game/constants.js'

// Trail color palette — indexed by distance from trail head
const TRAIL_COLORS = [
  '#fbbf24', // 0: bright yellow (head)
  '#f9a825', // 1
  '#f97316', // 2
  '#f97316', // 3
  '#ea580c', // 4
  '#dc2626', // 5
  '#dc2626', // 6
  '#b91c1c', // 7
  '#b91c1c', // 8
  '#991b1b', // 9
  '#991b1b', // 10
  '#7f1d1d', // 11
  '#7f1d1d', // 12
  '#7f1d1d', // 13
  '#6b1515', // 14
  '#5c1010', // 15
  '#4a0c0c', // 16
  '#3d0808', // 17
  '#330505', // 18
]
const BASE_COLOR = '#2a0000'
const TRAIL_LENGTH = TRAIL_COLORS.length

/**
 * Build an ordered array of edge cell positions, clockwise:
 * top-left → top-right → down right side → bottom-right → bottom-left → up left side
 */
function buildEdgeCells() {
  const cells = []
  // Top row: left to right
  for (let c = 0; c < GRID_COLS; c++) cells.push({ col: c, row: 0 })
  // Right column: top+1 to bottom
  for (let r = 1; r < GRID_ROWS; r++) cells.push({ col: GRID_COLS - 1, row: r })
  // Bottom row: right-1 to left
  for (let c = GRID_COLS - 2; c >= 0; c--) cells.push({ col: c, row: GRID_ROWS - 1 })
  // Left column: bottom-1 to top+1
  for (let r = GRID_ROWS - 2; r >= 1; r--) cells.push({ col: 0, row: r })
  return cells
}

export function FireBorder({ cellSize, fields = [] }) {
  const edgeCells = useMemo(buildEdgeCells, [])
  const totalCells = edgeCells.length
  const cellRefs = useRef([])
  const animRef = useRef(null)
  const trailHead = useRef(0)
  const lastTime = useRef(0)
  const visited = useRef(new Set())

  // ~4s full loop: advance rate = totalCells / 4000 ms
  const msPerCell = 4000 / totalCells

  useEffect(() => {
    // Reset visited on mount
    visited.current = new Set()

    function animate(now) {
      if (!lastTime.current) lastTime.current = now
      const delta = now - lastTime.current

      // Advance trail head based on elapsed time
      const advance = Math.floor(delta / msPerCell)
      if (advance > 0) {
        lastTime.current += advance * msPerCell
        const prevHead = trailHead.current
        trailHead.current = (trailHead.current + advance) % totalCells

        // Mark newly passed cells as visited
        for (let step = 1; step <= advance; step++) {
          visited.current.add((prevHead + step) % totalCells)
        }

        // Update all cells
        const head = trailHead.current
        for (let i = 0; i < totalCells; i++) {
          const el = cellRefs.current[i]
          if (!el) continue

          // Distance behind the head (wrapping)
          const dist = (head - i + totalCells) % totalCells
          if (dist < TRAIL_LENGTH) {
            el.style.backgroundColor = TRAIL_COLORS[dist]
          } else if (visited.current.has(i)) {
            el.style.backgroundColor = BASE_COLOR
          } else {
            el.style.backgroundColor = 'transparent'
          }
        }
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [totalCells, msPerCell])

  // Don't render if cellSize isn't ready
  if (!cellSize.w || !cellSize.h) return null

  return (
    <>
      {edgeCells.map((cell, i) => (
        <div
          key={`fire-${i}`}
          ref={(el) => { cellRefs.current[i] = el }}
          style={{
            position: 'absolute',
            left: cell.col * cellSize.w,
            top: cell.row * cellSize.h,
            width: cellSize.w,
            height: cellSize.h,
            backgroundColor: 'transparent',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Top-edge status bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: cellSize.w,
        right: cellSize.w,
        height: cellSize.h,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        pointerEvents: 'none',
        zIndex: 2,
        fontFamily: 'var(--font-pixel)',
        fontSize: '0.4rem',
        color: '#ffffff',
        textShadow: '0 0 4px #000, 1px 1px 0 #000',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}>
        <span style={{ color: '#fbbf24' }}>↑↓←→ WASD</span>
        {fields.map((f) => {
          const indicator = f.locked ? '[LOCKED]' : f.captured ? '[x]' : '[ ]'
          const color = f.locked ? '#ef4444' : f.captured ? '#4ade80' : '#e0e0e0'
          return (
            <span key={f.label} style={{ color }}>
              {f.label.toUpperCase()} {indicator}
            </span>
          )
        })}
      </div>
    </>
  )
}
