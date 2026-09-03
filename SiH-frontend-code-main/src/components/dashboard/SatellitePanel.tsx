import { useState, useEffect } from "react";
import { Satellite, CircleDot } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";

export function SatellitePanel() {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/satellite/status")
      .then(res => res.json())
      .then(data => setStatus(data))
      .catch(err => console.error("Failed to fetch satellite status", err));
  }, []);

  const timeStr = status?.last_update_utc 
    ? new Date(status.last_update_utc).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute:'2-digit' }) 
    : "10:20 AM IST";

  return (
    <Card className="flex flex-col">
      <CardHeader icon={Satellite} title="Satellite INSAT-3DR" />
      <CardBody className="flex-1 flex flex-col">
        <div
          className="flex-1 min-h-[140px] rounded-lg mb-2 relative overflow-hidden bg-[#0b0f18]"
          style={{
            backgroundImage: "url('http://localhost:8000/api/satellite/image')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        >
          <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-risk-low">
            <CircleDot size={9} /> Live
          </span>
        </div>
        <div className="text-[11px] text-ink-faint flex justify-between">
          <span>Channel IR 10.8 μm</span>
          <span>{timeStr}</span>
        </div>
      </CardBody>
    </Card>
  );
}
