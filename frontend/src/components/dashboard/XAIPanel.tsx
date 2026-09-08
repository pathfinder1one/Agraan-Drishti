import { BentoCard, CardHeader } from "@/components/ui/card";
import { Sparkles, HelpCircle } from "lucide-react";

const SIGNAL_CONFIG: Record<string, any> = {
  cape:         { label: 'CAPE (Convective Energy)', unit: 'J/kg',    max: 4000, color: '#c92a2a' },
  cin:          { label: 'CIN (Convective Inhibition)', unit: 'J/kg', max: 200,  color: '#f5b35a' },
  iwv_rate:     { label: 'IWV Rate (Moisture)',       unit: 'kg/m²/6h', max: 20, color: '#246b38' },
  convergence:  { label: 'Wind Convergence',          unit: '×10⁻⁵/s', max: 5,  color: '#246b38' },
  wind_shear:   { label: 'Deep Layer Wind Shear',     unit: 'm/s',     max: 30, color: '#f5b35a' },
}

function GaugeBar({ name, signal }: { name: string, signal: any }) {
  const config = SIGNAL_CONFIG[name]
  if (!config || !signal) return null

  const value = Math.abs(signal.value)
  const pct = Math.min((value / config.max) * 100, 100)
  const isHigh = pct > 60

  return (
    <div className="mb-2.5">
      <div className="flex justify-between text-[11px] mb-1">
        <span className="font-semibold text-ink-dim">{config.label}</span>
        <span className="font-mono font-bold" style={{ color: isHigh ? '#c92a2a' : '#246b38' }}>
          {name === 'convergence' ? (value * 1e5).toFixed(1) : value.toFixed(0)}
          <span className="text-[10px] text-ink-faint font-normal"> {config.unit}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-border/60 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: isHigh
              ? `linear-gradient(90deg, #f5b35a, #c92a2a)`
              : config.color,
          }}
        />
      </div>
    </div>
  )
}

interface XAIPanelProps {
  data: any;
  selectedCell?: { lat: number, lon: number } | null;
  monitoredLocation?: { lat: number, lon: number } | null;
  locationName?: string;
}

export function XAIPanel({ data, selectedCell, monitoredLocation, locationName }: XAIPanelProps) {
  const activeLoc = selectedCell || monitoredLocation || { lat: 30.73, lon: 79.06 };
  const locTitle = selectedCell 
    ? `${selectedCell.lat.toFixed(2)}°N, ${selectedCell.lon.toFixed(2)}°E` 
    : (locationName || `${activeLoc.lat.toFixed(2)}°N, ${activeLoc.lon.toFixed(2)}°E`);

  return (
    <BentoCard glowBorder="none">
      <CardHeader 
        icon={Sparkles} 
        title="Explainable AI (XAI) Attribution" 
        subtitle={`Feature Importance & Physics Audit (${locTitle})`}
      />
      <div className="p-3.5 space-y-3">
        {/* Signal gauges */}
        <div>
          {data?.signals && Object.entries(data.signals).map(([name, signal]) => (
            <GaugeBar key={name} name={name} signal={signal} />
          ))}
        </div>

        {/* Confidence & Data Quality */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60 text-xs">
          {data?.confidence && (
            <div className="p-2 rounded-md bg-panel-alt/60 border border-border/60">
              <span className="text-[10px] uppercase font-bold text-ink-faint block">Model Confidence</span>
              <span className="font-mono font-bold text-ink text-sm">
                {(data.confidence * 100).toFixed(0)}%
              </span>
            </div>
          )}

          {data?.data_quality && (
            <div className="p-2 rounded-md bg-panel-alt/60 border border-border/60">
              <span className="text-[10px] uppercase font-bold text-ink-faint block">Input Telemetry</span>
              <span className="font-bold text-accent text-sm flex items-center gap-1 mt-0.5">
                {data.data_quality === 'good' ? '✓ High Quality' : '⚠ Calibrated Proxy'}
              </span>
            </div>
          )}
        </div>

        {/* Explanation sentence */}
        {data?.explanation && (
          <div className="p-2.5 rounded-lg bg-secondary/60 border border-border text-[11.5px] leading-relaxed text-ink flex items-start gap-2 shadow-2xs">
            <HelpCircle size={15} className="text-accent shrink-0 mt-0.5" />
            <span>{data.explanation}</span>
          </div>
        )}
      </div>
    </BentoCard>
  )
}

