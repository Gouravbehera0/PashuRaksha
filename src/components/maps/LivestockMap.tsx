import React, { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { DEMO_MAP_MARKERS } from '@/data/demo'
import type { MapMarker, RiskLevel } from '@/types'

// Fix Leaflet default icon path issue with Vite bundler
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom SVG marker icons for clinical command center
function createRiskIcon(level: RiskLevel | undefined, type: MapMarker['type']): L.DivIcon {
  const colors: Record<RiskLevel, string> = {
    low: '#2E7D32',
    medium: '#E0A11A',
    high: '#C62828',
    critical: '#7B1818',
  }

  const color = level ? colors[level] : '#1B5E3C'
  const isOutbreak = type === 'outbreak_zone'
  const isVet = type === 'vet_center'

  const svg = isVet
    ? `<div style="background-color: #123C2A; border: 2px solid #F7F5EE; border-radius: 2px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 2v12M2 8h12" stroke="#F7F5EE" stroke-width="2.5" stroke-linecap="square"/>
        </svg>
      </div>`
    : isOutbreak
    ? `<div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background-color: rgba(198, 40, 40, 0.25); border: 2px dashed #C62828; animation: pulse 2s infinite;"></div>
        <div style="width: 14px; height: 14px; border-radius: 50%; background-color: #7B1818; border: 2px solid #FFFFFF;"></div>
      </div>`
    : `<div style="background-color: ${color}; border: 1.5px solid #FFFFFF; border-radius: 2px; padding: 2px 5px; font-family: monospace; font-size: 9px; font-weight: bold; color: white; display: flex; align-items: center; gap: 3px; box-shadow: 0 2px 4px rgba(0,0,0,0.25);">
        <span style="width: 5px; height: 5px; border-radius: 50%; background-color: white;"></span>
        <span>${level ? level.toUpperCase().slice(0, 4) : 'CASE'}</span>
      </div>`

  return L.divIcon({
    html: svg,
    className: 'pr-gis-marker',
    iconSize: isOutbreak ? [34, 34] : isVet ? [28, 28] : [56, 20],
    iconAnchor: isOutbreak ? [17, 17] : isVet ? [14, 14] : [28, 10],
    popupAnchor: [0, -14],
  })
}

// Map controller to set initial bounds to India
function MapController() {
  const map = useMap()
  useEffect(() => {
    map.setView([22.8, 82.0], 5)
  }, [map])
  return null
}

interface LivestockMapProps {
  markers?: MapMarker[]
  height?: string
}

export function LivestockMap({ markers = DEMO_MAP_MARKERS, height = '100%' }: LivestockMapProps) {
  const mapRef = useRef<L.Map | null>(null)

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* GIS Command Center Sub-Header Overlay */}
      <div className="bg-[#102A43] text-white px-3 py-1.5 flex items-center justify-between text-[10px] font-mono border-b border-stone-300 select-none z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#F7F5EE]">GIS COMMAND ENGINE</span>
          <span className="text-white/40">|</span>
          <span className="text-white/70">WGS84 &middot; EPSG:4326</span>
          <span className="hidden sm:inline text-white/40">|</span>
          <span className="hidden sm:inline text-white/70">NATIONAL EXTENT</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#8A6A3D] font-bold">● BUFFER: 50KM</span>
          <span className="text-white/40">|</span>
          <span className="bg-[#C62828] text-white px-1 py-0.2 rounded-[1px] font-bold font-mono">4 ZONES</span>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="flex-1 w-full relative">
        <MapContainer
          center={[22.8, 82.0]}
          zoom={5}
          style={{ height, width: '100%', minHeight: '300px' }}
          ref={mapRef}
          aria-label="National Livestock Disease Surveillance GIS Map"
          className="z-0"
        >
          <MapController />

          {/* Clean Cartographic Base Tiles */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            className="map-tiles"
          />

          {/* Render Epidemiological Markers & Buffers */}
          {markers.map((marker) => (
            <React.Fragment key={marker.id}>
              {/* Outbreak Radial Containment Buffer */}
              {marker.type === 'outbreak_zone' && (
                <Circle
                  center={[marker.lat, marker.lng]}
                  radius={50000}
                  pathOptions={{
                    color: '#7B1818',
                    fillColor: '#C62828',
                    fillOpacity: 0.12,
                    weight: 2,
                    dashArray: '5 5',
                  }}
                />
              )}

              <Marker
                position={[marker.lat, marker.lng]}
                icon={createRiskIcon(marker.risk_level, marker.type)}
              >
                <Popup className="leaflet-popup-pashuraksha">
                  <div className="p-1 min-w-[180px] font-sans">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-1 mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-[#102A43]">
                        {marker.type === 'vet_center' ? 'VET FACILITY' : marker.type === 'outbreak_zone' ? 'CONTAINMENT ZONE' : 'EPIDEMIOLOGICAL CASE'}
                      </span>
                      <span className="text-[9px] font-mono bg-stone-100 text-stone-600 px-1 py-0.2 rounded-[1px]">
                        DEMO
                      </span>
                    </div>

                    <p className="font-bold text-xs text-[#102A43] leading-tight">
                      {marker.label}
                    </p>

                    {marker.district && (
                      <p className="text-[11px] text-stone-600 mt-0.5">
                        District Jurisdiction: <span className="font-semibold text-stone-900">{marker.district}</span>
                      </p>
                    )}

                    {marker.risk_level && (
                      <div className="mt-2 pt-1 border-t border-stone-100 flex items-center justify-between">
                        <span className="text-[10px] text-stone-500 font-mono">Triage Status:</span>
                        <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded-[1px] ${
                          marker.risk_level === 'critical' ? 'bg-[#7B1818] text-white' :
                          marker.risk_level === 'high' ? 'bg-[#FDF0EE] text-[#C62828] border border-[#C62828]/40' :
                          marker.risk_level === 'medium' ? 'bg-[#FFF8E6] text-[#8C5D00] border border-[#E0A11A]/40' :
                          'bg-[#EBF5EE] text-[#1B5E3C] border border-[#2E7D32]/40'
                        }`}>
                          {marker.risk_level} Risk
                        </span>
                      </div>
                    )}

                    <div className="mt-2 text-[9px] font-mono text-stone-400 border-t border-stone-100 pt-1 flex justify-between">
                      <span>LAT: {marker.lat.toFixed(4)}°</span>
                      <span>LNG: {marker.lng.toFixed(4)}°</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}
        </MapContainer>
      </div>

      {/* GIS Status Footer Strip */}
      <div className="bg-stone-100 text-stone-600 px-3 py-1 flex items-center justify-between text-[9px] font-mono border-t border-stone-300 shrink-0">
        <span>CARTOGRAPHY: OpenStreetMap &middot; NADRS INTEGRATION READY</span>
        <span className="text-stone-500">GIS REFRESH: REAL-TIME (POLLING 60S)</span>
      </div>
    </div>
  )
}
