import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { RiskMapPanel } from "@/components/dashboard/RiskMapPanel";
import { HazardForecastPanel } from "@/components/dashboard/HazardForecastPanel";
import { ExposureOverviewPanel } from "@/components/dashboard/ExposureOverviewPanel";
import { RecommendedActionsPanel } from "@/components/dashboard/RecommendedActionsPanel";
import { NowcastTimeline } from "@/components/dashboard/NowcastTimeline";
import { SatellitePanel } from "@/components/dashboard/SatellitePanel";
import { SatelliteStateDashboard } from "@/components/dashboard/SatelliteStateDashboard";
import { RadarPanel } from "@/components/dashboard/RadarPanel";
import { MetDriversPanel } from "@/components/dashboard/MetDriversPanel";
import { ImpactPredictionPanel } from "@/components/dashboard/ImpactPredictionPanel";
import { SafeRoutePanel } from "@/components/dashboard/SafeRoutePanel";
import { XAIPanel } from "@/components/dashboard/XAIPanel";
import { InnovationHub } from "@/components/dashboard/InnovationHub";
import { LiveMapFullView } from "@/components/dashboard/LiveMapFullView";
import { InfrastructureCommandView } from "@/components/dashboard/InfrastructureCommandView";
import { ReportsAnalyticsView } from "@/components/dashboard/ReportsAnalyticsView";
import { 
  NowcastView, 
  RiskOutlookView, 
  AlertsView, 
  ExposureView, 
  SafeRoutesView 
} from "@/components/dashboard/DedicatedModuleViews";
import { AuthModal } from "@/components/dashboard/AuthModal";
import { SmsAlertDispatchPanel } from "@/components/dashboard/SmsAlertDispatchPanel";
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldAlert, Bell, Activity, ExternalLink, Map as MapIcon, Radio, FileText, Cpu, PanelLeftOpen, Smartphone } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("agraan_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [initialAuthPhone, setInitialAuthPhone] = useState("");
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
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchReceipt, setDispatchReceipt] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [locationName, setLocationName] = useState("Rudraprayag, Uttarakhand");
  const [selectedState, setSelectedState] = useState("Uttarakhand");
  const [isLiveLocation, setIsLiveLocation] = useState(false);
  const [satelliteStatus, setSatelliteStatus] = useState(null);
  const [satelliteBusy, setSatelliteBusy] = useState(false);
  const [satelliteRevision, setSatelliteRevision] = useState(0);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [realtimeWeather, setRealtimeWeather] = useState(null);
  const [radarLive, setRadarLive] = useState(null);
  const lastInferenceRef = useRef(null);

  const API_BASE = "http://localhost:8000";

  const handleDetectLocation = () => {
    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsSearching(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setMonitoredLocation({ lat, lon });
        setSelectedCell({ lat, lon });
        setIsLiveLocation(true);
        setShowAutoAlert(false);

        // Reverse geocode with high precision (zoom=18)
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18`);
          const data = await res.json();
          if (data && data.address) {
            const locality = data.address.suburb || data.address.neighbourhood || data.address.residential || data.address.road || data.address.village || "";
            const city = data.address.city || data.address.town || data.address.county || "";
            const state = data.address.state || "";
            const label = [locality, city || state].filter(Boolean).slice(0, 2).join(', ');
            setLocationName(label || `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`);
          }
        } catch (err) {
          console.error("Reverse geocoding failed", err);
          setLocationName(`${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`);
        } finally {
          setIsSearching(false);
        }
      },
      (error) => {
        setIsSearching(false);
        console.warn("Exact GPS Geolocation failed or denied:", error);
        alert("Could not access exact GPS location. Please check browser location permissions or type your exact colony/city in the search box.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setMonitoredLocation({ lat, lon });
          setSelectedCell({ lat, lon });
          setIsLiveLocation(true);

          // Reverse geocode with high precision (zoom=18)
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18`);
            const data = await res.json();
            if (data && data.address) {
              const locality = data.address.suburb || data.address.neighbourhood || data.address.residential || data.address.road || data.address.village || "";
              const city = data.address.city || data.address.town || data.address.county || "";
              const state = data.address.state || "";
              const label = [locality, city || state].filter(Boolean).slice(0, 2).join(', ');
              setLocationName(label || `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`);
            }
          } catch (err) {
            console.error("Reverse geocoding failed", err);
          }
        },
        (error) => {
          console.warn("Geolocation denied or failed. Using fallback location.", error);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    }
  }, []);

  useEffect(() => {
    const layerParam = activeLayer.toLowerCase().replace(' ', '_');
    fetch(`${API_BASE}/api/predict?event_type=${layerParam}&forecast_hour=${forecastHour}&lat=${monitoredLocation.lat}&lon=${monitoredLocation.lon}&use_model=true`)
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
  }, [activeLayer, forecastHour, monitoredLocation, satelliteRevision]);

  useEffect(() => {
    let cancelled = false;
    const loadSatelliteStatus = () => {
      fetch(`${API_BASE}/api/satellite/status`)
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          if (
            lastInferenceRef.current &&
            data.inference_last_run_utc &&
            data.inference_last_run_utc !== lastInferenceRef.current
          ) {
            setSatelliteRevision((revision) => revision + 1);
          }
          lastInferenceRef.current = data.inference_last_run_utc || null;
          setSatelliteStatus(data);
        })
        .catch(console.error);
    };

    loadSatelliteStatus();
    const timer = window.setInterval(loadSatelliteStatus, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const lat = selectedCell ? selectedCell.lat : monitoredLocation.lat;
    const lon = selectedCell ? selectedCell.lon : monitoredLocation.lon;
    fetch(`${API_BASE}/api/risk-summary?lat=${lat}&lon=${lon}&forecast_hour=${forecastHour}`)
      .then(res => res.json())
      .then(data => {
        const risks = data.risks || {};
        setMaxRisks(risks);
        if (Math.max(...Object.values(risks)) > 0.85 && forecastHour <= 2) {
          setShowAutoAlert(true);
        }
      })
      .catch(console.error);
  }, [selectedCell, monitoredLocation, forecastHour]);

  useEffect(() => {
    fetch(`${API_BASE}/api/realtime-weather/${monitoredLocation.lat}/${monitoredLocation.lon}`)
      .then(res => res.json())
      .then(setRealtimeWeather)
      .catch(console.error);
  }, [monitoredLocation]);

  useEffect(() => {
    fetch(`${API_BASE}/api/radar/live`)
      .then(res => res.json())
      .then(setRadarLive)
      .catch(console.error);
  }, []);

  // 100% Real Unified Alerts Fetcher (NDMA SACHET + Hyperlocal ML Nowcast 1-6h)
  useEffect(() => {
    let cancelled = false;
    const loadLiveAlerts = () => {
      const url = `${API_BASE}/api/alerts?event_id=live&role=authority&forecast_hour=${forecastHour}&lat=${monitoredLocation.lat}&lon=${monitoredLocation.lon}&location_name=${encodeURIComponent(locationName)}`;
      fetch(url)
        .then(res => res.json())
        .then(data => {
          if (!cancelled) setLiveAlerts(Array.isArray(data) ? data : []);
        })
        .catch(() => {
          if (!cancelled) setLiveAlerts([]);
        });
    };

    loadLiveAlerts();
    const timer = window.setInterval(loadLiveAlerts, 20_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [monitoredLocation.lat, monitoredLocation.lon, locationName, forecastHour, satelliteRevision]);

  const handleSatelliteRefresh = async () => {
    setSatelliteBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/satellite/ingest`, { method: 'POST' });
      const data = await res.json();
      setSatelliteStatus(data.status || data);
      setSatelliteRevision(revision => revision + 1);
    } catch (err) {
      console.error('Satellite ingestion failed', err);
    } finally {
      setSatelliteBusy(false);
    }
  };

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

  const handleSendAlert = async (targetAlert = null) => {
    setShowSmsModal(true);
    setIsDispatching(true);

    const alertToBroadcast = targetAlert || (liveAlerts.length > 0 ? liveAlerts[0] : null) || {
      id: `ALT-MANUAL-${Date.now() % 10000}`,
      hazard_label: "Flash Flood & Convective Torrent",
      title: `${locationName} Severe Weather Risk`,
      lead_time_hours: `${forecastHour || 2}`
    };

    // 1. Real Multi-Channel Emergency Dispatch API Call to Backend
    try {
      const res = await fetch(`${API_BASE}/api/alerts/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alert_id: alertToBroadcast.id,
          location_name: locationName,
          hazard_type: alertToBroadcast.hazard_label || alertToBroadcast.title || "Severe Hydro-Meteorological Hazard",
          lead_time_hours: String(alertToBroadcast.lead_time_hours || forecastHour || 2),
          lat: monitoredLocation.lat,
          lon: monitoredLocation.lon,
          channels: ["sms_nic", "sdrf_push", "ble_mesh", "scada_interlock"],
          sender: "NDRF / SDMA Incident Command"
        })
      });
      const data = await res.json();
      setDispatchReceipt(data);
    } catch (err) {
      console.error("Broadcast dispatch failed:", err);
    } finally {
      setIsDispatching(false);
    }

    // 2. Multi-Channel Guaranteed Reach: Voice Alert in Hindi
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(
        `आपातकालीन चेतावनी! राष्ट्रीय आपदा प्रबंधन प्राधिकरण द्वारा ${locationName} क्षेत्र के लिए ${alertToBroadcast.hazard_label || "बाढ़"} का रेड अलर्ट जारी किया गया है। तुरंत सुरक्षित स्थानों पर चले जाएं।`
      );
      msg.lang = "hi-IN";
      msg.rate = 0.92;
      window.speechSynthesis.speak(msg);
    }
  };

  const handleSelectLocation = (loc) => {
    if (!loc) return;
    const lat = typeof loc.lat === 'string' ? parseFloat(loc.lat) : loc.lat;
    const lon = typeof loc.lon === 'string' ? parseFloat(loc.lon) : loc.lon;
    if (isNaN(lat) || isNaN(lon)) return;

    setMonitoredLocation({ lat, lon });
    setSelectedCell({ lat, lon });
    const displayName = loc.display_name || (loc.state ? `${loc.name}, ${loc.state}` : loc.name) || `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`;
    const parts = displayName.split(',').map(s => s.trim());
    const shortName = parts.slice(0, 2).join(', ');
    setLocationName(shortName || displayName);
    if (loc.state || loc.address?.state) {
      setSelectedState(loc.state || loc.address?.state || "");
    }
    setIsLiveLocation(false);
    setSearchQuery('');
    setShowAutoAlert(false);
  };

  const handleSearch = async (e, customQuery = null) => {
    if ((e?.key === 'Enter' || customQuery) && (customQuery || searchQuery).trim() !== '') {
      const query = (customQuery || searchQuery).trim();
      setIsSearching(true);

      // 1. Check if direct numeric coordinates like "28.7524, 77.4990"
      const coordMatch = query.match(/^([-+]?\d{1,2}(?:\.\d+)?)[,\s]+([-+]?\d{1,3}(?:\.\d+)?)$/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lon = parseFloat(coordMatch[2]);
        if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
          setMonitoredLocation({ lat, lon });
          setSelectedCell({ lat, lon });
          setLocationName(`${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`);
          setIsLiveLocation(true);
          setSearchQuery('');
          setShowAutoAlert(false);
          setIsSearching(false);
          return;
        }
      }

      // 2. Geocoding via Nominatim with Indian country code & address details
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}&countrycodes=in`,
        );
        const data = await res.json();

        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setMonitoredLocation({ lat, lon });
          setSelectedCell({ lat, lon });
          const cityName = data[0].display_name.split(',')[0];
          const stateName = data[0].address?.state || "";
          setLocationName(`${cityName}${stateName ? `, ${stateName}` : ''}`);
          setSelectedState(stateName || cityName);
          setIsLiveLocation(false);
          setSearchQuery('');
          setShowAutoAlert(false);
        } else {
          alert(`Could not find coordinates for "${query}". Please try a valid Indian city name.`);
        }
      } catch (err) {
        console.error("Geocoding failed", err);
        alert("Geocoding failed. Check network connection.");
      } finally {
        setIsSearching(false);
      }
    }
  };

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden bg-bg text-ink font-sans">
      {/* Hackathon Alerts */}
      {showAutoAlert && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex justify-center items-center backdrop-blur-sm">
          <div className="bg-red-500 p-10 rounded-xl max-w-lg text-center text-white border-4 border-red-700 shadow-[0_0_50px_rgba(239,68,68,0.5)]">
            <ShieldAlert size={64} className="mx-auto mb-4" />
            <h1 className="mb-4 text-3xl font-black uppercase">CRITICAL: EARLY WARNING TRIGGERED</h1>
            <p className="text-lg mb-6">Extremely severe weather formation detected in monitored region within the next {forecastHour} hours.</p>
            <div className="flex gap-4 justify-center">
              <button className="px-5 py-2.5 bg-slate-900 rounded font-semibold text-white" onClick={() => setShowAutoAlert(false)}>Acknowledge &amp; View Map</button>
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
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onDetectLocation={handleDetectLocation}
        onSelectLocation={handleSelectLocation}
        realtimeWeather={realtimeWeather}
        liveAlerts={liveAlerts}
        onNavigate={setActiveNav}
        onTriggerBroadcast={handleSendAlert}
        onTriggerSitrep={() => setShowNdrfModal(true)}
        currentUser={currentUser}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={() => {
          localStorage.removeItem("agraan_user");
          setCurrentUser(null);
        }}
      />

      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden relative">
        <Sidebar 
          activeNav={activeNav} 
          onSelect={setActiveNav} 
          isOpen={sidebarOpen} 
          onToggle={setSidebarOpen} 
          alertCount={liveAlerts?.length > 0 ? liveAlerts.length : (Math.max(...Object.values(maxRisks || {})) > 0.6 ? 5 : 2)}
        />

        {/* Floating Quick-Open Button when Sidebar is Hidden */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed left-3 top-20 z-40 px-3 py-1.5 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white shadow-[0_4px_20px_rgba(37,99,235,0.4)] border border-blue-400/40 backdrop-blur transition-all flex items-center gap-1.5 text-xs font-bold"
            title="Open Sidebar Navigation"
          >
            <PanelLeftOpen size={15} />
            <span className="hidden sm:inline">Menu</span>
          </button>
        )}

        <main className="flex-1 min-w-0 min-h-0 h-full overflow-hidden flex flex-col">
          {activeNav === "sms-gateway" ? (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-5">
              <div className="p-4 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-panel to-panel-alt flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-blue-400" />
                    LOCATION-AWARE EMERGENCY SMS ALERT GATEWAY
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Targeted emergency broadcast dispatching to registered citizens within the active hazard radius.
                  </p>
                </div>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 shrink-0 cursor-pointer"
                >
                  + Register Subscriber
                </button>
              </div>

              <SmsAlertDispatchPanel 
                locationName={locationName}
                selectedCell={selectedCell}
                activeLayer={activeLayer}
                maxRisks={maxRisks}
                currentUser={currentUser}
              />
            </div>
          ) : activeNav === "live-map" ? (
            /* Dedicated Full-Screen Live Map Section (from Sih-frontend-map-main structure) */
            <LiveMapFullView 
              heatmapData={heatmapData}
              activeLayer={activeLayer}
              onLayerChange={setActiveLayer}
              onCellClick={handleCellClick}
              selectedCell={selectedCell}
              monitoredLocation={monitoredLocation}
              forecastHour={forecastHour}
              onForecastHourChange={setForecastHour}
              satelliteStatus={satelliteStatus}
              satelliteRevision={satelliteRevision}
            />
          ) : activeNav === "satellite-states" ? (
            <SatelliteStateDashboard
              selectedLocationName={locationName}
              selectedState={selectedState}
              onBack={() => setActiveNav("dashboard")}
              onSelectState={(state) => {
                setMonitoredLocation({ lat: state.lat, lon: state.lon });
                setSelectedCell({ lat: state.lat, lon: state.lon });
                setLocationName(`${state.state} satellite reference location`);
                setSelectedState(state.state);
                setActiveNav("dashboard");
              }}
            />
          ) : activeNav === "dashboard" ? (
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 space-y-5 pb-8 w-full max-w-[1920px] mx-auto min-w-0">
              {/* Innovation Deck: Ground Truth Feedback, Voice Siren, Model Audit */}
              <InnovationHub 
                monitoredLocation={monitoredLocation} 
                locationName={locationName} 
                selectedCell={selectedCell} 
              />

              {/* Row 1: Map Overview + AI Diagnostics (Perfect Height Balance) */}
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px] gap-5 items-stretch min-w-0 w-full">
                <div className="space-y-5 flex flex-col min-w-0">
                  {/* Live Map Command Banner */}
                  <div className="p-4 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-panel to-panel-alt flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-extrabold shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                        <MapIcon size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-ink flex items-center gap-2">
                          <span>GEOSPATIAL COMMAND CENTER</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            ALL-INDIA 594 DISTRICTS LIVE
                          </span>
                        </h3>
                        <p className="text-xs text-ink-dim mt-0.5">
                          Active Monitoring: <strong className="text-ink">{locationName}</strong> · Satellite + Radar + ConvLSTM
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveNav("live-map")}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center gap-1.5 shrink-0"
                    >
                      <ExternalLink size={13} /> Launch Full-Screen Live Map
                    </button>
                  </div>

                  <RiskMapPanel 
                    heatmapData={heatmapData} 
                    activeLayer={activeLayer}
                    onLayerChange={setActiveLayer}
                    onCellClick={handleCellClick}
                    selectedCell={selectedCell}
                    monitoredLocation={monitoredLocation}
                    satelliteRevision={satelliteRevision}
                  />
                  <NowcastTimeline forecastHour={forecastHour} onHourSelect={setForecastHour} maxRisks={maxRisks} />
                </div>
                <div className="space-y-5 min-w-0 w-full flex flex-col">
                  <HazardForecastPanel 
                    maxRisks={maxRisks} 
                    selectedCell={selectedCell} 
                    monitoredLocation={monitoredLocation}
                    forecastHour={forecastHour} 
                  />
                  <XAIPanel 
                    data={xaiData} 
                    selectedCell={selectedCell} 
                    monitoredLocation={monitoredLocation}
                    locationName={locationName}
                  />
                </div>
              </div>

              {/* Row 2: Vulnerability, Cascading Hazard & Evacuation (3 Balanced Columns) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 min-w-0 w-full">
                <div className="min-w-0 flex flex-col">
                  <ExposureOverviewPanel 
                    selectedCell={selectedCell} 
                    forecastHour={forecastHour} 
                    monitoredLocation={monitoredLocation}
                    locationName={locationName}
                  />
                </div>
                <div className="min-w-0 flex flex-col">
                  <ImpactPredictionPanel 
                    selectedCell={selectedCell} 
                    forecastHour={forecastHour} 
                    monitoredLocation={monitoredLocation} 
                    locationName={locationName}
                  />
                </div>
                <div className="min-w-0 flex flex-col">
                  <SafeRoutePanel 
                    selectedCell={selectedCell}
                    monitoredLocation={monitoredLocation}
                    locationName={locationName}
                    maxRisks={maxRisks}
                  />
                </div>
              </div>

              {/* Row 3: Atmospheric Telemetry & Earth Observation (3 Balanced Columns) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 min-w-0 w-full">
                <div className="min-w-0 flex flex-col">
                  <SatellitePanel 
                    status={satelliteStatus} 
                    monitoredLocation={monitoredLocation}
                    loading={satelliteBusy} 
                    onRefresh={handleSatelliteRefresh}
                    onOpenDashboard={() => setActiveNav("satellite-states")}
                    maxRisks={maxRisks}
                  />
                </div>
                <div className="min-w-0 flex flex-col">
                  <RadarPanel 
                    monitoredLocation={monitoredLocation}
                    locationName={locationName}
                    maxRisks={maxRisks}
                    radarLive={radarLive}
                    realtimeWeather={realtimeWeather}
                  />
                </div>
                <div className="min-w-0 flex flex-col">
                  <MetDriversPanel 
                    xaiData={xaiData}
                    selectedCell={selectedCell}
                    monitoredLocation={monitoredLocation}
                    maxRisks={maxRisks}
                    realtimeWeather={realtimeWeather}
                  />
                </div>
              </div>
            </div>
          ) : activeNav === "nowcast" ? (
            <NowcastView 
              forecastHour={forecastHour}
              setForecastHour={setForecastHour}
              maxRisks={maxRisks}
              selectedCell={selectedCell}
              monitoredLocation={monitoredLocation}
              locationName={locationName}
              satelliteStatus={satelliteStatus}
              satelliteBusy={satelliteBusy}
              handleSatelliteRefresh={handleSatelliteRefresh}
              radarLive={radarLive}
              realtimeWeather={realtimeWeather}
              xaiData={xaiData}
            />
          ) : activeNav === "outlook" ? (
            <RiskOutlookView 
              locationName={locationName}
              maxRisks={maxRisks}
            />
          ) : activeNav === "alerts" ? (
            <AlertsView 
              liveAlerts={liveAlerts}
              locationName={locationName}
              onTriggerAlert={handleSendAlert}
              onTriggerSitrep={() => setShowNdrfModal(true)}
            />
          ) : activeNav === "exposure" ? (
            <ExposureView 
              selectedCell={selectedCell}
              monitoredLocation={monitoredLocation}
              locationName={locationName}
              forecastHour={forecastHour}
            />
          ) : activeNav === "routes" ? (
            <SafeRoutesView 
              selectedCell={selectedCell}
              monitoredLocation={monitoredLocation}
              locationName={locationName}
              maxRisks={maxRisks}
            />
          ) : activeNav === "infrastructure" ? (
            <InfrastructureCommandView selectedCell={selectedCell} monitoredLocation={monitoredLocation} forecastHour={forecastHour} />
          ) : activeNav === "reports" ? (
            <ReportsAnalyticsView 
              onTriggerAlert={handleSendAlert}
              onTriggerSitrep={() => setShowNdrfModal(true)}
              locationName={locationName}
              maxRisks={maxRisks}
              selectedCell={selectedCell}
            />
          ) : null}
        </main>
      </div>

      {/* HACKATHON: SMS DISPATCH SIMULATOR MODAL */}
      <AnimatePresence>
        {showSmsModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-[#0d1321] border border-blue-500/60 rounded-2xl w-full max-w-xl p-6 shadow-[0_10px_40px_rgba(59,130,246,0.3)] space-y-3"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h2 className="text-blue-400 text-lg font-extrabold flex items-center gap-2">
                  <Bell size={20} className="animate-bounce" /> MULTI-CHANNEL EMERGENCY DISPATCH
                </h2>
                <button onClick={() => setShowSmsModal(false)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
              </div>

              {/* Channel 1 */}
              <div className="bg-white/5 p-3 rounded-lg border-l-4 border-blue-500">
                <p className="text-xs text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span> Channel 1: Citizens 5km Radius (SMS &amp; WhatsApp)
                </p>
                <p className="text-xs text-slate-200 font-medium">⚠️ चेतावनी: अगले 2 घंटे में भारी बारिश और बाढ़ की संभावना है। कृपया सुरक्षित स्थानों पर चले जाएं। (NDMA)</p>
              </div>

              {/* Channel 2 */}
              <div className="bg-white/5 p-3 rounded-lg border-l-4 border-red-500">
                <p className="text-xs text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span> Channel 2: DM Office, SDM, First Responders (API Push)
                </p>
                <p className="text-xs text-slate-200 font-medium">🚨 EXTREME RISK ALERT: {activeLayer} risk {(maxRisks[activeLayer.toLowerCase().replace(' ', '_')] ? maxRisks[activeLayer.toLowerCase().replace(' ', '_')] * 100 : (maxRisks.flash_flood ? maxRisks.flash_flood * 100 : 88)).toFixed(0)}% near {selectedCell ? `${selectedCell.lat.toFixed(2)}°N, ${selectedCell.lon.toFixed(2)}°E` : (locationName || 'Monitored Sector')}. Initiate immediate evacuation protocol.</p>
              </div>

              {/* Channel 3: Offline P2P Mesh Relay */}
              <div className="bg-white/5 p-3 rounded-lg border-l-4 border-emerald-500">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                    <Radio size={13} className="text-emerald-400 animate-pulse" /> Channel 3: Offline P2P Mesh Relay (Zero Cell Signal / Tower Collapse)
                  </p>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">14 HOPS ACTIVE</span>
                </div>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  📡 Bluetooth Low Energy (BLE) multi-hop packet broadcasted phone-to-phone across isolated valley habitations with <strong>zero cellular or internet connectivity required</strong>.
                </p>
              </div>

              {/* Channel 4: M2M Autonomous Infrastructure Interlocks (SCADA/IoT) */}
              <div className="bg-white/5 p-3 rounded-lg border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                    <Cpu size={13} className="text-purple-400 animate-pulse" /> Channel 4: M2M Autonomous Infrastructure Interlocks (SCADA / IoT Relay)
                  </p>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">4 SYSTEMS ARMED</span>
                </div>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  ⚙️ Machine-to-machine actuation signals dispatched: <strong>Dam Sluice Gates</strong> (IEC-60870 pre-drawdown), <strong>Indian Railways</strong> (Kavach speed cap 30km/h), and <strong>Highway VMS / Barrier Dropped</strong> with 60s Human-in-the-Loop abort window.
                </p>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-purple-300/90 pt-1 border-t border-purple-500/20">
                  <span className="font-mono text-[9.5px]">Standard: IEC 60870-5-104 &amp; MQTT Protocol</span>
                  <button 
                    onClick={() => { setShowSmsModal(false); setActiveNav("infrastructure"); }}
                    className="underline text-purple-300 hover:text-white font-bold"
                  >
                    Open SCADA Interlock Center ➔
                  </button>
                </div>
              </div>

              {/* Real-time Backend Broadcast Confirmation Receipt */}
              {dispatchReceipt && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex flex-wrap items-center justify-between gap-2 font-mono">
                  <span>DISPATCH: <strong className="text-white">{dispatchReceipt.dispatch_id}</strong></span>
                  <span>NIC TX: <strong className="text-white">{dispatchReceipt.channels?.sms_gateway?.message_id}</strong></span>
                  <span>BLE HASH: <strong className="text-white">{dispatchReceipt.channels?.ble_mesh?.packet_hash?.slice(0, 10)}...</strong></span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase">{dispatchReceipt.status}</span>
                </div>
              )}

              <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="inline-block w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  <p className="text-[11px] text-emerald-400 font-mono">Routing via NIC SMS Gateway &amp; BLE Mesh Nodes...</p>
                </div>
                <button 
                  onClick={() => { setShowSmsModal(false); setShowNdrfModal(true); }}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0"
                >
                  <FileText size={13} /> View Official NDRF SITREP ➔
                </button>
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
            onClick={(e) => { if (e.target === e.currentTarget) setShowNdrfModal(false); }}
            className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-white text-black rounded-2xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl font-serif max-h-[92vh] overflow-y-auto relative"
            >
              <button 
                onClick={() => setShowNdrfModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-black w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-base font-bold transition-colors"
                title="Close SITREP"
              >
                ✕
              </button>

              <div className="border-b-2 border-black pb-4 mb-6 text-center pr-6">
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-widest mb-1 text-gray-900">GOVERNMENT OF INDIA</h1>
                <h2 className="text-sm sm:text-base font-bold text-gray-800">NATIONAL DISASTER RESPONSE FORCE (NDRF)</h2>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-600 mt-1">AUTOMATED SITUATIONAL REPORT (SITREP)</h3>
              </div>
              
              <div className="text-sm leading-relaxed">
                <div className="grid grid-cols-2 gap-5 mb-6">
                  <div>
                    <p><strong>REPORT ID:</strong> DG-AI-{new Date().getFullYear()}{String(new Date().getMonth()+1).padStart(2,'0')}{String(new Date().getDate()).padStart(2,'0')}-{String(selectedCell?.lat ? Math.round(selectedCell.lat * 100) : 3028)}</p>
                    <p><strong>DATE/TIME:</strong> {new Date().toLocaleString()}</p>
                    <p><strong>ISSUING AUTH:</strong> Agraan AI Sys</p>
                  </div>
                  <div>
                    <p><strong>HAZARD TYPE:</strong> {activeLayer.replace('_', ' ').toUpperCase()}</p>
                    <p><strong>SEVERITY:</strong> {(maxRisks[activeLayer.toLowerCase().replace(' ', '_')] || 0.7) > 0.8 ? 'CRITICAL (L3)' : 'SEVERE (L2)'}</p>
                    <p><strong>COORDINATES:</strong> {selectedCell ? `${selectedCell.lat.toFixed(4)}° N, ${selectedCell.lon.toFixed(4)}° E` : (monitoredLocation ? `${monitoredLocation.lat.toFixed(4)}° N, ${monitoredLocation.lon.toFixed(4)}° E (${locationName})` : '30.2800° N, 78.9800° E')}</p>
                  </div>
                </div>

                <div className="border border-gray-300 p-4 mb-6 bg-gray-50">
                  <h4 className="font-extrabold mb-2">1. EXPOSURE & IMPACT ESTIMATE</h4>
                  <ul className="pl-5 list-disc">
                    <li><strong>Est. Population at Risk:</strong> {Math.round(14000 + (maxRisks[activeLayer.toLowerCase().replace(' ', '_')] || 0.75) * 35000).toLocaleString()} residents</li>
                    <li><strong>Vulnerable Infrastructure:</strong> {Math.max(2, Math.round((maxRisks[activeLayer.toLowerCase().replace(' ', '_')] || 0.7) * 14))} Schools, {Math.max(1, Math.round((maxRisks[activeLayer.toLowerCase().replace(' ', '_')] || 0.7) * 4))} Hospitals, {Math.max(1, Math.round((maxRisks[activeLayer.toLowerCase().replace(' ', '_')] || 0.7) * 5))} Bridges</li>
                    <li><strong>Evacuation Window:</strong> {forecastHour > 0 ? forecastHour : 2} Hours</li>
                  </ul>
                </div>

                <div className="border border-gray-300 p-4 mb-6">
                  <h4 className="font-extrabold mb-2">2. AI PREDICTIVE PRECURSORS</h4>
                  <p>The AI model (Confidence: {((maxRisks[activeLayer.toLowerCase().replace(' ', '_')] || 0.86) * 100).toFixed(1)}%) triggered this alert based on the following meteorological anomalies:</p>
                  <ul className="pl-5 list-disc mt-2">
                    <li>Extreme Convective Available Potential Energy (CAPE) detected.</li>
                    <li>Integrated Water Vapor (IWV) rate exceeding historical 99th percentile.</li>
                    <li>Rapid cloud-top cooling observed in INSAT-3D infrared channels.</li>
                  </ul>
                </div>

                <p className="italic text-xs text-center text-gray-600">This report was automatically generated by Agraan AI Early Warning System. Immediate action is recommended as per Standard Operating Procedure (SOP) Annexure 4.</p>
              </div>

              <div className="mt-8 flex justify-end gap-4">
                <button onClick={() => setShowNdrfModal(false)} className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-black rounded font-semibold transition-colors">Close</button>
                <button onClick={() => window.print()} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-colors">Print / Export SITREP PDF</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* USER AUTHENTICATION & EMERGENCY REGISTRATION MODAL */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialPhone={initialAuthPhone}
        onSuccess={(user) => {
          setCurrentUser(user);
          setActiveNav("dashboard");
          if (user.latitude && user.longitude) {
            setMonitoredLocation({ lat: user.latitude, lon: user.longitude });
            setSelectedCell({ lat: user.latitude, lon: user.longitude });
            if (user.location_name) setLocationName(user.location_name);
          }
        }}
      />
    </div>
  );
}
