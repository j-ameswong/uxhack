import { useCallback } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useSnakeGame } from './hooks/useSnakeGame.js'
import { LoginPage } from './components/LoginPage.jsx'
import { InputOverlay } from './components/InputOverlay.jsx'
import { GameBoard } from './components/GameBoard.jsx'
import { GameProvider } from './context/GameContext.jsx'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './components/ui/card.jsx'
import { Button } from './components/ui/button.jsx'
import { Badge } from './components/ui/badge.jsx'
import { LeaderboardModal } from './components/LeaderboardModal.jsx'

// ── Game Page ────────────────────────────────────────────────

function GamePage() {
  const navigate = useNavigate()

  const onComplete = useCallback((result) => {
    navigate('/success', { state: result })
  }, [navigate])

  const {
    gameState,
    deaths,
    started,
    capturedField,
    showTooltip,
    showFailed,
    timerDisplay,
    beginGame,
    handleInputConfirm,
    getFieldValue,
  } = useSnakeGame({ onComplete })

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Game board — always mounted */}
      <GameBoard gameState={gameState} className="absolute inset-0" />

      {/* Start screen */}
      {!started && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-background/80 backdrop-blur-sm">
          <Card className="text-center max-w-sm w-[90%] shadow-2xl">
            <CardHeader>
              <div className="text-7xl mb-2">🐍</div>
              <CardTitle className="text-5xl tracking-wider font-mono">
                SnakeUp
              </CardTitle>
              <CardDescription className="text-base">
                The form that fights back.
              </CardDescription>
              <p className="text-sm text-muted-foreground">
                Use arrow keys or WASD to move
              </p>
            </CardHeader>
            <CardFooter className="justify-center">
              <Button
                onClick={beginGame}
                size="lg"
                className="px-8 text-lg font-mono tracking-wide shadow-md cursor-pointer"
              >
                PLAY
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* HUD */}
      {started && (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Badge variant="secondary" className="text-sm px-3 py-1.5 font-mono">
            {timerDisplay}
          </Badge>
          <Badge variant="destructive" className="text-sm px-3 py-1.5 font-mono">
            Deaths: {deaths}
          </Badge>
        </div>
      )}

      {/* Time's up overlay */}
      {showFailed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/90">
          <Card className="text-center p-8 border-destructive border-2 shadow-[0_0_40px_rgba(255,68,68,0.3)]">
            <CardContent className="space-y-2 pt-0">
              <p className="text-4xl font-bold text-destructive font-mono">
                Time&apos;s up! You failed.
              </p>
              <p className="text-lg text-muted-foreground font-mono">
                Starting again...
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Input overlay */}
      <InputOverlay
        field={capturedField}
        onConfirm={handleInputConfirm}
        storedPassword={getFieldValue('Password')}
      />

      {/* Tooltip */}
      {showTooltip && started && !capturedField && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
          <Badge variant="outline" className="px-4 py-2 text-sm animate-pulse font-mono bg-background/80 backdrop-blur-sm">
            Use arrow keys or WASD to move! Chase the fields to fill them in.
          </Badge>
        </div>
      )}
    </div>
  )
}

// ── Success Page ─────────────────────────────────────────────

function SuccessPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { rank, id, deaths, timeMs, submitError } = location.state ?? {}

  function formatTime(ms) {
    if (ms == null) return '--:--'
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const centis = Math.floor((ms % 1000) / 10)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      {/* Animated blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      <Card className="relative max-w-lg w-full backdrop-blur-sm bg-white/80 shadow-2xl border-0 text-center">
        <CardHeader>
          <div className="text-6xl mb-2">🎉</div>
          <CardTitle className="text-3xl">You signed up!</CardTitle>
          <CardDescription className="text-base">
            The snake has been fed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-center gap-3">
              {rank != null && (
                <Badge variant="secondary" className="text-sm px-3 py-1.5">
                  Rank #{rank}
                </Badge>
              )}
              {timeMs != null && (
                <Badge variant="outline" className="text-sm px-3 py-1.5 font-mono">
                  {formatTime(timeMs)}
                </Badge>
              )}
              {deaths != null && (
                <Badge variant="destructive" className="text-sm px-3 py-1.5">
                  {deaths} death{deaths !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          {submitError && (
            <p className="text-sm text-muted-foreground">
              Couldn&apos;t save your score — server unavailable.
            </p>
          )}
          {!submitError && (
            <LeaderboardModal currentId={id} currentRank={rank} />
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <Button onClick={() => navigate('/game')} size="lg" className="cursor-pointer">
            Play Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

// ── Leaderboard placeholder ──────────────────────────────────

function LeaderboardPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 gap-4">
      <div className="w-full max-w-md">
        <LeaderboardModal />
      </div>
      <Button variant="outline" onClick={() => navigate('/')} className="cursor-pointer">
        Back
      </Button>
    </div>
  )
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
  )
}
