// ============================================================
// PASHURAKSHA (पशुरक्षा) — INTERACTIVE GIS MAP CANVAS
// Stage 8: Leaflet Map Canvas with Case Markers, Clusters & Heatmap
// Standard: OpenStreetMap WGS-84 / GIGW High Contrast & Privacy Safe
// "Detect Early. Prevent Outbreaks. Protect Livestock."
// ============================================================

import { useEffect, useRef } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { GisCaseFeature, GisFacility, GisHeatmapPoint } from '@/services/gis/gisService'
import type { OutbreakCluster } from '@/services/risk/riskTypes'
import type { AnomalyDetectionWarning } from '@/lib/intelligence/intelligenceTypes'
import type { IoTDevice } from '@/lib/iot'

// Fix Leaflet marker icon asset paths
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Factory for Custom Case Markers
function createCaseDivIcon(feature: GisCaseFeature, isSelected: boolean): L.DivIcon {
  let bg = '#757575'
  let label = 'UNASSESSED'

  if (feature.isResolved) {
    bg = '#2E7D32'
    label = 'RESOLVED'
  } else {
    switch (feature.riskLevel) {
      case 'CRITICAL':
        bg = '#C62828'
        label = 'CRIT'
        break
      case 'HIGH':
        bg = '#E65100'
        label = 'HIGH'
        break
      case 'MEDIUM':
        bg = '#E0A11A'
        label = 'MED'
        break
      case 'LOW':
        bg = '#2E7D32'
        label = 'LOW'
        break
      default:
        bg = '#757575'
        label = 'CASE'
    }
  }

  const borderStyle = isSelected ? 'border: 2px solid #FFFFFF; outline: 3px solid #102A43;' : 'border: 1.5px solid #FFFFFF;'
  const pulseHtml =
    feature.riskLevel === 'CRITICAL' && !feature.isResolved
      ? `<span style="width: 5px; height: 5px; border-radius: 50%; background-color: white; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>`
      : `<span style="width: 4px; height: 4px; border-radius: 50%; background-color: white;"></span>`

  const html = `
    <div style="background-color: ${bg}; ${borderStyle} border-radius: 2px; padding: 2px 5px; font-family: monospace; font-size: 9px; font-weight: bold; color: white; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.35); cursor: pointer; white-space: nowrap;">
      ${pulseHtml}
      <span>${feature.caseNumber.slice(-4)} &bull; ${label}</span>
    </div>
  `

  return L.divIcon({
    html,
    className: 'pr-gis-case-marker',
    iconSize: [68, 20],
    iconAnchor: [34, 10],
    popupAnchor: [0, -12],
  })
}

// Factory for Outbreak Cluster Epicenter Marker
function createClusterDivIcon(cluster: OutbreakCluster, isSelected: boolean): L.DivIcon {
  const isCritical = cluster.risk_level === 'CRITICAL' || cluster.cluster_score >= 75
  const isHigh = cluster.risk_level === 'HIGH' || cluster.cluster_score >= 60

  const pulseColor = isCritical ? '#C62828' : isHigh ? '#E65100' : '#E0A11A'
  const centerColor = isCritical ? '#7B1818' : isHigh ? '#92400E' : '#B45309'
  const border = isSelected ? 'border: 2.5px solid #FFFFFF; outline: 3px solid #102A43;' : 'border: 2px solid #FFFFFF;'

  const html = `
    <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <div style="position: absolute; width: 42px; height: 42px; border-radius: 50%; background-color: ${pulseColor}33; border: 2px dashed ${pulseColor}; animation: pulse 2s infinite;"></div>
      <div style="width: 24px; height: 24px; border-radius: 2px; background-color: ${centerColor}; ${border} color: white; display: flex; align-items: center; justify-content: center; font-family: monospace; font-size: 10px; font-weight: 900; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">
        ${cluster.case_count}
      </div>
    </div>
  `

  return L.divIcon({
    html,
    className: 'pr-cluster-epicenter',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  })
}

// Factory for Veterinary Facility Marker
function createFacilityDivIcon(facility: GisFacility): L.DivIcon {
  const isLab = facility.type === 'Lab'
  const isHospital = facility.type === 'Hospital'
  const bg = isLab ? '#102A43' : isHospital ? '#123C2A' : '#1B5E3C'
  const symbol = isLab ? 'LAB' : isHospital ? 'VET' : 'DISP'

  const html = `
    <div style="background-color: ${bg}; border: 1.5px solid #F7F5EE; border-radius: 2px; padding: 1.5px 5px; font-family: monospace; font-size: 8.5px; font-weight: bold; color: white; display: flex; align-items: center; gap: 3px; box-shadow: 0 1px 4px rgba(0,0,0,0.3); cursor: pointer;">
      <span style="color: #A3E635; font-weight: 900;">+</span>
      <span>${symbol}</span>
    </div>
  `

  return L.divIcon({
    html,
    className: 'pr-gis-facility-marker',
    iconSize: [52, 18],
    iconAnchor: [26, 9],
    popupAnchor: [0, -10],
  })
}

// Factory for Statistical Anomaly Marker
function createAnomalyDivIcon(warning: AnomalyDetectionWarning, isSelected: boolean): L.DivIcon {
  const isHigh = warning.severity === 'HIGH' || warning.severity === 'CRITICAL'
  const border = isSelected
    ? 'border: 2px solid #FFFFFF; outline: 3px solid #C62828;'
    : 'border: 1.5px solid #FFFFFF;'
  const bg = isHigh ? '#C62828' : '#D97706'
  const tag =
    warning.signalType === 'MORTALITY_SPIKE'
      ? 'MORTALITY'
      : warning.signalType === 'VOLUME_SURGE'
      ? 'SURGE'
      : warning.signalType === 'GEOGRAPHIC_CONCENTRATION'
      ? 'CONCENTRATION'
      : 'RECURRENCE'

  const html = `
    <div style="background-color: ${bg}; ${border} border-radius: 2px; padding: 2px 6px; font-family: monospace; font-size: 9px; font-weight: 800; color: white; display: flex; align-items: center; gap: 4px; box-shadow: 0 3px 6px rgba(0,0,0,0.45); cursor: pointer; white-space: nowrap;">
      <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background-color: #FEF08A; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
      <span>ANOMALY: ${tag}</span>
    </div>
  `

  return L.divIcon({
    html,
    className: 'pr-gis-anomaly-marker',
    iconSize: [110, 22],
    iconAnchor: [55, 11],
    popupAnchor: [0, -13],
  })
}

function getAnomalyCoordinates(
  warning: AnomalyDetectionWarning,
  mappedFeatures: GisCaseFeature[]
): [number, number] | null {
  const associated = mappedFeatures.filter(
    (f) => warning.associatedCaseIds.includes(f.id) && f.latitude && f.longitude
  )
  if (associated.length > 0) {
    const latSum = associated.reduce((acc, f) => acc + (f.latitude || 0), 0)
    const lngSum = associated.reduce((acc, f) => acc + (f.longitude || 0), 0)
    return [latSum / associated.length, lngSum / associated.length]
  }

  if (warning.jurisdiction.village) {
    const match = mappedFeatures.find(
      (f) =>
        f.village.toLowerCase() === warning.jurisdiction.village?.toLowerCase() &&
        f.latitude &&
        f.longitude
    )
    if (match && match.latitude && match.longitude) {
      return [match.latitude, match.longitude]
    }
  }

  return null
}

function createIoTDivIcon(device: IoTDevice): L.DivIcon {
  const isOffline = device.status === 'OFFLINE'
  const battery = device.battery_level ?? 80
  const isMaint = device.status === 'MAINTENANCE' || battery < 20
  const bg = isOffline ? '#78716C' : isMaint ? '#D97706' : '#1B5E3C'
  const label = isOffline ? 'OFFLINE' : isMaint ? 'LOW BAT' : 'ONLINE'

  const html = `
    <div style="background-color: ${bg}; border: 1.5px solid white; border-radius: 2px; padding: 2px 5px; font-family: monospace; font-size: 8.5px; font-weight: 800; color: white; display: flex; align-items: center; gap: 3px; box-shadow: 0 2px 4px rgba(0,0,0,0.35); cursor: pointer; white-space: nowrap;">
      <span style="display: inline-block; width: 5px; height: 5px; border-radius: 50%; background-color: ${isOffline ? '#D6D3D1' : '#86EFAC'};"></span>
      <span>IOT: ${device.device_eui.slice(-4)} (${label})</span>
    </div>
  `
  return L.divIcon({
    html,
    className: 'pr-gis-iot-marker',
    iconSize: [95, 20],
    iconAnchor: [47, 10],
    popupAnchor: [0, -12],
  })
}

// Map Bounds Controller to keep view aligned when filters change
function MapBoundsController({
  mappedFeatures,
  selectedCluster,
}: {
  mappedFeatures: GisCaseFeature[]
  selectedCluster: OutbreakCluster | null
}) {
  const map = useMap()
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (selectedCluster) {
      map.setView([selectedCluster.center_latitude, selectedCluster.center_longitude], 13, {
        animate: true,
      })
      return
    }

    if (mappedFeatures.length > 0 && !hasInitialized.current) {
      const bounds = L.latLngBounds(
        mappedFeatures.map((f) => [f.latitude!, f.longitude!])
      )
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 })
      hasInitialized.current = true
    }
  }, [mappedFeatures, selectedCluster, map])

  return null
}

interface GisMapCanvasProps {
  mappedFeatures: GisCaseFeature[]
  clusters: OutbreakCluster[]
  facilities: GisFacility[]
  heatmapPoints: GisHeatmapPoint[]
  anomalies?: AnomalyDetectionWarning[]
  selectedCaseId: string | null
  selectedClusterId: string | null
  selectedAnomalyId?: string | null
  showCasesLayer: boolean
  showClustersLayer: boolean
  showHeatmapLayer: boolean
  showFacilitiesLayer: boolean
  showAnomaliesLayer?: boolean
  showIoTLayer?: boolean
  iotDevices?: IoTDevice[]
  tileLayerUrl: string
  onSelectCase: (caseId: string) => void
  onSelectCluster: (clusterId: string) => void
  onSelectAnomaly?: (anomalyId: string) => void
}

export function GisMapCanvas({
  mappedFeatures,
  clusters,
  facilities,
  heatmapPoints,
  anomalies = [],
  iotDevices = [],
  selectedCaseId,
  selectedClusterId,
  selectedAnomalyId,
  showCasesLayer,
  showClustersLayer,
  showHeatmapLayer,
  showFacilitiesLayer,
  showAnomaliesLayer = true,
  showIoTLayer = true,
  tileLayerUrl,
  onSelectCase,
  onSelectCluster,
  onSelectAnomaly,
}: GisMapCanvasProps) {
  // Center Varanasi default coordinates
  const defaultCenter: [number, number] = [25.3176, 82.9739]

  const activeSelectedCluster = clusters.find((c) => c.id === selectedClusterId) || null

  return (
    <div className="w-full h-full relative select-none">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', backgroundColor: '#E5E7EB' }}
        className="z-0"
      >
        <MapBoundsController
          mappedFeatures={mappedFeatures}
          selectedCluster={activeSelectedCluster}
        />

        {/* Base Map Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={tileLayerUrl}
        />

        {/* 1. GEOGRAPHIC RISK HEATMAP LAYER */}
        {showHeatmapLayer &&
          heatmapPoints.map((hp, idx) => {
            // Color based on risk score
            const color =
              hp.riskScore >= 75
                ? '#C62828'
                : hp.riskScore >= 50
                ? '#E65100'
                : hp.riskScore >= 25
                ? '#E0A11A'
                : '#2E7D32'

            return (
              <Circle
                key={`heatmap-${idx}-${hp.village}`}
                center={[hp.latitude, hp.longitude]}
                radius={2400}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: Math.min(0.55, hp.intensity * 0.6),
                  weight: 1.5,
                  dashArray: '3, 6',
                }}
              >
                <Popup>
                  <div className="p-2 text-xs font-sans">
                    <strong className="text-[#102A43] block border-b pb-1 mb-1 font-mono uppercase">
                      Risk Density Epicenter: {hp.village}
                    </strong>
                    <div className="space-y-0.5 text-stone-700">
                      <div>
                        Aggregated Risk Score:{' '}
                        <span className="font-mono font-bold text-[#C62828]">{hp.riskScore}/100</span>
                      </div>
                      <div>Cases in Buffer: <span className="font-mono font-bold">{hp.caseCount}</span></div>
                      <div>Relative Intensity: <span className="font-mono">{Math.round(hp.intensity * 100)}%</span></div>
                    </div>
                  </div>
                </Popup>
              </Circle>
            )
          })}

        {/* 2. OUTBREAK CLUSTERS & 5KM BIO-SECURITY BUFFER ZONES */}
        {showClustersLayer &&
          clusters.map((cluster) => {
            const isSelected = cluster.id === selectedClusterId
            const isCritical = cluster.risk_level === 'CRITICAL' || cluster.cluster_score >= 75
            const bufferColor = isCritical ? '#C62828' : '#D97706'

            return (
              <div key={cluster.id}>
                {/* 5km Bio-containment Cordon Circle */}
                <Circle
                  center={[cluster.center_latitude, cluster.center_longitude]}
                  radius={cluster.radius_km * 1000}
                  pathOptions={{
                    color: bufferColor,
                    fillColor: bufferColor,
                    fillOpacity: isSelected ? 0.22 : 0.12,
                    weight: isSelected ? 2.5 : 1.5,
                    dashArray: isSelected ? '4, 4' : '6, 6',
                  }}
                  eventHandlers={{
                    click: () => onSelectCluster(cluster.id),
                  }}
                />

                {/* Epicenter Marker */}
                <Marker
                  position={[cluster.center_latitude, cluster.center_longitude]}
                  icon={createClusterDivIcon(cluster, isSelected)}
                  eventHandlers={{
                    click: () => onSelectCluster(cluster.id),
                  }}
                >
                  <Popup>
                    <div className="p-2 text-xs font-sans">
                      <div className="text-[10px] font-mono font-bold text-[#C62828] uppercase">
                        POTENTIAL OUTBREAK CLUSTER
                      </div>
                      <strong className="text-[#102A43] block mt-0.5">{cluster.cluster_name}</strong>
                      <div className="mt-1 text-stone-600 font-mono text-[11px]">
                        <div>Code: {cluster.cluster_code}</div>
                        <div>Status: <span className="font-bold">{cluster.status}</span></div>
                        <div>Contributing Cases: {cluster.case_count}</div>
                        <div>Cordon Radius: {cluster.radius_km} km</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectCluster(cluster.id)}
                        className="mt-2 w-full px-2 py-1 bg-[#102A43] text-white text-[11px] font-bold rounded-[2px]"
                      >
                        Inspect Cluster Cases
                      </button>
                    </div>
                  </Popup>
                </Marker>
              </div>
            )
          })}

        {/* 3. STATISTICAL ANOMALY WARNING LAYER (Stage 10 Disease Intelligence) */}
        {showAnomaliesLayer &&
          anomalies.map((anomaly) => {
            const coords = getAnomalyCoordinates(anomaly, mappedFeatures)
            if (!coords) return null
            const isSelected = anomaly.id === selectedAnomalyId
            const isCritical = anomaly.severity === 'CRITICAL' || anomaly.severity === 'HIGH'
            const bufferColor = isCritical ? '#C62828' : '#D97706'

            return (
              <div key={`anomaly-${anomaly.id}`}>
                {/* Anomaly Investigation Perimeter Circle */}
                <Circle
                  center={coords}
                  radius={1200}
                  pathOptions={{
                    color: bufferColor,
                    fillColor: bufferColor,
                    fillOpacity: isSelected ? 0.22 : 0.1,
                    weight: isSelected ? 2.5 : 1.5,
                    dashArray: isSelected ? '3, 3' : '4, 6',
                  }}
                  eventHandlers={{
                    click: () => onSelectAnomaly?.(anomaly.id),
                  }}
                />

                {/* Anomaly Epicenter Marker */}
                <Marker
                  position={coords}
                  icon={createAnomalyDivIcon(anomaly, isSelected)}
                  eventHandlers={{
                    click: () => onSelectAnomaly?.(anomaly.id),
                  }}
                >
                  <Popup>
                    <div className="p-2.5 text-xs font-sans min-w-[220px]">
                      <div className="text-[10px] font-mono font-bold text-[#D97706] uppercase flex items-center justify-between border-b pb-1 mb-1.5">
                        <span>STATISTICAL ANOMALY</span>
                        <span className="text-white px-1.5 py-0.2 rounded-[1px] text-[9px] bg-[#102A43]">
                          {anomaly.status}
                        </span>
                      </div>
                      <strong className="text-[#102A43] block text-[13px]">{anomaly.title}</strong>
                      <p className="text-stone-600 text-[11px] mt-1">{anomaly.description}</p>
                      <div className="mt-2 space-y-0.5 font-mono text-[11px] text-stone-700 bg-stone-50 p-1.5 border border-stone-200 rounded-[1px]">
                        <div>Jurisdiction: <span className="font-bold">{anomaly.jurisdiction.village || 'Sector'}, {anomaly.jurisdiction.district}</span></div>
                        <div>Observed vs Baseline: <span className="font-bold text-[#C62828]">{anomaly.observedValue} vs {anomaly.baselineValue} (+{anomaly.percentageChange}%)</span></div>
                        <div>Affected Cases: <span className="font-bold">{anomaly.affectedCaseCount}</span> (Mortality: {anomaly.affectedMortalityCount})</div>
                      </div>
                      {onSelectAnomaly && (
                        <button
                          type="button"
                          onClick={() => onSelectAnomaly(anomaly.id)}
                          className="mt-2.5 w-full py-1.5 bg-[#102A43] hover:bg-[#1B5E3C] text-white font-mono text-[11px] font-bold tracking-wide rounded-[2px] transition-colors"
                        >
                          INSPECT ANOMALY DETAILS &rarr;
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              </div>
            )
          })}

        {/* 4. VETERINARY INFRASTRUCTURE FACILITIES */}
        {showFacilitiesLayer &&
          facilities.map((fac) => (
            <Marker
              key={fac.id}
              position={[fac.latitude, fac.longitude]}
              icon={createFacilityDivIcon(fac)}
            >
              <Popup>
                <div className="p-2 text-xs font-sans">
                  <span className="text-[10px] font-mono text-[#1B5E3C] font-bold uppercase block">
                    GOVERNMENT VETERINARY FACILITY
                  </span>
                  <strong className="text-[#123C2A] block mt-0.5">{fac.name}</strong>
                  <div className="text-stone-600 mt-1">
                    <div>Type: {fac.type}</div>
                    <div>Location: {fac.village}, {fac.district}</div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* 4. INDIVIDUAL VETERINARY CASE MARKERS */}
        {showCasesLayer &&
          mappedFeatures.map((f) => {
            const isSelected = f.id === selectedCaseId
            return (
              <Marker
                key={f.id}
                position={[f.latitude!, f.longitude!]}
                icon={createCaseDivIcon(f, isSelected)}
                eventHandlers={{
                  click: () => onSelectCase(f.id),
                }}
              >
                <Popup>
                  <div className="p-2.5 text-xs font-sans min-w-[210px]">
                    <div className="flex items-center justify-between border-b pb-1 mb-1.5">
                      <strong className="font-mono text-[#102A43] text-[13px]">{f.caseNumber}</strong>
                      <span
                        className={`text-[9.5px] px-1.5 py-0.2 font-mono font-bold rounded-[1px] text-white ${
                          f.riskLevel === 'CRITICAL'
                            ? 'bg-[#C62828]'
                            : f.riskLevel === 'HIGH'
                            ? 'bg-[#E65100]'
                            : f.riskLevel === 'MEDIUM'
                            ? 'bg-[#E0A11A]'
                            : 'bg-[#2E7D32]'
                        }`}
                      >
                        {f.riskLevel}
                      </span>
                    </div>

                    <div className="space-y-1 text-stone-700">
                      <div>
                        <span className="text-stone-500">Animal:</span> {f.species} ({f.breed}) &middot;{' '}
                        <span className="font-mono font-semibold">{f.animalTag}</span>
                      </div>
                      <div>
                        <span className="text-stone-500">Village:</span> {f.village}, {f.district}
                      </div>
                      <div>
                        <span className="text-stone-500">Status:</span>{' '}
                        <span className="font-semibold">{f.status}</span>
                      </div>
                      <div>
                        <span className="text-stone-500">Risk Score:</span>{' '}
                        <span className="font-mono font-bold text-[#102A43]">{f.riskScore}/100</span>
                      </div>
                      {f.symptoms.length > 0 && (
                        <div className="pt-1">
                          <span className="text-stone-500 block mb-0.5">Symptoms:</span>
                          <div className="flex flex-wrap gap-1">
                            {f.symptoms.slice(0, 3).map((s, idx) => (
                              <span
                                key={idx}
                                className="bg-stone-100 border border-stone-300 text-stone-800 px-1.5 py-0.2 text-[10px] rounded-[1px]"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectCase(f.id)}
                      className="mt-2.5 w-full py-1.5 bg-[#1B5E3C] hover:bg-[#123C2A] text-white font-mono text-[11px] font-bold tracking-wide rounded-[2px] transition-colors"
                    >
                      VIEW CASE DOSSIER &rarr;
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          })}

        {/* 6. IOT SMART SENSORS LAYER (Stage 11 IoT Surveillance) */}
        {showIoTLayer &&
          (iotDevices || []).map((device) => {
            // Respect privacy by using masked village centroid coordinates with slight deterministic offset
            let lat = 25.3176
            let lng = 82.9739
            const suffixNum = parseInt(device.device_eui.replace(/\D/g, '').slice(-2) || '0', 10)
            if (device.village === 'Rampur Khurd') {
              lat = 25.3180 + (suffixNum % 10) * 0.001
              lng = 82.9740 + (suffixNum % 7) * 0.001
            } else if (device.village === 'Shivpur') {
              lat = 25.3520 + (suffixNum % 8) * 0.001
              lng = 82.9810 + (suffixNum % 6) * 0.001
            } else {
              lat = 25.3200 + (suffixNum % 9) * 0.0012
              lng = 82.9750 + (suffixNum % 5) * 0.0012
            }

            const battery = device.battery_level ?? 80

            return (
              <Marker
                key={`iot-${device.id}`}
                position={[lat, lng]}
                icon={createIoTDivIcon(device)}
              >
                <Popup>
                  <div className="p-2.5 text-xs font-sans min-w-[200px]">
                    <div className="flex items-center justify-between border-b pb-1 mb-1.5 font-mono text-[10px]">
                      <span className="font-bold text-[#1B5E3C]">SMART IOT SENSOR</span>
                      <span className="bg-stone-100 text-stone-700 px-1 py-0.2 rounded font-bold">
                        {device.status}
                      </span>
                    </div>
                    <strong className="text-[#102A43] block text-sm font-mono">{device.device_eui}</strong>
                    <div className="text-stone-600 text-xs mt-1 space-y-0.5">
                      <div>Type: {device.device_type.replace(/_/g, ' ')}</div>
                      <div>Animal: <strong>{device.assigned_animal_tag || 'Unassigned'}</strong> ({device.assigned_animal_type || 'Livestock'})</div>
                      <div>Battery: <strong className={battery < 20 ? 'text-red-600' : 'text-emerald-700'}>{battery}%</strong></div>
                      <div>Signal: -68 dBm</div>
                      <div className="text-[10px] text-stone-500 pt-1 border-t mt-1">
                        Privacy notice: Masked at village centroid ({device.village || 'Varanasi Sector'}).
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}
      </MapContainer>
    </div>
  )
}
