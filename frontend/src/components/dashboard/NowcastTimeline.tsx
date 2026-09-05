import React, { useRef, useState, useEffect } from "react";
import { Clock3, ChevronLeft, ChevronRight, Activity } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface NowcastTimelineProps {
  forecastHour: number;
  onHourSelect: (hour: number) => void;
  maxRisks?: Record<string, number>;
}

export function NowcastTimeline({ forecastHour, onHourSelect, maxRisks }: NowcastTimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [baseTime, setBaseTime] = useState<Date>(new Date());

  useEffect(() => {
    setBaseTime(new Date());
    const interval = setInterval(() => setBaseTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const scroll = (dir: number) => trackRef.current?.scrollBy({ left: dir * 180, behavior: "smooth" });

  const peakRisk = Math.max(...Object.values(maxRisks || { flash_flood: 0.35 }));

  // Dynamically generate nowcast frames from current live clock
  const dynamicFrames = [0, 1, 2, 3, 4, 5, 6].map((hourOffset) => {
    const frameDate = new Date(baseTime.getTime() + hourOffset * 3600000);
    const timeLabel = frameDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const label = hourOffset === 0 ? "Now" : `+${hourOffset} Hour${hourOffset > 1 ? "s" : ""}`;
    
    // Physical nowcast decay/growth curve
    const intensity = Math.min(0.98, Math.max(0.15, peakRisk * (1.0 - 0.10 * Math.abs(hourOffset - 2))));

    return {
      hour: hourOffset,
      label,
      time: timeLabel,
      intensity,
      riskPercent: Math.round(intensity * 100)
    };
  });

  return (
    <Card>
      <CardHeader
        icon={Clock3}
        title="Nowcast timeline (0–6h Lead Time)"
        right={
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-ink-faint flex items-center gap-1">
              <Activity size={10} className="text-accent animate-pulse" /> Live Nowcast Window
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => scroll(-1)}
                className="w-6 h-6 rounded-md flex items-center justify-center bg-panel-alt border border-border hover:text-ink text-ink-dim cursor-pointer"
                title="Scroll Left"
              >
                <ChevronLeft size={13} />
              </button>
              <button
                onClick={() => scroll(1)}
                className="w-6 h-6 rounded-md flex items-center justify-center bg-panel-alt border border-border hover:text-ink text-ink-dim cursor-pointer"
                title="Scroll Right"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        }
      />
      <div ref={trackRef} className="flex gap-3 p-3.5 overflow-x-auto scroll-smooth">
        {dynamicFrames.map((n) => {
          const isSelected = forecastHour === n.hour;
          const color = n.intensity >= 0.75 ? '#ef4444' : n.intensity >= 0.50 ? '#f97316' : n.intensity >= 0.25 ? '#eab308' : '#22c55e';

          return (
            <button
              key={n.label}
              onClick={() => onHourSelect(n.hour)}
              className={cn(
                "shrink-0 w-32 rounded-lg overflow-hidden text-left transition-all border cursor-pointer",
                isSelected ? "border-accent bg-[#13223f] shadow-md shadow-accent/20 scale-[1.02]" : "border-border bg-panel-alt hover:border-border-soft"
              )}
            >
              <div
                className="h-16 relative"
                style={{
                  backgroundImage: `radial-gradient(circle at 50% 55%, ${color} 0%, #f59e0b 32%, #16a34a 65%, transparent 85%)`,
                  opacity: Math.max(0.35, n.intensity),
                }}
              >
                <span className="absolute top-1 right-1 text-[9px] font-mono px-1 rounded bg-black/60 text-white">
                  {n.riskPercent}%
                </span>
              </div>
              <div className="px-2.5 py-1.5 border-t border-border/40">
                <div className="text-[11.5px] font-semibold text-ink flex items-center justify-between">
                  <span>{n.label}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
                </div>
                <div className="text-[10px] font-mono text-ink-faint">{n.time}</div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
