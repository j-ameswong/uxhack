// ============================================================
//  useGameLoop.js
//  Mounts GameEngine and exposes game state via React state.
//  No canvas — rendering is handled by GameBoard (DOM).
// ============================================================

import { useEffect, useRef, useCallback, useState } from 'react'
import { GameEngine } from '../game/engine.js'
import { TICK_RATE_MS } from '../game/constants.js'

/**
 * @param {object} callbacks
 *   onDeath()              — called by engine on wall/self collision
 *   onFieldCaptured(field) — called when snake captures a field; game pauses
 * @returns {{ engineRef, gameState, startGame, stopGame, resetGame, resumeGame }}
 */
export function useGameLoop(callbacks = {}) {
  const engineRef    = useRef(null)
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  const [gameState, setGameState] = useState(null)

  // ── Engine callbacks (stable refs) ──
  const onDeath = useCallback(() => {
    callbacksRef.current.onDeath?.()
  }, [])

  const onFieldCaptured = useCallback((field) => {
    callbacksRef.current.onFieldCaptured?.(field)
  }, [])

  const onTick = useCallback((state) => {
    setGameState(state)
  }, [])

  // ── Mount engine once ─────────────────────────────────────
  useEffect(() => {
    engineRef.current = new GameEngine({ onDeath, onFieldCaptured, onTick })
    // Set initial state so GameBoard can render before first tick
    setGameState(engineRef.current.getState())

    return () => {
      engineRef.current.stop()
      engineRef.current = null
    }
  }, [onDeath, onFieldCaptured, onTick])

  // ── Exposed controls ──────────────────────────────────────
  const startGame = useCallback(() => {
    if (!engineRef.current) return
    engineRef.current.start(TICK_RATE_MS)
  }, [])

  const stopGame = useCallback(() => {
    engineRef.current?.stop()
  }, [])

  /** Reset snake position and start engine immediately. */
  const resetGame = useCallback(() => {
    if (!engineRef.current) return
    engineRef.current.stop()
    engineRef.current._resetSnake()
    setGameState(engineRef.current.getState())
    engineRef.current.start(TICK_RATE_MS)
  }, [])

  /** Reset snake position only — does NOT start the engine. */
  const resetSnake = useCallback(() => {
    if (!engineRef.current) return
    engineRef.current.stop()
    engineRef.current._resetSnake()
    setGameState(engineRef.current.getState())
  }, [])

  // Resume after field capture — use engine's current (possibly faster) tick rate
  const resumeGame = useCallback(() => {
    if (!engineRef.current) return
    engineRef.current.start(engineRef.current.tickRateMs)
  }, [])

  return { engineRef, gameState, startGame, stopGame, resetGame, resetSnake, resumeGame }
}
