import React, { useRef, useState, useEffect } from "react";
import { Clock3, ChevronLeft, ChevronRight, Activity } from "lucide-react";
import { BentoCard, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
    <BentoCard glowBorder="none">
      <CardHeader
        icon={Clock3}
        title="Nowcast Temporal Timeline"
        subtitle="0–6 Hour Continuous Radar & Precipitation Nowcast"
        right={
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-ink-faint flex items-center gap-1.5 px-2 py-0.5 rounded bg-secondary border border-border">
              <Activity size={11} className="text-accent animate-pulse" /> Live Nowcast Window
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => scroll(-1)}
                className="w-6 h-6 rounded-md flex items-center justify-center bg-panel-alt border border-border hover:text-ink text-ink-dim cursor-pointer transition-colors shadow-2xs"
                title="Scroll Left"
              >
                <ChevronLeft size={13} />
              </button>
              <button
                onClick={() => scroll(1)}
                className="w-6 h-6 rounded-md flex items-center justify-center bg-panel-alt border border-border hover:text-ink text-ink-dim cursor-pointer transition-colors shadow-2xs"
                title="Scroll Right"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        }
      />
      <div ref={trackRef} className="flex gap-2.5 p-3.5 overflow-x-auto scroll-smooth">
        {dynamicFrames.map((n) => {
          const isSelected = forecastHour === n.hour;
          const color = n.intensity >= 0.70 ? '#c92a2a' : n.intensity >= 0.45 ? '#f5b35a' : '#246b38';

          return (
            <motion.button
              key={n.label}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onHourSelect(n.hour)}
              className={cn(
                "shrink-0 w-32 rounded-lg overflow-hidden text-left transition-all border cursor-pointer",
                isSelected 
                  ? "border-accent bg-secondary ring-2 ring-accent/30 shadow-xs" 
                  : "border-border/70 bg-panel-alt/70 hover:border-border hover:bg-panel-alt shadow-2xs"
              )}
            >
              <div
                className="h-14 relative overflow-hidden"
                style={{
                  backgroundImage: `radial-gradient(circle at 50% 55%, ${color} 0%, #f5b35a 40%, #246b38 75%, transparent 95%)`,
                  opacity: Math.max(0.4, n.intensity),
                }}
              >
                <span className="absolute top-1.5 right-1.5 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/70 text-white backdrop-blur-xs">
                  {n.riskPercent}%
                </span>
              </div>
              <div className="px-2.5 py-2 border-t border-border/50 bg-panel">
                <div className="text-[11px] font-bold text-ink flex items-center justify-between">
                  <span>{n.label}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
                </div>
                <div className="text-[10px] font-mono text-ink-faint mt-0.5">{n.time}</div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </BentoCard>
  );
}
