// ============================================================
//  useSnakeGame.js
//  Consolidated game hook — one source of truth for game state,
//  deaths, timer, input, submit. Used by LoginPage and GamePage.
// ============================================================

import { useState, useCallback, useEffect, useRef } from 'react'
import { useGameLoop } from './useGameLoop.js'
import { useKeyboard } from './useKeyboard.js'
import { useTimer } from './useTimer.js'
import { useGameContext } from '../context/GameContext.jsx'
import { VERIFY_TICK_RATE_MS, GRID_COLS, GRID_ROWS } from '../game/constants.js'
import { generateSpacedPositions } from '../game/fields.js'

/**
 * @param {{ onComplete?: (result: { rank, deaths, timeMs }) => void }} options
 */
export function useSnakeGame({ onComplete } = {}) {
  const [deaths, setDeaths] = useState(0)
  const [started, setStarted] = useState(false)
  const [capturedField, setCapturedField] = useState(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const [showFailed, setShowFailed] = useState(false)
  const [timerResetKey, setTimerResetKey] = useState(0)
  const [isFlashing, setIsFlashing] = useState(false)
  const [scattering, setScattering] = useState(false)
  const [cardFading, setCardFading] = useState(false)
  const [morphing, setMorphing] = useState(false)
  const [deathCountdown, setDeathCountdown] = useState(null)
  const [verifyAppearing, setVerifyAppearing] = useState(false)
  const { setFieldValue, getFieldValue } = useGameContext()

  const confirmedCountRef = useRef(0)
  const elapsedMsRef = useRef(0)
  const deathsRef = useRef(0)
  deathsRef.current = deaths

  const handleDeath = useCallback(() => {
    setDeaths(d => d + 1)
    setCapturedField(null)
    confirmedCountRef.current = 0

    // Trigger the flash effect
    setIsFlashing(true)
    setTimeout(() => setIsFlashing(false), 100)

    // After flash, start countdown (engine already stopped + reset by tick())
    setTimeout(() => {
      setDeathCountdown(3)
      setTimeout(() => setDeathCountdown(2), 1000)
      setTimeout(() => setDeathCountdown(1), 2000)
      setTimeout(() => {
        setDeathCountdown(null)
        startGame()
      }, 3000)
    }, 800)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFieldCaptured = useCallback((field) => {
    setCapturedField(field)
  }, [])

  const { engineRef, gameState, startGame, stopGame, resetGame, resetSnake, resumeGame } = useGameLoop({
    onDeath: handleDeath,
    onFieldCaptured: handleFieldCaptured,
  })

  const handleTimeUp = useCallback(() => {
    setCapturedField(null)
    setShowFailed(true)
    engineRef.current?.stop()
    setDeaths(d => d + 1)
    confirmedCountRef.current = 0
    setTimeout(() => {
      setShowFailed(false)
      setTimerResetKey(k => k + 1)
      resetGame()
    }, 1500)
  }, [engineRef, resetGame])

  const { display: timerDisplay, elapsedMs, penalize } = useTimer(started, false, handleTimeUp, timerResetKey)
  elapsedMsRef.current = elapsedMs
  const penalizeRef = useRef(penalize)
  penalizeRef.current = penalize

  const [penaltyFlash, setPenaltyFlash] = useState(false)
  const [penaltyAmount, setPenaltyAmount] = useState(0)

  const handleCharTyped = useCallback((char) => {
    engineRef.current?.growTail(char)
    penalizeRef.current?.(1000)
    setPenaltyAmount(1)
    setPenaltyFlash(true)
    setTimeout(() => setPenaltyFlash(false), 200)
  }, [engineRef])

  const handleFailedValidation = useCallback(() => {
    penalizeRef.current?.(5000)
    setPenaltyAmount(5)
    setPenaltyFlash(true)
    setTimeout(() => setPenaltyFlash(false), 400)
  }, [])

  const handleInputConfirm = useCallback(async (field, value) => {
    setFieldValue(field.label, value)
    setCapturedField(null)

    if (field.label !== 'Verify Password') {
      confirmedCountRef.current += 1

      // Unlock Password field once Name and Email are both captured
      if (confirmedCountRef.current >= 2) {
        const pwField = engineRef.current?.fields.find(f => f.label === 'Password' && !f.captured)
        if (pwField) pwField.locked = false
      }
    }

    if (confirmedCountRef.current >= 3 && field.label !== 'Verify Password') {
      engineRef.current.tickRateMs = VERIFY_TICK_RATE_MS
      engineRef.current.spawnVerifyField()
      // Brief pause to draw attention to the new field
      setVerifyAppearing(true)
      // Emit a tick so the field renders on the board while paused
      const eng = engineRef.current
      eng.onTick({ snake: [...eng.snake], fields: eng.fields, gameOver: false })
      setTimeout(() => {
        setVerifyAppearing(false)
        resumeGame()
      }, 2000)
      return
    }

    if (field.label === 'Verify Password') {
      engineRef.current?.stop()
      const snapshot = {
        deaths: deathsRef.current,
        timeMs: elapsedMsRef.current,
      }
      let rank = null
      let submitError = false
      try {
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: getFieldValue('Name'),
            email: getFieldValue('Email'),
            timeMs: snapshot.timeMs,
            deaths: snapshot.deaths,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          rank = data.rank
          snapshot.id = data.id
        } else {
          submitError = true
        }
      } catch {
        submitError = true
      }
      onComplete?.({ rank, submitError, ...snapshot })
      return
    }

    resumeGame()
  }, [setFieldValue, resumeGame, engineRef, getFieldValue, onComplete])

  useKeyboard(engineRef, started, {
    onLetterKey: () => setShowTooltip(true),
  })

  useEffect(() => {
    if (!showTooltip) return
    const t = setTimeout(() => setShowTooltip(false), 2000)
    return () => clearTimeout(t)
  }, [showTooltip])

  const MORPH_DURATION_MS = 1800 // form inputs morph into game fields
  const APPEAR_DELAY_MS = 1000  // fields sit at game positions before spiral
  const SPIRAL_DURATION_MS = 2000
  const SPIRAL_ROTATIONS = 2
  const SPIRAL_AMPLITUDE = 0.35 // fraction of distance for spiral radius

  const beginGame = useCallback(() => {
    // Phase 1: fade card + morph form inputs into game fields (cross-fade)
    setCardFading(true)
    setMorphing(true)

    // Phase 2: morph complete — switch to scatter phase
    setTimeout(() => {
      setMorphing(false)
      setCardFading(false)
      setScattering(true)

      // Phase 3: after a pause, spiral fields out to their game positions
      setTimeout(() => {
        const engine = engineRef.current
        if (!engine) return

        // Snapshot starting positions and generate well-spaced targets
        const starts = engine.fields.map(f => ({ col: f.col, row: f.row }))
        const targets = generateSpacedPositions(engine.fields)
        const startTime = performance.now()

        function animateSpiral(now) {
          const elapsed = now - startTime
          const rawT = Math.min(elapsed / SPIRAL_DURATION_MS, 1)
          // Ease-in quintic — very slow start, dramatic acceleration
          const t = rawT * rawT * rawT * rawT * rawT

          for (let i = 0; i < engine.fields.length; i++) {
            const field = engine.fields[i]
            if (field.captured) continue

            const s = starts[i]
            const e = targets[i]
            const dx = e.col - s.col
            const dy = e.row - s.row
            const dist = Math.sqrt(dx * dx + dy * dy)

            // Base interpolation using eased t
            const baseCol = s.col + t * dx
            const baseRow = s.row + t * dy

            // Spiral offset: sin envelope peaks mid-animation, collapses to 0 at end
            const amplitude = Math.max(6, dist * SPIRAL_AMPLITUDE)
            const envelope = Math.sin(rawT * Math.PI)
            const angle = rawT * SPIRAL_ROTATIONS * 2 * Math.PI

            // Use floats for smooth sub-cell positioning
            const newCol = baseCol + amplitude * envelope * Math.cos(angle)
            const newRow = baseRow + amplitude * envelope * Math.sin(angle)

            // Clamp to grid bounds
            field.col = Math.max(0, Math.min(GRID_COLS - field.width, newCol))
            field.row = Math.max(0, Math.min(GRID_ROWS - field.height, newRow))
          }

          engine.onTick({
            snake: [...engine.snake],
            fields: engine.fields,
            gameOver: false,
          })

          if (rawT < 1) {
            requestAnimationFrame(animateSpiral)
          } else {
            // Snap to final integer positions
            for (let i = 0; i < engine.fields.length; i++) {
              engine.fields[i].col = Math.round(targets[i].col)
              engine.fields[i].row = Math.round(targets[i].row)
            }
            engine.onTick({
              snake: [...engine.snake],
              fields: engine.fields,
              gameOver: false,
            })

            // Phase 4: countdown then start
            setScattering(false)
            setStarted(true)
            setDeathCountdown(3)
            setTimeout(() => setDeathCountdown(2), 1000)
            setTimeout(() => setDeathCountdown(1), 2000)
            setTimeout(() => {
              setDeathCountdown(null)
              startGame()
            }, 3000)
          }
        }

        requestAnimationFrame(animateSpiral)
      }, APPEAR_DELAY_MS)
    }, MORPH_DURATION_MS)
  }, [startGame, engineRef])

  return {
    engineRef,
    gameState,
    deaths,
    started,
    scattering,
    cardFading,
    morphing,
    deathCountdown,
    verifyAppearing,
    capturedField,
    showTooltip,
    showFailed,
    timerDisplay,
    isFlashing,
    penaltyFlash,
    penaltyAmount,
    beginGame,
    stopGame,
    handleInputConfirm,
    handleCharTyped,
    handleFailedValidation,
    getFieldValue,
  }
}
