import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  TriangleAlert,
  Compass,
  Moon,
  Globe2,
  Bell,
  Settings2,
  PanelLeftClose,
  PanelLeftOpen,
  MapPin,
  Volume2,
  Radio,
  FileText,
  ChevronRight,
  X,
  Send,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { Search, Loader2, Crosshair } from "lucide-react";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  handleSearch: (e: any, customQuery?: string | null) => void;
  isSearching: boolean;
  locationName: string;
  isLiveLocation: boolean;
  maxRisks: Record<string, number>;
  sidebarOpen?: boolean;
  setSidebarOpen?: (val: boolean) => void;
  onDetectLocation?: () => void;
  onSelectLocation?: (loc: any) => void;
  realtimeWeather?: any;
  liveAlerts?: any[];
  onNavigate?: (nav: string) => void;
  onTriggerBroadcast?: () => void;
  onTriggerSitrep?: () => void;
}

export function Header({ 
  searchQuery, 
  setSearchQuery, 
  handleSearch, 
  isSearching, 
  locationName, 
  isLiveLocation, 
  maxRisks,
  sidebarOpen = true,
  setSidebarOpen,
  onDetectLocation,
  onSelectLocation,
  realtimeWeather,
  liveAlerts = [],
  onNavigate,
  onTriggerBroadcast,
  onTriggerSitrep
}: HeaderProps) {
  const [darkMode, setDarkMode] = useState(true);
  const [currentLang, setCurrentLang] = useState('en');
  const [currentTime, setCurrentTime] = useState<string>("");

  // Live real-time IST ticking clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const dStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const tStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      setCurrentTime(`${dStr} · ${tStr} IST`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync dark mode state with HTML class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    // Check if script is already added
    if (document.getElementById("google-translate-script")) return;
    
    // Add the callback
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          { pageLanguage: 'en', includedLanguages: 'hi,en,ta,te,mr,bn,gu,kn,ml,pa,ur' },
          'google_translate_element'
        );
      }
    };

    // Add the script
    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleLanguageChange = (e: any) => {
    const lang = e.target.value;
    setCurrentLang(lang);
    
    // Find the hidden google translate select and trigger change
    const gtSelect = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (gtSelect) {
      gtSelect.value = lang;
      gtSelect.dispatchEvent(new Event('change'));
    }
  };
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced live geocoding suggestions query via live API
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSuggesting(true);
        const res = await fetch(`http://localhost:8000/api/geocode?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSuggestions(data);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
          }
        }
      } catch (err) {
        console.error("Autosuggest geocode error", err);
      } finally {
        setIsSuggesting(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [showAlertsPopover, setShowAlertsPopover] = useState(false);
  const alertsPopoverRef = useRef<HTMLDivElement>(null);
  const [playingSiren, setPlayingSiren] = useState(false);

  const playHindiSiren = (customMsg?: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setPlayingSiren(true);
      const text = customMsg || `आपातकालीन चेतावनी! राष्ट्रीय आपदा प्रबंधन प्राधिकरण द्वारा ${locationName} क्षेत्र के लिए रेड अलर्ट जारी किया गया है। तुरंत सुरक्षित स्थानों पर चले जाएं।`;
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "hi-IN";
      utter.rate = 0.92;
      utter.onend = () => setPlayingSiren(false);
      utter.onerror = () => setPlayingSiren(false);
      window.speechSynthesis.speak(utter);
    }
  };

  // Dismiss suggestions and alerts popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (alertsPopoverRef.current && !alertsPopoverRef.current.contains(e.target as Node)) {
        setShowAlertsPopover(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (item: any) => {
    setShowSuggestions(false);
    if (onSelectLocation) {
      onSelectLocation(item);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setShowSuggestions(false);
      if (suggestions.length > 0 && showSuggestions) {
        handleSelectSuggestion(suggestions[0]);
      } else {
        handleSearch(e);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const highestRiskValue = Math.max(...Object.values(maxRisks || { flash_flood: 0 }));
  let riskLevel = "Low";
  let riskColorClass = "text-risk-low border-risk-low/40";
  let riskBg = "bg-[#142a18]";
  
  if (highestRiskValue > 0.85) {
    riskLevel = "Extreme";
    riskColorClass = "text-risk-extreme border-risk-extreme/40";
    riskBg = "bg-[#2a1414]";
  } else if (highestRiskValue > 0.60) {
    riskLevel = "High";
    riskColorClass = "text-risk-high border-risk-high/40";
    riskBg = "bg-[#2a2414]";
  } else if (highestRiskValue > 0.30) {
    riskLevel = "Moderate";
    riskColorClass = "text-risk-moderate border-risk-moderate/40";
    riskBg = "bg-[#2a2714]";
  }

  const activeHazards = Object.entries(maxRisks || {})
    .filter(([_, val]) => val > 0.3)
    .map(([key]) => key.replace('_', ' '))
    .join(' & ') || 'Normal conditions';

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 px-5 py-3 border-b border-border bg-panel/95 backdrop-blur">
      <div className="flex items-center gap-2 pr-4 mr-1 border-r border-border-soft">
        <button
          onClick={() => setSidebarOpen?.(!sidebarOpen)}
          className={`p-1.5 rounded-lg border transition-all flex items-center justify-center shrink-0 ${
            sidebarOpen
              ? "bg-panel-alt hover:bg-panel border-border text-ink-dim hover:text-white"
              : "bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/50 text-blue-400"
          }`}
          title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <ShieldAlert size={18} />
          </div>
          <div>
            <div className="font-bold text-[14px] leading-tight text-ink flex items-center gap-1.5">
              DISASTERGUARD <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">AI</span>
            </div>
            <div className="text-[10.5px] text-ink-faint">Early Warning & SCADA Command</div>
          </div>
        </div>
      </div>

      {highestRiskValue > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg ${riskBg} border ${riskColorClass.split(' ')[1]}`}
        >
          <TriangleAlert size={16} className={`${riskColorClass.split(' ')[0]} ${highestRiskValue > 0.85 ? 'animate-pulse' : ''}`} />
          <div className="leading-tight">
            <div className={`text-[12.5px] font-bold ${riskColorClass.split(' ')[0]}`}>{riskLevel} risk detected</div>
            <div className="text-[10.5px] text-ink-dim capitalize">{activeHazards}</div>
          </div>
        </motion.div>
      )}

      <button
        type="button"
        onClick={onDetectLocation}
        title="Detect exact GPS coordinates (High Accuracy)"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium border transition-all cursor-pointer ${
          isLiveLocation
            ? "bg-accent/15 text-accent border-accent/40 hover:bg-accent/25"
            : "bg-panel-alt text-ink-dim border-border hover:text-ink hover:border-border-soft"
        }`}
      >
        <Compass size={14} className={isLiveLocation ? "text-accent animate-spin-slow" : ""} />
        {isLiveLocation && <span className="w-2 h-2 rounded-full bg-accent animate-pulse" title="Live GPS Active" />}
        <span className="font-semibold truncate max-w-[170px]">{locationName}</span>
      </button>
      <div className="text-[12.5px] text-ink-faint font-mono">{currentTime || "Live Syncing..."}</div>

      <div ref={searchContainerRef} className="flex-1 max-w-md mx-4 relative hidden md:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim z-10" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
          onKeyDown={handleKeyDown}
          placeholder={isSearching ? "Locating exact coordinates..." : "Search City, Town, Colony or Lat, Lon..."}
          className="w-full bg-panel-alt border border-border rounded-lg pl-9 pr-20 py-1.5 text-[13px] text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
          {(isSearching || isSuggesting) ? (
            <Loader2 size={14} className="text-accent animate-spin" />
          ) : (
            <>
              {onDetectLocation && (
                <button
                  type="button"
                  onClick={onDetectLocation}
                  title="Detect My Exact GPS Location"
                  className="px-1.5 py-0.5 text-[10px] font-bold bg-accent/20 hover:bg-accent/30 text-accent rounded transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Crosshair size={11} /> GPS
                </button>
              )}
            </>
          )}
        </div>

        {/* Live dynamic autocomplete suggestions */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute left-0 right-0 top-full mt-1.5 bg-panel/95 backdrop-blur-md border border-border rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-border/40"
            >
              <div className="px-3 py-1.5 text-[10.5px] font-semibold text-ink-faint bg-panel-alt/50 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin size={11} className="text-accent" /> Live Matching Locations
                </span>
                <span className="text-[9px] font-mono text-accent">Open-Meteo Satellite GIS</span>
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-border/20">
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-accent/15 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div className="truncate pr-2">
                      <div className="text-[13px] font-semibold text-ink group-hover:text-accent truncate flex items-center gap-1.5">
                        {item.name}
                        {item.admin1 && (
                          <span className="text-[11px] font-normal text-ink-dim">({item.admin1})</span>
                        )}
                      </div>
                      <div className="text-[11px] text-ink-dim truncate">
                        {item.display_name}
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-panel-alt border border-border text-ink-faint">
                      {Number(item.lat).toFixed(2)}°, {Number(item.lon).toFixed(2)}°
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {realtimeWeather && (
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-panel-alt border border-border text-[12px] shadow-xs">
          <span className="flex items-center gap-1.5 font-medium text-ink">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-accent">{Number(realtimeWeather.temperature_c).toFixed(1)}°C</span>
            <span className="text-ink-faint">·</span>
            <span className="text-ink-dim">{Math.round(realtimeWeather.relative_humidity_pct)}% RH</span>
            <span className="text-ink-faint">·</span>
            <span className="text-ink-dim">{Number(realtimeWeather.wind_speed_kmh).toFixed(1)} km/h</span>
            <span className="text-ink-faint">·</span>
            <span className="text-ink font-semibold">{realtimeWeather.weather_description}</span>
          </span>
          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Live Feed
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-panel-alt border border-border">
        <span className="text-[10.5px] text-ink-faint">ETA to impact</span>
        <span className={`text-[13px] font-bold ${
          highestRiskValue >= 0.75 
            ? "text-red-400" 
            : highestRiskValue >= 0.50 
            ? "text-amber-400" 
            : highestRiskValue >= 0.25 
            ? "text-yellow-400" 
            : "text-emerald-400"
        }`}>
          {highestRiskValue >= 0.75 
            ? "01h 15m" 
            : highestRiskValue >= 0.50 
            ? "02h 45m" 
            : highestRiskValue >= 0.25 
            ? "04h 30m" 
            : "Normal / Clear"}
        </span>
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        <Button variant="ghost" size="sm" onClick={() => setDarkMode((d) => !d)}>
          <Moon size={13} /> {darkMode ? "Dark mode" : "Light mode"}
        </Button>
        
        {/* Hidden Google Translate Target */}
        <div id="google_translate_element" style={{ display: 'none' }}></div>
        
        {/* Custom React Tailwind Native Dropdown */}
        <div className="relative hidden sm:inline-flex items-center">
          <Globe2 size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
          <select 
            value={currentLang}
            onChange={handleLanguageChange}
            className="appearance-none bg-transparent hover:bg-slate-800/50 text-slate-300 text-[13px] font-medium py-1.5 pl-7 pr-6 rounded-md border border-slate-700/50 cursor-pointer outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors h-8"
          >
            <option value="en" className="bg-[#0f172a] text-slate-300">English</option>
            <option value="hi" className="bg-[#0f172a] text-slate-300">Hindi</option>
            <option value="ta" className="bg-[#0f172a] text-slate-300">Tamil</option>
            <option value="te" className="bg-[#0f172a] text-slate-300">Telugu</option>
            <option value="mr" className="bg-[#0f172a] text-slate-300">Marathi</option>
            <option value="bn" className="bg-[#0f172a] text-slate-300">Bengali</option>
            <option value="gu" className="bg-[#0f172a] text-slate-300">Gujarati</option>
          </select>
          <div className="absolute right-2 text-slate-400 pointer-events-none text-[8px]">▼</div>
        </div>

        {/* Dynamic Alerts Clearinghouse Drawer */}
        <div ref={alertsPopoverRef} className="relative">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`relative flex items-center gap-1.5 transition-all cursor-pointer ${
              showAlertsPopover ? "bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.3)]" : ""
            }`}
            onClick={() => setShowAlertsPopover(!showAlertsPopover)}
            title="Open Live Crisis Alerts & Dispatch Drawer"
          >
            <Bell size={13} className={liveAlerts?.length > 0 || Object.values(maxRisks || {}).some((r: any) => r > 0.5) ? "text-red-400 animate-bounce" : ""} />
            <span>Alerts</span>
            {(liveAlerts?.length > 0 || Object.values(maxRisks || {}).some((r: any) => r > 0.6)) && (
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-red-600 text-white shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                {liveAlerts?.length > 0 ? liveAlerts.length : Object.values(maxRisks || {}).filter((r: any) => r > 0.6).length || 3}
              </span>
            )}
          </Button>

          {/* Interactive Alerts Popover Drawer */}
          <AnimatePresence>
            {showAlertsPopover && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                className="absolute right-0 top-full mt-2 w-[430px] max-w-[92vw] bg-[#070b16]/98 backdrop-blur-2xl border border-red-500/40 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] z-50 overflow-hidden flex flex-col font-sans"
              >
                {/* Popover Header */}
                <div className="p-3.5 border-b border-white/10 bg-gradient-to-r from-red-950/60 via-[#0a0f1d] to-[#070b16] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 font-black">
                      <ShieldAlert size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                        <span>LIVE CRISIS BULLETINS</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30">CAP 1.2</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {locationName} · Multi-Agency Relay &amp; Mesh
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAlertsPopover(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Alerts List */}
                <div className="max-h-[380px] overflow-y-auto divide-y divide-white/5 p-2.5 space-y-2.5">
                  {(!liveAlerts || liveAlerts.length === 0) ? (
                    <div className="p-5 text-center space-y-2 bg-emerald-500/5 rounded-xl border border-emerald-500/20 my-2">
                      <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <CheckCircle2 size={20} />
                      </div>
                      <h5 className="text-xs font-bold text-white tracking-wide uppercase">All Clear · Normal Atmospheric State</h5>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Atmospheric sounding in {locationName || "this region"} indicates stable parameters below all disaster thresholds. Routine monitoring active.
                      </p>
                    </div>
                  ) : (
                    liveAlerts.map((alt: any) => {
                      const isEmg = alt.severity === "emergency" || (alt.probability || 0) > 0.7;
                      const isClear = alt.is_all_clear;
                      const badgeColor = isClear 
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" 
                        : (isEmg ? "bg-red-500/20 text-red-400 border-red-500/40" : "bg-amber-500/20 text-amber-400 border-amber-500/40");
                      
                      return (
                        <div key={alt.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${badgeColor}`}>
                                  {alt.severity?.toUpperCase() || "WARNING"}
                                </span>
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                                  {alt.source || (alt.is_official_gov ? "NDMA SACHET (GOV)" : "ML NOWCAST")}
                                </span>
                                <span className="text-[9px] font-mono text-slate-400">
                                  {alt.id}
                                </span>
                              </div>
                              <h5 className="text-xs font-bold text-white mt-1 leading-snug">
                                {alt.title}
                              </h5>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                ETA / Lead: +{alt.lead_time_hours || "2"}h · {alt.location_name || locationName}
                              </p>
                            </div>
                            <span className={`text-sm font-black font-mono shrink-0 ${isClear ? "text-emerald-400" : "text-red-400"}`}>
                              {Math.round((alt.probability || 0.7) * 100)}%
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-300 leading-relaxed bg-black/40 p-2 rounded-lg border border-white/5">
                            {alt.action_protocol || alt.instructions || alt.full_description || "Immediate precautions recommended as per NDMA SOP."}
                          </p>

                          {/* 1-Click Action Buttons */}
                          <div className="flex items-center justify-between pt-1 gap-1.5">
                            <button
                              onClick={() => playHindiSiren(`आपातकालीन चेतावनी! ${alt.title}। तुरंत सुरक्षित स्थानों पर चले जाएं।`)}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-200 text-[10.5px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Play Voice Audio Siren in Hindi"
                            >
                              <Volume2 size={12} className={playingSiren ? "text-amber-400 animate-pulse" : ""} />
                              <span>{playingSiren ? "Playing..." : "Voice Siren"}</span>
                            </button>

                            {onTriggerBroadcast && (
                              <button
                                onClick={() => {
                                  setShowAlertsPopover(false);
                                  onTriggerBroadcast(alt);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-[10.5px] font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                                title="Broadcast via SMS & BLE Mesh Relay"
                              >
                                <Radio size={12} />
                                <span>Broadcast SMS</span>
                              </button>
                            )}

                            {onTriggerSitrep && (
                              <button
                                onClick={() => {
                                  setShowAlertsPopover(false);
                                  onTriggerSitrep();
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-[10.5px] font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                                title="View Official NDRF SITREP Document"
                              >
                                <FileText size={12} />
                                <span>SITREP</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Popover Footer */}
                <div className="p-3 bg-panel border-t border-white/10 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setShowAlertsPopover(false);
                      if (onNavigate) onNavigate("alerts");
                    }}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Open Full Alerts Clearinghouse</span>
                    <ChevronRight size={13} />
                  </button>

                  {onTriggerBroadcast && (
                    <button
                      onClick={() => {
                        setShowAlertsPopover(false);
                        onTriggerBroadcast();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send size={12} />
                      <span>Send NDRF Siren</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          className="hidden md:inline-flex cursor-pointer"
          onClick={() => {
            if (onNavigate) onNavigate("infrastructure");
          }}
          title="Open SCADA & Infrastructure Command Center"
        >
          <Settings2 size={13} /> Command center
        </Button>
        <div className="flex items-center gap-2 pl-2.5 ml-1 border-l border-border-soft">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold bg-blue-700 text-white">
            N
          </div>
          <span className="text-[12.5px] hidden lg:inline text-ink-dim">NDRF · India</span>
        </div>
      </div>
    </header>
  );
}
