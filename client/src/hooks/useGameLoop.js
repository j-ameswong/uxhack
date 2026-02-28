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
 *   onDeath()              — called by engine on wall/self collision
 *   onGrow()               — called on field capture (Stage 4)
 *   onFieldCaptured(field) — called when snake captures a field; game pauses
 * @returns {{ engineRef, startGame, stopGame, resetGame, resumeGame }}
 */
export function useGameLoop(canvasRef, callbacks = {}) {
  const engineRef  = useRef(null)
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  // ── Engine callbacks (stable refs) ──
  const onDeath = useCallback(() => {
    callbacksRef.current.onDeath?.()
  }, [])

  const onFieldCaptured = useCallback((field) => {
    callbacksRef.current.onFieldCaptured?.(field)
  }, [])

  // ── Mount engine once ─────────────────────────────────────
  useEffect(() => {
    engineRef.current = new GameEngine({ onDeath, onFieldCaptured })

    return () => {
      engineRef.current.stop()
      engineRef.current = null
    }
  }, [onDeath, onFieldCaptured])

  // ── Canvas resize observer ────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function resize() {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      // Setting width/height clears the canvas — redraw when paused (e.g. after field capture)
      if (engineRef.current && !engineRef.current.intervalId) {
        const ctx = canvas.getContext('2d')
        const state = engineRef.current.getState()
        if (state?.snake?.length) {
          draw(ctx, state, canvas.width, canvas.height)
        }
      }
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [canvasRef])

  const getDimensions = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return { width: 0, height: 0 }
    return { width: canvas.width || canvas.offsetWidth, height: canvas.height || canvas.offsetHeight }
  }, [canvasRef])

  // ── Exposed controls ──────────────────────────────────────
  const startGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !engineRef.current) return
    const ctx = canvas.getContext('2d')
    engineRef.current.start(ctx, getDimensions, draw, TICK_RATE_MS)
  }, [canvasRef, getDimensions])

  const stopGame = useCallback(() => {
    engineRef.current?.stop()
  }, [])

  const resetGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !engineRef.current) return
    engineRef.current.stop()
    engineRef.current._resetSnake()
    const ctx = canvas.getContext('2d')
    engineRef.current.start(ctx, getDimensions, draw, TICK_RATE_MS)
  }, [canvasRef, getDimensions])

  // Resume after field capture — use engine's current (possibly faster) tick rate
  const resumeGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !engineRef.current) return
    const ctx = canvas.getContext('2d')
    engineRef.current.start(ctx, getDimensions, draw, engineRef.current.tickRateMs)
  }, [canvasRef, getDimensions])

  return { engineRef, startGame, stopGame, resetGame, resumeGame }
}
