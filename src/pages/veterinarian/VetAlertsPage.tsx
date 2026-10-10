// ============================================================
// PASHURAKSHA (पशुरक्षा) — VETERINARY BIOSECURITY ALERTS
// Stage 3: District Biosecurity Alerts & Containment Directives
// ============================================================

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ShieldAlert,
  MapPin,
  CheckCircle2,
  Clock,
  Radio,
  ExternalLink,
  ShieldCheck,
  Building
} from 'lucide-react'

interface BiosecurityAlert {
  id: string
  title: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  village: string
  district: string
  radius_km: number
  directive: string
  recommended_action: string
  issued_at: string
  status: 'Active' | 'Acknowledged'
  officer_notes?: string
}

const initialAlerts: BiosecurityAlert[] = [
  {
    id: 'alt-001',
    title: 'Cluster Triage Advisory: Rampur Khurd Oral Lesions & Pyrexia',
    severity: 'CRITICAL',
    village: 'Rampur Khurd',
    district: 'Varanasi',
    radius_km: 5,
    directive: 'Implement strict biosecurity cordon. Withhold inter-village livestock movement for 14 days pending viral panel confirmation.',
    recommended_action: 'Deploy Mobile Veterinary Unit (MVU-4) for ring-vaccination and active serological surveillance.',
    issued_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    status: 'Active',
  },
  {
    id: 'alt-002',
    title: 'Seasonal Haemo-Protozoan Vector Advisory (Post-Monsoon)',
    severity: 'MEDIUM',
    village: 'Chiraigaon & Shivpur',
    district: 'Varanasi',
    radius_km: 15,
    directive: 'Elevated tick burden reported. Screen grazing buffaloes for Theileriosis and Babesiosis via blood smears.',
    recommended_action: 'Organize village de-ticking camps and distribute acaricide dip formulations.',
    issued_at: new Date(Date.now() - 36 * 3600000).toISOString(),
    status: 'Active',
  },
  {
    id: 'alt-003',
    title: 'Inter-District FMD Ring Vaccination Protocol Activation',
    severity: 'HIGH',
    village: 'District Border Zone (Mirzapur-Varanasi)',
    district: 'Varanasi',
    radius_km: 10,
    directive: 'Precautionary ring vaccination within 10km buffer of boundary villages.',
    recommended_action: 'Ensure cold chain verification at Block Veterinary Dispensary.',
    issued_at: new Date(Date.now() - 72 * 3600000).toISOString(),
    status: 'Acknowledged',
    officer_notes: 'Acknowledged by Dr. Priya Sharma. MVU team dispatched with 500 doses trivalent FMD vaccine.',
  },
]

export function VetAlertsPage() {
  const [alerts, setAlerts] = useState<BiosecurityAlert[]>(initialAlerts)
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null)
  const [ackNote, setAckNote] = useState('')

  const handleAcknowledge = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'Acknowledged',
              officer_notes: ackNote || 'Acknowledged by Veterinary Officer on duty.',
            }
          : a
      )
    )
    setAcknowledgingId(null)
    setAckNote('')
  }

  const activeCount = alerts.filter((a) => a.status === 'Active').length

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Official Government Header */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs border-l-4 border-l-[#C62828] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#C62828] text-white px-2 py-0.5 rounded-[1px]">
              EPIDEMIOLOGICAL SURVEILLANCE & EARLY WARNING
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              NADRS-II PROTOCOL COMPLIANT
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#102A43] font-sans flex items-center gap-2">
            <ShieldAlert size={20} className="text-[#C62828]" />
            District Biosecurity Alerts & Containment Directives &middot; जैव सुरक्षा चेतावनी
          </h1>
          <p className="text-xs text-stone-600 mt-0.5 font-sans">
            Early warning notifications, containment cordons, and rapid field intervention protocols.
          </p>
        </div>

        {/* Live Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-[2px] bg-red-50 border border-red-200 text-red-800 font-mono text-xs flex items-center gap-1.5">
            <Radio size={14} className="text-red-600 animate-pulse" />
            <span><strong>{activeCount}</strong> ACTIVE DIRECTIVES</span>
          </div>
        </div>
      </div>

      {/* Advisory Cards List */}
      <div className="space-y-4">
        {alerts.map((alert) => {
          const isCritical = alert.severity === 'CRITICAL'
          const isHigh = alert.severity === 'HIGH'
          const borderColor = isCritical ? 'border-l-red-600' : isHigh ? 'border-l-amber-500' : 'border-l-blue-600'

          return (
            <div
              key={alert.id}
              className={`bg-white border border-stone-300 rounded-[2px] p-5 shadow-xs border-l-4 ${borderColor} space-y-3.5`}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                    isCritical
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : isHigh
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-blue-100 text-blue-800 border border-blue-300'
                  }`}>
                    {alert.severity} DIRECTIVE
                  </span>
                  <h2 className="font-bold text-stone-900 text-sm font-sans">
                    {alert.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-stone-500">
                  <Clock size={12} />
                  <span>
                    {new Date(alert.issued_at).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    &middot; {new Date(alert.issued_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </span>
                </div>
              </div>

              {/* Geographical Scope */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-stone-50 p-3 rounded-[2px] border border-stone-200">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-[#102A43] shrink-0" />
                  <div>
                    <div className="text-[10px] font-mono uppercase text-stone-500">Target Epicenter</div>
                    <div className="font-semibold text-stone-900">{alert.village}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Building size={14} className="text-[#102A43] shrink-0" />
                  <div>
                    <div className="text-[10px] font-mono uppercase text-stone-500">Jurisdiction</div>
                    <div className="font-semibold text-stone-900">{alert.district} District</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-[#102A43] shrink-0" />
                  <div>
                    <div className="text-[10px] font-mono uppercase text-stone-500">Surveillance Radius</div>
                    <div className="font-semibold text-stone-900 font-mono">{alert.radius_km} km Containment Zone</div>
                  </div>
                </div>
              </div>

              {/* Directives and Field Actions */}
              <div className="space-y-2 text-xs">
                <div className="bg-amber-50/70 border border-amber-200/80 p-3 rounded-[2px] text-amber-900">
                  <strong className="font-mono uppercase text-[10px] block text-amber-800 mb-0.5">
                    Statutory Cordon & Movement Restriction:
                  </strong>
                  {alert.directive}
                </div>

                <div className="bg-green-50/70 border border-green-200/80 p-3 rounded-[2px] text-green-900">
                  <strong className="font-mono uppercase text-[10px] block text-green-800 mb-0.5">
                    Field Veterinary Intervention:
                  </strong>
                  {alert.recommended_action}
                </div>
              </div>

              {/* Status and Action Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-100">
                <div className="text-xs">
                  {alert.status === 'Acknowledged' ? (
                    <div className="flex items-center gap-2 text-green-700 font-semibold">
                      <CheckCircle2 size={15} />
                      <span>{alert.officer_notes || 'Acknowledged by Clinical Officer'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-700 font-semibold font-mono text-[11px]">
                      <AlertTriangle size={14} />
                      <span>ACTION REQUIRED: Acknowledge & deploy field protocol</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/vet/cases"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[2px] border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold"
                  >
                    View Village Cases <ExternalLink size={11} />
                  </Link>

                  {alert.status === 'Active' && acknowledgingId !== alert.id && (
                    <button
                      onClick={() => setAcknowledgingId(alert.id)}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-[2px] bg-[#123C2A] text-white hover:bg-[#1B5E3C] text-xs font-semibold cursor-pointer"
                    >
                      <CheckCircle2 size={13} />
                      Acknowledge Directive
                    </button>
                  )}
                </div>
              </div>

              {/* Acknowledge Form Strip */}
              {acknowledgingId === alert.id && (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-[2px] space-y-2">
                  <label className="block text-[11px] font-mono text-stone-700 font-semibold">
                    Record Officer Response Note:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Field inspection scheduled for 09:00 hrs with MVU-4 team."
                    value={ackNote}
                    onChange={(e) => setAckNote(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-[2px] bg-white focus:outline-none focus:border-[#123C2A]"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setAcknowledgingId(null)}
                      className="px-2.5 py-1 text-xs border border-stone-300 rounded-[2px]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="px-3 py-1 text-xs bg-[#123C2A] text-white rounded-[2px] font-semibold"
                    >
                      Confirm Acknowledgment
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
