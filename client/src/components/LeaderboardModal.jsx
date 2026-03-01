// ============================================================
//  LeaderboardModal.jsx
//  Pixel-art styled leaderboard with rainbow top 3 & #1 frame.
// ============================================================

import { useEffect, useState } from 'react'

function formatTime(ms) {
  if (ms == null) return '--:--'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const centis = Math.floor((ms % 1000) / 10)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`
}

const pixelFont = { fontFamily: 'var(--font-pixel)' }

const RANK_MEDALS = { 1: '👑', 2: '🥈', 3: '🥉' }

function Row({ entry, highlight }) {
  const isTop3 = entry.rank <= 3
  const isFirst = entry.rank === 1

  const rowStyle = {
    backgroundColor: highlight ? 'rgba(74,222,128,0.15)' : 'transparent',
    borderBottom: '2px solid #3b3b5c',
  }

  // #1 gets a custom colored frame border
  if (isFirst && entry.frameColor) {
    rowStyle.borderLeft = `4px solid ${entry.frameColor}`
    rowStyle.borderRight = `4px solid ${entry.frameColor}`
    rowStyle.boxShadow = `inset 0 0 8px ${entry.frameColor}40`
  }

  const nameCellClass = isTop3 ? 'rainbow-name' : ''
  const fontSize = isFirst ? '0.625rem' : '0.5rem'
  const paddingY = isFirst ? 'py-3' : 'py-2'

  return (
    <tr style={rowStyle}>
      <td className={`px-3 ${paddingY} text-center`} style={{ ...pixelFont, fontSize, color: '#6366f1' }}>
        {RANK_MEDALS[entry.rank] || `#${entry.rank}`}
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
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(data => { setEntries(data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  const userInTop10 = entries.some(e => e.id === currentId)

  return (
    <div className="pixel-bevel w-full" style={{ backgroundColor: '#25253e' }}>
      {/* Title bar */}
      <div className="px-3 py-2" style={{
        backgroundColor: '#6366f1',
        borderBottom: '3px solid #3730a3',
      }}>
        <span style={{ ...pixelFont, fontSize: '0.625rem', color: '#e0e0e0', fontWeight: 'bold' }}>
          LEADERBOARD
        </span>
      </div>

      <div className="p-0">
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
