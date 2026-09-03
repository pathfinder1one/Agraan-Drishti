import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  X,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { Badge, LEVEL_COLOR } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HAZARD_LAYERS, EXPOSURE_LAYERS, MAP_MARKERS } from "@/data/mockData";

import { LiveMap } from "./LiveMap";

const MAP_MODES = ["Satellite View", "Terrain 3D", "Street Map"] as const;

interface RiskMapPanelProps {
  heatmapData: any[];
  onCellClick: (lat: number, lon: number) => void;
  selectedCell?: { lat: number; lon: number } | null;
  monitoredLocation?: { lat: number; lon: number } | null;
  activeLayer: string;
  onLayerChange: (layer: string) => void;
}

export function RiskMapPanel({ heatmapData, onCellClick, selectedCell, monitoredLocation, activeLayer, onLayerChange }: RiskMapPanelProps) {
  const [hazardLayer, setHazardLayer] = useState<string>("Flash Flood");
  const [hazardChecks, setHazardChecks] = useState<Record<string, boolean>>({
    [activeLayer]: true,
  });
  const [exposureChecks, setExposureChecks] = useState<Record<string, boolean>>({
    Population: true,
    Infrastructure: true,
  });
  const [mapMode, setMapMode] = useState<(typeof MAP_MODES)[number]>("Terrain 3D");
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
      mapInstance.flyTo([monitoredLocation.lat, monitoredLocation.lon], 9, {
        duration: 1.5,
        easeLinearity: 0.25,
      });
    } else if (mapInstance) {
      mapInstance.flyTo([30.28, 78.98], 8, {
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
    <Card>
      <CardHeader
        icon={MapIcon}
        title="Live risk map"
        right={
          <div className="hidden lg:flex items-center gap-2.5 text-[11px] text-ink-dim">
            <span>Nowcast: 0–6h</span>
            <span className="mx-0.5 opacity-40">·</span>
            {(["verylow", "low", "moderate", "high", "extreme"] as const).map((l) => (
              <span key={l} className="flex items-center gap-1 capitalize">
                <span className="w-2 h-2 rounded-full" style={{ background: LEVEL_COLOR[l] }} />
                {l === "verylow" ? "Very low" : l}
              </span>
            ))}
          </div>
        }
      />

      <div className="flex flex-col lg:flex-row">
        {/* Layer controls */}
        <div className="lg:w-52 shrink-0 p-3.5 space-y-4 border-b lg:border-b-0 lg:border-r border-border-soft">
          <div>
            <span className="text-[11px] font-semibold text-ink-dim">Hazard layer</span>
            <div className="flex items-center justify-between px-2.5 py-1.5 mt-1.5 mb-2 rounded-lg text-[12px] cursor-pointer bg-panel-alt border border-border">
              {hazardLayer}
              <ChevronDown size={13} className="text-ink-faint" />
            </div>
            {HAZARD_LAYERS.map((h) => (
              <Toggle
                key={h}
                label={h}
                checked={!!hazardChecks[h]}
                onChange={(v) => {
                  setHazardChecks({ [h]: true }); // Only one layer active at a time for API
                  if (v) onLayerChange(h);
                }}
              />
            ))}
          </div>
          <div>
            <span className="text-[11px] font-semibold text-ink-dim">Exposure layer</span>
            <div className="mt-1.5">
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
          <div className="space-y-1.5 pt-1">
            {MAP_MODES.map((m) => (
              <button
                key={m}
                onClick={() => setMapMode(m)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] transition-colors border ${
                  mapMode === m
                    ? "bg-accent text-white border-accent"
                    : "bg-panel-alt text-ink-dim border-border hover:text-ink"
                }`}
              >
                <Layers size={13} /> {m}
              </button>
            ))}
          </div>
        </div>

        {/* Map canvas */}
        <div ref={mapContainerRef} className="relative flex-1 min-h-[480px] bg-[#0b0f18] overflow-hidden rounded-br-xl">
          <LiveMap 
            heatmapData={heatmapData} 
            activeLayer={activeLayer} 
            mapMode={mapMode} 
            onCellClick={onCellClick}
            selectedCell={selectedCell}
            monitoredLocation={monitoredLocation}
            onMapReady={setMapInstance}
          />

          {/* Interactive Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-10">
            <button
              onClick={handleZoomIn}
              title="Zoom In (+)"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:brightness-125 hover:bg-panel active:scale-95 bg-panel/90 border border-border shadow-md text-ink-dim hover:text-ink cursor-pointer"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out (-)"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:brightness-125 hover:bg-panel active:scale-95 bg-panel/90 border border-border shadow-md text-ink-dim hover:text-ink cursor-pointer"
            >
              <Minus size={14} />
            </button>
            <button
              onClick={handleRecenter}
              title="Recenter Map on Monitored Epicenter"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:brightness-125 hover:bg-panel active:scale-95 bg-panel/90 border border-border shadow-md text-ink-dim hover:text-ink cursor-pointer"
            >
              <Compass size={14} />
            </button>
            <button
              onClick={handleCycleMode}
              title={`Switch Base Layer: ${mapMode} (Click to toggle)`}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:brightness-125 hover:bg-panel active:scale-95 bg-panel/90 border border-border shadow-md text-ink-dim hover:text-ink cursor-pointer"
            >
              <Layers size={14} />
            </button>
            <button
              onClick={handleToggleFullscreen}
              title="Toggle Fullscreen Map"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:brightness-125 hover:bg-panel active:scale-95 bg-panel/90 border border-border shadow-md text-ink-dim hover:text-ink cursor-pointer"
            >
              <Maximize2 size={14} />
            </button>
          </div>

          {/* Interactive Time Animation Bar */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] text-ink-dim bg-panel/90 backdrop-blur-md border border-border z-10 shadow-md">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-bold transition-colors cursor-pointer"
              title={isPlaying ? "Pause Nowcast Animation" : "Play Nowcast Animation"}
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} />}
              <span>{isPlaying ? "Pause" : "Play"}</span>
            </button>
            <span className="text-border">|</span>
            <input 
              type="range" 
              min={0} 
              max={6} 
              value={animHour} 
              onChange={(e) => setAnimHour(parseInt(e.target.value))} 
              className="w-24 accent-blue-500 cursor-pointer" 
            />
            <span className="font-mono font-semibold text-ink">+{animHour}h Nowcast</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
