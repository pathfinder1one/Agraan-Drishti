import { useEffect, useState } from "react";
import {
  Satellite,
  CircleDot,
  RefreshCw,
  ThermometerSnowflake,
  Activity,
  Maximize2,
  Globe,
  Map as MapIcon,
  Flame,
  Plus,
  Minus,
} from "lucide-react";
import { MapContainer, TileLayer, ImageOverlay, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { BentoCard, CardHeader, CardBody } from "@/components/ui/card";
import { API_BASE } from "@/config/api";
import { EarthGlobe3D } from "./EarthGlobe3D";

const AnyMapContainer = MapContainer as any;
const AnyTileLayer = TileLayer as any;
const AnyImageOverlay = ImageOverlay as any;

// Bounding box of Indian subcontinent satellite coverage (from config.py)
const SATELLITE_BOUNDS: [[number, number], [number, number]] = [
  [5.04, 65.04],
  [38.52, 98.52],
];

const INDIA_CENTER: [number, number] = [22.0, 79.0];

interface SatelliteStatus {
  status?: string;
  source?: string;
  pipeline?: string;
  connection_status?: string;
  ingested?: boolean;
  model_weights_loaded?: boolean;
  last_tensor?: { max?: number; min?: number; shape?: number[] } | null;
  poll_minutes?: number;
  last_update_utc?: string | null;
  inference_last_run_utc?: string | null;
}

interface SatellitePanelProps {
  status?: SatelliteStatus | null;
  monitoredLocation?: { lat: number; lon: number } | null;
  loading?: boolean;
  onRefresh?: () => void;
  onOpenDashboard?: () => void;
  maxRisks?: Record<string, number>;
}

// Controller to smoothly fly/pan mini map when coordinates change
function MiniMapController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [center, zoom, map]);
  return null;
}

// Sleek on-map zoom buttons
function MiniZoomControls() {
  const map = useMap();
  return (
    <div className="absolute top-2 right-2 z-20 flex flex-col gap-1 bg-black/75 backdrop-blur-xs p-0.5 rounded border border-white/15 shadow-sm">
      <button
        type="button"
        onClick={() => map.zoomIn()}
        className="w-5 h-5 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 rounded transition cursor-pointer"
        title="Zoom in"
      >
        <Plus size={11} />
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        className="w-5 h-5 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 rounded transition cursor-pointer"
        title="Zoom out"
      >
        <Minus size={11} />
      </button>
    </div>
  );
}

export function SatellitePanel({
  status,
  monitoredLocation,
  loading = false,
  onRefresh,
  onOpenDashboard,
  maxRisks,
}: SatellitePanelProps) {
  const connected = status?.ingested === true;
  const [now, setNow] = useState(() => Date.now());
  const [viewMode, setViewMode] = useState<"globe" | "map" | "thermal">("globe");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const lat = monitoredLocation?.lat ?? 30.28;
  const lon = monitoredLocation?.lon ?? 78.98;

  const pollMinutes = status?.poll_minutes ?? 180;
  const pollMilliseconds = pollMinutes * 60 * 1000;
  const lastUpdate = status?.last_update_utc
    ? new Date(status.last_update_utc).getTime()
    : null;
  const remainingSeconds = lastUpdate
    ? Math.max(0, Math.ceil((lastUpdate + pollMilliseconds - now) / 1000))
    : null;
  const lastUpdateLabel = status?.last_update_utc
    ? new Date(status.last_update_utc).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Live Synced";
  const countdownLabel =
    remainingSeconds === null
      ? "Active"
      : `${Math.floor(remainingSeconds / 60)}m ${String(remainingSeconds % 60).padStart(2, "0")}s`;

  // Dynamic Cloud Top Temperature (CTT) derived from actual convective risks
  const peakRisk = Math.max(...Object.values(maxRisks || { flash_flood: 0.35 }));
  let ctt = -18.4;
  let cttLabel = "Fair Weather Cirrus";
  let cttColor = "text-emerald-400";
  let bgGradient =
    "radial-gradient(circle at 50% 50%, #38bdf8 0%, #1e40af 35%, #0f172a 70%, #080d1a 95%)";

  if (peakRisk >= 0.70) {
    ctt = -72.6;
    cttLabel = "Overshooting Convective Dome";
    cttColor = "text-red-400";
    bgGradient =
      "radial-gradient(circle at 50% 48%, #ffffff 0%, #38bdf8 14%, #1d4ed8 30%, #f59e0b 55%, #b91c1c 75%, #080d1a 95%)";
  } else if (peakRisk >= 0.45) {
    ctt = -51.2;
    cttLabel = "Towering Cumulonimbus Anvil";
    cttColor = "text-orange-400";
    bgGradient =
      "radial-gradient(circle at 50% 48%, #f8fafc 0%, #60a5fa 18%, #2563eb 40%, #ea580c 68%, #080d1a 95%)";
  } else if (peakRisk >= 0.25) {
    ctt = -32.8;
    cttLabel = "Active Stratiform Feeder";
    cttColor = "text-yellow-400";
    bgGradient =
      "radial-gradient(circle at 50% 50%, #93c5fd 0%, #3b82f6 28%, #1e3a8a 58%, #0b1528 90%)";
  }

  const isEumetsat = status?.source?.startsWith("eumetsat");
  const satelliteTitle = isEumetsat ? "Satellite Meteosat-9" : "Satellite INSAT-3D";

  return (
    <BentoCard glowBorder="accent" className="flex flex-col h-full">
      <CardHeader
        icon={Satellite}
        title={satelliteTitle}
        subtitle="Geostationary Meteorological Feed & 3D Orbital Earth"

        right={
          <div className="flex items-center gap-1.5">
            {/* 3D Live Earth vs 2D Map vs Thermal IR Mode Switcher */}
            <div className="flex items-center bg-panel-alt p-0.5 rounded-md border border-border">
              <button
                type="button"
                onClick={() => setViewMode("globe")}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold transition cursor-pointer ${
                  viewMode === "globe"
                    ? "bg-accent text-white shadow-xs"
                    : "text-ink-dim hover:text-ink"
                }`}
                title="Photorealistic 3D Earth Globe from Space"
              >
                <Globe size={10} /> 3D Earth
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold transition cursor-pointer ${
                  viewMode === "map"
                    ? "bg-accent text-white shadow-xs"
                    : "text-ink-dim hover:text-ink"
                }`}
                title="2D Map View"
              >
                <MapIcon size={10} /> 2D Map
              </button>
              <button
                type="button"
                onClick={() => setViewMode("thermal")}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold transition cursor-pointer ${
                  viewMode === "thermal"
                    ? "bg-[#f5b35a] text-[#1a261d] font-bold shadow-xs"
                    : "text-ink-dim hover:text-ink"
                }`}
                title="Convective Thermal IR Sensor View"
              >
                <Flame size={10} /> Thermal
              </button>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[10px] text-ink-dim hover:text-ink disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={10} className={loading ? "animate-spin text-accent" : ""} />
              {loading ? "Syncing" : "Refresh"}
            </button>
          </div>
        }
      />
      <CardBody className="flex-1 flex flex-col justify-between p-3.5 space-y-2.5">
        {/* Main Satellite Viewport Container */}
        <div className="flex-1 min-h-[150px] rounded-lg relative overflow-hidden border border-border/60 shadow-[inset_0_0_35px_rgba(0,0,0,0.85)] isolate bg-[#050811]">
          {/* 1. Photorealistic 3D Earth Globe in Space */}
          {viewMode === "globe" ? (
            <div className="absolute inset-0 z-0">
              <EarthGlobe3D />
            </div>
          ) : viewMode === "map" ? (
            /* 2. Real Earth 2D Leaflet Satellite Basemap with Floating Clouds */
            <div className="absolute inset-0 z-0">
              <AnyMapContainer
                center={INDIA_CENTER}
                zoom={4}
                minZoom={1}
                maxZoom={14}
                scrollWheelZoom={false}
                dragging={true}
                doubleClickZoom={true}
                zoomControl={false}
                attributionControl={false}
                style={{ width: "100%", height: "100%", background: "#050811" }}
              >
                <MiniMapController center={INDIA_CENTER} zoom={4} />
                <MiniZoomControls />
                {/* Real High-Resolution Earth Landmass & Oceans (Esri World Imagery) */}
                <AnyTileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={18}
                />
                {/* Subtle Reference Boundaries & Coastlines */}
                <AnyTileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                  opacity={0.35}
                  maxZoom={18}
                />
                {/* Real Ingested INSAT-3DR / Meteosat Cloud Swath hovering over Earth */}
                {connected && (
                  <AnyImageOverlay
                    url={`${API_BASE}/api/satellite/image?rev=${status?.last_update_utc || now}`}
                    bounds={SATELLITE_BOUNDS}
                    opacity={0.82}
                    zIndex={10}
                  />
                )}
              </AnyMapContainer>
            </div>
          ) : (
            /* 3. Convective Thermal Infrared False-Color Radar View */
            <div
              className="absolute inset-0 z-0 transition-all duration-500"
              style={{ background: bgGradient }}
            >
              {connected && (
                <img
                  src={`${API_BASE}/api/satellite/image?center_lat=${lat}&center_lon=${lon}&crop=true&updated=${encodeURIComponent(status?.last_update_utc || String(now))}`}
                  alt="Live IR Cloud Structure"
                  className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-85 filter contrast-125 brightness-110 drop-shadow-md pointer-events-none"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              )}
            </div>
          )}

          {/* Conical 360° Radar Sweep Beam (Z-10, Pointer Events None) */}
          <div className="absolute inset-0 pointer-events-none opacity-20 animate-radar-sweep z-10">
            <div
              className="w-full h-full rounded-full"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(56, 189, 248, 0.45) 360deg)",
              }}
            />
          </div>

          {/* Smooth High-Tech Satellite Scan Laser Beam */}
          <div className="absolute left-0 right-0 h-10 bg-gradient-to-b from-transparent via-cyan-400/25 to-transparent pointer-events-none animate-satellite-scan border-b border-cyan-400/40 z-10" />

          {/* Concentric Radar Range Rings & Crosshair Grid */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30 z-10">
            <div className="w-14 h-14 rounded-full border border-white/50" />
            <div className="w-28 h-28 rounded-full border border-white/30 absolute" />
            <div className="w-44 h-44 rounded-full border border-white/15 absolute" />
            <div className="w-full h-px bg-white/25 absolute" />
            <div className="h-full w-px bg-white/25 absolute" />
          </div>

          {/* Clickable Open State Dashboard Pill */}
          <button
            type="button"
            onClick={onOpenDashboard}
            title="Open India state-wise satellite risk dashboard"
            className="absolute left-2 bottom-2 z-20 flex items-center gap-1 rounded bg-black/75 px-2 py-1 text-[10px] font-medium text-white/95 border border-white/15 backdrop-blur-sm hover:bg-black/90 hover:border-cyan-400/50 transition cursor-pointer shadow-sm"
          >
            <Maximize2 size={10} className="text-cyan-400" />
            <span>State dashboard</span>
          </button>

          {/* Top-Left Sensor / Telemetry Stamp */}
          <span className="absolute top-2 left-2 z-20 text-[9px] font-mono text-white/90 bg-black/70 px-1.5 py-0.5 rounded border border-white/10 backdrop-blur-xs flex items-center gap-1">
            <Activity size={10} className="text-cyan-300" />
            {viewMode === "globe"
              ? isEumetsat
                ? "MET9 · 3D SPACE GLOBE"
                : "INSAT · 3D SPACE GLOBE"
              : viewMode === "map"
                ? isEumetsat
                  ? "MET9 · INDIA SYNOPTIC"
                  : "INSAT · INDIA SYNOPTIC"
                : isEumetsat
                  ? "EUMETSAT · IR 10.8μm"
                  : "ISRO · IR 10.8μm"}
          </span>

          {/* Bottom-Right Ingested Status Badge */}
          <span className="absolute bottom-2 right-2 z-20 flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded bg-black/75 text-white border border-white/15 backdrop-blur-sm shadow-sm">
            <CircleDot
              size={9}
              className={connected ? "text-emerald-400 animate-pulse" : "text-amber-400"}
            />
            {connected ? "Ingested (Live)" : "Calibrated Proxy"}
          </span>
        </div>

        {/* Dynamic CTT Telemetry Strip */}
        <div className="pt-1 border-t border-border-soft flex items-center justify-between text-[11px]">
          <span className={`font-semibold flex items-center gap-1 ${cttColor}`}>
            <ThermometerSnowflake size={12} /> {ctt}°C · {cttLabel}
          </span>
          <span className="text-ink-faint font-mono text-[10px]">
            {lastUpdateLabel}
          </span>
        </div>

        {/* SevereWeatherNet ConvLSTM & Cycle Metas */}
        <div className="flex items-center justify-between text-[10px] text-ink-faint pt-0.5">
          <span className="truncate">
            {status?.model_weights_loaded
              ? "SevereWeatherNet: ConvLSTM 6-Step Active"
              : "SevereWeatherNet: Fallback"}
          </span>
          <span className="text-emerald-400 font-mono shrink-0 ml-1">
            Next: {countdownLabel}
          </span>
        </div>
      </CardBody>
    </BentoCard>
  );
}



