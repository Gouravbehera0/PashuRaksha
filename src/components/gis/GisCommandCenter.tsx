// ============================================================
// PASHURAKSHA (पशुरक्षा) — GIS SURVEILLANCE COMMAND CENTER
// Stage 8: Unified Public-Health GIS Surveillance Desk
// Standard: Government of India GIGW / Fixed Sidebar & Header Shell
// "Detect Early. Prevent Outbreaks. Protect Livestock."
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Layers,
  RefreshCw,
  Search,
  X,
  ShieldAlert,
  AlertTriangle,
  Calendar,
  Crosshair,
  MapPinOff,
  Flame,
  RotateCcw
} from 'lucide-react'
import {
  loadGisFeatures,
  applyGisFilters,
  generateRiskHeatmapPoints,
  calculateSurveillanceSummary,
  DEFAULT_GIS_FILTERS,
  type GisCaseFeature,
  type GisFacility,
  type GisFilterState,
  type GisSurveillanceSummary,
} from '@/services/gis/gisService'
import { updateClusterInvestigationStatus } from '@/services/risk/outbreakEngine'
import { GisMapCanvas } from './GisMapCanvas'
import type { OutbreakCluster, ClusterStatus } from '@/services/risk/riskTypes'
import {
  getJurisdictionalAnomalies,
  setAnomalyInvestigationStatus,
  type AnomalyDetectionWarning,
  type AnomalyStatus,
} from '@/lib/intelligence'
import { getAllRegisteredDevices, type IoTDevice } from '@/lib/iot'

const BASEMAP_TILES = {
  osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  cartoVoyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  cartoLight: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
}

interface GisCommandCenterProps {
  userRole: 'admin' | 'veterinarian'
}

export function GisCommandCenter({ userRole }: GisCommandCenterProps) {
  // Raw Data State
  const [allFeatures, setAllFeatures] = useState<GisCaseFeature[]>([])
  const [clusters, setClusters] = useState<OutbreakCluster[]>([])
  const [facilities, setFacilities] = useState<GisFacility[]>([])
  const [anomalies, setAnomalies] = useState<AnomalyDetectionWarning[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters State
  const [filters, setFilters] = useState<GisFilterState>(DEFAULT_GIS_FILTERS)

  // Layer Visibility State
  const [showCasesLayer, setShowCasesLayer] = useState(true)
  const [showClustersLayer, setShowClustersLayer] = useState(true)
  const [showHeatmapLayer, setShowHeatmapLayer] = useState(false)
  const [showFacilitiesLayer, setShowFacilitiesLayer] = useState(true)
  const [showAnomaliesLayer, setShowAnomaliesLayer] = useState(true)
  const [showIoTLayer, setShowIoTLayer] = useState(true)
  const [iotDevices, setIotDevices] = useState<IoTDevice[]>([])
  const [basemapKey, setBasemapKey] = useState<keyof typeof BASEMAP_TILES>('osm')

  // Selected State
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null)
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>(null)
  const [showUnmappedDrawer, setShowUnmappedDrawer] = useState(false)
  const [showAnomalyDrawer, setShowAnomalyDrawer] = useState(false)
  const [showLegendModal, setShowLegendModal] = useState(false)
  const [updatingClusterStatus, setUpdatingClusterStatus] = useState(false)
  const [updatingAnomalyStatus, setUpdatingAnomalyStatus] = useState(false)

  // Load Data
  const fetchData = async () => {
    try {
      setError(null)
      const [data, anomalyList, devicesList] = await Promise.all([
        loadGisFeatures(),
        getJurisdictionalAnomalies(),
        getAllRegisteredDevices(),
      ])
      setAllFeatures(data.features)
      setClusters(data.clusters)
      setFacilities(data.facilities)
      setAnomalies(anomalyList)
      setIotDevices(devicesList)
    } catch (err: any) {
      console.error('[GIS Command Center] Failed to load features:', err)
      setError('Unable to load live GIS surveillance feed. Please check network connection.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  // Filter application
  const filteredFeatures = useMemo(() => {
    return applyGisFilters(allFeatures, filters)
  }, [allFeatures, filters])

  // Split mapped vs unmapped
  const mappedFeatures = useMemo(() => {
    return filteredFeatures.filter((f) => f.isMapped)
  }, [filteredFeatures])

  const unmappedFeatures = useMemo(() => {
    return filteredFeatures.filter((f) => !f.isMapped)
  }, [filteredFeatures])

  // Heatmap generation
  const { points: heatmapPoints, explanation: heatmapExplanation } = useMemo(() => {
    return generateRiskHeatmapPoints(mappedFeatures)
  }, [mappedFeatures])

  // Summary Metrics
  const summary: GisSurveillanceSummary = useMemo(() => {
    return calculateSurveillanceSummary(filteredFeatures, clusters)
  }, [filteredFeatures, clusters])

  // Selected entities
  const selectedCase = useMemo(() => {
    if (!selectedCaseId) return null
    return allFeatures.find((f) => f.id === selectedCaseId) || null
  }, [selectedCaseId, allFeatures])

  const selectedCluster = useMemo(() => {
    if (!selectedClusterId) return null
    return clusters.find((c) => c.id === selectedClusterId) || null
  }, [selectedClusterId, clusters])

  // Contributing cases for selected cluster
  const clusterContributingCases = useMemo(() => {
    if (!selectedCluster) return []
    return allFeatures.filter((f) => {
      if (f.clusterId === selectedCluster.id) return true
      return selectedCluster.affected_villages.includes(f.village)
    })
  }, [selectedCluster, allFeatures])

  // Available unique districts and villages for filters
  const availableDistricts = useMemo(() => {
    const list = Array.from(new Set(allFeatures.map((f) => f.district).filter(Boolean)))
    return ['All', ...list]
  }, [allFeatures])

  const availableVillages = useMemo(() => {
    const relevant =
      filters.district === 'All'
        ? allFeatures
        : allFeatures.filter((f) => f.district === filters.district)
    const list = Array.from(new Set(relevant.map((f) => f.village).filter(Boolean)))
    return ['All', ...list]
  }, [allFeatures, filters.district])

  // Filter actions
  const handleClearFilters = () => {
    setFilters(DEFAULT_GIS_FILTERS)
  }

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.district !== 'All') count++
    if (filters.village !== 'All') count++
    if (filters.dateRange !== 'all') count++
    if (filters.riskLevel !== 'All') count++
    if (filters.species !== 'All') count++
    if (filters.caseStatus !== 'All') count++
    if (filters.clusterFilter !== 'All') count++
    if (filters.activeOnly) count++
    if (filters.searchQuery.trim()) count++
    return count
  }, [filters])

  // Handle cluster status transition
  const handleClusterStatusChange = async (newStatus: ClusterStatus) => {
    if (!selectedCluster) return
    try {
      setUpdatingClusterStatus(true)
      const reviewer = userRole === 'admin' ? 'State Surveillance Officer (Admin)' : 'Dr. Priya Sharma (Veterinary Officer)'
      await updateClusterInvestigationStatus(selectedCluster.id, newStatus, undefined, reviewer)
      setClusters((prev) =>
        prev.map((c) => (c.id === selectedCluster.id ? { ...c, status: newStatus } : c))
      )
    } catch (err) {
      console.error('[GIS] Failed to update cluster status:', err)
    } finally {
      setUpdatingClusterStatus(false)
    }
  }

  // Selected anomaly
  const selectedAnomaly = useMemo(() => {
    if (!selectedAnomalyId) return null
    return anomalies.find((a) => a.id === selectedAnomalyId) || null
  }, [selectedAnomalyId, anomalies])

  // Handle anomaly status transition
  const handleAnomalyStatusChange = async (newStatus: AnomalyStatus, notes?: string) => {
    if (!selectedAnomaly) return
    try {
      setUpdatingAnomalyStatus(true)
      const reviewer =
        userRole === 'admin'
          ? 'State Surveillance Officer (Admin)'
          : 'Dr. Priya Sharma (Veterinary Officer)'
      await setAnomalyInvestigationStatus(selectedAnomaly.id, newStatus, notes, reviewer)
      const updated = await getJurisdictionalAnomalies()
      setAnomalies(updated)
    } catch (err) {
      console.error('[GIS] Failed to update anomaly status:', err)
    } finally {
      setUpdatingAnomalyStatus(false)
    }
  }

  // Contributing cases for selected anomaly
  const anomalyContributingCases = useMemo(() => {
    if (!selectedAnomaly) return []
    return allFeatures.filter((f) => selectedAnomaly.associatedCaseIds.includes(f.id))
  }, [selectedAnomaly, allFeatures])

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-[#F3F5F1] text-[#102A43] font-mono">
        <RefreshCw className="w-8 h-8 animate-spin text-[#1B5E3C] mb-3" />
        <div className="font-bold text-sm tracking-wider uppercase">INITIALIZING GIS SURVEILLANCE ENGINE...</div>
        <div className="text-xs text-stone-500 mt-1">Fetching live cases, cluster epicenters & biosecurity cordons</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#F3F5F1] text-[#102A43] font-sans overflow-hidden">
      {/* ── 1. GIS COMMAND TOP BANNER ── */}
      <header className="bg-[#102A43] text-white px-3 sm:px-4 py-2 border-b-2 border-[#1B5E3C] shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#1B5E3C] border border-[#F7F5EE]/40 flex items-center justify-center text-white shrink-0">
              <Crosshair size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3E635] font-bold">
                  NATIONAL EPIDEMIOLOGICAL GIS COMMAND
                </span>
                <span className="text-white/40">&bull;</span>
                <span className="text-[10px] font-mono text-white/70">WGS84 EPSG:4326</span>
                <span className="text-white/40">&bull;</span>
                <span className="text-[10px] font-mono text-white/70 uppercase">
                  ROLE: {userRole}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-[#F7F5EE] leading-tight">
                PashuRaksha Live GIS Surveillance Center &middot; भू-स्थानिक रोग निगरानी कमान
              </h1>
            </div>
          </div>

          {/* Quick Counter Metrics */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setFilters((f) => ({ ...f, activeOnly: !f.activeOnly }))}
              className={`px-2 py-1 text-[11px] font-mono font-bold border transition-colors flex items-center gap-1 ${
                filters.activeOnly
                  ? 'bg-[#1B5E3C] text-white border-white'
                  : 'bg-white/10 text-white/90 border-white/20 hover:bg-white/20'
              }`}
            >
              <span>ACTIVE:</span>
              <span className="font-bold">{summary.activeCasesCount}</span>
            </button>

            <button
              type="button"
              onClick={() => setFilters((f) => ({ ...f, riskLevel: 'HIGH' }))}
              className="px-2 py-1 bg-[#E65100]/20 hover:bg-[#E65100]/40 text-[#FFA000] border border-[#E65100]/60 text-[11px] font-mono font-bold flex items-center gap-1"
              title="Filter by High/Critical Risk"
            >
              <AlertTriangle size={12} className="text-[#FFA000]" />
              <span>HIGH/CRIT:</span>
              <span>{summary.highOrCriticalCasesCount}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAnomalyDrawer(true)
                if (anomalies.length > 0 && !selectedAnomalyId) {
                  setSelectedAnomalyId(anomalies[0].id)
                }
              }}
              className="px-2 py-1 bg-[#D97706]/20 hover:bg-[#D97706]/40 text-[#FEF08A] border border-[#D97706]/70 text-[11px] font-mono font-bold flex items-center gap-1 transition-colors"
              title="Inspect Statistical Anomaly Signals"
            >
              <ShieldAlert size={12} className="text-[#FEF08A]" />
              <span>ANOMALIES:</span>
              <span>{anomalies.filter((a) => a.status !== 'Dismissed').length}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowUnmappedDrawer(true)}
              className={`px-2 py-1 text-[11px] font-mono font-bold border flex items-center gap-1 transition-colors ${
                summary.unmappedCasesCount > 0
                  ? 'bg-[#C62828]/20 text-[#FF8A80] border-[#C62828] hover:bg-[#C62828]/30'
                  : 'bg-white/10 text-white/70 border-white/20'
              }`}
              title="Click to view cases without GPS coordinates"
            >
              <MapPinOff size={12} />
              <span>UNMAPPED:</span>
              <span>{summary.unmappedCasesCount}</span>
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1.5 bg-[#1B5E3C] hover:bg-[#123C2A] text-white border border-white/20 transition-colors ml-1"
              title="Refresh GIS Feeds"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. COMPOSABLE FILTER TOOLBAR ── */}
      <div className="bg-[#FAF9F5] border-b border-stone-300 px-3 py-2 shrink-0 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Location Search Input */}
          <div className="relative min-w-[160px] flex-1 max-w-xs">
            <Search size={13} className="absolute left-2.5 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search case #, tag, village, symptom..."
              value={filters.searchQuery}
              onChange={(e) => setFilters((f) => ({ ...f, searchQuery: e.target.value }))}
              className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-stone-300 text-xs focus:outline-none focus:border-[#1B5E3C]"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => setFilters((f) => ({ ...f, searchQuery: '' }))}
                className="absolute right-2 top-2 text-stone-400 hover:text-stone-700"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* District Dropdown */}
          <div className="flex items-center gap-1 bg-white border border-stone-300 px-2 py-1">
            <span className="text-[10px] font-mono text-stone-500 uppercase font-bold">District:</span>
            <select
              value={filters.district}
              onChange={(e) => setFilters((f) => ({ ...f, district: e.target.value, village: 'All' }))}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {availableDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Village Dropdown */}
          <div className="flex items-center gap-1 bg-white border border-stone-300 px-2 py-1">
            <span className="text-[10px] font-mono text-stone-500 uppercase font-bold">Village:</span>
            <select
              value={filters.village}
              onChange={(e) => setFilters((f) => ({ ...f, village: e.target.value }))}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {availableVillages.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Level Filter */}
          <div className="flex items-center gap-1 bg-white border border-stone-300 px-2 py-1">
            <span className="text-[10px] font-mono text-stone-500 uppercase font-bold">Risk:</span>
            <select
              value={filters.riskLevel}
              onChange={(e) => setFilters((f) => ({ ...f, riskLevel: e.target.value as any }))}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All">All Levels</option>
              <option value="CRITICAL">Critical Risk</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
              <option value="UNASSESSED">Unassessed</option>
            </select>
          </div>

          {/* Species Filter */}
          <div className="flex items-center gap-1 bg-white border border-stone-300 px-2 py-1">
            <span className="text-[10px] font-mono text-stone-500 uppercase font-bold">Species:</span>
            <select
              value={filters.species}
              onChange={(e) => setFilters((f) => ({ ...f, species: e.target.value as any }))}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All">All Species</option>
              <option value="Cow">Cattle / Cow</option>
              <option value="Buffalo">Buffalo</option>
              <option value="Goat">Caprine / Goat</option>
              <option value="Sheep">Ovine / Sheep</option>
              <option value="Poultry">Poultry</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Case Status Filter */}
          <div className="flex items-center gap-1 bg-white border border-stone-300 px-2 py-1">
            <span className="text-[10px] font-mono text-stone-500 uppercase font-bold">Status:</span>
            <select
              value={filters.caseStatus}
              onChange={(e) => setFilters((f) => ({ ...f, caseStatus: e.target.value as any }))}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Under Review">Under Review</option>
              <option value="Veterinary Review">Veterinary Review</option>
              <option value="Sample Required">Sample Required</option>
              <option value="Lab Pending">Lab Pending</option>
              <option value="Treatment">Treatment</option>
              <option value="Monitoring">Monitoring</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-1 bg-white border border-stone-300 px-2 py-1">
            <Calendar size={12} className="text-stone-400" />
            <span className="text-[10px] font-mono text-stone-500 uppercase font-bold">Window:</span>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters((f) => ({ ...f, dateRange: e.target.value as any }))}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="14d">Last 14 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Historical Time</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-2 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 font-mono text-[11px] font-bold flex items-center gap-1 transition-colors"
            >
              <RotateCcw size={11} />
              <span>Reset ({activeFilterCount})</span>
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <span className="font-mono text-[11px] text-stone-600">
              Showing <strong className="text-[#102A43]">{filteredFeatures.length}</strong> cases
              ({mappedFeatures.length} mapped &bull; {unmappedFeatures.length} unmapped)
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. MAP LAYER CONTROLS & BASAL TOOLBAR ── */}
      <div className="bg-[#123C2A] text-white px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span className="font-bold text-[#A3E635] flex items-center gap-1">
            <Layers size={13} />
            MAP LAYERS:
          </span>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#A3E635]">
            <input
              type="checkbox"
              checked={showCasesLayer}
              onChange={(e) => setShowCasesLayer(e.target.checked)}
              className="rounded-xs accent-[#1B5E3C]"
            />
            <span>Case Markers ({mappedFeatures.length})</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#A3E635]">
            <input
              type="checkbox"
              checked={showClustersLayer}
              onChange={(e) => setShowClustersLayer(e.target.checked)}
              className="rounded-xs accent-[#1B5E3C]"
            />
            <span>Outbreak Clusters ({clusters.length})</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#FFA000]">
            <input
              type="checkbox"
              checked={showHeatmapLayer}
              onChange={(e) => setShowHeatmapLayer(e.target.checked)}
              className="rounded-xs accent-[#E65100]"
            />
            <span className="flex items-center gap-1">
              <Flame size={12} className="text-[#FFA000]" />
              Risk Heatmap
            </span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#FEF08A]">
            <input
              type="checkbox"
              checked={showAnomaliesLayer}
              onChange={(e) => setShowAnomaliesLayer(e.target.checked)}
              className="rounded-xs accent-[#D97706]"
            />
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#D97706] inline-block animate-pulse"></span>
              Statistical Anomalies ({anomalies.length})
            </span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#86EFAC]">
            <input
              type="checkbox"
              checked={showIoTLayer}
              onChange={(e) => setShowIoTLayer(e.target.checked)}
              className="rounded-xs accent-[#1B5E3C]"
            />
            <span>Smart IoT Sensors ({iotDevices.length})</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#A3E635]">
            <input
              type="checkbox"
              checked={showFacilitiesLayer}
              onChange={(e) => setShowFacilitiesLayer(e.target.checked)}
              className="rounded-xs accent-[#1B5E3C]"
            />
            <span>Veterinary Network ({facilities.length})</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-white/60">Basemap:</span>
          <select
            value={basemapKey}
            onChange={(e) => setBasemapKey(e.target.value as any)}
            className="bg-[#102A43] text-white text-[11px] px-2 py-0.5 border border-white/20 focus:outline-none"
          >
            <option value="osm">Standard OSM</option>
            <option value="cartoVoyager">Carto Voyager</option>
            <option value="cartoLight">Clean Light GIS</option>
          </select>

          <button
            type="button"
            onClick={() => setShowLegendModal(!showLegendModal)}
            className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white text-[11px] border border-white/20 transition-colors"
          >
            Legend &amp; Rules
          </button>
        </div>
      </div>

      {/* ── 4. ERROR NOTICE IF NETWORK FAILED ── */}
      {error && (
        <div className="bg-[#C62828] text-white px-4 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="underline font-bold text-white hover:text-white/80"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* ── 5. MAIN MAP WORKSPACE WITH COLLAPSIBLE SIDE PANELS ── */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Leaflet Map Canvas */}
        <div className="flex-1 h-full w-full relative">
          {mappedFeatures.length === 0 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white/95 border-2 border-[#102A43] shadow-md px-4 py-3 text-center max-w-md">
              <ShieldAlert className="w-6 h-6 text-[#E0A11A] mx-auto mb-1" />
              <div className="text-xs font-bold text-[#102A43]">
                No Epidemiological Cases Plotted On GIS
              </div>
              <p className="text-[11px] text-stone-600 mt-0.5">
                {unmappedFeatures.length > 0
                  ? `${unmappedFeatures.length} cases exist in the unmapped register due to missing GPS coordinates.`
                  : 'No records match the active filter criteria.'}
              </p>
              <div className="mt-2 flex items-center justify-center gap-2">
                {unmappedFeatures.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowUnmappedDrawer(true)}
                    className="px-2.5 py-1 bg-[#102A43] text-white text-[11px] font-mono font-bold"
                  >
                    Open Unmapped Register ({unmappedFeatures.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-2.5 py-1 bg-stone-200 text-stone-800 text-[11px] font-mono font-bold"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}

          <GisMapCanvas
            mappedFeatures={mappedFeatures}
            clusters={clusters}
            facilities={facilities}
            heatmapPoints={heatmapPoints}
            selectedCaseId={selectedCaseId}
            selectedClusterId={selectedClusterId}
            showCasesLayer={showCasesLayer}
            showClustersLayer={showClustersLayer}
            showHeatmapLayer={showHeatmapLayer}
            showFacilitiesLayer={showFacilitiesLayer}
            showAnomaliesLayer={showAnomaliesLayer}
            showIoTLayer={showIoTLayer}
            iotDevices={iotDevices}
            anomalies={anomalies}
            selectedAnomalyId={selectedAnomalyId}
            tileLayerUrl={BASEMAP_TILES[basemapKey]}
            onSelectCase={(id) => {
              setSelectedCaseId(id)
              setSelectedClusterId(null)
              setSelectedAnomalyId(null)
            }}
            onSelectCluster={(id) => {
              setSelectedClusterId(id)
              setSelectedCaseId(null)
              setSelectedAnomalyId(null)
            }}
            onSelectAnomaly={(id) => {
              setSelectedAnomalyId(id)
              setShowAnomalyDrawer(true)
              setSelectedCaseId(null)
              setSelectedClusterId(null)
            }}
          />

          {/* Floating Bottom-Left GIS Legend */}
          {showLegendModal && (
            <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-xs border-2 border-[#102A43] p-3 shadow-lg max-w-xs text-xs font-sans">
              <div className="flex items-center justify-between border-b pb-1.5 mb-2 font-mono font-bold text-[#102A43]">
                <span>GIS COMMAND LEGEND</span>
                <button
                  type="button"
                  onClick={() => setShowLegendModal(false)}
                  className="text-stone-400 hover:text-stone-800"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="font-mono font-bold text-[10px] text-stone-500 uppercase">Case Risk Levels:</div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#C62828] border border-white rounded-[1px] shrink-0"></span>
                  <span>Critical Risk (Score 75–100 &bull; Biosecurity Alert)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#E65100] border border-white rounded-[1px] shrink-0"></span>
                  <span>High Risk (Score 50–74 &bull; Clinical Triage)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#E0A11A] border border-white rounded-[1px] shrink-0"></span>
                  <span>Medium Risk (Score 25–49 &bull; Observation)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#2E7D32] border border-white rounded-[1px] shrink-0"></span>
                  <span>Low Risk (Score 0–24 &bull; Routine Home Care)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#757575] border border-white rounded-[1px] shrink-0"></span>
                  <span>Unassessed / Pending Risk Score</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#2E7D32] border border-white rounded-[1px] shrink-0 flex items-center justify-center text-white text-[8px] font-bold">✓</span>
                  <span>Resolved Cases (Visually Distinguishable)</span>
                </div>

                <div className="border-t pt-1.5 mt-2 font-mono font-bold text-[10px] text-stone-500 uppercase">
                  Biosecurity Overlays:
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-dashed border-[#C62828] rounded-full shrink-0"></div>
                  <span>5 km Outbreak Containment Buffer Cordon</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-1 bg-[#102A43] text-white text-[9px] font-mono font-bold rounded-[1px] shrink-0">LAB</span>
                  <span>Disease Diagnostic Laboratory (DDDL)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-1 bg-[#123C2A] text-white text-[9px] font-mono font-bold rounded-[1px] shrink-0">VET</span>
                  <span>Veterinary Hospital &amp; Dispensary</span>
                </div>

                <div className="border-t pt-1.5 mt-2 font-mono font-bold text-[10px] text-stone-500 uppercase">
                  Statistical Anomaly Signals (Stage 10):
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#D97706] border border-white rounded-[1px] shrink-0"></span>
                  <span>Volume Surge / Concentration (&gt;75% increase)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#C62828] border border-white rounded-[1px] shrink-0"></span>
                  <span>Mortality Spike / High Concern (&ge;2 deaths)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-dashed border-[#D97706] rounded-full shrink-0"></div>
                  <span>1.2 km Statistical Anomaly Investigation Zone</span>
                </div>
              </div>

              {showHeatmapLayer && (
                <div className="mt-2.5 pt-2 border-t text-[10px] text-stone-600 bg-stone-50 p-1.5">
                  <strong className="block text-[#E65100]">Heatmap Methodology:</strong>
                  {heatmapExplanation}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 6. RIGHT SIDE-OUT DRAWER: SELECTED CASE DOSSIER ── */}
        {selectedCase && (
          <aside className="w-80 sm:w-96 bg-white border-l-2 border-[#102A43] shadow-xl flex flex-col z-30 shrink-0 h-full overflow-y-auto">
            <div className="bg-[#102A43] text-white p-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3E635] font-bold">
                  CASE DOSSIER
                </span>
                <span className="text-white/40">&bull;</span>
                <span className="font-mono text-xs font-bold">{selectedCase.caseNumber}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCaseId(null)}
                className="text-white/70 hover:text-white p-1"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs font-sans flex-1">
              {/* Risk Banner */}
              <div
                className={`p-3 border-l-4 ${
                  selectedCase.riskLevel === 'CRITICAL'
                    ? 'bg-[#C62828]/10 border-[#C62828]'
                    : selectedCase.riskLevel === 'HIGH'
                    ? 'bg-[#E65100]/10 border-[#E65100]'
                    : selectedCase.riskLevel === 'MEDIUM'
                    ? 'bg-[#E0A11A]/10 border-[#E0A11A]'
                    : 'bg-[#2E7D32]/10 border-[#2E7D32]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold uppercase tracking-wider">
                    {selectedCase.riskLevel} RISK EVALUATION
                  </span>
                  <span className="text-lg font-mono font-extrabold text-[#102A43]">
                    {selectedCase.riskScore}/100
                  </span>
                </div>
                <div className="text-[11px] text-stone-600 mt-1 font-mono">
                  Engine Version: risk-engine-v1 &middot; Deterministic Triage
                </div>
              </div>

              {/* Livestock Particulars */}
              <div className="border border-stone-200 p-3 bg-[#FAF9F5] space-y-1.5 font-mono text-[11px]">
                <div className="text-[10px] text-stone-500 uppercase font-bold border-b pb-1 mb-1">
                  Livestock Registration
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Animal Tag:</span>
                  <strong className="text-[#102A43]">{selectedCase.animalTag}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Species:</span>
                  <span>{selectedCase.species}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Breed:</span>
                  <span>{selectedCase.breed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Reported At:</span>
                  <span>{new Date(selectedCase.reportedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Geographic Provenance */}
              <div className="border border-stone-200 p-3 bg-white space-y-1.5">
                <div className="text-[10px] font-mono text-stone-500 uppercase font-bold border-b pb-1 mb-1">
                  Spatial Surveillance Coordinates
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-stone-500">Village:</span>
                  <strong>{selectedCase.village}</strong>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-stone-500">District:</span>
                  <span>{selectedCase.district}</span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-stone-500">WGS84 GPS:</span>
                  <span className="text-[#1B5E3C] font-bold">
                    {selectedCase.latitude
                      ? `${selectedCase.latitude.toFixed(4)}, ${selectedCase.longitude?.toFixed(4)}`
                      : 'Coordinates Unavailable'}
                  </span>
                </div>
                <div className="bg-stone-50 border border-stone-200 p-2 text-[10px] text-stone-500 mt-2">
                  <strong className="text-stone-700">Privacy Safeguard:</strong> Precision coordinates are masked
                  at village centroid level to protect smallholder privacy and prevent herd targeting.
                </div>
              </div>

              {/* Reported Symptoms */}
              <div className="border border-stone-200 p-3 bg-white space-y-1.5">
                <div className="text-[10px] font-mono text-stone-500 uppercase font-bold border-b pb-1 mb-1 flex justify-between">
                  <span>Clinical Symptoms</span>
                  <span className="text-[#C62828]">{selectedCase.reportedSeverity}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedCase.symptoms.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-stone-100 border border-stone-300 text-stone-800 text-[11px] font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-stone-600 mt-2 italic bg-stone-50 p-2 border-l-2 border-stone-300">
                  "{selectedCase.description}"
                </p>
              </div>

              {/* Explainable Risk Reasons */}
              {selectedCase.riskReasons.length > 0 && (
                <div className="border border-stone-200 p-3 bg-white space-y-1">
                  <div className="text-[10px] font-mono text-stone-500 uppercase font-bold border-b pb-1 mb-1">
                    Risk Engine Decision Rationale
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-stone-700">
                    {selectedCase.riskReasons.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Navigation link to full case record */}
              <Link
                to={selectedCase.caseUrl}
                className="w-full py-2.5 bg-[#1B5E3C] hover:bg-[#123C2A] text-white text-xs font-mono font-bold uppercase tracking-wider text-center block transition-colors shadow-xs"
              >
                Open Full Case Record &rarr;
              </Link>
            </div>
          </aside>
        )}

        {/* ── 7. RIGHT SIDE-OUT DRAWER: SELECTED OUTBREAK CLUSTER ── */}
        {selectedCluster && (
          <aside className="w-80 sm:w-96 bg-white border-l-2 border-[#C62828] shadow-xl flex flex-col z-30 shrink-0 h-full overflow-y-auto">
            <div className="bg-[#C62828] text-white p-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/80 font-bold">
                  OUTBREAK CLUSTER
                </span>
                <span className="text-white/40">&bull;</span>
                <span className="font-mono text-xs font-bold">{selectedCluster.cluster_code}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClusterId(null)}
                className="text-white/70 hover:text-white p-1"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs font-sans flex-1">
              <div>
                <h2 className="text-base font-bold text-[#102A43] leading-snug">
                  {selectedCluster.cluster_name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-[#102A43] text-white text-[10px] font-mono font-bold uppercase">
                    STATUS: {selectedCluster.status}
                  </span>
                  <span className="font-mono text-[11px] text-[#C62828] font-bold">
                    Score: {selectedCluster.cluster_score}/100
                  </span>
                </div>
              </div>

              {/* Spatial Geometry */}
              <div className="border border-stone-200 p-3 bg-[#FAF9F5] font-mono text-[11px] space-y-1">
                <div className="text-[10px] text-stone-500 uppercase font-bold border-b pb-1 mb-1">
                  Geospatial Parameters
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Bio-Containment Radius:</span>
                  <strong>{selectedCluster.radius_km} km cordon</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Center Coordinates:</span>
                  <span>{selectedCluster.center_latitude.toFixed(4)}, {selectedCluster.center_longitude.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Contributing Cases:</span>
                  <strong className="text-[#C62828]">{selectedCluster.case_count} cases</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Affected Villages:</span>
                  <span>{selectedCluster.affected_villages.join(', ')}</span>
                </div>
              </div>

              {/* Common Syndromic Signals */}
              <div className="border border-stone-200 p-3 bg-white space-y-1.5">
                <div className="text-[10px] font-mono text-stone-500 uppercase font-bold border-b pb-1 mb-1">
                  Syndromic Markers Triggered
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedCluster.common_symptoms.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-red-50 border border-red-200 text-[#C62828] text-[11px] font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contributing Cases Link List */}
              <div className="border border-stone-200 p-3 bg-white space-y-2">
                <div className="text-[10px] font-mono text-stone-500 uppercase font-bold border-b pb-1 mb-1 flex justify-between">
                  <span>Contributing Case Records ({clusterContributingCases.length})</span>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {clusterContributingCases.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCaseId(c.id)
                        setSelectedClusterId(null)
                      }}
                      className="p-2 border border-stone-200 hover:border-[#102A43] hover:bg-stone-50 cursor-pointer transition-colors text-[11px]"
                    >
                      <div className="flex items-center justify-between font-mono">
                        <strong className="text-[#102A43]">{c.caseNumber}</strong>
                        <span className="text-[#C62828] font-bold">{c.riskLevel}</span>
                      </div>
                      <div className="text-stone-600 text-[10px]">
                        {c.species} &bull; {c.village} &bull; {c.symptoms.slice(0, 2).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Investigation Status Transition Action Buttons */}
              <div className="border border-stone-200 p-3 bg-white space-y-2">
                <div className="text-[10px] font-mono text-stone-500 uppercase font-bold border-b pb-1">
                  Investigation Status Workflow
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                  <button
                    type="button"
                    disabled={updatingClusterStatus || selectedCluster.status === 'Under Investigation'}
                    onClick={() => handleClusterStatusChange('Under Investigation')}
                    className="p-1.5 border border-stone-400 bg-stone-50 hover:bg-stone-100 disabled:opacity-40 font-bold"
                  >
                    INVESTIGATING
                  </button>
                  <button
                    type="button"
                    disabled={updatingClusterStatus || selectedCluster.status === 'Escalated'}
                    onClick={() => handleClusterStatusChange('Escalated')}
                    className="p-1.5 border border-amber-600 bg-amber-50 hover:bg-amber-100 text-amber-900 disabled:opacity-40 font-bold"
                  >
                    ESCALATE
                  </button>
                  <button
                    type="button"
                    disabled={updatingClusterStatus || selectedCluster.status === 'Confirmed'}
                    onClick={() => handleClusterStatusChange('Confirmed')}
                    className="p-1.5 border border-red-600 bg-red-50 hover:bg-red-100 text-red-900 disabled:opacity-40 font-bold"
                  >
                    CONFIRM OUTBREAK
                  </button>
                  <button
                    type="button"
                    disabled={updatingClusterStatus || selectedCluster.status === 'Monitoring'}
                    onClick={() => handleClusterStatusChange('Monitoring')}
                    className="p-1.5 border border-green-600 bg-green-50 hover:bg-green-100 text-green-900 disabled:opacity-40 font-bold"
                  >
                    MONITORING
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* ── 7. RIGHT SIDE-OUT DRAWER: SELECTED STATISTICAL ANOMALY ── */}
        {(selectedAnomaly || showAnomalyDrawer) && (
          <aside className="w-80 sm:w-96 bg-white border-l-2 border-[#D97706] shadow-xl flex flex-col z-30 shrink-0 h-full overflow-y-auto">
            <div className="bg-[#102A43] text-white p-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#FEF08A] font-bold">
                  STATISTICAL ANOMALY
                </span>
                <span className="text-white/40">&bull;</span>
                <span className="font-mono text-xs font-bold">{selectedAnomaly?.signalType || 'SURVEILLANCE'}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedAnomalyId(null)
                  setShowAnomalyDrawer(false)
                }}
                className="text-white/70 hover:text-white p-1"
              >
                <X size={15} />
              </button>
            </div>

            {selectedAnomaly ? (
              <div className="p-4 space-y-4 text-xs font-sans flex-1">
                <div>
                  <h2 className="text-base font-bold text-[#102A43] leading-snug">
                    {selectedAnomaly.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-[#D97706] text-white text-[10px] font-mono font-bold uppercase">
                      STATUS: {selectedAnomaly.status}
                    </span>
                    <span className={`font-mono text-[11px] font-bold ${selectedAnomaly.severity === 'CRITICAL' ? 'text-[#C62828]' : 'text-[#D97706]'}`}>
                      Severity: {selectedAnomaly.severity}
                    </span>
                  </div>
                </div>

                <p className="text-stone-700 text-xs leading-relaxed">
                  {selectedAnomaly.description}
                </p>

                {/* Statistical Metric Comparison */}
                <div className="border border-stone-200 p-3 bg-[#FAF9F5] font-mono text-[11px] space-y-1.5">
                  <div className="text-[10px] text-stone-500 uppercase font-bold border-b pb-1 mb-1">
                    Empirical Baseline Metrics
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Jurisdiction:</span>
                    <strong>{selectedAnomaly.jurisdiction.village || 'All Villages'}, {selectedAnomaly.jurisdiction.district}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Observation Window:</span>
                    <span>{selectedAnomaly.observationWindowDays} Days (Observed: {selectedAnomaly.observedValue})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Baseline Window:</span>
                    <span>{selectedAnomaly.baselineWindowDays} Days (Baseline: {selectedAnomaly.baselineValue})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Percentage Surge:</span>
                    <strong className="text-[#C62828]">+{selectedAnomaly.percentageChange}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Affected Cases:</span>
                    <span>{selectedAnomaly.affectedCaseCount} (Deaths: {selectedAnomaly.affectedMortalityCount})</span>
                  </div>
                </div>

                {/* Contributing Factors */}
                <div className="border border-stone-200 p-3 bg-white space-y-1.5">
                  <div className="text-[10px] font-mono text-stone-500 uppercase font-bold border-b pb-1 mb-1">
                    Contributing Epidemiological Factors
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-stone-700 text-[11px]">
                    {selectedAnomaly.contributingFactors.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>

                {/* Transparent Data Limitations Box */}
                <div className="border-l-4 border-amber-500 bg-amber-50/70 p-2.5 text-[11px] text-amber-950 space-y-1">
                  <strong className="block text-[10px] font-mono uppercase text-amber-800">
                    Regulatory Limitations &amp; Caveats
                  </strong>
                  <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
                    {selectedAnomaly.dataLimitations.map((lim, i) => (
                      <li key={i}>{lim}</li>
                    ))}
                  </ul>
                </div>

                {/* Associated Cases Link List */}
                {anomalyContributingCases.length > 0 && (
                  <div className="border border-stone-200 p-3 bg-white space-y-2">
                    <div className="text-[10px] font-mono text-stone-500 uppercase font-bold border-b pb-1 mb-1">
                      Associated Field Cases ({anomalyContributingCases.length})
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {anomalyContributingCases.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedCaseId(c.id)
                            setSelectedAnomalyId(null)
                            setShowAnomalyDrawer(false)
                          }}
                          className="p-2 border border-stone-200 hover:border-[#102A43] hover:bg-stone-50 cursor-pointer transition-colors text-[11px]"
                        >
                          <div className="flex items-center justify-between font-mono">
                            <strong className="text-[#102A43]">{c.caseNumber}</strong>
                            <span className="text-[#C62828] font-bold">{c.riskLevel}</span>
                          </div>
                          <div className="text-stone-600 text-[10px]">
                            {c.species} &bull; {c.village}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Anomaly Investigation Workflow Actions */}
                <div className="border border-stone-200 p-3 bg-white space-y-2">
                  <div className="text-[10px] font-mono text-stone-500 uppercase font-bold border-b pb-1">
                    Investigation Status Workflow
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                    <button
                      type="button"
                      disabled={updatingAnomalyStatus || selectedAnomaly.status === 'Under Investigation'}
                      onClick={() => handleAnomalyStatusChange('Under Investigation', 'Field officer dispatched for verification.')}
                      className="p-1.5 border border-stone-400 bg-stone-50 hover:bg-stone-100 disabled:opacity-40 font-bold"
                    >
                      INVESTIGATING
                    </button>
                    <button
                      type="button"
                      disabled={updatingAnomalyStatus || selectedAnomaly.status === 'Acknowledged'}
                      onClick={() => handleAnomalyStatusChange('Acknowledged', 'Surveillance alert acknowledged by officer.')}
                      className="p-1.5 border border-blue-600 bg-blue-50 hover:bg-blue-100 text-blue-900 disabled:opacity-40 font-bold"
                    >
                      ACKNOWLEDGE
                    </button>
                    <button
                      type="button"
                      disabled={updatingAnomalyStatus || selectedAnomaly.status === 'Escalated'}
                      onClick={() => handleAnomalyStatusChange('Escalated', 'Escalated to State Epidemiologist.')}
                      className="p-1.5 border border-red-600 bg-red-50 hover:bg-red-100 text-red-900 disabled:opacity-40 font-bold"
                    >
                      ESCALATE
                    </button>
                    <button
                      type="button"
                      disabled={updatingAnomalyStatus || selectedAnomaly.status === 'Dismissed'}
                      onClick={() => handleAnomalyStatusChange('Dismissed', 'Spurious signal or normal local fluctuation.')}
                      className="p-1.5 border border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-700 disabled:opacity-40 font-bold"
                    >
                      DISMISS
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                <div className="text-xs font-mono font-bold text-stone-600 uppercase mb-2">
                  Active Jurisdictional Anomalies ({anomalies.length})
                </div>
                {anomalies.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAnomalyId(a.id)}
                    className="p-2.5 border border-stone-300 hover:border-[#D97706] hover:bg-amber-50/50 cursor-pointer rounded-[2px]"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <strong className="text-[#102A43]">{a.signalType}</strong>
                      <span className="text-[#C62828] font-bold">+{a.percentageChange}%</span>
                    </div>
                    <div className="text-[11px] text-stone-700 mt-1">{a.title}</div>
                    <div className="text-[10px] text-stone-500 font-mono mt-1">
                      {a.jurisdiction.village || 'Sector'}, {a.jurisdiction.district} &bull; {a.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}

        {/* ── 8. UNMAPPED CASES DRAWER ── */}
        {showUnmappedDrawer && (
          <aside className="w-80 sm:w-96 bg-white border-l-2 border-[#102A43] shadow-xl flex flex-col z-30 shrink-0 h-full overflow-y-auto">
            <div className="bg-[#102A43] text-white p-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <MapPinOff size={15} className="text-[#FF8A80]" />
                <span className="text-xs font-mono font-bold text-white uppercase">
                  UNMAPPED CASES REGISTER ({unmappedFeatures.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowUnmappedDrawer(false)}
                className="text-white/70 hover:text-white p-1"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs font-sans flex-1">
              <div className="bg-amber-50 border-l-4 border-amber-500 p-2.5 text-[11px] text-amber-900">
                <strong>Integrity Policy:</strong> Cases without verified GPS coordinates are never placed at
                invented coordinates. They are recorded here for veterinary investigation and field geo-tagging.
              </div>

              {unmappedFeatures.length === 0 ? (
                <div className="p-6 text-center text-stone-500 font-mono text-xs">
                  All active cases currently possess verified geospatial coordinates.
                </div>
              ) : (
                <div className="space-y-2">
                  {unmappedFeatures.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCaseId(c.id)
                        setShowUnmappedDrawer(false)
                      }}
                      className="p-3 border border-stone-200 hover:border-[#102A43] hover:bg-stone-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between font-mono">
                        <strong className="text-[#102A43]">{c.caseNumber}</strong>
                        <span
                          className={`text-[9.5px] px-1.5 py-0.2 font-mono font-bold rounded-[1px] text-white ${
                            c.riskLevel === 'CRITICAL'
                              ? 'bg-[#C62828]'
                              : c.riskLevel === 'HIGH'
                              ? 'bg-[#E65100]'
                              : c.riskLevel === 'MEDIUM'
                              ? 'bg-[#E0A11A]'
                              : 'bg-[#2E7D32]'
                          }`}
                        >
                          {c.riskLevel}
                        </span>
                      </div>
                      <div className="text-stone-600 text-[11px] mt-1">
                        <div>
                          <strong>{c.species}</strong> ({c.breed}) &middot; Tag: {c.animalTag}
                        </div>
                        <div>
                          Village: {c.village}, {c.district}
                        </div>
                        <div className="text-stone-500 text-[10px] mt-1">
                          Reported: {new Date(c.reportedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] font-mono text-[#C62828] font-semibold">
                        GPS NOT RECORDED &bull; CLICK TO INSPECT DOSSIER
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
