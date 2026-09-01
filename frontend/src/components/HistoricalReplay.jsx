import { useState, useEffect } from 'react'

export default function HistoricalReplay({ apiBase, onSelectEvent, onClear }) {
  const [events, setEvents] = useState([])
  const [selected, setSelected] = useState('')
  const [replayResult, setReplayResult] = useState(null)

  useEffect(() => {
    fetch(`${apiBase}/api/historical-events`)
      .then(r => r.json())
      .then(setEvents)
      .catch(() => {})
  }, [apiBase])

  const handleSelect = async (e) => {
    const id = e.target.value
    setSelected(id)

    if (!id) {
      onClear()
      setReplayResult(null)
      return
    }

    onSelectEvent(id)

    try {
      const res = await fetch(`${apiBase}/api/replay/${id}`)
      const data = await res.json()
      setReplayResult(data)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <select
        className="replay-select"
        value={selected}
        onChange={handleSelect}
        style={{ maxWidth: '280px' }}
      >
        <option value="">🔄 Replay Historical Event...</option>
        {events.map(evt => (
          <option key={evt.event_id} value={evt.event_id}>
            {evt.date} — {evt.event_type.replace('_', ' ')} — {evt.description?.slice(0, 40)}
          </option>
        ))}
      </select>

      {replayResult && (
        <div style={{
          fontSize: '11px',
          padding: '4px 10px',
          borderRadius: '20px',
          background: replayResult.correctly_flagged ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          color: replayResult.correctly_flagged ? '#22c55e' : '#ef4444',
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}>
          {replayResult.correctly_flagged ? '✓ Detected' : '✗ Missed'}
          {replayResult.lead_time_hours && ` (${replayResult.lead_time_hours}h lead)`}
        </div>
      )}
    </div>
  )
}
