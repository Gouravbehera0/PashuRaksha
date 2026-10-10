import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Link } from 'react-router-dom'
import {
  ShieldAlert,
  Crosshair
} from 'lucide-react'
import type { VeterinaryCase } from '@/types'
import type { OutbreakCluster } from '@/services/risk/riskTypes'

// Ensure default icon paths for Leaflet
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Veterinary facility coordinates for GIS reference
export interface VetFacility {
  id: string
  name: string
  type: 'Hospital' | 'Dispensary' | 'Lab'
  latitude: number
  longitude: number
  village: string
}

const DEFAULT_VET_FACILITIES: VetFacility[] = [
  {
    id: 'fac-1',
    name: 'District Disease Diagnostic Laboratory (DDDL)',
    type: 'Lab',
    latitude: 25.3285,
    longitude: 82.9860,
    village: 'Varanasi Central'
  },
  {
    id: 'fac-2',
    name: 'Government Veterinary Hospital Shivpur',
    type: 'Hospital',
    latitude: 25.3520,
    longitude: 82.9640,
    village: 'Shivpur'
  },
  {
    id: 'fac-3',
    name: 'Sub-Divisional Veterinary Dispensary Rampur',
    type: 'Dispensary',
    latitude: 25.3090,
    longitude: 82.9590,
    village: 'Rampur Khurd'
  },
]

// Icon factory for cluster epicenter
function createClusterIcon(cluster: OutbreakCluster): L.DivIcon {
  const isCritical = cluster.risk_level === 'CRITICAL' || cluster.cluster_score >= 75
  const isHigh = cluster.risk_level === 'HIGH' || cluster.cluster_score >= 60

  const pulseColor = isCritical ? '#C62828' : isHigh ? '#D97706' : '#E0A11A'
  const centerColor = isCritical ? '#7B1818' : isHigh ? '#92400E' : '#B45309'

  const html = `
    <div style="position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background-color: ${pulseColor}33; border: 2px dashed ${pulseColor}; animation: pulse 2s infinite;"></div>
      <div style="width: 22px; height: 22px; border-radius: 2px; background-color: ${centerColor}; border: 2px solid #FFFFFF; color: white; display: flex; align-items: center; justify-content: center; font-family: monospace; font-size: 10px; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.4);">
        ${cluster.case_count}
      </div>
    </div>
  `

  return L.divIcon({
    html,
    className: 'cluster-epicenter-marker',
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -20],
  })
}

// Icon factory for individual cases
function createCaseIcon(c: VeterinaryCase): L.DivIcon {
  const isCritical = c.priority === 'CRITICAL' || c.reported_severity === 'Severe'
  const isHigh = c.priority === 'HIGH'
  const bg = isCritical ? '#C62828' : isHigh ? '#D97706' : '#2E7D32'

  const html = `
    <div style="background-color: ${bg}; border: 1.5px solid #FFFFFF; border-radius: 2px; padding: 2px 4px; font-family: monospace; font-size: 9px; font-weight: bold; color: white; display: flex; align-items: center; gap: 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.3); cursor: pointer;">
      <span style="width: 4px; height: 4px; border-radius: 50%; background-color: white;"></span>
      <span>${c.case_number ? c.case_number.slice(-4) : 'CASE'}</span>
    </div>
  `

  return L.divIcon({
    html,
    className: 'gis-case-marker',
    iconSize: [48, 18],
    iconAnchor: [24, 9],
    popupAnchor: [0, -10],
  })
}

// Icon factory for veterinary facilities
function createFacilityIcon(type: VetFacility['type']): L.DivIcon {
  const bg = type === 'Lab' ? '#102A43' : type === 'Hospital' ? '#123C2A' : '#1B5E3C'
  const letter = type === 'Lab' ? 'LAB' : type === 'Hospital' ? 'HOSP' : 'DISP'

  const html = `
    <div style="background-color: ${bg}; border: 1.5px solid #F7F5EE; border-radius: 2px; padding: 2px 4px; font-family: monospace; font-size: 8px; font-weight: bold; color: #F7F5EE; box-shadow: 0 2px 4px rgba(0,0,0,0.35);">
      ${letter}
    </div>
  `

  return L.divIcon({
    html,
    className: 'gis-fac-marker',
    iconSize: [36, 18],
    iconAnchor: [18, 9],
    popupAnchor: [0, -10],
  })
}

// Recenter Map Controller
function MapRecenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 })
  }, [center, zoom, map])
  return null
}

interface OutbreakSurveillanceMapProps {
  clusters: OutbreakCluster[]
  cases?: VeterinaryCase[]
  facilities?: VetFacility[]
  selectedClusterId?: string
  onSelectCluster?: (cluster: OutbreakCluster) => void
  height?: string
}

export const OutbreakSurveillanceMap: React.FC<OutbreakSurveillanceMapProps> = ({
  clusters,
  cases = [],
  facilities = DEFAULT_VET_FACILITIES,
  selectedClusterId,
  onSelectCluster,
  height = '540px'
}) => {
  const mapRef = useRef<L.Map | null>(null)

  // Layer toggles
  const [showClusters, setShowClusters] = useState(true)
  const [showCases, setShowCases] = useState(true)
  const [showFacilities, setShowFacilities] = useState(true)
  const [showCordon, setShowCordon] = useState(true)

  // Selected cluster focus
  const selectedCluster = clusters.find((c) => c.id === selectedClusterId)

  // Map view coordinates (defaults to cluster center or Varanasi)
  const initialCenter: [number, number] = selectedCluster
    ? [selectedCluster.center_latitude, selectedCluster.center_longitude]
    : clusters.length > 0
    ? [clusters[0].center_latitude, clusters[0].center_longitude]
    : [25.3176, 82.9739]

  const [mapCenter, setMapCenter] = useState<[number, number]>(initialCenter)
  const [mapZoom, setMapZoom] = useState<number>(selectedCluster ? 13 : 12)

  // When selected cluster changes externally, re-center
  useEffect(() => {
    if (selectedCluster) {
      setMapCenter([selectedCluster.center_latitude, selectedCluster.center_longitude])
      setMapZoom(13)
    }
  }, [selectedClusterId])

  const handleResetView = () => {
    if (clusters.length > 0) {
      setMapCenter([clusters[0].center_latitude, clusters[0].center_longitude])
      setMapZoom(12)
    } else {
      setMapCenter([25.3176, 82.9739])
      setMapZoom(12)
    }
  }

  return (
    <div className="relative w-full border border-stone-300 rounded-[2px] overflow-hidden shadow-xs flex flex-col font-sans bg-stone-100">
      {/* Top GIS Command Bar */}
      <div className="bg-[#102A43] text-white px-3 sm:px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono border-b border-stone-300 select-none z-10 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-[#F7F5EE] flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-[#E0A11A]" />
            GIS OUTBREAK SURVEILLANCE &middot; स्थानिक प्रकोप निगरानी
          </span>
          <span className="text-white/40 hidden sm:inline">|</span>
          <span className="text-white/80 text-[11px] hidden md:inline">
            EPSG:4326 &middot; 7-DAY EPIDEMIOLOGICAL WINDOW
          </span>
        </div>

        {/* Map Layer Toggles */}
        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          <button
            type="button"
            onClick={() => setShowClusters(!showClusters)}
            className={`px-2 py-0.5 rounded-[1px] border cursor-pointer font-mono transition-colors ${
              showClusters
                ? 'bg-[#C62828] text-white border-[#C62828]'
                : 'bg-white/10 text-white/60 border-white/20'
            }`}
          >
            ● Clusters ({clusters.length})
          </button>

          <button
            type="button"
            onClick={() => setShowCases(!showCases)}
            className={`px-2 py-0.5 rounded-[1px] border cursor-pointer font-mono transition-colors ${
              showCases
                ? 'bg-[#1B5E3C] text-white border-[#1B5E3C]'
                : 'bg-white/10 text-white/60 border-white/20'
            }`}
          >
            ● Cases ({cases.length})
          </button>

          <button
            type="button"
            onClick={() => setShowFacilities(!showFacilities)}
            className={`px-2 py-0.5 rounded-[1px] border cursor-pointer font-mono transition-colors ${
              showFacilities
                ? 'bg-[#8A6A3D] text-white border-[#8A6A3D]'
                : 'bg-white/10 text-white/60 border-white/20'
            }`}
          >
            ● Dispensaries ({facilities.length})
          </button>

          <button
            type="button"
            onClick={() => setShowCordon(!showCordon)}
            className={`px-2 py-0.5 rounded-[1px] border cursor-pointer font-mono transition-colors ${
              showCordon
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white/10 text-white/60 border-white/20'
            }`}
          >
            5km Ring Cordon
          </button>

          <button
            type="button"
            onClick={handleResetView}
            className="px-2 py-0.5 bg-white/15 hover:bg-white/25 border border-white/25 text-[#F7F5EE] rounded-[1px] cursor-pointer"
            title="Reset to cluster bounds"
          >
            <Crosshair size={12} className="inline mr-1" />
            Recenter
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="relative w-full" style={{ height }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          className="z-0"
        >
          <MapRecenter center={mapCenter} zoom={mapZoom} />

          {/* CartoDB Positron clean GIS tile layer */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />

          {/* Render Clusters & Buffer Circles */}
          {showClusters &&
            clusters.map((cluster) => {
              const isSelected = cluster.id === selectedClusterId
              const isCritical = cluster.risk_level === 'CRITICAL' || cluster.cluster_score >= 75
              const isHigh = cluster.risk_level === 'HIGH' || cluster.cluster_score >= 60

              const circleColor = isCritical ? '#C62828' : isHigh ? '#D97706' : '#E0A11A'
              const radiusMeters = (cluster.radius_km || 3) * 1000

              return (
                <React.Fragment key={cluster.id}>
                  {/* Epicenter Radius Circle */}
                  <Circle
                    center={[cluster.center_latitude, cluster.center_longitude]}
                    radius={radiusMeters}
                    pathOptions={{
                      color: circleColor,
                      fillColor: circleColor,
                      fillOpacity: isSelected ? 0.25 : 0.15,
                      weight: isSelected ? 3 : 2,
                      dashArray: '6, 6',
                    }}
                    eventHandlers={{
                      click: () => onSelectCluster && onSelectCluster(cluster),
                    }}
                  />

                  {/* 5km Containment Buffer Cordon Ring */}
                  {showCordon && (
                    <Circle
                      center={[cluster.center_latitude, cluster.center_longitude]}
                      radius={5000} // 5 km containment cordon
                      pathOptions={{
                        color: '#B45309',
                        fillColor: '#B45309',
                        fillOpacity: 0.04,
                        weight: 1.5,
                        dashArray: '10, 8',
                      }}
                    />
                  )}

                  {/* Cluster Epicenter Marker */}
                  <Marker
                    position={[cluster.center_latitude, cluster.center_longitude]}
                    icon={createClusterIcon(cluster)}
                    eventHandlers={{
                      click: () => onSelectCluster && onSelectCluster(cluster),
                    }}
                  >
                    <Popup className="pr-gis-popup">
                      <div className="font-sans text-xs space-y-1.5 p-1 max-w-[260px]">
                        <div className="flex items-center justify-between border-b border-stone-200 pb-1">
                          <span className="font-mono font-bold text-[#102A43]">
                            {cluster.cluster_code}
                          </span>
                          <span
                            className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded text-white ${
                              isCritical ? 'bg-[#C62828]' : isHigh ? 'bg-[#D97706]' : 'bg-[#E0A11A]'
                            }`}
                          >
                            {cluster.risk_level} ({cluster.cluster_score}/100)
                          </span>
                        </div>

                        <p className="font-bold text-stone-900 leading-snug">
                          {cluster.cluster_name}
                        </p>

                        <div className="text-[11px] text-stone-600 space-y-0.5 font-mono">
                          <div>&bull; Cases: <strong>{cluster.case_count}</strong></div>
                          <div>&bull; Epicenter Radius: <strong>{cluster.radius_km} km</strong></div>
                          <div>&bull; Villages: <strong>{cluster.affected_villages.join(', ')}</strong></div>
                          <div>&bull; Status: <strong>{cluster.status}</strong></div>
                        </div>

                        <div className="pt-1.5 border-t border-stone-200 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => onSelectCluster && onSelectCluster(cluster)}
                            className="text-[11px] font-mono font-bold text-[#1B5E3C] hover:underline"
                          >
                            VIEW INVESTIGATION &rarr;
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              )
            })}

          {/* Render Individual Cases */}
          {showCases &&
            cases
              .filter((c) => c.latitude && c.longitude)
              .map((c) => (
                <Marker
                  key={c.id}
                  position={[c.latitude!, c.longitude!]}
                  icon={createCaseIcon(c)}
                >
                  <Popup className="pr-gis-popup">
                    <div className="font-sans text-xs space-y-1.5 p-1 max-w-[240px]">
                      <div className="flex items-center justify-between border-b border-stone-200 pb-1">
                        <span className="font-mono font-bold text-[#102A43]">
                          CASE #{c.case_number}
                        </span>
                        <span className="font-mono text-[10px] text-stone-500">
                          {c.priority}
                        </span>
                      </div>

                      <div>
                        <p className="font-semibold text-stone-900">
                          {c.animal?.animal_tag} &middot; {c.animal?.animal_type}
                        </p>
                        <p className="text-[11px] text-stone-600">
                          {c.village || 'Rampur Khurd'}, {c.district || 'Varanasi'}
                        </p>
                      </div>

                      <div className="text-[11px] text-[#C62828] font-medium">
                        Symptoms: {c.symptoms.join(', ')}
                      </div>

                      <div className="pt-1 border-t border-stone-200">
                        <Link
                          to={`/vet/cases/${c.id}`}
                          className="font-mono font-bold text-[11px] text-[#1B5E3C] hover:underline block"
                        >
                          OPEN CASE DOSSIER &rarr;
                        </Link>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

          {/* Render Veterinary Facilities */}
          {showFacilities &&
            facilities.map((fac) => (
              <Marker
                key={fac.id}
                position={[fac.latitude, fac.longitude]}
                icon={createFacilityIcon(fac.type)}
              >
                <Popup className="pr-gis-popup">
                  <div className="font-sans text-xs p-1 max-w-[220px]">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#8A6A3D] font-bold block">
                      VETERINARY INFRASTRUCTURE &middot; {fac.type.toUpperCase()}
                    </span>
                    <p className="font-bold text-[#102A43] text-xs mt-0.5">
                      {fac.name}
                    </p>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      Location: {fac.village}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>

      {/* Bottom GIS Map Legend Strip */}
      <div className="bg-[#FAF9F5] border-t border-stone-200 px-3 py-1.5 flex items-center justify-between gap-3 text-[10px] font-mono text-stone-600 select-none">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-bold text-[#102A43]">MAP LEGEND:</span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C62828] inline-block"></span>
            <span>Cluster Epicenter</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block"></span>
            <span>5km Containment Buffer</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#1B5E3C] inline-block"></span>
            <span>Clinical Case</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#102A43] inline-block"></span>
            <span>Veterinary Dispensary / Lab</span>
          </span>
        </div>

        <span className="text-stone-400 hidden md:inline">
          CARTOGRAPHIC BASE: OPENSTREETMAP / CARTO TILES
        </span>
      </div>
    </div>
  )
}
