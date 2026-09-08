import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-lg text-[12.5px] font-semibold transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-accent text-white hover:bg-accent-hover shadow-xs",
        secondary: "bg-secondary text-secondary-foreground border border-border/40 hover:brightness-95",
        destructive: "bg-destructive text-destructive-foreground hover:brightness-110",
        danger: "bg-risk-extreme text-white hover:brightness-110",
        success: "bg-risk-low text-[#06240f] hover:brightness-110",
        ghost:
          "bg-panel-alt text-ink-dim border border-border hover:text-ink hover:border-ink-faint",
        outline:
          "bg-transparent text-ink-dim border border-border hover:bg-panel-alt",
      },
      size: {
        sm: "px-2.5 py-1.5 text-[11.5px]",
        md: "px-3.5 py-2",
        icon: "w-8 h-8 p-0",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";
