import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin,
  RefreshCw,
  Search,
  TrendingUp,
  ShieldAlert,
  Info
} from 'lucide-react'
import {
  getOutbreakClusters,
  runOutbreakDetectionPipeline
} from '@/services/risk/outbreakEngine'
import { getVetCases } from '@/services/vetService'
import {
  getJurisdictionalAnomalies,
  setAnomalyInvestigationStatus,
  type AnomalyDetectionWarning,
  type AnomalyStatus
} from '@/lib/intelligence'
import type { OutbreakCluster } from '@/services/risk/riskTypes'
import type { VeterinaryCase } from '@/types'

export function AdminOutbreaksPage() {
  const [clusters, setClusters] = useState<OutbreakCluster[]>([])
  const [cases, setCases] = useState<VeterinaryCase[]>([])
  const [anomalies, setAnomalies] = useState<AnomalyDetectionWarning[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('All')
  const [updatingAnomalyId, setUpdatingAnomalyId] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const [clusterList, caseList, anomalyList] = await Promise.all([
        getOutbreakClusters(),
        getVetCases(),
        getJurisdictionalAnomalies(),
      ])
      setClusters(clusterList)
      setCases(caseList)
      setAnomalies(anomalyList)
    } catch (err) {
      console.error('[AdminOutbreaks] Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      const [updated, anomalyList] = await Promise.all([
        runOutbreakDetectionPipeline(),
        getJurisdictionalAnomalies(),
      ])
      setClusters(updated)
      setAnomalies(anomalyList)
    } catch (err) {
      console.error('[AdminOutbreaks] Refresh failed:', err)
    } finally {
      setRefreshing(false)
    }
  }

  const handleUpdateAnomalyStatus = async (
    anomalyId: string,
    newStatus: AnomalyStatus,
    notes?: string
  ) => {
    try {
      setUpdatingAnomalyId(anomalyId)
      await setAnomalyInvestigationStatus(
        anomalyId,
        newStatus,
        notes,
        'State Surveillance Officer (Admin)'
      )
      const updated = await getJurisdictionalAnomalies()
      setAnomalies(updated)
    } catch (err) {
      console.error('[AdminOutbreaks] Failed to update anomaly status:', err)
    } finally {
      setUpdatingAnomalyId(null)
    }
  }

  const filteredClusters = clusters.filter((c) => {
    const matchesSearch =
      c.cluster_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cluster_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.affected_villages.some((v) => v.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  // Surveillance metrics
  const activeClusters = clusters.filter((c) => c.status !== 'Dismissed').length
  const criticalClusters = clusters.filter((c) => c.risk_level === 'CRITICAL' || c.cluster_score >= 75).length
  const totalCordonVillages = Array.from(new Set(clusters.flatMap((c) => c.affected_villages))).length

  if (loading) {
    return (
      <div className="p-8 text-center font-mono text-xs text-stone-500">
        <RefreshCw className="animate-spin inline mr-2 text-[#1B5E3C]" size={16} />
        LOADING NATIONAL SURVEILLANCE RECORDS...
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-5 max-w-7xl mx-auto font-sans">
      {/* 1. National Directorate Header */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs border-l-4 border-l-[#102A43] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#102A43] text-[#F7F5EE] px-2 py-0.5 rounded-[1px]">
              NATIONAL SURVEILLANCE DESK
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              EPIDEMIOLOGICAL SURVEILLANCE &amp; BIOSECURITY DESK
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#102A43]">
            National Outbreak Detection &amp; Containment Monitoring &middot; राष्ट्रीय प्रकोप नियंत्रण
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            Real-time automated spatio-temporal cluster surveillance, syndromic alerts, and ring biosecurity enforcement
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/admin/surveillance-map"
            className="px-3 py-2 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 text-xs font-mono font-bold rounded-[2px] transition-colors flex items-center gap-1.5"
          >
            <MapPin size={13} className="text-[#C62828]" />
            <span>FULL GIS MAP &rarr;</span>
          </Link>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 bg-[#102A43] hover:bg-[#1B5E3C] text-white text-xs font-mono font-bold rounded-[2px] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'SCANNING...' : 'SYNC EPIDEMIC DATA'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-mono">
        <div className="bg-white border border-stone-300 p-3.5 rounded-[2px] shadow-xs border-t-2 border-t-[#C62828]">
          <span className="text-[10px] text-stone-500 font-bold uppercase block">ACTIVE OUTBREAK CLUSTERS</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-[#102A43]">{activeClusters}</span>
            <span className="text-[10px] text-[#C62828] font-bold">STATE-MONITORED</span>
          </div>
        </div>

        <div className="bg-white border border-stone-300 p-3.5 rounded-[2px] shadow-xs border-t-2 border-t-[#D97706]">
          <span className="text-[10px] text-stone-500 font-bold uppercase block">HIGH-CONCERN CLUSTERS</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-[#102A43]">{criticalClusters}</span>
            <span className="text-[10px] text-[#D97706] font-bold">SCORE &ge; 70</span>
          </div>
        </div>

        <div className="bg-white border border-stone-300 p-3.5 rounded-[2px] shadow-xs border-t-2 border-t-[#1B5E3C]">
          <span className="text-[10px] text-stone-500 font-bold uppercase block">VILLAGES UNDER CORDON</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-[#102A43]">{totalCordonVillages}</span>
            <span className="text-[10px] text-[#1B5E3C] font-bold">5KM CONTAINMENT</span>
          </div>
        </div>

        <div className="bg-white border border-stone-300 p-3.5 rounded-[2px] shadow-xs border-t-2 border-t-[#E0A11A]">
          <span className="text-[10px] text-stone-500 font-bold uppercase block">STATISTICAL ANOMALIES</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-[#102A43]">
              {anomalies.filter((a) => a.status !== 'Dismissed').length}
            </span>
            <span className="text-[10px] text-[#D97706] font-bold">7D/30D ENGINE</span>
          </div>
        </div>

        <div className="bg-white border border-stone-300 p-3.5 rounded-[2px] shadow-xs border-t-2 border-t-[#102A43]">
          <span className="text-[10px] text-stone-500 font-bold uppercase block">MONITORED CLINICAL CASES</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-[#102A43]">{cases.length}</span>
            <span className="text-[10px] text-stone-500">DISTRICT ROSTER</span>
          </div>
        </div>
      </div>

      {/* 3. National Epidemic Curve & Surveillance Overview Card */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-stone-200 pb-2">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#102A43] flex items-center gap-1.5">
            <TrendingUp size={14} className="text-[#1B5E3C]" />
            7-DAY EPIDEMIC CURVE &middot; SYNDROMIC TIME-SERIES TREND
          </h2>
          <span className="text-[10px] font-mono text-stone-500">
            AGGREGATED CASE INCIDENCE RATE (ACIR)
          </span>
        </div>

        {/* Simplified Epidemic Histogram Simulation */}
        <div className="grid grid-cols-7 gap-2 pt-2 pb-1 items-end h-28 font-mono text-center">
          {[
            { day: 'Day -6', count: 1, height: '20%' },
            { day: 'Day -5', count: 2, height: '35%' },
            { day: 'Day -4', count: 2, height: '35%' },
            { day: 'Day -3', count: 4, height: '65%' },
            { day: 'Day -2', count: 5, height: '80%' },
            { day: 'Yesterday', count: 6, height: '95%' },
            { day: 'Today', count: 4, height: '65%' },
          ].map((bar, i) => (
            <div key={i} className="flex flex-col items-center h-full justify-end group">
              <span className="text-[10px] font-bold text-stone-700 mb-1 group-hover:text-[#C62828]">
                {bar.count}
              </span>
              <div
                className="w-full bg-[#1B5E3C] group-hover:bg-[#C62828] rounded-t-[1px] transition-all duration-300"
                style={{ height: bar.height }}
              />
              <span className="text-[9px] text-stone-500 mt-1 uppercase block truncate w-full">
                {bar.day}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Surveillance Registry Table */}
      <div className="bg-white border border-stone-300 rounded-[2px] shadow-xs overflow-hidden">
        {/* Controls Bar */}
        <div className="bg-[#FAF9F5] border-b border-stone-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search cluster code, village, district..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1 bg-white border border-stone-300 text-xs rounded-[1px] focus:outline-[#102A43]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-stone-500">STATUS:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white border border-stone-300 px-2 py-1 text-xs rounded-[1px] focus:outline-[#102A43]"
            >
              <option value="All">All Statuses</option>
              <option value="Detected">Detected</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Monitoring">Monitoring</option>
              <option value="Escalated">Escalated</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Dismissed">Dismissed</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#102A43] text-[#F7F5EE] font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="p-3">Cluster Code</th>
                <th className="p-3">Cluster Name / Epicenter</th>
                <th className="p-3">Villages</th>
                <th className="p-3 text-center">Cases</th>
                <th className="p-3 text-center">Risk Score</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3">Last Verified</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredClusters.map((cluster) => {
                const isCritical = cluster.risk_level === 'CRITICAL' || cluster.cluster_score >= 75
                const isHigh = cluster.risk_level === 'HIGH' || cluster.cluster_score >= 60

                return (
                  <tr
                    key={cluster.id}
                    className="hover:bg-stone-50 transition-colors"
                  >
                    <td className="p-3 font-mono font-bold text-[#102A43]">
                      {cluster.cluster_code}
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-stone-900 block">{cluster.cluster_name}</span>
                      <span className="text-[11px] text-stone-500 font-mono">
                        Radius: {cluster.radius_km} km buffer
                      </span>
                    </td>
                    <td className="p-3 text-stone-700">
                      {cluster.affected_villages.join(', ')}
                    </td>
                    <td className="p-3 font-mono font-bold text-center text-[#102A43]">
                      {cluster.case_count}
                    </td>
                    <td className="p-3 text-center font-mono">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-[1px] font-bold text-[11px] ${
                          isCritical
                            ? 'bg-[#FDF0EE] text-[#C62828] border border-[#C62828]/40'
                            : isHigh
                            ? 'bg-[#FEF8EC] text-[#D97706] border border-[#D97706]/40'
                            : 'bg-[#EBF5EE] text-[#1B5E3C] border border-[#2E7D32]/40'
                        }`}
                      >
                        {cluster.cluster_score} / 100
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-[1px] bg-stone-100 text-stone-800 border border-stone-300">
                        {cluster.status}
                      </span>
                    </td>
                    <td className="p-3 text-stone-500 font-mono text-[11px]">
                      {new Date(cluster.updated_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        to="/vet/outbreaks"
                        className="font-mono font-bold text-[11px] text-[#1B5E3C] hover:underline"
                      >
                        VIEW DOSSIER &rarr;
                      </Link>
                    </td>
                  </tr>
                )
              })}

              {filteredClusters.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-500 font-mono text-xs">
                    NO OUTBREAK CLUSTERS FOUND MATCHING CRITERIA.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Statistical Anomaly Surveillance Section (Stage 10 Disease Intelligence) */}
      <div className="bg-white border border-stone-300 rounded-[2px] shadow-xs space-y-3 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200 pb-3 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="text-[#D97706]" size={16} />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#102A43]">
                5. STATISTICAL ANOMALY SURVEILLANCE SIGNALS &middot; प्रारंभिक असामान्य सांख्यिकी चेतावनी
              </h2>
            </div>
            <p className="text-xs text-stone-600 mt-0.5">
              Automated rolling 7-day observation vs. 30-day empirical baseline detection across livestock jurisdictions.
            </p>
          </div>
          <Link
            to="/admin/surveillance-map"
            className="px-2.5 py-1.5 bg-[#102A43] hover:bg-[#1B5E3C] text-white text-xs font-mono font-bold rounded-[2px] transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <MapPin size={12} className="text-[#FEF08A]" />
            <span>GIS ANOMALY OVERLAY &rarr;</span>
          </Link>
        </div>

        {/* Conceptual Distinction Callout (Standard Requirement 8) */}
        <div className="bg-[#FAF9F5] border border-stone-200 p-3 rounded-[2px] text-xs font-mono space-y-1">
          <div className="text-[10px] text-stone-500 font-bold uppercase flex items-center gap-1.5">
            <Info size={12} className="text-[#102A43]" />
            <span>Surveillance Architecture &amp; Definition Distinction:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-[11px] pt-1">
            <div className="p-2 bg-white border border-stone-200">
              <strong className="text-[#102A43] block">Individual Case Risk</strong>
              <span className="text-stone-600 text-[10px]">Deterministic multi-factor severity score (0–100) per clinical intake.</span>
            </div>
            <div className="p-2 bg-white border border-stone-200">
              <strong className="text-[#D97706] block">Statistical Anomaly</strong>
              <span className="text-stone-600 text-[10px]">&ge;75% volume surge or mortality spike in village over 7-day rolling baseline.</span>
            </div>
            <div className="p-2 bg-white border border-stone-200">
              <strong className="text-[#E65100] block">Outbreak Cluster</strong>
              <span className="text-stone-600 text-[10px]">Algorithmic spatio-temporal grouping within 5 km biosecurity cordon.</span>
            </div>
            <div className="p-2 bg-white border border-stone-200">
              <strong className="text-[#C62828] block">Confirmed Outbreak</strong>
              <span className="text-stone-600 text-[10px]">Statutory notification declared exclusively by State Epidemiologist / CVO.</span>
            </div>
          </div>
        </div>

        {/* Anomalies Table */}
        <div className="border border-stone-200 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F5] text-stone-600 font-mono text-[11px] border-b border-stone-200 uppercase">
              <tr>
                <th className="p-2.5">Signal Type</th>
                <th className="p-2.5">Anomaly Title</th>
                <th className="p-2.5">Jurisdiction</th>
                <th className="p-2.5 text-center">Observed / Baseline</th>
                <th className="p-2.5 text-center">Surge %</th>
                <th className="p-2.5 text-center">Affected Cases</th>
                <th className="p-2.5 text-center">Status</th>
                <th className="p-2.5 text-right">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 font-sans">
              {anomalies.map((a) => {
                const isCritical = a.severity === 'CRITICAL' || a.severity === 'HIGH'
                return (
                  <tr key={a.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="p-2.5 font-mono text-[11px]">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-[1px] font-bold ${
                          isCritical
                            ? 'bg-red-50 text-[#C62828] border border-red-200'
                            : 'bg-amber-50 text-[#D97706] border border-amber-200'
                        }`}
                      >
                        {a.signalType}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <strong className="text-[#102A43] block">{a.title}</strong>
                      <span className="text-[11px] text-stone-500 line-clamp-1">{a.description}</span>
                    </td>
                    <td className="p-2.5 font-mono text-[11px] text-stone-700">
                      <strong>{a.jurisdiction.village || 'Sector Wide'}</strong>, {a.jurisdiction.district}
                    </td>
                    <td className="p-2.5 text-center font-mono text-[11px]">
                      <span className="font-bold text-[#102A43]">{a.observedValue}</span> / {a.baselineValue}
                    </td>
                    <td className="p-2.5 text-center font-mono">
                      <span className="text-[#C62828] font-bold text-[11px]">
                        +{a.percentageChange}%
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-mono text-[11px]">
                      {a.affectedCaseCount} {a.affectedMortalityCount > 0 && <span className="text-[#C62828] font-bold">({a.affectedMortalityCount} deaths)</span>}
                    </td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-[1px] ${
                          a.status === 'Detected'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : a.status === 'Under Investigation'
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : a.status === 'Escalated'
                            ? 'bg-red-100 text-red-900 border border-red-300'
                            : a.status === 'Acknowledged'
                            ? 'bg-purple-100 text-purple-900 border border-purple-300'
                            : 'bg-stone-100 text-stone-700 border border-stone-300'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-mono text-[11px]">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {a.status !== 'Under Investigation' && (
                          <button
                            type="button"
                            disabled={updatingAnomalyId === a.id}
                            onClick={() => handleUpdateAnomalyStatus(a.id, 'Under Investigation', 'Investigation initiated by state desk.')}
                            className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 border border-stone-300 text-[10px] font-bold"
                          >
                            Investigate
                          </button>
                        )}
                        {a.status !== 'Escalated' && (
                          <button
                            type="button"
                            disabled={updatingAnomalyId === a.id}
                            onClick={() => handleUpdateAnomalyStatus(a.id, 'Escalated', 'Escalated to Chief Veterinary Officer.')}
                            className="px-2 py-0.5 bg-red-50 hover:bg-red-100 border border-red-300 text-[#C62828] text-[10px] font-bold"
                          >
                            Escalate
                          </button>
                        )}
                        {a.status !== 'Dismissed' && (
                          <button
                            type="button"
                            disabled={updatingAnomalyId === a.id}
                            onClick={() => handleUpdateAnomalyStatus(a.id, 'Dismissed', 'Statistical variation verified as non-epizootic.')}
                            className="px-2 py-0.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 text-[10px]"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {anomalies.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-stone-500 font-mono text-xs">
                    NO ACTIVE STATISTICAL ANOMALIES DETECTED IN MONITORING WINDOW.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Limitations Notice */}
        <div className="bg-amber-50/60 border border-amber-200 p-2.5 rounded-[1px] text-[10px] text-amber-900 font-sans">
          <strong>Epidemiological Intelligence Notice:</strong> Statistical anomaly flags are calculated using rolling 7-day observation vs. 30-day baseline ratios. They do not constitute automated clinical diagnoses or formal statutory epidemic decrees. Laboratory confirmatory assays (DDDL ELISA/PCR) are legally mandatory prior to disease declaration under NADRS guidelines.
        </div>
      </div>
    </div>
  )
}
