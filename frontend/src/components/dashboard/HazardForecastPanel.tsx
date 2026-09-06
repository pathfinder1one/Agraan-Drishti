import { useState, useEffect } from "react";
import { 
  TriangleAlert, 
  ShieldAlert, 
  CheckCircle2, 
  AlertOctagon, 
  Info, 
  ChevronRight, 
  User, 
  Truck, 
  Sprout,
  Waves,
  CloudLightning,
  CloudRain,
  Milestone
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge, LEVEL_COLOR, levelFromLabel } from "@/components/ui/badge";

const HAZARD_DEFS = [
  { key: "flash_flood", name: "Flash Flood", icon: Waves },
  { key: "cloudburst", name: "Cloudburst", icon: CloudLightning },
  { key: "thunderstorm", name: "Thunderstorm", icon: TriangleAlert },
  { key: "heavy_rainfall", name: "Heavy Rainfall", icon: CloudRain },
  { key: "landslide", name: "Landslide", icon: Milestone },
  { key: "river_overflow", name: "River Overflow", icon: Waves },
];

interface HazardForecastPanelProps {
  maxRisks: Record<string, number>;
  selectedCell?: { lat: number; lon: number } | null;
  monitoredLocation?: { lat: number; lon: number } | null;
  forecastHour?: number;
}

export function HazardForecastPanel({ maxRisks, selectedCell, monitoredLocation, forecastHour = 2 }: HazardForecastPanelProps) {
  const [activeTab, setActiveTab] = useState<"probability" | "tiers">("probability");
  const [intelligence, setIntelligence] = useState<any>(null);
  const [activeRole, setActiveRole] = useState<"citizen" | "responder" | "farmer">("citizen");

  const lat = selectedCell?.lat ?? monitoredLocation?.lat ?? 30.73;
  const lon = selectedCell?.lon ?? monitoredLocation?.lon ?? 79.06;

  // Fetch Confidence-Graded Tiers & Reliability data
  useEffect(() => {
    fetch(`http://localhost:8000/api/hazard-intelligence?lat=${lat}&lon=${lon}&forecast_hour=${forecastHour}`)
      .then(res => res.json())
      .then(data => setIntelligence(data))
      .catch(() => {});
  }, [lat, lon, forecastHour, maxRisks]);

  const dynamicForecast = HAZARD_DEFS.map((h) => {
    let riskVal = 0;
    if (maxRisks && maxRisks[h.key] !== undefined) {
      riskVal = Math.round(maxRisks[h.key] * 100);
    } else if (h.key === "heavy_rainfall") {
      const cb = maxRisks?.cloudburst ?? 0.05;
      const ff = maxRisks?.flash_flood ?? 0.05;
      riskVal = Math.round((cb * 0.7 + ff * 0.3) * 100);
    } else if (h.key === "landslide") {
      const ff = maxRisks?.flash_flood ?? 0.05;
      const cb = maxRisks?.cloudburst ?? 0.05;
      riskVal = Math.round((ff * 0.7 + cb * 0.3) * 100);
    } else if (h.key === "river_overflow") {
      const ff = maxRisks?.flash_flood ?? 0.05;
      riskVal = Math.round(ff * 0.85 * 100);
    }
    riskVal = Math.min(99, Math.max(5, riskVal));
    
    let level = "Low";
    if (riskVal > 80) level = "Severe";
    else if (riskVal > 55) level = "High";
    else if (riskVal > 25) level = "Moderate";

    return {
      ...h,
      value: riskVal,
      level,
      tier: riskVal > 80 ? "EMERGENCY" : (riskVal > 55 ? "WARNING" : (riskVal > 25 ? "WATCH" : "NORMAL"))
    };
  }).sort((a, b) => b.value - a.value);

  const chartData = dynamicForecast.map((h) => ({
    name: h.name,
    value: h.value,
    color: LEVEL_COLOR[levelFromLabel(h.level)],
  }));

  const tiersData = intelligence?.confidence_tiers || {
    flash_flood: { tier: "EMERGENCY", confidence_percent: 94.2, probability: 0.88, actions: { citizen: "Evacuate to higher ground immediately.", responder: "Deploy boat rescue teams.", farmer: "Unhitch livestock." } },
    cloudburst: { tier: "WARNING", confidence_percent: 86.5, probability: 0.76, actions: { citizen: "Stay away from natural drains and nullahs.", responder: "Standby SDRF unit.", farmer: "Clear field channels." } },
    thunderstorm: { tier: "WATCH", confidence_percent: 81.0, probability: 0.54, actions: { citizen: "Avoid shelter under isolated tall trees.", responder: "Monitor convective radar.", farmer: "Cease tractor work." } }
  };

  const reliability = intelligence?.forecast_reliability || {
    score: 0.92,
    bust_risk: "LOW",
    stability_status: "STABLE_PERSISTENT",
    reasoning: "Triple convergence of CAPE, moisture flux & INSAT-3DR CTT confirms genuine storm cell."
  };

  return (
    <Card>
      <CardHeader
        icon={TriangleAlert}
        title="Hazard Forecast"
        right={
          <div className="flex items-center gap-1 bg-panel-alt p-0.5 rounded-lg border border-border text-[10px] shrink-0">
            <button 
              onClick={() => setActiveTab("probability")}
              className={`px-2 py-0.5 rounded font-medium transition-all ${activeTab === "probability" ? "bg-blue-600 text-white" : "text-ink-faint hover:text-ink"}`}
            >
              Probabilities
            </button>
            <button 
              onClick={() => setActiveTab("tiers")}
              className={`px-2 py-0.5 rounded font-medium transition-all ${activeTab === "tiers" ? "bg-blue-600 text-white" : "text-ink-faint hover:text-ink"}`}
            >
              Tiers
            </button>
          </div>
        }
      />
      
      <CardBody className="space-y-3">
        {/* Self-Aware Forecast Reliability & Bust Detection Status */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-panel-alt border border-border text-[10.5px]">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${reliability.bust_risk === "LOW" ? "bg-emerald-400" : "bg-amber-400"} animate-pulse`} />
            <span className="text-ink-dim">Forecast Reliability:</span>
            <span className="font-bold text-ink">{(reliability.score * 100).toFixed(0)}%</span>
            <span className="text-emerald-400 font-mono text-[9.5px]">[{reliability.stability_status}]</span>
          </div>
          <span className="text-[9.5px] text-ink-faint">Bust Risk: <strong>{reliability.bust_risk}</strong></span>
        </div>

        {activeTab === "probability" ? (
          <>
            {dynamicForecast.map((h) => {
              const Icon = h.icon;
              const color = LEVEL_COLOR[levelFromLabel(h.level)];
              return (
                <div key={h.name} className="flex items-center gap-2">
                  <Icon size={14} style={{ color }} className="shrink-0" />
                  <span className="flex-1 text-[12px] truncate">{h.name}</span>
                  <div className="w-14 h-1.5 rounded-full overflow-hidden bg-border-soft">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${h.value}%`, background: color }}
                    />
                  </div>
                  <span className="text-[11px] w-8 text-right text-ink-dim font-mono">{h.value}%</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    h.tier === "EMERGENCY" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                    h.tier === "WARNING" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                    h.tier === "WATCH" ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" :
                    "bg-slate-500/20 text-slate-300"
                  }`}>
                    {h.tier}
                  </span>
                </div>
              );
            })}

            <div className="h-28 pt-1 -mx-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={76}
                    tick={{ fill: "#8b95ab", fontSize: 9.5 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={{
                      background: "#0f1420",
                      border: "1px solid #1c2434",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                    labelStyle={{ color: "#e7ebf3" }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={8}>
                    {chartData.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          /* CONFIDENCE-GRADED ALERT TIERS & ROLE-BASED ACTION PROTOCOLS */
          <div className="space-y-2.5">
            {/* Role Switcher */}
            <div className="flex gap-1 border-b border-border pb-1.5 text-[11px]">
              <button 
                onClick={() => setActiveRole("citizen")}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${activeRole === "citizen" ? "bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30" : "text-ink-dim hover:text-white"}`}
              >
                <User size={12} /> Citizen Advisory
              </button>
              <button 
                onClick={() => setActiveRole("responder")}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${activeRole === "responder" ? "bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30" : "text-ink-dim hover:text-white"}`}
              >
                <Truck size={12} /> NDRF / SDRF SOP
              </button>
              <button 
                onClick={() => setActiveRole("farmer")}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${activeRole === "farmer" ? "bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30" : "text-ink-dim hover:text-white"}`}
              >
                <Sprout size={12} /> Farmer Advisory
              </button>
            </div>

            {/* Tier Breakdown Cards */}
            <div className="space-y-2">
              {Object.entries(tiersData).map(([key, data]: [string, any]) => {
                const isEmergency = data.tier === "EMERGENCY";
                const isWarning = data.tier === "WARNING";
                const borderCol = isEmergency ? "border-red-500/40 bg-red-500/5" : (isWarning ? "border-amber-500/40 bg-amber-500/5" : "border-border bg-panel-alt");
                const badgeCol = isEmergency ? "bg-red-500 text-white" : (isWarning ? "bg-amber-500 text-black font-bold" : "bg-blue-500 text-white");

                return (
                  <div key={key} className={`p-2.5 rounded-lg border ${borderCol} space-y-1.5`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold text-ink capitalize">{key.replace('_', ' ')}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-ink-dim">Confidence: <strong>{data.confidence_percent}%</strong></span>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase ${badgeCol}`}>
                          {data.tier}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-ink-dim leading-tight">
                      <strong>Action Protocol:</strong> {data.actions ? data.actions[activeRole] : "Follow local civil defense instructions."}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
