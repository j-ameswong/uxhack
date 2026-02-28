// ============================================================
//  GameBoard.jsx
//  DOM-based game renderer — pixel-art style with bevels.
//  Renders snake segments and fields as positioned divs.
// ============================================================

import { useRef, useState, useEffect } from 'react'
import { GRID_COLS, GRID_ROWS } from '../game/constants.js'
import { cn } from './ui/utils.js'

/**
 * @param {{ gameState: { snake: Array, fields: Array }, className?: string, showSnake?: boolean, animateFields?: boolean }} props
 */
export function GameBoard({ gameState, className, showSnake = true, animateFields = false }) {
  const boardRef = useRef(null)
  const [cellSize, setCellSize] = useState({ w: 0, h: 0 })

  // Compute cell size from container dimensions
  useEffect(() => {
    const el = boardRef.current
    if (!el) return

    function measure() {
      const { width, height } = el.getBoundingClientRect()
      setCellSize({ w: width / GRID_COLS, h: height / GRID_ROWS })
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { snake = [], fields = [] } = gameState ?? {}

  return (
    <div
      ref={boardRef}
      className={cn('relative w-full h-full overflow-hidden bg-background', className)}
    >
      {/* Fields */}
      {fields.map((field) => {
        if (field.captured) return null
        const rect = field.getRect ? field.getRect() : field
        const fieldW = (rect.width ?? 2) * cellSize.w
        const fieldH = (rect.height ?? 1) * cellSize.h
        return (
          <div
            key={field.label}
            className={cn(
              "absolute flex items-center justify-center select-none pointer-events-none pixel-bevel",
              animateFields && "transition-[left,top] duration-200 ease-out"
            )}
            style={{
              left: rect.col * cellSize.w,
              top: rect.row * cellSize.h,
              width: fieldW,
              height: fieldH,
              backgroundColor: '#3b3b5c',
              fontSize: Math.max(8, Math.min(fieldH * 0.28, fieldW * 0.08)),
              fontFamily: 'var(--font-pixel)',
            }}
          >
            <span className="font-bold text-primary truncate px-2 drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
              {field.label}
            </span>
          </div>
        )
      })}

      {/* Snake */}
      {showSnake && snake.map((seg, i) => {
        const isHead = i === snake.length - 1
        return (
          <div
            key={`s-${i}`}
            className="absolute flex items-center justify-center select-none"
            style={{
              left: seg.col * cellSize.w,
              top: seg.row * cellSize.h,
              width: cellSize.w,
              height: cellSize.h,
              backgroundColor: isHead ? '#4ade80' : '#22c55e',
              borderStyle: 'solid',
              borderWidth: '2px',
              borderColor: isHead
                ? '#86efac #166534 #166534 #86efac'
                : '#4ade80 #14532d #14532d #4ade80',
              boxShadow: isHead ? '0 0 8px #4ade80, inset 1px 1px 0 rgba(255,255,255,0.2)' : 'inset 1px 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            {seg.char && (
              <span style={{
                fontFamily: 'var(--font-pixel)',
                fontSize: Math.max(6, Math.min(cellSize.w * 0.6, cellSize.h * 0.6)),
                color: '#1a1a2e',
                fontWeight: 'bold',
                lineHeight: 1,
              }}>
                {seg.char}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
