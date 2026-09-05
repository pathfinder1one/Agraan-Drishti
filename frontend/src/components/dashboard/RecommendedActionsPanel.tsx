import { useState } from "react";
import { ShieldAlert, Send, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
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

  return (
    <Card>
      <CardHeader icon={ShieldAlert} title="Recommended Actions (SOP)" />
      <CardBody className="space-y-2">
        {dynamicActions.map((a, i) => (
          <label
            key={a}
            className="flex items-start gap-2.5 text-[12.5px] py-1 cursor-pointer text-ink-dim hover:text-ink transition-colors"
          >
            <input
              type="checkbox"
              className="mt-0.5 accent-blue-500 w-3.5 h-3.5 rounded"
              checked={!!checked[i]}
              onChange={(e) => setChecked((s) => ({ ...s, [i]: e.target.checked }))}
            />
            <span className={checked[i] ? "line-through opacity-50" : ""}>{a}</span>
          </label>
        ))}
        <Button 
          variant="danger" 
          onClick={handleSend}
          className="w-full mt-2 flex items-center justify-center gap-1.5"
        >
          {sent ? <CheckCircle2 size={14} className="text-white" /> : <Send size={13} />}
          {sent ? "Emergency Alert Dispatched!" : "Send Alert to Authorities"}
        </Button>
      </CardBody>
    </Card>
  );
}
