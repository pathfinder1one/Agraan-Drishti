import { CircleDot, PanelLeftClose } from "lucide-react";
import { NAV_ITEMS, DATA_SOURCES } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeNav: string;
  onSelect: (id: string) => void;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
}

export function Sidebar({ activeNav, onSelect, isOpen = true, onToggle }: SidebarProps) {
  if (!isOpen) return null;

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-border bg-panel overflow-y-auto h-full transition-all duration-300">
      {/* Sidebar Header with Hide Button */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border-soft">
        <span className="text-[11px] font-bold tracking-wider uppercase text-ink-faint">
          Navigation
        </span>
        <button
          onClick={() => onToggle?.(false)}
          className="p-1 rounded-md text-ink-faint hover:text-white hover:bg-panel-alt transition-colors flex items-center gap-1 text-[11px]"
          title="Hide Sidebar"
        >
          <PanelLeftClose size={15} />
        </button>
      </div>

      <nav className="p-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] transition-all border-l-2",
                isActive
                  ? "bg-accent/15 text-blue-300 border-accent"
                  : "text-ink-dim border-transparent hover:bg-panel-alt hover:text-ink"
              )}
            >
              <Icon size={15} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center bg-risk-extreme text-white">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-4 pt-4 pb-2 text-[10px] font-semibold tracking-wide text-ink-faint">
        Data &amp; sources
      </div>
      <div className="px-3 pb-3 space-y-0.5">
        {DATA_SOURCES.map((s) => (
          <div key={s.name} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-ink-dim">
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-risk-low" />
            <div className="leading-tight min-w-0">
              <div className="text-[12px] truncate">{s.name}</div>
              <div className="text-[10px] text-ink-faint">{s.meta}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto p-3 border-t border-border-soft">
        <div className="text-[10px] font-semibold tracking-wide mb-2 text-ink-faint">
          System status
        </div>
        <div className="rounded-lg p-2.5 space-y-1.5 bg-panel-alt border border-border">
          <div className="flex items-center gap-1.5 text-[11px] text-risk-low">
            <CircleDot size={11} /> All systems operational
          </div>
          <div className="flex justify-between text-[11px] text-ink-dim">
            <span>Data latency</span>
            <span className="text-ink">2–5 min</span>
          </div>
          <div className="flex justify-between text-[11px] text-ink-dim">
            <span>Model confidence</span>
            <span className="text-ink">86%</span>
          </div>
          <div className="flex justify-between text-[11px] text-ink-dim">
            <span>Last updated</span>
            <span className="text-ink">10:24:15 AM</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
