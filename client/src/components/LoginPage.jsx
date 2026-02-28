// ============================================================
//  LoginPage.jsx
//  Figma-styled login form. Typing in password starts the snake game.
//  Uses useSnakeGame hook + GameBoard (DOM) instead of canvas.
// ============================================================

import { useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSnakeGame } from "../hooks/useSnakeGame.js";
import { GameBoard } from "./GameBoard.jsx";
import { InputOverlay } from "./InputOverlay.jsx";
import { cn } from "./ui/utils.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "./ui/card.jsx";
import { Input } from "./ui/input.jsx";
import { Label } from "./ui/label.jsx";
import { Button } from "./ui/button.jsx";
import { Badge } from "./ui/badge.jsx";
import { Lock, Mail, User, LogIn } from "lucide-react";

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
    capturedField,
    showTooltip,
    showFailed,
    timerDisplay,
    isFlashing,
    beginGame,
    handleInputConfirm,
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
    <div className="relative w-full h-screen overflow-hidden">
      {/* ── Pre-game: Figma login form ── */}
      {!started && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 z-10 p-4">
          {/* Animated blobs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
          </div>

          <Card className="w-full max-w-md relative backdrop-blur-sm bg-white/80 shadow-2xl border-0">
            <CardHeader className="space-y-1 text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                  <LogIn className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl">Create Account</CardTitle>
              <CardDescription className="text-base">
                Fill in the form to sign up
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm">
                  Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    className="pl-10 h-11 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10 h-11 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    ref={passwordRef}
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-11 bg-white"
                    onKeyDown={handlePasswordKeyDown}
                    onFocus={(e) => {
                      e.target.placeholder = "Try typing...";
                    }}
                    onBlur={(e) => {
                      e.target.placeholder = "••••••••";
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Go ahead, type your password...
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="button"
                className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign Up
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* ── Active game: DOM-rendered board ── */}
      {started && (
        <GameBoard
          gameState={gameState}
          className={cn(
            "absolute inset-0 transition-colors duration-100",
            isFlashing && "bg-red-600",
          )}
        />
      )}

      {/* HUD */}
      {started && (
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <Badge variant="secondary" className="text-sm px-3 py-1.5 font-mono">
            {timerDisplay}
          </Badge>
          <Badge
            variant="destructive"
            className="text-sm px-3 py-1.5 font-mono"
          >
            Deaths: {deaths}
          </Badge>
        </div>
      )}

      {/* Input overlay when field captured */}
      <InputOverlay
        field={capturedField}
        onConfirm={handleInputConfirm}
        storedPassword={getFieldValue("Password")}
      />

      {/* Death Flash Overlay */}
      {isFlashing && (
        <div className="absolute inset-0 bg-red-600/40 z-1000 pointer-events-none mix-blend-overlay" />
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

      {/* Tooltip */}
      {showTooltip && started && !capturedField && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
          <Badge
            variant="outline"
            className="px-4 py-2 text-sm animate-pulse font-mono bg-background/80 backdrop-blur-sm"
          >
            Use arrow keys or WASD to move! Chase the fields to fill them in.
          </Badge>
        </div>
      )}
    </div>
  );
}
