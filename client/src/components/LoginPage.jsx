// ============================================================
//  LoginPage.jsx
//  Pixel-art styled login form. Typing in password starts the snake game.
// ============================================================

import { useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSnakeGame } from "../hooks/useSnakeGame.js";
import { GameBoard } from "./GameBoard.jsx";
import { InputOverlay } from "./InputOverlay.jsx";
import { cn } from "./ui/utils.js";
import { Badge } from "./ui/badge.jsx";

export function LoginPage() {
  const navigate = useNavigate();
  const passwordRef = useRef(null);

  const onComplete = useCallback(
    (result) => {
      navigate("/success", { state: result });
    },
    [navigate],
  );

  const {
    gameState,
    deaths,
    started,
    scattering,
    capturedField,
    showTooltip,
    showFailed,
    timerDisplay,
    isFlashing,
    penaltyFlash,
    penaltyAmount,
    beginGame,
    handleInputConfirm,
    handleCharTyped,
    handleFailedValidation,
    getFieldValue,
  } = useSnakeGame({ onComplete });

  function handlePasswordKeyDown(e) {
    if (started) return;
    const isTypingKey =
      e.key.length === 1 ||
      e.key === "Backspace" ||
      e.key === "Delete" ||
      e.key === "Enter";
    if (isTypingKey) {
      e.preventDefault();
      e.stopPropagation();
      beginGame();
    }
  }

    return (
      <div className="relative w-full h-screen overflow-hidden" style={{ backgroundColor: '#1a1a2e' }}>
        {/* ── Background: Pixel grid pattern ── */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(74,222,128,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.3) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* ── Scatter phase: GameBoard with fields animating from form -> random ── */}
        {scattering && (
          <GameBoard
            gameState={gameState}
            showSnake={false}
            animateFields={true}
            className="absolute inset-0 z-[5] bg-transparent"
          />
        )}

        {/* ── Pre-game: Pixel-art login form ── */}
        {!started && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center z-10 p-4 transition-opacity duration-500",
            scattering ? "opacity-0 pointer-events-none" : "opacity-100"
          )}>
            <div className="w-full max-w-md pixel-bevel p-0" style={{ backgroundColor: '#25253e' }}>
              {/* Title bar */}
              <div className="flex items-center px-3 py-2" style={{
                backgroundColor: '#4ade80',
                borderBottom: '3px solid #166534',
              }}>
                <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-pixel)', color: '#1a1a2e' }}>
                  CREATE ACCOUNT
                </span>
                <div className="ml-auto flex gap-1">
                  <div className="w-3 h-3 pixel-bevel" style={{ backgroundColor: '#ef4444' }} />
                </div>
              </div>

              <div className="p-6 space-y-5">
                <p className="text-center text-xs" style={{ fontFamily: 'var(--font-pixel)', color: '#9090b0' }}>
                  Fill in the form to sign up
                </p>

                {/* Name field */}
                <div className="space-y-2">
                  <label className="text-xs text-primary block" style={{ fontFamily: 'var(--font-pixel)' }}>Name</label>
                  <div className="pixel-bevel-inset p-2" style={{ backgroundColor: '#1a1a2e' }}>
                    <input
                      type="text"
                      placeholder="Your name"
                      className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                      style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.625rem' }}
                    />
                  </div>
                </div>

                {/* Email field */}
                <div className="space-y-2">
                  <label className="text-xs text-primary block" style={{ fontFamily: 'var(--font-pixel)' }}>Email</label>
                  <div className="pixel-bevel-inset p-2" style={{ backgroundColor: '#1a1a2e' }}>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                      style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.625rem' }}
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-2">
                  <label className="text-xs text-primary block" style={{ fontFamily: 'var(--font-pixel)' }}>Password</label>
                  <div className="pixel-bevel-inset p-2" style={{ backgroundColor: '#1a1a2e' }}>
                    <input
                      ref={passwordRef}
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                      style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.625rem' }}
                      onKeyDown={handlePasswordKeyDown}
                      onFocus={(e) => { e.target.placeholder = "Try typing..."; }}
                      onBlur={(e) => { e.target.placeholder = "••••••••"; }}
                    />
                  </div>
                  <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.5rem' }}>
                    Go ahead, type your password...
                  </p>
                </div>

                {/* Sign up button */}
                <button
                  type="button"
                  className="w-full py-2 px-4 pixel-bevel cursor-pointer text-xs font-bold"
                  style={{
                    fontFamily: 'var(--font-pixel)',
                    backgroundColor: '#4ade80',
                    color: '#1a1a2e',
                  }}
                >
                  SIGN UP
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Active game: DOM-rendered board ── */}
        {started && (
          <GameBoard
            gameState={gameState}
            className={cn(
              "absolute inset-0 transition-colors duration-150 z-10",
              isFlashing ? "bg-red-600/40" : penaltyFlash ? "bg-red-900/30" : "bg-transparent",
            )}
          />
        )}

        {/* HUD */}
        {started && (
          <div className="absolute top-4 right-4 z-20 flex gap-2 items-start">
            <div className="relative">
              <div className="pixel-bevel px-3 py-1.5 transition-colors duration-200" style={{
                backgroundColor: penaltyFlash ? '#ef4444' : '#3b3b5c',
                fontFamily: 'var(--font-pixel)',
                fontSize: '0.625rem',
                color: penaltyFlash ? '#ffffff' : '#4ade80',
              }}>
                {timerDisplay}
              </div>
              {penaltyFlash && (
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2" style={{
                  fontFamily: 'var(--font-pixel)',
                  fontSize: '0.5rem',
                  color: '#ef4444',
                  whiteSpace: 'nowrap',
                }}>
                  -{penaltyAmount}s
                </div>
              )}
            </div>
            <div className="pixel-bevel px-3 py-1.5" style={{ backgroundColor: '#3b3b5c', fontFamily: 'var(--font-pixel)', fontSize: '0.625rem', color: '#ef4444' }}>
              DEATHS: {deaths}
            </div>
          </div>
        )}

        <InputOverlay
          field={capturedField}
          onConfirm={handleInputConfirm}
          onCharTyped={handleCharTyped}
          onFailedValidation={handleFailedValidation}
          storedPassword={getFieldValue("Password")}
        />

        {showFailed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}>
            <div className="pixel-bevel p-8 text-center" style={{ backgroundColor: '#25253e' }}>
              <p className="text-destructive font-bold mb-2" style={{ fontFamily: 'var(--font-pixel)', fontSize: '1rem' }}>
                TIME&apos;S UP!
              </p>
              <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.625rem' }}>
                Starting again...
              </p>
            </div>
          </div>
        )}

        {showTooltip && started && !capturedField && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
            <div className="pixel-bevel px-4 py-2 pixel-blink" style={{ backgroundColor: '#25253e', fontFamily: 'var(--font-pixel)', fontSize: '0.5rem', color: '#4ade80' }}>
              USE ARROW KEYS OR WASD TO MOVE!
            </div>
          </div>
        )}
      </div>
    )};
