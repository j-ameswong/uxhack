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

export function FireBorder({ cellSize }) {
  const edgeCells = useMemo(buildEdgeCells, [])
  const totalCells = edgeCells.length
  const cellRefs = useRef([])
  const animRef = useRef(null)
  const trailHead = useRef(0)
  const lastTime = useRef(0)

  // ~4s full loop: advance rate = totalCells / 4000 ms
  const msPerCell = 4000 / totalCells

  useEffect(() => {
    function animate(now) {
      if (!lastTime.current) lastTime.current = now
      const delta = now - lastTime.current

      // Advance trail head based on elapsed time
      const advance = Math.floor(delta / msPerCell)
      if (advance > 0) {
        lastTime.current += advance * msPerCell
        trailHead.current = (trailHead.current + advance) % totalCells

        // Update only the cells that could have changed (trail region + a buffer)
        const head = trailHead.current
        for (let i = 0; i < totalCells; i++) {
          const el = cellRefs.current[i]
          if (!el) continue

          // Distance behind the head (wrapping)
          const dist = (head - i + totalCells) % totalCells
          const color = dist < TRAIL_LENGTH ? TRAIL_COLORS[dist] : BASE_COLOR
          el.style.backgroundColor = color
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
            backgroundColor: BASE_COLOR,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  )
}
