import { useRef, useState } from "react";
import { Clock3, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { NOWCAST } from "@/data/mockData";
import { cn } from "@/lib/utils";

export function NowcastTimeline() {
  const [activeIdx, setActiveIdx] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => trackRef.current?.scrollBy({ left: dir * 180, behavior: "smooth" });

  return (
    <Card>
      <CardHeader
        icon={Clock3}
        title="Nowcast timeline"
        right={
          <div className="flex items-center gap-1">
            <button
              onClick={() => scroll(-1)}
              className="w-6 h-6 rounded-md flex items-center justify-center bg-panel-alt border border-border hover:text-ink text-ink-dim"
            >
              <ChevronLeft size={13} />
            </button>
            <button
              onClick={() => scroll(1)}
              className="w-6 h-6 rounded-md flex items-center justify-center bg-panel-alt border border-border hover:text-ink text-ink-dim"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        }
      />
      <div ref={trackRef} className="flex gap-3 p-3.5 overflow-x-auto scroll-smooth">
        {NOWCAST.map((n, i) => (
          <button
            key={n.label}
            onClick={() => setActiveIdx(i)}
            className={cn(
              "shrink-0 w-32 rounded-lg overflow-hidden text-left transition-all border",
              activeIdx === i ? "border-accent bg-[#13223f]" : "border-border bg-panel-alt"
            )}
          >
            <div
              className="h-16 relative"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 50% 55%, #ef4444 0%, #f59e0b 30%, #16a34a 65%, transparent 80%)",
                opacity: n.intensity,
              }}
            />
            <div className="px-2 py-1.5">
              <div className="text-[11.5px] font-semibold">{n.label}</div>
              <div className="text-[10px] text-ink-faint">{n.time}</div>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}
