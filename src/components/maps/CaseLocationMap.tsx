import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet marker icon urls
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface CaseLocationMapProps {
  latitude?: number
  longitude?: number
  animalTag?: string
  village?: string
  district?: string
  height?: string
}

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], 13)
  }, [lat, lng, map])
  return null
}

const animalIcon = L.divIcon({
  html: `<div style="background-color: #C62828; border: 2px solid #FFFFFF; border-radius: 2px; padding: 2px 6px; font-family: monospace; font-size: 9px; font-bold; color: white; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
    <span style="width: 6px; height: 6px; border-radius: 50%; background-color: #FFFFFF; animation: pulse 1.5s infinite;"></span>
    <span>CASE LOCATION</span>
  </div>`,
  className: 'pr-case-marker',
  iconSize: [96, 22],
  iconAnchor: [48, 11],
  popupAnchor: [0, -12],
})

const hospitalIcon = L.divIcon({
  html: `<div style="background-color: #123C2A; border: 2px solid #8BC34A; border-radius: 2px; padding: 2px 6px; font-family: monospace; font-size: 9px; font-bold; color: white; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
    <span style="color: #8BC34A; font-weight: 900;">+</span>
    <span>VET CLINIC (2.4 km)</span>
  </div>`,
  className: 'pr-vet-marker',
  iconSize: [115, 22],
  iconAnchor: [57, 11],
  popupAnchor: [0, -12],
})

export function CaseLocationMap({
  latitude = 25.3176,
  longitude = 82.9739,
  animalTag = 'Animal',
  village = 'Rampur Khurd',
  district = 'Varanasi',
  height = '240px',
}: CaseLocationMapProps) {
  // Nearest vet hospital coordinates (offset slightly for clear visual distinction)
  const hospitalLat = latitude + 0.012
  const hospitalLng = longitude + 0.008

  return (
    <div className="w-full rounded-[2px] overflow-hidden border border-stone-300 relative shadow-xs" style={{ height }}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <MapRecenter lat={latitude} lng={longitude} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Animal Case Marker */}
        <Marker position={[latitude, longitude]} icon={animalIcon}>
          <Popup>
            <div className="text-xs p-1 font-sans">
              <strong className="text-[#102A43] font-mono block">{animalTag}</strong>
              <span className="text-stone-600 block mt-0.5">Village: {village}, {district}</span>
              <span className="text-[10px] font-mono text-stone-500 block mt-1">
                GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </span>
            </div>
          </Popup>
        </Marker>

        {/* Nearest Veterinary Hospital Marker */}
        <Marker position={[hospitalLat, hospitalLng]} icon={hospitalIcon}>
          <Popup>
            <div className="text-xs p-1 font-sans">
              <strong className="text-[#123C2A] block">Sadar Veterinary Hospital &amp; MVU Base</strong>
              <span className="text-stone-600 block mt-0.5">Primary Triage &amp; Diagnostic Dispatch</span>
              <span className="text-[10px] font-mono text-[#1B5E3C] font-bold block mt-1">
                Distance: ~2.4 km &middot; ETA: 12 mins
              </span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
