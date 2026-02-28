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
import { VERIFY_TICK_RATE_MS } from '../game/constants.js'

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
  const { setFieldValue, getFieldValue } = useGameContext()

  const confirmedCountRef = useRef(0)
  const elapsedMsRef = useRef(0)
  const deathsRef = useRef(0)
  deathsRef.current = deaths

  const handleDeath = useCallback(() => {
    setDeaths(d => d + 1)
    setCapturedField(null)
    confirmedCountRef.current = 0
    setTimeout(() => resetGame(), 800)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFieldCaptured = useCallback((field) => {
    setCapturedField(field)
  }, [])

  const { engineRef, gameState, startGame, stopGame, resetGame, resumeGame } = useGameLoop({
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

  const { display: timerDisplay, elapsedMs } = useTimer(started, !!capturedField, handleTimeUp, timerResetKey)
  elapsedMsRef.current = elapsedMs

  const handleInputConfirm = useCallback(async (field, value) => {
    setFieldValue(field.label, value)
    setCapturedField(null)

    if (field.label !== 'Verify Password') {
      confirmedCountRef.current += 1
    }

    if (confirmedCountRef.current >= 3 && field.label !== 'Verify Password') {
      engineRef.current.tickRateMs = VERIFY_TICK_RATE_MS
      engineRef.current.spawnVerifyField()
      resumeGame()
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

  const beginGame = useCallback(() => {
    setStarted(true)
    startGame()
  }, [startGame])

  return {
    engineRef,
    gameState,
    deaths,
    started,
    capturedField,
    showTooltip,
    showFailed,
    timerDisplay,
    beginGame,
    stopGame,
    handleInputConfirm,
    getFieldValue,
  }
}
