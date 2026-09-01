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
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldAlert, Bell, Activity } from 'lucide-react';

export default function App() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [heatmapData, setHeatmapData] = useState([]);
  const [activeLayer, setActiveLayer] = useState("Flash Flood");
  const [forecastHour, setForecastHour] = useState(0);
  const [selectedCell, setSelectedCell] = useState(null);
  const [xaiData, setXaiData] = useState(null);
  const [maxRisks, setMaxRisks] = useState({ flash_flood: 0, cloudburst: 0, thunderstorm: 0 });
  const [monitoredLocation, setMonitoredLocation] = useState({ lat: 30.73, lon: 79.06 });
  const [showAutoAlert, setShowAutoAlert] = useState(false);
  const [showNdrfModal, setShowNdrfModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [locationName, setLocationName] = useState("Rudraprayag, Uttarakhand");
  const [isLiveLocation, setIsLiveLocation] = useState(false);

  const API_BASE = "http://localhost:8000";

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setMonitoredLocation({ lat, lon });
          setIsLiveLocation(true);

          // Reverse geocode
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`);
            const data = await res.json();
            if (data && data.address) {
              const city = data.address.city || data.address.town || data.address.village || data.address.county || "";
              const state = data.address.state || "";
              setLocationName(`${city}${city && state ? ', ' : ''}${state}`);
            }
          } catch (err) {
            console.error("Reverse geocoding failed", err);
          }
        },
        (error) => {
          console.warn("Geolocation denied or failed. Using fallback location.", error);
        }
      );
    }
  }, []);

  useEffect(() => {
    const layerParam = activeLayer.toLowerCase().replace(' ', '_');
    fetch(`${API_BASE}/api/predict?event_type=${layerParam}&forecast_hour=${forecastHour}&lat=${monitoredLocation.lat}&lon=${monitoredLocation.lon}`)
      .then(res => res.json())
      .then(data => {
        setHeatmapData(data.heatmap || []);
        if (data.all_max_risks) {
          setMaxRisks(data.all_max_risks);
          if ((data.all_max_risks.flash_flood > 0.85 || data.all_max_risks.cloudburst > 0.85 || data.all_max_risks.thunderstorm > 0.85) && forecastHour > 1) {
            setShowAutoAlert(true);
          }
        }
      })
      .catch(console.error);
  }, [activeLayer, forecastHour, monitoredLocation]);

  const handleCellClick = async (lat, lon) => {
    setSelectedCell({ lat, lon });
    try {
      const res = await fetch(`${API_BASE}/api/xai/${lat}/${lon}?center_lat=${monitoredLocation.lat}&center_lon=${monitoredLocation.lon}`);
      const data = await res.json();
      setXaiData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendAlert = () => {
    setShowSmsModal(true);
    setTimeout(() => {
      setShowNdrfModal(true);
    }, 3000);
  };

  const handleSearch = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      const city = searchQuery.trim()
      setIsSearching(true)
      
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&countrycodes=in`)
        const data = await res.json()
        
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat)
          const lon = parseFloat(data[0].lon)
          setMonitoredLocation({ lat, lon })
          setLocationName(data[0].display_name.split(',').slice(0, 2).join(', '))
          setIsLiveLocation(false)
          setSearchQuery('')
          setShowAutoAlert(false)
        } else {
          alert(`Could not find coordinates for "${city}". Please try a valid Indian city name.`)
        }
      } catch (err) {
        console.error(err)
        alert("Geocoding failed. Check network connection.")
      } finally {
        setIsSearching(false)
      }
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-bg text-ink font-sans">
      {/* Hackathon Alerts */}
      {showAutoAlert && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex justify-center items-center backdrop-blur-sm">
          <div className="bg-red-500 p-10 rounded-xl max-w-lg text-center text-white border-4 border-red-700 shadow-[0_0_50px_rgba(239,68,68,0.5)]">
            <ShieldAlert size={64} className="mx-auto mb-4" />
            <h1 className="mb-4 text-3xl font-black uppercase">CRITICAL: EARLY WARNING TRIGGERED</h1>
            <p className="text-lg mb-6">Extremely severe weather formation detected in monitored region within the next {forecastHour} hours.</p>
            <div className="flex gap-4 justify-center">
              <button className="px-5 py-2.5 bg-slate-900 rounded font-semibold text-white" onClick={() => setShowAutoAlert(false)}>Acknowledge & View Map</button>
              <button className="px-5 py-2.5 bg-white text-red-500 rounded font-bold" onClick={() => { setShowAutoAlert(false); handleSendAlert(); }}>Broadcast Alert to NDRF</button>
            </div>
          </div>
        </div>
      )}

      {/* Main UI */}
      <Header 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        isSearching={isSearching}
        locationName={locationName}
        isLiveLocation={isLiveLocation}
        maxRisks={maxRisks}
      />

      <div className="flex flex-1 min-h-0">
        <Sidebar activeNav={activeNav} onSelect={setActiveNav} />

        <main className="flex-1 overflow-y-auto max-h-[calc(100vh-61px)]">
          <div className="p-5 space-y-5 pb-8 max-w-[1920px] mx-auto">
            {/* Row 1: map + right rail */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">
              <div className="space-y-5 flex flex-col h-full">
                <RiskMapPanel 
                  heatmapData={heatmapData}
                  activeLayer={activeLayer}
                  onLayerChange={setActiveLayer}
                  onCellClick={handleCellClick}
                  selectedCell={selectedCell}
                  monitoredLocation={monitoredLocation}
                />
                <NowcastTimeline forecastHour={forecastHour} onHourSelect={setForecastHour} />
              </div>
              <div className="space-y-5">
                <XAIPanel data={xaiData} selectedCell={selectedCell} />
                <HazardForecastPanel maxRisks={maxRisks} />
                <ExposureOverviewPanel />
              </div>
            </div>

            {/* Row 2: bottom panels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
              <SatellitePanel />
              <RadarPanel />
              <MetDriversPanel />
              <ImpactPredictionPanel />
              <SafeRoutePanel />
            </div>

            {/* Action Row: Generate Alert */}
            <div className="mt-8 mb-4">
              <button onClick={handleSendAlert} className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-4 rounded-lg font-extrabold text-lg transition-colors shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                <ShieldAlert size={20} /> GENERATE ALERT & SITREP REPORT
              </button>
            </div>
          </div>
        </main>
      </div>

      <AlertTicker />

      {/* HACKATHON: SMS DISPATCH SIMULATOR MODAL */}
      <AnimatePresence>
        {showSmsModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-[#0d1321] border border-blue-500 rounded-xl w-[500px] p-6 shadow-[0_10px_40px_rgba(59,130,246,0.3)]"
            >
              <div className="flex justify-between mb-4">
                <h2 className="text-blue-400 text-lg font-extrabold flex items-center gap-2"><Bell size={20}/> DISPATCHING ALERTS</h2>
                <button onClick={() => setShowSmsModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <div className="bg-white/5 p-4 rounded-lg mb-3 border-l-4 border-blue-500">
                <p className="text-xs text-slate-300 mb-2">Target: Citizens in 5km radius (SMS & WhatsApp)</p>
                <p className="text-sm text-white font-medium">⚠️ चेतावनी: अगले 2 घंटे में भारी बारिश और बाढ़ की संभावना है। कृपया सुरक्षित स्थानों पर चले जाएं। (NDMA)</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg border-l-4 border-red-500">
                <p className="text-xs text-slate-300 mb-2">Target: DM Office, SDM, First Responders (API Push)</p>
                <p className="text-sm text-white font-medium">🚨 EXTREME RISK ALERT: Flash flood probability {maxRisks.flash_flood > 0 ? (maxRisks.flash_flood*100).toFixed(0) : 92}% near {selectedCell ? `${selectedCell.lat.toFixed(2)}, ${selectedCell.lon.toFixed(2)}` : 'Rudraprayag'}. Initiate immediate evacuation protocol.</p>
              </div>
              <div className="mt-5 text-center">
                <div className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-400 mt-2">Routing via NIC SMS Gateway...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HACKATHON: NDRF SITREP MODAL */}
      <AnimatePresence>
        {showNdrfModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-white text-black rounded w-[700px] p-10 shadow-2xl font-serif"
            >
              <div className="border-b-2 border-black pb-4 mb-6 text-center">
                <h1 className="text-2xl font-black uppercase tracking-widest mb-2">GOVERNMENT OF INDIA</h1>
                <h2 className="text-base font-bold">NATIONAL DISASTER RESPONSE FORCE (NDRF)</h2>
                <h3 className="text-sm font-semibold text-gray-700 mt-2">AUTOMATED SITUATIONAL REPORT (SITREP)</h3>
              </div>
              
              <div className="text-sm leading-relaxed">
                <div className="grid grid-cols-2 gap-5 mb-6">
                  <div>
                    <p><strong>REPORT ID:</strong> DG-AI-{Math.floor(Math.random()*10000)}</p>
                    <p><strong>DATE/TIME:</strong> {new Date().toLocaleString()}</p>
                    <p><strong>ISSUING AUTH:</strong> DisasterGuard AI Sys</p>
                  </div>
                  <div>
                    <p><strong>HAZARD TYPE:</strong> {activeLayer.replace('_', ' ').toUpperCase()}</p>
                    <p><strong>SEVERITY:</strong> CRITICAL (L3)</p>
                    <p><strong>COORDINATES:</strong> {selectedCell ? `${selectedCell.lat.toFixed(4)} N, ${selectedCell.lon.toFixed(4)} E` : '30.2800 N, 78.9800 E'}</p>
                  </div>
                </div>

                <div className="border border-gray-300 p-4 mb-6 bg-gray-50">
                  <h4 className="font-extrabold mb-2">1. EXPOSURE & IMPACT ESTIMATE</h4>
                  <ul className="pl-5 list-disc">
                    <li><strong>Est. Population at Risk:</strong> {selectedCell ? '18,420' : 'Approx 20,000'}</li>
                    <li><strong>Vulnerable Infrastructure:</strong> 14 Schools, 2 Hospitals, 3 Bridges</li>
                    <li><strong>Evacuation Window:</strong> {forecastHour} Hours</li>
                  </ul>
                </div>

                <div className="border border-gray-300 p-4 mb-6">
                  <h4 className="font-extrabold mb-2">2. AI PREDICTIVE PRECURSORS</h4>
                  <p>The AI model (Confidence: {(maxRisks[activeLayer]*100 || 86).toFixed(1)}%) triggered this alert based on the following meteorological anomalies:</p>
                  <ul className="pl-5 list-disc mt-2">
                    <li>Extreme Convective Available Potential Energy (CAPE) detected.</li>
                    <li>Integrated Water Vapor (IWV) rate exceeding historical 99th percentile.</li>
                    <li>Rapid cloud-top cooling observed in INSAT-3D infrared channels.</li>
                  </ul>
                </div>

                <p className="italic text-xs text-center text-gray-600">This report was automatically generated by DisasterGuard AI Early Warning System. Immediate action is recommended as per Standard Operating Procedure (SOP) Annexure 4.</p>
              </div>

              <div className="mt-8 flex justify-end gap-4">
                <button onClick={() => setShowNdrfModal(false)} className="px-5 py-2.5 bg-gray-200 text-black rounded font-semibold">Close</button>
                <button className="px-5 py-2.5 bg-blue-600 text-white rounded font-semibold">Print Report</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
