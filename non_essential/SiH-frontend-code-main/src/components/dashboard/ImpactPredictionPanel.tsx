import { Droplets } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STATS: [string, string][] = [
  ["Affected area", "4.7 km²"],
  ["Water depth (est.)", "1.2 – 3.5 m"],
  ["People affected", "18,420"],
  ["Infrastructure impact", "High"],
];

export function ImpactPredictionPanel() {
  return (
    <Card className="flex flex-col">
      <CardHeader icon={Droplets} title="Impact prediction" />
      <CardBody className="flex-1 flex flex-col">
        <div
          className="h-28 rounded-lg mb-2"
          style={{ background: "linear-gradient(160deg,#1e3a5f,#0f2436 60%,#1a1410)" }}
        />
        <div className="space-y-1.5 flex-1">
          {STATS.map(([k, v]) => (
            <div key={k} className="flex justify-between text-[11.5px]">
              <span className="text-ink-dim">{k}</span>
              <span className="font-semibold">{v}</span>
            </div>
          ))}
        </div>
        <Button variant="primary" size="sm" className="w-full mt-2">
          View full impact report
        </Button>
      </CardBody>
    </Card>
  );
}
