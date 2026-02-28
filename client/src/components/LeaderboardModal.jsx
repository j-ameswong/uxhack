// ============================================================
//  LeaderboardModal.jsx
//  Fetches and displays top-10 leaderboard.
//  Props:
//    currentId   — id from submit response; highlights that row
//    currentRank — rank from submit response; appended if not top 10
// ============================================================

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card.jsx'
import { Badge } from './ui/badge.jsx'

function formatTime(ms) {
  if (ms == null) return '--:--'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const centis = Math.floor((ms % 1000) / 10)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`
}

function Row({ entry, highlight }) {
  return (
    <tr className={highlight ? 'bg-primary/10 font-semibold' : 'hover:bg-muted/40'}>
      <td className="px-3 py-2 text-center font-mono text-sm">#{entry.rank}</td>
      <td className="px-3 py-2 text-sm max-w-[120px] truncate">{entry.name}</td>
      <td className="px-3 py-2 text-center font-mono text-sm">{formatTime(entry.timeMs)}</td>
      <td className="px-3 py-2 text-center text-sm">{entry.deaths}</td>
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
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-mono">Leaderboard</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading && (
          <p className="text-sm text-muted-foreground text-center py-4">Loading…</p>
        )}
        {error && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Couldn&apos;t load leaderboard.
          </p>
        )}
        {!loading && !error && entries.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No entries yet.</p>
        )}
        {!loading && !error && entries.length > 0 && (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-muted-foreground text-xs uppercase">
                <th className="px-3 py-2 text-center">#</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-center">Time</th>
                <th className="px-3 py-2 text-center">Deaths</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <Row key={entry.id} entry={entry} highlight={entry.id === currentId} />
              ))}
              {currentId && !userInTop10 && currentRank != null && (
                <>
                  <tr><td colSpan={4} className="border-t border-dashed" /></tr>
                  <tr className="bg-primary/10 font-semibold">
                    <td className="px-3 py-2 text-center font-mono text-sm">#{currentRank}</td>
                    <td className="px-3 py-2 text-sm italic text-muted-foreground" colSpan={3}>You</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}
