import { useState } from "react";
import { ShieldAlert, Send, CheckCircle2, ListChecks } from "lucide-react";
import { BentoCard, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RecommendedActionsPanelProps {
  locationName?: string;
  maxRisks?: Record<string, number>;
  onTriggerAlert?: () => void;
}

export function RecommendedActionsPanel({ 
  locationName = "Monitored Sector", 
  maxRisks = {},
  onTriggerAlert 
}: RecommendedActionsPanelProps) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [sent, setSent] = useState(false);

  const ff = maxRisks.flash_flood || 0;
  const cb = maxRisks.cloudburst || 0;
  const ts = maxRisks.thunderstorm || 0;

  const dynamicActions = [
    ff > 0.6 
      ? `Issue Level-3 evacuation order for low-lying settlements across ${locationName}`
      : `Pre-alert municipal emergency teams in ${locationName} for waterlogging`,
    cb > 0.5
      ? `Deploy SDRF/NDRF water rescue boats to high-runoff catchments in ${locationName}`
      : `Verify functional status of local automated weather stations (AWS)`,
    ts > 0.5
      ? `Broadcast lightning & severe convective wind advisory via NIC SMS Gateway`
      : `Ensure emergency radio & P2P BLE mesh relay nodes are online`,
    `Inspect critical arterial bridges and culvert drainage bottlenecks`,
    `Arm M2M SCADA interlocks: dam sluice drawdown & railway speed restrictions`,
  ];

  const handleSend = () => {
    setSent(true);
    onTriggerAlert?.();
    setTimeout(() => setSent(false), 4000);
  };

  const completedCount = Object.values(checked).filter(Boolean).length;

  return (
    <BentoCard glowBorder="amber">
      <CardHeader 
        icon={ShieldAlert} 
        title="Tactical Action Protocols (SOP)" 
        subtitle="Standardized Disaster Management Protocols"
        right={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-accent border border-border font-bold shadow-2xs">
            {completedCount}/{dynamicActions.length} Completed
          </span>
        }
      />
      <CardBody className="space-y-2 p-3.5">
        <div className="space-y-1">
          {dynamicActions.map((a, i) => (
            <label
              key={a}
              className={`flex items-start gap-2.5 text-[12px] p-2 rounded-lg cursor-pointer transition-all border ${
                checked[i] 
                  ? "bg-secondary/40 border-border/50 text-ink-dim line-through opacity-60" 
                  : "bg-panel-alt/50 border-border/60 text-ink hover:bg-panel-alt hover:border-accent/30"
              }`}
            >
              <input
                type="checkbox"
                className="mt-0.5 accent-[#246b38] w-3.5 h-3.5 rounded cursor-pointer shrink-0"
                checked={!!checked[i]}
                onChange={(e) => setChecked((s) => ({ ...s, [i]: e.target.checked }))}
              />
              <span className="leading-snug">{a}</span>
            </label>
          ))}
        </div>
        <Button 
          variant="destructive" 
          onClick={handleSend}
          className="w-full mt-2 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs font-bold py-2 text-xs"
        >
          {sent ? <CheckCircle2 size={14} className="text-white" /> : <Send size={13} />}
          {sent ? "Emergency Alert Dispatched to SDRF!" : "Broadcast SOP Alert to Authorities"}
        </Button>
      </CardBody>
    </BentoCard>
  );
}

