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

/** Letter/number keys that trigger the "use arrow keys" tooltip */
const TYPING_KEYS = /^[a-zA-Z0-9]$/

/**
 * @param {React.RefObject} engineRef
 * @param {boolean} isActive
 * @param {{ onLetterKey?: () => void }} options - onLetterKey called when user presses a letter key (tooltip)
 */
export function useKeyboard(engineRef, isActive, options = {}) {
  const { onLetterKey } = options

  useEffect(() => {
    if (!isActive) return

    function handleKeyDown(e) {
      if (ARROW_KEYS.has(e.code)) {
        e.preventDefault()
      }

      const dir = KEY_MAP[e.code] || KEY_MAP[e.key]
      if (dir && engineRef.current) {
        engineRef.current.setDirection(dir)
      } else if (TYPING_KEYS.test(e.key) && onLetterKey) {
        onLetterKey()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [engineRef, isActive, onLetterKey])
}
