import { useState, useEffect } from 'react'
import {
  ShieldAlert,
  AlertTriangle,
  MapPin,
  RefreshCw,
  Truck,
  X
} from 'lucide-react'
import { OutbreakSurveillanceMap } from '@/components/maps/OutbreakSurveillanceMap'
import {
  getOutbreakClusters,
  runOutbreakDetectionPipeline,
  updateClusterInvestigationStatus,
  getIntelligenceAlerts,
  acknowledgeIntelligenceAlert
} from '@/services/risk/outbreakEngine'
import { getVetCases } from '@/services/vetService'
import type { OutbreakCluster, ClusterStatus, IntelligenceAlert } from '@/services/risk/riskTypes'
import type { VeterinaryCase } from '@/types'

export function VetOutbreaksPage() {
  const [clusters, setClusters] = useState<OutbreakCluster[]>([])
  const [cases, setCases] = useState<VeterinaryCase[]>([])
  const [alerts, setAlerts] = useState<IntelligenceAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [runningPipeline, setRunningPipeline] = useState(false)
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('All')

  // Investigation Modal / Action Drawer
  const [actionCluster, setActionCluster] = useState<OutbreakCluster | null>(null)
  const [newStatus, setNewStatus] = useState<ClusterStatus>('Under Investigation')
  const [investigationNotes, setInvestigationNotes] = useState('')
  const [dispatchedMvu, setDispatchedMvu] = useState('MVU Unit 4 (Varanasi Sector)')
  const [savingAction, setSavingAction] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [clusterData, caseData, alertData] = await Promise.all([
        getOutbreakClusters(),
        getVetCases(),
        getIntelligenceAlerts('veterinarian')
      ])
      setClusters(clusterData)
      setCases(caseData)
      setAlerts(alertData)

      if (clusterData.length > 0 && !selectedClusterId) {
        setSelectedClusterId(clusterData[0].id)
      }
    } catch (err) {
      console.error('[VetOutbreaks] Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRunPipeline = async () => {
    try {
      setRunningPipeline(true)
      const updatedClusters = await runOutbreakDetectionPipeline()
      setClusters(updatedClusters)
      const alertData = await getIntelligenceAlerts('veterinarian')
      setAlerts(alertData)
    } catch (err) {
      console.error('[VetOutbreaks] Pipeline run failed:', err)
    } finally {
      setRunningPipeline(false)
    }
  }

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await acknowledgeIntelligenceAlert(alertId, 'Dr. Priya Sharma (Veterinary Officer)')
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: 'Acknowledged' } : a))
      )
    } catch (err) {
      console.error('[VetOutbreaks] Alert ack failed:', err)
    }
  }

  const handleOpenActionModal = (c: OutbreakCluster) => {
    setActionCluster(c)
    setNewStatus(c.status)
    setInvestigationNotes(c.investigation_notes || '')
  }

  const handleSaveInvestigationAction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!actionCluster) return
    try {
      setSavingAction(true)
      const formattedNotes = investigationNotes
        ? `[MVU: ${dispatchedMvu}] ${investigationNotes}`
        : `[MVU: ${dispatchedMvu}] Status updated to ${newStatus}`

      await updateClusterInvestigationStatus(
        actionCluster.id,
        newStatus,
        formattedNotes,
        'Dr. Priya Sharma (Veterinary Officer)'
      )

      await loadData()
      setActionCluster(null)
    } catch (err) {
      console.error('[VetOutbreaks] Status update failed:', err)
    } finally {
      setSavingAction(false)
    }
  }

  // Filtered clusters
  const filteredClusters = clusters.filter((c) => {
    if (statusFilter === 'All') return true
    return c.status === statusFilter
  })

  // Compute stat highlights
  const activeClusterCount = clusters.filter((c) => c.status !== 'Dismissed').length
  const totalCasesInClusters = clusters.reduce((acc, c) => acc + c.case_count, 0)
  const uniqueVillages = Array.from(new Set(clusters.flatMap((c) => c.affected_villages))).length
  const unackedAlertCount = alerts.filter((a) => a.status === 'Active').length

  if (loading) {
    return (
      <div className="p-8 text-center font-mono text-xs text-stone-500">
        <RefreshCw className="animate-spin inline mr-2 text-[#1B5E3C]" size={16} />
        INITIALIZING EPIDEMIOLOGICAL CLUSTERING DESK...
      </div>
    )
  }

  const getStatusBadge = (status: ClusterStatus) => {
    switch (status) {
      case 'Detected':
        return 'bg-[#C62828] text-white'
      case 'Under Investigation':
        return 'bg-[#D97706] text-white'
      case 'Escalated':
        return 'bg-[#7B1818] text-white'
      case 'Confirmed':
        return 'bg-[#831843] text-white'
      case 'Monitoring':
        return 'bg-[#1B5E3C] text-white'
      case 'Dismissed':
      default:
        return 'bg-stone-500 text-white'
    }
  }

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-5 max-w-7xl mx-auto font-sans">
      {/* 1. Header Banner */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs border-l-4 border-l-[#102A43] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#102A43] text-[#F7F5EE] px-2 py-0.5 rounded-[1px]">
              VETERINARY INTELLIGENCE DESK
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              DISTRICT EPIDEMIOLOGICAL UNIT &middot; VARANASI CADRE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#102A43]">
            Early Outbreak Detection &amp; Field Containment Desk &middot; प्रकोप निगरानी
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            Spatio-Temporal Case Clustering &bull; syndromic alerts &bull; Mobile Veterinary Unit (MVU) dispatch
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRunPipeline}
            disabled={runningPipeline}
            className="px-3.5 py-2 bg-[#1B5E3C] hover:bg-[#123C2A] text-white text-xs font-mono font-bold rounded-[2px] transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw size={14} className={runningPipeline ? 'animate-spin' : ''} />
            <span>{runningPipeline ? 'RUNNING CLUSTERING...' : 'RUN CLUSTER ENGINE'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Indicators Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        <div className="bg-white border border-stone-300 p-3.5 rounded-[2px] shadow-xs border-t-2 border-t-[#C62828]">
          <span className="text-[10px] text-stone-500 font-bold uppercase block">ACTIVE DETECTED CLUSTERS</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-[#102A43]">{activeClusterCount}</span>
            <span className="text-[10px] text-[#C62828] font-bold">SPATIAL DENSITY &ge; 3</span>
          </div>
        </div>

        <div className="bg-white border border-stone-300 p-3.5 rounded-[2px] shadow-xs border-t-2 border-t-[#D97706]">
          <span className="text-[10px] text-stone-500 font-bold uppercase block">CASES IN SURVEILLANCE</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-[#102A43]">{totalCasesInClusters}</span>
            <span className="text-[10px] text-stone-500">7-DAY WINDOW</span>
          </div>
        </div>

        <div className="bg-white border border-stone-300 p-3.5 rounded-[2px] shadow-xs border-t-2 border-t-[#1B5E3C]">
          <span className="text-[10px] text-stone-500 font-bold uppercase block">VILLAGES UNDER CORDON</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-[#102A43]">{uniqueVillages}</span>
            <span className="text-[10px] text-[#1B5E3C] font-bold">5KM RADIUS</span>
          </div>
        </div>

        <div className="bg-white border border-stone-300 p-3.5 rounded-[2px] shadow-xs border-t-2 border-t-[#102A43]">
          <span className="text-[10px] text-stone-500 font-bold uppercase block">PENDING URGENT ALERTS</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-[#C62828]">{unackedAlertCount}</span>
            <span className="text-[10px] text-stone-500">ACTION REQUIRED</span>
          </div>
        </div>
      </div>

      {/* 3. Urgent Intelligence Alerts Banner (if any active alerts) */}
      {alerts.some((a) => a.status === 'Active') && (
        <div className="space-y-2">
          {alerts
            .filter((a) => a.status === 'Active')
            .map((alert) => (
              <div
                key={alert.id}
                className="bg-[#FEF8EC] border border-[#D97706]/40 p-3.5 rounded-[2px] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 font-sans"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase bg-[#D97706] text-white px-1.5 py-0.2 rounded-[1px]">
                        {alert.alert_type}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#102A43]">
                        {alert.alert_code} &middot; {alert.target_village}, {alert.target_district}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[#102A43] mt-0.5">{alert.title}</p>
                    <p className="text-xs text-stone-700 mt-0.5">{alert.message}</p>
                    <p className="text-[11px] font-mono text-[#1B5E3C] mt-1">
                      Action: {alert.recommended_action}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAcknowledgeAlert(alert.id)}
                  className="px-3 py-1.5 bg-[#102A43] hover:bg-[#1B5E3C] text-white text-xs font-mono font-bold rounded-[2px] transition-colors shrink-0 cursor-pointer self-start md:self-center"
                >
                  ACKNOWLEDGE ALERT
                </button>
              </div>
            ))}
        </div>
      )}

      {/* 4. Main Outbreak GIS Map Component */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#102A43] flex items-center gap-1.5">
            <MapPin size={14} className="text-[#C62828]" />
            LIVE EPIDEMIOLOGICAL GIS MAP &middot; CLUSTER BUFFER &amp; CASES
          </h2>
          <span className="text-xs font-mono text-stone-500">
            TOTAL CLUSTERS: {clusters.length}
          </span>
        </div>

        <OutbreakSurveillanceMap
          clusters={clusters}
          cases={cases}
          selectedClusterId={selectedClusterId || undefined}
          onSelectCluster={(c) => setSelectedClusterId(c.id)}
          height="440px"
        />
      </div>

      {/* 5. Outbreak Clusters Section & Investigation Console */}
      <div className="space-y-3">
        {/* Filter bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap border-b border-stone-200 pb-2">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#102A43] flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-[#1B5E3C]" />
            SURVEILLANCE CLUSTERS &amp; INVESTIGATION ACTIONS
          </h2>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-stone-500">FILTER STATUS:</span>
            {['All', 'Detected', 'Under Investigation', 'Monitoring', 'Escalated'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-0.5 rounded-[1px] border text-xs cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#102A43] text-white border-[#102A43]'
                    : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Cluster Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClusters.map((cluster) => {
            const isSelected = cluster.id === selectedClusterId
            const isCritical = cluster.risk_level === 'CRITICAL' || cluster.cluster_score >= 75

            return (
              <div
                key={cluster.id}
                onClick={() => setSelectedClusterId(cluster.id)}
                className={`bg-white border rounded-[2px] p-4 shadow-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#102A43] ring-1 ring-[#102A43] border-l-4 border-l-[#C62828]'
                    : 'border-stone-300 hover:border-stone-400'
                }`}
              >
                {/* Header Strip */}
                <div className="flex items-start justify-between gap-2 border-b border-stone-200 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#102A43] bg-stone-100 px-1.5 py-0.5 rounded-[1px]">
                        {cluster.cluster_code}
                      </span>
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-[1px] ${getStatusBadge(cluster.status)}`}>
                        {cluster.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-[#102A43] mt-1 leading-snug">
                      {cluster.cluster_name}
                    </h3>
                  </div>

                  {/* Cluster Score Badge */}
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono text-stone-500 uppercase block">OUTBREAK SCORE</span>
                    <span className={`font-mono font-black text-lg ${isCritical ? 'text-[#C62828]' : 'text-[#D97706]'}`}>
                      {cluster.cluster_score}/100
                    </span>
                  </div>
                </div>

                {/* Cluster Metadata Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs py-2.5 font-sans border-b border-stone-100">
                  <div>
                    <span className="text-stone-500 block text-[11px]">Affected Villages:</span>
                    <span className="font-semibold text-stone-800">
                      {cluster.affected_villages.join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[11px]">Epicenter Radius:</span>
                    <span className="font-mono font-bold text-stone-800">
                      {cluster.radius_km} km buffer
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[11px]">Linked Cases:</span>
                    <span className="font-mono font-bold text-[#102A43]">
                      {cluster.case_count} reported cases
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[11px]">Estimated Herd Contacts:</span>
                    <span className="font-mono font-bold text-stone-800">
                      ~{cluster.affected_animal_count} cattle/buffalo
                    </span>
                  </div>
                </div>

                {/* Common Symptoms Pill List */}
                <div className="py-2 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-stone-500 block font-bold">
                    PREDOMINANT SYNDROMIC SIGNALS:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {cluster.common_symptoms.map((sym, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-medium px-2 py-0.5 bg-stone-100 border border-stone-200 rounded text-stone-700"
                      >
                        {sym}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Investigation Notes if present */}
                {cluster.investigation_notes && (
                  <div className="bg-[#FAF9F5] p-2 rounded-[2px] border border-stone-200 text-xs text-stone-700 font-sans my-2">
                    <span className="font-mono font-bold text-[10px] text-[#1B5E3C] uppercase block mb-0.5">
                      INVESTIGATION LOG ({cluster.reviewed_by || 'Field Vet'}):
                    </span>
                    <p className="italic">&ldquo;{cluster.investigation_notes}&rdquo;</p>
                  </div>
                )}

                {/* Action Toolbar */}
                <div className="pt-2 flex items-center justify-between gap-2 flex-wrap font-mono text-xs">
                  <span className="text-[11px] text-stone-400">
                    Updated: {new Date(cluster.updated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenActionModal(cluster)
                    }}
                    className="px-3 py-1.5 bg-[#102A43] hover:bg-[#1B5E3C] text-white text-xs font-bold rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Truck size={13} />
                    <span>INVESTIGATION ACTION &rarr;</span>
                  </button>
                </div>
              </div>
            )
          })}

          {filteredClusters.length === 0 && (
            <div className="col-span-2 bg-white border border-stone-300 p-8 text-center rounded-[2px] font-mono text-xs text-stone-500">
              NO CLUSTERS FOUND MATCHING THE SELECTED STATUS FILTER.
            </div>
          )}
        </div>
      </div>

      {/* 6. Investigation Action Modal */}
      {actionCluster && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs">
          <div className="bg-white border border-stone-400 w-full max-w-xl rounded-[2px] shadow-xl overflow-hidden font-sans">
            {/* Modal Header */}
            <div className="bg-[#102A43] text-white p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#E0A11A] font-bold block">
                  EPIDEMIOLOGICAL INVESTIGATION PROTOCOL
                </span>
                <h3 className="font-bold text-base text-[#F7F5EE] mt-0.5">
                  Cluster Action: {actionCluster.cluster_code}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActionCluster(null)}
                className="text-white/70 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveInvestigationAction} className="p-4 sm:p-5 space-y-4">
              <div className="bg-stone-50 p-3 rounded-[2px] border border-stone-200 text-xs">
                <p className="font-bold text-[#102A43]">{actionCluster.cluster_name}</p>
                <p className="text-stone-600 mt-0.5">
                  Score: <strong>{actionCluster.cluster_score}/100</strong> &bull; Villages: <strong>{actionCluster.affected_villages.join(', ')}</strong> &bull; Cases: <strong>{actionCluster.case_count}</strong>
                </p>
              </div>

              {/* Status Transition Select */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold uppercase text-stone-700 block">
                  TRANSITION INVESTIGATION STATUS:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ClusterStatus)}
                  className="w-full border border-stone-300 p-2 text-xs rounded-[2px] font-mono focus:outline-[#102A43]"
                >
                  <option value="Detected">Detected (Newly Flagged)</option>
                  <option value="Under Investigation">Under Investigation (MVU Dispatched)</option>
                  <option value="Monitoring">Monitoring (Routine Vigilance)</option>
                  <option value="Escalated">Escalated to District Veterinary Officer (DVO)</option>
                  <option value="Confirmed">Confirmed Outbreak (Lab Confirmed)</option>
                  <option value="Dismissed">Dismissed (Non-infectious / Resolved)</option>
                </select>
              </div>

              {/* MVU Deployment Select */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold uppercase text-stone-700 block">
                  DISPATCH MOBILE VETERINARY UNIT (MVU):
                </label>
                <select
                  value={dispatchedMvu}
                  onChange={(e) => setDispatchedMvu(e.target.value)}
                  className="w-full border border-stone-300 p-2 text-xs rounded-[2px] font-mono focus:outline-[#102A43]"
                >
                  <option value="MVU Unit 4 (Varanasi Sector)">MVU Unit 4 (Varanasi Sector)</option>
                  <option value="MVU Unit 2 (Chiraigaon Sector)">MVU Unit 2 (Chiraigaon Sector)</option>
                  <option value="Emergency Rapid Response Team A">Emergency Rapid Response Team A</option>
                  <option value="Local Dispensary Officer Only">Local Dispensary Officer Only</option>
                </select>
              </div>

              {/* Clinical Notes Input */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold uppercase text-stone-700 block">
                  INVESTIGATION INSTRUCTIONS &amp; CLINICAL NOTES:
                </label>
                <textarea
                  rows={3}
                  value={investigationNotes}
                  onChange={(e) => setInvestigationNotes(e.target.value)}
                  placeholder="Record MVU orders, cold-chain sample requirements, village quarantine cordon..."
                  className="w-full border border-stone-300 p-2 text-xs rounded-[2px] focus:outline-[#102A43]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-stone-200 flex items-center justify-end gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setActionCluster(null)}
                  className="px-3 py-1.5 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-[2px]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={savingAction}
                  className="px-4 py-1.5 bg-[#1B5E3C] hover:bg-[#123C2A] text-white font-bold rounded-[2px] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {savingAction ? 'SAVING ACTION...' : 'SUBMIT DIRECTIVE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
