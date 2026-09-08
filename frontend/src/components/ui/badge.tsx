import React from "react";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types";

const LEVEL_COLOR: Record<RiskLevel, string> = {
  extreme: "#ef4444",
  high: "#f59e0b",
  moderate: "#eab308",
  low: "#22c55e",
  verylow: "#16a34a",
};

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  level?: RiskLevel;
  className?: string;
}

export function Badge({ children, color, level, className }: BadgeProps) {
  const resolved = color ?? (level ? LEVEL_COLOR[level] : LEVEL_COLOR.moderate);
  return (
    <span
      className={cn(
        "inline-flex items-center text-[11px] font-semibold px-2 py-1 rounded-md tracking-wide leading-none",
        className
      )}
      style={{ background: `${resolved}22`, color: resolved }}
    >
      {children}
    </span>
  );
}

export function levelFromLabel(level: "Severe" | "High" | "Moderate" | string): RiskLevel {
  if (level === "Severe") return "extreme";
  if (level === "High") return "high";
  if (level === "Low") return "low";
  return "moderate";
}

export { LEVEL_COLOR };
