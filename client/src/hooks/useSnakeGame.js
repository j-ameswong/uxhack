// ============================================================
//  useSnakeGame.js
//  Consolidated game hook — one source of truth for game state,
//  deaths, timer, input, submit. Used by LoginPage and GamePage.
// ============================================================

import { useState, useCallback, useEffect, useRef } from 'react'
import { useGameLoop } from './useGameLoop.js'
import { useKeyboard } from './useKeyboard.js'
import { useTimer } from './useTimer.js'
import { useAudio } from './useAudio.js'
import { useGameContext } from '../context/GameContext.jsx'
import { TICK_RATE_MS, VERIFY_TICK_RATE_MS, GRID_COLS, GRID_ROWS } from '../game/constants.js'
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
  const [fieldsFadingIn, setFieldsFadingIn] = useState(false)
  const [deathCountdown, setDeathCountdown] = useState(null)
  const [verifyAppearing, setVerifyAppearing] = useState(false)
  const [showInputCountdown, setShowInputCountdown] = useState(false)
  const [timerPaused, setTimerPaused] = useState(false)
  const { setFieldValue, getFieldValue } = useGameContext()

  const confirmedCountRef = useRef(0)
  const elapsedMsRef = useRef(0)
  const deathsRef = useRef(0)
  deathsRef.current = deaths

  // Login form values passed in via beginGame — used for in-game validation
  const loginValuesRef = useRef({ name: '', email: '', secret: '' })

  const { init: initAudio, play: playAudio } = useAudio()

  // Satisfy autoplay policy: init audio on first keydown
  useEffect(() => {
    function handleFirstKey() {
      initAudio()
      window.removeEventListener('keydown', handleFirstKey)
    }
    window.addEventListener('keydown', handleFirstKey)
    return () => window.removeEventListener('keydown', handleFirstKey)
  }, [initAudio])

  const handleDeath = useCallback(() => {
    setDeaths(d => d + 1)
    setCapturedField(null)
    // NOTE: confirmedCountRef is NOT reset — captured fields persist across deaths.
    // Only a full timer-expiry reset clears confirmed count.

    playAudio('death')

    setIsFlashing(true)
    setTimeout(() => setIsFlashing(false), 100)

    // After flash, 3-2-1 countdown then resume (snake only was reset by engine)
    setTimeout(() => {
      playAudio('countdown'); setDeathCountdown(3)
      setTimeout(() => { playAudio('countdown'); setDeathCountdown(2) }, 1000)
      setTimeout(() => { playAudio('countdown'); setDeathCountdown(1) }, 2000)
      setTimeout(() => {
        setDeathCountdown(null)
        const newRate = engineRef.current?.tickRateMs ?? TICK_RATE_MS
        setTickRate(newRate)
        resumeGame() // resume at preserved tick rate
      }, 3000)
    }, 800)
  }, [playAudio]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFieldCaptured = useCallback((field) => {
    playAudio('capture')
    setCapturedField(field)
    setTickRate(engineRef.current?.tickRateMs ?? TICK_RATE_MS)
  }, [playAudio]) // eslint-disable-line react-hooks/exhaustive-deps

  const { engineRef, gameState, startGame, stopGame, resetGame, resumeGame } = useGameLoop({
    onDeath: handleDeath,
    onFieldCaptured: handleFieldCaptured,
    onTick: () => playAudio('step'),
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

  // Timer pauses during field capture overlay AND during post-input countdown
  const { display: timerDisplay, elapsedMs, penalize } = useTimer(
    started,
    !!capturedField || timerPaused,
    handleTimeUp,
    timerResetKey,
  )
  elapsedMsRef.current = elapsedMs
  const penalizeRef = useRef(penalize)
  penalizeRef.current = penalize

  const [penaltyFlash, setPenaltyFlash] = useState(false)
  const [penaltyAmount, setPenaltyAmount] = useState(0)
  const [tickRate, setTickRate] = useState(TICK_RATE_MS)

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

    // Verify Password → submit and navigate (no countdown)
    if (field.label === 'Verify Password') {
      engineRef.current?.stop()
      const snapshot = {
        deaths: deathsRef.current,
        timeMs: elapsedMsRef.current,
      }
      let rank = null
      let submitError = false
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/submit`, {
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

    confirmedCountRef.current += 1

    // Unlock Password field once Name and Email are both captured
    if (confirmedCountRef.current >= 2) {
      const pwField = engineRef.current?.fields.find(f => f.label === 'Password' && !f.captured)
      if (pwField) pwField.locked = false
    }

    const isThirdField = confirmedCountRef.current >= 3

    // Show 1-second circular countdown before resuming; timer pauses during it
    setShowInputCountdown(true)
    setTimerPaused(true)

    setTimeout(() => {
      setShowInputCountdown(false)
      setTimerPaused(false)

      if (isThirdField) {
        engineRef.current.tickRateMs = VERIFY_TICK_RATE_MS
        setTickRate(VERIFY_TICK_RATE_MS)
        engineRef.current.spawnVerifyField()
        setVerifyAppearing(true)
        const eng = engineRef.current
        eng.onTick({ snake: [...eng.snake], fields: eng.fields, gameOver: false })
        setTimeout(() => {
          setVerifyAppearing(false)
          resumeGame()
        }, 2000)
      } else {
        resumeGame()
      }
    }, 1000)
  }, [setFieldValue, resumeGame, engineRef, getFieldValue, onComplete])

  useKeyboard(engineRef, started, {
    onLetterKey: () => setShowTooltip(true),
  })

  useEffect(() => {
    if (!showTooltip) return
    const t = setTimeout(() => setShowTooltip(false), 2000)
    return () => clearTimeout(t)
  }, [showTooltip])

  const CARD_FADE_MS = 500        // login card fades out
  const FIELD_FADE_IN_MS = 1000   // fields fade in at form positions
  const SPIRAL_DURATION_MS = 2000
  const SPIRAL_ROTATIONS = 2
  const SPIRAL_AMPLITUDE = 0.35

  const beginGame = useCallback((loginValues = {}) => {
    loginValuesRef.current = { name: '', email: '', secret: '', ...loginValues }
    setTickRate(TICK_RATE_MS)

    // Phase 1: fade out the login card
    setCardFading(true)

    // Phase 2: card gone — fields fade in at their current (form) positions
    setTimeout(() => {
      setCardFading(false)
      setFieldsFadingIn(true)

      // Phase 3: fade complete — begin scatter animation
      setTimeout(() => {
        setFieldsFadingIn(false)
        setScattering(true)

        const engine = engineRef.current
        if (!engine) return

        playAudio('scatter')

        const starts = engine.fields.map(f => ({ col: f.col, row: f.row }))
        const targets = generateSpacedPositions(engine.fields)
        const startTime = performance.now()

        function animateSpiral(now) {
          const elapsed = now - startTime
          const rawT = Math.min(elapsed / SPIRAL_DURATION_MS, 1)
          const t = rawT * rawT * rawT * rawT * rawT // ease-in quintic

          for (let i = 0; i < engine.fields.length; i++) {
            const field = engine.fields[i]
            if (field.captured) continue

            const s = starts[i]
            const e = targets[i]
            const dx = e.col - s.col
            const dy = e.row - s.row
            const dist = Math.sqrt(dx * dx + dy * dy)

            const baseCol = s.col + t * dx
            const baseRow = s.row + t * dy

            const amplitude = Math.max(6, dist * SPIRAL_AMPLITUDE)
            const envelope = Math.sin(rawT * Math.PI)
            const angle = rawT * SPIRAL_ROTATIONS * 2 * Math.PI

            const newCol = baseCol + amplitude * envelope * Math.cos(angle)
            const newRow = baseRow + amplitude * envelope * Math.sin(angle)

            field.col = Math.max(0, Math.min(GRID_COLS - field.width, newCol))
            field.row = Math.max(0, Math.min(GRID_ROWS - field.height, newRow))
          }

          engine.onTick({ snake: [...engine.snake], fields: engine.fields, gameOver: false })

          if (rawT < 1) {
            requestAnimationFrame(animateSpiral)
          } else {
            // Snap to final integer positions
            for (let i = 0; i < engine.fields.length; i++) {
              engine.fields[i].col = Math.round(targets[i].col)
              engine.fields[i].row = Math.round(targets[i].row)
            }
            engine.onTick({ snake: [...engine.snake], fields: engine.fields, gameOver: false })

            // Phase 4: 3-2-1 countdown then start
            setScattering(false)
            setStarted(true)
            playAudio('countdown'); setDeathCountdown(3)
            setTimeout(() => { playAudio('countdown'); setDeathCountdown(2) }, 1000)
            setTimeout(() => { playAudio('countdown'); setDeathCountdown(1) }, 2000)
            setTimeout(() => {
              setDeathCountdown(null)
              startGame()
            }, 3000)
          }
        }

        requestAnimationFrame(animateSpiral)
      }, FIELD_FADE_IN_MS)
    }, CARD_FADE_MS)
  }, [startGame, engineRef, playAudio])

  return {
    engineRef,
    gameState,
    deaths,
    started,
    scattering,
    cardFading,
    fieldsFadingIn,
    deathCountdown,
    verifyAppearing,
    capturedField,
    showTooltip,
    showFailed,
    timerDisplay,
    isFlashing,
    penaltyFlash,
    penaltyAmount,
    tickRate,
    showInputCountdown,
    loginValuesRef,
    beginGame,
    stopGame,
    handleInputConfirm,
    handleCharTyped,
    handleFailedValidation,
    getFieldValue,
  }
}
