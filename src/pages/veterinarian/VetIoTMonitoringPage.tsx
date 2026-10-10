// ============================================================
// PASHURAKSHA (पशुरक्षा) — VETERINARY IOT MONITORING CONSOLE
// Stage 11: Modular Livestock Health IoT Subsystem
// Standard: NADRS-II Veterinary Clinical Alert Triage & Intake
// "Detect Early. Prevent Outbreaks. Protect Livestock."
// ============================================================

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FolderPlus,
  Filter,
  Search,
  ExternalLink,
  Info,
  CheckCircle2,
  Flame,
  RotateCw,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import {
  getSensorAlerts,
  acknowledgeIoTAlert,
  dismissIoTAlert,
  createCaseFromIoTAlert,
  triggerDemoScenario,
} from '@/lib/iot'
import type { SensorAnomalyAlert, IoTAlertStatus } from '@/lib/iot'

export function VetIoTMonitoringPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [alerts, setAlerts] = useState<SensorAnomalyAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'ALL' | IoTAlertStatus>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const vetName = (user as any)?.full_name || user?.email || 'Dr. Priya Sharma (Veterinary Officer)'

  const loadAlerts = async () => {
    try {
      setLoading(true)
      const data = await getSensorAlerts()
      setAlerts(data)
    } catch (err) {
      console.error('Failed to load IoT alerts:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [])

  const filteredAlerts = alerts.filter((a) => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.animal_tag?.toLowerCase().includes(q) ||
        a.animal_id?.toLowerCase().includes(q) ||
        a.device_eui?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const activeCount = alerts.filter((a) => a.status === 'ACTIVE').length
  const criticalCount = alerts.filter((a) => a.status === 'ACTIVE' && a.severity === 'CRITICAL').length
  const highCount = alerts.filter((a) => a.status === 'ACTIVE' && a.severity === 'HIGH').length

  const handleAcknowledge = async (alertId: string) => {
    setProcessingId(alertId)
    try {
      await acknowledgeIoTAlert(alertId, vetName, 'Reviewed by attending veterinarian. Placed under active clinical monitoring.')
      setActionMessage(`Alert #${alertId} acknowledged.`)
      await loadAlerts()
    } catch (err: any) {
      setActionMessage(`Failed to acknowledge: ${err.message}`)
    } finally {
      setProcessingId(null)
    }
  }

  const handleDismiss = async (alertId: string) => {
    const reason = window.prompt('Enter clinical reason for dismissing this IoT alert:', 'Transient measurement artifact')
    if (!reason) return
    setProcessingId(alertId)
    try {
      await dismissIoTAlert(alertId, vetName, reason)
      setActionMessage(`Alert #${alertId} dismissed.`)
      await loadAlerts()
    } catch (err: any) {
      setActionMessage(`Failed to dismiss: ${err.message}`)
    } finally {
      setProcessingId(null)
    }
  }

  const handleCreateCase = async (alert: SensorAnomalyAlert) => {
    setProcessingId(alert.id)
    try {
      const res = await createCaseFromIoTAlert(
        alert,
        vetName,
        'Physiological anomaly detected via smart telemetry requiring clinical physical triage.'
      )
      setActionMessage(`Veterinary Case #${res.vetCaseId} created successfully. Redirecting...`)
      await loadAlerts()
      if (res.vetCaseId) {
        setTimeout(() => {
          navigate(`/vet/cases/${res.vetCaseId}`)
        }, 1200)
      }
    } catch (err: any) {
      setActionMessage(`Failed to create case: ${err.message}`)
      setProcessingId(null)
    }
  }

  const handleSimulateScenario = async (scenario: 'pyrexia_spike' | 'rumination_drop') => {
    await triggerDemoScenario(scenario)
    await loadAlerts()
    setActionMessage(`Simulated telemetry injected (${scenario}). Review updated alert list below.`)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header & Institutional Identification */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase bg-[#102A43] text-white px-2 py-0.5 rounded-[1px]">
              VETERINARY CLINICAL SURVEILLANCE
            </span>
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-[1px]">
              STAGE 11: SMART IOT TRIAGE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
            Smart Livestock Telemetry & Clinical Anomaly Triage
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
            Real-time physiological alerts from smart ear tags, rumen boluses, and shed microclimate monitors.
          </p>
        </div>

        {/* Demo Simulation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSimulateScenario('pyrexia_spike')}
            className="text-xs font-mono font-semibold bg-red-50 text-red-800 border border-red-300 px-3 py-2 rounded hover:bg-red-100 flex items-center gap-1.5"
            title="Simulate Pyrexia Spike (40.2°C)"
          >
            <Flame className="w-3.5 h-3.5 text-red-600" />
            + Simulate Fever Spike
          </button>
          <button
            onClick={loadAlerts}
            className="p-2 border border-stone-300 rounded hover:bg-stone-50 text-stone-700 text-xs flex items-center gap-1"
            title="Refresh Alert Queue"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Feedback Notification */}
      {actionMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded text-xs flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="underline text-stone-500 hover:text-stone-800">
            Dismiss
          </button>
        </div>
      )}

      {/* 3. Clinical Distinction Callout (Req 2 & 7.8) */}
      <div className="bg-amber-50 border border-amber-300 rounded p-3 text-xs text-amber-950 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-900">Clinical Evaluation Principles (ICAR-IVRI Standard):</p>
          <p className="text-[11px] text-amber-800 mt-0.5">
            <strong>1. Sensor Telemetry &ne; Definitive Diagnosis:</strong> Smart measurements indicate physiological signals for clinical triage, not conclusive diagnoses or pharmaceutical prescriptions.
            <br />
            <strong>2. Device Offline &ne; Sick Animal:</strong> Packet timeouts or battery drops represent communication failures and must not be conflated with animal disease.
            <br />
            <strong>3. Implausible Readings:</strong> Body temperature &lt;32°C or &gt;44°C is flagged as hardware detachment or transducer error (<span className="font-mono">SENSOR_DATA_INVALID</span>).
          </p>
        </div>
      </div>

      {/* 4. Triage KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-stone-200 p-4 rounded-[2px] shadow-xs border-l-4 border-l-red-600">
          <div className="text-stone-500 text-xs font-semibold uppercase tracking-wider mb-1">
            Critical Alerts
          </div>
          <div className="text-3xl font-bold font-serif text-red-700 font-mono">{criticalCount}</div>
          <div className="text-[11px] text-red-600 mt-1 font-semibold">Immediate clinical review needed</div>
        </div>

        <div className="bg-white border border-stone-200 p-4 rounded-[2px] shadow-xs border-l-4 border-l-amber-500">
          <div className="text-stone-500 text-xs font-semibold uppercase tracking-wider mb-1">
            High Priority Alerts
          </div>
          <div className="text-3xl font-bold font-serif text-amber-800 font-mono">{highCount}</div>
          <div className="text-[11px] text-stone-500 mt-1">Sustained abnormal deviation</div>
        </div>

        <div className="bg-white border border-stone-200 p-4 rounded-[2px] shadow-xs border-l-4 border-l-blue-600">
          <div className="text-stone-500 text-xs font-semibold uppercase tracking-wider mb-1">
            Active Triage Queue
          </div>
          <div className="text-3xl font-bold font-serif text-blue-900 font-mono">{activeCount}</div>
          <div className="text-[11px] text-stone-500 mt-1">Pending clinician review</div>
        </div>

        <div className="bg-white border border-stone-200 p-4 rounded-[2px] shadow-xs">
          <div className="text-stone-500 text-xs font-semibold uppercase tracking-wider mb-1">
            Total Flagged Packets
          </div>
          <div className="text-3xl font-bold font-serif text-stone-900 font-mono">{alerts.length}</div>
          <div className="text-[11px] text-stone-500 mt-1">Across all registered holdings</div>
        </div>
      </div>

      {/* 5. Filters & Search Bar */}
      <div className="bg-white border border-stone-200 p-3 rounded flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 text-xs text-stone-600 mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          {(['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'LINKED_TO_CASE', 'DISMISSED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                statusFilter === st
                  ? 'bg-[#102A43] text-white font-semibold'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-stone-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search animal, serial, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-stone-300 rounded focus:outline-none focus:border-[#102A43]"
          />
        </div>
      </div>

      {/* 6. Alert Triage Queue List */}
      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-stone-500">
          Loading clinical anomaly alerts...
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-white border border-stone-300 rounded p-12 text-center max-w-lg mx-auto">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-900">Triage Queue Clear</h3>
          <p className="text-xs text-stone-600 mt-1">
            No active physiological anomalies requiring veterinary review under this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const isProcessing = processingId === alert.id
            const isCritical = alert.severity === 'CRITICAL'
            const isHigh = alert.severity === 'HIGH'

            return (
              <div
                key={alert.id}
                className={`bg-white border rounded-[2px] p-4 shadow-xs transition-all ${
                  isCritical
                    ? 'border-l-4 border-l-red-600 border-stone-200 bg-red-50/20'
                    : isHigh
                    ? 'border-l-4 border-l-amber-500 border-stone-200'
                    : 'border-l-4 border-l-blue-500 border-stone-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Alert Info */}
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          isCritical
                            ? 'bg-red-100 text-red-900 border border-red-300'
                            : isHigh
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-blue-100 text-blue-900'
                        }`}
                      >
                        {alert.severity} SEVERITY
                      </span>

                      <span className="text-[10px] font-mono uppercase bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200">
                        {alert.alert_category.replace(/_/g, ' ')}
                      </span>

                      <span className="text-[10px] font-mono text-stone-500">
                        {new Date(alert.created_at).toLocaleString([], {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>

                      {alert.status === 'LINKED_TO_CASE' && alert.linked_vet_case_id && (
                        <span className="text-[10px] font-mono bg-purple-100 text-purple-900 px-2 py-0.5 rounded font-bold border border-purple-200">
                          CASE OPENED: #{alert.linked_vet_case_id}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-stone-900">{alert.title}</h3>
                    <p className="text-xs text-stone-700 leading-relaxed">{alert.description}</p>

                    {/* Animal & Device Details */}
                    <div className="flex items-center gap-4 text-xs text-stone-600 pt-1 flex-wrap">
                      {alert.animal_id && (
                        <span>
                          <strong>Animal:</strong> Tag:{' '}
                          <span className="font-mono">{alert.animal_tag || alert.animal_id}</span>
                        </span>
                      )}
                      <span>
                        <strong>Sensor EUI:</strong> <span className="font-mono">{alert.device_eui}</span>
                      </span>
                      {alert.recommended_action && (
                        <span className="text-[#102A43] font-semibold bg-blue-50 px-2 py-0.5 rounded">
                          Recommendation: {alert.recommended_action}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2 shrink-0">
                    {alert.status === 'ACTIVE' && (
                      <>
                        <button
                          onClick={() => handleCreateCase(alert)}
                          disabled={isProcessing}
                          className="bg-[#1B5E3C] hover:bg-[#123C2A] text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs whitespace-nowrap"
                        >
                          <FolderPlus className="w-3.5 h-3.5" />
                          Open Clinical Case
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            disabled={isProcessing}
                            className="bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 px-2.5 py-1 rounded text-xs font-medium"
                          >
                            Acknowledge
                          </button>
                          <button
                            onClick={() => handleDismiss(alert.id)}
                            disabled={isProcessing}
                            className="text-stone-500 hover:text-stone-800 text-xs px-2 py-1"
                          >
                            Dismiss
                          </button>
                        </div>
                      </>
                    )}

                    {alert.status === 'ACKNOWLEDGED' && (
                      <div className="text-right">
                        <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1 justify-end">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Acknowledged
                        </span>
                        <span className="text-[10px] text-stone-500 block">by {alert.acknowledged_by || 'Veterinarian'}</span>
                        <button
                          onClick={() => handleCreateCase(alert)}
                          disabled={isProcessing}
                          className="mt-1 text-xs text-[#1B5E3C] hover:underline font-semibold"
                        >
                          Convert to Case &rarr;
                        </button>
                      </div>
                    )}

                    {alert.status === 'LINKED_TO_CASE' && (
                      <Link
                        to={`/vet/cases/${alert.linked_vet_case_id || ''}`}
                        className="text-xs text-[#102A43] hover:underline font-semibold flex items-center gap-1"
                      >
                        View Veterinary Case <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}

                    {alert.status === 'DISMISSED' && (
                      <span className="text-xs text-stone-500 italic">
                        Dismissed ({alert.clinical_note || 'Benign'})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
