import { useState, useEffect } from "react";
import { Users, AlertTriangle, Home, Building2, Landmark, Clock, Mountain, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardBody } from "@/components/ui/card";

interface ExposureOverviewPanelProps {
  selectedCell?: { lat: number; lon: number } | null;
  forecastHour?: number;
}

export function ExposureOverviewPanel({ selectedCell, forecastHour = 2 }: ExposureOverviewPanelProps) {
  const [intel, setIntel] = useState<any>(null);

  const lat = selectedCell ? selectedCell.lat : 30.73;
  const lon = selectedCell ? selectedCell.lon : 79.06;

  useEffect(() => {
    fetch(`http://localhost:8000/api/hazard-intelligence?lat=${lat}&lon=${lon}&forecast_hour=${forecastHour}`)
      .then(res => res.json())
      .then(data => setIntel(data))
      .catch(() => {});
  }, [lat, lon, forecastHour]);

  const village = intel?.village || {
    village: selectedCell ? `Ward Zone (${selectedCell.lat.toFixed(2)}°N, ${selectedCell.lon.toFixed(2)}°E)` : "Rudraprayag Valley, Kedarnath Route",
    district: "Rudraprayag, Uttarakhand",
    elevation_m: 2150,
    terrain_slope_factor: 0.76,
    granularity: "Village / Ward Level (<5km)"
  };

  const vuln = intel?.vulnerability_index || {
    score: 0.84,
    rating: "CRITICAL",
    topographic_slope: 0.76,
    elevation_m: 2150,
    exposed_population: 18420,
    kaccha_dwellings: 2578,
    bridges_at_risk: 3,
    schools_at_risk: 6,
    evacuation_window_hours: 1.8
  };

  const isCritical = vuln.rating === "CRITICAL";
  const ratingColor = isCritical ? "text-red-400 bg-red-500/10 border-red-500/30" : (vuln.rating === "HIGH" ? "text-amber-400 bg-amber-500/10 border-amber-500/30" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30");

  return (
    <Card className="flex flex-col h-full min-w-0">
      <CardHeader
        icon={Users}
        title="Vulnerability & Exposure"
        right={
          <span className="text-[10px] text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
            {village.granularity}
          </span>
        }
      />
      <CardBody className="flex-1 space-y-3 flex flex-col justify-between">
        {/* Village / Ward Pinpoint Banner */}
        <div className="p-2.5 rounded-lg bg-panel-alt border border-border">
          <div className="flex items-center justify-between text-[11px] mb-0.5">
            <span className="font-bold text-ink truncate">{village.village}</span>
            <span className="text-ink-dim flex items-center gap-1">
              <Mountain size={11} /> {village.elevation_m}m
            </span>
          </div>
          <div className="text-[10px] text-ink-faint truncate">{village.district}</div>
        </div>

        {/* Vulnerability-Weighted Human Impact Index Meter (Gap #4) */}
        <div className="p-3 rounded-lg bg-panel-alt border border-border space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-ink">
              <AlertTriangle size={13} className={isCritical ? "text-red-400 animate-pulse" : "text-amber-400"} />
              <span>Vulnerability-Weighted Index:</span>
            </div>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${ratingColor}`}>
              {vuln.rating} ({(vuln.score * 100).toFixed(0)}%)
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full overflow-hidden bg-border-soft">
            <motion.div
              className={`h-full rounded-full ${isCritical ? "bg-gradient-to-r from-amber-500 to-red-500" : "bg-gradient-to-r from-emerald-500 to-amber-500"}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, vuln.score * 100)}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <div className="flex justify-between text-[9.5px] text-ink-faint">
            <span>Terrain Runoff Slope: {(vuln.topographic_slope * 100).toFixed(0)}%</span>
            <span>Valley Basin Accumulation: High</span>
          </div>
        </div>

        {/* Detailed Exposure Breakdown */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 rounded bg-panel-alt border border-border">
            <div className="flex items-center gap-1 text-ink-dim text-[10px] mb-0.5">
              <Users size={12} className="text-blue-400" /> Pop. at Risk
            </div>
            <div className="text-[14px] font-bold text-ink font-mono">
              {vuln.exposed_population.toLocaleString()}
            </div>
          </div>

          <div className="p-2 rounded bg-panel-alt border border-border">
            <div className="flex items-center gap-1 text-ink-dim text-[10px] mb-0.5">
              <Home size={12} className="text-amber-400" /> Kaccha Dwellings
            </div>
            <div className="text-[14px] font-bold text-ink font-mono">
              {vuln.kaccha_dwellings.toLocaleString()}
            </div>
          </div>

          <div className="p-2 rounded bg-panel-alt border border-border">
            <div className="flex items-center gap-1 text-ink-dim text-[10px] mb-0.5">
              <Landmark size={12} className="text-red-400" /> Critical Bridges
            </div>
            <div className="text-[14px] font-bold text-ink font-mono">
              {vuln.bridges_at_risk} Cut-off Points
            </div>
          </div>

          <div className="p-2 rounded bg-panel-alt border border-border">
            <div className="flex items-center gap-1 text-ink-dim text-[10px] mb-0.5">
              <Clock size={12} className="text-emerald-400" /> Evac Window
            </div>
            <div className="text-[14px] font-bold text-amber-400 font-mono">
              ~{vuln.evacuation_window_hours} Hours
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
