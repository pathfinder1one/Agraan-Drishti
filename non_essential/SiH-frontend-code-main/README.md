# Agraan AI — Dashboard

A pixel-faithful, fully interactive rebuild of the Agraan AI early-warning
dashboard, split into separate, typed components using the requested stack:

- **React 18 + TypeScript**
- **Tailwind CSS** (custom dark theme tokens in `tailwind.config.ts`)
- **shadcn/ui-style primitives** (`Button`, `Badge`, `Card`, `Toggle` — built locally
  in `src/components/ui`, same patterns/conventions as shadcn/ui: `cva` variants,
  `cn()` class merging, composable Card/Header/Body)
- **Framer Motion** for entrance/hover/popup animations
- **Vite** for the dev server and build
- **Recharts** for the hazard-forecast bar chart
- **Lucide React** for all icons

## Project structure

```
src/
  App.tsx                        # assembles the full dashboard
  main.tsx                       # React entrypoint
  index.css                      # Tailwind layers + scrollbar styling
  types.ts                       # shared TypeScript types
  data/mockData.ts                # all dashboard mock data in one place
  lib/utils.ts                    # cn() class-merge helper
  components/
    ui/
      button.tsx                  # shadcn-style Button (cva variants)
      badge.tsx                   # risk-level Badge
      card.tsx                    # Card / CardHeader / CardBody
      toggle.tsx                  # animated checkbox row
    layout/
      Header.tsx                  # top bar, alert banner, controls
      Sidebar.tsx                 # nav, data sources, system status
      AlertTicker.tsx              # sticky footer alert feed
    dashboard/
      RiskMapPanel.tsx             # live map, layers, markers, popup
      HazardForecastPanel.tsx      # probability bars + Recharts chart
      ExposureOverviewPanel.tsx    # population/infra stat grid
      RecommendedActionsPanel.tsx  # checklist + send-alert CTA
      NowcastTimeline.tsx          # scrollable 0–6h strip
      SatellitePanel.tsx
      RadarPanel.tsx
      MetDriversPanel.tsx
      ImpactPredictionPanel.tsx
      SafeRoutePanel.tsx
```

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
```

Build for production:

```bash
npm run build
npm run preview
```

The project has already been installed, type-checked (`tsc -b`), and
production-built successfully in this environment — no missing pieces.

## Notes on fidelity & UX

- Layout, copy, colors, and data values match the reference screenshot
  (Rudraprayag flash-flood scenario) exactly.
- Designed and tested at full-HD (1920×1080) with a `max-w-[1920px]` content
  cap so panels don't over-stretch on large monitors, while still being fully
  responsive down to tablet width.
- The whole page is scrollable: header and footer are `sticky`, sidebar and
  main content scroll independently — nothing gets clipped when presenting on
  a laptop screen.
- All interactive elements are real: hazard-layer toggles switch the active
  layer, map markers open an animated risk popup with per-location data,
  nowcast tiles are selectable, actions are checkable, buttons have hover states.
