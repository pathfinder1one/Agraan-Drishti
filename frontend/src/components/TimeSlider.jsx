import { useMemo } from 'react'

const HOURS = [0, 1, 2, 3, 4, 6]
const LABELS = ['NOW', '+1h', '+2h', '+3h', '+4h', '+6h']

export default function TimeSlider({ forecastHour, onHourChange, isPlaying, onTogglePlay }) {
  const currentIndex = HOURS.indexOf(forecastHour)
  const fillPercent = (currentIndex / (HOURS.length - 1)) * 100

  const handleChange = (e) => {
    const idx = parseInt(e.target.value)
    onHourChange(HOURS[idx])
  }

  return (
    <div className="time-slider-container">
      <div className="time-slider-header">
        <h3>Forecast Timeline</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="play-btn" onClick={onTogglePlay}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <span className="forecast-hour">
            {forecastHour === 0 ? 'NOW' : `T+${forecastHour}h`}
          </span>
        </div>
      </div>
      <div className="time-slider-track">
        <div className="time-slider-fill" style={{ width: `${fillPercent}%` }} />
        <input
          type="range"
          min={0}
          max={HOURS.length - 1}
          value={currentIndex}
          onChange={handleChange}
          step={1}
        />
      </div>
      <div className="time-labels">
        {LABELS.map((label, i) => (
          <span
            key={i}
            style={{
              fontWeight: i === currentIndex ? 700 : 400,
              color: i === currentIndex ? '#3b82f6' : undefined,
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
