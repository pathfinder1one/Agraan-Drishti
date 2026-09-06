import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MapPin, Satellite, ShieldAlert } from "lucide-react";

type StateRisk = {
  state: string; lat: number; lon: number; level: string; overall_risk: number;
  flash_flood: number; cloudburst: number; thunderstorm: number;
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

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/state-risk-summary")
      .then((response) => response.json())
      .then((data) => setStates(data.states || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const topRisk = states[0];
  const levelClass: Record<string, string> = {
    extreme: "border-red-500/50 bg-red-500/10 text-red-300",
    severe: "border-red-500/50 bg-red-500/10 text-red-300",
    high: "border-orange-400/50 bg-orange-500/10 text-orange-300",
    moderate: "border-yellow-400/50 bg-yellow-500/10 text-yellow-200",
    low: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
  };
  const selected = useMemo(
    () => states.find((item) => selectedState && selectedState.includes(item.state)),
    [selectedState, states],
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/50 to-panel p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-500/15 p-3 text-blue-300"><Satellite size={24} /></div>
          <div>
            <h2 className="text-lg font-extrabold text-ink">India Satellite State Intelligence</h2>
            <p className="text-xs text-ink-dim">Live Meteosat-9 model risk at a reference location in every State/UT.</p>
          </div>
        </div>
        <button onClick={onBack} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold text-ink-dim hover:text-ink">
          <ArrowLeft size={14} /> Back to dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-border bg-panel p-4">
          <p className="text-[11px] uppercase tracking-wider text-ink-faint font-bold">Search-linked satellite focus</p>
          <div className="mt-2 flex items-center gap-2 text-ink font-bold"><MapPin size={16} className="text-blue-400" /> {selectedLocationName}</div>
          <p className="mt-2 text-xs text-ink-dim">Searching any Indian city updates the satellite crop and map. Click a State/UT card below to focus the command dashboard there.</p>
        </div>
        <div className={`rounded-xl border p-4 transition-all ${
          (topRisk?.overall_risk || 0) >= 70 
            ? "border-red-500/40 bg-red-500/10 text-red-300"
            : (topRisk?.overall_risk || 0) >= 45
            ? "border-orange-500/40 bg-orange-500/10 text-orange-300"
            : (topRisk?.overall_risk || 0) >= 20
            ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-300"
            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
        }`}>
          <p className="text-[11px] uppercase tracking-wider font-bold opacity-80">
            {(topRisk?.overall_risk || 0) >= 70 ? "Critical State Warning" : ((topRisk?.overall_risk || 0) >= 45 ? "Active Regional Convective Zone" : ((topRisk?.overall_risk || 0) >= 20 ? "Highest Current State Signal" : "Subcontinent Baseline Status"))}
          </p>
          <div className="mt-2 flex items-center gap-2 font-extrabold text-ink">
            <ShieldAlert size={17} className={
              (topRisk?.overall_risk || 0) >= 70 ? "text-red-400" : ((topRisk?.overall_risk || 0) >= 45 ? "text-orange-400" : ((topRisk?.overall_risk || 0) >= 20 ? "text-yellow-400" : "text-emerald-400"))
            } /> 
            {topRisk?.state ?? "Loading..."}
          </div>
          <p className="mt-1 text-sm font-semibold opacity-90">
            {topRisk ? `${topRisk.overall_risk}% model risk · ${topRisk.level?.toUpperCase()}` : ""}
          </p>
        </div>
      </div>

      {loading ? <div className="text-sm text-ink-dim">Loading live state risk summary...</div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
          {states.map((item) => {
            const isSelected = selected?.state === item.state;
            return <button key={item.state} onClick={() => onSelectState(item)} className={`rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-400 ${levelClass[item.level] || levelClass.low} ${isSelected ? "ring-2 ring-blue-400" : ""}`}>
              <div className="flex justify-between gap-2"><span className="font-bold text-sm">{item.state}</span><span className="text-[10px] uppercase font-black">{item.level}</span></div>
              <div className="mt-3 text-2xl font-black">{item.overall_risk}%</div>
              <div className="mt-2 grid grid-cols-3 gap-1 text-[9px] text-ink-dim">
                <span>Flood<br/><b>{item.flash_flood}%</b></span><span>Cloudburst<br/><b>{item.cloudburst}%</b></span><span>Storm<br/><b>{item.thunderstorm}%</b></span>
              </div>
            </button>;
          })}
        </div>
      )}
    </div>
  );
}
