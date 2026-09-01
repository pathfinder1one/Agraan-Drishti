const SIGNAL_CONFIG = {
  cape:         { label: 'CAPE',           unit: 'J/kg',    max: 4000, color: '#ef4444' },
  cin:          { label: 'CIN',            unit: 'J/kg',    max: 200,  color: '#f97316' },
  iwv_rate:     { label: 'IWV Rate',       unit: 'kg/m²/6h', max: 20, color: '#3b82f6' },
  convergence:  { label: 'Convergence',    unit: '×10⁻⁵/s', max: 5,  color: '#06b6d4' },
  wind_shear:   { label: 'Wind Shear',     unit: 'm/s',     max: 30, color: '#8b5cf6' },
}

function GaugeBar({ name, signal }) {
  const config = SIGNAL_CONFIG[name]
  if (!config || !signal) return null

  const value = Math.abs(signal.value)
  const pct = Math.min((value / config.max) * 100, 100)
  const isHigh = pct > 60

  return (
    <div className="xai-signal">
      <span className="xai-signal-name">{config.label}</span>
      <div className="xai-gauge">
        <div
          className="xai-gauge-fill"
          style={{
            width: `${pct}%`,
            background: isHigh
              ? `linear-gradient(90deg, ${config.color}, #ef4444)`
              : config.color,
          }}
        />
      </div>
      <span className="xai-signal-value" style={{ color: isHigh ? '#ef4444' : undefined }}>
        {name === 'convergence' ? (value * 1e5).toFixed(1) : value.toFixed(0)}
        <span style={{ fontSize: '10px', color: '#64748b' }}> {config.unit}</span>
      </span>
    </div>
  )
}

export default function XAIPanel({ data, selectedCell }) {
  if (!selectedCell) {
    return (
      <div className="panel-section">
        <div className="panel-section-title">🔍 Explainability (XAI)</div>
        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
          Click any point on the map to see why it was flagged — meteorological drivers, confidence, and risk explanation.
        </p>
      </div>
    )
  }

  return (
    <div className="panel-section">
      <div className="panel-section-title">
        🔍 Why This Risk? ({selectedCell.lat.toFixed(1)}°N, {selectedCell.lon.toFixed(1)}°E)
      </div>

      {/* Signal gauges */}
      {data?.signals && Object.entries(data.signals).map(([name, signal]) => (
        <GaugeBar key={name} name={name} signal={signal} />
      ))}

      {/* Confidence */}
      {data?.confidence && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px' }}>
          <span style={{ color: '#94a3b8' }}>Confidence</span>
          <span style={{
            fontWeight: 700,
            color: data.confidence > 0.8 ? '#22c55e' : data.confidence > 0.6 ? '#eab308' : '#ef4444'
          }}>
            {(data.confidence * 100).toFixed(0)}%
          </span>
        </div>
      )}

      {/* Data quality */}
      {data?.data_quality && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
          <span style={{ color: '#94a3b8' }}>Data Quality</span>
          <span style={{ color: '#22c55e', fontWeight: 600 }}>
            {data.data_quality === 'good' ? '✓ Good' : '⚠ Degraded'}
          </span>
        </div>
      )}

      {/* Explanation sentence */}
      {data?.explanation && (
        <div className="xai-explanation">
          💡 {data.explanation}
        </div>
      )}
    </div>
  )
}
