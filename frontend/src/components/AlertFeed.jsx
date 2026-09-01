const ROLES = ['public', 'authority', 'responder']

export default function AlertFeed({ alerts, role, onRoleChange }) {
  return (
    <div className="panel-section" style={{ flex: 1 }}>
      <div className="panel-section-title">🚨 Alert Feed</div>

      {/* Role toggle */}
      <div className="role-toggle">
        {ROLES.map(r => (
          <button
            key={r}
            className={`role-btn ${role === r ? 'active' : ''}`}
            onClick={() => onRoleChange(r)}
          >
            {r === 'public' ? '👤' : r === 'authority' ? '🏛' : '🚒'}{' '}
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {(!alerts || alerts.length === 0) ? (
        <p style={{ fontSize: '13px', color: '#64748b' }}>No active alerts</p>
      ) : (
        alerts.map((alert, i) => (
          <div key={i} className={`alert-card ${alert.severity}`}>
            <div className="alert-header">
              <span className="alert-type" style={{
                color: alert.severity === 'emergency' ? '#ef4444'
                     : alert.severity === 'warning' ? '#f97316'
                     : '#eab308'
              }}>
                {alert.event_type?.replace('_', ' ')}
              </span>
              <span className={`alert-severity ${alert.severity}`}>
                {alert.severity}
              </span>
            </div>
            <div className="alert-message">
              {alert.message || alert.explanation}
            </div>
            {alert.lead_time_hours && (
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                ⏱ ETA: {alert.lead_time_hours}h • 📍 {alert.lat?.toFixed(1)}°N, {alert.lon?.toFixed(1)}°E
                {alert.probability && ` • ${(alert.probability * 100).toFixed(0)}%`}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
