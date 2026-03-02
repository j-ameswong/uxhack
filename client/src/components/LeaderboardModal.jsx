// ============================================================
//  LeaderboardModal.jsx
//  Pixel-art styled leaderboard with rainbow top 3 & #1 frame.
// ============================================================

import { useEffect, useRef, useState } from 'react'

function formatTime(ms) {
  if (ms == null) return '--:--'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const centis = Math.floor((ms % 1000) / 10)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`
}

const pixelFont = { fontFamily: 'var(--font-pixel)' }



// Lerp between two hex colors
function lerpColor(a, b, t) {
  const parse = (hex) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
  const [r1, g1, b1] = parse(a)
  const [r2, g2, b2] = parse(b)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const bl = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r},${g},${bl})`
}

function Row({ entry, highlight }) {
  const isTop3 = entry.rank <= 3
  const isFirst = entry.rank === 1
  const hasDualColor = isTop3 && entry.frameColor && entry.frameColor2
  const rowRef = useRef(null)

  // JS-driven color cycling for dual-color frames
  useEffect(() => {
    if (!hasDualColor || !rowRef.current) return
    let raf
    const c1 = entry.frameColor
    const c2 = entry.frameColor2
    function animate() {
      const t = (Math.sin(Date.now() / 1000 * Math.PI) + 1) / 2 // 0→1→0 over 2s
      const current = lerpColor(c1, c2, t)
      const el = rowRef.current
      if (el) {
        el.style.borderLeft = `4px solid ${current}`
        el.style.borderRight = `4px solid ${lerpColor(c2, c1, t)}`
        el.style.boxShadow = `inset 0 0 12px ${current}, 0 0 6px ${lerpColor(c2, c1, t)}`
      }
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [hasDualColor, entry.frameColor, entry.frameColor2])

  const rowStyle = {
    backgroundColor: highlight ? 'rgba(74,222,128,0.15)' : 'transparent',
    borderBottom: '2px solid #3b3b5c',
  }

  // Single-color frame for non-top-3 (or top-3 without dual)
  if (entry.frameColor && !hasDualColor) {
    rowStyle.borderLeft = `4px solid ${entry.frameColor}`
    rowStyle.borderRight = `4px solid ${entry.frameColor}`
    rowStyle.boxShadow = `inset 0 0 8px ${entry.frameColor}40`
  }

  const nameCellClass = isTop3 ? 'rainbow-name' : ''
  const fontSize = isFirst ? '0.625rem' : '0.5rem'
  const paddingY = isFirst ? 'py-3' : 'py-2'

  return (
    <tr ref={rowRef} style={rowStyle}>
      <td className={`px-3 ${paddingY} text-center`} style={{ ...pixelFont, fontSize, color: '#6366f1' }}>
        #{entry.rank}
      </td>
      <td
        className={`px-3 ${paddingY} max-w-[120px] truncate ${nameCellClass}`}
        style={{ ...pixelFont, fontSize, color: isTop3 ? undefined : '#e0e0e0' }}
      >
        {entry.name}
      </td>
      <td className={`px-3 ${paddingY} text-center`} style={{ ...pixelFont, fontSize, color: '#4ade80' }}>
        {formatTime(entry.timeMs)}
      </td>
      <td className={`px-3 ${paddingY} text-center`} style={{ ...pixelFont, fontSize, color: '#ef4444' }}>
        {entry.deaths}
      </td>
    </tr>
  )
}

export function LeaderboardModal({ currentId, currentRank }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/leaderboard`)
      .then(r => r.json())
      .then(data => { setEntries(data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  const userInTop10 = entries.some(e => e.id === currentId)

  return (
    <div className="pixel-bevel w-full flex flex-col min-h-0" style={{ backgroundColor: '#25253e' }}>
      {/* Title bar */}
      <div className="px-3 py-2 flex-shrink-0" style={{
        backgroundColor: '#6366f1',
        borderBottom: '3px solid #3730a3',
      }}>
        <span style={{ ...pixelFont, fontSize: '0.625rem', color: '#e0e0e0', fontWeight: 'bold' }}>
          LEADERBOARD
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading && (
          <p className="text-center py-4" style={{ ...pixelFont, fontSize: '0.5rem', color: '#9090b0' }}>Loading...</p>
        )}
        {error && (
          <p className="text-center py-4" style={{ ...pixelFont, fontSize: '0.5rem', color: '#ef4444' }}>
            Couldn&apos;t load leaderboard.
          </p>
        )}
        {!loading && !error && entries.length === 0 && (
          <p className="text-center py-4" style={{ ...pixelFont, fontSize: '0.5rem', color: '#9090b0' }}>No entries yet.</p>
        )}
        {!loading && !error && entries.length > 0 && (
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ borderBottom: '3px solid #4a4a6a' }}>
                <th className="px-3 py-2 text-center" style={{ ...pixelFont, fontSize: '0.4rem', color: '#6a6a8a' }}>#</th>
                <th className="px-3 py-2 text-left" style={{ ...pixelFont, fontSize: '0.4rem', color: '#6a6a8a' }}>NAME</th>
                <th className="px-3 py-2 text-center" style={{ ...pixelFont, fontSize: '0.4rem', color: '#6a6a8a' }}>TIME</th>
                <th className="px-3 py-2 text-center" style={{ ...pixelFont, fontSize: '0.4rem', color: '#6a6a8a' }}>DEATHS</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <Row key={entry.id} entry={entry} highlight={entry.id === currentId} />
              ))}
              {currentId && !userInTop10 && currentRank != null && (
                <>
                  <tr><td colSpan={4} style={{ borderTop: '2px dashed #4a4a6a' }} /></tr>
                  <tr style={{ backgroundColor: 'rgba(74,222,128,0.15)' }}>
                    <td className="px-3 py-2 text-center" style={{ ...pixelFont, fontSize: '0.5rem', color: '#6366f1' }}>#{currentRank}</td>
                    <td className="px-3 py-2" colSpan={3} style={{ ...pixelFont, fontSize: '0.5rem', color: '#9090b0' }}>You</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
