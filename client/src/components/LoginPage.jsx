// ============================================================
//  LoginPage.jsx
//  Corporate login form with glitch transition to pixel-art game.
//  Pre-game form uses clean glassmorphic design; typing fills a
//  decaying progress bar that triggers glitch flashes and advances
//  the active field sequentially. On submit, transitions to the
//  pixel-art snake game via a field fade-in + scatter animation.
// ============================================================

import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSnakeGame } from "../hooks/useSnakeGame.js";
import { useAudio } from "../hooks/useAudio.js";
import { GameBoard } from "./GameBoard.jsx";
import { InputOverlay } from "./InputOverlay.jsx";
import { cn } from "./ui/utils.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card.jsx";
import { Input } from "./ui/input.jsx";
import { Label } from "./ui/label.jsx";
import { Button } from "./ui/button.jsx";
import { Mail, User, LogIn, PawPrint } from "lucide-react";

// TODO: Rework all mentions of "password" in engine field labels (fields.js, engine.js,
// InputOverlay) from "Password"/"Verify Password" to "Email"/"Verify Email".
// The progressive password rules gimmick should be moved to the email game field instead.
// TODO: Wire the "secret" animal selection into the game engine rework.

const FIELD_ORDER = ["name", "email", "verifyEmail", "secret"];
const BAR_FILL_PER_INPUT = 20;   // progress points added per keypress
const BAR_DECAY_INTERVAL_MS = 100;
const BAR_DECAY_AMOUNT = 1;       // points drained per interval tick

const ANIMALS = [
  "Axolotl", "Capybara", "Cassowary", "Dingo", "Echidna",
  "Fennec Fox", "Honey Badger", "Komodo Dragon", "Mantis Shrimp",
  "Narwhal", "Okapi", "Pangolin", "Quokka", "Tapir", "Wombat",
];

export function LoginPage() {
  const navigate = useNavigate();
  const { play: playAudio } = useAudio();
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formVerifyEmail, setFormVerifyEmail] = useState("");
  const [formSecret, setFormSecret] = useState("");

  // Sequential field progression: always start on "name"
  const [activeField, setActiveField] = useState("name");
  const activeFieldRef = useRef("name");
  useEffect(() => { activeFieldRef.current = activeField; }, [activeField]);

  // Play audio whenever the active field switches (skip first render)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    playAudio('fieldSwitch');
  }, [activeField]); // eslint-disable-line react-hooks/exhaustive-deps

  // Shake state
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const completedFields = useRef(new Set());
  const shakeTimer = useRef(null);

  // Glitch flash state
  const [glitchFlash, setGlitchFlash] = useState(false);
  const glitchTimer = useRef(null);

  // Decaying progress bar (0–100)
  const [barProgress, setBarProgress] = useState(0);

  // Show validation hints after the first loop-back (user has cycled through all fields)
  const [hasLooped, setHasLooped] = useState(false);

  // Pixel-art reveal on submit
  const [pixelReveal, setPixelReveal] = useState(false);
  const [pixelRevealFading, setPixelRevealFading] = useState(false);
  const pixelRevealTimer = useRef(null);
  const pixelRevealFadeTimer = useRef(null);

  const onComplete = useCallback(
    (result) => { navigate("/leaderboard", { state: result }); },
    [navigate],
  );

  const {
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
    beginGame,
    handleInputConfirm,
    handleCharTyped,
    handleFailedValidation,
    getFieldValue,
  } = useSnakeGame({ onComplete });

  // Bar decay: drain at a fixed rate while on the pre-game form
  useEffect(() => {
    if (started) return;
    const id = setInterval(() => {
      setBarProgress(p => Math.max(0, p - BAR_DECAY_AMOUNT));
    }, BAR_DECAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [started]);

  // Bar advance: when bar hits 100, trigger glitch flash and advance to the next field.
  // On the last field (secret), loops back to "name".
  useEffect(() => {
    if (started || barProgress < 100) return;
    setBarProgress(0);
    const currentIdx = FIELD_ORDER.indexOf(activeFieldRef.current);
    const nextIdx = (currentIdx + 1) % FIELD_ORDER.length;
    if (nextIdx === 0) setHasLooped(true);
    setGlitchFlash(true);
    setActiveField(FIELD_ORDER[nextIdx]);
    clearTimeout(glitchTimer.current);
    glitchTimer.current = setTimeout(() => setGlitchFlash(false), 120);
  }, [barProgress, started]);

  // Auto-focus the active field after a swap
  useEffect(() => {
    if (started) return;
    const el = document.getElementById(activeField);
    if (el) requestAnimationFrame(() => el.focus());
  }, [activeField, started]);

  const nameValid = formName.trim().length > 0;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail.trim());
  const verifyEmailValid = formVerifyEmail === formEmail && formEmail.length > 0;
  const secretValid = formSecret.length > 0;
  const canSubmit = nameValid && emailValid && verifyEmailValid && secretValid;

  const isActive = (field) => activeField === field;

  function triggerShake() {
    setIsShaking(true);
    clearTimeout(shakeTimer.current);
    shakeTimer.current = setTimeout(() => setIsShaking(false), 150);
  }

  function fillBar() {
    setBarProgress(p => Math.min(100, p + BAR_FILL_PER_INPUT));
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
    fillBar();
    checkFieldCompletion(fieldName, validator(value));
  }

  // Enter key fills the bar (and prevents keyboard form submission)
  function handleInputKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      fillBar();
    }
  }

  function handleSubmit() {
    if (!canSubmit || started || pixelReveal) return;

    // Show the pixel-art version for 2s, then start the game sequence simultaneously
    // with the overlay fade-out so there is no gap where the login form reappears.
    setPixelReveal(true);
    setPixelRevealFading(false);
    clearTimeout(pixelRevealTimer.current);
    clearTimeout(pixelRevealFadeTimer.current);
    pixelRevealFadeTimer.current = setTimeout(() => {
      setPixelRevealFading(true);
      // Begin game immediately — fieldsFadingIn hides the login form while the
      // pixel overlay is still fading out (400 ms overlap, looks like a cross-fade).
      beginGame({ name: formName, email: formEmail, secret: formSecret });
    }, 2000);
    pixelRevealTimer.current = setTimeout(() => {
      setPixelReveal(false);
      setPixelRevealFading(false);
    }, 2400);
  }

  const shakeOffset = shakeIntensity * 2;
  const shakeStyle = isShaking
    ? {
        animation: `card-shake 0.15s ease-in-out`,
        '--shake-x': `${shakeOffset}px`,
        '--shake-y': `${shakeOffset}px`,
      }
    : {};

  // Bar colour: green → yellow → red as it fills
  const barColor = barProgress < 40 ? '#4ade80' : barProgress < 70 ? '#facc15' : '#ef4444';

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* ── Keyframes ── */}
      <style>{`
        @keyframes card-shake {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(var(--shake-x), calc(var(--shake-y) * -1)); }
          40% { transform: translate(calc(var(--shake-x) * -1), var(--shake-y)); }
          60% { transform: translate(var(--shake-x), calc(var(--shake-y) * 0.5)); }
          80% { transform: translate(calc(var(--shake-x) * -0.5), calc(var(--shake-y) * -1)); }
        }
        @keyframes field-appear {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes countdown-sweep {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: 100; }
        }
        @keyframes hud-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* ── Glitch flash / submit pixel-art reveal ── */}
      {(glitchFlash || pixelReveal) && !started && (
        <div
          className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center p-4"
          style={{
            backgroundColor: '#1a1a2e',
            transition: pixelReveal ? 'opacity 400ms ease-in' : 'none',
            opacity: pixelRevealFading ? 0 : 1,
          }}
        >
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(74,222,128,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.3) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
          {/* Pixel-art form replica — TODO: update labels when engine fields are reworked */}
          <div className="w-full max-w-md pixel-bevel p-0 relative" style={{ backgroundColor: '#25253e', fontFamily: 'var(--font-pixel)' }}>
            <div className="flex items-center px-3 py-2" style={{ backgroundColor: '#4ade80', borderBottom: '3px solid #166534' }}>
              <span className="text-xs font-bold" style={{ color: '#1a1a2e' }}>CREATE ACCOUNT</span>
              <div className="ml-auto flex gap-1">
                <div className="w-3 h-3 pixel-bevel" style={{ backgroundColor: '#ef4444' }} />
              </div>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-center text-xs" style={{ color: '#9090b0' }}>Fill in the form to sign up</p>
              {['Name', 'Email', 'Verify Email', 'Secret'].map((label) => (
                <div key={label} className="space-y-2">
                  <span className="text-xs text-primary block">{label}</span>
                  <div className="pixel-bevel-inset p-2" style={{ backgroundColor: '#1a1a2e' }}>
                    <div className="h-4" />
                  </div>
                </div>
              ))}
              <div className="w-full py-2 px-4 pixel-bevel text-center text-xs font-bold" style={{ backgroundColor: '#3b3b5c', color: '#6a6a8a', opacity: 0.5 }}>
                SIGN UP
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Dark game background — visible while card fades, fields fade in, scatter, and game ── */}
      {(cardFading || fieldsFadingIn || scattering || started) && (
        <div className="absolute inset-0" style={{ backgroundColor: '#1a1a2e' }}>
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(74,222,128,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.3) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
        </div>
      )}

      {/* ── GameBoard: fields fade in then scatter ── */}
      {(fieldsFadingIn || scattering) && !started && (
        <GameBoard
          gameState={gameState}
          showSnake={false}
          animateFields={false}
          fieldsFadingIn={fieldsFadingIn}
          showFireBorder={scattering}
          fireBorderFadeIn={true}
          className="absolute inset-0 z-[5] bg-transparent"
        />
      )}

      {/* ── Pre-game: Corporate glassmorphic login form ── */}
      {!started && !scattering && !pixelReveal && !fieldsFadingIn && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center z-10 p-4 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100",
            cardFading ? "pointer-events-none" : ""
          )}
          style={{
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          }}
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
              {/* Decaying progress bar */}
              <div className="mb-4 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${barProgress}%`,
                    backgroundColor: barColor,
                    transition: `width ${BAR_DECAY_INTERVAL_MS}ms linear, background-color 300ms ease`,
                  }}
                />
              </div>

              <form className="space-y-4" onSubmit={e => e.preventDefault()} autoComplete="off" style={{ '--ring': '#6366f1' }}>
                {/* Name field */}
                <div className="space-y-1 transition-opacity duration-200" style={{ opacity: isActive("name") ? 1 : 0.35 }}>
                  <Label htmlFor="name" className="text-gray-700 flex items-center gap-2" style={{ fontFamily: 'inherit', fontSize: '0.875rem' }}>
                    <User className="w-4 h-4" />
                    Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={formName}
                    onChange={(e) => handleFieldChange(setFormName, "name", e.target.value, (v) => v.trim().length > 0)}
                    onKeyDown={handleInputKeyDown}
                    autoFocus={isActive("name")}
                    disabled={!isActive("name")}
                    className="bg-white/50 text-gray-900 placeholder:text-gray-400"
                    style={{ fontFamily: 'inherit', fontSize: '0.875rem', borderRadius: '0.375rem' }}
                  />
                  {hasLooped && !nameValid && (
                    <p className="text-xs text-red-500">Name cannot be empty</p>
                  )}
                </div>

                {/* Email field */}
                <div className="space-y-1 transition-opacity duration-200" style={{ opacity: isActive("email") ? 1 : 0.35 }}>
                  <Label htmlFor="email" className="text-gray-700 flex items-center gap-2" style={{ fontFamily: 'inherit', fontSize: '0.875rem' }}>
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formEmail}
                    onChange={(e) => handleFieldChange(setFormEmail, "email", e.target.value, (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()))}
                    onKeyDown={handleInputKeyDown}
                    disabled={!isActive("email")}
                    className="bg-white/50 text-gray-900 placeholder:text-gray-400"
                    style={{ fontFamily: 'inherit', fontSize: '0.875rem', borderRadius: '0.375rem' }}
                  />
                  {hasLooped && !emailValid && (
                    <p className="text-xs text-red-500">Please enter a valid email</p>
                  )}
                </div>

                {/* Verify Email field */}
                <div className="space-y-1 transition-opacity duration-200" style={{ opacity: isActive("verifyEmail") ? 1 : 0.35 }}>
                  <Label htmlFor="verifyEmail" className="text-gray-700 flex items-center gap-2" style={{ fontFamily: 'inherit', fontSize: '0.875rem' }}>
                    <Mail className="w-4 h-4" />
                    Verify Email
                  </Label>
                  <Input
                    id="verifyEmail"
                    type="email"
                    placeholder="you@example.com"
                    value={formVerifyEmail}
                    onChange={(e) => handleFieldChange(setFormVerifyEmail, "verifyEmail", e.target.value, (v) => v === formEmail && formEmail.length > 0)}
                    onKeyDown={handleInputKeyDown}
                    disabled={!isActive("verifyEmail")}
                    className="bg-white/50 text-gray-900 placeholder:text-gray-400"
                    style={{ fontFamily: 'inherit', fontSize: '0.875rem', borderRadius: '0.375rem' }}
                  />
                  {hasLooped && !verifyEmailValid && (
                    <p className="text-xs text-red-500">Emails don&apos;t match</p>
                  )}
                </div>

                {/* Secret animal field */}
                <div className="space-y-1 transition-opacity duration-200" style={{ opacity: isActive("secret") ? 1 : 0.35 }}>
                  <Label htmlFor="secret" className="text-gray-700 flex items-center gap-2" style={{ fontFamily: 'inherit', fontSize: '0.875rem' }}>
                    <PawPrint className="w-4 h-4" />
                    Secret
                  </Label>
                  <select
                    id="secret"
                    value={formSecret}
                    onChange={(e) => handleFieldChange(setFormSecret, "secret", e.target.value, (v) => v.length > 0)}
                    onKeyDown={handleInputKeyDown}
                    disabled={!isActive("secret")}
                    className="w-full bg-white/50 text-gray-900 border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'inherit', fontSize: '0.875rem', borderRadius: '0.375rem' }}
                  >
                    <option value="">Choose your spirit animal…</option>
                    {ANIMALS.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                  {hasLooped && !secretValid && (
                    <p className="text-xs text-red-500">Please choose an animal</p>
                  )}
                </div>

                <Button
                  type="button"
                  onClick={handleSubmit}
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
        <GameBoard
          gameState={gameState}
          showFireBorder={true}
          verifyAppearing={verifyAppearing}
          tickRate={tickRate}
          className={cn(
            "absolute inset-0 transition-colors duration-150 z-10",
            isFlashing ? "bg-red-600/40" : penaltyFlash ? "bg-red-900/30" : "bg-transparent",
          )}
        />
      )}

      {/* HUD */}
      {(scattering || started) && (
        <div className="absolute top-4 right-4 z-20 flex gap-2 items-start" style={{ animation: 'hud-fade-in 1.5s ease-in forwards' }}>
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
        loginName={formName}
        loginEmail={formEmail}
        loginSecret={formSecret}
      />

      {/* Post-input circular countdown (1 s) */}
      {showInputCountdown && started && (
        <div className="absolute inset-0 flex items-center justify-center z-25 pointer-events-none">
          <svg
            viewBox="0 0 40 40"
            width="80"
            height="80"
            style={{ transform: 'rotate(-90deg)' }}
          >
            <circle
              cx="20"
              cy="20"
              r="15.9"
              fill="none"
              stroke="rgba(74,222,128,0.85)"
              strokeWidth="2.5"
              strokeDasharray="100"
              strokeDashoffset="0"
              strokeLinecap="round"
              style={{ animation: 'countdown-sweep 1s linear forwards' }}
            />
          </svg>
        </div>
      )}

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
