import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { AlertTicker } from "@/components/layout/AlertTicker";
import { RiskMapPanel } from "@/components/dashboard/RiskMapPanel";
import { HazardForecastPanel } from "@/components/dashboard/HazardForecastPanel";
import { ExposureOverviewPanel } from "@/components/dashboard/ExposureOverviewPanel";
import { RecommendedActionsPanel } from "@/components/dashboard/RecommendedActionsPanel";
import { NowcastTimeline } from "@/components/dashboard/NowcastTimeline";
import { SatellitePanel } from "@/components/dashboard/SatellitePanel";
import { RadarPanel } from "@/components/dashboard/RadarPanel";
import { MetDriversPanel } from "@/components/dashboard/MetDriversPanel";
import { ImpactPredictionPanel } from "@/components/dashboard/ImpactPredictionPanel";
import { SafeRoutePanel } from "@/components/dashboard/SafeRoutePanel";
import { XAIPanel } from "@/components/dashboard/XAIPanel";

export default function App() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [heatmapData, setHeatmapData] = useState([]);
  const [activeLayer, setActiveLayer] = useState("Flash Flood");
  const [forecastHour, setForecastHour] = useState(0);
  const [selectedCell, setSelectedCell] = useState<{lat: number; lon: number} | null>(null);
  const [xaiData, setXaiData] = useState(null);
  const [maxRisks, setMaxRisks] = useState({ flash_flood: 0, cloudburst: 0, thunderstorm: 0 });
  const [monitoredLocation, setMonitoredLocation] = useState({ lat: 30.73, lon: 79.06 });

  const API_BASE = "http://localhost:8000";

  useEffect(() => {
    const layerParam = activeLayer.toLowerCase().replace(' ', '_');
    fetch(`${API_BASE}/api/predict?event_type=${layerParam}&forecast_hour=${forecastHour}&lat=${monitoredLocation.lat}&lon=${monitoredLocation.lon}`)
      .then(res => res.json())
      .then(data => {
        setHeatmapData(data.heatmap || []);
        if (data.all_max_risks) {
          setMaxRisks(data.all_max_risks);
        }
      })
      .catch(console.error);
  }, [activeLayer, forecastHour, monitoredLocation]);

  const handleCellClick = async (lat: number, lon: number) => {
    setSelectedCell({ lat, lon });
    try {
      const res = await fetch(`${API_BASE}/api/xai/${lat}/${lon}?center_lat=${monitoredLocation.lat}&center_lon=${monitoredLocation.lon}`);
      const data = await res.json();
      setXaiData(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-bg text-ink font-sans">
      <Header />

      <div className="flex flex-1 min-h-0">
        <Sidebar activeNav={activeNav} onSelect={setActiveNav} />

        <main className="flex-1 overflow-y-auto max-h-[calc(100vh-61px)]">
          {activeNav === "dashboard" || activeNav === "live-map" ? (
            <div className="p-5 space-y-5 pb-8 max-w-[1920px] mx-auto">
              {/* Row 1: map + right rail */}
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">
                <RiskMapPanel 
                  heatmapData={heatmapData}
                  activeLayer={activeLayer}
                  onLayerChange={setActiveLayer}
                  onCellClick={handleCellClick}
                  selectedCell={selectedCell}
                  monitoredLocation={monitoredLocation}
                />
                <div className="space-y-5">
                  <XAIPanel data={xaiData} selectedCell={selectedCell} />
                  <HazardForecastPanel />
                  <ExposureOverviewPanel selectedCell={selectedCell} />
                  <RecommendedActionsPanel />
                </div>
              </div>

              {/* Row 2: nowcast timeline */}
              <NowcastTimeline />

              {/* Row 3: bottom panels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
                <SatellitePanel />
                <RadarPanel />
                <MetDriversPanel />
                <ImpactPredictionPanel />
                <SafeRoutePanel />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-ink-dim p-10 mt-20">
              <div className="text-6xl mb-4">🚧</div>
              <h2 className="text-2xl font-bold text-ink mb-2">Module under construction</h2>
              <p className="text-center max-w-md">
                The <strong>{activeNav.replace('-', ' ')}</strong> module will be fully integrated with existing NDRF & State Command Center APIs post-hackathon.
              </p>
            </div>
          )}
        </main>
      </div>

      <AlertTicker />
    </div>
  );
}
