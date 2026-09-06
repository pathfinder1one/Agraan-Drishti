import { useState, useEffect } from "react";
import { 
  Bell, 
  Send, 
  Users, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Radio, 
  Loader2, 
  FileText, 
  RefreshCw, 
  Smartphone, 
  ShieldCheck 
} from "lucide-react";

interface SmsAlertDispatchPanelProps {
  locationName: string;
  selectedCell?: { lat: number; lon: number } | null;
  activeLayer: string;
  maxRisks: Record<string, number>;
  currentUser?: any;
}

export function SmsAlertDispatchPanel({
  locationName,
  selectedCell,
  activeLayer,
  maxRisks,
  currentUser
}: SmsAlertDispatchPanelProps) {
  const lat = selectedCell?.lat || 30.28;
  const lon = selectedCell?.lon || 78.98;

  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [affectedUsers, setAffectedUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [customMsg, setCustomMsg] = useState<string>("");

  const riskVal = maxRisks[activeLayer.toLowerCase().replace(" ", "_")] || maxRisks.flash_flood || 0.88;
  const riskPct = Math.round(riskVal * 100);
  const severity = riskPct >= 85 ? "CRITICAL" : riskPct >= 65 ? "HIGH" : "MEDIUM";

  // Fetch affected registered users whenever coordinates or radius change
  const fetchAffectedUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch(`http://localhost:8000/api/alerts/affected-users?lat=${lat}&lon=${lon}&radius_km=${radiusKm}`);
      const data = await res.json();
      if (data.status === "success") {
        setAffectedUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to query affected users:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchRecentLogs = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/alerts/sms-logs?limit=8");
      const data = await res.json();
      if (data.status === "success") {
        setRecentLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to query SMS logs:", err);
    }
  };

  useEffect(() => {
    fetchAffectedUsers();
    fetchRecentLogs();
  }, [lat, lon, radiusKm]);

  const handleSendSms = async () => {
    setIsSending(true);
    try {
      const res = await fetch("http://localhost:8000/api/alerts/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disaster_type: activeLayer,
          risk_score: riskVal,
          latitude: lat,
          longitude: lon,
          affected_radius_km: radiusKm,
          location_name: locationName || "Monitored Sector",
          custom_message: customMsg.trim() || undefined
        })
      });
      const data = await res.json();
      if (data.status === "success" && data.receipt) {
        setReceipt(data.receipt);
        fetchRecentLogs();
      }
    } catch (err) {
      console.error("Emergency SMS dispatch failed:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-[#0f1420] border border-blue-500/30 rounded-2xl p-4 sm:p-5 text-white shadow-xl space-y-4">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-2">
              ACTIVE DISASTER ALERT — EMERGENCY SMS GATEWAY
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">Location-Aware Twilio / Domestic Gateway Dispatch</p>
          </div>
        </div>

        {currentUser && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Subscriber: <strong>{currentUser.name}</strong> ({currentUser.phone_number})</span>
          </div>
        )}
      </div>

      {/* Active Alert Information Box (As specified in section 13 of prompt) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/40 p-3.5 rounded-xl border border-white/10">
        <div>
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Disaster Event</p>
          <p className="text-sm font-extrabold text-white mt-0.5">{activeLayer}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Risk / Severity</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-xs px-2 py-0.5 rounded font-black ${
              severity === "CRITICAL" ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
            }`}>
              {severity} ({riskPct}%)
            </span>
          </div>
        </div>
        <div>
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Target Location</p>
          <p className="text-sm font-bold text-slate-200 mt-0.5 truncate">{locationName}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Affected Citizens</p>
          <p className="text-sm font-black text-blue-400 mt-0.5 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {isLoadingUsers ? "Querying..." : `${affectedUsers.length} in ${radiusKm}km`}
          </p>
        </div>
      </div>

      {/* Controls & Radius Slider */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-300 shrink-0">Affected Radius:</label>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-32 sm:w-44 accent-blue-500 cursor-pointer"
          />
          <span className="text-xs font-mono text-blue-400 font-bold">{radiusKm} km</span>
        </div>

        <button
          onClick={fetchAffectedUsers}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? "animate-spin" : ""}`} />
          <span>Refresh Zone</span>
        </button>
      </div>

      {/* Affected Registered Users Preview List */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Registered Citizens in Active Blast Zone</span>
          <span className="font-mono text-[10px] text-slate-400">Haversine Distance Filter</span>
        </p>

        {affectedUsers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
            {affectedUsers.map((u, i) => (
              <div key={i} className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                <div className="truncate mr-2">
                  <p className="font-bold text-slate-200 truncate">{u.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{u.phone_number}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold">
                    {u.distance_km ?? "0.0"} km
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 text-center text-xs text-slate-400 bg-white/5 rounded-lg border border-dashed border-white/10">
            No registered subscribers within {radiusKm} km. (Default test numbers will be targeted during demonstration).
          </div>
        )}
      </div>

      {/* Action Dispatch Button */}
      <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Live gateway armed: Operator confirmation required.</span>
        </div>

        <button
          onClick={handleSendSms}
          disabled={isSending}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black tracking-wide transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>DISPATCHING SMS BROADCAST...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>SEND EMERGENCY SMS NOW</span>
            </>
          )}
        </button>
      </div>

      {/* Live Dispatch Receipt Modal / Section */}
      {receipt && (
        <div className="mt-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2 font-mono">
          <div className="flex items-center justify-between text-emerald-400 font-bold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> SMS DISPATCH CONFIRMED (ALERT #{receipt.alert_id})
            </span>
            <span className="text-[11px] text-slate-300">{new Date(receipt.dispatched_at).toLocaleTimeString()}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
            <div className="bg-black/30 p-1.5 rounded">
              <p className="text-slate-400">Targeted</p>
              <p className="text-white font-bold">{receipt.total_targeted}</p>
            </div>
            <div className="bg-black/30 p-1.5 rounded">
              <p className="text-slate-400">Sent</p>
              <p className="text-emerald-400 font-bold">{receipt.sent}</p>
            </div>
            <div className="bg-black/30 p-1.5 rounded">
              <p className="text-slate-400">Delivered</p>
              <p className="text-emerald-300 font-bold">{receipt.delivered}</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-300 pt-1 leading-relaxed border-t border-emerald-500/20">
            <strong>Delivered Message:</strong> {receipt.message}
          </p>
        </div>
      )}

      {/* Recent Delivery Audit Log */}
      {recentLogs.length > 0 && (
        <div className="pt-2 border-t border-white/5 space-y-1.5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
            Recent Gateway Transmission Audit
          </p>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {recentLogs.slice(0, 4).map((log, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px] font-mono px-2 py-1 rounded bg-black/20 text-slate-300">
                <span className="truncate mr-2">{log.phone_number}</span>
                <span className="text-slate-500 shrink-0">{log.provider_message_id?.slice(0, 14)}...</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[9.5px]">
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
