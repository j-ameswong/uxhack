// ============================================================
//  LoginPage.jsx
//  Login form where typing in the password field starts the snake game.
//  Stage 4: Field capture → InputOverlay → validate → resume.
// ============================================================

import { useRef, useState, useCallback, useEffect } from 'react'
import { useGameLoop } from '../hooks/useGameLoop.js'
import { useKeyboard } from '../hooks/useKeyboard.js'
import { useGameContext } from '../context/GameContext.jsx'
import { InputOverlay } from './InputOverlay.jsx'

export function LoginPage() {
  const canvasRef = useRef(null)
  const passwordRef = useRef(null)
  const [deaths, setDeaths] = useState(0)
  const [isAlive, setIsAlive] = useState(true)
  const [gameStarted, setGameStarted] = useState(false)
  const [capturedField, setCapturedField] = useState(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const { setFieldValue } = useGameContext()

  const handleDeath = useCallback(() => {
    setDeaths(d => d + 1)
    setIsAlive(false)
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

  useKeyboard(engineRef, gameStarted, {
    onLetterKey: () => setShowTooltip(true),
  })

  useEffect(() => {
    if (!showTooltip) return
    const t = setTimeout(() => setShowTooltip(false), 2000)
    return () => clearTimeout(t)
  }, [showTooltip])

  // When user tries to type in password → start the snake game instead
  function handlePasswordKeyDown(e) {
    if (gameStarted) return

    // Any printable key or backspace/delete triggers the game
    const isTypingKey =
      e.key.length === 1 ||
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Enter'

    if (isTypingKey) {
      e.preventDefault()
      e.stopPropagation()
      setGameStarted(true)
      startGame()
    }
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Canvas — always mounted, visible when game started */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          display: 'block',
          opacity: gameStarted ? 1 : 0,
          pointerEvents: gameStarted ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Login form — shown until user tries to type in password */}
      {!gameStarted && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)' }}
        >
          <div
            className="w-full max-w-md p-8 rounded-xl"
            style={{
              background: 'rgba(0,0,0,0.7)',
              border: '1px solid #39ff14',
              boxShadow: '0 0 60px rgba(57,255,20,0.1)',
            }}
          >
            <h1
              className="text-2xl font-bold mb-6 text-center"
              style={{ color: '#39ff14', fontFamily: 'Courier New, monospace' }}
            >
              Sign in
            </h1>

            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm mb-1"
                  style={{ color: '#888', fontFamily: 'monospace' }}
                >
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Your name"
                  className="w-full px-4 py-3 rounded border bg-black/50"
                  style={{
                    borderColor: '#333',
                    color: '#fff',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-sm mb-1"
                  style={{ color: '#888', fontFamily: 'monospace' }}
                >
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded border bg-black/50"
                  style={{
                    borderColor: '#333',
                    color: '#fff',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-sm mb-1"
                  style={{ color: '#888', fontFamily: 'monospace' }}
                >
                  Password
                </label>
                <input
                  ref={passwordRef}
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded border bg-black/50"
                  style={{
                    borderColor: '#333',
                    color: '#fff',
                    fontFamily: 'monospace',
                  }}
                  onKeyDown={handlePasswordKeyDown}
                  onFocus={(e) => e.target.placeholder = 'Try typing...'}
                  onBlur={(e) => e.target.placeholder = '••••••••'}
                />
                <p
                  className="mt-1 text-xs"
                  style={{ color: '#555', fontFamily: 'monospace' }}
                >
                  Go ahead, type your password...
                </p>
              </div>
            </div>

            <button
              type="button"
              className="w-full mt-6 py-3 font-bold rounded"
              style={{
                background: '#39ff14',
                color: '#000',
                border: 'none',
                fontFamily: 'Courier New, monospace',
              }}
            >
              Sign in
            </button>
          </div>
        </div>
      )}

      {/* HUD when game is running */}
      {gameStarted && (
        <div
          className="absolute top-4 right-4 z-20 text-sm"
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

      {/* Tooltip: letter key pressed when game active */}
      {showTooltip && gameStarted && !capturedField && (
        <div
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded text-sm animate-pulse"
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
