import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Map as MapIcon, Clock, AlertTriangle, Users, Building, Activity,
  Settings, Bell, Moon, Languages, CloudRain, Wind, Zap, Navigation, ShieldAlert,
  Search, RefreshCw
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import CommandMap from './components/CommandMap'
import './index.css'

const API_BASE = 'http://localhost:8000'

// Dummy data for the dynamic charts
const riskTrendData = [
  { time: '10:00', risk: 20 },
  { time: '11:00', risk: 45 },
  { time: '12:00', risk: 85 },
  { time: '13:00', risk: 95 },
  { time: '14:00', risk: 70 },
]
const radarTrendData = [
  { time: '10:00', dbz: 15 },
  { time: '10:30', dbz: 35 },
  { time: '11:00', dbz: 55 },
  { time: '11:30', dbz: 62 },
  { time: '12:00', dbz: 40 },
]



function App() {
  const [heatmapData, setHeatmapData] = useState([])
  const [activeLayer, setActiveLayer] = useState('flash_flood')
  const [forecastHour, setForecastHour] = useState(2)
  const [selectedCell, setSelectedCell] = useState(null)
  const [xaiData, setXaiData] = useState(null)
  const [maxRisks, setMaxRisks] = useState({ flash_flood: 0, cloudburst: 0, thunderstorm: 0 })
  const [mapStyle, setMapStyle] = useState('satellite')
  const [searchQuery, setSearchQuery] = useState('')
  const [monitoredLocation, setMonitoredLocation] = useState({ lat: 30.73, lon: 79.06 }) // Default to Kedarnath
  const [showAutoAlert, setShowAutoAlert] = useState(false)
  
  // Hackathon Features State
  const [showNdrfModal, setShowNdrfModal] = useState(false)
  const [showSmsModal, setShowSmsModal] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setForecastHour(prev => (prev >= 6 ? 0 : prev + 1))
      }, 1500)
    }
    return () => clearInterval(interval)
  }, [isPlaying])

  useEffect(() => {
    // Dynamic Live Monitoring: fetch inference based on monitored location
    fetch(`${API_BASE}/api/predict?event_type=${activeLayer}&forecast_hour=${forecastHour}&lat=${monitoredLocation.lat}&lon=${monitoredLocation.lon}`)
      .then(res => res.json())
      .then(data => {
        setHeatmapData(data.heatmap || [])
        if (data.all_max_risks) {
          setMaxRisks(data.all_max_risks)
          
          // Trigger automatic warning if risk > 85%
          if ((data.all_max_risks.flash_flood > 0.85 || data.all_max_risks.cloudburst > 0.85 || data.all_max_risks.thunderstorm > 0.85) && forecastHour > 1) {
            setShowAutoAlert(true)
          }
        } else if (data.heatmap && data.heatmap.length > 0) {
          const maxVal = Math.max(...data.heatmap.map(d => d.value))
          setMaxRisks(prev => ({ ...prev, [activeLayer]: maxVal }))
        } else {
          setMaxRisks(prev => ({ ...prev, [activeLayer]: 0 }))
        }
      })
      .catch(console.error)
  }, [activeLayer, forecastHour, monitoredLocation])

  const handleCellClick = async (lat, lon) => {
    setSelectedCell({ lat, lon })
    try {
      const res = await fetch(`${API_BASE}/api/xai/${lat}/${lon}?center_lat=${monitoredLocation.lat}&center_lon=${monitoredLocation.lon}`)
      const data = await res.json()
      setXaiData(data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSendAlert = () => {
    setShowSmsModal(true)
    setTimeout(() => {
      setShowNdrfModal(true)
    }, 3000)
  }

  const [isSearching, setIsSearching] = useState(false)

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
          setSearchQuery('')
          setShowAutoAlert(false) // Reset alert for new location
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
  }

  const panelVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  }

  // PRD 8.4: Alert Feed Generation
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    if (maxRisks[activeLayer] > 0.5) {
      setAlerts([
        { id: 1, location_name: 'Monitored Region', event_type: activeLayer, probability: maxRisks[activeLayer], lead_time_hours: '2-4 hrs', explanation: 'High CAPE & Converging Winds' }
      ])
    } else {
      setAlerts([])
    }
  }, [maxRisks, activeLayer])

  return (
    <>
      {showAutoAlert && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#ef4444', padding: '40px', borderRadius: '8px', maxWidth: '500px', textAlign: 'center', color: '#fff', border: '4px solid #b91c1c', boxShadow: '0 0 50px rgba(239,68,68,0.5)' }}>
            <ShieldAlert size={64} style={{ margin: '0 auto 16px' }} />
            <h1 style={{ margin: '0 0 16px', fontSize: '28px', fontWeight: 900, textTransform: 'uppercase' }}>CRITICAL: EARLY WARNING TRIGGERED</h1>
            <p style={{ fontSize: '18px', margin: '0 0 24px' }}>Extremely severe weather formation detected in monitored region within the next {forecastHour} hours.</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button className="btn-primary" style={{ background: '#0f172a', borderColor: '#0f172a' }} onClick={() => setShowAutoAlert(false)}>Acknowledge & View Map</button>
              <button className="btn-primary" style={{ background: '#fff', color: '#ef4444' }} onClick={() => { setShowAutoAlert(false); handleSendAlert(); }}>Broadcast Alert to NDRF</button>
            </div>
          </div>
        </div>
      )}

      {/* 1. TOP HEADER */}
      <motion.header className="top-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="brand">
          <div className="brand-icon"><ShieldAlert size={24} /></div>
          <div>
            <h1>DISASTERGUARD AI</h1>
            <p>MoES / NCMRWF - PS 26077</p>
          </div>
        </div>

        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '9px', color: '#94a3b8' }} />
            <input 
              type="text" 
              className="util-btn" 
              style={{ width: '250px', paddingLeft: '32px', textAlign: 'left', background: 'rgba(0,0,0,0.5)' }} 
              placeholder={isSearching ? "Locating..." : "Monitor City (e.g. Delhi, Jaipur)"} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
          <button className="util-btn"><RefreshCw size={16}/> Sync</button>
          <button className="util-btn" style={{ position: 'relative' }}>
            <Bell size={16}/>
            <span className="notification-badge">3</span>
          </button>
          <div className="user-profile">
            <span>NDMA COMMAND</span>
          </div>
        </div>
      </motion.header>

      {/* 2. LEFT SIDEBAR */}
      <motion.aside className="panel left-sidebar" variants={panelVariants} initial="hidden" animate="visible" custom={1}>
        <div className="panel-header">MAIN</div>
        <div className="nav-menu">
          <div className="nav-item active"><LayoutDashboard size={18} /> Dashboard</div>
          <div className="nav-item"><MapIcon size={18} /> Live Map</div>
          <div className="nav-item"><Activity size={18} /> Model Validation</div>
        </div>

        <div className="panel-header" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: 'none' }}>MAP CONTROLS</div>
        <div style={{ padding: '0 16px' }}>
          <div className="control-group">
            <h4 style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', marginTop: '8px' }}>Hazard Layer</h4>
            <select className="util-btn" style={{ width: '100%', marginBottom: '16px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }} onChange={e => setActiveLayer(e.target.value)}>
              <option value="flash_flood">Flash Flood</option>
              <option value="cloudburst">Cloudburst</option>
              <option value="thunderstorm">Thunderstorm</option>
            </select>
          </div>
          <div className="control-group" style={{ marginBottom: 0 }}>
            <h4 style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>Map Style</h4>
            <label className="checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#cbd5e1', marginBottom: '8px' }}>
              <input type="radio" name="mapstyle" checked={mapStyle === 'satellite'} onChange={() => setMapStyle('satellite')} style={{ accentColor: '#3b82f6' }}/> 
              Satellite Imagery
            </label>
            <label className="checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#cbd5e1' }}>
              <input type="radio" name="mapstyle" checked={mapStyle === 'terrain'} onChange={() => setMapStyle('terrain')} style={{ accentColor: '#3b82f6' }}/> 
              DEM / Terrain Topology
            </label>
          </div>
        </div>

        <div className="panel-header" style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: 'none' }}>DATA FUSION</div>
        <div className="source-list">
          <SourceItem title="MOSDAC / INSAT-3D" sub="Moisture & CTT" status="live" icon={<MapIcon size={16}/>} />
          <SourceItem title="IMDAA Reanalysis" sub="Thermodynamics (CAPE)" status="live" icon={<CloudRain size={16}/>} />
          <SourceItem title="SRTM / CartoDEM" sub="Terrain / Elevation" status="live" icon={<Activity size={16}/>} />
        </div>
      </motion.aside>

      {/* 3. MAIN CENTER MAP */}
      <motion.main className="panel main-center" variants={panelVariants} initial="hidden" animate="visible" custom={2}>
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={16} color="#3b82f6" /> SPATIOTEMPORAL RISK MAP
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '11px', fontWeight: 600 }}>
            <span style={{ color: '#22c55e' }}>■ LOW</span>
            <span style={{ color: '#eab308' }}>■ MODERATE</span>
            <span style={{ color: '#ef4444' }}>■ EXTREME</span>
          </div>
        </div>

        <div style={{ padding: '12px 16px', background: 'rgba(13, 19, 33, 0.5)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
            <button 
              className="util-btn" 
              style={{ background: isPlaying ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)', borderColor: isPlaying ? '#ef4444' : '#3b82f6', color: '#fff', padding: '6px 16px', fontWeight: 600 }}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <h4 style={{ margin: 0, fontSize: '14px', color: '#f8fafc', fontWeight: 700, letterSpacing: '0.5px' }}>
              {forecastHour === 0 ? 'NOWCAST (T+0)' : `FORECAST (T+${forecastHour} HOURS)`}
            </h4>
            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>{10 + forecastHour}:00 AM IST</span>
          </div>
          <input 
            type="range" 
            min="0" max="6" step="1" 
            value={forecastHour} 
            onChange={(e) => setForecastHour(parseInt(e.target.value))}
            style={{ width: '100%', cursor: 'pointer', accentColor: '#3b82f6' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: '6px', fontWeight: 600 }}>
            <span>Now</span><span>+1h</span><span>+2h</span><span>+3h</span><span>+4h</span><span>+5h</span><span>+6h</span>
          </div>
        </div>

        <div className="map-wrapper" style={{ flex: 1, position: 'relative' }}>
          <CommandMap heatmapData={heatmapData} activeLayer={activeLayer} mapStyle={mapStyle} onCellClick={handleCellClick} selectedCell={selectedCell} monitoredLocation={monitoredLocation} />
        </div>
      </motion.main>

      {/* 4. RIGHT SIDEBAR */}
      <motion.aside className="panel right-sidebar" variants={panelVariants} initial="hidden" animate="visible" custom={3}>
        <div className="panel-header">HAZARD FORECAST</div>
        <div style={{ padding: '12px 8px' }}>
          <ForecastRow name="Flash Flood" val={`${(maxRisks.flash_flood * 100).toFixed(0)}%`} severity={maxRisks.flash_flood > 0.7 ? "Severe" : (maxRisks.flash_flood > 0.4 ? "Moderate" : "Low")} icon={<Activity size={16} color={maxRisks.flash_flood > 0.7 ? "#ef4444" : "#94a3b8"}/>} />
          <ForecastRow name="Cloudburst" val={`${(maxRisks.cloudburst * 100).toFixed(0)}%`} severity={maxRisks.cloudburst > 0.7 ? "Severe" : (maxRisks.cloudburst > 0.4 ? "Moderate" : "Low")} icon={<CloudRain size={16} color={maxRisks.cloudburst > 0.7 ? "#ef4444" : "#94a3b8"}/>} />
          <ForecastRow name="Thunderstorm" val={`${(maxRisks.thunderstorm * 100).toFixed(0)}%`} severity={maxRisks.thunderstorm > 0.7 ? "Severe" : (maxRisks.thunderstorm > 0.4 ? "Moderate" : "Low")} icon={<Zap size={16} color={maxRisks.thunderstorm > 0.7 ? "#ef4444" : "#94a3b8"}/>} />
        </div>

        {/* PRD 8.4: Alert Feed Panel */}
        <div className="panel-header" style={{ marginTop: 'auto' }}>LIVE ALERT FEED</div>
        <div style={{ padding: '8px', flex: 1, overflowY: 'auto' }}>
          {alerts.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', fontSize: '12px', marginTop: '20px' }}>No extreme alerts currently.</div>
          ) : (
            alerts.map(a => (
              <div key={a.id} style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '3px solid #ef4444', padding: '10px', marginBottom: '8px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
                  <span>{a.location_name} | {a.event_type.replace('_', ' ').toUpperCase()}</span>
                  <span style={{ color: '#ef4444' }}>{(a.probability * 100).toFixed(0)}%</span>
                </div>
                <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Lead Time: {a.lead_time_hours}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', fontStyle: 'italic' }}>Reason: {a.explanation}</div>
              </div>
            ))
          )}
        </div>

        <button className="btn-primary" onClick={handleSendAlert}><ShieldAlert size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '8px' }}/> Generate Alert / SITREP</button>
      </motion.aside>

      {/* 5. BOTTOM PANELS */}
      <motion.section className="bottom-panels" variants={panelVariants} initial="hidden" animate="visible" custom={4}>
        
        {/* Dynamic Risk Trend Chart */}
        <div className="widget">
          <div className="panel-header">RISK PROBABILITY TREND</div>
          <div className="widget-content">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0d1321', border: '1px solid #1e293b', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="risk" stroke="#ef4444" fillOpacity={1} fill="url(#colorRisk)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Dynamic Radar Trend */}
        <div className="widget">
          <div className="panel-header">RADAR REFLECTIVITY (dBZ)</div>
          <div className="widget-content">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={radarTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0d1321', border: '1px solid #1e293b', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="dbz" stroke="#eab308" strokeWidth={3} dot={{ fill: '#eab308', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* XAI Drivers */}
        <div className="widget">
          <div className="panel-header">KEY METEOROLOGICAL DRIVERS {selectedCell && `(${selectedCell.lat.toFixed(1)}°N, ${selectedCell.lon.toFixed(1)}°E)`}</div>
          <div className="widget-content" style={{ justifyContent: 'center' }}>
            {xaiData ? (
              <>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '4px', borderLeft: '3px solid #3b82f6', marginBottom: '12px', fontSize: '12px', color: '#f8fafc' }}>
                  <strong>Auto-Explanation:</strong> {xaiData.explanation}
                </div>
                <div className="driver-row"><span>IWV (kg/m²)</span> <span className={xaiData.signals.iwv_rate.value > 10 ? 'high' : 'low'}>{xaiData.signals.iwv_rate.value.toFixed(1)} {xaiData.signals.iwv_rate.value > 10 ? '↑' : '↓'}</span></div>
                <div className="driver-row"><span>CAPE (J/kg)</span> <span className={xaiData.signals.cape.value > 2000 ? 'high' : 'low'}>{xaiData.signals.cape.value.toFixed(0)} {xaiData.signals.cape.value > 2000 ? '↑' : '↓'}</span></div>
                <div className="driver-row"><span>CIN (J/kg)</span> <span className={Math.abs(xaiData.signals.cin.value) < 50 ? 'high' : 'low'}>{xaiData.signals.cin.value.toFixed(0)} {Math.abs(xaiData.signals.cin.value) < 50 ? '↓' : '↑'}</span></div>
                <div className="driver-row"><span>Wind Shear (m/s)</span> <span style={{ color: '#eab308', fontWeight: 600 }}>{xaiData.signals.wind_shear.value.toFixed(1)} ↗</span></div>
                <div className="driver-row"><span>Convergence (10⁻⁵/s)</span> <span className={xaiData.signals.convergence.value > 2e-5 ? 'high' : 'low'}>{(xaiData.signals.convergence.value * 1e5).toFixed(1)} {xaiData.signals.convergence.value > 2e-5 ? '↑' : '↓'}</span></div>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: '#64748b', fontSize: '11px', marginTop: '20px' }}>
                <MapIcon size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }}/>
                <p>Click any cell on the map to view real-time atmospheric precursors and Explainable AI (XAI) breakdown.</p>
              </div>
            )}
          </div>
        </div>

        {/* Route / Impact placeholder replaced with a sleek status card */}
        <div className="widget">
          <div className="panel-header">SYSTEM STATUS & LATENCY</div>
          <div className="widget-content" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
             <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '4px solid #22c55e' }}>
                <Activity size={32} color="#22c55e" />
                <div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '2px solid #22c55e', animation: 'pulse-border 2s infinite' }} />
             </div>
             <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>ALL SYSTEMS NOMINAL</h3>
                <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Data Latency: 24ms • Confidence: 86%</p>
             </div>
          </div>
        </div>
      </motion.section>



      {/* HACKATHON: SMS DISPATCH SIMULATOR MODAL */}
      <AnimatePresence>
        {showSmsModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              style={{ background: '#0d1321', border: '1px solid #3b82f6', borderRadius: '12px', width: '500px', padding: '24px', boxShadow: '0 10px 40px rgba(59, 130, 246, 0.3)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ color: '#60a5fa', fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}><Bell size={20}/> DISPATCHING ALERTS</h2>
                <button onClick={() => setShowSmsModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', marginBottom: '12px', borderLeft: '4px solid #3b82f6' }}>
                <p style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '8px' }}>Target: Citizens in 5km radius (SMS & WhatsApp)</p>
                <p style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>⚠️ चेतावनी: अगले 2 घंटे में भारी बारिश और बाढ़ की संभावना है। कृपया सुरक्षित स्थानों पर चले जाएं। (NDMA)</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                <p style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '8px' }}>Target: DM Office, SDM, First Responders (API Push)</p>
                <p style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>🚨 EXTREME RISK ALERT: Flash flood probability {maxRisks.flash_flood > 0 ? (maxRisks.flash_flood*100).toFixed(0) : 92}% near {selectedCell ? `${selectedCell.lat.toFixed(2)}, ${selectedCell.lon.toFixed(2)}` : 'Rudraprayag'}. Initiate immediate evacuation protocol.</p>
              </div>
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '3px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>Routing via NIC SMS Gateway...</p>
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
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              style={{ background: '#fff', color: '#000', borderRadius: '4px', width: '700px', padding: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', fontFamily: 'serif' }}
            >
              <div style={{ borderBottom: '2px solid #000', paddingBottom: '16px', marginBottom: '24px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>GOVERNMENT OF INDIA</h1>
                <h2 style={{ fontSize: '16px', fontWeight: 700 }}>NATIONAL DISASTER RESPONSE FORCE (NDRF)</h2>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#444', marginTop: '8px' }}>AUTOMATED SITUATIONAL REPORT (SITREP)</h3>
              </div>
              
              <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
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

                <div style={{ border: '1px solid #ccc', padding: '16px', marginBottom: '24px', background: '#f9f9f9' }}>
                  <h4 style={{ fontWeight: 800, marginBottom: '8px' }}>1. EXPOSURE & IMPACT ESTIMATE</h4>
                  <ul style={{ paddingLeft: '20px' }}>
                    <li><strong>Est. Population at Risk:</strong> {selectedCell ? '18,420' : 'Approx 20,000'}</li>
                    <li><strong>Vulnerable Infrastructure:</strong> 14 Schools, 2 Hospitals, 3 Bridges</li>
                    <li><strong>Evacuation Window:</strong> {forecastHour} Hours</li>
                  </ul>
                </div>

                <div style={{ border: '1px solid #ccc', padding: '16px', marginBottom: '24px' }}>
                  <h4 style={{ fontWeight: 800, marginBottom: '8px' }}>2. AI PREDICTIVE PRECURSORS</h4>
                  <p>The AI model (Confidence: {(maxRisks[activeLayer]*100).toFixed(1)}%) triggered this alert based on the following meteorological anomalies:</p>
                  <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li>Extreme Convective Available Potential Energy (CAPE) detected.</li>
                    <li>Integrated Water Vapor (IWV) rate exceeding historical 99th percentile.</li>
                    <li>Rapid cloud-top cooling observed in INSAT-3D infrared channels.</li>
                  </ul>
                </div>

                <p style={{ fontStyle: 'italic', fontSize: '12px', textAlign: 'center', color: '#666' }}>This report was automatically generated by DisasterGuard AI Early Warning System. Immediate action is recommended as per Standard Operating Procedure (SOP) Annexure 4.</p>
              </div>

              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                <button onClick={() => setShowNdrfModal(false)} style={{ padding: '10px 20px', background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>Close</button>
                <button style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>Print Report</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}

function SourceItem({ title, sub, status, icon }) {
  return (
    <div className="source-item">
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <span style={{ color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '6px' }}>{icon}</span>
        <div className="source-info">
          <h4>{title}</h4>
          <p>{sub}</p>
        </div>
      </div>
      {status === 'live' && <div className="status-dot" />}
    </div>
  )
}

function ForecastRow({ name, val, severity, icon }) {
  return (
    <div className="forecast-row">
      <span style={{ background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '6px' }}>{icon}</span>
      <span className="forecast-name">{name}</span>
      <span className="forecast-val">{val}</span>
      <span className="forecast-badge" style={{ background: severity === 'Moderate' ? 'rgba(234,179,8,0.15)' : undefined, color: severity === 'Moderate' ? '#eab308' : undefined }}>{severity}</span>
    </div>
  )
}

export default App
