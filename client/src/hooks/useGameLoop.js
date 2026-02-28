// ============================================================
//  useGameLoop.js
//  Mounts GameEngine on the canvas ref.
//  Runs a requestAnimationFrame render loop (draw only).
//  Engine ticks run on their own setInterval — separate from draw.
// ============================================================

import { useEffect, useRef, useCallback } from 'react'
import { GameEngine } from '../game/engine.js'
import { draw } from '../game/draw.js'
import { TICK_RATE_MS } from '../game/constants.js'

/**
 * @param {React.RefObject<HTMLCanvasElement>} canvasRef
 * @param {object} callbacks
 *   onDeath()         — called by engine on wall/self collision
 *   onTick(state)     — called by engine every tick
 *   onGrow()          — called on field capture (Stage 4)
 * @returns {{ engineRef, startGame, stopGame, resetGame }}
 */
export function useGameLoop(canvasRef, callbacks = {}) {
  const engineRef  = useRef(null)

  // ── Engine callbacks (stable refs to avoid re-mounting) ──
  const onDeath = useCallback(() => {
    if (callbacks.onDeath) callbacks.onDeath()
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const onGrow = useCallback(() => {
    if (callbacks.onGrow) callbacks.onGrow()
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mount engine once ─────────────────────────────────────
  useEffect(() => {
    engineRef.current = new GameEngine({ onDeath, onGrow })

    return () => {
      engineRef.current.stop()
      engineRef.current = null
    }
  }, [onDeath, onGrow])

  // ── Canvas resize observer ────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function resize() {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [canvasRef])

  // ── Exposed controls ──────────────────────────────────────
  const startGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !engineRef.current) return
    const ctx = canvas.getContext('2d')
    engineRef.current.start(ctx, null, draw, TICK_RATE_MS)
  }, [canvasRef])

  const stopGame = useCallback(() => {
    engineRef.current?.stop()
  }, [])

  const resetGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !engineRef.current) return
    engineRef.current.stop()
    engineRef.current._resetSnake()
    const ctx = canvas.getContext('2d')
    engineRef.current.start(ctx, null, draw, TICK_RATE_MS)
  }, [canvasRef])

  return { engineRef, startGame, stopGame, resetGame }
}
