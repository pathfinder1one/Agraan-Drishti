import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'

// Ensure L is on window for plugins if not already
if (typeof window !== 'undefined') {
  window.L = L
}

const INDIA_CENTER = [30.28, 78.98] // Focused on Uttarakhand for dramatic effect
const INDIA_ZOOM = 8

function HeatmapLayer({ data, activeLayer }) {
  const map = useMap()
  const heatLayerRef = useRef(null)

  useEffect(() => {
    if (!map || !data || data.length === 0) return

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current)
    }

    // Filter noise and convert to [lat, lon, intensity]
    // We scale intensity slightly so the visual colors pop exactly like the mockup
    const points = data.filter(p => p.value > 0.1).map(p => [p.lat, p.lon, p.value * 1.5])

    const gradients = {
      thunderstorm: { 0.4: '#3b82f6', 0.6: '#eab308', 0.8: '#f97316', 1.0: '#ef4444' }, // Blue -> Yellow -> Orange -> Red
      cloudburst: { 0.4: '#6366f1', 0.6: '#a855f7', 0.8: '#ec4899', 1.0: '#ef4444' }, // Purple -> Pink -> Red
      flash_flood: { 0.2: '#3b82f6', 0.4: '#22c55e', 0.7: '#eab308', 1.0: '#ef4444' } // Blue -> Green -> Yellow -> Red (Classic Mockup)
    }

    if (window.L && window.L.heatLayer) {
      const heat = window.L.heatLayer(points, {
        radius: 35,
        blur: 25,
        maxZoom: 10,
        max: 1.0,
        gradient: gradients[activeLayer] || gradients.flash_flood
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

function MapUpdater({ center }) {
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

function ClickHandler({ onCellClick }) {
  const map = useMap()

  useEffect(() => {
    const handler = (e) => {
      onCellClick(
        parseFloat(e.latlng.lat.toFixed(2)),
        parseFloat(e.latlng.lng.toFixed(2))
      )
    }
    map.on('click', handler)
    return () => map.off('click', handler)
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
  const iotLayerRef = useRef(null)

  useEffect(() => {
    if (!map) return
    const layerGroup = window.L.layerGroup()

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
      
      const icon = window.L.divIcon({
        className: 'iot-sensor-icon',
        html: markerHtml,
        iconSize: [16, 16]
      })

      const marker = window.L.marker([sensor.lat, sensor.lon], { icon })
      
      marker.bindTooltip(`
        <div style="font-family: Inter; min-width: 150px;">
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
      `, { className: 'iot-tooltip', direction: 'top', offset: [0, -10] })
      
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

export default function CommandMap({ heatmapData, activeLayer, mapStyle, onCellClick, selectedCell, monitoredLocation }) {
  return (
    <div style={{ width: '100%', height: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer 
        center={monitoredLocation ? [monitoredLocation.lat, monitoredLocation.lon] : INDIA_CENTER} 
        zoom={9} 
        style={{ height: '100%', width: '100%', background: '#020617' }}
        zoomControl={false}
      >
        <TileLayer
          url={mapStyle === 'satellite' 
            ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"}
          attribution='Tiles &copy; Esri'
          maxZoom={18}
        />
        <HeatmapLayer data={heatmapData} activeLayer={activeLayer} />
        <MapUpdater center={monitoredLocation ? [monitoredLocation.lat, monitoredLocation.lon] : INDIA_CENTER} />
        <ClickHandler onCellClick={onCellClick} />
        {selectedCell && <TileLayer url="" />}
      </MapContainer>
    </div>
  )
}
