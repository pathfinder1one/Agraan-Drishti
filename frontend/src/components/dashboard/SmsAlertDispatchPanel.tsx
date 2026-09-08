import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { BentoCard, CardHeader, CardBody } from "@/components/ui/card";
import { apiFetch, apiFetchAuth } from "../../config/api";

interface SmsAlertDispatchPanelProps {
  locationName: string;
  selectedCell?: { lat: number; lon: number } | null;
  activeLayer: string;
  maxRisks: Record<string, number>;
  currentUser?: any;
  onOpenRegister?: () => void;
}

export function SmsAlertDispatchPanel({
  locationName,
  selectedCell,
  activeLayer,
  maxRisks,
  currentUser,
  onOpenRegister
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
      const res = await apiFetch(`/api/alerts/affected-users?lat=${lat}&lon=${lon}&radius_km=${radiusKm}`);
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
      const res = await apiFetch("/api/alerts/sms-logs?limit=8");
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
      const res = await apiFetchAuth("/api/alerts/send-sms", {
        method: "POST",
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

  const infoCards = [
    { label: "Disaster Event", value: activeLayer, color: "text-ink" },
    { label: "Risk / Severity", value: `${severity} (${riskPct}%)`, badge: true },
    { label: "Target Location", value: locationName, color: "text-ink" },
    { label: "Affected Citizens", value: isLoadingUsers ? "Querying..." : `${affectedUsers.length} in ${radiusKm}km`, icon: Users },
  ];

  return (
    <BentoCard className="p-4 sm:p-5 space-y-4">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-soft/70 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/12 border border-accent/25 flex items-center justify-center text-accent">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-ink tracking-wide flex items-center gap-2">
              ACTIVE DISASTER ALERT — EMERGENCY SMS GATEWAY
            </h3>
            <p className="text-[11px] text-ink-faint font-mono">Location-Aware Twilio / Domestic Gateway Dispatch</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/25 text-accent text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Subscriber: <strong>{currentUser.name}</strong> ({currentUser.phone_number})</span>
            </div>
          ) : (
            onOpenRegister && (
              <button
                type="button"
                onClick={onOpenRegister}
                className="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/90 text-accent-contrast text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                + Register Subscriber
              </button>
            )
          )}
        </div>
      </div>

      {/* Active Alert Information Box */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-secondary/30 p-3.5 rounded-lg border border-border">
        {infoCards.map((card) => (
          <div key={card.label}>
            <p className="text-[11px] text-ink-faint font-semibold uppercase tracking-wider">{card.label}</p>
            {card.badge ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-xs px-2 py-0.5 rounded-md font-black border ${
                  severity === "CRITICAL" ? "bg-destructive/12 text-destructive border-destructive/25" : "bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/25"
                }`}>
                  {card.value}
                </span>
              </div>
            ) : (
              <p className={`text-sm font-bold mt-0.5 truncate ${card.icon ? "text-accent flex items-center gap-1" : "text-ink"}`}>
                {card.icon && <card.icon className="w-3.5 h-3.5" />}
                {card.value}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Controls & Radius Slider */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-secondary/30 p-3 rounded-lg border border-border">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-bold text-ink-dim shrink-0">Affected Radius:</label>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-32 sm:w-44 accent-[#246b38] cursor-pointer"
          />
          <span className="text-xs font-mono text-accent font-bold">{radiusKm} km</span>
        </div>

        <button
          onClick={fetchAffectedUsers}
          className="text-xs text-ink-faint hover:text-ink flex items-center gap-1 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? "animate-spin" : ""}`} />
          <span>Refresh Zone</span>
        </button>
      </div>

      {/* Affected Registered Users Preview List */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-bold text-ink-faint uppercase tracking-wider flex items-center justify-between">
          <span>Registered Citizens in Active Blast Zone</span>
          <span className="font-mono text-[10px] text-ink-faint">Haversine Distance Filter</span>
        </p>

        {affectedUsers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
            {affectedUsers.map((u, i) => (
              <div key={i} className="p-2 rounded-lg bg-secondary/40 border border-border flex items-center justify-between text-xs">
                <div className="truncate mr-2">
                  <p className="font-bold text-ink truncate">{u.name}</p>
                  <p className="text-[10px] text-ink-faint font-mono">{u.phone_number}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent/12 text-accent font-mono font-bold border border-accent/20">
                    {u.distance_km ?? "0.0"} km
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 text-center text-xs text-ink-faint bg-secondary/30 rounded-lg border border-dashed border-border">
            No registered subscribers within {radiusKm} km. (Default test numbers will be targeted during demonstration).
          </div>
        )}
      </div>

      {/* Action Dispatch Button */}
      <div className="pt-2 border-t border-border-soft/70 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-ink-faint flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-accent animate-pulse" />
          <span>Live gateway armed: Operator confirmation required.</span>
        </div>

        <button
          onClick={handleSendSms}
          disabled={isSending}
          className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-white text-xs font-black tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
      <AnimatePresence>
        {receipt && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 p-3.5 rounded-lg bg-accent/8 border border-accent/25 text-xs space-y-2 font-mono"
          >
            <div className="flex items-center justify-between text-accent font-bold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> SMS DISPATCH CONFIRMED (ALERT #{receipt.alert_id})
              </span>
              <span className="text-[11px] text-ink-dim">{new Date(receipt.dispatched_at).toLocaleTimeString()}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
              <div className="bg-secondary/40 p-1.5 rounded-lg border border-border">
                <p className="text-ink-faint">Targeted</p>
                <p className="text-ink font-bold">{receipt.total_targeted}</p>
              </div>
              <div className="bg-secondary/40 p-1.5 rounded-lg border border-border">
                <p className="text-ink-faint">Sent</p>
                <p className="text-accent font-bold">{receipt.sent}</p>
              </div>
              <div className="bg-secondary/40 p-1.5 rounded-lg border border-border">
                <p className="text-ink-faint">Delivered</p>
                <p className="text-accent font-bold">{receipt.delivered}</p>
              </div>
            </div>
            <p className="text-[11px] text-ink-dim pt-1 leading-relaxed border-t border-accent/20">
              <strong>Delivered Message:</strong> {receipt.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Delivery Audit Log */}
      {recentLogs.length > 0 && (
        <div className="pt-2 border-t border-border-soft/70 space-y-1.5">
          <p className="text-[10px] font-bold text-ink-faint uppercase tracking-wider font-mono">
            Recent Gateway Transmission Audit
          </p>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {recentLogs.slice(0, 4).map((log, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px] font-mono px-2 py-1 rounded-lg bg-secondary/30 text-ink-dim border border-border/40">
                <span className="truncate mr-2">{log.phone_number}</span>
                <span className="text-ink-faint shrink-0">{log.provider_message_id?.slice(0, 14)}...</span>
                <span className="px-1.5 py-0.2 rounded-md bg-accent/12 text-accent font-bold text-[9.5px] border border-accent/20">
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </BentoCard>
  );
}
