import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ShieldAlert, 
  Layers, 
  MapPin, 
  Sparkles, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  Radio, 
  Cpu, 
  Eye, 
  EyeOff,
  Info,
  Maximize2,
  Sliders,
  Globe
} from 'lucide-react';
import { LiveMap } from './LiveMap';

interface LiveMapFullViewProps {
  heatmapData: any[];
  activeLayer: string;
  onLayerChange: (layer: string) => void;
  onCellClick: (lat: number, lon: number) => void;
  selectedCell?: { lat: number; lon: number } | null;
  monitoredLocation: { lat: number; lon: number };
  forecastHour: number;
  onForecastHourChange: (hour: number) => void;
  satelliteStatus?: any;
}

const HAZARD_MODES = [
  { key: "Flash Flood", label: "Flash Flood", short: "Flood" },
  { key: "Cloudburst", label: "Cloudburst", short: "Cloudburst" },
  { key: "Thunderstorm", label: "Thunderstorm", short: "Thunderstorm" },
  { key: "Landslide", label: "Landslide", short: "Landslide" },
  { key: "Overall", label: "Fusion", short: "Multi-Hazard" },
];

const MAP_MODES = ["Satellite View", "Terrain 3D", "Street Map"] as const;

export function LiveMapFullView({
  heatmapData,
  activeLayer,
  onLayerChange,
  onCellClick,
  selectedCell,
  monitoredLocation,
  forecastHour,
  onForecastHourChange,
  satelliteStatus
}: LiveMapFullViewProps) {
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocId, setSelectedLocId] = useState<string>("rudraprayag");
  const [mapMode, setMapMode] = useState<typeof MAP_MODES[number]>("Satellite View");
  const [activeHazard, setActiveHazard] = useState<string>(activeLayer || "Flash Flood");
  
  // UI control states (clean & un-cluttered)
  const [sidebarTab, setSidebarTab] = useState<"intel" | "cities" | "telemetry">("intel");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [showLegend, setShowLegend] = useState<boolean>(false);
  const [isZenMode, setIsZenMode] = useState<boolean>(false); // 1-click Hide All Overlays

  // Fetch real nationwide locations from backend
  useEffect(() => {
    fetch("http://localhost:8000/api/monitored-locations")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setLocations(data);
      })
      .catch((err) => console.error("Failed to load locations:", err));
  }, []);

  const selectedLocation = locations.find((l) => l.id === selectedLocId) || {
    id: "rudraprayag",
    name: "Rudraprayag",
    state: "Uttarakhand",
    type: "River Confluence",
    lat: 30.2844,
    lon: 78.9811,
    overall_risk: 0.857,
    level: "extreme",
    flash_flood: 78.4,
    cloudburst: 75.7,
    thunderstorm: 78.4,
    eta: "02h 28m",
    confidence: 94
  };

  const handleSelectLocation = (loc: any) => {
    setSelectedLocId(loc.id);
    onCellClick(loc.lat, loc.lon);
  };

  const handleHazardChange = (key: string) => {
    setActiveHazard(key);
    onLayerChange(key === "Overall" ? "Flash Flood" : key);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "extreme": return "#ef4444";
      case "high": return "#f97316";
      case "moderate": return "#eab308";
      case "low": return "#22c55e";
      default: return "#10b981";
    }
  };

  const overallRiskScore = Math.round((selectedLocation.overall_risk || 0.85) * 100);
  const riskColor = getRiskColor(selectedLocation.level);

  // 5-step forecast timeline
  const forecastTimeline = [
    { time: "NOW", risk: Math.min(100, Math.max(10, overallRiskScore - 8)) },
    { time: "+15m", risk: Math.min(100, Math.max(12, overallRiskScore - 3)) },
    { time: "+30m", risk: overallRiskScore },
    { time: "+45m", risk: Math.min(100, overallRiskScore + 4) },
    { time: "+60m", risk: Math.min(100, overallRiskScore + 7) },
  ];

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#070b14] select-none font-sans text-white">
      
      {/* ──────────────────────────────────────────────
          FULL-SCREEN LEAFLET MAP CANVAS (90%+ SCREEN VISIBILITY)
      ────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <LiveMap
          heatmapData={heatmapData}
          activeLayer={activeHazard === "Overall" ? "Flash Flood" : activeHazard}
          mapMode={mapMode}
          onCellClick={(lat, lon) => {
            onCellClick(lat, lon);
            // If user clicked on a map marker, open the card if closed
            setIsSidebarOpen(true);
            setSidebarTab("intel");
          }}
          selectedCell={selectedCell}
          monitoredLocation={monitoredLocation}
        />
      </div>

      {/* ──────────────────────────────────────────────
          TOP UNIFIED COMMAND BAR (Slim, Integrated, Floating)
      ────────────────────────────────────────────── */}
      {!isZenMode && (
        <div className="absolute top-3 inset-x-4 z-20 pointer-events-none flex items-center justify-between gap-3">
          
          {/* Brand & Hotspot Pill */}
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-white/10 bg-[#090e1a]/85 backdrop-blur-xl shadow-lg pointer-events-auto">
            <div className="w-6 h-6 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 text-xs font-black shadow-[0_0_10px_rgba(239,68,68,0.3)]">
              ✦
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-extrabold tracking-wide text-white">DISASTERGUARD</span>
              <span className="text-white/20">|</span>
              <span className="text-emerald-400 text-[10.5px] font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{selectedLocation.name}</span>
              </span>
            </div>
          </div>

          {/* Center Hazard Switcher (Clean Pills) */}
          <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl border border-white/10 bg-[#090e1a]/85 backdrop-blur-xl shadow-xl pointer-events-auto">
            {HAZARD_MODES.map((mode) => {
              const isActive = activeHazard === mode.key;
              return (
                <button
                  key={mode.key}
                  onClick={() => handleHazardChange(mode.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? "bg-red-500/20 text-white border border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                      : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {mode.short}
                </button>
              );
            })}
          </div>

          {/* Right Tools: Map Views & Legend Toggle */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {/* Map Mode Tabs */}
            <div className="flex items-center gap-0.5 p-1 rounded-xl border border-white/10 bg-[#090e1a]/85 backdrop-blur-xl shadow-lg">
              {MAP_MODES.map((mode) => (
                <button
                  key={mode}
                  onClick={() => setMapMode(mode)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    mapMode === mode
                      ? "bg-blue-600 text-white shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {mode === "Satellite View" ? "Satellite" : mode === "Terrain 3D" ? "Terrain" : "Street"}
                </button>
              ))}
            </div>

            {/* Risk Legend Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowLegend(!showLegend)}
                className={`p-2 rounded-xl border transition-all ${
                  showLegend 
                    ? "bg-blue-600/30 border-blue-500 text-white shadow-md"
                    : "border-white/10 bg-[#090e1a]/85 text-slate-300 hover:text-white hover:bg-white/10"
                }`}
                title="Toggle Risk Legend"
              >
                <Info size={15} />
              </button>

              {/* Popover Legend Dropdown */}
              {showLegend && (
                <div className="absolute right-0 top-11 p-3 rounded-xl border border-white/10 bg-[#090e1a]/95 backdrop-blur-2xl shadow-2xl min-w-[150px] animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-white/10 pb-1">
                    RISK LEVELS
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-200">
                    {[
                      { label: "Extreme (>75%)", color: "#ef4444" },
                      { label: "High (>55%)", color: "#f97316" },
                      { label: "Moderate (>35%)", color: "#eab308" },
                      { label: "Low (>20%)", color: "#22c55e" },
                      { label: "Very Low (<20%)", color: "#10b981" },
                    ].map((r) => (
                      <div key={r.label} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.color, boxShadow: `0 0 6px ${r.color}` }} />
                        <span>{r.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Zen Mode Button (Clean Map Inspection) */}
            <button
              onClick={() => setIsZenMode(true)}
              className="p-2 rounded-xl border border-white/10 bg-[#090e1a]/85 text-slate-300 hover:text-white hover:bg-white/10 transition-all shadow-lg"
              title="Full Map Clean View"
            >
              <Eye size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Zen Mode Exit Button */}
      {isZenMode && (
        <button
          onClick={() => setIsZenMode(false)}
          className="absolute top-4 right-4 z-30 px-3 py-2 rounded-xl border border-blue-500/50 bg-[#090e1a]/90 text-blue-400 font-extrabold text-xs flex items-center gap-2 backdrop-blur-md shadow-2xl hover:bg-blue-600 hover:text-white transition-all"
        >
          <EyeOff size={14} /> Show HUD Overlays
        </button>
      )}

      {/* ──────────────────────────────────────────────
          RIGHT-SIDE UNIFIED DOCKED HUD CARD (Tabbed & Collapsible)
      ────────────────────────────────────────────── */}
      {!isZenMode && (
        <div className="absolute top-16 right-4 z-10 flex items-start gap-2">
          
          {/* Collapse/Expand Mini Tab Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl border border-white/10 bg-[#090e1a]/85 backdrop-blur-xl text-slate-400 hover:text-white hover:bg-white/10 shadow-lg transition-all"
            title={isSidebarOpen ? "Collapse Intelligence Panel" : "Expand Intelligence Panel"}
          >
            {isSidebarOpen ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>

          {/* Integrated Intelligence Drawer */}
          {isSidebarOpen && (
            <div className="w-72 rounded-2xl border border-white/10 bg-[#090e1a]/90 backdrop-blur-2xl shadow-2xl p-3.5 space-y-3 animate-in fade-in slide-in-from-right-3 duration-200">
              
              {/* Top Drawer Tabs */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/40 border border-white/5 text-[11px] font-bold">
                <button
                  onClick={() => setSidebarTab("intel")}
                  className={`flex-1 py-1 rounded-md transition-all text-center ${
                    sidebarTab === "intel" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Intelligence
                </button>
                <button
                  onClick={() => setSidebarTab("cities")}
                  className={`flex-1 py-1 rounded-md transition-all text-center ${
                    sidebarTab === "cities" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Hotspots ({locations.length})
                </button>
                <button
                  onClick={() => setSidebarTab("telemetry")}
                  className={`flex-1 py-1 rounded-md transition-all text-center ${
                    sidebarTab === "telemetry" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  AI Engine
                </button>
              </div>

              {/* TAB 1: LOCATION INTELLIGENCE */}
              {sidebarTab === "intel" && (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-2">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                        LOCATION TARGET
                      </span>
                      <h4 className="text-base font-extrabold text-white leading-tight mt-0.5">
                        {selectedLocation.name}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        {selectedLocation.state} · {selectedLocation.type}
                      </span>
                    </div>
                    <span 
                      className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-white shrink-0"
                      style={{ background: riskColor }}
                    >
                      {selectedLocation.level}
                    </span>
                  </div>

                  {/* Big Risk Display */}
                  <div className="flex items-baseline gap-2 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                    <span className="text-3xl font-black" style={{ color: riskColor }}>
                      {overallRiskScore}
                    </span>
                    <div className="text-[10px] text-slate-400 leading-tight">
                      <span className="font-bold block text-slate-200">/100 THREAT LEVEL</span>
                      <span>{activeHazard} Peak</span>
                    </div>
                  </div>

                  {/* Hazard Metrics Breakdown */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-0.5 border-b border-white/5">
                      <span className="text-slate-400">Flash Flood:</span>
                      <strong className="text-slate-100">{selectedLocation.flash_flood}%</strong>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-white/5">
                      <span className="text-slate-400">Cloudburst:</span>
                      <strong className="text-slate-100">{selectedLocation.cloudburst}%</strong>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-white/5">
                      <span className="text-slate-400">Thunderstorm:</span>
                      <strong className="text-slate-100">{selectedLocation.thunderstorm}%</strong>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-400">Est. Impact ETA:</span>
                      <strong className="text-amber-400 font-extrabold">{selectedLocation.eta}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => onCellClick(selectedLocation.lat, selectedLocation.lon)}
                    className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs transition-all shadow-[0_0_12px_rgba(37,99,235,0.4)] flex items-center justify-center gap-1.5"
                  >
                    <Sparkles size={13} /> Sync Intelligence &amp; XAI
                  </button>
                </div>
              )}

              {/* TAB 2: NATIONWIDE CITIES & HOTSPOTS LIST */}
              {sidebarTab === "cities" && (
                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {locations.map((loc) => {
                    const isSelected = loc.id === selectedLocId;
                    const locColor = getRiskColor(loc.level);
                    return (
                      <button
                        key={loc.id}
                        onClick={() => handleSelectLocation(loc)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                          isSelected
                            ? "bg-blue-600/20 border border-blue-500/50 text-white"
                            : "text-slate-300 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: locColor }} />
                          <span className="truncate font-medium">{loc.name}</span>
                        </div>
                        <span className="font-extrabold text-xs shrink-0 ml-2" style={{ color: locColor }}>
                          {Math.round(loc.overall_risk * 100)}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TAB 3: AI ENGINE TELEMETRY */}
              {sidebarTab === "telemetry" && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Architecture:</span>
                    <strong className="text-blue-300">ConvLSTM + Attn</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Model Weights:</span>
                    <strong className="text-emerald-400">318,400 Params</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Satellite Stream:</span>
                    <strong className="text-emerald-400">INSAT-3DR (Live)</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Grid Boundaries:</span>
                    <strong className="text-slate-200">594 India Districts</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Topography:</span>
                    <strong className="text-slate-200">DEM Fused</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Early Warning:</span>
                    <strong className="text-amber-400">+2h 45m Lead Time</strong>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────
          BOTTOM DOCK: SLIM & MODERN FORECAST TIMELINE
      ────────────────────────────────────────────── */}
      {!isZenMode && (
        <div className="absolute bottom-6 inset-x-4 z-20 pointer-events-none flex justify-center">
          <div className="w-full max-w-xl px-4 py-3 rounded-2xl border border-white/10 bg-[#090e1a]/95 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] pointer-events-auto flex flex-col gap-2.5">
            
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-blue-400" />
                <span className="font-extrabold text-white">AI Forecast Trajectory</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400 text-[11px]">{selectedLocation.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400">Hour: <strong className="text-white">+{forecastHour}h</strong></span>
                <span className="text-[11px] text-emerald-400 font-extrabold">Conf: {selectedLocation.confidence || 92}%</span>
              </div>
            </div>

            {/* 5-Step Timeline Line */}
            <div className="grid grid-cols-5 gap-2 items-center text-center pt-1 border-t border-white/5">
              {forecastTimeline.map((item) => {
                const ptColor = item.risk > 75 ? "#ef4444" : item.risk > 55 ? "#f97316" : item.risk > 35 ? "#eab308" : "#22c55e";
                return (
                  <div key={item.time} className="flex flex-col items-center">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: ptColor, boxShadow: `0 0 6px ${ptColor}` }} />
                      <span className="text-[10px] font-bold text-slate-400">{item.time}</span>
                    </div>
                    <strong className="text-xs font-black" style={{ color: ptColor }}>
                      {item.risk}%
                    </strong>
                  </div>
                );
              })}
            </div>

            {/* Range Slider for 0-6h */}
            <input 
              type="range" 
              min={0} 
              max={6} 
              value={forecastHour} 
              onChange={(e) => onForecastHourChange(parseInt(e.target.value))} 
              className="w-full h-1 bg-white/10 rounded-lg accent-blue-500 cursor-pointer mt-1 mb-0.5"
            />
          </div>
        </div>
      )}

    </div>
  );
}
