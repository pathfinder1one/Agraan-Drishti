import type { LucideIcon } from "lucide-react";

export type RiskLevel = "extreme" | "high" | "moderate" | "low" | "verylow";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export interface DataSource {
  name: string;
  meta: string;
  status: "on" | "off";
}

export interface HazardForecastItem {
  name: string;
  icon: LucideIcon;
  value: number;
  level: "Severe" | "High" | "Moderate";
}

export interface ExposureItem {
  label: string;
  value: string;
  icon: LucideIcon;
}

export interface NowcastFrame {
  label: string;
  time: string;
  intensity: number;
}

export interface MetDriver {
  label: string;
  value: string;
  trend: "up" | "down" | "flat";
}

export interface AlertItem {
  time: string;
  text: string;
}

export interface MapMarker {
  id: string;
  name: string;
  x: string;
  y: string;
  level: RiskLevel;
  flashFlood: number;
  cloudburst: number;
  thunderstorm: number;
  eta: string;
  confidence: number;
}
