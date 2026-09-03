import React from "react";
import { Navigation, ShieldCheck, MapPin, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const LEGEND: [string, string][] = [
  ["Avoid (River Basin)", "#ef4444"],
  ["High Risk Cutoff", "#f59e0b"],
  ["Moderate Inundation", "#eab308"],
  ["Safe Ridgeline Detour", "#22c55e"],
];

export function SafeRoutePanel() {
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
            
            {/* Flooded River Basin (Avoid) */}
            <path d="M20,85 Q70,95 130,80 T220,90" fill="none" stroke="#ef444460" strokeWidth="6" strokeDasharray="3 3" />
            
            {/* Safe Ridgeline Detour Path */}
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
            Clearance: +340m above river datum
          </div>
        </div>

        {/* Route Details Card */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 rounded-lg bg-panel-alt border border-border/60">
            <span className="text-[10px] text-ink-faint block">Recommended Passage</span>
            <span className="font-bold text-white flex items-center gap-1 mt-0.5 truncate">
              <MapPin size={12} className="text-blue-400 shrink-0" />
              Ridge Highway Detour
            </span>
          </div>
          <div className="p-2 rounded-lg bg-panel-alt border border-border/60">
            <span className="text-[10px] text-ink-faint block">ETA &amp; Distance</span>
            <span className="font-bold text-emerald-400 mt-0.5 block">
              45 min · 38 km
            </span>
          </div>
        </div>

        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={13} className="shrink-0 text-emerald-400" />
          <span>Bypasses Mandakini valley pinch-point. Fully clear of active mudflow runouts.</span>
        </div>

        <Button variant="success" size="sm" className="w-full font-bold shadow-sm">
          Dispatch Route Details to First Responders ➔
        </Button>
      </CardBody>
    </Card>
  );
}
