import { useRef, useState, useCallback, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useGameLoop } from './hooks/useGameLoop.js'
import { useKeyboard } from './hooks/useKeyboard.js'
import { LoginPage } from './components/LoginPage.jsx'
import { InputOverlay } from './components/InputOverlay.jsx'
import { GameProvider, useGameContext } from './context/GameContext.jsx'

// ── Game Page (direct play) ─────────────────────────────────────

function GamePage() {
  const canvasRef  = useRef(null)
  const [deaths, setDeaths]   = useState(0)
  const [isAlive, setIsAlive] = useState(true)
  const [started, setStarted] = useState(false)
  const [capturedField, setCapturedField] = useState(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const { setFieldValue } = useGameContext()

  const handleDeath = useCallback(() => {
    setIsAlive(false)
    setDeaths(d => d + 1)
    setCapturedField(null)
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

  const handleInputConfirm = useCallback((field, value) => {
    setFieldValue(field.label, value)
    setCapturedField(null)
    resumeGame()
  }, [setFieldValue, resumeGame])

  useKeyboard(engineRef, started, {
    onLetterKey: () => setShowTooltip(true),
  })

  useEffect(() => {
    if (!showTooltip) return
    const t = setTimeout(() => setShowTooltip(false), 2000)
    return () => clearTimeout(t)
  }, [showTooltip])

  // ── Start on first interaction ────────────────────────────
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

      {/* HUD — deaths counter */}
      {started && (
        <div
          className="absolute top-4 right-4 z-10 text-sm"
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
      )}

      {/* Stage 4: Input overlay when field captured */}
      <InputOverlay
        field={capturedField}
        onConfirm={handleInputConfirm}
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
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Routes>
      </BrowserRouter>
    </GameProvider>
  )
}
