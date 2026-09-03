import { useState, useEffect } from "react";
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

import { Search, Loader2 } from "lucide-react";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  handleSearch: (e: any) => void;
  isSearching: boolean;
  locationName: string;
  isLiveLocation: boolean;
  maxRisks: Record<string, number>;
}

export function Header({ searchQuery, setSearchQuery, handleSearch, isSearching, locationName, isLiveLocation, maxRisks }: HeaderProps) {
  const [darkMode, setDarkMode] = useState(true);
  const [currentLang, setCurrentLang] = useState('en');

  // Sync dark mode state with HTML class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    // Check if script is already added
    if (document.getElementById("google-translate-script")) return;
    
    // Add the callback
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          { pageLanguage: 'en', includedLanguages: 'hi,en,ta,te,mr,bn,gu,kn,ml,pa,ur' },
          'google_translate_element'
        );
      }
    };

    // Add the script
    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleLanguageChange = (e: any) => {
    const lang = e.target.value;
    setCurrentLang(lang);
    
    // Find the hidden google translate select and trigger change
    const gtSelect = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (gtSelect) {
      gtSelect.value = lang;
      gtSelect.dispatchEvent(new Event('change'));
    }
  };

  const highestRiskValue = Math.max(...Object.values(maxRisks || { flash_flood: 0 }));
  let riskLevel = "Low";
  let riskColorClass = "text-risk-low border-risk-low/40";
  let riskBg = "bg-[#142a18]";
  
  if (highestRiskValue > 0.85) {
    riskLevel = "Extreme";
    riskColorClass = "text-risk-extreme border-risk-extreme/40";
    riskBg = "bg-[#2a1414]";
  } else if (highestRiskValue > 0.60) {
    riskLevel = "High";
    riskColorClass = "text-risk-high border-risk-high/40";
    riskBg = "bg-[#2a2414]";
  } else if (highestRiskValue > 0.30) {
    riskLevel = "Moderate";
    riskColorClass = "text-risk-moderate border-risk-moderate/40";
    riskBg = "bg-[#2a2714]";
  }

  const activeHazards = Object.entries(maxRisks || {})
    .filter(([_, val]) => val > 0.3)
    .map(([key]) => key.replace('_', ' '))
    .join(' & ') || 'Normal conditions';

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

      {highestRiskValue > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg ${riskBg} border ${riskColorClass.split(' ')[1]}`}
        >
          <TriangleAlert size={16} className={`${riskColorClass.split(' ')[0]} ${highestRiskValue > 0.85 ? 'animate-pulse' : ''}`} />
          <div className="leading-tight">
            <div className={`text-[12.5px] font-bold ${riskColorClass.split(' ')[0]}`}>{riskLevel} risk detected</div>
            <div className="text-[10.5px] text-ink-dim capitalize">{activeHazards}</div>
          </div>
        </motion.div>
      )}

      <div className="flex items-center gap-1.5 text-[12.5px] text-ink-dim">
        <Compass size={14} className={isLiveLocation ? "text-accent" : ""} />
        {isLiveLocation && <span className="w-2 h-2 rounded-full bg-accent animate-pulse" title="Live Location Active" />}
        {locationName}
      </div>
      <div className="text-[12.5px] text-ink-faint">26 Aug 2026 · 10:24 AM IST</div>

      <div className="flex-1 max-w-md mx-4 relative hidden md:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
          placeholder={isSearching ? "Locating..." : "Search City (e.g. Delhi, Jaipur)"}
          className="w-full bg-panel-alt border border-border rounded-lg pl-9 pr-3 py-1.5 text-[13px] text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent"
        />
        {isSearching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-accent animate-spin" />}
      </div>

      <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-panel-alt border border-border">
        <span className="text-[10.5px] text-ink-faint">ETA to impact</span>
        <span className="text-[14px] font-bold text-amber-400">02h 18m</span>
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        <Button variant="ghost" size="sm" onClick={() => setDarkMode((d) => !d)}>
          <Moon size={13} /> {darkMode ? "Dark mode" : "Light mode"}
        </Button>
        
        {/* Hidden Google Translate Target */}
        <div id="google_translate_element" style={{ display: 'none' }}></div>
        
        {/* Custom React Tailwind Native Dropdown */}
        <div className="relative hidden sm:inline-flex items-center">
          <Globe2 size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
          <select 
            value={currentLang}
            onChange={handleLanguageChange}
            className="appearance-none bg-transparent hover:bg-slate-800/50 text-slate-300 text-[13px] font-medium py-1.5 pl-7 pr-6 rounded-md border border-slate-700/50 cursor-pointer outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors h-8"
          >
            <option value="en" className="bg-[#0f172a] text-slate-300">English</option>
            <option value="hi" className="bg-[#0f172a] text-slate-300">Hindi</option>
            <option value="ta" className="bg-[#0f172a] text-slate-300">Tamil</option>
            <option value="te" className="bg-[#0f172a] text-slate-300">Telugu</option>
            <option value="mr" className="bg-[#0f172a] text-slate-300">Marathi</option>
            <option value="bn" className="bg-[#0f172a] text-slate-300">Bengali</option>
            <option value="gu" className="bg-[#0f172a] text-slate-300">Gujarati</option>
          </select>
          <div className="absolute right-2 text-slate-400 pointer-events-none text-[8px]">▼</div>
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          className="relative"
          onClick={() => {
            const highHazards = Object.entries(maxRisks || {})
              .filter(([_, risk]) => risk > 0.7)
              .map(([hazard, _]) => hazard.replace('_', ' ').toUpperCase());
            
            if (highHazards.length > 0) {
              alert(`Active Critical Alerts:\n- ${highHazards.join('\n- ')}\n\nNDRF teams have been notified.`);
            } else {
              alert("No critical alerts at this time. Monitoring normal.");
            }
          }}
        >
          <Bell size={13} /> Alerts
          {Object.values(maxRisks || {}).filter((risk: any) => risk > 0.7).length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center bg-risk-extreme text-white">
              {Object.values(maxRisks || {}).filter((risk: any) => risk > 0.7).length}
            </span>
          )}
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="hidden md:inline-flex"
          onClick={() => {
            alert("Redirecting to NDRF Master Command Center view...");
          }}
        >
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
