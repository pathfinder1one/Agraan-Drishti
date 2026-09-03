import React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-panel overflow-hidden shadow-panel",
        className
      )}
      {...props}
    />
  );
}

interface CardHeaderProps {
  icon?: LucideIcon;
  title: string;
  right?: React.ReactNode;
  className?: string;
}

export function CardHeader({ icon: Icon, title, right, className }: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-4 py-3 border-b border-border-soft min-w-0",
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {Icon && <Icon size={15} className="text-ink-dim shrink-0" />}
        <h3 className="text-[13px] font-bold text-ink whitespace-nowrap">{title}</h3>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-3", className)} {...props} />;
}
