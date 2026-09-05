import React, { useEffect, useRef, useState, Fragment } from 'react'
import { MapContainer, TileLayer, ImageOverlay, CircleMarker, Popup, Tooltip, useMap, GeoJSON, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import rudraprayagBoundary from '../../data/rudraprayagBoundary.json'
import indiaDistricts from '../../data/indiaDistricts.json'

// Ensure L is on window for plugins if not already
if (typeof window !== 'undefined') {
  (window as any).L = L
}

const INDIA_CENTER = [30.28, 78.98] as [number, number] // Centered on Himalayas / Northern corridor

interface LiveMapProps {
  heatmapData: any[];
  activeLayer: string;
  mapMode: string;
  onCellClick: (lat: number, lon: number) => void;
  selectedCell?: { lat: number; lon: number } | null;
  monitoredLocation?: { lat: number; lon: number } | null;
  onMapReady?: (map: L.Map) => void;
  satelliteRevision?: number;
}

// ──────────────────────────────────────────────
// HEATMAP LAYER (Continuous ConvLSTM Weather Field across India)
// ──────────────────────────────────────────────
function HeatmapLayer({ data, activeLayer }: { data: any[], activeLayer: string }) {
  const map = useMap()
  const heatLayerRef = useRef<any>(null)

  useEffect(() => {
    if (!map || !data || data.length === 0) return

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current)
    }

    const points = data.map(p => [p.lat, p.lon, p.value])

    // Natural IMD Radar Palette (Green -> Yellow -> Orange -> Red)
    const gradients: Record<string, any> = {
      thunderstorm: { 0.15: '#22c55e', 0.40: '#eab308', 0.65: '#f97316', 0.85: '#ef4444', 1.0: '#dc2626' },
      cloudburst:   { 0.15: '#22c55e', 0.40: '#eab308', 0.65: '#f97316', 0.85: '#ef4444', 1.0: '#dc2626' },
      flash_flood:  { 0.15: '#22c55e', 0.40: '#eab308', 0.65: '#f97316', 0.85: '#ef4444', 1.0: '#dc2626' }
    }

    let layerKey = activeLayer.toLowerCase().replace(' ', '_');
    if (!gradients[layerKey]) layerKey = 'flash_flood';

    if ((window as any).L && (window as any).L.heatLayer) {
      const heat = (window as any).L.heatLayer(points, {
        radius: 38,
        blur: 26,
        maxZoom: 12,
        max: 1.0,
        gradient: gradients[layerKey]
      })

      heat.addTo(map)
      heatLayerRef.current = heat
    }

    return () => {
      if (heatLayerRef.current && map) {
        map.removeLayer(heatLayerRef.current)
      }
    }
  }, [map, data, activeLayer])

  return null
}

// ──────────────────────────────────────────────
// NATIONWIDE DISTRICT & STATE BOUNDARIES (White Dashed Grids)
// ──────────────────────────────────────────────
function NationwideBoundariesLayer({ onCellClick }: { onCellClick: (lat: number, lon: number) => void }) {
  return (
    <>
      {/* All 594 Districts across India (White Dashed District Grids) */}
      <GeoJSON
        data={indiaDistricts as any}
        style={{
          color: "#e2e8f0",
          weight: 1.2,
          opacity: 0.80,
          fillColor: "#ef4444",
          fillOpacity: 0.015,
          dashArray: "5, 5",
        }}
        onEachFeature={(feature, layer) => {
          const district = feature.properties?.district || "District";
          const state = feature.properties?.state || "India";
          
          layer.bindTooltip(
            `<div style="font-family: inherit; font-size: 11px; padding: 3px 6px; line-height: 1.2; color: #0f172a;">
              <strong style="font-size: 11.5px; display: block; color: #1e293b;">${district}</strong>
              <span style="font-size: 9.5px; color: #64748b;">${state}</span>
            </div>`,
            { direction: "top", sticky: true }
          );

          layer.on({
            click: (e: any) => {
              if (e.latlng) {
                onCellClick(
                  parseFloat(e.latlng.lat.toFixed(2)),
                  parseFloat(e.latlng.lng.toFixed(2))
                );
              }
            },
            mouseover: (e: any) => {
              const l = e.target;
              l.setStyle({
                weight: 2.4,
                color: "#38bdf8",
                fillOpacity: 0.08,
              });
            },
            mouseout: (e: any) => {
              const l = e.target;
              l.setStyle({
                weight: 1.2,
                color: "#e2e8f0",
                fillOpacity: 0.015,
              });
            },
          });
        }}
      />

      {/* 3. Rudraprayag High-Resolution Disaster Epicenter Outline */}
      <GeoJSON
        data={rudraprayagBoundary as any}
        style={{
          color: "#ffffff",
          weight: 3.0,
          opacity: 0.98,
          fillColor: "#ff3300",
          fillOpacity: 0.04,
          dashArray: "7, 5",
        }}
        onEachFeature={(_feature, layer) => {
          layer.bindTooltip("Rudraprayag High-Altitude Catchment Zone", {
            direction: "top",
            sticky: true,
          });
        }}
      />
    </>
  )
}

// ──────────────────────────────────────────────
// RIVER NETWORKS (Mandakini & Alaknanda Glowing Polyline)
// ──────────────────────────────────────────────
const MANDAKINI_COORDS: [number, number][] = [
  [30.61, 79.08],
  [30.59, 79.075],
  [30.57, 79.07],
  [30.55, 79.065],
  [30.53, 79.06],
  [30.51, 79.055],
  [30.49, 79.045],
  [30.47, 79.035],
  [30.45, 79.025],
  [30.43, 79.015],
  [30.41, 79.005],
  [30.39, 79.0],
  [30.37, 78.995],
  [30.35, 78.99],
  [30.33, 78.987],
  [30.31, 78.984],
  [30.2844, 78.9811],
]

const ALAKNANDA_COORDS: [number, number][] = [
  [30.32, 78.87],
  [30.315, 78.89],
  [30.305, 78.91],
  [30.30, 78.93],
  [30.295, 78.95],
  [30.292, 78.965],
  [30.2844, 78.9811],
]

function RiverLayer() {
  return (
    <>
      {/* Mandakini River Glow */}
      <Polyline
        positions={MANDAKINI_COORDS}
        pathOptions={{
          color: "#00b4d8",
          weight: 8,
          opacity: 0.25,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
      <Polyline
        positions={MANDAKINI_COORDS}
        pathOptions={{
          color: "#00f0ff",
          weight: 3.5,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round",
        }}
      >
        <Tooltip direction="right" sticky>
          Mandakini River (High Vulnerability Corridor)
        </Tooltip>
      </Polyline>

      {/* Alaknanda River Glow */}
      <Polyline
        positions={ALAKNANDA_COORDS}
        pathOptions={{
          color: "#0284c7",
          weight: 8,
          opacity: 0.20,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
      <Polyline
        positions={ALAKNANDA_COORDS}
        pathOptions={{
          color: "#38bdf8",
          weight: 3,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
        }}
      >
        <Tooltip direction="right" sticky>
          Alaknanda River (Confluence Zone)
        </Tooltip>
      </Polyline>
    </>
  )
}

// ──────────────────────────────────────────────
// BACKEND CITIES & HOTSPOTS LAYER
// ──────────────────────────────────────────────
function getRiskColor(level: string) {
  switch (level) {
    case "extreme":
      return "#ef4444"; // red
    case "high":
      return "#f97316"; // orange
    case "moderate":
      return "#eab308"; // yellow
    case "low":
      return "#22c55e"; // green
    default:
      return "#10b981"; // emerald
  }
}

function BackendCitiesLayer({ 
  onCellClick, 
  monitoredLocation 
}: { 
  onCellClick: (lat: number, lon: number) => void;
  monitoredLocation?: { lat: number; lon: number } | null;
}) {
  const [locations, setLocations] = useState<any[]>([])

  useEffect(() => {
    fetch("http://localhost:8000/api/monitored-locations")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setLocations(data)
      })
      .catch((err) => console.error("Failed to load monitored locations:", err))
  }, [])

  return (
    <>
      {locations.map((loc) => {
        const color = getRiskColor(loc.level);
        const isCritical = loc.level === "extreme" || loc.level === "high";

        return (
          <Fragment key={loc.id}>
            {loc.level === "extreme" && (
              <CircleMarker
                center={[loc.lat, loc.lon]}
                radius={16}
                pathOptions={{
                  color: color,
                  weight: 1.5,
                  fillColor: color,
                  fillOpacity: 0.2,
                  dashArray: "4, 4",
                }}
              />
            )}
            <CircleMarker
              center={[loc.lat, loc.lon]}
              radius={isCritical ? 9 : 6}
              pathOptions={{
                color: "#ffffff",
                weight: isCritical ? 2.5 : 1.5,
                fillColor: color,
                fillOpacity: 0.95,
              }}
              eventHandlers={{
                click: () => onCellClick(loc.lat, loc.lon),
              }}
            >
              {/* Permanent Black Badge for actively monitored city or primary epicenter */}
              {((monitoredLocation && Math.hypot(loc.lat - monitoredLocation.lat, loc.lon - monitoredLocation.lon) < 0.25) || (!monitoredLocation && loc.id === "rudraprayag")) ? (
                <Tooltip
                  permanent
                  direction="top"
                  offset={[0, -12]}
                  className="custom-district-badge"
                >
                  {loc.name}
                </Tooltip>
              ) : (
                <Tooltip direction="top" offset={[0, -8]} opacity={0.9}>
                  <div className="font-sans text-[11px] leading-tight">
                    <span className="font-bold text-slate-900">{loc.name}</span>
                    <span className="text-slate-500 block text-[9.5px]">{loc.state}</span>
                    <span className="font-bold" style={{ color }}>
                      Risk: {loc.overall_risk ? Math.round(loc.overall_risk * 100) : loc.flash_flood}%
                    </span>
                  </div>
                </Tooltip>
              )}

              {/* Clickable Popup with Live Backend Predictions */}
              <Popup>
                <div className="p-1 font-sans min-w-[200px] text-slate-900">
                  <div className="flex items-center justify-between border-b pb-1 mb-1.5">
                    <div>
                      <h4 className="font-bold text-[13px] leading-tight m-0 text-slate-900">{loc.name}</h4>
                      <span className="text-[10px] text-slate-500">{loc.state} · {loc.type}</span>
                    </div>
                    <span 
                      className="text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase text-white"
                      style={{ background: color }}
                    >
                      {loc.level}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11.5px] mb-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Flash flood:</span>
                      <strong className="text-slate-900">{loc.flash_flood}%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Cloudburst:</span>
                      <strong className="text-slate-900">{loc.cloudburst}%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Thunderstorm:</span>
                      <strong className="text-slate-900">{loc.thunderstorm}%</strong>
                    </div>
                    <div className="flex justify-between pt-1 border-t text-[10px] text-slate-500">
                      <span>ETA: <strong>{loc.eta}</strong></span>
                      <span>AI Conf: <strong>{loc.confidence}%</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => onCellClick(loc.lat, loc.lon)}
                    className="w-full py-1 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold transition-colors"
                  >
                    Sync Intelligence & XAI
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          </Fragment>
        );
      })}
    </>
  );
}

// ──────────────────────────────────────────────
// IOT SENSOR STATIONS
function IoTSensorLayer({ monitoredLocation }: { monitoredLocation?: { lat: number; lon: number } }) {
  const map = useMap()
  const iotLayerRef = useRef<any>(null)

  useEffect(() => {
    if (!map) return
    const layerGroup = (window as any).L.layerGroup()

    const lat = monitoredLocation?.lat ?? 30.28;
    const lon = monitoredLocation?.lon ?? 78.98;

    // Dynamically place ground AWS telemetry stations around current active sector
    const dynamicSensors = [
      { id: 'AWS-1', lat: lat + 0.035, lon: lon + 0.025, name: 'Upstream Micro-Catchment AWS', rain: 64.2, river: 2.8, status: 'critical' },
      { id: 'AWS-2', lat: lat - 0.028, lon: lon - 0.022, name: 'Central Sector Hydrology Gauge', rain: 38.5, river: 1.6, status: 'warning' },
      { id: 'AWS-3', lat: lat + 0.012, lon: lon - 0.045, name: 'Downstream Runoff Monitor', rain: 12.0, river: 0.8, status: 'normal' },
    ];

    dynamicSensors.forEach(sensor => {
      const color = sensor.status === 'critical' ? '#ef4444' : sensor.status === 'warning' ? '#eab308' : '#22c55e'
      
      const markerHtml = `
        <div style="
          width: 14px; height: 14px; 
          background: ${color}; 
          border: 2px solid white; 
          border-radius: 50%; 
          box-shadow: 0 0 10px ${color};
        "></div>
      `
      
      const icon = (window as any).L.divIcon({
        className: 'iot-sensor-icon',
        html: markerHtml,
        iconSize: [14, 14]
      })

      const marker = (window as any).L.marker([sensor.lat, sensor.lon], { icon })
      
      marker.bindTooltip(`
        <div style="font-family: Inter, sans-serif; min-width: 140px; background: rgba(15, 23, 42, 0.95); padding: 7px; border-radius: 6px; border: 1px solid #334155;">
          <div style="font-size: 9px; color: #94a3b8; font-weight: 800; text-transform: uppercase;">GROUND IOT SENSOR</div>
          <strong style="color: #fff; font-size: 12px;">${sensor.name}</strong>
          <div style="margin-top: 5px; font-size: 11px; display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Rainfall:</span> 
            <span style="color: #60a5fa; font-weight: 600;">${sensor.rain} mm/h</span>
          </div>
          <div style="margin-top: 3px; font-size: 11px; display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">River Stage:</span> 
            <span style="color: #eab308; font-weight: 600;">+${sensor.river} m</span>
          </div>
        </div>
      `, { className: 'iot-tooltip', direction: 'top', offset: [0, -10], opacity: 1 })
      
      layerGroup.addLayer(marker)
    })

    layerGroup.addTo(map)
    iotLayerRef.current = layerGroup

    return () => {
      if (iotLayerRef.current) map.removeLayer(iotLayerRef.current)
    }
  }, [map, monitoredLocation?.lat, monitoredLocation?.lon])

  return null
}

function ExactLocationMarker({ location, onCellClick }: { location?: { lat: number; lon: number } | null; onCellClick?: (lat: number, lon: number) => void }) {
  if (!location) return null;
  return (
    <>
      {/* Outer Animated Radar Pulse Wave */}
      <CircleMarker
        center={[location.lat, location.lon]}
        radius={32}
        pathOptions={{
          color: "#38bdf8",
          fillColor: "#0284c7",
          fillOpacity: 0.18,
          weight: 2,
          dashArray: "5, 5",
        }}
      />
      {/* Mid Glowing Halo */}
      <CircleMarker
        center={[location.lat, location.lon]}
        radius={18}
        pathOptions={{
          color: "#00f0ff",
          fillColor: "#38bdf8",
          fillOpacity: 0.35,
          weight: 1.5,
        }}
      />
      {/* Inner Target Core Marker */}
      <CircleMarker
        center={[location.lat, location.lon]}
        radius={8}
        pathOptions={{
          color: "#ffffff",
          fillColor: "#0284c7",
          fillOpacity: 1.0,
          weight: 3,
        }}
        eventHandlers={{
          click: () => onCellClick?.(location.lat, location.lon),
        }}
      >
        <Tooltip
          permanent
          direction="top"
          offset={[0, -14]}
          className="custom-district-badge"
        >
          📍 GPS Target ({location.lat.toFixed(5)}°N, {location.lon.toFixed(5)}°E)
        </Tooltip>
      </CircleMarker>
    </>
  );
}

function MapUpdater({ center, zoom = 15 }: { center: [number, number]; zoom?: number }) {
  const map = useMap()
  useEffect(() => {
    if (center && map) {
      map.flyTo(center, zoom, {
        duration: 1.8,
        easeLinearity: 0.25
      })
    }
  }, [center?.[0], center?.[1], zoom, map])
  return null
}

function ClickHandler({ onCellClick }: { onCellClick: (lat: number, lon: number) => void }) {
  const map = useMap()

  useEffect(() => {
    const handler = (e: any) => {
      onCellClick(
        parseFloat(e.latlng.lat.toFixed(2)),
        parseFloat(e.latlng.lng.toFixed(2))
      )
    }
    map.on('click', handler)
    return () => {
      map.off('click', handler)
    }
  }, [map, onCellClick])

  return null
}

export function LiveMap({ 
  heatmapData, 
  activeLayer, 
  mapMode, 
  onCellClick, 
  selectedCell, 
  monitoredLocation, 
  onMapReady,
  satelliteRevision = 0
}: LiveMapProps) {
  const center: [number, number] = monitoredLocation ? [monitoredLocation.lat, monitoredLocation.lon] : INDIA_CENTER;

  // Base Tile Layer (Handles 'Satellite View', 'Terrain 3D', 'Street Map')
  let tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  if (mapMode === "Terrain 3D") {
    tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}";
  } else if (mapMode === "Street Map") {
    tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  } else if (mapMode.toLowerCase().includes("satellite")) {
    tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <MapContainer 
        center={center} 
        zoom={8} 
        style={{ height: '100%', width: '100%', background: '#0b0f18', zIndex: 0 }}
        zoomControl={false}
      >
        {/* Base Tile Layer (Dynamic Swap on Mode Change) */}
        <TileLayer
          key={tileUrl}
          url={tileUrl}
          attribution='&copy; OpenStreetMap contributors, Esri, Maxar'
          maxZoom={18}
        />

        {/* Crisp Administrative Reference Boundaries & Places (State, District & Town labels everywhere in India) */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          opacity={0.6}
          maxZoom={18}
        />

        {/* INSAT-3DR Real Satellite Cloud Field */}
        <ImageOverlay
          key={`sat-overlay-${satelliteRevision}`}
          url={`http://localhost:8000/api/satellite/image?rev=${satelliteRevision}`}
          bounds={[[6.0, 66.0], [37.0, 97.0]]}
          opacity={0.35}
          zIndex={10}
        />

        {/* Live Multi-Hazard ConvLSTM Heatmap Field across entire India */}
        <HeatmapLayer data={heatmapData} activeLayer={activeLayer} />

        {/* All-India District & State Boundaries (White Dashed Vector Grids) */}
        <NationwideBoundariesLayer onCellClick={onCellClick} />

        {/* River Corridors */}
        <RiverLayer />

        {/* IoT Stations */}
        <IoTSensorLayer monitoredLocation={monitoredLocation} />

        {/* Nationwide Monitored Cities & Hotspots with Dynamic AI Risk Popups */}
        <BackendCitiesLayer onCellClick={onCellClick} monitoredLocation={monitoredLocation} />

        {/* Live Target Marker on Exact Coordinates */}
        <ExactLocationMarker location={monitoredLocation} onCellClick={onCellClick} />

        <MapUpdater center={center} />
        <ClickHandler onCellClick={onCellClick} />
        {onMapReady && <MapReadyNotifier onMapReady={onMapReady} />}
      </MapContainer>
    </div>
  )
}

function MapReadyNotifier({ onMapReady }: { onMapReady: (map: L.Map) => void }) {
  const map = useMap()
  useEffect(() => {
    if (map && onMapReady) {
      onMapReady(map)
    }
  }, [map, onMapReady])
  return null
}
