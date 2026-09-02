import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'

// Ensure L is on window for plugins if not already
if (typeof window !== 'undefined') {
  (window as any).L = L
}

const INDIA_CENTER = [30.28, 78.98] as [number, number] // Focused on Uttarakhand

interface LiveMapProps {
  heatmapData: any[];
  activeLayer: string;
  mapMode: string;
  onCellClick: (lat: number, lon: number) => void;
  selectedCell?: { lat: number; lon: number } | null;
  monitoredLocation?: { lat: number; lon: number } | null;
}

function HeatmapLayer({ data, activeLayer }: { data: any[], activeLayer: string }) {
  const map = useMap()
  const heatLayerRef = useRef<any>(null)

  useEffect(() => {
    if (!map || !data || data.length === 0) return

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current)
    }

    const points = data.map(p => [p.lat, p.lon, p.value])

    const gradients: Record<string, any> = {
      thunderstorm: { 0.1: '#0000ff', 0.3: '#00ff00', 0.5: '#ffff00', 0.7: '#ffa500', 0.85: '#ff0000', 0.95: '#800080', 1.0: '#ffffff' },
      cloudburst:   { 0.1: '#0000ff', 0.3: '#00ff00', 0.5: '#ffff00', 0.7: '#ffa500', 0.85: '#ff0000', 0.95: '#800080', 1.0: '#ffffff' },
      flash_flood:  { 0.1: '#0000ff', 0.3: '#00ff00', 0.5: '#ffff00', 0.7: '#ffa500', 0.85: '#ff0000', 0.95: '#800080', 1.0: '#ffffff' }
    }

    // fallback to old name mapping if needed
    let layerKey = activeLayer.toLowerCase().replace(' ', '_');
    if (!gradients[layerKey]) layerKey = 'flash_flood';

    if ((window as any).L && (window as any).L.heatLayer) {
      const heat = (window as any).L.heatLayer(points, {
        radius: 35,
        blur: 25,
        maxZoom: 12,
        max: 3.5,
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
  }, [data, activeLayer, map])

  return null
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    if (center && map) {
      map.flyTo(center, 9, {
        duration: 2.0,
        easeLinearity: 0.25
      })
    }
  }, [center?.[0], center?.[1], map])
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

const IOT_SENSORS = [
  { id: 'AWS-1', lat: 30.73, lon: 79.06, name: 'Kedarnath AWS', rain: 84.2, river: 4.5, status: 'critical' },
  { id: 'AWS-2', lat: 30.28, lon: 78.98, name: 'Rudraprayag AWS', rain: 45.1, river: 2.1, status: 'warning' },
  { id: 'AWS-3', lat: 30.08, lon: 78.26, name: 'Rishikesh AWS', rain: 12.0, river: 1.2, status: 'normal' },
]

function IoTSensorLayer() {
  const map = useMap()
  const iotLayerRef = useRef<any>(null)

  useEffect(() => {
    if (!map) return
    const layerGroup = (window as any).L.layerGroup()

    IOT_SENSORS.forEach(sensor => {
      const color = sensor.status === 'critical' ? '#ef4444' : sensor.status === 'warning' ? '#eab308' : '#22c55e'
      
      const markerHtml = `
        <div style="
          width: 16px; height: 16px; 
          background: ${color}; 
          border: 2px solid white; 
          border-radius: 50%; 
          box-shadow: 0 0 10px ${color};
          animation: pulse-border 2s infinite;
        "></div>
      `
      
      const icon = (window as any).L.divIcon({
        className: 'iot-sensor-icon',
        html: markerHtml,
        iconSize: [16, 16]
      })

      const marker = (window as any).L.marker([sensor.lat, sensor.lon], { icon })
      
      marker.bindTooltip(`
        <div style="font-family: Inter, sans-serif; min-width: 150px; background: rgba(15, 23, 42, 0.9); padding: 8px; border-radius: 8px; border: 1px solid #334155;">
          <div style="font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase;">GROUND TRUTH IOT</div>
          <strong style="color: #fff; font-size: 13px;">${sensor.name}</strong><br>
          <div style="margin-top: 8px; font-size: 12px; display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Rainfall:</span> 
            <span style="color: #60a5fa; font-weight: 600;">${sensor.rain} mm/hr</span>
          </div>
          <div style="margin-top: 4px; font-size: 12px; display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">River Level:</span> 
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
  }, [map])

  return null
}

export function LiveMap({ heatmapData, activeLayer, mapMode, onCellClick, selectedCell, monitoredLocation }: LiveMapProps) {
  const center: [number, number] = monitoredLocation ? [monitoredLocation.lat, monitoredLocation.lon] : INDIA_CENTER;

  // Decide Tile Layer
  let tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  if (mapMode === "Street Map") {
    tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  } else if (mapMode === "Terrain 3D") {
    tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}";
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <MapContainer 
        center={center} 
        zoom={9} 
        style={{ height: '100%', width: '100%', background: '#0b0f18', zIndex: 0 }}
        zoomControl={false}
      >
        <TileLayer
          url={tileUrl}
          attribution='&copy; OpenStreetMap contributors, Esri'
          maxZoom={18}
        />
        <HeatmapLayer data={heatmapData} activeLayer={activeLayer} />
        <IoTSensorLayer />
        <MapUpdater center={center} />
        <ClickHandler onCellClick={onCellClick} />
      </MapContainer>
    </div>
  )
}
