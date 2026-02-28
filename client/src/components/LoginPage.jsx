// ============================================================
//  LoginPage.jsx
//  Corporate login form with glitch transition to pixel-art game.
//  Pre-game form uses clean glassmorphic design; typing triggers
//  random glitch flashes of the game screen. On submit, transitions
//  to pixel-art snake game.
// ============================================================

import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSnakeGame } from "../hooks/useSnakeGame.js";
import { GameBoard } from "./GameBoard.jsx";
import { InputOverlay } from "./InputOverlay.jsx";
import { cn } from "./ui/utils.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "./ui/card.jsx";
import { Input } from "./ui/input.jsx";
import { Label } from "./ui/label.jsx";
import { Button } from "./ui/button.jsx";
import { Lock, Mail, User, LogIn } from "lucide-react";
import { GRID_COLS, GRID_ROWS } from "../game/constants.js";

const FIELD_NAMES = ["name", "email", "password"];

function pickRandomField(exclude) {
  const others = FIELD_NAMES.filter((f) => f !== exclude);
  return others[Math.floor(Math.random() * others.length)];
}

export function LoginPage() {
  const navigate = useNavigate();
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");

  // Only one field is editable at a time — randomly selected
  const [activeField, setActiveField] = useState(
    () => FIELD_NAMES[Math.floor(Math.random() * FIELD_NAMES.length)]
  );

  // Shake state
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const completedFields = useRef(new Set());
  const shakeTimer = useRef(null);

  // Glitch flash state
  const [glitchFlash, setGlitchFlash] = useState(false);
  const glitchTimer = useRef(null);
  const glitchPityCounter = useRef(0);

  const onComplete = useCallback(
    (result) => {
      navigate("/success", { state: result });
    },
    [navigate],
  );

  const {
    engineRef,
    gameState,
    deaths,
    started,
    scattering,
    cardFading,
    deathCountdown,
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

  const nameValid = formName.trim().length > 0;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail.trim());
  const passwordValid = formPassword.length >= 1;
  const canSubmit = nameValid && emailValid && passwordValid;

  const isActive = (field) => activeField === field;

  // Auto-focus the newly active field after a swap
  useEffect(() => {
    if (started) return;
    const fieldIdMap = { name: "name", email: "email", password: "password" };
    const el = document.getElementById(fieldIdMap[activeField]);
    if (el) {
      // Small delay so the disabled attr is removed first
      requestAnimationFrame(() => el.focus());
    }
  }, [activeField, started]);

  function triggerShake() {
    setIsShaking(true);
    clearTimeout(shakeTimer.current);
    shakeTimer.current = setTimeout(() => setIsShaking(false), 150);
  }

  function maybeGlitch() {
    glitchPityCounter.current += 1;
    if (Math.random() < 0.10 || glitchPityCounter.current >= 8) {
      glitchPityCounter.current = 0;
      setGlitchFlash(true);
      // Swap active field to a different random one
      setActiveField((prev) => pickRandomField(prev));
      clearTimeout(glitchTimer.current);
      glitchTimer.current = setTimeout(() => setGlitchFlash(false), 120);
    }
  }

  function checkFieldCompletion(fieldName, isValid) {
    if (isValid && !completedFields.current.has(fieldName)) {
      completedFields.current.add(fieldName);
      setShakeIntensity((prev) => Math.min(prev + 1, 3));
    }
  }

  function handleFieldChange(setter, fieldName, value, validator) {
    setter(value);
    triggerShake();
    maybeGlitch();
    checkFieldCompletion(fieldName, validator(value));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit || started) return;

    // Measure actual form input positions and align game fields to match
    const cellW = window.innerWidth / GRID_COLS;
    const cellH = window.innerHeight / GRID_ROWS;
    const fields = engineRef.current?.fields;

    if (fields) {
      ['name', 'email', 'password'].forEach((id, i) => {
        const el = document.getElementById(id);
        if (el && fields[i]) {
          const rect = el.getBoundingClientRect();
          // Center the game field on the form input's center
          fields[i].col = Math.round((rect.left + rect.width / 2) / cellW - fields[i].width / 2);
          fields[i].row = Math.round((rect.top + rect.height / 2) / cellH - fields[i].height / 2);
        }
      });
      // Push updated positions to game state
      engineRef.current.onTick({
        snake: [...engineRef.current.snake],
        fields: engineRef.current.fields,
        gameOver: false,
      });
    }

    beginGame();
  }

  const shakeOffset = shakeIntensity * 2;
  const shakeStyle = isShaking
    ? {
        animation: `card-shake 0.15s ease-in-out`,
        '--shake-x': `${shakeOffset}px`,
        '--shake-y': `${shakeOffset}px`,
      }
    : {};

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* ── Shake keyframes ── */}
      <style>{`
        @keyframes card-shake {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(var(--shake-x), calc(var(--shake-y) * -1)); }
          40% { transform: translate(calc(var(--shake-x) * -1), var(--shake-y)); }
          60% { transform: translate(var(--shake-x), calc(var(--shake-y) * 0.5)); }
          80% { transform: translate(calc(var(--shake-x) * -0.5), calc(var(--shake-y) * -1)); }
        }
      `}</style>

      {/* ── Glitch flash: pixel-art version of the form ── */}
      {glitchFlash && !started && (
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center p-4" style={{ backgroundColor: '#1a1a2e' }}>
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(74,222,128,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.3) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
          {/* Pixel-art form replica */}
          <div className="w-full max-w-md pixel-bevel p-0 relative" style={{ backgroundColor: '#25253e', fontFamily: 'var(--font-pixel)' }}>
            <div className="flex items-center px-3 py-2" style={{
              backgroundColor: '#4ade80',
              borderBottom: '3px solid #166534',
            }}>
              <span className="text-xs font-bold" style={{ color: '#1a1a2e' }}>CREATE ACCOUNT</span>
              <div className="ml-auto flex gap-1">
                <div className="w-3 h-3 pixel-bevel" style={{ backgroundColor: '#ef4444' }} />
              </div>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-center text-xs" style={{ color: '#9090b0' }}>Fill in the form to sign up</p>
              {['Name', 'Email', 'Password'].map((label) => (
                <div key={label} className="space-y-2">
                  <span className="text-xs text-primary block">{label}</span>
                  <div className="pixel-bevel-inset p-2" style={{ backgroundColor: '#1a1a2e' }}>
                    <div className="h-4" />
                  </div>
                </div>
              ))}
              <div className="w-full py-2 px-4 pixel-bevel text-center text-xs font-bold" style={{
                backgroundColor: '#3b3b5c',
                color: '#6a6a8a',
                opacity: 0.5,
              }}>
                SIGN UP
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Scatter phase: GameBoard with fields animating from form -> random ── */}
      {scattering && (
        <GameBoard
          gameState={gameState}
          showSnake={false}
          animateFields={false}
          className="absolute inset-0 z-[5] bg-transparent"
        />
      )}

      {/* ── Pre-game: Corporate glassmorphic login form ── */}
      {!started && !scattering && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center z-10 p-4 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100",
            cardFading ? "pointer-events-none" : ""
          )}
          style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
        >
          {/* Animated background blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
            <div className="absolute -bottom-40 left-1/2 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
          </div>

          <Card
            className={cn(
              "w-full max-w-md backdrop-blur-sm bg-white/80 shadow-2xl border-0 relative rounded-xl transition-opacity duration-500",
              cardFading ? "opacity-0" : "opacity-100"
            )}
            style={{ ...shakeStyle, borderRadius: '0.75rem' }}
          >
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'inherit', fontSize: '1.5rem', lineHeight: '1.4' }}>Create Account</CardTitle>
              <CardDescription className="text-gray-500" style={{ fontFamily: 'inherit', fontSize: '0.875rem' }}>Fill in the form to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit} style={{ '--ring': '#6366f1' }}>
                {/* Name field */}
                <div className="space-y-2 transition-opacity duration-200" style={{ opacity: isActive("name") ? 1 : 0.35 }}>
                  <Label htmlFor="name" className="text-gray-700 flex items-center gap-2" style={{ fontFamily: 'inherit', fontSize: '0.875rem' }}>
                    <User className="w-4 h-4" />
                    Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={formName}
                    onChange={(e) =>
                      handleFieldChange(setFormName, "name", e.target.value, (v) => v.trim().length > 0)
                    }
                    autoFocus={isActive("name")}
                    disabled={!isActive("name")}
                    className="bg-white/50 text-gray-900 placeholder:text-gray-400"
                    style={{ fontFamily: 'inherit', fontSize: '0.875rem', borderRadius: '0.375rem' }}
                  />
                </div>

                {/* Email field */}
                <div className="space-y-2 transition-opacity duration-200" style={{ opacity: isActive("email") ? 1 : 0.35 }}>
                  <Label htmlFor="email" className="text-gray-700 flex items-center gap-2" style={{ fontFamily: 'inherit', fontSize: '0.875rem' }}>
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formEmail}
                    onChange={(e) =>
                      handleFieldChange(setFormEmail, "email", e.target.value, (v) =>
                        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
                      )
                    }
                    disabled={!isActive("email")}
                    className="bg-white/50 text-gray-900 placeholder:text-gray-400"
                    style={{ fontFamily: 'inherit', fontSize: '0.875rem', borderRadius: '0.375rem' }}
                  />
                </div>

                {/* Password field */}
                <div className="space-y-2 transition-opacity duration-200" style={{ opacity: isActive("password") ? 1 : 0.35 }}>
                  <Label htmlFor="password" className="text-gray-700 flex items-center gap-2" style={{ fontFamily: 'inherit', fontSize: '0.875rem' }}>
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formPassword}
                    onChange={(e) =>
                      handleFieldChange(setFormPassword, "password", e.target.value, (v) => v.length >= 1)
                    }
                    disabled={!isActive("password")}
                    className="bg-white/50 text-gray-900 placeholder:text-gray-400"
                    style={{ fontFamily: 'inherit', fontSize: '0.875rem', borderRadius: '0.375rem' }}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                  style={{ fontFamily: 'inherit', fontSize: '0.875rem', borderRadius: '0.375rem' }}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign Up
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Active game: DOM-rendered board ── */}
      {started && (
        <>
          <div className="absolute inset-0" style={{ backgroundColor: '#1a1a2e' }}>
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: 'linear-gradient(rgba(74,222,128,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.3) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
          </div>
          <GameBoard
            gameState={gameState}
            className={cn(
              "absolute inset-0 transition-colors duration-150 z-10",
              isFlashing ? "bg-red-600/40" : penaltyFlash ? "bg-red-900/30" : "bg-transparent",
            )}
          />
        </>
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

      {/* Death countdown */}
      {deathCountdown != null && (
        <div className="absolute inset-0 flex items-center justify-center z-25 pointer-events-none">
          <div style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: '4rem',
            color: '#4ade80',
            textShadow: '4px 4px 0 #166534, 0 0 20px rgba(74,222,128,0.5)',
          }}>
            {deathCountdown}
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
  );
}
