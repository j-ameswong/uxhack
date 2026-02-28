import { useRef } from 'react'
import { useGameLoop } from './hooks/useGameLoop.js'
import './App.css'

function App() {
  const canvasRef = useRef(null)
  useGameLoop(canvasRef, { onDeath: () => {} })

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100vw',
        height: '100vh',
      }}
    />
  )
}

export default App
