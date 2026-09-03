import React, { useState } from "react";
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
import { Card, CardHeader, CardBody } from "@/components/ui/card";

interface ReportsAnalyticsViewProps {
  onTriggerAlert: () => void;
  onTriggerSitrep: () => void;
  locationName: string;
  maxRisks: Record<string, number>;
  selectedCell?: { lat: number; lon: number } | null;
}

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

  const sitrepRecords = [
    {
      id: "SITREP-2026-0826-UK01",
      location: locationName || "Rudraprayag Sector, Mandakini Basin",
      hazard: "Cloudburst & Flash Flood Hydro-Surge",
      severity: "RED ALERT",
      time: "26 Aug 2026 · 10:24 AM IST",
      populationExposed: 18420,
      status: "TRANSMITTED TO SDMA & NDRF",
      source: "Automated ConvLSTM Fusion",
      channelsDispatched: 4
    },
    {
      id: "SITREP-2026-0826-DL04",
      location: "Delhi-NCR Yamuna Floodplain Sector",
      hazard: "Urban Inundation & Drainage Surcharge",
      severity: "ORANGE ALERT",
      time: "26 Aug 2026 · 08:45 AM IST",
      populationExposed: 42100,
      status: "CIRCULATED TO DDMA",
      source: "Radar Nowcast + Sensor Mesh",
      channelsDispatched: 3
    },
    {
      id: "SITREP-2026-0825-KL09",
      location: "Wayanad Western Ghats Slope Sector",
      hazard: "Toe Erosion & Landslide Susceptibility",
      severity: "YELLOW ADVISORY",
      time: "25 Aug 2026 · 06:15 PM IST",
      populationExposed: 8350,
      status: "ARCHIVED / NOMINAL",
      source: "DEM Gradient Soil Saturation",
      channelsDispatched: 2
    }
  ];

  const handleCopy = (id: string) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 text-ink">
      {/* Top Banner with Action Dispatchers */}
      <div className="bg-panel border border-border p-5 rounded-2xl shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <FileBarChart size={22} />
            </span>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Reports &amp; Situation Analytics Command
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold">
                NDRF SITREP ENGINE v2.4
              </span>
            </h1>
          </div>
          <p className="text-xs text-ink-dim leading-relaxed">
            Centralized clearinghouse for automated Government of India standard Situation Reports (SITREP), multi-channel public warning dispatches, and historical telemetry audit logs.
          </p>
        </div>

        {/* PRIMARY ACTION BUTTONS (Relocated from Dashboard) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
          <button 
            onClick={onTriggerAlert}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-extrabold text-xs tracking-wide transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-[0.98]"
          >
            <ShieldAlert size={16} />
            DISPATCH MULTI-CHANNEL &amp; BLE MESH ALERT
          </button>
          <button 
            onClick={onTriggerSitrep}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-panel-alt hover:bg-panel border border-slate-600 hover:border-slate-500 text-white rounded-xl font-extrabold text-xs tracking-wide transition-all shadow-md active:scale-[0.98]"
          >
            <FileText size={16} className="text-blue-400" />
            VIEW AUTOMATED NDRF SITREP REPORT
          </button>
        </div>
      </div>

      {/* KPI Performance Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-panel border border-border flex items-center justify-between">
          <div>
            <span className="text-[10.5px] uppercase font-bold text-ink-faint tracking-wider">Total SITREPs Compiled</span>
            <div className="text-2xl font-black font-mono text-white mt-0.5">148</div>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle2 size={11} /> 100% Automated Format Compliance
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <FileText size={20} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-panel border border-border flex items-center justify-between">
          <div>
            <span className="text-[10.5px] uppercase font-bold text-ink-faint tracking-wider">Citizen Reach (5km Radius)</span>
            <div className="text-2xl font-black font-mono text-white mt-0.5">68,870</div>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle2 size={11} /> SMS, WhatsApp &amp; Voice Broadcast
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Bell size={20} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-panel border border-border flex items-center justify-between">
          <div>
            <span className="text-[10.5px] uppercase font-bold text-ink-faint tracking-wider">Offline BLE Mesh Hops</span>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-0.5">14 Nodes</div>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
              <Radio size={11} /> Zero Cell Signal P2P Protocol
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Radio size={20} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-panel border border-border flex items-center justify-between">
          <div>
            <span className="text-[10.5px] uppercase font-bold text-ink-faint tracking-wider">M2M SCADA Interlocks</span>
            <div className="text-2xl font-black font-mono text-purple-400 mt-0.5">4 Systems</div>
            <span className="text-[10px] text-purple-300 flex items-center gap-1 mt-0.5">
              <Cpu size={11} /> Dam Gates, Kavach &amp; VMS Matrix
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Cpu size={20} />
          </div>
        </div>
      </div>

      {/* Main SITREP Documents List */}
      <Card>
        <CardHeader
          icon={FileText}
          title="Official Situation Reports (NDRF / SDMA Archive)"
          right={
            <div className="flex items-center gap-2">
              <button
                onClick={onTriggerSitrep}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <FileText size={13} /> View Active SITREP
              </button>
            </div>
          }
        />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-panel-alt/60 text-ink-dim border-b border-border/80 text-[11px] uppercase tracking-wider">
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
                  <tr key={r.id} className="hover:bg-panel-alt/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                      <div className="flex items-center gap-1.5">
                        <span>{r.id}</span>
                        <button 
                          onClick={() => handleCopy(r.id)} 
                          className="text-ink-faint hover:text-white"
                          title="Copy Report ID"
                        >
                          {copiedId === r.id ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Share2 size={12} />}
                        </button>
                      </div>
                      <div className="text-[10px] text-ink-faint font-normal">{r.time}</div>
                    </td>
                    <td className="py-3.5 px-4 text-white font-medium">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-ink-dim shrink-0" />
                        <span className="truncate max-w-[180px]">{r.location}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-ink-dim">{r.hazard}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                        r.severity.includes("RED")
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : r.severity.includes("ORANGE")
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      }`}>
                        {r.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {r.populationExposed.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-emerald-400 font-medium">
                      {r.status}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={onTriggerSitrep}
                        className="px-2.5 py-1 rounded bg-panel-alt hover:bg-blue-600/30 border border-border hover:border-blue-500/40 text-blue-400 hover:text-white text-[11px] font-bold transition-all inline-flex items-center gap-1"
                      >
                        Inspect ➔
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Dispatch Channel Logs & Verification Suite */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Multi-Channel Distribution Breakdown */}
        <Card>
          <CardHeader icon={Bell} title="Multi-Channel Dispatch Reach Breakdown" />
          <CardBody className="space-y-3 p-4 text-xs">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Channel 1: Citizens 5km Radius</span>
                <span className="text-[11px] text-blue-300/80">SMS Broadcast, WhatsApp Cloud API &amp; Hindi Voice Siren</span>
              </div>
              <span className="font-mono font-bold text-blue-400 text-sm">98.4% Sent</span>
            </div>

            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Channel 2: DM Office &amp; First Responders</span>
                <span className="text-[11px] text-red-300/80">State Emergency Operation Center (SEOC) REST Webhook</span>
              </div>
              <span className="font-mono font-bold text-red-400 text-sm">42 Endpoints</span>
            </div>

            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Channel 3: Offline P2P Mesh Relay</span>
                <span className="text-[11px] text-emerald-300/80">Bluetooth Low Energy (BLE) multi-hop without cell towers</span>
              </div>
              <span className="font-mono font-bold text-emerald-400 text-sm">14 Hops</span>
            </div>

            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Channel 4: M2M SCADA Interlocks</span>
                <span className="text-[11px] text-purple-300/80">IEC 60870-5-104 Dam Sluices, Kavach Railway Speed Cap</span>
              </div>
              <span className="font-mono font-bold text-purple-400 text-sm">4 Systems</span>
            </div>
          </CardBody>
        </Card>

        {/* Verification & Accuracy Audit Card */}
        <Card>
          <CardHeader icon={TrendingUp} title="Situational Audit & Model Accuracy" />
          <CardBody className="space-y-3.5 p-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-panel-alt border border-border">
                <span className="text-[10px] text-ink-faint block uppercase font-bold">Historical Test FAR</span>
                <span className="text-xl font-black text-emerald-400 font-mono">14.2%</span>
                <span className="text-[10px] text-ink-dim block mt-0.5">vs 38.5% standard NWP baseline</span>
              </div>
              <div className="p-3 rounded-lg bg-panel-alt border border-border">
                <span className="text-[10px] text-ink-faint block uppercase font-bold">Critical Success Index</span>
                <span className="text-xl font-black text-blue-400 font-mono">0.84</span>
                <span className="text-[10px] text-ink-dim block mt-0.5">Validated on Uttarakhand/Kerala sets</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-panel-alt border border-border space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-ink-dim">Lead Time Advantage:</span>
                <span className="font-bold text-white">+2 to +4 Hours</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-ink-dim">Spatial Resolution:</span>
                <span className="font-bold text-white">~1.2 km micro-basin</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-ink-dim">Inference Latency:</span>
                <span className="font-bold text-emerald-400">&lt;45 ms (PyTorch ConvLSTM)</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-panel-alt/80 border border-border text-[10.5px] text-ink-dim flex items-center justify-between">
              <span>Standard Format: NDMA SOP v3.2</span>
              <button 
                onClick={onTriggerSitrep}
                className="underline text-blue-400 hover:text-white font-bold"
              >
                Generate Live SITREP Now ➔
              </button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
