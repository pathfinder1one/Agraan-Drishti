import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  TriangleAlert,
  Compass,
  Moon,
  Globe2,
  Bell,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 px-5 py-3 border-b border-border bg-panel/95 backdrop-blur">
      <div className="flex items-center gap-2.5 pr-4 mr-1 border-r border-border-soft">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br from-blue-500 to-blue-700">
          <ShieldAlert size={18} className="text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-[14px] font-bold tracking-tight">DisasterGuard AI</div>
          <div className="text-[10.5px] text-ink-faint">AI-driven hyper-local early warning</div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-[#2a1414] border border-risk-extreme/40"
      >
        <TriangleAlert size={16} className="text-risk-extreme animate-pulse" />
        <div className="leading-tight">
          <div className="text-[12.5px] font-bold text-risk-extreme">Extreme risk detected</div>
          <div className="text-[10.5px] text-[#f5a3a3]">Flash flood &amp; cloudburst likely</div>
        </div>
      </motion.div>

      <div className="flex items-center gap-1.5 text-[12.5px] text-ink-dim">
        <Compass size={14} />
        Rudraprayag, Uttarakhand
      </div>
      <div className="text-[12.5px] text-ink-faint">26 Aug 2026 · 10:24 AM IST</div>

      <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-panel-alt border border-border">
        <span className="text-[10.5px] text-ink-faint">ETA to impact</span>
        <span className="text-[14px] font-bold text-amber-400">02h 18m</span>
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        <Button variant="ghost" size="sm" onClick={() => setDarkMode((d) => !d)}>
          <Moon size={13} /> {darkMode ? "Dark mode" : "Light mode"}
        </Button>
        {/* Google Translate Widget Container */}
        <div className="hidden sm:inline-flex items-center" id="google_translate_element" style={{ minHeight: '32px' }}></div>
        <Button variant="ghost" size="sm" className="relative" onClick={() => alert("Opening Alert Console...")}>
          <Bell size={13} /> Alerts
          <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center bg-risk-extreme text-white">
            7
          </span>
        </Button>
        <Button variant="ghost" size="sm" className="hidden md:inline-flex" onClick={() => alert("Returning to Master Command Center...")}>
          <Settings2 size={13} /> Command center
        </Button>
        <div className="flex items-center gap-2 pl-2.5 ml-1 border-l border-border-soft">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold bg-blue-700 text-white">
            N
          </div>
          <span className="text-[12.5px] hidden lg:inline text-ink-dim">NDRF · India</span>
        </div>
      </div>
    </header>
  );
}
