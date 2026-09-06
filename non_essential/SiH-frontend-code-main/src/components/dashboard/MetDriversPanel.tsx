import { Wind, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { MET_DRIVERS } from "@/data/mockData";

export function MetDriversPanel() {
  return (
    <Card>
      <CardHeader icon={Wind} title="Key meteorological drivers" />
      <CardBody className="space-y-2.5">
        {MET_DRIVERS.map((d) => (
          <div key={d.label} className="flex items-center justify-between text-[11.5px]">
            <span className="text-ink-dim">{d.label}</span>
            <span className="flex items-center gap-1 font-semibold">
              {d.value}
              {d.trend === "up" && <ArrowUpRight size={12} className="text-risk-extreme" />}
              {d.trend === "down" && <ArrowDownRight size={12} className="text-risk-low" />}
              {d.trend === "flat" && <Minus size={12} className="text-ink-faint" />}
            </span>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
