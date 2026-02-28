// ============================================================
//  GameBoard.jsx
//  DOM-based game renderer — replaces the canvas draw.js.
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
        return (
          <div
            key={field.label}
            className={cn(
              "absolute flex items-center justify-center rounded-lg border-2 border-primary bg-card/80 backdrop-blur-sm select-none pointer-events-none",
              animateFields && "transition-[left,top] duration-200 ease-out"
            )}
            style={{
              left: rect.col * cellSize.w,
              top: rect.row * cellSize.h,
              width: (rect.width ?? 2) * cellSize.w,
              height: (rect.height ?? 1) * cellSize.h,
              fontSize: Math.max(10, Math.min((rect.height ?? 1) * cellSize.h * 0.35, (rect.width ?? 2) * cellSize.w * 0.12)),
            }}
          >
            <span className="font-bold text-primary truncate px-2">
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
            className={cn(
              'absolute rounded-sm',
              isHead
                ? 'bg-primary shadow-[0_0_8px_var(--primary)]'
                : 'bg-primary/60',
            )}
            style={{
              left: seg.col * cellSize.w + 1,
              top: seg.row * cellSize.h + 1,
              width: cellSize.w - 2,
              height: cellSize.h - 2,
            }}
          />
        )
      })}
    </div>
  )
}
