import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity, ShieldAlert, Clock, Folder, RefreshCw,
  Search, ArrowRight, CheckCircle2, FlaskConical, MapPin,
  Calendar, AlertCircle, Plus, Check, ChevronRight, AlertTriangle
} from 'lucide-react'
import { getVetCases, getVetKPIStats } from '@/services/vetService'
import { getOutbreakClusters } from '@/services/risk/outbreakEngine'
import { getAllRiskAssessments } from '@/services/risk/riskEngine'
import {
  getCaseFollowUps,
  createCaseFollowUp,
  updateFollowUpStatus,
  getFollowUpKPIs,
  calculateSmartPriority
} from '@/services/intelligence'
import {
  getJurisdictionalAnomalies,
  type AnomalyDetectionWarning
} from '@/lib/intelligence'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { CaseStatusPill } from '@/components/ui/CaseStatusPill'
import { AnimalIcon } from '@/components/ui/AnimalIcon'
import type { VeterinaryCase, VetKPIStats, CaseFollowUp, FollowUpStatus } from '@/types'
import type { OutbreakCluster, RiskAssessment } from '@/services/risk/riskTypes'

export function VetCommandCenterPage() {
  const navigate = useNavigate()
  const [cases, setCases] = useState<VeterinaryCase[]>([])
  const [clusters, setClusters] = useState<OutbreakCluster[]>([])
  const [assessments, setAssessments] = useState<RiskAssessment[]>([])
  const [followUps, setFollowUps] = useState<CaseFollowUp[]>([])
  const [anomalies, setAnomalies] = useState<AnomalyDetectionWarning[]>([])
  const [followUpKPIs, setFollowUpKPIs] = useState({ due_today: 0, overdue: 0, upcoming: 0, completed: 0, total: 0 })
  const [kpi, setKpi] = useState<VetKPIStats>({
    new_cases: 0,
    under_review: 0,
    high_priority: 0,
    sample_required: 0,
    lab_pending: 0,
    cases_resolved: 0,
    total_cases: 0,
  })
  const [loading, setLoading] = useState(true)
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpStatus | 'All'>('Due Today')
  const [searchQuery, setSearchQuery] = useState('')

  // New Follow-Up Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [followUpDate, setFollowUpDate] = useState(new Date().toISOString().split('T')[0])
  const [followUpNotes, setFollowUpNotes] = useState('')
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [casesData, kpiData, clusterData, riskData, followUpData, fuKpiData, anomalyData] = await Promise.all([
        getVetCases(),
        getVetKPIStats(),
        getOutbreakClusters(),
        getAllRiskAssessments(),
        getCaseFollowUps(),
        getFollowUpKPIs(),
        getJurisdictionalAnomalies(),
      ])
      setCases(casesData)
      setKpi(kpiData)
      setClusters(clusterData)
      setAssessments(riskData)
      setFollowUps(followUpData)
      setFollowUpKPIs(fuKpiData)
      setAnomalies(anomalyData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Handle Complete Follow-Up
  const handleMarkFollowUpComplete = async (id: string) => {
    try {
      await updateFollowUpStatus(id, 'Completed', 'Follow-up clinical verification completed.')
      const updatedFUs = await getCaseFollowUps()
      const updatedKpi = await getFollowUpKPIs()
      setFollowUps(updatedFUs)
      setFollowUpKPIs(updatedKpi)
    } catch (err) {
      console.error('Failed to update follow-up:', err)
    }
  }

  // Handle Schedule New Follow-Up
  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCaseId || !followUpNotes.trim()) return

    try {
      setSubmittingFollowUp(true)
      await createCaseFollowUp({
        case_id: selectedCaseId,
        follow_up_date: followUpDate,
        notes: followUpNotes.trim(),
      })
      setShowScheduleModal(false)
      setSelectedCaseId('')
      setFollowUpNotes('')
      const updatedFUs = await getCaseFollowUps()
      const updatedKpi = await getFollowUpKPIs()
      setFollowUps(updatedFUs)
      setFollowUpKPIs(updatedKpi)
    } catch (err) {
      console.error('Failed to create follow-up:', err)
    } finally {
      setSubmittingFollowUp(false)
    }
  }

  // Filtered Cases
  const priorityCases = cases.filter((c) => {
    const matchesPriority =
      priorityFilter === 'All' || c.priority.toUpperCase() === priorityFilter.toUpperCase()
    const matchesSearch =
      c.case_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.village?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.symptoms.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.animal?.animal_tag && c.animal.animal_tag.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesPriority && matchesSearch && c.status !== 'Resolved'
  })

  // Filtered Follow-Ups
  const filteredFollowUps = followUps.filter((f) => {
    if (followUpFilter === 'All') return true
    return f.status === followUpFilter
  })

  // Active Clusters
  const activeClusters = clusters.filter((c) => c.status !== 'Dismissed')

  // Mortality cases
  const mortalitySignals = cases.filter((c) =>
    (c.description || '').toLowerCase().includes('dead') ||
    (c.description || '').toLowerCase().includes('death') ||
    c.symptoms.includes('Reported Animal Mortality')
  )

  // Map risk assessment by case_id
  const riskMap = new Map<string, RiskAssessment>()
  assessments.forEach((a) => riskMap.set(a.case_id, a))

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* 1. Official Header */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs border-l-4 border-l-[#102A43] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#102A43] text-white px-2 py-0.5 rounded-[1px]">
              VETERINARY CLINICAL DESK &middot; पशु चिकित्सा नियंत्रण कक्ष
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              OFFICER ID: VCI/UP/2019/8412 &middot; DR. PRIYA SHARMA
            </span>
            <span className="text-[10px] font-mono text-[#1B5E3C] font-semibold bg-[#EBF5EE] px-1.5 py-0.5 rounded-[1px]">
              TRIAGE DISPATCH ONLINE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#102A43] font-sans">
            Veterinary Command Center
          </h1>
          <p className="text-xs text-stone-600 mt-0.5 font-sans">
            Clinical case prioritization, spatio-temporal cluster response, and longitudinal patient follow-ups.
            <span className="hidden sm:inline"> &middot; Jurisdiction: Sadar Veterinary Hospital, District Varanasi (Zone 4)</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadData}
            className="p-2 border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 rounded-[2px] transition-colors cursor-pointer"
            title="Refresh Clinical Telemetry"
            aria-label="Refresh Clinical Telemetry"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#1B5E3C] hover:bg-[#123C2A] text-white text-xs font-bold rounded-[2px] transition-colors font-mono cursor-pointer shadow-xs"
          >
            <Plus size={14} />
            <span>SCHEDULE FOLLOW-UP</span>
          </button>
          <Link
            to="/vet/cases"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#102A43] hover:bg-[#1B5E3C] text-white text-xs font-bold rounded-[2px] transition-colors font-mono"
          >
            <Folder size={14} />
            <span>CASE REGISTRY ({kpi.total_cases})</span>
          </Link>
        </div>
      </div>

      {/* 2. TODAY'S PRIORITIES SECTION (Structured Decision-Support Triage) */}
      <div className="bg-[#FAF9F5] border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-stone-200 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C62828] animate-pulse" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#102A43]">
              TODAY'S PRIORITIES &middot; आज की नैदानिक प्राथमिकताएँ
            </h2>
          </div>
          <span className="text-[11px] font-mono text-stone-500">
            SORTED BY MULTI-FACTOR CLINICAL URGENCY
          </span>
        </div>

        {/* Active Statistical Anomaly Alert Banner */}
        {anomalies.filter((a) => a.status !== 'Dismissed').length > 0 && (
          <div className="p-3 bg-amber-50 border-l-4 border-amber-600 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="text-amber-700 shrink-0 mt-0.5" size={17} />
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-amber-950 font-mono text-[11px] uppercase tracking-wider">
                    STATISTICAL SURVEILLANCE ANOMALIES DETECTED ({anomalies.filter((a) => a.status !== 'Dismissed').length})
                  </strong>
                  <span className="text-[10px] bg-amber-200/80 text-amber-900 font-mono px-1.5 py-0.2 rounded font-bold">
                    Stage 10 Engine
                  </span>
                </div>
                <p className="text-amber-900 text-[11px] mt-0.5">
                  {anomalies[0]?.title}: {anomalies[0]?.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/vet/gis"
                className="px-2.5 py-1.5 bg-[#102A43] hover:bg-[#1B5E3C] text-white font-mono text-[10px] font-bold uppercase rounded-[1px] transition-colors"
              >
                Inspect on GIS Map &rarr;
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Priority 1: High-Risk Cases */}
          <div className="p-3 bg-white border border-stone-300 rounded-[2px] border-l-4 border-l-[#C62828] space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-[#C62828] flex items-center gap-1">
                <ShieldAlert size={13} />
                1. CRITICAL &amp; HIGH RISK
              </span>
              <span className="bg-[#C62828]/10 text-[#C62828] font-bold px-1.5 py-0.5 rounded text-[10px]">
                {kpi.high_priority} CASES
              </span>
            </div>
            <p className="text-[11px] text-stone-600 line-clamp-2">
              Patients exhibiting high fever (&gt;104&deg;F), acute dyspnea, or severe systemic decline.
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] font-mono">
              <span className="text-stone-500">Triage Action:</span>
              <button
                type="button"
                onClick={() => setPriorityFilter('HIGH')}
                className="text-[#102A43] hover:underline font-bold"
              >
                Inspect Queue &rarr;
              </button>
            </div>
          </div>

          {/* Priority 2: Possible Clusters */}
          <div className="p-3 bg-white border border-stone-300 rounded-[2px] border-l-4 border-l-[#E0A11A] space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-[#8C5D00] flex items-center gap-1">
                <AlertTriangle size={13} />
                2. ACTIVE CLUSTERS
              </span>
              <span className="bg-amber-100 text-[#8C5D00] font-bold px-1.5 py-0.5 rounded text-[10px]">
                {activeClusters.length} DETECTED
              </span>
            </div>
            <p className="text-[11px] text-stone-600 line-clamp-2">
              Spatio-temporal concentrations in Rampur Khurd and Shivpur sectors crossing early warning threshold.
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] font-mono">
              <span className="text-stone-500">Outbreak Desk:</span>
              <Link to="/vet/outbreaks" className="text-[#102A43] hover:underline font-bold">
                Epidemiology Desk &rarr;
              </Link>
            </div>
          </div>

          {/* Priority 3: Pending Follow-Ups */}
          <div className="p-3 bg-white border border-stone-300 rounded-[2px] border-l-4 border-l-[#102A43] space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-[#102A43] flex items-center gap-1">
                <Calendar size={13} />
                3. FOLLOW-UPS DUE
              </span>
              <span className="bg-[#102A43]/10 text-[#102A43] font-bold px-1.5 py-0.5 rounded text-[10px]">
                {followUpKPIs.due_today + followUpKPIs.overdue} DUE
              </span>
            </div>
            <p className="text-[11px] text-stone-600 line-clamp-2">
              Post-treatment checkups due today ({followUpKPIs.due_today}) and overdue reviews ({followUpKPIs.overdue}).
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] font-mono">
              <span className="text-stone-500">Scheduler:</span>
              <button
                type="button"
                onClick={() => setFollowUpFilter('Due Today')}
                className="text-[#102A43] hover:underline font-bold"
              >
                Review Follow-Ups &rarr;
              </button>
            </div>
          </div>

          {/* Priority 4: Sample Collections */}
          <div className="p-3 bg-white border border-stone-300 rounded-[2px] border-l-4 border-l-[#8A6A3D] space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-[#8A6A3D] flex items-center gap-1">
                <FlaskConical size={13} />
                4. SAMPLE COLLECTION
              </span>
              <span className="bg-[#8A6A3D]/10 text-[#8A6A3D] font-bold px-1.5 py-0.5 rounded text-[10px]">
                {kpi.sample_required} PENDING
              </span>
            </div>
            <p className="text-[11px] text-stone-600 line-clamp-2">
              Blood, nasal swab, or milk samples required for confirmatory lab triage.
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] font-mono">
              <span className="text-stone-500">Diagnostic Desk:</span>
              <Link to="/vet/lab" className="text-[#102A43] hover:underline font-bold">
                Lab Referral Desk &rarr;
              </Link>
            </div>
          </div>

          {/* Priority 5: Lab Results Pending */}
          <div className="p-3 bg-white border border-stone-300 rounded-[2px] border-l-4 border-l-[#1B5E3C] space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-[#1B5E3C] flex items-center gap-1">
                <Activity size={13} />
                5. LAB RESULTS PENDING
              </span>
              <span className="bg-[#1B5E3C]/10 text-[#1B5E3C] font-bold px-1.5 py-0.5 rounded text-[10px]">
                {kpi.lab_pending} IN LAB
              </span>
            </div>
            <p className="text-[11px] text-stone-600 line-clamp-2">
              Assays undergoing molecular or bacteriological testing at District Diagnostic Lab.
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] font-mono">
              <span className="text-stone-500">Status Check:</span>
              <Link to="/vet/lab" className="text-[#102A43] hover:underline font-bold">
                View Lab Desk &rarr;
              </Link>
            </div>
          </div>

          {/* Priority 6: Mortality Verification */}
          <div className="p-3 bg-white border border-stone-300 rounded-[2px] border-l-4 border-l-[#7B1818] space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-[#7B1818] flex items-center gap-1">
                <AlertCircle size={13} />
                6. MORTALITY SIGNALS
              </span>
              <span className="bg-[#7B1818]/10 text-[#7B1818] font-bold px-1.5 py-0.5 rounded text-[10px]">
                {mortalitySignals.length} REPORTED
              </span>
            </div>
            <p className="text-[11px] text-stone-600 line-clamp-2">
              Sudden loss reports requiring forensic biosecurity inspection and safe disposal.
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] font-mono">
              <span className="text-stone-500">Biosecurity:</span>
              <span className="text-stone-600 font-bold">Immediate Field Inspection</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Real Database-Driven KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="bg-white border border-stone-300 p-3 rounded-[2px] border-t-3 border-t-[#C62828] shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">NEW CASES</span>
            <ShieldAlert size={14} className="text-[#C62828]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#C62828]">
            {loading ? '--' : String(kpi.new_cases).padStart(2, '0')}
          </p>
          <p className="text-[10px] text-stone-500 mt-1 font-sans">Unassigned Triage</p>
        </div>

        <div className="bg-white border border-stone-300 p-3 rounded-[2px] border-t-3 border-t-[#E0A11A] shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">UNDER REVIEW</span>
            <Clock size={14} className="text-[#8C5D00]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#8C5D00]">
            {loading ? '--' : String(kpi.under_review).padStart(2, '0')}
          </p>
          <p className="text-[10px] text-stone-500 mt-1 font-sans">Active Clinical Triage</p>
        </div>

        <div className="bg-white border border-stone-300 p-3 rounded-[2px] border-t-3 border-t-[#7B1818] shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">HIGH PRIORITY</span>
            <Activity size={14} className="text-[#7B1818]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#7B1818]">
            {loading ? '--' : String(kpi.high_priority).padStart(2, '0')}
          </p>
          <p className="text-[10px] text-stone-500 mt-1 font-sans">Severe Clinical State</p>
        </div>

        <div className="bg-white border border-stone-300 p-3 rounded-[2px] border-t-3 border-t-[#8A6A3D] shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">SAMPLE REQ.</span>
            <FlaskConical size={14} className="text-[#8A6A3D]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#8A6A3D]">
            {loading ? '--' : String(kpi.sample_required).padStart(2, '0')}
          </p>
          <p className="text-[10px] text-stone-500 mt-1 font-sans">Awaiting Field Collect</p>
        </div>

        <div className="bg-white border border-stone-300 p-3 rounded-[2px] border-t-3 border-t-[#102A43] shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">LAB PENDING</span>
            <FlaskConical size={14} className="text-[#102A43]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#102A43]">
            {loading ? '--' : String(kpi.lab_pending).padStart(2, '0')}
          </p>
          <p className="text-[10px] text-stone-500 mt-1 font-sans">At DDDL / RDDL Lab</p>
        </div>

        <div className="bg-white border border-stone-300 p-3 rounded-[2px] border-t-3 border-t-[#2E7D32] shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">RESOLVED</span>
            <CheckCircle2 size={14} className="text-[#2E7D32]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#2E7D32]">
            {loading ? '--' : String(kpi.cases_resolved).padStart(2, '0')}
          </p>
          <p className="text-[10px] text-stone-500 mt-1 font-sans">Discharged &amp; Closed</p>
        </div>
      </div>

      {/* 4. VETERINARY FOLLOW-UP MANAGEMENT (Stage 5 Requirement) */}
      <div className="bg-white border border-stone-300 rounded-[2px] shadow-xs">
        <div className="p-3.5 sm:p-4 border-b border-stone-200 bg-stone-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-[#102A43]" />
              <h2 className="text-sm font-bold text-[#102A43] uppercase tracking-wide font-mono">
                VETERINARY FOLLOW-UPS &middot; अनुवर्ती समीक्षा
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5 font-sans">
              Track scheduled post-treatment evaluations, recovery verifications, and overdue clinical checks.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 font-mono text-[11px] flex-wrap">
            {(['Due Today', 'Overdue', 'Pending', 'Completed', 'All'] as const).map((status) => {
              const count =
                status === 'Due Today' ? followUpKPIs.due_today :
                status === 'Overdue' ? followUpKPIs.overdue :
                status === 'Pending' ? followUpKPIs.upcoming :
                status === 'Completed' ? followUpKPIs.completed : followUpKPIs.total

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFollowUpFilter(status)}
                  className={`px-2.5 py-1 rounded-[2px] border font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    followUpFilter === status
                      ? 'bg-[#102A43] text-white border-[#102A43]'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  <span>{status === 'Pending' ? 'Upcoming' : status}</span>
                  <span className={`px-1 py-0.2 rounded text-[10px] ${
                    followUpFilter === status ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Follow-Up List */}
        <div className="p-3 sm:p-4">
          {filteredFollowUps.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-500 font-mono">
              No follow-ups recorded under filter: {followUpFilter}.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredFollowUps.map((fu) => {
                const linkedCase = cases.find((c) => c.id === fu.case_id)
                const isOverdue = fu.status === 'Overdue'
                const isDueToday = fu.status === 'Due Today'
                const isCompleted = fu.status === 'Completed'

                return (
                  <div
                    key={fu.id}
                    className={`p-3.5 border rounded-[2px] transition-colors ${
                      isOverdue
                        ? 'bg-[#FDF0EE] border-[#C62828]/30'
                        : isDueToday
                        ? 'bg-[#FAF9F5] border-amber-300'
                        : isCompleted
                        ? 'bg-stone-50 border-stone-200 opacity-80'
                        : 'bg-white border-stone-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[#102A43]">
                            {linkedCase ? linkedCase.case_number : 'CASE'}
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-[1px] ${
                            isOverdue
                              ? 'bg-[#C62828] text-white'
                              : isDueToday
                              ? 'bg-[#E0A11A] text-stone-900 font-black'
                              : isCompleted
                              ? 'bg-[#2E7D32] text-white'
                              : 'bg-stone-200 text-stone-700'
                          }`}>
                            {fu.status}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-stone-800 mt-1">
                          {linkedCase?.animal?.animal_tag || 'Animal'} ({linkedCase?.animal?.animal_type || 'Bovine'}) &middot; {linkedCase?.village || 'Rampur Khurd'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono text-stone-500 block">DUE DATE</span>
                        <span className={`text-xs font-mono font-bold ${
                          isOverdue ? 'text-[#C62828]' : isDueToday ? 'text-amber-800' : 'text-stone-700'
                        }`}>
                          {fu.follow_up_date}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-600 mt-2 bg-white/70 p-2 rounded-[2px] border border-stone-200 italic">
                      &ldquo;{fu.notes}&rdquo;
                    </p>

                    <div className="mt-3 pt-2 border-t border-stone-200/80 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-stone-500">
                        Dr. Priya Sharma
                      </span>

                      <div className="flex items-center gap-2">
                        {linkedCase && (
                          <Link
                            to={`/vet/cases/${linkedCase.id}`}
                            className="text-[11px] font-mono font-bold text-[#102A43] hover:underline"
                          >
                            Dossier &rarr;
                          </Link>
                        )}
                        {!isCompleted && (
                          <button
                            type="button"
                            onClick={() => handleMarkFollowUpComplete(fu.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1B5E3C] hover:bg-[#123C2A] text-white text-[11px] font-mono font-bold rounded-[2px] transition-colors cursor-pointer"
                          >
                            <Check size={12} />
                            <span>Mark Completed</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 5. Priority Case Queue: SMART PRIORITIZATION SECTION */}
      <div className="bg-white border border-stone-300 rounded-[2px] shadow-xs">
        {/* Table Header Controls */}
        <div className="p-3.5 sm:p-4 border-b border-stone-200 bg-stone-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C62828] animate-pulse" />
              <h2 className="text-sm font-bold text-[#102A43] uppercase tracking-wide font-mono">
                SMART CLINICAL TRIAGE QUEUE &middot; स्वचालित प्राथमिकता सूची
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5 font-sans">
              Smart multi-factor priority with explainable clinical decision-support tags.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search case, tag, village..."
                className="pl-7 pr-3 py-1.5 bg-white border border-stone-300 rounded-[2px] text-xs text-stone-800 focus:outline-none focus:border-[#102A43] w-48 sm:w-56"
              />
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1 font-mono text-[11px]">
              {['All', 'CRITICAL', 'HIGH', 'MEDIUM'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriorityFilter(p)}
                  className={`px-2 py-1 rounded-[2px] border font-bold transition-colors cursor-pointer ${
                    priorityFilter === p
                      ? 'bg-[#102A43] text-white border-[#102A43]'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-10 text-center text-xs text-stone-500 font-mono">
            Loading priority cases from veterinary registry...
          </div>
        ) : priorityCases.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-600 bg-stone-50/50">
            No active cases requiring attention. All priority files have been triaged or resolved.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-stone-100/70 text-stone-600 border-b border-stone-200 font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Case ID</th>
                  <th className="py-2.5 px-3">Animal</th>
                  <th className="py-2.5 px-3">Village</th>
                  <th className="py-2.5 px-3">Observed Symptoms</th>
                  <th className="py-2.5 px-3">Smart Priority Explanation</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {priorityCases.map((c) => {
                  const assessment = riskMap.get(c.id)
                  const smartExplanation = calculateSmartPriority(
                    c,
                    assessment?.risk_score || 50,
                    clusters.some((cl) => cl.cases?.some((k) => k.id === c.id) || cl.affected_villages.some((v) => v.toLowerCase() === (c.village || '').toLowerCase()))
                  )

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-stone-50/80 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/vet/cases/${c.id}`)}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-[#102A43] whitespace-nowrap">
                        {c.case_number}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <AnimalIcon
                            type={c.animal?.animal_type || 'Cow'}
                            className="w-4 h-4 text-[#102A43] shrink-0"
                          />
                          <div>
                            <strong className="font-mono text-[#102A43] block">
                              {c.animal?.animal_tag || 'Animal'}
                            </strong>
                            <span className="text-[10px] text-stone-500 block">
                              {c.animal?.animal_type} &middot; {c.animal?.breed || 'Indigenous'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-stone-700 whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <MapPin size={11} className="text-stone-400" />
                          {c.village || 'Rampur Khurd'}
                        </span>
                      </td>

                      <td className="py-3 px-3 max-w-xs">
                        <div className="flex items-center gap-1 flex-wrap">
                          {c.symptoms.slice(0, 2).map((s, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-stone-100 border border-stone-200 px-1.5 py-0.2 rounded text-stone-700 truncate"
                            >
                              {s}
                            </span>
                          ))}
                          {c.symptoms.length > 2 && (
                            <span className="text-[9px] text-stone-500 font-mono">
                              +{c.symptoms.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Smart Priority Explanation Pill */}
                      <td className="py-3 px-3 max-w-sm">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono text-stone-700 block truncate">
                            &bull; {smartExplanation.reasons[0]}
                          </span>
                          {smartExplanation.reasons.length > 1 && (
                            <span className="text-[10px] font-mono text-stone-500 block truncate">
                              &bull; {smartExplanation.reasons[1]}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <PriorityBadge priority={c.priority} size="sm" />
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <CaseStatusPill status={c.status} size="sm" />
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/vet/cases/${c.id}`)
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-[#102A43] group-hover:bg-[#1B5E3C] text-white text-[11px] font-mono font-bold rounded-[2px] transition-colors cursor-pointer"
                        >
                          <span>Review</span>
                          <ArrowRight size={11} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Quick Desk Shortcuts Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          to="/vet/outbreaks"
          className="p-3 bg-white border border-stone-300 rounded-[2px] shadow-xs hover:border-[#102A43] transition-colors flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">
              EPIDEMIOLOGY DESK
            </span>
            <p className="text-xs font-bold text-[#102A43] mt-0.5">
              Outbreak Clusters ({activeClusters.length})
            </p>
          </div>
          <ChevronRight size={16} className="text-stone-400" />
        </Link>

        <Link
          to="/vet/lab"
          className="p-3 bg-white border border-stone-300 rounded-[2px] shadow-xs hover:border-[#102A43] transition-colors flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">
              DIAGNOSTIC LAB
            </span>
            <p className="text-xs font-bold text-[#102A43] mt-0.5">
              Pending Referrals ({kpi.lab_pending})
            </p>
          </div>
          <ChevronRight size={16} className="text-stone-400" />
        </Link>

        <Link
          to="/vet/treatments"
          className="p-3 bg-white border border-stone-300 rounded-[2px] shadow-xs hover:border-[#102A43] transition-colors flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">
              TREATMENT PROTOCOLS
            </span>
            <p className="text-xs font-bold text-[#102A43] mt-0.5">
              Prescription Registry
            </p>
          </div>
          <ChevronRight size={16} className="text-stone-400" />
        </Link>
      </div>

      {/* 7. Schedule Follow-Up Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-[#102A43]/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white border border-stone-300 w-full max-w-md rounded-[2px] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#102A43] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-[#E0A11A]" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider">
                  SCHEDULE CLINICAL FOLLOW-UP
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="text-white/60 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFollowUp} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-stone-700 uppercase mb-1">
                  SELECT PATIENT CASE
                </label>
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  required
                  className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-[2px] font-sans text-stone-800 focus:outline-none focus:border-[#102A43]"
                >
                  <option value="">-- Choose active case --</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.case_number} &middot; {c.animal?.animal_tag || 'Animal'} ({c.village || 'Rampur Khurd'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-stone-700 uppercase mb-1">
                  FOLLOW-UP DATE
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  required
                  className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-[2px] font-mono text-stone-800 focus:outline-none focus:border-[#102A43]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-stone-700 uppercase mb-1">
                  CLINICAL NOTES &amp; EVALUATION CRITERIA
                </label>
                <textarea
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  required
                  rows={3}
                  placeholder="e.g. Verify body temperature normalization and check for healing of oral ulcerations."
                  className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-[2px] font-sans text-stone-800 focus:outline-none focus:border-[#102A43]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-3 py-1.5 border border-stone-300 text-stone-700 text-xs font-mono rounded-[2px] hover:bg-stone-50 cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submittingFollowUp}
                  className="px-4 py-1.5 bg-[#102A43] hover:bg-[#1B5E3C] text-white text-xs font-mono font-bold rounded-[2px] transition-colors cursor-pointer"
                >
                  {submittingFollowUp ? 'SCHEDULING...' : 'CONFIRM FOLLOW-UP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
