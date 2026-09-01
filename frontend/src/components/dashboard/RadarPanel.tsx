import { Radar as RadarIcon, CircleDot } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";

const SCALE = ["#0ea5e9", "#22c55e", "#eab308", "#f59e0b", "#ef4444"];

export function RadarPanel() {
  return (
    <Card className="flex flex-col">
      <CardHeader icon={RadarIcon} title="Radar reflectivity" right={<span className="text-[10px] text-ink-faint">dBZ</span>} />
      <CardBody className="flex-1 flex flex-col">
        <div className="flex-1 flex gap-2 min-h-[140px]">
          <div
            className="flex-1 rounded-lg relative overflow-hidden"
            style={{
              background:
                "radial-gradient(circle at 45% 50%, #ef4444 0%, #f59e0b 25%, #22c55e 50%, #0ea5e9 75%, transparent 90%)",
            }}
          >
            <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-risk-low">
              <CircleDot size={9} /> Live
            </span>
          </div>
          <div className="w-3 rounded-full overflow-hidden flex flex-col-reverse">
            {SCALE.map((c) => (
              <div key={c} className="flex-1" style={{ background: c }} />
            ))}
          </div>
        </div>
        <div className="text-[11px] mt-2 text-ink-faint">10:18 AM IST</div>
      </CardBody>
    </Card>
  );
}
