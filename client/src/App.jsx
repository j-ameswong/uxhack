import { useCallback } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useSnakeGame } from "./hooks/useSnakeGame.js";
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

function SuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { rank, id, deaths, timeMs, submitError } = location.state ?? {};

  function formatTime(ms) {
    if (ms == null) return "--:--";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centis = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${centis.toString().padStart(2, "0")}`;
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
            SIGNUP SUCCESS!
          </div>
          <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.5rem', color: '#9090b0' }}>
            The snake has been fed.
          </p>

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

          {submitError && (
            <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.5rem', color: '#9090b0' }}>
              Couldn&apos;t save your score — server unavailable.
            </p>
          )}
          {!submitError && (
            <LeaderboardModal currentId={id} currentRank={rank} />
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
          <Route path="/" element={<LoginPage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Routes>
      </BrowserRouter>
    </GameProvider>
  );
}
