const STAGES = [
  { icon: '🌡', name: 'Convective Initiation', key: 'score' },
  { icon: '⛈', name: 'Hazard Probability', key: 'thunderstorm' },
  { icon: '🌧', name: 'Precipitation Impact', key: 'expected_mm' },
  { icon: '💧', name: 'Runoff Susceptibility', key: 'score' },
  { icon: '👥', name: 'Exposure Assessment', key: 'affected_population' },
  { icon: '📢', name: 'Response Tier', key: 'tier' },
]

export default function CascadeView({ data }) {
  const stages = data?.stages || []

  return (
    <div className="panel-section">
      <div className="panel-section-title">🔗 Cascade Chain</div>

      {stages.length === 0 ? (
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          Hazard cascade analysis connecting weather → impact → response
        </p>
      ) : (
        stages.map((stage, i) => (
          <div key={i}>
            <div className="cascade-stage">
              <div className="cascade-icon">{STAGES[i]?.icon || '📊'}</div>
              <div className="cascade-info">
                <div className="cascade-name">{stage.name}</div>
                <div className="cascade-status">
                  {stage.status && <span>{stage.status}</span>}
                  {stage.score && <span> • Score: {(stage.score * 100).toFixed(0)}%</span>}
                  {stage.thunderstorm && <span> • TS: {(stage.thunderstorm * 100).toFixed(0)}%</span>}
                  {stage.cloudburst && <span> CB: {(stage.cloudburst * 100).toFixed(0)}%</span>}
                  {stage.flash_flood && <span> FF: {(stage.flash_flood * 100).toFixed(0)}%</span>}
                  {stage.expected_mm && <span> • {stage.expected_mm}mm expected</span>}
                  {stage.affected_population && <span> • ~{(stage.affected_population / 1000).toFixed(0)}K people</span>}
                  {stage.hospitals && <span> • {stage.hospitals} hospitals</span>}
                  {stage.tier && <span> • Tier: {stage.tier.toUpperCase()}</span>}
                  {stage.recommended_action && <span> — {stage.recommended_action}</span>}
                </div>
              </div>
            </div>
            {i < stages.length - 1 && <div className="cascade-arrow">↓</div>}
          </div>
        ))
      )}
    </div>
  )
}
