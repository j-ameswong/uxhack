import { useEffect, useRef } from 'react';
import { GameEngine } from '../game/engine.js';
import { draw } from '../game/draw.js';
import { TICK_RATE_MS } from '../game/constants.js';
import { useKeyboard } from './useKeyboard.js';

export function useGameLoop(canvasRef, { onDeath } = {}) {
  const engineRef = useRef(null);

  useKeyboard(engineRef);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const engine = new GameEngine({
      onDeath: onDeath ?? (() => {}),
    });
    engineRef.current = engine;

    engine.start(
      ctx,
      () => ({ width: canvas.width, height: canvas.height }),
      draw,
      TICK_RATE_MS
    );

    return () => {
      engine.stop();
      engineRef.current = null;
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef, onDeath]);
}
