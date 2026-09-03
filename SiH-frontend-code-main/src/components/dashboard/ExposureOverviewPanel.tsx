import { Users } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { EXPOSURE } from "@/data/mockData";

interface ExposureOverviewPanelProps {
  selectedCell?: { lat: number; lon: number } | null;
}

export function ExposureOverviewPanel({ selectedCell }: ExposureOverviewPanelProps) {
  // Create a pseudo-random but deterministic multiplier based on lat/lon
  const seed = selectedCell ? (selectedCell.lat * 13 + selectedCell.lon * 17) : 1000;
  const multiplier = 0.5 + (seed % 100) / 100; // Between 0.5x and 1.5x

  return (
    <Card>
      <CardHeader
        icon={Users}
        title="Exposure overview"
        right={<span className="text-[10px] text-ink-faint">{selectedCell ? `${selectedCell.lat.toFixed(2)}, ${selectedCell.lon.toFixed(2)}` : "Selected area"}</span>}
      />
      <CardBody className="grid grid-cols-2 gap-2">
        {EXPOSURE.map((e, i) => {
          const Icon = e.icon;
          return (
            <motion.div
              key={e.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-lg p-2.5 bg-panel-alt border border-border hover:border-ink-faint/60 transition-colors"
            >
              <div className="flex items-center gap-1.5 text-[10.5px] mb-1 text-ink-dim">
                <Icon size={12} /> {e.label}
              </div>
              <div className="text-[17px] font-bold">
                {e.value.includes(',') || !isNaN(Number(e.value)) 
                  ? Math.round(parseFloat(e.value.replace(/,/g, '')) * multiplier).toLocaleString()
                  : e.value}
              </div>
            </motion.div>
          );
        })}
      </CardBody>
    </Card>
  );
}
