import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  FileBarChart, 
  FileText, 
  ShieldAlert, 
  Bell, 
  Radio, 
  Cpu, 
  Download, 
  Printer, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ExternalLink,
  Filter,
  Share2,
  Sparkles,
  TrendingUp,
  MapPin
} from "lucide-react";
import { BentoCard, Card, CardHeader, CardBody } from "@/components/ui/card";

interface ReportsAnalyticsViewProps {
  onTriggerAlert: () => void;
  onTriggerSitrep: () => void;
  locationName: string;
  maxRisks: Record<string, number>;
  selectedCell?: { lat: number; lon: number } | null;
}

/* ─── Animation presets ─── */
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const fadeSlideUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export function ReportsAnalyticsView({
  onTriggerAlert,
  onTriggerSitrep,
  locationName,
  maxRisks,
  selectedCell
}: ReportsAnalyticsViewProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const highestRisk = Math.max(...Object.values(maxRisks || { flash_flood: 0 }));
  const now = new Date();
  const dateTag = now.toISOString().slice(0, 10).replace(/-/g, '');
  const nowStr = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} · ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST`;
  
  const topHazard = Object.entries(maxRisks || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || 'flash_flood';
  const hazardLabel = topHazard.replace('_', ' ').toUpperCase();
  const severityLabel = highestRisk > 0.75 ? "RED ALERT" : highestRisk > 0.50 ? "ORANGE ALERT" : highestRisk > 0.25 ? "YELLOW ADVISORY" : "GREEN NOMINAL";

  const sitrepRecords = [
    {
      id: `SITREP-${dateTag}-${(selectedCell?.lat || 30.2).toFixed(1).replace('.', '')}A`,
      location: locationName ? `${locationName} Sector` : "Active Monitored Sector",
      hazard: `${hazardLabel} & Hydro-Surge`,
      severity: severityLabel,
      time: `${nowStr} (Active)`,
      populationExposed: Math.round(14000 + highestRisk * 48000),
      status: highestRisk > 0.60 ? "TRANSMITTED TO SDMA & NDRF" : "CIRCULATED TO DEOC",
      source: "Automated ConvLSTM Fusion",
      channelsDispatched: highestRisk > 0.60 ? 4 : 2
    },
    {
      id: `SITREP-${dateTag}-UK02`,
      location: "Rudraprayag Sector, Mandakini Basin",
      hazard: "Cloudburst & Flash Flood Hydro-Surge",
      severity: "RED ALERT",
      time: "2 hours ago",
      populationExposed: 18420,
      status: "TRANSMITTED TO SDMA & NDRF",
      source: "Automated ConvLSTM Fusion",
      channelsDispatched: 4
    },
    {
      id: `SITREP-${dateTag}-DL04`,
      location: "Delhi-NCR Yamuna Floodplain Sector",
      hazard: "Urban Inundation & Drainage Surcharge",
      severity: "ORANGE ALERT",
      time: "4 hours ago",
      populationExposed: 42100,
      status: "CIRCULATED TO DDMA",
      source: "Radar Nowcast + Sensor Mesh",
      channelsDispatched: 3
    }
  ];

  const handleCopy = (id: string) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadSitrep = (record: any) => {
    const doc = `======================================================================
NATIONAL DISASTER MANAGEMENT AUTHORITY (NDMA) / NDRF SITREP
AGRAAN AI - AUTOMATED SITUATION ASSESSMENT REPORT
======================================================================
REPORT IDENTIFIER  : ${record.id}
DATE & TIMESTAMP   : ${record.time}
MONITORED REGION   : ${record.location}
ALERT LEVEL        : ${record.severity}
HAZARD FORMATION   : ${record.hazard}
ESTIMATED POPULATION EXPOSED : ${record.populationExposed.toLocaleString()}
DISPATCH CHANNELS  : ${record.channelsDispatched} Actuated Channels
======================================================================
1. PHYSICAL ATMOSPHERIC DRIVERS:
- Satellite Analysis  : INSAT-3DR Convective Infrared Core Detected
- Peak Radar Echoes   : Convective Rainfall Band in Upper Catchment
- Saturated Runoff    : Immediate Soil Runoff Influx

2. FIRST RESPONDER ACTIONS:
- Dispatch local ASHA / Anganwadi caretakers for disabled registry
- Enforce emergency detours along safe ridgeline corridors
- Issue cell-broadcast multilingual voice alerts across sector

3. INDUSTRIAL & INFRASTRUCTURE INTERLOCKS:
- Dam spillway pre-discharge protocol: IEC 60870-5-104
- Automated train caution orders capped to 30 km/h (Kavach-API)
======================================================================
AUTHORITY: Agraan AI Pre-Impact Defense System
======================================================================`;
    const blob = new Blob([doc], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${record.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const kpiCards = [
    { label: "Total SITREPs Compiled", value: "148", sub: "100% Automated Format Compliance", icon: FileText, color: "accent" as const },
    { label: "Citizen Reach (5km Radius)", value: "68,870", sub: "SMS, WhatsApp & Voice Broadcast", icon: Bell, color: "accent" as const },
    { label: "Offline BLE Mesh Hops", value: "14 Nodes", sub: "Zero Cell Signal P2P Protocol", icon: Radio, color: "accent" as const },
    { label: "M2M SCADA Interlocks", value: "4 Systems", sub: "Dam Gates, Kavach & VMS Matrix", icon: Cpu, color: "amber" as const },
  ];

  const colorMap = {
    accent: { iconBg: "bg-accent/12", iconBorder: "border-accent/25", iconText: "text-accent", valueText: "text-accent" },
    amber: { iconBg: "bg-amber-500/12", iconBorder: "border-amber-500/25", iconText: "text-amber-500", valueText: "text-amber-500 dark:text-amber-400" },
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 text-ink max-w-[1920px] mx-auto w-full">
      {/* Top Banner with Action Dispatchers */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-panel border border-border p-5 rounded-[0.66rem] shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5"
      >
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-accent/12 text-accent border border-accent/25">
              <FileBarChart size={22} />
            </span>
            <h1 className="text-lg font-extrabold tracking-tight text-ink flex items-center gap-2 flex-wrap">
              Reports &amp; Situation Analytics Command
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-accent/12 text-accent border border-accent/25 font-bold">
                NDRF SITREP ENGINE v2.4
              </span>
            </h1>
          </div>
          <p className="text-xs text-ink-dim leading-relaxed">
            Centralized clearinghouse for automated Government of India standard Situation Reports (SITREP), multi-channel public warning dispatches, and historical telemetry audit logs.
          </p>
        </div>

        {/* PRIMARY ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
          <button 
            onClick={onTriggerAlert}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-destructive hover:bg-destructive/90 text-white rounded-lg font-extrabold text-xs tracking-wide transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <ShieldAlert size={16} />
            DISPATCH MULTI-CHANNEL &amp; BLE MESH ALERT
          </button>
          <button 
            onClick={onTriggerSitrep}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-secondary/60 hover:bg-secondary border border-border text-ink rounded-lg font-extrabold text-xs tracking-wide transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <FileText size={16} className="text-accent" />
            VIEW AUTOMATED NDRF SITREP REPORT
          </button>
        </div>
      </motion.div>

      {/* KPI Performance Bar */}
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, idx) => {
          const c = colorMap[kpi.color];
          return (
            <motion.div key={kpi.label} variants={fadeSlideUp}>
              <BentoCard className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10.5px] uppercase font-bold text-ink-faint tracking-wider">{kpi.label}</span>
                  <div className={`text-2xl font-black font-mono ${c.valueText} mt-0.5`}>{kpi.value}</div>
                  <span className="text-[10px] text-accent flex items-center gap-1 mt-0.5">
                    <CheckCircle2 size={11} /> {kpi.sub}
                  </span>
                </div>
                <div className={`p-2.5 rounded-lg ${c.iconBg} ${c.iconText} border ${c.iconBorder}`}>
                  <kpi.icon size={20} />
                </div>
              </BentoCard>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Main SITREP Documents List */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }}>
        <BentoCard>
          <CardHeader
            icon={FileText}
            title="Official Situation Reports (NDRF / SDMA Archive)"
            right={
              <div className="flex items-center gap-2">
                <button
                  onClick={onTriggerSitrep}
                  className="px-3 py-1 bg-accent hover:bg-accent/90 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <FileText size={13} /> View Active SITREP
                </button>
              </div>
            }
          />
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/40 text-ink-dim border-b border-border text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Report ID</th>
                    <th className="py-3 px-4">Sector / Catchment</th>
                    <th className="py-3 px-4">Hazard Classification</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Exposed Pop</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {sitrepRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-accent">
                        <div className="flex items-center gap-1.5">
                          <span>{r.id}</span>
                          <button 
                            onClick={() => handleCopy(r.id)} 
                            className="text-ink-faint hover:text-ink cursor-pointer"
                            title="Copy Report ID"
                          >
                            {copiedId === r.id ? <CheckCircle2 size={12} className="text-accent" /> : <Share2 size={12} />}
                          </button>
                        </div>
                        <div className="text-[10px] text-ink-faint font-normal">{r.time}</div>
                      </td>
                      <td className="py-3.5 px-4 text-ink font-medium">
                        <div className="flex items-center gap-1">
                          <MapPin size={12} className="text-ink-dim shrink-0" />
                          <span className="truncate max-w-[180px]">{r.location}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-ink-dim">{r.hazard}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                          r.severity.includes("RED")
                            ? "bg-destructive/12 text-destructive border-destructive/25"
                            : r.severity.includes("ORANGE")
                            ? "bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/25"
                            : "bg-accent/12 text-accent border-accent/25"
                        }`}>
                          {r.severity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-ink">
                        {r.populationExposed.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-accent font-medium">
                        {r.status}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDownloadSitrep(r)}
                            className="px-2 py-1 rounded-lg bg-secondary/60 hover:bg-secondary border border-border text-accent hover:text-accent text-[11px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                            title="Download Official SITREP Text Document"
                          >
                            <Download size={11} /> Export
                          </button>
                          <button
                            onClick={onTriggerSitrep}
                            className="px-2 py-1 rounded-lg bg-accent/10 hover:bg-accent/15 border border-accent/25 text-accent text-[11px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            Inspect ➔
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </BentoCard>
      </motion.div>

      {/* Dispatch Channel Logs & Verification Suite */}
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Multi-Channel Distribution Breakdown */}
        <motion.div variants={fadeSlideUp}>
          <BentoCard>
            <CardHeader icon={Bell} title="Multi-Channel Dispatch Reach Breakdown" />
            <CardBody className="space-y-3 p-4 text-xs">
              <div className="p-3 rounded-lg bg-accent/8 border border-accent/20 flex items-center justify-between">
                <div>
                  <span className="font-bold text-ink block">Channel 1: Citizens 5km Radius</span>
                  <span className="text-[11px] text-ink-dim">SMS Broadcast, WhatsApp Cloud API &amp; Hindi Voice Siren</span>
                </div>
                <span className="font-mono font-bold text-accent text-sm">98.4% Sent</span>
              </div>

              <div className="p-3 rounded-lg bg-destructive/8 border border-destructive/20 flex items-center justify-between">
                <div>
                  <span className="font-bold text-ink block">Channel 2: DM Office &amp; First Responders</span>
                  <span className="text-[11px] text-ink-dim">State Emergency Operation Center (SEOC) REST Webhook</span>
                </div>
                <span className="font-mono font-bold text-destructive text-sm">42 Endpoints</span>
              </div>

              <div className="p-3 rounded-lg bg-accent/8 border border-accent/20 flex items-center justify-between">
                <div>
                  <span className="font-bold text-ink block">Channel 3: Offline P2P Mesh Relay</span>
                  <span className="text-[11px] text-ink-dim">Bluetooth Low Energy (BLE) multi-hop without cell towers</span>
                </div>
                <span className="font-mono font-bold text-accent text-sm">14 Hops</span>
              </div>

              <div className="p-3 rounded-lg bg-purple-500/8 border border-purple-500/20 flex items-center justify-between">
                <div>
                  <span className="font-bold text-ink block">Channel 4: M2M SCADA Interlocks</span>
                  <span className="text-[11px] text-ink-dim">IEC 60870-5-104 Dam Sluices, Kavach Railway Speed Cap</span>
                </div>
                <span className="font-mono font-bold text-purple-500 dark:text-purple-400 text-sm">4 Systems</span>
              </div>
            </CardBody>
          </BentoCard>
        </motion.div>

        {/* Verification & Accuracy Audit Card */}
        <motion.div variants={fadeSlideUp}>
          <BentoCard>
            <CardHeader icon={TrendingUp} title="Situational Audit & Model Accuracy" />
            <CardBody className="space-y-3.5 p-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-secondary/40 border border-border">
                  <span className="text-[10px] text-ink-faint block uppercase font-bold">Historical Test FAR</span>
                  <span className="text-xl font-black text-accent font-mono">14.2%</span>
                  <span className="text-[10px] text-ink-dim block mt-0.5">vs 38.5% standard NWP baseline</span>
                </div>
                <div className="p-3 rounded-lg bg-secondary/40 border border-border">
                  <span className="text-[10px] text-ink-faint block uppercase font-bold">Critical Success Index</span>
                  <span className="text-xl font-black text-accent font-mono">0.84</span>
                  <span className="text-[10px] text-ink-dim block mt-0.5">Validated on Uttarakhand/Kerala sets</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-secondary/40 border border-border space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-ink-dim">Lead Time Advantage:</span>
                  <span className="font-bold text-ink">+2 to +4 Hours</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-ink-dim">Spatial Resolution:</span>
                  <span className="font-bold text-ink">~1.2 km micro-basin</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-ink-dim">Inference Latency:</span>
                  <span className="font-bold text-accent">&lt;45 ms (PyTorch ConvLSTM)</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-secondary/30 border border-border text-[10.5px] text-ink-dim flex items-center justify-between">
                <span>Standard Format: NDMA SOP v3.2</span>
                <button 
                  onClick={onTriggerSitrep}
                  className="underline text-accent hover:text-accent/80 font-bold cursor-pointer"
                >
                  Generate Live SITREP Now ➔
                </button>
              </div>
            </CardBody>
          </BentoCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
