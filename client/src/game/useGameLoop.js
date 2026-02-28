// ============================================================
//  useGameLoop.js
//  Mounts GameEngine on the canvas ref.
//  Runs a requestAnimationFrame render loop (draw only).
//  Engine ticks run on their own setInterval — separate from draw.
// ============================================================

import { useEffect, useRef, useCallback } from 'react'
import { GameEngine } from '../game/engine.js'
import { draw } from '../game/draw.js'

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
  const rafRef     = useRef(null)
  const stateRef   = useRef(null)   // latest engine state for rAF

  // ── Engine callbacks (stable refs to avoid re-mounting) ──
  const onDeath = useCallback(() => {
    if (callbacks.onDeath) callbacks.onDeath()
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const onTick = useCallback((state) => {
    stateRef.current = state
    if (callbacks.onTick) callbacks.onTick(state)
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const onGrow = useCallback(() => {
    if (callbacks.onGrow) callbacks.onGrow()
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mount engine once ─────────────────────────────────────
  useEffect(() => {
    engineRef.current = new GameEngine({ onDeath, onTick, onGrow })

    // Sync initial state into stateRef
    stateRef.current = engineRef.current.getState()

    return () => {
      engineRef.current.stop()
      engineRef.current = null
    }
  }, [onDeath, onTick, onGrow])

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

  // ── requestAnimationFrame render loop ─────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function renderLoop() {
      const ctx = canvas.getContext('2d')
      if (ctx && stateRef.current) {
        draw(ctx, stateRef.current, canvas)
      }
      rafRef.current = requestAnimationFrame(renderLoop)
    }

    rafRef.current = requestAnimationFrame(renderLoop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [canvasRef])

  // ── Exposed controls ──────────────────────────────────────
  const startGame = useCallback(() => {
    engineRef.current?.start()
  }, [])

  const stopGame = useCallback(() => {
    engineRef.current?.stop()
  }, [])

  const resetGame = useCallback(() => {
    engineRef.current?.reset()
    stateRef.current = engineRef.current?.getState()
    engineRef.current?.start()
  }, [])

  return { engineRef, startGame, stopGame, resetGame }
}
