import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Satellite, ShieldAlert, Search } from "lucide-react";
import { BentoCard, CardHeader, CardBody } from "@/components/ui/card";

type StateRisk = {
  state: string; lat: number; lon: number; level: string; overall_risk: number;
  flash_flood: number; cloudburst: number; thunderstorm: number;
};

/* ─── Animation presets ─── */
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03 } },
};
const fadeSlideUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export function SatelliteStateDashboard({
  onBack, onSelectState, selectedLocationName, selectedState,
}: {
  onBack: () => void;
  onSelectState: (state: StateRisk) => void;
  selectedLocationName: string;
  selectedState?: string;
}) {
  const [states, setStates] = useState<StateRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/state-risk-summary")
      .then((response) => response.json())
      .then((data) => setStates(data.states || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const topRisk = states[0];
  const levelClass: Record<string, string> = {
    extreme: "border-destructive/40 bg-destructive/8 text-destructive",
    severe: "border-destructive/40 bg-destructive/8 text-destructive",
    high: "border-amber-500/40 bg-amber-500/8 text-amber-600 dark:text-amber-400",
    moderate: "border-yellow-500/40 bg-yellow-500/8 text-yellow-600 dark:text-yellow-300",
    low: "border-accent/30 bg-accent/8 text-accent",
  };
  const selected = useMemo(
    () => states.find((item) => selectedState && selectedState.includes(item.state)),
    [selectedState, states],
  );

  const filteredStates = searchQuery.trim()
    ? states.filter((s) => s.state.toLowerCase().includes(searchQuery.toLowerCase()))
    : states;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 max-w-[1920px] mx-auto w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[0.66rem] border border-accent/20 bg-panel p-4 shadow-xs"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent/12 p-2.5 text-accent border border-accent/25"><Satellite size={22} /></div>
          <div>
            <h2 className="text-lg font-extrabold text-ink">India Satellite State Intelligence</h2>
            <p className="text-xs text-ink-dim">Live Meteosat-9 model risk at a reference location in every State/UT.</p>
          </div>
        </div>
        <button onClick={onBack} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold text-ink-dim hover:text-ink transition-colors cursor-pointer">
          <ArrowLeft size={14} /> Back to dashboard
        </button>
      </motion.div>

      {/* Info + Top Risk cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <BentoCard className="lg:col-span-2 p-4">
          <p className="text-[11px] uppercase tracking-wider text-ink-faint font-bold">Search-linked satellite focus</p>
          <div className="mt-2 flex items-center gap-2 text-ink font-bold"><MapPin size={16} className="text-accent" /> {selectedLocationName}</div>
          <p className="mt-2 text-xs text-ink-dim">Searching any Indian city updates the satellite crop and map. Click a State/UT card below to focus the command dashboard there.</p>
          {/* Search Input */}
          <div className="mt-3 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any State or UT..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-secondary/40 border border-border text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-accent/40 transition-all"
            />
          </div>
        </BentoCard>
        <BentoCard
          glowBorder={(topRisk?.overall_risk || 0) >= 70 ? "danger" : (topRisk?.overall_risk || 0) >= 45 ? "amber" : "accent"}
          className={`p-4 transition-all ${
            (topRisk?.overall_risk || 0) >= 70 
              ? "text-destructive"
              : (topRisk?.overall_risk || 0) >= 45
              ? "text-amber-600 dark:text-amber-400"
              : "text-accent"
          }`}
        >
          <p className="text-[11px] uppercase tracking-wider font-bold opacity-80">
            {(topRisk?.overall_risk || 0) >= 70 ? "Critical State Warning" : ((topRisk?.overall_risk || 0) >= 45 ? "Active Regional Convective Zone" : ((topRisk?.overall_risk || 0) >= 20 ? "Highest Current State Signal" : "Subcontinent Baseline Status"))}
          </p>
          <div className="mt-2 flex items-center gap-2 font-extrabold text-ink">
            <ShieldAlert size={17} className={
              (topRisk?.overall_risk || 0) >= 70 ? "text-destructive" : ((topRisk?.overall_risk || 0) >= 45 ? "text-amber-500" : "text-accent")
            } /> 
            {topRisk?.state ?? "Loading..."}
          </div>
          <p className="mt-1 text-sm font-semibold opacity-90">
            {topRisk ? `${topRisk.overall_risk}% model risk · ${topRisk.level?.toUpperCase()}` : ""}
          </p>
        </BentoCard>
      </div>

      {/* State Grid */}
      {loading ? <div className="text-sm text-ink-dim">Loading live state risk summary...</div> : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
          {filteredStates.map((item) => {
            const isSelected = selected?.state === item.state;
            return (
              <motion.div key={item.state} variants={fadeSlideUp}>
                <BentoCard
                  onClick={() => onSelectState(item)}
                  glowBorder={isSelected ? "accent" : "none"}
                  className={`p-4 text-left cursor-pointer ${levelClass[item.level] || levelClass.low} ${isSelected ? "ring-1 ring-accent/50" : ""}`}
                  whileHover={{ y: -3, scale: 1.01 }}
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-bold text-sm text-ink">{item.state}</span>
                    <span className="text-[10px] uppercase font-black">{item.level}</span>
                  </div>
                  <div className="mt-3 text-2xl font-black font-mono">{item.overall_risk}%</div>
                  {/* Risk bar */}
                  <div className="mt-2 h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.overall_risk}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        item.overall_risk >= 70 ? "bg-destructive" : item.overall_risk >= 45 ? "bg-amber-500" : item.overall_risk >= 20 ? "bg-yellow-500" : "bg-accent"
                      }`}
                    />
                  </div>
                  <div className="mt-2.5 grid grid-cols-3 gap-1 text-[9.5px] text-ink-dim">
                    <span>Flood<br/><b>{item.flash_flood}%</b></span>
                    <span>Cloudburst<br/><b>{item.cloudburst}%</b></span>
                    <span>Storm<br/><b>{item.thunderstorm}%</b></span>
                  </div>
                </BentoCard>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
