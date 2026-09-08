import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { API_BASE } from "@/config/api";
import { 
  Building2, 
  Cpu, 
  Zap, 
  Waves, 
  Train, 
  Radio, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Code2, 
  Lock, 
  Sparkles,
  Info,
  Terminal,
  Send,
  Wifi,
  Play,
  Activity
} from "lucide-react";
import { BentoCard, Card, CardHeader, CardBody } from "@/components/ui/card";

interface InterlockTarget {
  id: string;
  name: string;
  category: string;
  protocol: string;
  action: string;
  status: string;
  latency_ms: number;
  payload_preview: Record<string, any>;
  fail_safe: string;
}

interface M2MResponse {
  lat: number;
  lon: number;
  forecast_hour: number;
  composite_risk: number;
  interlock_triggered: boolean;
  aborted_by_operator: boolean;
  override_window_seconds: number;
  trigger_timestamp: string;
  targets: InterlockTarget[];
  transparency_framework: {
    tier: string;
    one_concern_safeguard: string;
    production_prerequisite: string;
  };
}

interface InfrastructureCommandViewProps {
  selectedCell?: { lat: number; lon: number } | null;
  monitoredLocation?: { lat: number; lon: number } | null;
  forecastHour?: number;
}

/* ─── Animation presets ─── */
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const fadeSlideUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export function InfrastructureCommandView({
  selectedCell,
  monitoredLocation,
  forecastHour = 1,
}: InfrastructureCommandViewProps) {
  const [data, setData] = useState<M2MResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>("hydro_sluice_gate");
  const [overrideBusy, setOverrideBusy] = useState(false);
  const [pingingTargetId, setPingingTargetId] = useState<string | null>(null);
  const [liveLatencies, setLiveLatencies] = useState<Record<string, number>>({});
  const [scadaLogs, setScadaLogs] = useState<Array<{ id: string; time: string; target: string; latency: number; frame: string; hash: string }>>([
    {
      id: "init-1",
      time: "04:50:12 IST",
      target: "Regional Optical Gateway",
      latency: 24,
      frame: "HANDSHAKE_INIT [OPTICAL_ISOLATION: ACTIVE, STATUS: SYN_ACK_OK]",
      hash: "SHA256:88F2A109"
    }
  ]);

  const lat = selectedCell?.lat ?? monitoredLocation?.lat ?? 28.75;
  const lon = selectedCell?.lon ?? monitoredLocation?.lon ?? 77.50;

  const fetchData = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/infrastructure/m2m-interlocks/${lat.toFixed(4)}/${lon.toFixed(4)}?forecast_hour=${forecastHour}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error("M2M fetch failed:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, [lat, lon, forecastHour]);

  const handleToggleOverride = async () => {
    setOverrideBusy(true);
    try {
      const authToken = localStorage.getItem("agraan_auth_token") || "agraan-emergency-dev-key-2026";
      await fetch(`${API_BASE}/api/infrastructure/m2m-override`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ action: "toggle" }),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setOverrideBusy(false);
    }
  };

  const handlePingTarget = async (targetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPingingTargetId(targetId);
    try {
      const res = await fetch(`${API_BASE}/api/infrastructure/m2m-test-ping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_id: targetId, lat, lon })
      });
      const result = await res.json();
      setLiveLatencies(prev => ({ ...prev, [targetId]: result.roundtrip_ms }));
      setScadaLogs(prev => [
        {
          id: `ping-${Date.now()}`,
          time: result.timestamp.split(" ")[1] + " IST",
          target: result.node_location || targetId,
          latency: result.roundtrip_ms,
          frame: result.scada_frame,
          hash: result.integrity_hash
        },
        ...prev.slice(0, 6)
      ]);
    } catch (err) {
      console.error("SCADA Ping failed:", err);
    } finally {
      setPingingTargetId(null);
    }
  };

  const selectedTarget = data?.targets.find(t => t.id === selectedTargetId) || data?.targets[0];

  const getTargetIcon = (id: string) => {
    switch (id) {
      case "hydro_sluice_gate":
        return Waves;
      case "railway_kavach":
        return Train;
      case "highway_its":
        return Radio;
      default:
        return Zap;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 text-ink max-w-[1920px] mx-auto w-full">
      {/* Top Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-panel border border-border p-4 rounded-[0.66rem] shadow-xs"
      >
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-2 rounded-lg bg-accent/12 text-accent border border-accent/25">
              <Cpu size={20} />
            </span>
            <h1 className="text-lg font-extrabold tracking-tight text-ink flex items-center gap-2 flex-wrap">
              Autonomous M2M Infrastructure Interlock Center
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-accent/12 text-accent border border-accent/25 font-bold">
                SCADA PROTOCOL READY
              </span>
            </h1>
          </div>
          <p className="text-xs text-ink-dim max-w-3xl">
            Automated Machine-to-Machine (M2M) action triggering. Dispatches zero-latency SCADA &amp; IoT control packets directly to dams, railway interlocking systems, highway matrix boards, and substation islanding relays before floodwaters crest.
          </p>
        </div>

        {/* Human in the Loop Override Control */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleToggleOverride}
            disabled={overrideBusy}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer ${
              data?.aborted_by_operator
                ? "bg-accent hover:bg-accent/90 text-white"
                : "bg-destructive hover:bg-destructive/90 text-white"
            }`}
          >
            {data?.aborted_by_operator ? (
              <>
                <RefreshCw size={14} className={overrideBusy ? "animate-spin" : ""} />
                ARM M2M INTERLOCKS (RESUME)
              </>
            ) : (
              <>
                <Lock size={14} />
                EMERGENCY OPERATOR ABORT (HITL)
              </>
            )}
          </button>
          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-secondary/60 border border-border text-ink-dim hover:text-ink transition-colors cursor-pointer"
            title="Refresh Interlocks"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </motion.div>

      {/* Operator Safety Status Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={`p-3 rounded-[0.66rem] border flex items-center justify-between text-xs ${
          data?.aborted_by_operator
            ? "bg-amber-500/8 border-amber-500/25 text-amber-600 dark:text-amber-400"
            : data?.interlock_triggered
            ? "bg-destructive/8 border-destructive/25 text-destructive"
            : "bg-accent/8 border-accent/25 text-accent"
        }`}
      >
        <div className="flex items-center gap-2">
          {data?.aborted_by_operator ? (
            <XCircle size={16} className="text-amber-500 shrink-0" />
          ) : data?.interlock_triggered ? (
            <ShieldAlert size={16} className="text-destructive shrink-0 animate-pulse" />
          ) : (
            <ShieldCheck size={16} className="text-accent shrink-0" />
          )}
          <span>
            <strong>Interlock Mode: </strong>
            {data?.aborted_by_operator
              ? "MANUAL OVERRIDE ACTIVE — All machine actuation packets suspended by operator."
              : data?.interlock_triggered
              ? `HAZARD TRIGGERED (Risk: ${data?.composite_risk}%) — Automated SCADA signals active with 60s fail-safe window.`
              : `STANDBY MONITORING (Risk: ${data?.composite_risk}%) — Continuous telemetry handshake with connected nodes.`}
          </span>
        </div>
        <span className="font-mono text-[11px] text-ink-dim hidden sm:inline">
          {data?.trigger_timestamp}
        </span>
      </motion.div>

      {/* 4 Infrastructure Interlock Cards */}
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {data?.targets.map((target) => {
          const Icon = getTargetIcon(target.id);
          const isSelected = selectedTargetId === target.id;
          const isDispatched = target.status.includes("DISPATCHED") || target.status.includes("INJECTED") || target.status.includes("ARMED");

          return (
            <motion.div key={target.id} variants={fadeSlideUp}>
              <BentoCard
                onClick={() => setSelectedTargetId(target.id)}
                glowBorder={isSelected ? "accent" : "none"}
                className={`p-4 cursor-pointer ${isSelected ? "ring-1 ring-accent/40" : ""}`}
                whileHover={{ y: -3, scale: 1.01 }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className={`p-2 rounded-lg ${isDispatched ? "bg-destructive/12 border-destructive/25" : "bg-accent/12 border-accent/25"} border`}>
                    <Icon size={18} className={isDispatched ? "text-destructive" : "text-accent"} />
                  </div>
                  <span className={`text-[9.5px] font-mono font-black px-2 py-0.5 rounded-md border ${
                    isDispatched
                      ? "bg-destructive/12 text-destructive border-destructive/25 animate-pulse"
                      : "bg-accent/12 text-accent border-accent/25"
                  }`}>
                    {target.status}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-ink truncate mb-0.5">{target.name}</h3>
                <p className="text-[11px] text-ink-dim mb-3 truncate">{target.category}</p>

                <div className="space-y-1 text-[11px] border-t border-border-soft/70 pt-2">
                  <div className="flex justify-between">
                    <span className="text-ink-faint">Protocol:</span>
                    <span className="font-mono text-ink-dim">{target.protocol.split('/')[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-faint">Latency:</span>
                    <span className="font-mono text-accent">{target.latency_ms} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-faint">Action:</span>
                    <span className="font-medium text-ink truncate max-w-[140px]">{target.action}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => handlePingTarget(target.id, e)}
                  disabled={pingingTargetId === target.id}
                  className="w-full mt-2.5 py-1.5 px-2.5 rounded-lg bg-accent/10 hover:bg-accent/15 border border-accent/25 text-[10.5px] font-bold text-accent flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {pingingTargetId === target.id ? (
                    <>
                      <RefreshCw size={11} className="animate-spin text-accent" />
                      <span>Transmitting SCADA Frame...</span>
                    </>
                  ) : (
                    <>
                      <Wifi size={11} className="text-accent" />
                      <span>Ping SCADA ({liveLatencies[target.id] ?? target.latency_ms} ms)</span>
                    </>
                  )}
                </button>
              </BentoCard>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Selected Infrastructure Inspector & Protocol Payload Viewer */}
      {selectedTarget && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-5"
        >
          <BentoCard className="lg:col-span-2">
            <CardHeader
              icon={Code2}
              title={`SCADA Protocol Payload: ${selectedTarget.name}`}
              right={
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-accent/12 text-accent border border-accent/25">
                  {selectedTarget.protocol}
                </span>
              }
            />
            <CardBody className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-secondary/40 p-3 rounded-lg border border-border space-y-1">
                  <span className="text-ink-faint text-[10px] uppercase font-bold tracking-wider">Automated Action Command</span>
                  <p className="font-semibold text-ink">{selectedTarget.action}</p>
                </div>
                <div className="bg-secondary/40 p-3 rounded-lg border border-border space-y-1">
                  <span className="text-ink-faint text-[10px] uppercase font-bold tracking-wider">Fail-Safe Hardware Interlock</span>
                  <p className="font-semibold text-amber-600 dark:text-amber-400">{selectedTarget.fail_safe}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs text-ink-dim">
                  <span className="font-mono text-[11px] flex items-center gap-1.5">
                    <Sparkles size={12} className="text-accent" />
                    Machine-to-Machine Injected Packet (JSON-LD / Industrial SCADA Object):
                  </span>
                  <span className="text-[10px] font-mono text-accent">Zero-Loss Optical Isolation Simulated</span>
                </div>
                <pre className="p-3 rounded-lg bg-secondary/30 border border-border text-accent font-mono text-[11px] overflow-x-auto leading-relaxed">
                  {JSON.stringify(selectedTarget.payload_preview, null, 2)}
                </pre>
              </div>
            </CardBody>
          </BentoCard>

          {/* Radical Transparency & Cautionary Tale Column */}
          <BentoCard className="flex flex-col">
            <CardHeader
              icon={Info}
              title="Transparency & Safety Guardrails"
            />
            <CardBody className="p-4 flex-1 flex flex-col justify-between space-y-4 text-xs">
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-amber-500/8 border border-amber-500/20 text-amber-700 dark:text-amber-300">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <AlertTriangle size={14} />
                    The "One Concern" Cautionary Tale
                  </div>
                  <p className="text-[11.5px] leading-relaxed opacity-90">
                    In early AI disaster-tech, companies like <em>One Concern</em> faced public scandal and municipal backlash by claiming unverified black-box flood models could directly command municipal decisions without transparent calibration.
                  </p>
                </div>

                <div className="space-y-2 text-ink-dim text-[11px] leading-relaxed">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="text-accent shrink-0 mt-0.5" />
                    <span><strong>Transparent Standards:</strong> We output open industrial formats (IEC 60870-5-104 &amp; MQTT) instead of black boxes.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="text-accent shrink-0 mt-0.5" />
                    <span><strong>Human-in-the-Loop (HITL):</strong> A mandatory 60s override window gives engineers final veto power.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="text-accent shrink-0 mt-0.5" />
                    <span><strong>Air-Gap Ready:</strong> Production deployment requires a unidirectional hardware Data Diode to protect municipal SCADA from cyber compromise.</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-secondary/40 border border-border text-[10.5px] font-mono text-ink-faint">
                ⚡ Tier: {data?.transparency_framework.tier || "SIMULATED SCADA / WEBHOOK READY"}
              </div>
            </CardBody>
          </BentoCard>
        </motion.div>
      )}

      {/* Live SCADA Protocol Audit Terminal */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
      >
        <BentoCard>
          <CardHeader
            icon={Terminal}
            title="Live SCADA Protocol Audit Stream & Telemetry Terminal"
            right={
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-[10px] font-mono text-accent font-bold">LIVE SCADA STREAM</span>
              </div>
            }
          />
          <CardBody className="p-4 space-y-3">
            <div className="p-3.5 rounded-lg bg-secondary/30 border border-border font-mono text-xs space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
              {scadaLogs.map((log) => (
                <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2.5 rounded-lg bg-secondary/40 border border-border/60 hover:bg-secondary/60 transition-all">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-ink-faint text-[10px] font-mono">{log.time}</span>
                    <span className="px-2 py-0.5 rounded-md bg-accent/12 text-accent text-[10.5px] font-bold border border-accent/25">
                      {log.target}
                    </span>
                    <span className="text-accent text-[11px] font-mono">{log.frame}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10.5px] text-ink-faint shrink-0">
                    <span className="text-amber-600 dark:text-amber-400 font-bold font-mono">RTT: {log.latency} ms</span>
                    <span className="text-ink-faint font-mono text-[10px]">{log.hash}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </BentoCard>
      </motion.div>
    </div>
  );
}
