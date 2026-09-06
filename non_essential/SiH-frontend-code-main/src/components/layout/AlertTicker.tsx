import { Fragment } from "react";
import { TriangleAlert, Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ALERT_FEED } from "@/data/mockData";

export function AlertTicker() {
  return (
    <footer className="sticky bottom-0 z-30 flex items-center gap-4 px-5 py-2.5 border-t border-border bg-panel/95 backdrop-blur overflow-x-auto">
      <span className="flex items-center gap-1.5 text-[11.5px] font-semibold shrink-0 text-risk-extreme">
        <TriangleAlert size={13} /> Alert feed
      </span>
      <div className="flex items-center gap-4 text-[11.5px] shrink-0 text-ink-dim">
        {ALERT_FEED.map((a, i) => (
          <Fragment key={a.text}>
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-ink-faint">{a.time}</span> {a.text}
            </span>
            {i < ALERT_FEED.length - 1 && <span className="text-ink-faint">•</span>}
          </Fragment>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="sm">
          <Share2 size={12} /> Share update
        </Button>
        <Button variant="primary" size="sm">
          <Download size={12} /> Download report
        </Button>
      </div>
    </footer>
  );
}
