import { useState } from "react";
import { ShieldAlert, Send } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RECOMMENDED_ACTIONS } from "@/data/mockData";

export function RecommendedActionsPanel() {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  return (
    <Card>
      <CardHeader icon={ShieldAlert} title="Recommended actions" />
      <CardBody className="space-y-2">
        {RECOMMENDED_ACTIONS.map((a, i) => (
          <label
            key={a}
            className="flex items-start gap-2.5 text-[12.5px] py-0.5 cursor-pointer text-ink-dim hover:text-ink transition-colors"
          >
            <input
              type="checkbox"
              className="mt-0.5 accent-blue-500 w-3.5 h-3.5"
              checked={!!checked[i]}
              onChange={(e) => setChecked((s) => ({ ...s, [i]: e.target.checked }))}
            />
            <span className={checked[i] ? "line-through opacity-60" : ""}>{a}</span>
          </label>
        ))}
        <Button variant="danger" className="w-full mt-2">
          <Send size={13} /> Send alert to authorities
        </Button>
      </CardBody>
    </Card>
  );
}
