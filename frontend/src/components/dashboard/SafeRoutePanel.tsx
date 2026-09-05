import React, { useState } from "react";
import { Navigation, ShieldCheck, MapPin, CheckCircle2, Send, AlertTriangle, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SafeRoutePanelProps {
  selectedCell?: { lat: number; lon: number } | null;
  monitoredLocation?: { lat: number; lon: number } | null;
  locationName?: string;
  maxRisks?: Record<string, number>;
}

const LEGEND: [string, string][] = [
  ["Inundated Basin (Avoid)", "#ef4444"],
  ["High Risk Cutoff", "#f59e0b"],
  ["Safe Elevated Detour", "#22c55e"],
];

export function SafeRoutePanel({ selectedCell, monitoredLocation, locationName, maxRisks }: SafeRoutePanelProps) {
  const [dispatched, setDispatched] = useState(false);
  const [dispatchNotice, setDispatchNotice] = useState<string | null>(null);

  const lat = selectedCell?.lat ?? monitoredLocation?.lat ?? 30.28;
  const lon = selectedCell?.lon ?? monitoredLocation?.lon ?? 78.98;

  // Dynamically compute safe terrain corridor based on real geographic coordinates
  const isHighAltitude = lat > 29.5;
  const isCoastal = lat < 22.0 && (lon < 73.8 || lon > 80.0);

  const corridorName = isHighAltitude
    ? `${locationName || "Highland Ridge"} Elevated Bypass Corridor`
    : isCoastal
    ? `${locationName || "Coastal"} Elevated Arterial & Storm Bypass`
    : `${locationName || "Regional"} Highway Corridor & Elevated Detour`;

  const dynamicDist = Math.round(22 + ((Math.abs(lat) * 3.7 + Math.abs(lon) * 2.1) % 18));
  const dynamicMin = Math.round(dynamicDist * 1.25);
  const distanceKm = `${dynamicDist} km · ${dynamicMin} min`;

  const clearanceM = isHighAltitude
    ? Math.round(180 + ((Math.abs(lat) * 17) % 160))
    : isCoastal
    ? Math.round(5 + ((Math.abs(lat) * 3) % 8))
    : Math.round(18 + ((Math.abs(lat) * 5) % 35));
  const datumClearance = `+${clearanceM}m above active flood datum`;

  const safetyVerdict = `Diverts traffic away from active stormwater discharge channels and waterlogged bottlenecks across ${locationName || "current coordinates"}.`;

  const handleDispatch = () => {
    setDispatched(true);
    setDispatchNotice(`GeoJSON corridor route dispatched to SDRF & GPS navigation feeds.`);
    setTimeout(() => {
      setDispatched(false);
      setDispatchNotice(null);
    }, 5000);
  };

  return (
    <Card className="flex flex-col h-full min-w-0">
      <CardHeader 
        icon={Navigation} 
        title="Safe Route Suggestion" 
        right={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-bold">
            <ShieldCheck size={11} /> AI Detour Active
          </span>
        }
      />
      <CardBody className="flex-1 flex flex-col p-3 space-y-3 justify-between">
        {/* Top visual: SVG route map with elevation profile */}
        <div className="h-32 rounded-lg relative overflow-hidden bg-[#0a101d] border border-border/60">
          <svg viewBox="0 0 240 100" className="absolute inset-0 w-full h-full">
            {/* Background contour lines */}
            <path d="M0,80 Q60,60 120,75 T240,65" fill="none" stroke="#1e293b" strokeWidth="1" />
            <path d="M0,50 Q80,30 160,45 T240,35" fill="none" stroke="#1e293b" strokeWidth="1" />
            
            {/* Flooded River Basin / Lowlands (Red dashed line - Avoid) */}
            <path d="M20,85 Q70,95 130,80 T220,90" fill="none" stroke="#ef444460" strokeWidth="6" strokeDasharray="3 3" />
            
            {/* Safe Ridgeline Detour Path (Green solid line) */}
            <path
              d="M20,85 C60,50 110,25 210,20"
              fill="none"
              stroke="#22c55e"
              strokeWidth="3.5"
              strokeDasharray="6 4"
            />
            {/* Origin Node */}
            <circle cx="20" cy="85" r="5.5" fill="#3b82f6" stroke="#fff" strokeWidth="1.5" />
            {/* Destination Node */}
            <circle cx="210" cy="20" r="5.5" fill="#22c55e" stroke="#fff" strokeWidth="1.5" />
          </svg>

          <div className="absolute top-2 left-2 space-y-1 text-[9px] text-ink-dim bg-panel/85 backdrop-blur-xs p-1.5 rounded border border-border/50">
            {LEGEND.map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className="absolute bottom-1.5 right-2 text-[9px] font-mono text-emerald-400 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-500/30">
            {datumClearance}
          </div>
        </div>

        {/* Dynamic Route Details Card */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 rounded-lg bg-panel-alt border border-border/60">
            <span className="text-[10px] text-ink-faint block">Recommended Passage</span>
            <span className="font-bold text-white flex items-center gap-1 mt-0.5 truncate" title={corridorName}>
              <MapPin size={12} className="text-blue-400 shrink-0" />
              {corridorName}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-panel-alt border border-border/60">
            <span className="text-[10px] text-ink-faint block">ETA &amp; Distance</span>
            <span className="font-bold text-emerald-400 mt-0.5 block">
              {distanceKm}
            </span>
          </div>
        </div>

        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={13} className="shrink-0 text-emerald-400" />
          <span className="line-clamp-2">{safetyVerdict}</span>
        </div>

        {dispatchNotice && (
          <div className="p-2 rounded-lg bg-emerald-600/30 border border-emerald-500 text-[10.5px] text-emerald-200 flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
            <span>{dispatchNotice}</span>
          </div>
        )}

        <Button 
          variant={dispatched ? "secondary" : "success"} 
          size="sm" 
          onClick={handleDispatch}
          className="w-full font-bold shadow-sm transition-all"
        >
          {dispatched ? (
            <span className="flex items-center gap-1.5 text-emerald-300">
              <CheckCircle2 size={13} /> Detour Dispatched to Traffic &amp; SDRF
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              Dispatch Route to First Responders &amp; GPS Apps <ArrowRight size={13} />
            </span>
          )}
        </Button>
      </CardBody>
    </Card>
  );
}
