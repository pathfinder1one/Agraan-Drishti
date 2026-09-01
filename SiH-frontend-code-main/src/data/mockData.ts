import {
  LayoutDashboard,
  Map as MapIcon,
  Clock3,
  CalendarRange,
  TriangleAlert,
  Users,
  Building2,
  Route as RouteIcon,
  FileBarChart,
  Waves,
  CloudLightning,
  CloudRain,
  Milestone,
  School,
  HeartPulse,
} from "lucide-react";
import type {
  NavItem,
  DataSource,
  HazardForecastItem,
  ExposureItem,
  NowcastFrame,
  MetDriver,
  AlertItem,
  MapMarker,
} from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "live-map", label: "Live Map", icon: MapIcon },
  { id: "nowcast", label: "Nowcast (0–6h)", icon: Clock3 },
  { id: "outlook", label: "Risk Outlook (1–6 Days)", icon: CalendarRange },
  { id: "alerts", label: "Alerts", icon: TriangleAlert, badge: 7 },
  { id: "exposure", label: "Exposure", icon: Users },
  { id: "infrastructure", label: "Infrastructure", icon: Building2 },
  { id: "routes", label: "Safe Routes", icon: RouteIcon },
  { id: "reports", label: "Reports & Analytics", icon: FileBarChart },
];

export const DATA_SOURCES: DataSource[] = [
  { name: "INSAT-3D/3DR", meta: "Live Satellite", status: "on" },
  { name: "IMDAA (NCMRWF)", meta: "Atmospheric Model", status: "on" },
  { name: "DWR Radar Network", meta: "Live Radar", status: "on" },
  { name: "AWS / Rain Gauges", meta: "528 Stations", status: "on" },
  { name: "QPE / Rainfall", meta: "Live Update", status: "on" },
  { name: "DEM / Terrain", meta: "High Resolution", status: "on" },
  { name: "Soil & Land Use", meta: "Runoff Model", status: "on" },
];

export const HAZARD_LAYERS = [
  "Thunderstorm",
  "Cloudburst",
  "Flash Flood",
  "Heavy Rainfall",
  "Landslide",
  "River Overflow",
] as const;

export const EXPOSURE_LAYERS = [
  "Population",
  "Infrastructure",
  "Hospitals",
  "Schools",
  "Roads",
  "Bridges",
] as const;

export const HAZARD_FORECAST: HazardForecastItem[] = [
  { name: "Flash Flood", icon: Waves, value: 91, level: "Severe" },
  { name: "Cloudburst", icon: CloudLightning, value: 78, level: "Severe" },
  { name: "Thunderstorm", icon: TriangleAlert, value: 85, level: "High" },
  { name: "Heavy Rainfall", icon: CloudRain, value: 88, level: "High" },
  { name: "Landslide", icon: Milestone, value: 62, level: "Moderate" },
  { name: "River Overflow", icon: Waves, value: 74, level: "High" },
];

export const EXPOSURE: ExposureItem[] = [
  { label: "Population", value: "18,420", icon: Users },
  { label: "Households", value: "4,125", icon: Building2 },
  { label: "Schools", value: "14", icon: School },
  { label: "Hospitals", value: "2", icon: HeartPulse },
  { label: "Bridges", value: "3", icon: Milestone },
  { label: "Roads (km)", value: "26.7", icon: RouteIcon },
];

export const RECOMMENDED_ACTIONS: string[] = [
  "Prepare for evacuation in low-lying areas",
  "Alert district administration",
  "Inspect bridges: Bridge 2, Bridge 3",
  "Avoid travel on Route B and C",
  "Monitor river level continuously",
];

export const NOWCAST: NowcastFrame[] = [
  { label: "Now", time: "10:00 AM", intensity: 0.55 },
  { label: "+1 Hour", time: "11:00 AM", intensity: 0.62 },
  { label: "+2 Hours", time: "12:00 PM", intensity: 0.7 },
  { label: "+3 Hours", time: "01:00 PM", intensity: 0.78 },
  { label: "+4 Hours", time: "02:00 PM", intensity: 0.85 },
  { label: "+5 Hours", time: "03:00 PM", intensity: 0.74 },
  { label: "+6 Hours", time: "04:00 PM", intensity: 0.6 },
];

export const MET_DRIVERS: MetDriver[] = [
  { label: "IWV (kg/m²)", value: "High", trend: "up" },
  { label: "CAPE (J/kg)", value: "High", trend: "up" },
  { label: "CIN (J/kg)", value: "Low", trend: "down" },
  { label: "Cloud Top Temp (°C)", value: "Very Low", trend: "down" },
  { label: "Rainfall Intensity (mm/hr)", value: "High", trend: "up" },
  { label: "Wind Shear (m/s)", value: "Moderate", trend: "flat" },
  { label: "Convergence (x10⁻⁵ s⁻¹)", value: "High", trend: "up" },
  { label: "Soil Saturation", value: "High", trend: "up" },
];

export const ALERT_FEED: AlertItem[] = [
  { time: "10:22 AM", text: "Extreme rainfall recorded in Gaurikund (83 mm/hr)" },
  { time: "10:21 AM", text: "Water level rising rapidly in Mandakini River" },
  { time: "10:20 AM", text: "Cloud-top cooling observed over Kedarnath region" },
  { time: "10:17 AM", text: "IMDAA model confidence updated to 86%" },
];

export const MAP_MARKERS: MapMarker[] = [
  { id: "gaurikund", name: "Gaurikund", x: "16%", y: "38%", level: "moderate", flashFlood: 68, cloudburst: 55, thunderstorm: 60, eta: "03h 40m", confidence: 79 },
  { id: "sonprayag", name: "Sonprayag", x: "22%", y: "55%", level: "low", flashFlood: 34, cloudburst: 22, thunderstorm: 40, eta: "05h 10m", confidence: 71 },
  { id: "tilwara", name: "Tilwara", x: "34%", y: "30%", level: "high", flashFlood: 80, cloudburst: 66, thunderstorm: 74, eta: "02h 55m", confidence: 83 },
  { id: "rudraprayag", name: "Rudraprayag", x: "42%", y: "48%", level: "extreme", flashFlood: 91, cloudburst: 78, thunderstorm: 85, eta: "02h 18m", confidence: 86 },
  { id: "augustmuni", name: "Augustmuni", x: "47%", y: "63%", level: "extreme", flashFlood: 89, cloudburst: 75, thunderstorm: 80, eta: "02h 40m", confidence: 84 },
  { id: "chopta", name: "Chopta", x: "55%", y: "36%", level: "high", flashFlood: 77, cloudburst: 60, thunderstorm: 70, eta: "03h 05m", confidence: 80 },
  { id: "karnaprayag", name: "Karnaprayag", x: "60%", y: "55%", level: "extreme", flashFlood: 90, cloudburst: 73, thunderstorm: 82, eta: "02h 30m", confidence: 85 },
  { id: "gopeshwar", name: "Gopeshwar", x: "68%", y: "40%", level: "moderate", flashFlood: 65, cloudburst: 50, thunderstorm: 58, eta: "04h 15m", confidence: 76 },
  { id: "nandprayag", name: "Nandprayag", x: "74%", y: "58%", level: "low", flashFlood: 38, cloudburst: 25, thunderstorm: 44, eta: "05h 45m", confidence: 70 },
];
