import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0e16",
        panel: "#0f1420",
        "panel-alt": "#0c111c",
        border: {
          DEFAULT: "#1c2434",
          soft: "#161d2b",
        },
        ink: {
          DEFAULT: "#e7ebf3",
          dim: "#8b95ab",
          faint: "#5b6478",
        },
        accent: {
          DEFAULT: "#3b82f6",
          hover: "#2563eb",
        },
        risk: {
          extreme: "#ef4444",
          high: "#f59e0b",
          moderate: "#eab308",
          low: "#22c55e",
          verylow: "#16a34a",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.02) inset",
      },
      borderRadius: {
        xl: "0.875rem",
      },
      keyframes: {
        pulseRing: {
          "0%": { boxShadow: "0 0 0 0 rgba(239,68,68,0.55)" },
          "100%": { boxShadow: "0 0 0 12px rgba(239,68,68,0)" },
        },
      },
      animation: {
        pulseRing: "pulseRing 1.8s cubic-bezier(0.4,0,0.6,1) infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
