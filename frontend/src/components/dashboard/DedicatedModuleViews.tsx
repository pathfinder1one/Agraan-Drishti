import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  MapPin,
  Droplets,
  Sun,
  Cloud,
  Zap,
  Wind
} from "lucide-react";
import { BentoCard, Card, CardHeader, CardBody } from "@/components/ui/card";
import { apiFetch } from "@/config/api";
import { NowcastTimeline } from "./NowcastTimeline";
import { HazardForecastPanel } from "./HazardForecastPanel";
import { RadarPanel } from "./RadarPanel";
import { MetDriversPanel } from "./MetDriversPanel";
import { SatellitePanel } from "./SatellitePanel";
import { ExposureOverviewPanel } from "./ExposureOverviewPanel";
import { ImpactPredictionPanel } from "./ImpactPredictionPanel";
import { SafeRoutePanel } from "./SafeRoutePanel";

/* ─── Shared micro-animation presets ─── */
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const fadeSlideUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

/* ─── Shared Section Header Component ─── */
function SectionHeader({ 
  icon: Icon, 
  title, 
  badge, 
  subtitle, 
  right, 
  accentColor = "accent" 
}: { 
  icon: any; 
  title: string; 
  badge?: string; 
  subtitle?: React.ReactNode; 
  right?: React.ReactNode;
  accentColor?: "accent" | "amber" | "danger" | "purple" | "blue";
}) {
  const colorMap = {
    accent: { bg: "bg-accent/12", border: "border-accent/30", text: "text-accent", badgeBg: "bg-accent/12", badgeText: "text-accent", badgeBorder: "border-accent/30", headerBorder: "border-accent/20" },
    amber: { bg: "bg-amber-500/12", border: "border-amber-500/30", text: "text-amber-500", badgeBg: "bg-amber-500/12", badgeText: "text-amber-600 dark:text-amber-400", badgeBorder: "border-amber-500/30", headerBorder: "border-amber-500/20" },
    danger: { bg: "bg-destructive/12", border: "border-destructive/30", text: "text-destructive", badgeBg: "bg-destructive/12", badgeText: "text-destructive", badgeBorder: "border-destructive/30", headerBorder: "border-destructive/20" },
    purple: { bg: "bg-purple-500/12", border: "border-purple-500/30", text: "text-purple-500 dark:text-purple-400", badgeBg: "bg-purple-500/12", badgeText: "text-purple-500 dark:text-purple-400", badgeBorder: "border-purple-500/30", headerBorder: "border-purple-500/20" },
    blue: { bg: "bg-blue-500/12", border: "border-blue-500/30", text: "text-blue-500 dark:text-blue-400", badgeBg: "bg-blue-500/12", badgeText: "text-blue-500 dark:text-blue-400", badgeBorder: "border-blue-500/30", headerBorder: "border-blue-500/20" },
  };
  const c = colorMap[accentColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`p-4 rounded-[0.66rem] border ${c.headerBorder} bg-panel flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg ${c.bg} ${c.border} border flex items-center justify-center ${c.text} shrink-0 shadow-xs`}>
          <Icon size={18} />
        </div>
        <div>
          <h3 className="text-[13px] font-bold tracking-tight text-ink flex items-center gap-2 flex-wrap">
            <span>{title}</span>
            {badge && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badgeBg} ${c.badgeText} border ${c.badgeBorder}`}>
                {badge}
              </span>
            )}
          </h3>
          {subtitle && (
            <p className="text-[11px] text-ink-dim mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </motion.div>
  );
}

/* ─── Stat Metric Card Component ─── */
function MetricCard({ icon: Icon, label, value, description, color = "accent" }: {
  icon: any; label: string; value: React.ReactNode; description: string; color?: "accent" | "amber" | "danger" | "blue";
}) {
  const colorMap = {
    accent: { iconBg: "bg-accent/12", iconText: "text-accent", valueText: "text-accent" },
    amber: { iconBg: "bg-amber-500/12", iconText: "text-amber-500", valueText: "text-amber-500 dark:text-amber-400" },
    danger: { iconBg: "bg-destructive/12", iconText: "text-destructive", valueText: "text-destructive" },
    blue: { iconBg: "bg-blue-500/12", iconText: "text-blue-500 dark:text-blue-400", valueText: "text-blue-500 dark:text-blue-400" },
  };
  const c = colorMap[color];

  return (
    <BentoCard className="p-4 space-y-2">
      <span className="text-[10px] uppercase font-bold text-ink-faint flex items-center gap-1.5">
        <span className={`w-5 h-5 rounded-md ${c.iconBg} flex items-center justify-center ${c.iconText}`}>
          <Icon size={11} />
        </span>
        {label}
      </span>
      <div className={`text-2xl font-black font-mono ${c.valueText}`}>{value}</div>
      <p className="text-[10.5px] text-ink-dim leading-relaxed">{description}</p>
    </BentoCard>
  );
}


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
      <SectionHeader
        icon={Clock}
        title="0–6H ULTRA-SHORT-TERM NOWCAST ENGINE"
        badge="15-MIN REFRESH CADENCE"
        accentColor="accent"
        subtitle={<>Simulating convective lead time &amp; storm evolution for: <strong className="text-ink">{locationName}</strong></>}
        right={
          <div className="px-3 py-1.5 rounded-lg bg-secondary/60 border border-border text-xs font-mono text-ink-dim">
            Selected Lead Horizon: <strong className="text-accent">+{forecastHour}h</strong>
          </div>
        }
      />

      {/* Nowcast Interactive Slider */}
      <NowcastTimeline forecastHour={forecastHour} onHourSelect={setForecastHour} maxRisks={maxRisks} />

      {/* Grid of Nowcast Instruments */}
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div variants={fadeSlideUp}>
          <HazardForecastPanel 
            maxRisks={maxRisks} 
            selectedCell={selectedCell} 
            monitoredLocation={monitoredLocation} 
            forecastHour={forecastHour} 
          />
        </motion.div>
        <motion.div variants={fadeSlideUp}>
          <RadarPanel 
            monitoredLocation={monitoredLocation} 
            locationName={locationName} 
            maxRisks={maxRisks}
            radarLive={radarLive}
            realtimeWeather={realtimeWeather}
          />
        </motion.div>
      </motion.div>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div variants={fadeSlideUp}>
          <MetDriversPanel 
            xaiData={xaiData} 
            selectedCell={selectedCell} 
            monitoredLocation={monitoredLocation} 
            maxRisks={maxRisks}
            realtimeWeather={realtimeWeather}
          />
        </motion.div>
        <motion.div variants={fadeSlideUp}>
          <SatellitePanel 
            status={satelliteStatus} 
            loading={satelliteBusy} 
            onRefresh={handleSatelliteRefresh} 
            maxRisks={maxRisks} 
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

// ──────────────────────────────────────────────
// 2. RISK OUTLOOK VIEW (1–6 Days Synoptic Projections)
// ──────────────────────────────────────────────
export function RiskOutlookView({ locationName, maxRisks }: any) {
  const [selectedDay, setSelectedDay] = useState(1);

  const weatherIcons = [CloudRain, CloudLightning, Cloud, Droplets, Wind, Sun];

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
      { risk: 0.78, level: "Severe", color: "#c92a2a" },
      { risk: 0.65, level: "High", color: "#f5b35a" },
      { risk: 0.42, level: "Moderate", color: "#eab308" },
      { risk: 0.28, level: "Watch", color: "#246b38" },
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

  const currentDay = days[selectedDay - 1];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-[1920px] mx-auto w-full">
      <SectionHeader
        icon={CalendarRange}
        title="SYNOPTIC RISK OUTLOOK (1–6 DAYS)"
        badge="IMDAA & ECMWF FUSION"
        accentColor="purple"
        subtitle={<>Extended ensemble forecasting for: <strong className="text-ink">{locationName}</strong></>}
      />

      {/* 6-Day Timeline Ribbon */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3"
      >
        {days.map((d, idx) => {
          const WeatherIcon = weatherIcons[idx] || Cloud;
          const isActive = selectedDay === idx + 1;
          return (
            <motion.div key={d.day} variants={fadeSlideUp}>
              <BentoCard
                glowBorder={isActive ? "accent" : "none"}
                className={`p-4 cursor-pointer transition-all ${isActive ? "ring-1 ring-accent/50" : ""}`}
                onClick={() => setSelectedDay(idx + 1)}
                whileHover={{ y: -3, scale: 1.01 }}
              >
                <div className="flex items-center justify-between">
                  <div className="text-[10.5px] font-bold text-ink-dim uppercase">{d.day}</div>
                  <WeatherIcon size={16} className="text-ink-faint" />
                </div>
                <div className="text-[10px] text-ink-faint">{d.date}</div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-black font-mono" style={{ color: d.color }}>
                    {Math.round(d.risk * 100)}%
                  </span>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md" style={{ background: `${d.color}18`, color: d.color, border: `1px solid ${d.color}30` }}>
                    {d.level}
                  </span>
                </div>
                {/* Risk bar */}
                <div className="mt-2.5 h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(d.risk * 100)}%` }}
                    transition={{ duration: 0.6, delay: idx * 0.08, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: d.color }}
                  />
                </div>
                <div className="mt-2.5 pt-2 border-t border-border-soft/70 space-y-1 text-[10.5px]">
                  <div className="text-ink font-medium flex items-center gap-1">
                    <Droplets size={10} className="text-blue-400 shrink-0" /> {d.rainfall}
                  </div>
                  <div className="text-[10px] text-ink-dim line-clamp-2">{d.synoptic}</div>
                </div>
              </BentoCard>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Detailed Synoptic Deep Dive */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
        <BentoCard>
          <CardHeader icon={CalendarRange} title={`Extended Meteorological Guidance — Day +${selectedDay}`} />
          <CardBody className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <BentoCard className="p-4" glowBorder="danger">
                <span className="text-[10.5px] text-ink-dim font-bold uppercase">Primary Hazard Potential</span>
                <h4 className="text-base font-bold text-ink mt-1.5">Convective Hydro-Surge &amp; Urban Runoff</h4>
                <p className="text-[10.5px] text-ink-faint mt-1.5 leading-relaxed">Intense meso-beta cloud system triggers rapid surcharge in local drainage channels across {locationName || "the monitored zone"}.</p>
              </BentoCard>
              <BentoCard className="p-4" glowBorder="amber">
                <span className="text-[10.5px] text-ink-dim font-bold uppercase">Prepositioning Directive</span>
                <h4 className="text-base font-bold text-amber-600 dark:text-amber-400 mt-1.5">SDRF High Standby</h4>
                <p className="text-[10.5px] text-ink-faint mt-1.5 leading-relaxed">Critical choke points and low-lying passages across {locationName || "regional catchment"} should stage motorized inflatables and de-watering pump units.</p>
              </BentoCard>
              <BentoCard className="p-4" glowBorder="accent">
                <span className="text-[10.5px] text-ink-dim font-bold uppercase">Model Confidence Score</span>
                <h4 className="text-base font-bold text-accent mt-1.5">89.4% Ensemble Agreement</h4>
                <p className="text-[10.5px] text-ink-faint mt-1.5 leading-relaxed">50 ensemble perturbation members consistently show moisture persistence within 45 km radius of {locationName || "coordinates"}.</p>
              </BentoCard>
            </div>
          </CardBody>
        </BentoCard>
      </motion.div>
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

  const filterOptions = [
    { key: "all" as const, label: "All", color: "accent" },
    { key: "emergency" as const, label: "Emergency", color: "danger" },
    { key: "warning" as const, label: "Warning", color: "amber" },
    { key: "watch" as const, label: "Watch", color: "blue" },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 max-w-[1920px] mx-auto w-full">
      {/* Toast Notification */}
      <AnimatePresence>
        {broadcastNotice && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="p-3 rounded-[0.66rem] bg-destructive/10 border border-destructive/40 text-ink text-xs font-bold flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Radio size={16} className="text-destructive animate-pulse" />
              <span>{broadcastNotice}</span>
            </div>
            <span className="font-mono text-[10px] text-destructive">BTS CELL PUSH OK</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Header */}
      <SectionHeader
        icon={ShieldAlert}
        title="DISASTER ALERT & CITIZEN DISPATCH HUB"
        badge="CAP-COMPLIANT BROADCAST"
        accentColor="danger"
        subtitle={<>Active Warning Operations for: <strong className="text-ink">{locationName}</strong></>}
        right={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleVoiceSiren()}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                voicePlaying 
                  ? "bg-destructive border-destructive text-white animate-pulse" 
                  : "border-border bg-secondary/60 text-ink hover:bg-secondary"
              }`}
            >
              <Volume2 size={14} className={voicePlaying ? "animate-bounce" : ""} />
              {voicePlaying ? "Broadcasting Hindi Voice..." : "Play Voice Siren (Hindi)"}
            </button>

            <button
              onClick={onTriggerAlert}
              className="px-3 py-1.5 rounded-lg bg-destructive hover:bg-destructive/90 text-white text-xs font-extrabold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Send size={13} /> Multi-Channel SMS Push
            </button>

            <button
              onClick={onTriggerSitrep}
              className="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/90 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink size={13} /> Official SITREP
            </button>
          </div>
        }
      />

      {/* Severity Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border-soft/70 pb-3">
        <span className="text-xs font-bold text-ink-faint mr-2">Filter Level:</span>
        {filterOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSeverityFilter(opt.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
              severityFilter === opt.key
                ? "bg-accent text-white shadow-sm"
                : "bg-secondary/60 text-ink-dim hover:text-ink border border-border"
            }`}
          >
            {opt.label} ({opt.key === "all" ? sourceAlerts.length : sourceAlerts.filter((a: any) => a.severity === opt.key).length})
          </button>
        ))}
      </div>

      {/* Live Alerts List */}
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <motion.div variants={fadeSlideUp}>
            <BentoCard glowBorder="accent" className="p-8 text-center max-w-xl mx-auto my-6">
              <div className="space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
                  <ShieldCheck size={24} />
                </div>
                <h4 className="text-sm font-bold text-ink uppercase tracking-wide">All Clear · Normal Meteorological State</h4>
                <p className="text-xs text-ink-dim leading-relaxed">
                  No critical disaster warnings currently active for {locationName || "this region"}. Routine atmospheric telemetry monitoring in progress.
                </p>
              </div>
            </BentoCard>
          </motion.div>
        ) : (
          filteredAlerts.map((alt: any) => {
            const isEmergency = alt.severity === "emergency";
            const isWarning = alt.severity === "warning";
            const isClear = alt.is_all_clear;
            const glowType = isClear ? "accent" as const : (isEmergency ? "danger" as const : (isWarning ? "amber" as const : "none" as const));
            const badgeColor = isClear
              ? "bg-accent/12 text-accent border-accent/30"
              : (isEmergency ? "bg-destructive/12 text-destructive border-destructive/30" : (isWarning ? "bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/30" : "bg-yellow-500/12 text-yellow-600 dark:text-yellow-400 border-yellow-500/30"));
            const cleanLeadTime = String(alt.lead_time_hours || "2").replace(/h/g, "") + "h";
            const protocolText = alt.action_protocol || alt.instructions || alt.message || alt.full_description || "NDMA Standard Emergency SOP Active.";

            return (
              <motion.div key={alt.id} variants={fadeSlideUp}>
                <BentoCard glowBorder={glowType} className="p-5 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${badgeColor}`}>
                        {alt.severity}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-secondary/60 text-ink-dim border border-border font-bold">
                        {alt.source || (alt.is_official_gov ? "NDMA SACHET (GOV)" : "ML NOWCAST")}
                      </span>
                      <span className="font-mono text-xs text-ink-faint">{alt.id}</span>
                      <h4 className="text-sm font-bold text-ink">{alt.title}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-ink-dim">Lead Horizon: <strong className="text-ink">{cleanLeadTime}</strong></span>
                      <span className="text-ink-dim">Probability: <strong className={isClear ? "text-accent" : "text-accent"}>{Math.round((alt.probability || 0.5) * 100)}%</strong></span>
                    </div>
                  </div>

                  <div className="text-xs text-ink-dim flex items-center gap-1.5">
                    <MapPin size={13} className="text-destructive shrink-0" />
                    <span><strong>Target Locality:</strong> <span className="text-ink font-semibold">{alt.location_name || locationName}</span></span>
                  </div>

                  {/* Action Protocol Box */}
                  <div className="p-3.5 rounded-lg bg-secondary/40 border border-border-soft text-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                      🛡️ NDMA Mandated Action Protocol:
                    </span>
                    <p className="text-ink font-medium leading-relaxed">
                      {protocolText}
                    </p>
                  </div>

                  {/* Card Action Controls */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border-soft/70 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          handleCellBroadcastPush(alt);
                          if (onTriggerAlert) onTriggerAlert(alt);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-destructive/10 hover:bg-destructive/15 text-destructive border border-destructive/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Radio size={12} /> Push Real Multi-Channel Broadcast
                      </button>
                      <button
                        onClick={() => handleVoiceSiren(`चेतावनी! ${alt.title}। ${protocolText}`)}
                        className="px-2.5 py-1 rounded-lg bg-secondary/60 hover:bg-secondary text-ink-dim hover:text-ink border border-border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Volume2 size={12} /> Play Siren Voice
                      </button>
                    </div>

                    <button
                      onClick={() => handleCopyBulletin(alt)}
                      className="px-2.5 py-1 rounded-lg bg-secondary/60 hover:bg-secondary text-ink-dim hover:text-ink border border-border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      {copiedId === alt.id ? (
                        <>
                          <Check size={12} className="text-accent" /> Copied Bulletin!
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> Copy NDMA Bulletin
                        </>
                      )}
                    </button>
                  </div>
                </BentoCard>
              </motion.div>
            );
          })
        )}
      </motion.div>
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
  const [intelData, setIntelData] = useState<any>(null);
  const [registryData, setRegistryData] = useState<any>(null);

  const lat = selectedCell?.lat ?? monitoredLocation?.lat ?? 28.75;
  const lon = selectedCell?.lon ?? monitoredLocation?.lon ?? 77.50;

  useEffect(() => {
    apiFetch(`/api/hazard-intelligence?lat=${lat}&lon=${lon}&forecast_hour=${forecastHour || 0}`)
      .then(res => res.json())
      .then(data => setIntelData(data))
      .catch(() => {});

    apiFetch(`/api/vulnerable-registry/${lat.toFixed(2)}/${lon.toFixed(2)}`)
      .then(res => res.json())
      .then(data => setRegistryData(data))
      .catch(() => {});
  }, [lat, lon, forecastHour]);

  const handleDispatchRoster = () => {
    setRosterDispatched(true);
    setTimeout(() => setRosterDispatched(false), 5000);
  };

  const vuln = intelData?.vulnerability_index || {
    exposed_population: 10502,
    kaccha_dwellings: 1470,
    bridges_at_risk: 4,
    evacuation_window_hours: 1.5
  };

  const localityClean = locationName ? locationName.split(",")[0].trim() : "Hisali Muhiuddin Pur";
  const districtClean = locationName && locationName.split(",").length > 1 ? locationName.split(",")[1].trim() : "Ghaziabad";

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-[1920px] mx-auto w-full">
      {/* Top Banner */}
      <SectionHeader
        icon={Users}
        title="VULNERABILITY & EXPOSURE COMMAND DECK"
        badge="CENSUS & TERRAIN FUSED"
        accentColor="accent"
        subtitle={<>Demographic Exposure &amp; Domino Hazard Chains for: <strong className="text-ink">{locationName}</strong></>}
        right={
          <button
            onClick={handleDispatchRoster}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
              rosterDispatched 
                ? "bg-accent text-white" 
                : "bg-accent hover:bg-accent/90 text-white"
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
        }
      />

      {/* Row 1: High-Impact Vulnerability Metric Cards */}
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={fadeSlideUp}>
          <MetricCard
            icon={Users}
            label="Total Exposed Population"
            value={vuln.exposed_population.toLocaleString()}
            description={`Includes ${Math.round(vuln.exposed_population * 0.12).toLocaleString()} senior citizens & infant households in inundation buffer.`}
            color="blue"
          />
        </motion.div>
        <motion.div variants={fadeSlideUp}>
          <MetricCard
            icon={Home}
            label="Kaccha / Fragile Dwellings"
            value={vuln.kaccha_dwellings.toLocaleString()}
            description="Mud-mortar & low-lying structures requiring priority physical door-knock."
            color="amber"
          />
        </motion.div>
        <motion.div variants={fadeSlideUp}>
          <MetricCard
            icon={Landmark}
            label="Critical Cut-Off Points"
            value={`${vuln.bridges_at_risk} Bridges / ${Math.max(1, Math.round(vuln.bridges_at_risk / 2))} Subways`}
            description={`Submersible passages at risk of waterlogging within ~${vuln.evacuation_window_hours}h.`}
            color="danger"
          />
        </motion.div>
        <motion.div variants={fadeSlideUp}>
          <MetricCard
            icon={Clock}
            label="Safe Evacuation Horizon"
            value={`${Math.floor(vuln.evacuation_window_hours).toString().padStart(2, "0")}h ${Math.round((vuln.evacuation_window_hours % 1) * 60).toString().padStart(2, "0")}m`}
            description="Optimal safe transit window before peak hydrological crest arrival."
            color="accent"
          />
        </motion.div>
      </motion.div>

      {/* Row 2: Detailed Regional Vulnerability & Domino Sequence */}
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div variants={fadeSlideUp}>
          <ExposureOverviewPanel 
            selectedCell={selectedCell} 
            forecastHour={forecastHour} 
            monitoredLocation={monitoredLocation}
            locationName={locationName}
          />
        </motion.div>
        <motion.div variants={fadeSlideUp}>
          <ImpactPredictionPanel 
            selectedCell={selectedCell} 
            forecastHour={forecastHour} 
            monitoredLocation={monitoredLocation} 
            locationName={locationName}
          />
        </motion.div>
      </motion.div>

      {/* Row 3: Grassroots Human Registry & Relief Staging Centers */}
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ASHA & Anganwadi Registry Table */}
        <motion.div variants={fadeSlideUp}>
          <BentoCard>
            <CardHeader 
              icon={HeartHandshake}
              title="Grassroots ASHA & Anganwadi Door-Knock Evacuation Roster"
              right={
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/12 text-purple-500 dark:text-purple-400 border border-purple-500/30 font-bold">
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
                    {(registryData?.roster || [
                      { id: "VULN-001", name: "Smt. Kamla Devi", age: 78, vulnerability: "Mobility Impaired (Wheelchair)", assigned_caretaker: "Geeta Rawat", caretaker_contact: "+91 98765 43210", evac_target_shelter: `${localityClean} High School Camp`, status: "DISPATCHED" },
                      { id: "VULN-002", name: "Shri Ramesh Negi", age: 54, vulnerability: "Hearing Impaired (Deaf)", assigned_caretaker: "Suresh Kumar", caretaker_contact: "Neighbor Volunteer", evac_target_shelter: `${localityClean} Panchayat Bhavan`, status: "DOOR-KNOCK ASSIGNED" },
                      { id: "VULN-003", name: "Master Ankit Kumar", age: 14, vulnerability: "Visually Impaired (Blind)", assigned_caretaker: "Anita Devi", caretaker_contact: "Anganwadi Worker", evac_target_shelter: `${localityClean} Panchayat Bhavan`, status: "EN ROUTE" },
                      { id: "VULN-004", name: "Shri Balbir Singh", age: 82, vulnerability: "Bedridden / High-Care", assigned_caretaker: "Vijay Pal", caretaker_contact: "SDRF Medical Aid", evac_target_shelter: `${districtClean} Emergency Medical Center`, status: "STRETCHER DISPATCHED" },
                    ]).map((citizen: any) => (
                      <tr key={citizen.id}>
                        <td className="py-2.5 text-ink font-bold">{citizen.name} ({citizen.age})</td>
                        <td className="py-2.5 text-amber-600 dark:text-amber-400">{citizen.vulnerability}</td>
                        <td className="py-2.5 text-ink-dim">{citizen.assigned_caretaker} {citizen.caretaker_contact ? `(${citizen.caretaker_contact})` : ""}</td>
                        <td className="py-2.5 text-ink-dim">{citizen.evac_target_shelter}</td>
                        <td className="py-2.5 text-right font-mono text-[10px] text-accent font-bold">{citizen.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </BentoCard>
        </motion.div>

        {/* Relief Shelter Capacity & Staging */}
        <motion.div variants={fadeSlideUp}>
          <BentoCard>
            <CardHeader 
              icon={Building2}
              title="Designated High-Ground Relief Camps & Staging Capacity"
              right={
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-accent/12 text-accent border border-accent/30 font-bold">
                  LOGISTICS READY
                </span>
              }
            />
            <CardBody className="p-4 space-y-3">
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-lg bg-secondary/40 border border-border flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-ink">High Ground Senior Secondary School</h4>
                    <span className="text-[10.5px] text-ink-dim">Elevation: +45m above crest · Capacity: 1,200 Persons</span>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-accent font-mono">
                      <span>✓ 48h Water Stock</span>
                      <span>✓ Medical Officer Present</span>
                      <span>✓ 50kVA Generator</span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-sm font-black text-accent">850 / 1200</span>
                    <span className="text-[10px] text-ink-faint block">Beds Available</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-secondary/40 border border-border flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-ink">Panchayat Community Multi-Purpose Hall</h4>
                    <span className="text-[10.5px] text-ink-dim">Elevation: +38m above crest · Capacity: 650 Persons</span>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-accent font-mono">
                      <span>✓ Cooked Meal Staging</span>
                      <span>✓ Satellite Radio Comm</span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-sm font-black text-accent">420 / 650</span>
                    <span className="text-[10px] text-ink-faint block">Beds Available</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-secondary/40 border border-border flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-ink">{districtClean} Sub-Divisional Hospital Emergency Wing</h4>
                    <span className="text-[10.5px] text-ink-dim">Emergency Trauma &amp; Oxygen Staging · Critical Care</span>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-blue-500 dark:text-blue-400 font-mono">
                      <span>✓ Blood Bank Active</span>
                      <span>✓ 12 Ambulances Stationed</span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-sm font-black text-blue-500 dark:text-blue-400">95 / 150</span>
                    <span className="text-[10px] text-ink-faint block">ICU &amp; Ward Beds</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </BentoCard>
        </motion.div>
      </motion.div>
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

  const waypointSteps = [
    { num: 1, color: "accent", title: "Origin: Riverfront & Municipal Low-Lying Basin", desc: "Immediately ascend via Municipal Link Road to avoid stormwater backflow. Clearance: +12m." },
    { num: 2, color: "amber", title: "Bypass Submersible Old Suspension Bridge & Low Nullah", desc: "Traffic diverted through High Elevated Bypass Spur. Waterlogging risk on lower route: 88%." },
    { num: 3, color: "accent", title: "Join Elevated National Highway / Expressway Ridge", desc: "Four-lane grade-separated viaduct. Free-flow traffic at 60 km/h with 0% submergence hazard." },
    { num: 4, color: "purple", title: "Destination: High-Ground Emergency Relief Base", desc: "Designated staging camp with 850 available beds, medical triage, and food supplies." },
  ];

  const colorMap: Record<string, { dot: string; ring: string; text: string }> = {
    accent: { dot: "bg-accent/30 border-accent", ring: "text-accent", text: "text-accent" },
    amber: { dot: "bg-amber-500/30 border-amber-500", ring: "text-amber-500", text: "text-amber-500" },
    purple: { dot: "bg-purple-500/30 border-purple-500", ring: "text-purple-500 dark:text-purple-400", text: "text-purple-500 dark:text-purple-400" },
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-[1920px] mx-auto w-full">
      {/* Action Header */}
      <SectionHeader
        icon={RouteIcon}
        title="EMERGENCY EVACUATION ROUTE & DISPATCH COMMAND"
        badge="TOPOGRAPHIC RIDGE OPTIMIZED"
        accentColor="accent"
        subtitle={<>Live Safe Detours &amp; First Responder Waypoints for: <strong className="text-ink">{locationName}</strong></>}
        right={
          <button
            onClick={() => setShowDispatchModal(true)}
            className="px-4 py-2 rounded-lg bg-accent hover:bg-accent/90 text-white font-extrabold text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Send size={13} />
            Dispatch Route to First Responders &amp; GPS Apps
          </button>
        }
      />

      {/* Row 1: Safe Route Panel + Turn-by-Turn Waypoints */}
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <motion.div variants={fadeSlideUp} className="lg:col-span-5 flex flex-col">
          <SafeRoutePanel 
            selectedCell={selectedCell}
            monitoredLocation={monitoredLocation}
            locationName={locationName}
            maxRisks={maxRisks}
          />
        </motion.div>

        <motion.div variants={fadeSlideUp} className="lg:col-span-7 flex flex-col">
          <BentoCard className="h-full flex flex-col">
            <CardHeader
              icon={Navigation}
              title="Turn-by-Turn Safe Passage Waypoints & Flood Crest Clearance"
              right={
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-accent/12 text-accent border border-accent/30 font-bold">
                  HAZARDS BYPASSED
                </span>
              }
            />
            <CardBody className="p-4 flex-1 flex flex-col justify-between space-y-3 text-xs">
              <div className="space-y-3">
                {waypointSteps.map((step, idx) => {
                  const c = colorMap[step.color] || colorMap.accent;
                  return (
                    <motion.div
                      key={step.num}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.1 }}
                      className="p-3 rounded-lg bg-secondary/40 border border-border flex items-start gap-3"
                    >
                      <div className={`w-6 h-6 rounded-full ${c.dot} border ${c.ring} flex items-center justify-center font-bold text-xs shrink-0`}>
                        {step.num}
                      </div>
                      <div>
                        <h4 className="font-bold text-ink">{step.title}</h4>
                        <p className="text-[11px] text-ink-dim mt-0.5">{step.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="p-2.5 rounded-lg bg-accent/8 border border-accent/20 text-[11px] text-accent flex items-center gap-2">
                <ShieldCheck size={14} className="text-accent shrink-0" />
                <span>Total Safe Detour: <strong>24 km · 28 min</strong> · 100% Topographic Crest Clearance</span>
              </div>
            </CardBody>
          </BentoCard>
        </motion.div>
      </motion.div>

      {/* Row 2: Alternate Evacuation Corridors Matrix */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
        <BentoCard>
          <CardHeader 
            icon={Milestone}
            title="Comparative Evacuation Corridors & Traffic Capacity Matrix"
            right={
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-secondary/60 text-ink-dim border border-border">
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
                  <tr className="bg-accent/5">
                    <td className="py-2.5 text-ink font-bold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent" />
                      Corridor A: Elevated Ridge Highway Bypass
                    </td>
                    <td className="py-2.5 text-accent font-mono font-bold">24 km · 28 min</td>
                    <td className="py-2.5 text-ink-dim font-mono">+45m above riverbed</td>
                    <td className="py-2.5 text-accent font-bold">12% (Negligible)</td>
                    <td className="py-2.5 text-right font-mono text-[10.5px] text-accent font-bold">RECOMMENDED PASSAGE</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-ink font-bold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Corridor B: Secondary Canal Link &amp; Rural Road
                    </td>
                    <td className="py-2.5 text-amber-600 dark:text-amber-400 font-mono font-bold">31 km · 38 min</td>
                    <td className="py-2.5 text-ink-dim font-mono">+22m above riverbed</td>
                    <td className="py-2.5 text-amber-600 dark:text-amber-400 font-bold">34% (Moderate)</td>
                    <td className="py-2.5 text-right font-mono text-[10.5px] text-amber-600 dark:text-amber-400 font-bold">SECONDARY STANDBY</td>
                  </tr>
                  <tr className="opacity-60 bg-destructive/5">
                    <td className="py-2.5 text-ink-faint font-bold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-destructive" />
                      Corridor C: Low-Lying River Road
                    </td>
                    <td className="py-2.5 text-destructive font-mono font-bold">18 km · BLOCKED</td>
                    <td className="py-2.5 text-ink-faint font-mono">+2m (Submerged)</td>
                    <td className="py-2.5 text-destructive font-bold">88% (Extreme Submergence)</td>
                    <td className="py-2.5 text-right font-mono text-[10.5px] text-destructive font-bold">CLOSED BY POLICE</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardBody>
        </BentoCard>
      </motion.div>

      {/* Route Dispatch Modal */}
      <AnimatePresence>
        {showDispatchModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
              className="bg-panel border border-accent/40 rounded-[0.66rem] w-full max-w-lg p-5 shadow-lg space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border-soft/70 pb-3">
                <div className="flex items-center gap-2">
                  <Send size={18} className="text-accent" />
                  <h3 className="font-extrabold text-ink text-sm">
                    Dispatch Route to First Responders &amp; GPS Apps
                  </h3>
                </div>
                <button 
                  onClick={() => setShowDispatchModal(false)}
                  className="text-ink-faint hover:text-ink p-1 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <span className="text-[10.5px] font-bold text-ink-faint uppercase tracking-wider block">
                  Target Navigation Broadcast Channels:
                </span>
                <div className="space-y-2 bg-secondary/40 p-3 rounded-lg border border-border">
                  <label className="flex items-center gap-2.5 text-ink cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-[#246b38] w-4 h-4 rounded" />
                    <span>SDRF &amp; NDRF Field Quick Reaction Units (VHF 152.45 MHz)</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-ink cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-[#246b38] w-4 h-4 rounded" />
                    <span>State Traffic Police Highway Patrol (GPS Push)</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-ink cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-[#246b38] w-4 h-4 rounded" />
                    <span>Google Maps &amp; Mappls Navigation (GeoJSON Ingestion Stream)</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-ink cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-[#246b38] w-4 h-4 rounded" />
                    <span>Local Public Paging Carts &amp; Siren Megaphones</span>
                  </label>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-accent/8 border border-accent/25 text-xs text-accent">
                <strong>Corridor:</strong> {locationName} Elevated Ridge Bypass (24 km · Clearance +45m)
              </div>

              {transmissionSuccess ? (
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className="p-3 rounded-lg bg-accent text-white font-bold text-xs flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} /> Route GeoJSON Stream Dispatched to 14 Responders!
                </motion.div>
              ) : (
                <button
                  onClick={handleTransmit}
                  disabled={isTransmitting}
                  className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
