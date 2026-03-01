import { useCallback, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useSnakeGame } from "./hooks/useSnakeGame.js";
import { useGameContext } from "./context/GameContext.jsx";
import { LandingPage } from "./components/LandingPage.jsx";
import { LoginPage } from "./components/LoginPage.jsx";
import { InputOverlay } from "./components/InputOverlay.jsx";
import { GameBoard } from "./components/GameBoard.jsx";
import { GameProvider } from "./context/GameContext.jsx";
import { LeaderboardModal } from "./components/LeaderboardModal.jsx";

// ── Game Page ────────────────────────────────────────────────

function GamePage() {
  const navigate = useNavigate();

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
    capturedField,
    showTooltip,
    deathCountdown,
    showFailed,
    timerDisplay,
    penaltyFlash,
    penaltyAmount,
    beginGame,
    handleInputConfirm,
    handleCharTyped,
    handleFailedValidation,
    getFieldValue,
  } = useSnakeGame({ onComplete });

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ backgroundColor: '#1a1a2e' }}>
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(74,222,128,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.3) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Game board — always mounted */}
      <GameBoard gameState={gameState} className="absolute inset-0" />

      {/* Start screen */}
      {!started && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ backgroundColor: 'rgba(26,26,46,0.85)' }}>
          <div className="pixel-bevel text-center max-w-sm w-[90%] p-8" style={{ backgroundColor: '#25253e' }}>
            <div className="mb-4" style={{ fontFamily: 'var(--font-pixel)', fontSize: '2rem', color: '#4ade80' }}>
              SNAKEUP
            </div>
            <p className="mb-2" style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.5rem', color: '#9090b0' }}>
              The form that fights back.
            </p>
            <p className="mb-6" style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.5rem', color: '#6a6a8a' }}>
              Use arrow keys or WASD to move
            </p>
            <button
              onClick={beginGame}
              className="px-8 py-3 pixel-bevel cursor-pointer font-bold"
              style={{
                fontFamily: 'var(--font-pixel)',
                fontSize: '0.875rem',
                backgroundColor: '#4ade80',
                color: '#1a1a2e',
              }}
            >
              PLAY
            </button>
          </div>
        </div>
      )}

      {/* HUD */}
      {started && (
        <div className="absolute top-4 right-4 z-10 flex gap-2 items-start">
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

      {/* Time's up overlay */}
      {showFailed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}>
          <div className="pixel-bevel p-8 text-center" style={{ backgroundColor: '#25253e' }}>
            <p className="text-destructive font-bold mb-2" style={{ fontFamily: 'var(--font-pixel)', fontSize: '1rem' }}>
              TIME&apos;S UP!
            </p>
            <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.625rem', color: '#9090b0' }}>
              Starting again...
            </p>
          </div>
        </div>
      )}

      {/* Input overlay */}
      <InputOverlay
        field={capturedField}
        onConfirm={handleInputConfirm}
        onCharTyped={handleCharTyped}
        onFailedValidation={handleFailedValidation}
        storedPassword={getFieldValue("Password")}
      />

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

      {/* Tooltip */}
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

// ── Success Page ─────────────────────────────────────────────

const FRAME_COLORS = [
  { label: 'Gold',    value: '#ffd700' },
  { label: 'Crimson', value: '#dc143c' },
  { label: 'Cyan',    value: '#00ffff' },
  { label: 'Magenta', value: '#ff00ff' },
  { label: 'Lime',    value: '#00ff00' },
  { label: 'Orange',  value: '#ff8c00' },
  { label: 'Silver',  value: '#c0c0c0' },
];

function SuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { rank, id, deaths, timeMs, submitError } = location.state ?? {};
  const { getFieldValue } = useGameContext();

  const [displayName, setDisplayName] = useState(getFieldValue('Name') || '');
  const [editingName, setEditingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [frameColor, setFrameColor] = useState('#ffd700');
  const [frameColorSaved, setFrameColorSaved] = useState(false);
  const [leaderboardKey, setLeaderboardKey] = useState(0);

  function formatTime(ms) {
    if (ms == null) return "--:--";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centis = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${centis.toString().padStart(2, "0")}`;
  }

  async function saveName() {
    if (!displayName.trim() || !id) return;
    try {
      const res = await fetch(`/api/submit/${id}/name`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: displayName.trim() }),
      });
      if (res.ok) {
        setNameSaved(true);
        setEditingName(false);
        setLeaderboardKey(k => k + 1);
        setTimeout(() => setNameSaved(false), 2000);
      }
    } catch { /* silently fail */ }
  }

  async function saveFrameColor(color) {
    setFrameColor(color);
    if (!id) return;
    try {
      const res = await fetch(`/api/submit/${id}/frame-color`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frameColor: color }),
      });
      if (res.ok) {
        setFrameColorSaved(true);
        setLeaderboardKey(k => k + 1);
        setTimeout(() => setFrameColorSaved(false), 2000);
      }
    } catch { /* silently fail */ }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4" style={{ backgroundColor: '#1a1a2e' }}>
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(74,222,128,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.3) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative pixel-bevel max-w-lg w-full text-center" style={{ backgroundColor: '#25253e' }}>
        {/* Title bar */}
        <div className="flex items-center px-3 py-2" style={{
          backgroundColor: '#4ade80',
          borderBottom: '3px solid #166534',
        }}>
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.5rem', color: '#1a1a2e', fontWeight: 'bold' }}>
            SIGNUP COMPLETE
          </span>
        </div>

        <div className="p-8 space-y-6">
          <div className="mb-2 flex justify-center">
            <img
              src="https://media.tenor.com/DpJdyKQKgYkAAAAi/cat-jump.gif"
              style={{ width: 120, height: 120 }}
            />
          </div>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '1rem', color: '#4ade80' }}>
            &quot;SIGNUP&quot; SUCCESS!
          </div>
          <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.5rem', color: '#9090b0' }}>
            The snake has been fed.
          </p>

          {/* Editable display name */}
          {!submitError && id && (
            <div className="pixel-bevel p-3" style={{ backgroundColor: '#2a2a45' }}>
              <label style={{ ...{ fontFamily: 'var(--font-pixel)' }, fontSize: '0.4rem', color: '#6a6a8a' }}>
                DISPLAY NAME
              </label>
              <div className="flex items-center justify-center gap-2 mt-2">
                {editingName ? (
                  <>
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveName()}
                      maxLength={20}
                      autoFocus
                      className="pixel-bevel-inset px-2 py-1 text-center"
                      style={{
                        fontFamily: 'var(--font-pixel)',
                        fontSize: '0.5rem',
                        color: '#e0e0e0',
                        backgroundColor: '#1a1a2e',
                        border: 'none',
                        outline: 'none',
                        width: '140px',
                      }}
                    />
                    <button
                      onClick={saveName}
                      className="pixel-bevel px-2 py-1 cursor-pointer"
                      style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.4rem', backgroundColor: '#4ade80', color: '#1a1a2e' }}
                    >
                      SAVE
                    </button>
                    <button
                      onClick={() => { setEditingName(false); setDisplayName(getFieldValue('Name') || ''); }}
                      className="pixel-bevel px-2 py-1 cursor-pointer"
                      style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.4rem', backgroundColor: '#3b3b5c', color: '#9090b0' }}
                    >
                      X
                    </button>
                  </>
                ) : (
                  <>
                    <span className={rank != null && rank <= 3 ? 'rainbow-name' : ''} style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.625rem', color: rank != null && rank <= 3 ? undefined : '#e0e0e0' }}>
                      {displayName || '???'}
                    </span>
                    <button
                      onClick={() => setEditingName(true)}
                      className="pixel-bevel px-2 py-1 cursor-pointer"
                      style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.4rem', backgroundColor: '#3b3b5c', color: '#9090b0' }}
                    >
                      EDIT
                    </button>
                    {nameSaved && (
                      <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.4rem', color: '#4ade80' }}>SAVED!</span>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-center gap-3 flex-wrap">
            {rank != null && (
              <div className="pixel-bevel px-3 py-1.5" style={{ backgroundColor: '#3b3b5c', fontFamily: 'var(--font-pixel)', fontSize: '0.5rem', color: '#6366f1' }}>
                RANK #{rank}
              </div>
            )}
            {timeMs != null && (
              <div className="pixel-bevel px-3 py-1.5" style={{ backgroundColor: '#3b3b5c', fontFamily: 'var(--font-pixel)', fontSize: '0.5rem', color: '#4ade80' }}>
                {formatTime(timeMs)}
              </div>
            )}
            {deaths != null && (
              <div className="pixel-bevel px-3 py-1.5" style={{ backgroundColor: '#3b3b5c', fontFamily: 'var(--font-pixel)', fontSize: '0.5rem', color: '#ef4444' }}>
                {deaths} DEATH{deaths !== 1 ? "S" : ""}
              </div>
            )}
          </div>

          {/* Frame color selector — only for rank #1 */}
          {rank === 1 && !submitError && id && (
            <div className="pixel-bevel p-3" style={{ backgroundColor: '#2a2a45' }}>
              <label style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.4rem', color: '#6a6a8a' }}>
                #1 FRAME COLOR
              </label>
              <div className="flex items-center justify-center gap-2 mt-2">
                <select
                  value={frameColor}
                  onChange={e => saveFrameColor(e.target.value)}
                  className="pixel-bevel-inset px-2 py-1 cursor-pointer"
                  style={{
                    fontFamily: 'var(--font-pixel)',
                    fontSize: '0.5rem',
                    color: frameColor,
                    backgroundColor: '#1a1a2e',
                    border: 'none',
                    outline: 'none',
                  }}
                >
                  {FRAME_COLORS.map(c => (
                    <option key={c.value} value={c.value} style={{ color: c.value }}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <div
                  className="pixel-bevel"
                  style={{
                    width: 20,
                    height: 20,
                    backgroundColor: frameColor,
                    boxShadow: `0 0 8px ${frameColor}80`,
                  }}
                />
                {frameColorSaved && (
                  <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.4rem', color: '#4ade80' }}>SAVED!</span>
                )}
              </div>
            </div>
          )}

          {submitError && (
            <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.5rem', color: '#9090b0' }}>
              Couldn&apos;t save your score — server unavailable.
            </p>
          )}
          {!submitError && (
            <LeaderboardModal key={leaderboardKey} currentId={id} currentRank={rank} />
          )}

          <button
            onClick={() => navigate("/game")}
            className="px-6 py-2 pixel-bevel cursor-pointer font-bold"
            style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: '0.75rem',
              backgroundColor: '#4ade80',
              color: '#1a1a2e',
            }}
          >
            PLAY AGAIN
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Leaderboard placeholder ──────────────────────────────────

function LeaderboardPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-4" style={{ backgroundColor: '#1a1a2e' }}>
      <div className="w-full max-w-md">
        <LeaderboardModal />
      </div>
      <button
        onClick={() => navigate("/")}
        className="px-6 py-2 pixel-bevel cursor-pointer font-bold"
        style={{
          fontFamily: 'var(--font-pixel)',
          fontSize: '0.625rem',
          backgroundColor: '#3b3b5c',
          color: '#4ade80',
        }}
      >
        BACK
      </button>
    </div>
  );
}

// ── App root ─────────────────────────────────────────────────

export default function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<LoginPage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Routes>
      </BrowserRouter>
    </GameProvider>
  );
}
