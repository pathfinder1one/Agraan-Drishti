import { Card, CardHeader } from "@/components/ui/card";
import { Search } from "lucide-react";

const SIGNAL_CONFIG: Record<string, any> = {
  cape:         { label: 'CAPE',           unit: 'J/kg',    max: 4000, color: '#ef4444' },
  cin:          { label: 'CIN',            unit: 'J/kg',    max: 200,  color: '#f97316' },
  iwv_rate:     { label: 'IWV Rate',       unit: 'kg/m²/6h', max: 20, color: '#3b82f6' },
  convergence:  { label: 'Convergence',    unit: '×10⁻⁵/s', max: 5,  color: '#06b6d4' },
  wind_shear:   { label: 'Wind Shear',     unit: 'm/s',     max: 30, color: '#8b5cf6' },
}

function GaugeBar({ name, signal }: { name: string, signal: any }) {
  const config = SIGNAL_CONFIG[name]
  if (!config || !signal) return null

  const value = Math.abs(signal.value)
  const pct = Math.min((value / config.max) * 100, 100)
  const isHigh = pct > 60

  return (
    <div className="mb-3">
      <div className="flex justify-between text-[11px] mb-1">
        <span className="font-semibold text-ink-dim">{config.label}</span>
        <span style={{ color: isHigh ? '#ef4444' : '#94a3b8' }}>
          {name === 'convergence' ? (value * 1e5).toFixed(1) : value.toFixed(0)}
          <span className="text-[10px] text-ink-faint"> {config.unit}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-panel-alt overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: isHigh
              ? `linear-gradient(90deg, ${config.color}, #ef4444)`
              : config.color,
          }}
        />
      </div>
    </div>
  )
}

interface XAIPanelProps {
  data: any;
  selectedCell: { lat: number, lon: number } | null;
}

export function XAIPanel({ data, selectedCell }: XAIPanelProps) {
  if (!selectedCell) {
    return (
      <Card>
        <CardHeader icon={Search} title="Explainability (XAI)" />
        <div className="p-4 text-[13px] text-ink-dim leading-relaxed">
          Click any point on the map to see why it was flagged — meteorological drivers, confidence, and risk explanation.
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader 
        icon={Search} 
        title={`Why This Risk? (${selectedCell.lat.toFixed(1)}°N, ${selectedCell.lon.toFixed(1)}°E)`} 
      />
      <div className="p-4">
        {/* Signal gauges */}
        {data?.signals && Object.entries(data.signals).map(([name, signal]) => (
          <GaugeBar key={name} name={name} signal={signal} />
        ))}

        {/* Confidence */}
        {data?.confidence && (
          <div className="flex justify-between text-[12px] mt-4">
            <span className="text-ink-dim">Confidence</span>
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
          <div className="flex justify-between text-[12px] mt-1.5">
            <span className="text-ink-dim">Data Quality</span>
            <span className="font-semibold text-emerald-500">
              {data.data_quality === 'good' ? '✓ Good' : '⚠ Degraded'}
            </span>
          </div>
        )}

        {/* Explanation sentence */}
        {data?.explanation && (
          <div className="mt-4 p-3 rounded-lg bg-panel-alt border border-border-soft text-[12px] leading-relaxed">
            💡 {data.explanation}
          </div>
        )}
      </div>
    </Card>
  )
}
