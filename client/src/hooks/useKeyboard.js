// ============================================================
//  useKeyboard.js
//  Captures arrow keys + WASD, calls preventDefault to stop
//  page scroll, feeds direction into the engine.
// ============================================================

import { useEffect } from 'react'

const KEY_MAP = {
  ArrowUp:    'up',
  ArrowDown:  'down',
  ArrowLeft:  'left',
  ArrowRight: 'right',
  KeyW:       'up',
  KeyS:       'down',
  KeyA:       'left',
  KeyD:       'right',
}

const ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])

export function useKeyboard(engineRef, isActive) {
  useEffect(() => {
    if (!isActive) return

    function handleKeyDown(e) {
      // Always prevent arrow key scrolling when game is active
      if (ARROW_KEYS.has(e.code)) {
        e.preventDefault()
      }

      const dir = KEY_MAP[e.code] || KEY_MAP[e.key]
      if (dir && engineRef.current) {
        engineRef.current.setDirection(dir)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [engineRef, isActive])
}
