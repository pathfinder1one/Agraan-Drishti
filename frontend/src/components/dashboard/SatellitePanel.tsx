import { useEffect, useState } from "react";
import { Satellite, CircleDot, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";

interface SatelliteStatus {
  status?: string;
  source?: string;
  pipeline?: string;
  connection_status?: string;
  ingested?: boolean;
  model_weights_loaded?: boolean;
  last_tensor?: { max?: number; min?: number; shape?: number[] } | null;
  poll_minutes?: number;
  last_update_utc?: string | null;
  inference_last_run_utc?: string | null;
}

interface SatellitePanelProps {
  status?: SatelliteStatus | null;
  monitoredLocation?: { lat: number; lon: number } | null;
  loading?: boolean;
  onRefresh?: () => void;
  onOpenDashboard?: () => void;
  maxRisks?: Record<string, number>;
}

export function SatellitePanel({
  status,
  monitoredLocation,
  loading = false,
  onRefresh,
  onOpenDashboard,
}: SatellitePanelProps) {
  const connected = status?.ingested === true;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const pollMinutes = status?.poll_minutes ?? 180;
  const pollMilliseconds = pollMinutes * 60 * 1000;
  const lastUpdate = status?.last_update_utc
    ? new Date(status.last_update_utc).getTime()
    : null;
  const remainingSeconds = lastUpdate
    ? Math.max(0, Math.ceil((lastUpdate + pollMilliseconds - now) / 1000))
    : null;
  const lastUpdateLabel = status?.last_update_utc
    ? new Date(status.last_update_utc).toLocaleTimeString()
    : "pending";
  const countdownLabel =
    remainingSeconds === null
      ? "waiting"
      : `${Math.floor(remainingSeconds / 60)}m ${String(remainingSeconds % 60).padStart(2, "0")}s`;

  return (
    <Card className="flex flex-col">
      <CardHeader
        icon={Satellite}
        title={
          status?.source?.startsWith("eumetsat")
            ? "Satellite Meteosat-9"
            : "Satellite INSAT-3D"
        }
        right={
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[10px] text-ink-dim hover:text-ink disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={10} className={loading ? "animate-spin text-accent" : ""} />
            {loading ? "Syncing" : "Refresh"}
          </button>
        }
      />
      <CardBody className="flex-1 flex flex-col">
        <button
          type="button"
          onClick={onOpenDashboard}
          title="Open India state-wise satellite risk dashboard"
          className="flex-1 min-h-[140px] rounded-lg mb-2 relative overflow-hidden text-left cursor-pointer ring-offset-2 ring-offset-panel focus:outline-none focus:ring-2 focus:ring-blue-400"
          style={{
            backgroundImage: status?.last_update_utc
              ? `url(http://127.0.0.1:8000/api/satellite/image?center_lat=${monitoredLocation?.lat ?? 30.73}&center_lon=${monitoredLocation?.lon ?? 79.06}&crop=true&updated=${encodeURIComponent(status.last_update_utc)})`
              : "radial-gradient(circle at 50% 45%, #fff 0%, #60a5fa 15%, #1d4ed8 35%, #f59e0b 60%, #7c2d12 85%)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundColor: "#1d4ed8",
          }}
        >
          <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-risk-low">
            <CircleDot size={9} /> {connected ? "Ingested" : "Not ingested"}
          </span>
          <span className="absolute left-1.5 bottom-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/90">Open state dashboard</span>
        </button>
        <div className="text-[11px] text-ink-faint">
          Channel IR 10.8 μm · Updated {lastUpdateLabel}
        </div>
        <div className="mt-1 text-[10px] text-ink-faint">
          {status?.model_weights_loaded
            ? "SevereWeatherNet: active"
            : "SevereWeatherNet: fallback"}
          {status?.last_tensor?.max !== undefined &&
            ` · signal max ${status.last_tensor.max}`}
        </div>
        <div className="mt-1 text-[10px] text-ink-faint">
          Update cycle: every {pollMinutes} min · Source:{" "}
          {status?.source ?? "unavailable"}
        </div>
        <div className="mt-1 text-[10px] text-emerald-400">
          Next automatic update: {countdownLabel}
        </div>
        <div className="mt-1 text-[10px] text-ink-faint">
          Last inference:{" "}
          {status?.inference_last_run_utc
            ? new Date(status.inference_last_run_utc).toLocaleTimeString()
            : "pending"}
        </div>
      </CardBody>
    </Card>
  );
}
