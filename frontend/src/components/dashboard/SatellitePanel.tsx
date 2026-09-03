import { Satellite, CircleDot, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";

interface SatelliteStatus {
  status?: string;
  source?: string;
  connection_status?: string;
  ingested?: boolean;
  model_weights_loaded?: boolean;
  last_tensor?: { max?: number; min?: number; shape?: number[] } | null;
}

interface SatellitePanelProps {
  status?: SatelliteStatus | null;
  loading?: boolean;
  onRefresh?: () => void;
}

export function SatellitePanel({ status, loading = false, onRefresh }: SatellitePanelProps) {
  const connected = status?.ingested === true;
  return (
    <Card className="flex flex-col">
      <CardHeader
        icon={Satellite}
        title="Satellite INSAT-3D"
        right={
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] text-ink-dim hover:text-ink disabled:opacity-50"
          >
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
            {loading ? "Updating" : "Refresh"}
          </button>
        }
      />
      <CardBody className="flex-1 flex flex-col">
        <div
          className="flex-1 min-h-[140px] rounded-lg mb-2 relative overflow-hidden"
          style={{
            background:
              "radial-gradient(circle at 50% 45%, #fff 0%, #60a5fa 15%, #1d4ed8 35%, #f59e0b 60%, #7c2d12 85%)",
          }}
        >
          <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-risk-low">
            <CircleDot size={9} /> {connected ? "Ingested" : "Not ingested"}
          </span>
        </div>
        <div className="text-[11px] text-ink-faint">Channel IR 10.8 μm · 10:20 AM IST</div>
        <div className="mt-1 text-[10px] text-ink-faint">
          {status?.model_weights_loaded ? "SevereWeatherNet: active" : "SevereWeatherNet: fallback"}
          {status?.last_tensor?.max !== undefined && ` · signal max ${status.last_tensor.max}`}
        </div>
      </CardBody>
    </Card>
  );
}
