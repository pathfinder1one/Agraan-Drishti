import { Satellite, CircleDot } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";

export function SatellitePanel() {
  return (
    <Card className="flex flex-col">
      <CardHeader icon={Satellite} title="Satellite INSAT-3D" />
      <CardBody className="flex-1 flex flex-col">
        <div
          className="flex-1 min-h-[140px] rounded-lg mb-2 relative overflow-hidden"
          style={{
            background:
              "radial-gradient(circle at 50% 45%, #fff 0%, #60a5fa 15%, #1d4ed8 35%, #f59e0b 60%, #7c2d12 85%)",
          }}
        >
          <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-risk-low">
            <CircleDot size={9} /> Live
          </span>
        </div>
        <div className="text-[11px] text-ink-faint">Channel IR 10.8 μm · 10:20 AM IST</div>
      </CardBody>
    </Card>
  );
}
