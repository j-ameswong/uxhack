import { useRef, useState, useCallback, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useGameLoop } from './hooks/useGameLoop.js'
import { VERIFY_TICK_RATE_MS } from './game/constants.js'
import { useKeyboard } from './hooks/useKeyboard.js'
import { useTimer } from './hooks/useTimer.js'
import { LoginPage } from './components/LoginPage.jsx'
import { InputOverlay } from './components/InputOverlay.jsx'
import { GameProvider, useGameContext } from './context/GameContext.jsx'

// ── Game Page ────────────────────────────────────────────────

function GamePage() {
  const canvasRef  = useRef(null)
  const navigate   = useNavigate()
  const [deaths, setDeaths]             = useState(0)
  const [isAlive, setIsAlive]           = useState(true)
  const [started, setStarted]           = useState(false)
  const [capturedField, setCapturedField] = useState(null)
  const [showTooltip, setShowTooltip]   = useState(false)
  const [showFailed, setShowFailed]     = useState(false)
  const [timerResetKey, setTimerResetKey] = useState(0)
  const { setFieldValue, getFieldValue } = useGameContext()

  const confirmedCountRef = useRef(0)
  const elapsedMsRef      = useRef(0)
  const deathsRef         = useRef(0)
  deathsRef.current = deaths

  const handleDeath = useCallback(() => {
    setIsAlive(false)
    setDeaths(d => d + 1)
    setCapturedField(null)
    confirmedCountRef.current = 0
    setTimeout(() => {
      resetGame()
      setIsAlive(true)
    }, 800)
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const handleFieldCaptured = useCallback((field) => {
    setCapturedField(field)
  }, [])

  const { engineRef, startGame, resetGame, resumeGame } = useGameLoop(canvasRef, {
    onDeath: handleDeath,
    onFieldCaptured: handleFieldCaptured,
  })

  // handleTimeUp must come after useGameLoop so resetGame is available
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
      try {
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name:   getFieldValue('Name'),
            email:  getFieldValue('Email'),
            timeMs: snapshot.timeMs,
            deaths: snapshot.deaths,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          rank = data.rank
        }
      } catch {
        // Server unavailable — proceed to success page without rank
      }
      navigate('/success', { state: { rank, ...snapshot } })
      return
    }

    resumeGame()
  }, [setFieldValue, resumeGame, engineRef, getFieldValue, navigate])

  useKeyboard(engineRef, started, {
    onLetterKey: () => setShowTooltip(true),
  })

  useEffect(() => {
    if (!showTooltip) return
    const t = setTimeout(() => setShowTooltip(false), 2000)
    return () => clearTimeout(t)
  }, [showTooltip])

  function handleStart() {
    setStarted(true)
    startGame()
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Fullscreen canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: 'block' }}
      />

      {/* Start screen */}
      {!started && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <div
            className="text-center p-8"
            style={{
              background: 'rgba(0,0,0,0.85)',
              border: '1px solid #39ff14',
              borderRadius: '8px',
              boxShadow: '0 0 40px rgba(57,255,20,0.15)',
            }}
          >
            <div className="text-7xl mb-4">🐍</div>
            <h1
              className="text-5xl font-bold mb-2"
              style={{ color: '#39ff14', fontFamily: 'Courier New, monospace', letterSpacing: '0.1em' }}
            >
              SnakeUp
            </h1>
            <p className="mb-1" style={{ color: '#666', fontFamily: 'monospace' }}>
              The form that fights back.
            </p>
            <p className="mb-6 text-sm" style={{ color: '#444', fontFamily: 'monospace' }}>
              Use arrow keys or WASD to move
            </p>
            <button
              onClick={handleStart}
              className="px-8 py-3 font-bold text-lg cursor-pointer"
              style={{
                background: '#39ff14',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                fontFamily: 'Courier New, monospace',
                letterSpacing: '0.05em',
                boxShadow: '0 0 20px rgba(57,255,20,0.4)',
              }}
            >
              PLAY →
            </button>
          </div>
        </div>
      )}

      {/* HUD — timer + deaths */}
      {started && (
        <div className="absolute top-4 right-4 z-10 flex gap-3">
          <div
            className="text-sm"
            style={{
              color: '#39ff14',
              fontFamily: 'Courier New, monospace',
              background: 'rgba(0,0,0,0.6)',
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #1a4a0a',
            }}
          >
            ⏱ {timerDisplay}
          </div>
          <div
            className="text-sm"
            style={{
              color: '#39ff14',
              fontFamily: 'Courier New, monospace',
              background: 'rgba(0,0,0,0.6)',
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #1a4a0a',
            }}
          >
            💀 Deaths: {deaths}
          </div>
        </div>
      )}

      {/* Time's up — failed overlay */}
      {showFailed && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center z-30"
          style={{ background: 'rgba(0,0,0,0.9)' }}
        >
          <div
            className="text-center p-8 rounded-xl"
            style={{
              border: '2px solid #ff4444',
              boxShadow: '0 0 40px rgba(255,68,68,0.3)',
            }}
          >
            <p
              className="text-4xl font-bold mb-2"
              style={{ color: '#ff4444', fontFamily: 'Courier New, monospace' }}
            >
              Time&apos;s up! You failed.
            </p>
            <p className="text-lg" style={{ color: '#888', fontFamily: 'monospace' }}>
              Starting again...
            </p>
          </div>
        </div>
      )}

      {/* Input overlay when field captured */}
      <InputOverlay
        field={capturedField}
        onConfirm={handleInputConfirm}
        storedPassword={getFieldValue('Password')}
      />

      {/* Tooltip: letter key pressed */}
      {showTooltip && started && !capturedField && (
        <div
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded text-sm"
          style={{
            color: '#39ff14',
            fontFamily: 'Courier New, monospace',
            background: 'rgba(0,0,0,0.8)',
            border: '1px solid #1a4a0a',
          }}
        >
          Use arrow keys or WASD to move! Chase the fields to fill them in.
        </div>
      )}
    </div>
  )
}

// ── Success Page (placeholder) ────────────────────────────────

function SuccessPage() {
  const location = useLocation()
  const navigate  = useNavigate()
  const { rank, deaths, timeMs } = location.state ?? {}

  function formatTime(ms) {
    if (ms == null) return '—'
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const centis  = Math.floor((ms % 1000) / 10)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`
  }

  return (
    <div
      className="flex items-center justify-center h-screen"
      style={{ background: '#0a0a0a', fontFamily: 'Courier New, monospace' }}
    >
      <div
        className="text-center p-10 rounded-xl"
        style={{
          border: '2px solid #39ff14',
          boxShadow: '0 0 60px rgba(57,255,20,0.2)',
          maxWidth: '480px',
          width: '90%',
        }}
      >
        <div className="text-6xl mb-4">🎉</div>
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: '#39ff14', letterSpacing: '0.05em' }}
        >
          You&apos;ve signed up successfully!
        </h1>
        <p className="mb-6" style={{ color: '#666' }}>
          The snake has been fed.
        </p>
        {rank != null && (
          <div className="mb-6 flex flex-col gap-1" style={{ color: '#aaa' }}>
            <p>Rank: <span style={{ color: '#39ff14' }}>#{rank}</span></p>
            {timeMs != null && (
              <p>Time: <span style={{ color: '#39ff14' }}>{formatTime(timeMs)}</span></p>
            )}
            {deaths != null && (
              <p>Deaths: <span style={{ color: '#39ff14' }}>{deaths}</span></p>
            )}
          </div>
        )}
        <button
          onClick={() => navigate('/game')}
          style={{
            background: '#39ff14',
            color: '#000',
            border: 'none',
            padding: '10px 24px',
            borderRadius: '4px',
            fontFamily: 'Courier New, monospace',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          Play Again
        </button>
      </div>
    </div>
  )
}

// ── Leaderboard placeholder ───────────────────────────────────

function LeaderboardPage() {
  return (
    <div
      className="flex items-center justify-center h-screen"
      style={{ background: '#0a0a0a', color: '#39ff14', fontFamily: 'Courier New, monospace' }}
    >
      <h1 className="text-3xl">Leaderboard — Stage 6</h1>
    </div>
  )
}

// ── App root ──────────────────────────────────────────────────

export default function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"            element={<LoginPage />} />
          <Route path="/game"        element={<GamePage />} />
          <Route path="/success"     element={<SuccessPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Routes>
      </BrowserRouter>
    </GameProvider>
  )
}
