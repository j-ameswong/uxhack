// ============================================================
//  useAudio.js
//  Howler.js audio hook with lazy init (satisfies autoplay policy).
//  Initialises on first play() call — all sounds are triggered by
//  user interactions so this is safe.
// ============================================================

import { useRef, useCallback } from 'react'
import { Howl } from 'howler'
import foodSrc from '../assets/food.mp3'
import geometryDashDeathSrc from '../assets/geometry-dash-death-sound-effect.mp3'
import moveSrc from '../assets/move.mp3'
import fahhhhhSrc from '../assets/fahhhhh.mp3'
import countdownSrc from '../assets/countdown.mp3'
import zeldaBlipSrc from '../assets/zelda-blip.mp3'

export function useAudio() {
  const howls = useRef(null)
  const initialized = useRef(false)

  const init = useCallback(() => {
    if (initialized.current) return
    initialized.current = true
    howls.current = {
      capture:     new Howl({ src: [foodSrc], volume: 0.7 }),
      scatter:     new Howl({ src: [moveSrc], volume: 0.5 }),
      death:       new Howl({ src: [geometryDashDeathSrc], volume: 0.6 }),
      fieldSwitch: new Howl({ src: [fahhhhhSrc], volume: 0.8 }),
      countdown:   new Howl({ src: [countdownSrc], volume: 0.7 }),
      step:        new Howl({ src: [zeldaBlipSrc], volume: 0.3 }),
    }
  }, [])

  const play = useCallback((name) => {
    init()
    howls.current?.[name]?.play()
  }, [init])

  return { init, play }
}
