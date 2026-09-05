import React, { useState, useEffect } from "react";
import { 
  TriangleAlert, 
  ShieldAlert, 
  Bell, 
  Volume2, 
  Send, 
  Clock, 
  CalendarRange, 
  Users, 
  Route as RouteIcon, 
  CheckCircle2, 
  Radio, 
  ArrowRight,
  ExternalLink,
  Waves,
  CloudRain,
  CloudLightning,
  Milestone,
  HeartHandshake,
  Copy,
  Check,
  PhoneCall,
  Home,
  Building2,
  Landmark,
  AlertTriangle,
  ShieldCheck,
  Navigation,
  Sparkles,
  X,
  Loader2,
  Activity,
  MapPin
} from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { NowcastTimeline } from "./NowcastTimeline";
import { HazardForecastPanel } from "./HazardForecastPanel";
import { RadarPanel } from "./RadarPanel";
import { MetDriversPanel } from "./MetDriversPanel";
import { SatellitePanel } from "./SatellitePanel";
import { ExposureOverviewPanel } from "./ExposureOverviewPanel";
import { ImpactPredictionPanel } from "./ImpactPredictionPanel";
import { SafeRoutePanel } from "./SafeRoutePanel";

// ──────────────────────────────────────────────
// 1. NOWCAST VIEW (0-6 Hours Convective Progression)
// ──────────────────────────────────────────────
export function NowcastView({
  forecastHour,
  setForecastHour,
  maxRisks,
  selectedCell,
  monitoredLocation,
  locationName,
  satelliteStatus,
  satelliteBusy,
  handleSatelliteRefresh,
  radarLive,
  realtimeWeather,
  xaiData
}: any) {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-[1920px] mx-auto w-full">
      {/* Header Banner */}
      <div className="p-4 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-panel to-panel-alt flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-extrabold shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-ink flex items-center gap-2">
              <span>0–6H ULTRA-SHORT-TERM NOWCAST ENGINE</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                15-MIN REFRESH CADENCE
              </span>
            </h3>
            <p className="text-xs text-ink-dim mt-0.5">
              Simulating convective lead time &amp; storm evolution for: <strong className="text-ink">{locationName}</strong>
            </p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-panel border border-border text-xs font-mono text-ink-dim">
          Selected Lead Horizon: <strong className="text-accent">+{forecastHour}h</strong>
        </div>
      </div>

      {/* Nowcast Interactive Slider */}
      <NowcastTimeline forecastHour={forecastHour} onHourSelect={setForecastHour} maxRisks={maxRisks} />

      {/* Grid of Nowcast Instruments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HazardForecastPanel 
          maxRisks={maxRisks} 
          selectedCell={selectedCell} 
          monitoredLocation={monitoredLocation} 
          forecastHour={forecastHour} 
        />
        <RadarPanel 
          monitoredLocation={monitoredLocation} 
          locationName={locationName} 
          maxRisks={maxRisks}
          radarLive={radarLive}
          realtimeWeather={realtimeWeather}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetDriversPanel 
          xaiData={xaiData} 
          selectedCell={selectedCell} 
          monitoredLocation={monitoredLocation} 
          maxRisks={maxRisks}
          realtimeWeather={realtimeWeather}
        />
        <SatellitePanel 
          status={satelliteStatus} 
          loading={satelliteBusy} 
          onRefresh={handleSatelliteRefresh} 
          maxRisks={maxRisks} 
        />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// 2. RISK OUTLOOK VIEW (1–6 Days Synoptic Projections)
// ──────────────────────────────────────────────
export function RiskOutlookView({ locationName, maxRisks }: any) {
  const [selectedDay, setSelectedDay] = useState(1);

  const days = React.useMemo(() => {
    const base = new Date();
    const synopticPatterns = [
      `Active Convective Moisture Convergence over ${locationName || "Regional Basin"}`,
      `Synoptic Trough Extension & Localized Downpour Risk across ${locationName || "Regional Sector"}`,
      `Scattered Convective Cells along Orographic and Drainage Lines`,
      `Weakening Upper-Tropospheric Trough & Transition to Scattered Showers`,
      `Dissipating Cloud Cover & Normalized Inflow Rates`,
      `Fair Weather Influx & Atmospheric Stabilization`
    ];
    const rainfallPatterns = ["85–120 mm", "45–70 mm", "20–35 mm", "10–20 mm", "< 10 mm", "Isolated showers"];
    const riskLevels = [
      { risk: 0.78, level: "Severe", color: "#ef4444" },
      { risk: 0.65, level: "High", color: "#f97316" },
      { risk: 0.42, level: "Moderate", color: "#eab308" },
      { risk: 0.28, level: "Watch", color: "#22c55e" },
      { risk: 0.18, level: "Low", color: "#10b981" },
      { risk: 0.12, level: "Normal", color: "#10b981" }
    ];

    return [1, 2, 3, 4, 5, 6].map((offset, idx) => {
      const dt = new Date(base.getTime() + offset * 86400000);
      const dateStr = dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      return {
        day: offset === 1 ? "Day +1 (Tomorrow)" : `Day +${offset}`,
        date: dateStr,
        risk: riskLevels[idx].risk,
        rainfall: rainfallPatterns[idx],
        synoptic: synopticPatterns[idx],
        level: riskLevels[idx].level,
        color: riskLevels[idx].color
      };
    });
  }, [locationName]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-[1920px] mx-auto w-full">
      <div className="p-4 rounded-xl border border-border bg-panel-alt flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-extrabold">
            <CalendarRange size={20} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-ink flex items-center gap-2">
              <span>SYNOPTIC RISK OUTLOOK (1–6 DAYS)</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
                IMDAA &amp; ECMWF FUSION
              </span>
            </h3>
            <p className="text-xs text-ink-dim mt-0.5">
              Extended ensemble forecasting for: <strong className="text-ink">{locationName}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* 6-Day Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {days.map((d, idx) => (
          <div 
            key={d.day}
            onClick={() => setSelectedDay(idx + 1)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selectedDay === idx + 1 
                ? "bg-panel border-accent shadow-[0_0_15px_rgba(59,130,246,0.3)] ring-1 ring-accent" 
                : "bg-panel-alt border-border hover:border-border/80"
            }`}
          >
            <div className="text-[11px] font-bold text-ink-dim uppercase">{d.day}</div>
            <div className="text-[10px] text-ink-faint">{d.date}</div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-black font-mono" style={{ color: d.color }}>
                {Math.round(d.risk * 100)}%
              </span>
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: `${d.color}20`, color: d.color }}>
                {d.level}
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-border-soft space-y-1 text-[11px]">
              <div className="text-ink font-medium">🌧️ {d.rainfall}</div>
              <div className="text-[10px] text-ink-dim line-clamp-2">{d.synoptic}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Synoptic Deep Dive */}
      <Card>
        <CardHeader icon={CalendarRange} title={`Extended Meteorological Guidance — Day +${selectedDay}`} />
        <CardBody className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-panel-alt border border-border">
              <span className="text-xs text-ink-dim">Primary Hazard Potential</span>
              <h4 className="text-lg font-bold text-ink mt-1">Convective Hydro-Surge &amp; Urban Runoff</h4>
              <p className="text-xs text-ink-faint mt-1">Intense meso-beta cloud system triggers rapid surcharge in local drainage channels across {locationName || "the monitored zone"}.</p>
            </div>
            <div className="p-4 rounded-xl bg-panel-alt border border-border">
              <span className="text-xs text-ink-dim">Prepositioning Directive</span>
              <h4 className="text-lg font-bold text-amber-400 mt-1">SDRF High Standby</h4>
              <p className="text-xs text-ink-faint mt-1">Critical choke points and low-lying passages across {locationName || "regional catchment"} should stage motorized inflatables and de-watering pump units.</p>
            </div>
            <div className="p-4 rounded-xl bg-panel-alt border border-border">
              <span className="text-xs text-ink-dim">Model Confidence Score</span>
              <h4 className="text-lg font-bold text-emerald-400 mt-1">89.4% Ensemble Agreement</h4>
              <p className="text-xs text-ink-faint mt-1">50 ensemble perturbation members consistently show moisture persistence within 45 km radius of {locationName || "coordinates"}.</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────
// 3. ALERTS CLEARINGHOUSE VIEW
// ──────────────────────────────────────────────
export function AlertsView({
  liveAlerts = [],
  locationName,
  onTriggerAlert,
  onTriggerSitrep
}: any) {
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<"all" | "emergency" | "warning" | "watch">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [broadcastNotice, setBroadcastNotice] = useState<string | null>(null);

  const handleVoiceSiren = (customText?: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setVoicePlaying(true);
      const textToSpeak = customText || `आपातकालीन चेतावनी! राष्ट्रीय आपदा प्रबंधन प्राधिकरण द्वारा ${locationName} क्षेत्र के लिए रेड अलर्ट जारी किया गया है। तुरंत सुरक्षित स्थानों पर चले जाएं।`;
      const msg = new SpeechSynthesisUtterance(textToSpeak);
      msg.lang = "hi-IN";
      msg.rate = 0.92;
      msg.onend = () => setVoicePlaying(false);
      msg.onerror = () => setVoicePlaying(false);
      window.speechSynthesis.speak(msg);
    }
  };

  const handleCopyBulletin = (alt: any) => {
    const text = `[NDMA DISASTER BULLETIN - CAP COMPLIANT]\nID: ${alt.id}\nSEVERITY: ${alt.severity.toUpperCase()}\nLOCATION: ${alt.location_name}\nHAZARD: ${alt.title}\nPROBABILITY: ${Math.round(alt.probability * 100)}%\nLEAD TIME: ${alt.lead_time_hours}h\nACTION PROTOCOL: ${alt.action_protocol || alt.instructions || alt.message}`;
    navigator.clipboard.writeText(text);
    setCopiedId(alt.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCellBroadcastPush = (alt: any) => {
    setBroadcastNotice(`Emergency CAP Cell Broadcast pushed to all mobile BTS towers in ${alt.location_name}`);
    setTimeout(() => setBroadcastNotice(null), 4000);
  };

  const sourceAlerts = Array.isArray(liveAlerts) ? liveAlerts : [];

  const filteredAlerts = sourceAlerts.filter((alt: any) => {
    if (severityFilter === "all") return true;
    return alt.severity === severityFilter;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-[1920px] mx-auto w-full">
      {/* Toast Notification */}
      {broadcastNotice && (
        <div className="p-3 rounded-xl bg-red-950/90 border border-red-500 text-white text-xs font-bold flex items-center justify-between shadow-[0_0_25px_rgba(239,68,68,0.5)] animate-in fade-in">
          <div className="flex items-center gap-2">
            <Radio size={16} className="text-red-400 animate-pulse" />
            <span>{broadcastNotice}</span>
          </div>
          <span className="font-mono text-[10px] text-red-300">BTS CELL PUSH OK</span>
        </div>
      )}

      {/* Action Header */}
      <div className="p-4 rounded-xl border border-red-500/30 bg-gradient-to-r from-red-950/40 via-panel to-panel-alt flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 font-extrabold shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-ink flex items-center gap-2">
              <span>DISASTER ALERT &amp; CITIZEN DISPATCH HUB</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                CAP-COMPLIANT BROADCAST
              </span>
            </h3>
            <p className="text-xs text-ink-dim mt-0.5">
              Active Warning Operations for: <strong className="text-ink">{locationName}</strong>
            </p>
          </div>
        </div>

        {/* Quick Action Triggers */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleVoiceSiren()}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              voicePlaying 
                ? "bg-red-600 border-red-500 text-white animate-pulse" 
                : "border-border bg-panel-alt text-ink hover:text-white hover:bg-white/10"
            }`}
          >
            <Volume2 size={14} className={voicePlaying ? "animate-bounce" : ""} />
            {voicePlaying ? "Broadcasting Hindi Voice..." : "Play Voice Siren (Hindi)"}
          </button>

          <button
            onClick={onTriggerAlert}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold transition-all shadow-[0_0_12px_rgba(239,68,68,0.4)] flex items-center gap-1.5 cursor-pointer"
          >
            <Send size={13} /> Multi-Channel SMS Push
          </button>

          <button
            onClick={onTriggerSitrep}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ExternalLink size={13} /> Official SITREP
          </button>
        </div>
      </div>

      {/* Severity Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <span className="text-xs font-bold text-slate-400 mr-2">Filter Level:</span>
        {(["all", "emergency", "warning", "watch"] as const).map((lvl) => (
          <button
            key={lvl}
            onClick={() => setSeverityFilter(lvl)}
            className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
              severityFilter === lvl
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-panel-alt text-ink-dim hover:text-white border border-border"
            }`}
          >
            {lvl} ({lvl === "all" ? sourceAlerts.length : sourceAlerts.filter((a: any) => a.severity === lvl).length})
          </button>
        ))}
      </div>

      {/* Live Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center space-y-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 max-w-xl mx-auto my-6">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldAlert size={24} />
            </div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wide">All Clear · Normal Meteorological State</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              No critical disaster warnings currently active for {locationName || "this region"}. Routine atmospheric telemetry monitoring in progress.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alt: any) => {
            const isEmergency = alt.severity === "emergency";
            const isWarning = alt.severity === "warning";
            const isClear = alt.is_all_clear;
            const badgeColor = isClear
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
              : (isEmergency ? "bg-red-500/20 text-red-400 border-red-500/40" : (isWarning ? "bg-orange-500/20 text-orange-400 border-orange-500/40" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"));
            const cleanLeadTime = String(alt.lead_time_hours || "2").replace(/h/g, "") + "h";
            const protocolText = alt.action_protocol || alt.instructions || alt.message || alt.full_description || "NDMA Standard Emergency SOP Active.";

            return (
              <div key={alt.id} className={`p-5 rounded-xl border bg-panel transition-all space-y-3.5 ${isEmergency ? "border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)] ring-1 ring-red-500/20" : "border-border"}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded border ${badgeColor}`}>
                      {alt.severity}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10 font-bold">
                      {alt.source || (alt.is_official_gov ? "NDMA SACHET (GOV)" : "ML NOWCAST")}
                    </span>
                    <span className="font-mono text-xs text-ink-faint">{alt.id}</span>
                    <h4 className="text-sm font-bold text-ink">{alt.title}</h4>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-ink-dim">Lead Horizon: <strong className="text-ink">{cleanLeadTime}</strong></span>
                    <span className="text-ink-dim">Probability: <strong className={isClear ? "text-emerald-400" : "text-accent"}>{Math.round((alt.probability || 0.5) * 100)}%</strong></span>
                  </div>
                </div>

                <div className="text-xs text-ink-dim flex items-center gap-1.5">
                  <MapPin size={13} className="text-red-400 shrink-0" />
                  <span><strong>Target Locality:</strong> <span className="text-ink font-semibold">{alt.location_name || locationName}</span></span>
                </div>

                {/* Action Protocol Box */}
                <div className="p-3.5 rounded-lg bg-panel-alt border border-border-soft text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                    🛡️ NDMA Mandated Action Protocol:
                  </span>
                  <p className="text-ink font-medium leading-relaxed">
                    {protocolText}
                  </p>
                </div>

                {/* Card Action Controls */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        handleCellBroadcastPush(alt);
                        if (onTriggerAlert) onTriggerAlert(alt);
                      }}
                      className="px-2.5 py-1 rounded bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Radio size={12} /> Push Real Multi-Channel Broadcast
                    </button>
                    <button
                      onClick={() => handleVoiceSiren(`चेतावनी! ${alt.title}। ${protocolText}`)}
                      className="px-2.5 py-1 rounded bg-panel-alt hover:bg-white/10 text-ink-dim hover:text-white border border-border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Volume2 size={12} /> Play Siren Voice
                    </button>
                  </div>

                <button
                  onClick={() => handleCopyBulletin(alt)}
                  className="px-2.5 py-1 rounded bg-panel-alt hover:bg-white/10 text-ink-dim hover:text-white border border-border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                >
                  {copiedId === alt.id ? (
                    <>
                      <Check size={12} className="text-emerald-400" /> Copied Bulletin!
                    </>
                  ) : (
                    <>
                      <Copy size={12} /> Copy NDMA Bulletin
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        }))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// 4. EXPOSURE & VULNERABILITY VIEW
// ──────────────────────────────────────────────
export function ExposureView({
  selectedCell,
  monitoredLocation,
  locationName,
  forecastHour
}: any) {
  const [rosterDispatched, setRosterDispatched] = useState(false);

  const handleDispatchRoster = () => {
    setRosterDispatched(true);
    setTimeout(() => setRosterDispatched(false), 5000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-[1920px] mx-auto w-full">
      {/* Top Banner */}
      <div className="p-4 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-panel to-panel-alt flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-extrabold shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <Users size={20} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-ink flex items-center gap-2">
              <span>VULNERABILITY &amp; EXPOSURE COMMAND DECK</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                CENSUS &amp; TERRAIN FUSED
              </span>
            </h3>
            <p className="text-xs text-ink-dim mt-0.5">
              Demographic Exposure &amp; Domino Hazard Chains for: <strong className="text-ink">{locationName}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={handleDispatchRoster}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
            rosterDispatched 
              ? "bg-emerald-600 text-white" 
              : "bg-blue-600 hover:bg-blue-500 text-white"
          }`}
        >
          {rosterDispatched ? (
            <>
              <CheckCircle2 size={13} /> Outreach Relayed to 18 ASHA Workers
            </>
          ) : (
            <>
              <PhoneCall size={13} /> Trigger ASHA Door-Knock Relays
            </>
          )}
        </button>
      </div>

      {/* Row 1: High-Impact Vulnerability Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-panel-alt space-y-1">
          <span className="text-[10px] uppercase font-bold text-ink-faint flex items-center gap-1">
            <Users size={12} className="text-blue-400" /> Total Exposed Population
          </span>
          <div className="text-2xl font-black text-white">28,450</div>
          <p className="text-[11px] text-ink-dim">
            Includes 3,420 senior citizens &amp; infant households in inundation buffer.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-panel-alt space-y-1">
          <span className="text-[10px] uppercase font-bold text-ink-faint flex items-center gap-1">
            <Home size={12} className="text-amber-400" /> Kaccha / Fragile Dwellings
          </span>
          <div className="text-2xl font-black text-amber-400">3,322</div>
          <p className="text-[11px] text-ink-dim">
            Mud-mortar &amp; low-lying structures requiring priority physical door-knock.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-panel-alt space-y-1">
          <span className="text-[10px] uppercase font-bold text-ink-faint flex items-center gap-1">
            <Landmark size={12} className="text-red-400" /> Critical Cut-Off Points
          </span>
          <div className="text-2xl font-black text-red-400">4 Bridges / 2 Subways</div>
          <p className="text-[11px] text-ink-dim">
            Submersible passages at risk of waterlogging within ~1.5h.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-panel-alt space-y-1">
          <span className="text-[10px] uppercase font-bold text-ink-faint flex items-center gap-1">
            <Clock size={12} className="text-emerald-400" /> Safe Evacuation Horizon
          </span>
          <div className="text-2xl font-black text-emerald-400">01h 45m</div>
          <p className="text-[11px] text-ink-dim">
            Optimal safe transit window before peak hydrological crest arrival.
          </p>
        </div>
      </div>

      {/* Row 2: Detailed Regional Vulnerability & Domino Sequence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExposureOverviewPanel 
          selectedCell={selectedCell} 
          forecastHour={forecastHour} 
          monitoredLocation={monitoredLocation}
          locationName={locationName}
        />
        <ImpactPredictionPanel 
          selectedCell={selectedCell} 
          forecastHour={forecastHour} 
          monitoredLocation={monitoredLocation} 
          locationName={locationName}
        />
      </div>

      {/* Row 3: Grassroots Human Registry & Relief Staging Centers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ASHA & Anganwadi Registry Table */}
        <Card>
          <CardHeader 
            icon={HeartHandshake}
            title="Grassroots ASHA & Anganwadi Door-Knock Evacuation Roster"
            right={
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30 font-bold">
                NO-DEVICE REGISTERED
              </span>
            }
          />
          <CardBody className="p-4 space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-ink-faint text-[10.5px] uppercase">
                    <th className="pb-2">Citizen Name</th>
                    <th className="pb-2">Vulnerability</th>
                    <th className="pb-2">Assigned ASHA Worker</th>
                    <th className="pb-2">Target Shelter</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  <tr>
                    <td className="py-2.5 text-white font-bold">Smt. Kamla Devi (78)</td>
                    <td className="py-2.5 text-amber-400">Mobility Impaired (Wheelchair)</td>
                    <td className="py-2.5 text-ink-dim">Geeta Rawat (+91 98765 43210)</td>
                    <td className="py-2.5 text-slate-300">High School Camp</td>
                    <td className="py-2.5 text-right font-mono text-[10px] text-emerald-400 font-bold">DISPATCHED</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-white font-bold">Shri Ramesh Negi (54)</td>
                    <td className="py-2.5 text-blue-400">Hearing Impaired (Deaf)</td>
                    <td className="py-2.5 text-ink-dim">Suresh Kumar (Neighbor Volunteer)</td>
                    <td className="py-2.5 text-slate-300">Panchayat Bhavan</td>
                    <td className="py-2.5 text-right font-mono text-[10px] text-amber-400 font-bold">DOOR-KNOCK ASSIGNED</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-white font-bold">Master Ankit Kumar (14)</td>
                    <td className="py-2.5 text-purple-400">Visually Impaired (Blind)</td>
                    <td className="py-2.5 text-ink-dim">Anita Devi (Anganwadi Worker)</td>
                    <td className="py-2.5 text-slate-300">Panchayat Bhavan</td>
                    <td className="py-2.5 text-right font-mono text-[10px] text-emerald-400 font-bold">EN ROUTE</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-white font-bold">Shri Balbir Singh (82)</td>
                    <td className="py-2.5 text-red-400">Bedridden / High-Care</td>
                    <td className="py-2.5 text-ink-dim">Vijay Pal (SDRF Medical Aid)</td>
                    <td className="py-2.5 text-slate-300">Emergency Medical Center</td>
                    <td className="py-2.5 text-right font-mono text-[10px] text-blue-400 font-bold">STRETCHER DISPATCHED</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* Relief Shelter Capacity & Staging */}
        <Card>
          <CardHeader 
            icon={Building2}
            title="Designated High-Ground Relief Camps & Staging Capacity"
            right={
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                LOGISTICS READY
              </span>
            }
          />
          <CardBody className="p-4 space-y-3">
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-lg bg-panel-alt border border-border flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white">High Ground Senior Secondary School</h4>
                  <span className="text-[10.5px] text-ink-dim">Elevation: +45m above crest · Capacity: 1,200 Persons</span>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-emerald-400 font-mono">
                    <span>✓ 48h Water Stock</span>
                    <span>✓ Medical Officer Present</span>
                    <span>✓ 50kVA Generator</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-sm font-black text-emerald-400">850 / 1200</span>
                  <span className="text-[10px] text-ink-faint block">Beds Available</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-panel-alt border border-border flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white">Panchayat Community Multi-Purpose Hall</h4>
                  <span className="text-[10.5px] text-ink-dim">Elevation: +38m above crest · Capacity: 650 Persons</span>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-emerald-400 font-mono">
                    <span>✓ Cooked Meal Staging</span>
                    <span>✓ Satellite Radio Comm</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-sm font-black text-emerald-400">420 / 650</span>
                  <span className="text-[10px] text-ink-faint block">Beds Available</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-panel-alt border border-border flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white">District Sub-Divisional Hospital Emergency Wing</h4>
                  <span className="text-[10.5px] text-ink-dim">Emergency Trauma &amp; Oxygen Staging · Critical Care</span>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-blue-400 font-mono">
                    <span>✓ Blood Bank Active</span>
                    <span>✓ 12 Ambulances Stationed</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-sm font-black text-blue-400">95 / 150</span>
                  <span className="text-[10px] text-ink-faint block">ICU &amp; Ward Beds</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// 5. SAFE ROUTES & EVACUATION VIEW
// ──────────────────────────────────────────────
export function SafeRoutesView({
  selectedCell,
  monitoredLocation,
  locationName,
  maxRisks
}: any) {
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmissionSuccess, setTransmissionSuccess] = useState(false);

  const handleTransmit = () => {
    setIsTransmitting(true);
    setTimeout(() => {
      setIsTransmitting(false);
      setTransmissionSuccess(true);
      setTimeout(() => {
        setTransmissionSuccess(false);
        setShowDispatchModal(false);
      }, 2500);
    }, 1500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-[1920px] mx-auto w-full">
      {/* Action Header */}
      <div className="p-4 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-panel to-panel-alt flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-extrabold shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <RouteIcon size={20} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-ink flex items-center gap-2">
              <span>EMERGENCY EVACUATION ROUTE &amp; DISPATCH COMMAND</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                TOPOGRAPHIC RIDGE OPTIMIZED
              </span>
            </h3>
            <p className="text-xs text-ink-dim mt-0.5">
              Live Safe Detours &amp; First Responder Waypoints for: <strong className="text-ink">{locationName}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowDispatchModal(true)}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Send size={13} />
          Dispatch Route to First Responders &amp; GPS Apps
        </button>
      </div>

      {/* Row 1: Safe Route Panel + Turn-by-Turn Waypoints */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 flex flex-col">
          <SafeRoutePanel 
            selectedCell={selectedCell}
            monitoredLocation={monitoredLocation}
            locationName={locationName}
            maxRisks={maxRisks}
          />
        </div>

        <div className="lg:col-span-7 flex flex-col">
          <Card className="h-full flex flex-col">
            <CardHeader
              icon={Navigation}
              title="Turn-by-Turn Safe Passage Waypoints &amp; Flood Crest Clearance"
              right={
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold">
                  HAZARDS BYPASSED
                </span>
              }
            />
            <CardBody className="p-4 flex-1 flex flex-col justify-between space-y-3 text-xs">
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-panel-alt border border-border flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-500 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Origin: Riverfront &amp; Municipal Low-Lying Basin</h4>
                    <p className="text-[11.5px] text-ink-dim">
                      Immediately ascend via Municipal Link Road to avoid stormwater backflow. Clearance: +12m.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-panel-alt border border-border flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-600/30 border border-amber-500 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Bypass Submersible Old Suspension Bridge &amp; Low Nullah</h4>
                    <p className="text-[11.5px] text-ink-dim">
                      Traffic diverted through High Elevated Bypass Spur. Waterlogging risk on lower route: 88%.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-panel-alt border border-border flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-600/30 border border-emerald-500 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Join Elevated National Highway / Expressway Ridge</h4>
                    <p className="text-[11.5px] text-ink-dim">
                      Four-lane grade-separated viaduct. Free-flow traffic at 60 km/h with 0% submergence hazard.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-panel-alt border border-border flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-600/30 border border-purple-500 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Destination: High-Ground Emergency Relief Base</h4>
                    <p className="text-[11.5px] text-ink-dim">
                      Designated staging camp with 850 available beds, medical triage, and food supplies.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                <span>Total Safe Detour: <strong>24 km · 28 min</strong> · 100% Topographic Crest Clearance</span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Row 2: Alternate Evacuation Corridors Matrix */}
      <Card>
        <CardHeader 
          icon={Milestone}
          title="Comparative Evacuation Corridors &amp; Traffic Capacity Matrix"
          right={
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-panel-alt text-ink-dim border border-border">
              UPDATED LIVE
            </span>
          }
        />
        <CardBody className="p-4 space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-ink-faint text-[10.5px] uppercase">
                  <th className="pb-2">Corridor Name</th>
                  <th className="pb-2">Distance &amp; Travel Time</th>
                  <th className="pb-2">Datum Clearance</th>
                  <th className="pb-2">Flood Inundation Risk</th>
                  <th className="pb-2 text-right">Operational Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-medium">
                <tr className="bg-emerald-500/5">
                  <td className="py-2.5 text-white font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Corridor A: Elevated Ridge Highway Bypass
                  </td>
                  <td className="py-2.5 text-emerald-400 font-mono font-bold">24 km · 28 min</td>
                  <td className="py-2.5 text-slate-300 font-mono">+45m above riverbed</td>
                  <td className="py-2.5 text-emerald-400 font-bold">12% (Negligible)</td>
                  <td className="py-2.5 text-right font-mono text-[10.5px] text-emerald-400 font-bold">RECOMMENDED PASSAGE</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-white font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Corridor B: Secondary Canal Link &amp; Rural Road
                  </td>
                  <td className="py-2.5 text-amber-400 font-mono font-bold">31 km · 38 min</td>
                  <td className="py-2.5 text-slate-300 font-mono">+22m above riverbed</td>
                  <td className="py-2.5 text-amber-400 font-bold">34% (Moderate)</td>
                  <td className="py-2.5 text-right font-mono text-[10.5px] text-amber-400 font-bold">SECONDARY STANDBY</td>
                </tr>
                <tr className="opacity-60 bg-red-500/5">
                  <td className="py-2.5 text-slate-400 font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    Corridor C: Low-Lying River Road
                  </td>
                  <td className="py-2.5 text-red-400 font-mono font-bold">18 km · BLOCKED</td>
                  <td className="py-2.5 text-slate-400 font-mono">+2m (Submerged)</td>
                  <td className="py-2.5 text-red-400 font-bold">88% (Extreme Submergence)</td>
                  <td className="py-2.5 text-right font-mono text-[10.5px] text-red-400 font-bold">CLOSED BY POLICE</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Route Dispatch Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0c1220] border border-emerald-500/50 rounded-2xl w-full max-w-lg p-5 shadow-[0_20px_50px_rgba(16,185,129,0.25)] space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Send size={18} className="text-emerald-400" />
                <h3 className="font-extrabold text-white text-sm">
                  Dispatch Route to First Responders &amp; GPS Apps
                </h3>
              </div>
              <button 
                onClick={() => setShowDispatchModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                Target Navigation Broadcast Channels:
              </span>
              <div className="space-y-2 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                <label className="flex items-center gap-2.5 text-slate-200 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-emerald-500 w-4 h-4 rounded" />
                  <span>SDRF &amp; NDRF Field Quick Reaction Units (VHF 152.45 MHz)</span>
                </label>
                <label className="flex items-center gap-2.5 text-slate-200 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-emerald-500 w-4 h-4 rounded" />
                  <span>State Traffic Police Highway Patrol (GPS Push)</span>
                </label>
                <label className="flex items-center gap-2.5 text-slate-200 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-emerald-500 w-4 h-4 rounded" />
                  <span>Google Maps &amp; Mappls Navigation (GeoJSON Ingestion Stream)</span>
                </label>
                <label className="flex items-center gap-2.5 text-slate-200 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-emerald-500 w-4 h-4 rounded" />
                  <span>Local Public Paging Carts &amp; Siren Megaphones</span>
                </label>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300">
              <strong>Corridor:</strong> {locationName} Elevated Ridge Bypass (24 km · Clearance +45m)
            </div>

            {transmissionSuccess ? (
              <div className="p-3 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 animate-in zoom-in-95">
                <CheckCircle2 size={16} /> Route GeoJSON Stream Dispatched to 14 Responders!
              </div>
            ) : (
              <button
                onClick={handleTransmit}
                disabled={isTransmitting}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {isTransmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Transmitting Telemetry Stream...
                  </>
                ) : (
                  <>
                    <Send size={14} /> Transmit Route Dispatch Now
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
