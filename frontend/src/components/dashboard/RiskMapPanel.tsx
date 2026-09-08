import { useState, useRef, useEffect } from "react";
import {
  Map as MapIcon,
  ChevronDown,
  Layers,
  Plus,
  Minus,
  Compass,
  Maximize2,
  Play,
  Pause,
  Radio,
} from "lucide-react";
import { BentoCard, CardHeader } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { LEVEL_COLOR } from "@/components/ui/badge";

import { LiveMap } from "./LiveMap";

const HAZARD_LAYERS = [
  "Thunderstorm",
  "Cloudburst",
  "Flash Flood",
  "Heavy Rainfall",
  "Landslide",
  "River Overflow",
] as const;

const EXPOSURE_LAYERS = [
  "Population",
  "Infrastructure",
  "Hospitals",
  "Schools",
  "Roads",
  "Bridges",
] as const;

const MAP_MODES = ["Satellite View", "Terrain 3D", "Street Map"] as const;

interface RiskMapPanelProps {
  heatmapData: any[];
  onCellClick: (lat: number, lon: number) => void;
  selectedCell?: { lat: number; lon: number } | null;
  monitoredLocation?: { lat: number; lon: number } | null;
  activeLayer: string;
  onLayerChange: (layer: string) => void;
  satelliteRevision?: number;
  onLaunchFullScreen?: () => void;
}

export function RiskMapPanel({ 
  heatmapData, 
  onCellClick, 
  selectedCell, 
  monitoredLocation, 
  activeLayer, 
  onLayerChange,
  satelliteRevision = 0,
  onLaunchFullScreen
}: RiskMapPanelProps) {
  const [hazardChecks, setHazardChecks] = useState<Record<string, boolean>>({
    [activeLayer]: true,
  });
  const [exposureChecks, setExposureChecks] = useState<Record<string, boolean>>({
    Population: true,
    Infrastructure: true,
  });
  const [mapMode, setMapMode] = useState<(typeof MAP_MODES)[number]>("Street Map");
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [animHour, setAnimHour] = useState<number>(0);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Time animation loop
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setAnimHour((h) => (h >= 6 ? 0 : h + 1));
      }, 1500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying]);

  const handleZoomIn = () => {
    if (mapInstance) {
      mapInstance.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstance) {
      mapInstance.zoomOut();
    }
  };

  const handleRecenter = () => {
    if (mapInstance && monitoredLocation) {
      mapInstance.flyTo([monitoredLocation.lat, monitoredLocation.lon], 15, {
        duration: 1.5,
        easeLinearity: 0.25,
      });
    } else if (mapInstance) {
      mapInstance.flyTo([30.28, 78.98], 15, {
        duration: 1.5,
      });
    }
  };

  const handleCycleMode = () => {
    const modes: (typeof MAP_MODES)[number][] = ["Terrain 3D", "Satellite View", "Street Map"];
    const nextIdx = (modes.indexOf(mapMode) + 1) % modes.length;
    setMapMode(modes[nextIdx]);
  };

  const handleToggleFullscreen = () => {
    const el = mapContainerRef.current;
    if (!document.fullscreenElement) {
      if (el?.requestFullscreen) {
        el.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <BentoCard glowBorder="accent" className="flex flex-col h-full min-w-0">
      <CardHeader
        icon={MapIcon}
        title="Live Geospatial Radar"
        subtitle="High-Resolution Hazard Nowcast & GIS Infrastructure Overlay"
        right={
          <div className="hidden sm:flex items-center gap-2.5 text-[11px] text-ink-dim">
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-secondary text-accent border border-border flex items-center gap-1 font-semibold">
              <Radio size={11} className="text-accent animate-pulse" /> Nowcast: 0–6h
            </span>
            <span className="mx-0.5 opacity-40">·</span>
            {(["verylow", "low", "moderate", "high", "extreme"] as const).map((l) => (
              <span key={l} className="flex items-center gap-1.5 capitalize font-medium text-[11px]">
                <span className="w-2 h-2 rounded-full ring-1 ring-black/10" style={{ background: LEVEL_COLOR[l] }} />
                {l === "verylow" ? "Very low" : l}
              </span>
            ))}
            {onLaunchFullScreen && (
              <button
                onClick={onLaunchFullScreen}
                className="ml-2 px-2.5 py-1 rounded-md bg-accent hover:opacity-90 text-white font-bold text-[11px] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Open Dedicated Fullscreen GIS Command"
              >
                <Maximize2 size={11} /> Fullscreen GIS
              </button>
            )}
          </div>
        }
      />


      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        {/* Layer controls sidebar */}
        <div className="lg:w-56 shrink-0 p-3.5 space-y-4 border-b lg:border-b-0 lg:border-r border-border/70 bg-panel/60">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">Active Hazard</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-secondary text-accent font-bold">LIVE</span>
            </div>
            <div className="space-y-1">
              {HAZARD_LAYERS.map((h) => {
                const isActive = !!hazardChecks[h];
                return (
                  <button
                    key={h}
                    onClick={() => {
                      setHazardChecks({ [h]: true });
                      onLayerChange(h);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11.5px] font-medium transition-all text-left cursor-pointer ${
                      isActive 
                        ? "bg-secondary text-accent border border-accent/40 shadow-2xs font-semibold" 
                        : "bg-panel-alt/50 text-ink-dim border border-transparent hover:bg-panel-alt hover:text-ink"
                    }`}
                  >
                    <span>{h}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-1 border-t border-border/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint block mb-1.5">Exposure Overlays</span>
            <div className="space-y-1">
              {EXPOSURE_LAYERS.map((e) => (
                <Toggle
                  key={e}
                  label={e}
                  checked={!!exposureChecks[e]}
                  onChange={(v) => setExposureChecks((s) => ({ ...s, [e]: v }))}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1 pt-1 border-t border-border/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint block mb-1.5">Basemap Projection</span>
            {MAP_MODES.map((m) => (
              <button
                key={m}
                onClick={() => setMapMode(m)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11.5px] transition-all cursor-pointer border ${
                  mapMode === m
                    ? "bg-accent text-white border-accent shadow-xs font-semibold"
                    : "bg-panel-alt/60 text-ink-dim border-border/70 hover:text-ink hover:bg-panel-alt"
                }`}
              >
                <Layers size={13} /> {m}
              </button>
            ))}
          </div>
        </div>

        {/* Map canvas */}
        <div ref={mapContainerRef} className="relative flex-1 min-h-[500px] bg-background overflow-hidden">
          <LiveMap 
            heatmapData={heatmapData} 
            activeLayer={activeLayer} 
            mapMode={mapMode} 
            onCellClick={onCellClick}
            selectedCell={selectedCell}
            monitoredLocation={monitoredLocation}
            onMapReady={setMapInstance}
            satelliteRevision={satelliteRevision}
          />

          {/* Interactive Map HUD Controls (Floating Top-Right) */}
          <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-10">
            <button
              onClick={handleZoomIn}
              title="Zoom In (+)"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:brightness-110 active:scale-95 bg-panel/95 backdrop-blur-md border border-border shadow-sm text-ink hover:text-accent cursor-pointer"
            >
              <Plus size={15} />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out (-)"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:brightness-110 active:scale-95 bg-panel/95 backdrop-blur-md border border-border shadow-sm text-ink hover:text-accent cursor-pointer"
            >
              <Minus size={15} />
            </button>
            <button
              onClick={handleRecenter}
              title="Recenter Map on Monitored Epicenter"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:brightness-110 active:scale-95 bg-panel/95 backdrop-blur-md border border-border shadow-sm text-ink hover:text-accent cursor-pointer"
            >
              <Compass size={15} />
            </button>
            <button
              onClick={handleCycleMode}
              title={`Switch Base Layer: ${mapMode} (Click to toggle)`}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:brightness-110 active:scale-95 bg-panel/95 backdrop-blur-md border border-border shadow-sm text-ink hover:text-accent cursor-pointer"
            >
              <Layers size={15} />
            </button>
            <button
              onClick={handleToggleFullscreen}
              title="Toggle Fullscreen Map"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:brightness-110 active:scale-95 bg-panel/95 backdrop-blur-md border border-border shadow-sm text-ink hover:text-accent cursor-pointer"
            >
              <Maximize2 size={15} />
            </button>
          </div>

          {/* Interactive Time Animation Bar (Floating Bottom-Left) */}
          <div className="absolute bottom-4 left-4 flex items-center gap-3 px-3.5 py-2 rounded-lg text-[11.5px] text-ink bg-panel/95 backdrop-blur-md border border-border z-10 shadow-md">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 text-accent hover:opacity-85 font-bold transition-all cursor-pointer"
              title={isPlaying ? "Pause Nowcast Animation" : "Play Nowcast Animation"}
            >
              {isPlaying ? <Pause size={14} className="fill-accent" /> : <Play size={14} className="fill-accent" />}
              <span>{isPlaying ? "Pause" : "Play"}</span>
            </button>
            <span className="text-border">|</span>
            <input 
              type="range" 
              min={0} 
              max={6} 
              value={animHour} 
              onChange={(e) => setAnimHour(parseInt(e.target.value))} 
              className="w-24 accent-[#246b38] cursor-pointer" 
            />
            <span className="font-mono font-bold text-accent bg-secondary px-2 py-0.5 rounded border border-border/80 text-[10.5px]">
              +{animHour}h Nowcast
            </span>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}

