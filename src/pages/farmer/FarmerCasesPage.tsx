import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Folder, CheckCircle2, Clock,
  ArrowRight, RefreshCw
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getSymptomReports } from '@/services/symptomReportService'
import { AnimalIcon } from '@/components/ui/AnimalIcon'
import type { SymptomReport } from '@/types'

const STAGES = [
  { id: 'submitted', label: 'Report Submitted', labelHi: 'रिपोर्ट दर्ज' },
  { id: 'vet_review', label: 'Veterinary Review', labelHi: 'पशु चिकित्सक समीक्षा' },
  { id: 'inspection', label: 'MVU Inspection', labelHi: 'स्थल निरीक्षण / नमूना' },
  { id: 'diagnosed', label: 'Diagnostic Protocol', labelHi: 'जांच एवं निदान' },
  { id: 'resolved', label: 'Treatment & Resolved', labelHi: 'उपचार एवं समाधान' },
]

function getStageIndex(status: string): number {
  switch (status.toLowerCase()) {
    case 'reported': return 0
    case 'under review': return 1
    case 'veterinary review': return 2
    case 'diagnosed': return 3
    case 'resolved': return 4
    default: return 1
  }
}

export function FarmerCasesPage() {
  const { user } = useAuth()
  const ownerId = user?.id || 'demo-farmer'

  const [reports, setReports] = useState<SymptomReport[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await getSymptomReports(ownerId)
      setReports(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [ownerId])

  const filtered = reports.filter((r) => {
    if (statusFilter === 'All') return true
    if (statusFilter === 'Active') return r.status !== 'Resolved'
    if (statusFilter === 'Resolved') return r.status === 'Resolved'
    return true
  })

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Breadcrumb & Navigation Shortcuts */}
      <div className="flex items-center justify-between text-xs font-mono text-stone-500">
        <div className="flex items-center gap-2">
          <Link to="/farmer/dashboard" className="hover:text-[#1B5E3C]">
            DASHBOARD
          </Link>
          <span>&gt;</span>
          <span className="text-[#102A43] font-bold">CASE STATUS TRACKER</span>
        </div>
        <Link
          to="/farmer/vaccinations"
          className="inline-flex items-center gap-1 text-[#1B5E3C] hover:underline font-bold"
        >
          <span>VACCINATION CALENDAR</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* 1. Page Header */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs border-l-4 border-l-[#1B5E3C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#1B5E3C] text-white px-2 py-0.5 rounded-[1px]">
              CASE MONITORING DESK
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              ACTIVE CASES: {reports.filter((r) => r.status !== 'Resolved').length}
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#102A43] font-sans">
            मामला ट्रैकिंग एवं स्थिति &middot; Livestock Case Status Tracker
          </h1>
          <p className="text-xs text-stone-600 mt-0.5 font-sans">
            Real-time stage tracking of reported symptom files, triage priority, and clinical dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadData}
            className="p-2 border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 rounded-[2px] transition-colors cursor-pointer"
            title="Refresh Cases"
            aria-label="Refresh Cases"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link
            to="/farmer/report-health"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#C62828] hover:bg-[#A81D1D] text-white text-xs font-bold rounded-[2px] transition-colors font-mono"
          >
            + NEW HEALTH REPORT
          </Link>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="flex items-center gap-2 font-mono text-xs">
        {['All', 'Active', 'Resolved'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-1.5 rounded-[2px] font-bold border transition-colors cursor-pointer ${
              statusFilter === tab
                ? 'bg-[#102A43] text-white border-[#102A43]'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
            }`}
          >
            {tab === 'All' ? `All Cases (${reports.length})` : tab}
          </button>
        ))}
      </div>

      {/* 3. Cases List */}
      {loading ? (
        <div className="p-8 text-center text-xs text-stone-500 bg-white border border-stone-300">
          Loading active case files...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-stone-300 p-8 rounded-[2px] text-center space-y-2">
          <Folder size={24} className="text-stone-400 mx-auto" />
          <h3 className="text-sm font-bold text-[#102A43]">No Cases Found</h3>
          <p className="text-xs text-stone-500">
            You do not have any submitted health cases matching this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((rep) => {
            const currentStage = getStageIndex(rep.status)
            return (
              <div
                key={rep.id}
                className="bg-white border border-stone-300 rounded-[2px] shadow-xs overflow-hidden"
              >
                {/* Case Card Header */}
                <div className="p-3.5 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[2px] bg-white border border-stone-200 flex items-center justify-center shrink-0">
                      <AnimalIcon type={rep.animal?.animal_type || 'Cow'} className="w-5 h-5 text-[#102A43]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#102A43]">
                          CASE-2026-{rep.id.slice(0, 6).toUpperCase()}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-[#FDF0EE] text-[#C62828] border border-[#C62828]/30 rounded-[1px]">
                          {rep.severity}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mt-0.5">
                        Animal Tag: <strong className="font-mono text-[#102A43]">{rep.animal?.animal_tag || 'Animal'}</strong> &middot; {rep.animal?.animal_type} ({rep.animal?.breed || 'Indigenous'})
                      </p>
                    </div>
                  </div>

                  <div className="text-right sm:self-center">
                    <span className="text-[10px] font-mono text-stone-500 block">
                      REPORTED: {new Date(rep.reported_at).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#1B5E3C]">
                      STATUS: {rep.status}
                    </span>
                  </div>
                </div>

                {/* Case Symptoms Body */}
                <div className="p-4 space-y-3">
                  <div>
                    <span className="text-[11px] font-mono text-stone-500 uppercase tracking-wider block">
                      CLINICAL SYMPTOMS RECORDED:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      {rep.symptoms.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-stone-100 border border-stone-200 rounded-[2px] text-xs font-semibold text-stone-800"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {rep.description && (
                    <p className="text-xs text-stone-600 bg-stone-50 p-2 rounded-[2px] border border-stone-100">
                      <strong>Observation:</strong> {rep.description}
                    </p>
                  )}

                  {/* Multi-Stage Visual Stepper */}
                  <div className="pt-2 border-t border-stone-100">
                    <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block mb-3">
                      PROGRESS PIPELINE:
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {STAGES.map((stg, idx) => {
                        const isCompleted = idx < currentStage
                        const isCurrent = idx === currentStage

                        let boxStyle = 'border-stone-200 bg-stone-50 text-stone-400'
                        if (isCompleted) {
                          boxStyle = 'border-[#2E7D32] bg-[#EBF5EE] text-[#1B5E3C]'
                        } else if (isCurrent) {
                          boxStyle = 'border-[#102A43] bg-[#102A43] text-white ring-2 ring-[#102A43]/20'
                        }

                        return (
                          <div
                            key={stg.id}
                            className={`p-2.5 rounded-[2px] border text-center flex flex-col items-center justify-between transition-colors ${boxStyle}`}
                          >
                            <div className="flex items-center justify-center mb-1">
                              {isCompleted ? (
                                <CheckCircle2 size={16} className="text-[#2E7D32]" />
                              ) : isCurrent ? (
                                <Clock size={16} className="text-[#8BC34A] animate-pulse" />
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-full border border-stone-300 text-[9px] font-mono flex items-center justify-center text-stone-400">
                                  {idx + 1}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-[11px] font-bold leading-tight">{stg.label}</p>
                              <p className={`text-[9px] mt-0.5 ${isCurrent ? 'text-white/80' : 'text-stone-500'}`}>
                                {stg.labelHi}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Case Footer: Veterinary Details & Links */}
                <div className="p-3 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
                  <div className="flex items-center gap-2 text-stone-600">
                    <span className="text-[10px] uppercase font-bold text-stone-500">
                      ASSIGNED FACILITY:
                    </span>
                    <span>Sadar Veterinary Hospital &middot; Dr. Priya Sharma (MVU Unit 4)</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      to={`/farmer/animals/${rep.animal_id}`}
                      className="text-[#1B5E3C] hover:underline font-bold flex items-center gap-1"
                    >
                      <span>VIEW HEALTH PASSPORT</span>
                      <ArrowRight size={13} />
                    </Link>
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
