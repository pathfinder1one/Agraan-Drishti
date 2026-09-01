import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center gap-2 py-1 select-none group text-left"
    >
      <span
        className={cn(
          "w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0",
          checked ? "bg-accent border-accent" : "border-border group-hover:border-ink-faint"
        )}
      >
        {checked && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          >
            <Check size={11} className="text-white" strokeWidth={3} />
          </motion.span>
        )}
      </span>
      <span
        className={cn(
          "text-[13px] transition-colors",
          checked ? "text-ink" : "text-ink-dim group-hover:text-ink"
        )}
      >
        {label}
      </span>
    </button>
  );
}
