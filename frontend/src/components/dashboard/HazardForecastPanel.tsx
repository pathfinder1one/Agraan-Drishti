import { TriangleAlert } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge, LEVEL_COLOR, levelFromLabel } from "@/components/ui/badge";
import { HAZARD_FORECAST } from "@/data/mockData";

interface HazardForecastPanelProps {
  maxRisks: Record<string, number>;
}

export function HazardForecastPanel({ maxRisks }: HazardForecastPanelProps) {
  const dynamicForecast = HAZARD_FORECAST.map((h) => {
    const key = h.name.toLowerCase().replace(' ', '_');
    const riskVal = maxRisks && maxRisks[key] !== undefined ? Math.round(maxRisks[key] * 100) : 0;
    
    let level = "Low";
    if (riskVal > 85) level = "Severe";
    else if (riskVal > 60) level = "High";
    else if (riskVal > 30) level = "Moderate";

    return {
      ...h,
      value: riskVal,
      level
    };
  }).sort((a, b) => b.value - a.value);

  const chartData = dynamicForecast.map((h) => ({
    name: h.name,
    value: h.value,
    color: LEVEL_COLOR[levelFromLabel(h.level)],
  }));

  return (
    <Card>
      <CardHeader
        icon={TriangleAlert}
        title="Hazard forecast"
        right={<span className="text-[10px] text-ink-faint">Next 6 hours</span>}
      />
      <CardBody className="space-y-2">
        {dynamicForecast.map((h) => {
          const Icon = h.icon;
          const color = LEVEL_COLOR[levelFromLabel(h.level)];
          return (
            <div key={h.name} className="flex items-center gap-2.5">
              <Icon size={14} style={{ color }} className="shrink-0" />
              <span className="flex-1 text-[12.5px] truncate">{h.name}</span>
              <div className="w-16 h-1.5 rounded-full overflow-hidden bg-border-soft">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${h.value}%`, background: color }}
                />
              </div>
              <span className="text-[11.5px] w-9 text-right text-ink-dim">{h.value}%</span>
              <Badge level={levelFromLabel(h.level)}>{h.level}</Badge>
            </div>
          );
        })}

        <div className="h-32 pt-2 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                type="category"
                dataKey="name"
                width={78}
                tick={{ fill: "#8b95ab", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{
                  background: "#0f1420",
                  border: "1px solid #1c2434",
                  borderRadius: 8,
                  fontSize: 11,
                }}
                labelStyle={{ color: "#e7ebf3" }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={9}>
                {chartData.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}
