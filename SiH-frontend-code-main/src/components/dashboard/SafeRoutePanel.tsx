import { Navigation } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const LEGEND: [string, string][] = [
  ["Avoid", "#ef4444"],
  ["High risk", "#f59e0b"],
  ["Moderate risk", "#eab308"],
  ["Low risk (safer)", "#22c55e"],
];

export function SafeRoutePanel() {
  return (
    <Card className="flex flex-col">
      <CardHeader icon={Navigation} title="Safe route suggestion" />
      <CardBody className="flex-1 flex flex-col">
        <div className="h-32 rounded-lg mb-2 relative overflow-hidden bg-[#0d1420]">
          <svg viewBox="0 0 200 110" className="absolute inset-0 w-full h-full">
            <path
              d="M20,90 C60,70 90,40 180,20"
              fill="none"
              stroke="#22c55e"
              strokeWidth="3"
              strokeDasharray="6 4"
            />
            <circle cx="20" cy="90" r="5" fill="#3b82f6" />
            <circle cx="180" cy="20" r="5" fill="#ef4444" />
          </svg>
          <div className="absolute top-1.5 left-1.5 space-y-1 text-[9px] text-ink-dim">
            {LEGEND.map(([label, color]) => (
              <div key={label} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-between text-[11.5px] mb-2">
          <span className="text-ink-dim">Recommended route</span>
          <span className="font-semibold">A → B</span>
        </div>
        <div className="flex justify-between text-[11.5px] mb-2">
          <span className="text-ink-dim">ETA · Distance</span>
          <span className="font-semibold">45 min · 38 km</span>
        </div>
        <Button variant="success" size="sm" className="w-full mt-auto">
          View route details
        </Button>
      </CardBody>
    </Card>
  );
}
