import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: "none" | "accent" | "danger" | "amber";
  interactive?: boolean;
}

export function Card({ className, glow = "none", interactive = false, ...props }: CardProps) {
  const glowStyles = {
    none: "",
    accent: "ring-1 ring-accent/30 shadow-[0_4px_24px_rgba(36,107,56,0.12)]",
    danger: "ring-1 ring-destructive/30 shadow-[0_4px_24px_rgba(201,42,42,0.12)]",
    amber: "ring-1 ring-amber-500/30 shadow-[0_4px_24px_rgba(245,179,90,0.15)]",
  };

  return (
    <div
      className={cn(
        "rounded-[0.66rem] border border-border bg-panel text-ink overflow-hidden shadow-xs transition-all duration-200",
        interactive && "hover:-translate-y-0.5 hover:shadow-md hover:border-border/80",
        glowStyles[glow],
        className
      )}
      {...props}
    />
  );
}

export interface BentoCardProps extends HTMLMotionProps<"div"> {
  glow?: "none" | "accent" | "danger" | "amber";
  glowBorder?: "none" | "accent" | "danger" | "amber";
}

export const BentoCard = React.forwardRef<HTMLDivElement, BentoCardProps>(
  ({ className, glow = "none", glowBorder, children, ...props }, ref) => {
    const activeGlow = glowBorder ?? glow;
    const glowStyles = {
      none: "border-border hover:border-border/80",
      accent: "border-accent/40 shadow-[0_4px_20px_rgba(36,107,56,0.10)]",
      danger: "border-destructive/40 shadow-[0_4px_20px_rgba(201,42,42,0.10)]",
      amber: "border-amber-500/40 shadow-[0_4px_20px_rgba(245,179,90,0.12)]",
    };

    return (
      <motion.div
        ref={ref}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className={cn(
          "rounded-[0.66rem] border bg-panel text-ink shadow-xs overflow-hidden transition-colors flex flex-col",
          glowStyles[activeGlow],
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
BentoCard.displayName = "BentoCard";

interface CardHeaderProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  right?: React.ReactNode;
  borderless?: boolean;
  className?: string;
}

export function CardHeader({ 
  icon: Icon, 
  title, 
  subtitle,
  badge,
  right, 
  borderless = false,
  className 
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-4 py-3 min-w-0",
        !borderless && "border-b border-border-soft/70",
        className
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {Icon && (
          <div className="w-7 h-7 rounded-lg bg-secondary/60 border border-border/40 flex items-center justify-center text-accent shrink-0 shadow-xs">
            <Icon size={14} />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[12.5px] font-bold tracking-tight text-ink truncate" title={title}>
              {title}
            </h3>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
          {subtitle && (
            <p className="text-[10.5px] text-ink-dim truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 flex-1 flex flex-col", className)} {...props} />;
}
