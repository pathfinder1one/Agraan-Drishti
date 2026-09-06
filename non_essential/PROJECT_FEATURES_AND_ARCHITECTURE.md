# 🛡️ AGRAAN AI — Project Features & Architecture Guide

> **AI-Powered Hyper-Local Extreme Weather & Disaster Early Warning System**  
> *Built for Smart India Hackathon & National Disaster Management Authority (NDMA / NDRF)*

---

## 📌 Executive Summary
**AGRAAN AI** is a state-of-the-art early warning and command center platform designed to detect, forecast, and dispatch alerts for high-impact convective weather disasters: **Cloudbursts, Flash Floods, Severe Thunderstorms, and Landslides**.

By fusing real-time geostationary satellite streams (**INSAT-3D/3DR**), Doppler Weather Radar (**DWR**), Numerical Weather Prediction models (**IMDAA / ERA5**), and High-Resolution Topography (**DEM**), the system provides hyper-local forecasts with a **2 to 6 hour early warning lead time**, bridging the critical gap between macro-scale weather forecasts and grassroots emergency action.

---

## 📊 Quick System Statistics
| Metric | Specification |
| :--- | :--- |
| **AI Model Architecture** | ConvLSTM + Spatial Self-Attention (318,400 parameters) |
| **Prediction Horizon** | 0 to 6 Hours Nowcast (with 5-point trajectory steps) |
| **Spatial Matrix** | 310 × 310 Continuous Subcontinent Grid |
| **Geographic Coverage** | 594 Districts across 35 Indian States & UTs |
| **Monitored Confluence Corridors** | Mandakini & Alaknanda River Basins, Western Ghats, NCR |
| **Multi-Hazard Prediction** | Flash Flood, Cloudburst, Thunderstorm, Landslide |
| **False Alarm Rate (FAR)** | 14.2% (Historical Test-Set Validation Benchmark) |
| **Multi-Lingual Reach** | 11 Indian Languages via Integrated Neural Translation |

---

## 🌟 Comprehensive Feature Breakdown (8 Modules · 32 Features)

```
                                    ┌────────────────────────┐
                                    │   AGRAAN AI     │
                                    │    COMMAND CENTRE      │
                                    └───────────┬────────────┘
         ┌──────────────────┬───────────────────┼───────────────────┬──────────────────┐
         │                  │                   │                   │                  │
┌────────┴────────┐ ┌───────┴────────┐ ┌────────┴────────┐ ┌────────┴────────┐ ┌───────┴────────┐
│  AI & Physics   │ │ Geospatial Map │ │ Dedicated Live  │ │  Explainable AI │ │ Multi-Channel  │
│ Modeling Engine │ │ Command Center │ │    Map View     │ │ (XAI Diagnostics│ │ Broadcast Alert│
└─────────────────┘ └────────────────┘ └─────────────────┘ └─────────────────┘ └────────────────┘
```

---

### Module 1: AI & Deep Learning Core Engine (Backend)
1. **ConvLSTM + Spatial Self-Attention Network:**
   - Custom spatio-temporal deep learning network that captures both the spatial geometry of convective clouds and their temporal evolution over time steps $t=0$ to $t=+6\text{h}$.
2. **Multi-Hazard Simultaneous Prediction:**
   - Predicts calibrated probability values for 4 hazards simultaneously:
     - 🌊 **Flash Flood** (Surface runoff, drainage choke, river overtopping)
     - ⛈️ **Cloudburst** (Rapid localized precipitation > 100 mm/h)
     - ⚡ **Severe Thunderstorm** (Convective wind gust, intense lightning)
     - ⛰️ **Landslide Susceptibility** (Topographic slope saturation)
3. **Physical Atmospheric Diagnostic Anomaly Fusion ($X_{\text{live}}$):**
   - Combines pure data-driven predictions with physical thermodynamic variables:
     - **CAPE** (Convective Available Potential Energy)
     - **CIN** (Convective Inhibition)
     - **IWV** (Integrated Precipitable Water Vapour)
     - **Low-Level Wind Shear** and **Moisture Convergence Field**
4. **Topographic DEM & Slope Gradient Fusion:**
   - Incorporates SRTM Digital Elevation Models to calculate orographic lift in mountainous terrains (e.g., Rudraprayag, Kedarnath, Wayanad) and valley flood trapping.
5. **Subcontinent 310×310 Spatial Grid:**
   - Real-time continuous inference across the entire Indian subcontinent.

---

### Module 2: Geospatial Map & Command Center Architecture
6. **All-India 594 District Administrative Boundary Grids:**
   - GeoJSON vector boundary network rendered as white dashed administrative grids across all 35 States/UTs with interactive hover tooltips.
7. **High-Resolution River Vulnerability Corridors:**
   - Glowing neon river networks (e.g., Mandakini & Alaknanda rivers) highlighting high-vulnerability flash flood corridors and confluences.
8. **20 Live Monitored Hotspot Cities:**
   - Real-time monitoring for key hubs: Rudraprayag, Kedarnath, Delhi NCR, Meerut, Mumbai, Wayanad, Joshimath, Tilwara, Augustmuni, Guptkashi, etc.
9. **Multi-Base Layer Tile Switching:**
   - Instant toggle between **Satellite View** (NASA/ESRI), **Terrain 3D** (Topographic contours), and **Street Map** (Road networks).
10. **Interactive HUD Map Controls:**
    - Dedicated map control stack: **Zoom In (`+`)**, **Zoom Out (`-`)**, **Compass Recenter (`🧭`)**, **Layer Cycle (`🥞`)**, and **Browser Fullscreen (`⤢`)**.
11. **Time-Lapse Nowcast Animation Player:**
    - Interactive **Play/Pause** animation that steps through $+0\text{h} \to +1\text{h} \to \dots \to +6\text{h}$ with dynamic timeline scrubbing.
12. **1-Click Zen Mode:**
    - Instant toggle to hide all floating HUD panels for pure, unobstructed high-res satellite inspection.
13. **Collapsible Navigation Sidebar (1-Click Workspace Expansion):**
    - Instant toggle button in header and sidebar to collapse/hide the entire navigation rail, allowing the geospatial map and decision telemetry to take 100% full screen width, with a floating quick-access menu button to restore anytime.

---

### Module 3: Dedicated "Live Map" Section (Full-Screen View)
13. **Unified Minimalist Top Command Bar:**
    - Integrated status pill with live green heartbeat, hazard mode selector (`[Flood]`, `[Cloudburst]`, `[Thunderstorm]`, `[Landslide]`, `[Multi-Hazard]`), basemap toggles, and risk legend trigger.
14. **Collapsible 3-in-1 Intelligence Drawer:**
    - **`[Intelligence Tab]`**: Selected hotspot threat score ($/100$), hazard breakdown metrics, and impact ETA.
    - **`[Hotspots List (20)]`**: Live nationwide cities list with color-coded risk dots and quick-fly selection.
    - **`[AI Engine Telemetry]`**: Real-time stats on model parameters, satellite ingestion status, and DEM fusion.
    - **`< / >` Collapse Drawer Button** to expand map to 100% full screen width.
15. **Step-5 AI Trajectory Timeline Dock:**
    - Slim floating bottom dock showing 5-step forecast trajectory:
      $$\text{NOW} \longrightarrow +15\text{m} \longrightarrow +30\text{m} \longrightarrow +45\text{m} \longrightarrow +60\text{m}$$
      accompanied by glowing risk dots, 0–6h range slider, and 92% Model Confidence score.

---

### Module 4: Explainable AI (XAI) & Diagnostics
16. **Cell-Level XAI Transparency (`/api/xai/{lat}/{lon}`):**
    - Click any point on India's map to see why it was flagged (e.g., rapid cloud top cooling, severe moisture convergence, or valley slope trapping).
17. **Meteorological Drivers Telemetry Panel:**
    - Real-time diagnostic telemetry: Surface Temperature, Dew Point Depression, Cloud Base, Surface Pressure Deficit, and Boundary Layer Relative Humidity.
18. **Self-Aware Forecast Reliability & Bust Detection:**
    - Automated self-check reporting forecast reliability (e.g., $93\%$ `STABLE_PERSISTENT`, Low Bust Risk) preventing false alarms caused by transient cloud anomalies.

---

### Module 5: Real-Time Data Ingestion Pipelines
19. **INSAT-3D / INSAT-3DR Real Satellite Stream:**
    - Direct Cloud Top Temperature (CTT) infrared ingestion overlay via ISRO MOSDAC.
20. **On-Demand Satellite Ingestion API (`POST /api/satellite/ingest`):**
    - Live satellite stream trigger with real-time status and revision tracking.
21. **DWR Radar & AWS Rain Gauge Integration:**
    - Doppler Weather Radar reflectivity ($\text{dBZ}$) and 528 automatic ground rain stations.
22. **IMDAA / NCMRWF High-Res Atmospheric Stream:**
    - Atmospheric reanalysis model integration.

---

### Module 6: Emergency Alerting, SOPs & Action Tiers
23. **Automated Audio Siren in Hindi (Voice Alert):**
    - Browser SpeechSynthesis integration broadcasting emergency audio warnings:
      > *"आपातकालीन चेतावनी! राष्ट्रीय आपदा प्रबंधन प्राधिकरण द्वारा रेड अलर्ट जारी किया गया है। तुरंत सुरक्षित स्थानों पर चले जाएं।"*
24. **Multi-Channel Guaranteed Reach Simulator:**
    - **Citizen Reach**: Automated SMS & WhatsApp push alerts for all residents within a 5 km hazard radius.
    - **Authority Command Push**: REST API notification dispatched directly to DM Office, SDM, and NDRF/SDRF command units.
25. **Confidence-Graded Action Tiers & Role-Based SOPs:**
    - Customized Standard Operating Procedures tailored by role:
      - 👨‍👩‍👧 **Citizens**: Immediate evacuation routes to higher ground, avoiding nullahs and rivers.
      - 🚒 **First Responders (NDRF)**: Pre-positioning inflatable boat rescue units and relief staging areas.
      - 🌾 **Farmers**: Unhitching livestock and clearing field drainage channels.
26. **Critical Risk Auto-Modal:**
    - Prominent modal automatically triggered when predicted multi-hazard risk exceeds $85\%$.

---

### Module 7: Cascading Domino Hazard Engine & Infrastructure Exposure
27. **Dynamic Cascading Hazard Chain Engine (`/api/cascading-chain`):**
    - Directly links atmospheric model predictions with physics-based downstream cascade calculations:
      $$\text{Cloudburst Trigger} \longrightarrow \text{River Hydro-Surge} \longrightarrow \text{Toe Erosion \& Landslide} \longrightarrow \text{Highway / Transit Corridor Blockage}$$
    - Dynamically adapts based on terrain: mountain valleys calculate NH-107 cutoffs and slope shear failures; urban plains calculate drainage backflow and arterial choke points.
28. **Population & Infrastructure Exposure Counter:**
    - Live estimate of affected population, vulnerable schools, hospitals, bridges, and electric substations.
29. **High-Risk Villages Pinpointing:**
    - Specific enumeration of riverside settlements and vulnerable habitations.
30. **AI Safe Route Evacuation Planner:**
    - Computes green detour evacuation routes avoiding flooded river corridors and landslide-prone mountain curves.
31. **Community Vulnerable Population Registry & ASHA/Anganwadi Caretaker Relay (No-Device Needed Outreach):**
    - Directly addresses the critical last-mile blind spot where sirens and SMS fail: deaf citizens cannot hear audio sirens, and bedridden/elderly citizens lack smartphones.
    - Maintains a localized registry of high-care individuals (Mobility, Hearing, Vision, Bedridden) mapped to designated neighbor volunteers and ASHA workers with automated physical door-knock dispatch (`/api/vulnerable-registry`).

---

### Module 8: Autonomous M2M Infrastructure Interlocks (SCADA / IoT Gateway)
31. **Machine-to-Machine (M2M) Autonomous Action Triggering (`/api/infrastructure/m2m-interlocks`):**
    - Elevates the platform from "Alert-to-Human" to "Alert-to-Machine" by dispatching zero-latency control packets:
      - 🌊 **Dam Sluice Gates (IEC 60870-5-104)**: Controlled reservoir drawdown advisory before flood wave arrives.
      - 🚆 **Indian Railways (Kavach-API)**: Automated caution orders capping train speed to 30 km/h in threatened block sections.
      - 🛣️ **Smart Highways (NTCIP 1203 / MQTT)**: Triggering variable message signs (VMS) and lowering flood barriers at toll plazas.
      - ⚡ **Power Grid Substations (Modbus/TCP)**: Pre-emptive islanding to prevent transformer submersion arc-explosions.
32. **Mandatory Human-in-the-Loop (HITL) 60-Second Interlock Window:**
    - Avoids the fatal mistake of startups like *One Concern* (unvalidated black-box automation) by enforcing a 60-second engineer abort window before physical actuation.
33. **Multi-Channel Dispatch Hub (4 Channels):**
    - **Channel 1**: Citizens 5km Radius (SMS, WhatsApp, and Hindi Voice Siren).
    - **Channel 2**: DM Office, SDM, and First Responders (REST API Push).
    - **Channel 3**: **Offline P2P Mesh Relay (BLE)** — Phone-to-phone multi-hop alert broadcast without cell towers or internet.
    - **Channel 4**: **M2M Autonomous Infrastructure Interlocks** — Industrial SCADA & IoT webhook dispatch.

---

### Module 9: Citizen Feedback, Auditing & Localization
34. **Citizen Ground-Truth Feedback Loop:**
    - *"Report Ground Truth"* interactive module allowing field officers and citizens to verify or refute predicted weather conditions (active feedback learning loop).
35. **Live Model Audit Card:**
    - Transparent accuracy metrics: **False Alarm Rate (FAR: 14.2% on historical test events)**, Critical Success Index (CSI), and latency ($2\text{–}5\text{ min}$).
36. **11-Language Multi-Lingual Translation Engine:**
    - Integrated multi-lingual dropdown powered by Google Translate supporting: Hindi, English, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada, Malayalam, Punjabi, and Urdu.

---

### Module 10: Reports & Situation Analytics Command Center (`/reports`)
37. **Dedicated Situation Reports (SITREP) Clearinghouse:**
    - Centralized repository compliant with Government of India and NDMA SOP standards for automated post-hazard documentation and inter-agency dispatch.
38. **Relocated Primary Action Dispatch Hub:**
    - Hosts the **Multi-Channel & BLE Mesh Dispatcher** and **Official NDRF SITREP Report Generator**, keeping the main dashboard purely focused on real-time observational intelligence.
39. **Historical SITREP Document Archive:**
    - Filterable registry of active and archived reports (e.g. *SITREP-2026-0826-UK01*, *SITREP-2026-0826-DL04*) with severity, affected population, dispatch status, and 1-click SITREP inspection.
40. **Multi-Channel Reach Telemetry & Accuracy Audit:**
    - Live breakdown of transmission metrics across SMS broadcast (98.4%), authority REST pushes (42 endpoints), offline BLE mesh hops (14 nodes), and industrial SCADA triggers (4 systems).

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 + Vite (TypeScript & Modern JSX)
- **Styling**: Tailwind CSS + Custom Dark Obsidian Glassmorphism System
- **Mapping & GIS**: Leaflet, React-Leaflet, Leaflet.heat, GeoJSON Vector Grids
- **Animations & Icons**: Framer Motion, Lucide React
- **Speech & Audio**: Web Speech API (`SpeechSynthesisUtterance`)

### Backend
- **Server Framework**: FastAPI / Python 3.11 (Uvicorn ASGI)
- **Deep Learning**: PyTorch (ConvLSTM, Attention Mechanisms, Anomaly Tensor Fusion)
- **Geospatial & Math**: NumPy, SciPy, Shapely, PyProj
- **Data Ingestion**: ISRO MOSDAC Satellite Ingest, IMD Radar Emulation, ERA5 Anomalies

---

## 🚀 How to Run Locally

### 1. Start Backend API
```bash
# Navigate to project root
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```
*API will run at `http://localhost:8000` (Docs available at `http://localhost:8000/docs`).*

### 2. Start Frontend Dev Server
```bash
cd frontend
npm install
npm run dev
```
*Application will be live at `http://localhost:5173/`.*

---

## 🏆 Hackathon Presentation Checklist
- [x] **Live Subcontinent Heatmap**: Real dynamic numbers across all 20 cities (no flat 52% saturation).
- [x] **Nationwide 594 District Grids**: White dashed boundaries visible across every Indian state.
- [x] **High-Res River Lines**: Mandakini & Alaknanda glowing corridors.
- [x] **Full-Screen Live Map**: Edge-to-edge view with collapsible 3-in-1 intelligence drawer.
- [x] **Interactive Map Controls**: Zoom in/out, recenter, basemap toggle, time animation player.
- [x] **Multi-Channel Warning**: SMS simulator + Hindi voice siren.
- [x] **Explainable AI (XAI)**: Clickable cells displaying meteorological rationale and drivers.
- [x] **Zero Layout Clipping**: Responsive bounding across laptop and desktop screens.
