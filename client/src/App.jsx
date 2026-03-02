import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { LandingPage } from "./components/LandingPage.jsx";
import { LoginPage } from "./components/LoginPage.jsx";
import { GameProvider } from "./context/GameContext.jsx";
import { LeaderboardModal } from "./components/LeaderboardModal.jsx";

// ── Standalone Leaderboard Page ──────────────────────────────
// Accessible at /leaderboard — shows the global top-10 without any game context.

function LeaderboardPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full overflow-y-auto p-4" style={{ backgroundColor: '#1a1a2e' }}>
      <div
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(74,222,128,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.3) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      <div className="relative pixel-bevel max-w-lg w-full mx-auto text-center my-8" style={{ backgroundColor: '#25253e' }}>
        <div className="flex items-center px-3 py-2" style={{ backgroundColor: '#4ade80', borderBottom: '3px solid #166534' }}>
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.5rem', color: '#1a1a2e', fontWeight: 'bold' }}>
            LEADERBOARD
          </span>
        </div>
        <div className="p-8 space-y-6">
          <LeaderboardModal />
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 pixel-bevel cursor-pointer font-bold"
            style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.625rem', backgroundColor: '#3b3b5c', color: '#4ade80' }}
          >
            BACK
          </button>
        </div>
      </div>
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
          <Route path="/game" element={<Navigate to="/signup" replace />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Routes>
      </BrowserRouter>
    </GameProvider>
  );
}
