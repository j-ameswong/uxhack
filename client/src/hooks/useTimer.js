// ============================================================
//  useTimer.js
//  1-minute countdown — runs when game active, pauses during input mode.
//  When it hits 0: calls onTimeUp. Reset via resetTrigger.
// ============================================================

import { useState, useEffect, useRef } from 'react'

const COUNTDOWN_SECONDS = 120

/**
 * Format remaining milliseconds as mm:ss (e.g. 01:00, 00:23)
 */
function formatRemaining(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * @param {boolean} isRunning - Game has started
 * @param {boolean} isPaused - Input overlay visible (field captured)
 * @param {() => void} onTimeUp - Called when countdown reaches 0
 * @param {number} resetTrigger - Increment to reset countdown (e.g. after fail + restart)
 * @returns {{ display: string, isExpired: boolean }}
 */
export function useTimer(isRunning, isPaused, onTimeUp, resetTrigger = 0) {
  const [remainingMs, setRemainingMs] = useState(COUNTDOWN_SECONDS * 1000)
  const endAtRef = useRef(null)
  const pausedAtRef = useRef(null)
  const totalPausedRef = useRef(0)
  const onTimeUpRef = useRef(onTimeUp)
  const firedRef = useRef(false)
  onTimeUpRef.current = onTimeUp

  // Reset when resetTrigger changes or game stops
  useEffect(() => {
    firedRef.current = false
    if (!isRunning) {
      endAtRef.current = null
      pausedAtRef.current = null
      totalPausedRef.current = 0
      setRemainingMs(COUNTDOWN_SECONDS * 1000)
      return
    }
    // Reset countdown
    endAtRef.current = Date.now() + COUNTDOWN_SECONDS * 1000
    pausedAtRef.current = null
    totalPausedRef.current = 0
    setRemainingMs(COUNTDOWN_SECONDS * 1000)
  }, [isRunning, resetTrigger])

  // Tick when running
  useEffect(() => {
    if (!isRunning || !endAtRef.current) return

    if (isPaused) {
      if (!pausedAtRef.current) pausedAtRef.current = Date.now()
      return
    }

    // Resuming from pause
    if (pausedAtRef.current) {
      totalPausedRef.current += Date.now() - pausedAtRef.current
      pausedAtRef.current = null
    }

    const tick = () => {
      const remaining = endAtRef.current - Date.now() + totalPausedRef.current
      setRemainingMs(remaining)

      if (remaining <= 0 && !firedRef.current) {
        firedRef.current = true
        onTimeUpRef.current?.()
      }
    }

    tick()
    const id = setInterval(tick, 100)
    return () => clearInterval(id)
  }, [isRunning, isPaused])

  return {
    display: formatRemaining(remainingMs),
    isExpired: remainingMs <= 0,
    elapsedMs: Math.max(0, COUNTDOWN_SECONDS * 1000 - remainingMs),
  }
}
