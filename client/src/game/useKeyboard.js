// ============================================================
//  useKeyboard.js
//  Captures arrow keys + WASD, calls preventDefault to stop
//  page scroll, feeds direction into the engine.
// ============================================================

import { useEffect } from 'react'
import { DIR } from '../game/constants.js'

const KEY_MAP = {
  ArrowUp:    DIR.UP,
  ArrowDown:  DIR.DOWN,
  ArrowLeft:  DIR.LEFT,
  ArrowRight: DIR.RIGHT,
  KeyW:       DIR.UP,
  KeyS:       DIR.DOWN,
  KeyA:       DIR.LEFT,
  KeyD:       DIR.RIGHT,
  w:          DIR.UP,
  s:          DIR.DOWN,
  a:          DIR.LEFT,
  d:          DIR.RIGHT,
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
        engineRef.current.enqueueDirection(dir)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [engineRef, isActive])
}
