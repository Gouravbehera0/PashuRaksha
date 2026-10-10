import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldAlert,
  Activity,
  MapPin,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Syringe,
  Info,
  Sparkles,
  BarChart3,
  FileBarChart,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Wifi,
  Users,
  Map
} from 'lucide-react'
import { getAllAnimals } from '@/services/animalService'
import { getVetCases } from '@/services/vetService'
import { getOutbreakClusters } from '@/services/risk/outbreakEngine'
import { getAllRiskAssessments } from '@/services/risk/riskEngine'
import { DashboardIntro } from '@/components/dashboard/DashboardIntro'
import {
  calculateAreaEarlyWarning,
  getRecommendations,
  updateRecommendationStatus,
  assessSystemDataQuality,
  getVaccinationAnalyticsOverview
} from '@/services/intelligence'
import type { Animal, VeterinaryCase, AreaEarlyWarning, IntelligenceRecommendation, DataQualitySummary } from '@/types'
import type { OutbreakCluster, RiskAssessment } from '@/services/risk/riskTypes'

export function AdminDashboardPage() {
  const [animals, setAnimals] = useState<Animal[]>([])
  const [cases, setCases] = useState<VeterinaryCase[]>([])
  const [clusters, setClusters] = useState<OutbreakCluster[]>([])
  const [assessments, setAssessments] = useState<RiskAssessment[]>([])
  const [earlyWarning, setEarlyWarning] = useState<AreaEarlyWarning | null>(null)
  const [recommendations, setRecommendations] = useState<IntelligenceRecommendation[]>([])
  const [dataQuality, setDataQuality] = useState<DataQualitySummary | null>(null)
  const [vaccineDueCount, setVaccineDueCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [showQualityModal, setShowQualityModal] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [animalData, caseData, clusterData, riskData, qualityData, vaccData, recsData] = await Promise.all([
        getAllAnimals(),
        getVetCases(),
        getOutbreakClusters(),
        getAllRiskAssessments(),
        assessSystemDataQuality(),
        getVaccinationAnalyticsOverview(),
        getRecommendations({ status: 'ACTIVE' }),
      ])
      setAnimals(animalData)
      setCases(caseData)
      setClusters(clusterData)
      setAssessments(riskData)
      setDataQuality(qualityData)
      setVaccineDueCount(vaccData.vaccinationsDue)
      setRecommendations(recsData)

      // Calculate area early warning for the district
      const ew = await calculateAreaEarlyWarning('Varanasi', 'district')
      setEarlyWarning(ew)
    } catch (err) {
      console.error('[AdminDashboard] Data fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleActionRecommendation = async (id: string) => {
    try {
      await updateRecommendationStatus(id, 'ACTIONED')
      setRecommendations((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      console.error('Failed to action recommendation:', err)
    }
  }

  const activeCases = cases.filter((c) => c.status !== 'Resolved' && c.status !== 'Rejected')
  const highRiskCases = assessments.filter((a) => a.risk_level === 'HIGH' || a.risk_level === 'CRITICAL')
  const activeClusters = clusters.filter((c) => c.status !== 'Dismissed')
  const possibleOutbreaks = clusters.filter((c) => c.cluster_score >= 70)
  const casesUnderInvestigation = cases.filter((c) => c.status === 'Veterinary Review' || c.status === 'Sample Required')
  const mortalitySignals = cases.filter((c) =>
    (c.description || '').toLowerCase().includes('dead') ||
    (c.description || '').toLowerCase().includes('death') ||
    c.symptoms.includes('Reported Animal Mortality')
  )

  if (loading) {
    return (
      <div className="p-8 text-center font-mono text-xs text-stone-500">
        <RefreshCw className="animate-spin inline mr-2 text-[#1B5E3C]" size={16} />
        INITIALIZING PASHURAKSHA HEALTH INTELLIGENCE DESK...
      </div>
    )
  }

  return (
    <DashboardIntro
      role="admin"
      roleBadge="राज्य पशु रोग निगरानी प्रकोष्ठ · State Epidemiological Surveillance"
      roleTitle="State Livestock Health Intelligence"
    >
      <div className="p-3 sm:p-5 lg:p-6 space-y-5 max-w-7xl mx-auto font-sans">
      {/* ─── A. MOBILE VIEW (Android / iOS Portrait — Matches Reference Image) ─── */}
      <div className="block lg:hidden space-y-3.5">
        {/* Title & Status Row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#102A43] tracking-tight font-sans">
              State Health Intelligence
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-stone-600 mt-0.5">
              <MapPin size={14} className="text-[#1B5E3C] shrink-0 fill-[#1B5E3C]/20" />
              <span>District Varanasi &middot; State Command Cell</span>
            </div>
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EBF5EE] text-[#1B5E3C] text-xs font-semibold border border-[#1B5E3C]/20 shadow-xs">
              <Wifi size={14} className="text-[#1B5E3C]" />
              <span>Online</span>
              <ChevronDown size={13} className="text-[#1B5E3C]" />
            </div>
          </div>
        </div>

        {/* Alert Card 1: Community Outbreak Warning */}
        <div className="bg-white border border-red-200 rounded-xl p-3.5 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <AlertTriangle size={24} className="text-[#E53935] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] font-mono font-bold text-[#C62828] uppercase tracking-wider">
                EPIDEMIOLOGICAL SIGNAL &middot; क्षेत्रीय चेतावनी
              </p>
              <h3 className="text-sm font-bold text-[#102A43] mt-0.5 truncate">
                {possibleOutbreaks[0] ? `${possibleOutbreaks[0].cluster_name} (${possibleOutbreaks[0].affected_villages?.[0] || 'Varanasi'})` : (earlyWarning?.risk_level ? `${earlyWarning.risk_level} Early Warning Alert` : 'District Surveillance Cordon')}
              </h3>
              <p className="text-xs text-stone-600 mt-0.5 line-clamp-2">
                {possibleOutbreaks[0] ? `${possibleOutbreaks[0].case_count} cases detected. Early containment cordon established.` : 'Continuous spatio-temporal cluster surveillance across all Varanasi blocks.'}
              </p>
            </div>
          </div>
          <Link
            to="/admin/outbreaks"
            className="text-[#C62828] p-1 shrink-0 hover:translate-x-0.5 transition-transform"
            aria-label="View outbreak alerts"
          >
            <ChevronRight size={20} />
          </Link>
        </div>

        {/* Alert Card 2: Immediate Clinical Triage */}
        <div className="bg-[#FFF8F7] border border-red-200 rounded-xl p-3.5 shadow-xs flex items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E53935] animate-pulse shrink-0" />
              <span className="text-[10px] font-mono font-bold text-[#C62828] uppercase tracking-wider">
                GIS SURVEILLANCE &middot; स्थानिक निगरानी
              </span>
            </div>
            <h3 className="text-sm font-bold text-[#102A43]">
              Active disease signals requiring containment?
            </h3>
            <p className="text-xs text-stone-600 line-clamp-2">
              Inspect state GIS surveillance grid, monitor spatio-temporal clusters, and activate containment protocol.
            </p>
          </div>
          <Link
            to="/admin/surveillance-map"
            className="bg-[#C62828] hover:bg-[#A81D1D] active:bg-[#7B1818] text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm transition-colors cursor-pointer text-center leading-tight uppercase font-sans min-h-[44px]"
          >
            <ShieldAlert size={16} className="shrink-0" />
            <span className="text-[10px] sm:text-[11px] leading-tight text-left">
              GIS<br />COMMAND
            </span>
          </Link>
        </div>

        {/* Statistics: Row 1 (2 cols) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Total Livestock */}
          <div className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-xs border-t-4 border-t-[#1B5E3C]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                TOTAL LIVESTOCK
              </span>
              <Activity size={16} className="text-[#1B5E3C]" />
            </div>
            <p className="text-2xl font-bold text-[#102A43] font-sans">
              {loading ? '--' : String(animals.length).padStart(2, '0')}
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5">Registered head</p>
          </div>

          {/* Outbreak Signals */}
          <div className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-xs border-t-4 border-t-[#C62828]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                OUTBREAKS
              </span>
              <ShieldAlert size={16} className="text-[#C62828]" />
            </div>
            <p className="text-2xl font-bold text-[#C62828] font-sans">
              {loading ? '--' : String(possibleOutbreaks.length).padStart(2, '0')}
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5">Active Signals</p>
          </div>
        </div>

        {/* Statistics: Row 2 (3 cols) */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* High-Risk Cases */}
          <div className="bg-white border border-stone-200 rounded-xl p-2.5 sm:p-3 shadow-xs border-t-4 border-t-[#C62828]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500 truncate">
                HIGH RISK
              </span>
              <Activity size={13} className="text-[#C62828] shrink-0" />
            </div>
            <p className="text-2xl font-bold text-[#C62828] font-sans">
              {loading ? '--' : String(highRiskCases.length).padStart(2, '0')}
            </p>
            <p className="text-[10px] text-stone-500 mt-0.5 truncate">Score &ge; 50</p>
          </div>

          {/* Vaccines Due */}
          <div className="bg-white border border-stone-200 rounded-xl p-2.5 sm:p-3 shadow-xs border-t-4 border-t-[#2E7D32]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500 truncate">
                VACCINE DUE
              </span>
              <Syringe size={13} className="text-[#2E7D32] shrink-0" />
            </div>
            <p className="text-2xl font-bold text-[#2E7D32] font-sans">
              {loading ? '--' : String(vaccineDueCount).padStart(2, '0')}
            </p>
            <p className="text-[10px] text-stone-500 mt-0.5 truncate">Pending Doses</p>
          </div>

          {/* Active Cases */}
          <div className="bg-white border border-stone-200 rounded-xl p-2.5 sm:p-3 shadow-xs border-t-4 border-t-[#D97706]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500 truncate">
                ACTIVE CASES
              </span>
              <ShieldAlert size={13} className="text-[#D97706] shrink-0" />
            </div>
            <p className="text-2xl font-bold text-[#D97706] font-sans">
              {loading ? '--' : String(activeCases.length).padStart(2, '0')}
            </p>
            <p className="text-[10px] text-stone-500 mt-0.5 truncate">Under Triage</p>
          </div>
        </div>

        {/* Quick Actions (4-Col Row) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#102A43]">
              Quick Actions
            </h2>
            <Link
              to="/admin/analytics"
              className="text-xs font-semibold text-[#1B5E3C] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {/* 1. GIS Map */}
            <button
              type="button"
              onClick={() => window.location.href = '/admin/surveillance-map'}
              className="bg-white border border-stone-200 rounded-xl p-2 sm:p-2.5 flex flex-col items-center text-center justify-center shadow-xs hover:border-[#1B5E3C] transition-all cursor-pointer group min-h-[90px]"
            >
              <div className="w-10 h-10 rounded-xl bg-[#EBF5EE] text-[#1B5E3C] flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <Map size={20} className="text-[#1B5E3C]" />
              </div>
              <span className="text-[11px] font-bold text-[#102A43] leading-tight">
                GIS<br />Map
              </span>
            </button>

            {/* 2. Outbreaks */}
            <button
              type="button"
              onClick={() => window.location.href = '/admin/outbreaks'}
              className="bg-white border border-stone-200 rounded-xl p-2 sm:p-2.5 flex flex-col items-center text-center justify-center shadow-xs hover:border-[#C62828] transition-all cursor-pointer group min-h-[90px]"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FFF0F0] text-[#C62828] flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <ShieldAlert size={20} className="text-[#C62828]" />
              </div>
              <span className="text-[11px] font-bold text-[#102A43] leading-tight">
                Outbreak<br />Alerts
              </span>
            </button>

            {/* 3. Vaccination */}
            <button
              type="button"
              onClick={() => window.location.href = '/admin/vaccination'}
              className="bg-white border border-stone-200 rounded-xl p-2 sm:p-2.5 flex flex-col items-center text-center justify-center shadow-xs hover:border-[#2E7D32] transition-all cursor-pointer group min-h-[90px]"
            >
              <div className="w-10 h-10 rounded-xl bg-[#EBF5EE] text-[#2E7D32] flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <Syringe size={20} className="text-[#2E7D32]" />
              </div>
              <span className="text-[11px] font-bold text-[#102A43] leading-tight">
                Vaccine<br />Coverage
              </span>
            </button>

            {/* 4. Cadre & Users */}
            <button
              type="button"
              onClick={() => window.location.href = '/admin/users'}
              className="bg-white border border-stone-200 rounded-xl p-2 sm:p-2.5 flex flex-col items-center text-center justify-center shadow-xs hover:border-[#D97706] transition-all cursor-pointer group min-h-[90px]"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] text-[#D97706] flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <Users size={20} className="text-[#D97706]" />
              </div>
              <span className="text-[11px] font-bold text-[#102A43] leading-tight">
                Field<br />Workforce
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── B. DESKTOP VIEW (Screens >= lg — Sovereign Epidemiological Console) ─── */}
      <div className="hidden lg:block space-y-5">
        {/* 1. Header Banner */}
        <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs border-l-4 border-l-[#102A43] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#102A43] text-[#F7F5EE] px-2 py-0.5 rounded-[1px]">
              EPIDEMIOLOGICAL SURVEILLANCE &middot; राष्ट्रीय पशु स्वास्थ्य निगरानी
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              JURISDICTION: DISTRICT VARANASI &middot; STATE VETERINARY COMMAND
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#102A43]">
            Livestock Health Intelligence Center
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            Real-time population health surveillance, spatio-temporal outbreak signals, and explainable predictive risk analytics.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Link
            to="/admin/analytics"
            className="px-3 py-2 bg-white border border-stone-300 hover:bg-stone-50 text-[#102A43] text-xs font-mono font-bold rounded-[2px] transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <BarChart3 size={13} />
            <span>EPIDEMIC CURVES</span>
          </Link>
          <Link
            to="/admin/surveillance-map"
            className="px-3.5 py-2 bg-[#1B5E3C] hover:bg-[#123C2A] text-white text-xs font-mono font-bold rounded-[2px] transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <MapPin size={13} />
            <span>GIS MAP DESK &rarr;</span>
          </Link>
        </div>
      </div>

      {/* 2. Dual Status Bar: Early Warning Score + Data Quality Indicator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Early Warning Signal Card */}
        {earlyWarning && (
          <div className="bg-[#FAF9F5] border border-stone-300 p-3.5 rounded-[2px] shadow-xs flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">
                  DISTRICT EARLY WARNING SCORE
                </span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-[1px] ${
                  earlyWarning.risk_level === 'HIGH' || earlyWarning.risk_level === 'ELEVATED'
                    ? 'bg-[#C62828] text-white'
                    : earlyWarning.risk_level === 'MEDIUM'
                    ? 'bg-[#E0A11A] text-stone-900'
                    : 'bg-[#2E7D32] text-white'
                }`}>
                  {earlyWarning.risk_level} RISK
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-[#102A43]">
                  {earlyWarning.early_warning_score}
                  <span className="text-xs text-stone-500 font-normal"> / 100</span>
                </span>
                <span className="flex items-center gap-1 text-xs font-mono font-bold text-stone-700">
                  {earlyWarning.trend === 'INCREASING' && <TrendingUp size={14} className="text-[#C62828]" />}
                  {earlyWarning.trend === 'DECREASING' && <TrendingDown size={14} className="text-[#2E7D32]" />}
                  {earlyWarning.trend === 'STABLE' && <Minus size={14} className="text-stone-500" />}
                  <span>{earlyWarning.trend} TREND</span>
                </span>
              </div>
              <p className="text-[11px] text-stone-600 line-clamp-1">
                Health reports are {earlyWarning.trend.toLowerCase()} across monitored blocks.
              </p>
            </div>

            <Link
              to="/admin/areas/varanasi"
              className="px-2.5 py-1.5 bg-[#102A43] hover:bg-[#1B5E3C] text-white text-[10px] font-mono font-bold rounded-[2px] shrink-0"
            >
              PROFILE &rarr;
            </Link>
          </div>
        )}

        {/* Data Quality Indicator Card */}
        {dataQuality && (
          <div className="bg-[#FAF9F5] border border-stone-300 p-3.5 rounded-[2px] shadow-xs flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">
                  SYSTEM DATA QUALITY
                </span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-[1px] ${
                  dataQuality.rating === 'Good'
                    ? 'bg-[#2E7D32] text-white'
                    : dataQuality.rating === 'Needs Attention'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-[#C62828] text-white'
                }`}>
                  {dataQuality.rating.toUpperCase()} ({dataQuality.score}%)
                </span>
              </div>
              <p className="text-xs font-bold text-[#102A43]">
                {dataQuality.issues[0]}
              </p>
              <p className="text-[11px] text-stone-500">
                {dataQuality.details.total_checked} livestock &amp; clinical records evaluated.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowQualityModal(true)}
              className="px-2.5 py-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 text-[10px] font-mono font-bold rounded-[2px] shrink-0 cursor-pointer"
            >
              DETAILS
            </button>
          </div>
        )}
      </div>

      {/* 3. Top Database-Bound Metrics (8 Standard Surveillance Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 font-mono">
        <div className="bg-white border border-stone-300 p-2.5 rounded-[2px] shadow-xs border-t-2 border-t-[#1B5E3C]">
          <span className="text-[9px] text-stone-500 font-bold uppercase block">TOTAL LIVESTOCK</span>
          <span className="text-xl font-black text-[#102A43] mt-0.5 block">{animals.length}</span>
          <span className="text-[9px] text-stone-400">REGISTERED</span>
        </div>

        <div className="bg-white border border-stone-300 p-2.5 rounded-[2px] shadow-xs border-t-2 border-t-[#D97706]">
          <span className="text-[9px] text-stone-500 font-bold uppercase block">ACTIVE CASES</span>
          <span className="text-xl font-black text-[#102A43] mt-0.5 block">{activeCases.length}</span>
          <span className="text-[9px] text-stone-400">UNDER TRIAGE</span>
        </div>

        <div className="bg-white border border-stone-300 p-2.5 rounded-[2px] shadow-xs border-t-2 border-t-[#C62828]">
          <span className="text-[9px] text-stone-500 font-bold uppercase block">HIGH-RISK CASES</span>
          <span className="text-xl font-black text-[#C62828] mt-0.5 block">{highRiskCases.length}</span>
          <span className="text-[9px] text-stone-400">SCORE &ge; 50</span>
        </div>

        <div className="bg-white border border-stone-300 p-2.5 rounded-[2px] shadow-xs border-t-2 border-t-[#7B1818]">
          <span className="text-[9px] text-stone-500 font-bold uppercase block">OUTBREAKS</span>
          <span className="text-xl font-black text-[#C62828] mt-0.5 block">{possibleOutbreaks.length}</span>
          <span className="text-[9px] text-stone-400">SCORE &ge; 70</span>
        </div>

        <div className="bg-white border border-stone-300 p-2.5 rounded-[2px] shadow-xs border-t-2 border-t-[#102A43]">
          <span className="text-[9px] text-stone-500 font-bold uppercase block">INVESTIGATION</span>
          <span className="text-xl font-black text-[#102A43] mt-0.5 block">{casesUnderInvestigation.length}</span>
          <span className="text-[9px] text-stone-400">FIELD TRIAGE</span>
        </div>

        <div className="bg-white border border-stone-300 p-2.5 rounded-[2px] shadow-xs border-t-2 border-t-[#2E7D32]">
          <span className="text-[9px] text-stone-500 font-bold uppercase block">VACCINE DUE</span>
          <span className="text-xl font-black text-[#2E7D32] mt-0.5 block">{vaccineDueCount}</span>
          <span className="text-[9px] text-stone-400">PENDING DOSE</span>
        </div>

        <div className="bg-white border border-stone-300 p-2.5 rounded-[2px] shadow-xs border-t-2 border-t-[#7B1818]">
          <span className="text-[9px] text-stone-500 font-bold uppercase block">MORTALITY</span>
          <span className="text-xl font-black text-[#7B1818] mt-0.5 block">{mortalitySignals.length}</span>
          <span className="text-[9px] text-stone-400">REPORTED</span>
        </div>

        <div className="bg-white border border-stone-300 p-2.5 rounded-[2px] shadow-xs border-t-2 border-t-[#102A43]">
          <span className="text-[9px] text-stone-500 font-bold uppercase block">TOTAL CASES</span>
          <span className="text-xl font-black text-[#102A43] mt-0.5 block">{cases.length}</span>
          <span className="text-[9px] text-stone-400">LIFETIME</span>
        </div>
      </div>
      </div>

      {/* 4. Intelligent Recommendations (Decision Support Engine) */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-stone-200 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-[#102A43]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#102A43]">
              DECISION-SUPPORT RECOMMENDATIONS &middot; स्वायत्त नैदानिक सिफ़ारिशें
            </h2>
          </div>
          <span className="text-[10px] font-mono text-stone-500">
            TRANSPARENT JUSTIFICATIONS &middot; VETERINARY VERIFICATION REQUIRED
          </span>
        </div>

        {recommendations.length === 0 ? (
          <p className="text-xs text-stone-500 p-4 text-center font-mono">
            No active emergency biosecurity recommendations at this time. All indicators within normal surveillance thresholds.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendations.map((rec) => {
              const isCritical = rec.priority === 'CRITICAL'
              return (
                <div
                  key={rec.id}
                  className={`p-3.5 border rounded-[2px] space-y-2 ${
                    isCritical
                      ? 'bg-[#FDF0EE] border-[#C62828]/30'
                      : 'bg-[#FAF9F5] border-stone-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-[1px] ${
                          isCritical ? 'bg-[#C62828] text-white' : 'bg-[#102A43] text-white'
                        }`}>
                          {rec.priority}
                        </span>
                        <span className="text-[10px] font-mono text-stone-500 font-semibold">
                          AREA: {rec.area_name}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-stone-900 mt-1">
                        {rec.title}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleActionRecommendation(rec.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-stone-300 hover:bg-stone-50 text-[10px] font-mono font-bold text-[#102A43] rounded-[1px] shrink-0 cursor-pointer"
                    >
                      <CheckCircle2 size={11} className="text-[#1B5E3C]" />
                      <span>Actioned</span>
                    </button>
                  </div>

                  <p className="text-xs text-stone-600">
                    {rec.description}
                  </p>

                  {/* Explainable Reasons */}
                  <div className="bg-white/80 p-2 rounded-[2px] border border-stone-200 space-y-1 text-[11px] font-sans">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 block">
                      REASONING (EXPLAINABILITY AUDIT):
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-stone-700">
                      {rec.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 5. Operational Surveillance Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Panel A: Active Outbreak Clusters */}
        <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#102A43] flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-[#C62828]" />
              ACTIVE EPIDEMIOLOGICAL CLUSTERS
            </span>
            <Link
              to="/admin/outbreaks"
              className="text-[11px] font-mono text-[#1B5E3C] hover:underline font-bold"
            >
              FULL REGISTRY &rarr;
            </Link>
          </div>

          <div className="space-y-2.5">
            {activeClusters.map((cluster) => (
              <div
                key={cluster.id}
                className="p-3 bg-[#FAF9F5] border border-stone-200 rounded-[2px] flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#102A43]">
                      {cluster.cluster_code}
                    </span>
                    <span className="font-mono text-[9px] uppercase font-bold bg-[#102A43] text-white px-1.5 py-0.2 rounded-[1px]">
                      {cluster.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-stone-900 mt-1">{cluster.cluster_name}</h4>
                  <p className="text-stone-600 font-mono text-[11px] mt-0.5">
                    {cluster.case_count} cases &bull; {cluster.radius_km} km radius &bull; Villages: {cluster.affected_villages.join(', ')}
                  </p>
                </div>

                <div className="text-right shrink-0 font-mono">
                  <span className="text-[10px] text-stone-500 block">SCORE</span>
                  <span className="font-black text-sm text-[#C62828]">
                    {cluster.cluster_score}/100
                  </span>
                </div>
              </div>
            ))}

            {activeClusters.length === 0 && (
              <p className="p-4 text-center text-xs text-stone-500 font-mono">
                No active epidemiological clusters detected in the reporting window.
              </p>
            )}
          </div>
        </div>

        {/* Panel B: Mortality & Emergency Biosecurity Signals */}
        <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#102A43] flex items-center gap-1.5">
              <Activity size={14} className="text-[#1B5E3C]" />
              MORTALITY &amp; CRITICAL HEALTH SIGNALS
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              {mortalitySignals.length} REPORTED
            </span>
          </div>

          <div className="space-y-2.5">
            {mortalitySignals.map((c) => (
              <div
                key={c.id}
                className="p-3 bg-[#FDF0EE] border border-[#C62828]/20 rounded-[2px] flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#C62828]">
                      CASE #{c.case_number}
                    </span>
                    <span className="font-mono text-[9px] uppercase font-bold bg-[#C62828] text-white px-1.5 py-0.2 rounded-[1px]">
                      {c.priority}
                    </span>
                  </div>
                  <p className="font-semibold text-stone-900 mt-1">
                    {c.village || 'Rampur Khurd'}, {c.district || 'Varanasi'}
                  </p>
                  <p className="text-stone-600 text-[11px] mt-0.5 line-clamp-1 italic">
                    &ldquo;{c.description || 'Reported livestock mortality'}&rdquo;
                  </p>
                </div>

                <Link
                  to={`/vet/cases/${c.id}`}
                  className="px-2 py-1 bg-white border border-stone-300 text-[10px] font-mono font-bold text-[#102A43] hover:bg-stone-50 rounded-[1px] shrink-0"
                >
                  DOSSIER &rarr;
                </Link>
              </div>
            ))}

            {mortalitySignals.length === 0 && (
              <p className="p-4 text-center text-xs text-stone-500 font-mono">
                No active mortality signals recorded in the current surveillance period.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 6. Quick Desk Links */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Link
          to="/admin/vaccination"
          className="p-3 bg-white border border-stone-300 rounded-[2px] shadow-xs hover:border-[#102A43] transition-colors flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">
              VACCINATION GAP
            </span>
            <p className="text-xs font-bold text-[#102A43] mt-0.5">
              Coverage Analytics &rarr;
            </p>
          </div>
          <Syringe size={15} className="text-[#1B5E3C]" />
        </Link>

        <Link
          to="/admin/analytics"
          className="p-3 bg-white border border-stone-300 rounded-[2px] shadow-xs hover:border-[#102A43] transition-colors flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">
              EPIDEMIOLOGY
            </span>
            <p className="text-xs font-bold text-[#102A43] mt-0.5">
              Longitudinal Charts &rarr;
            </p>
          </div>
          <BarChart3 size={15} className="text-[#102A43]" />
        </Link>

        <Link
          to="/admin/reports"
          className="p-3 bg-white border border-stone-300 rounded-[2px] shadow-xs hover:border-[#102A43] transition-colors flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">
              STATUTORY RETURNS
            </span>
            <p className="text-xs font-bold text-[#102A43] mt-0.5">
              Generate Bulletins &rarr;
            </p>
          </div>
          <FileBarChart size={15} className="text-[#D97706]" />
        </Link>

        <Link
          to="/admin/areas/varanasi"
          className="p-3 bg-white border border-stone-300 rounded-[2px] shadow-xs hover:border-[#102A43] transition-colors flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">
              AREA HEALTH PROFILE
            </span>
            <p className="text-xs font-bold text-[#102A43] mt-0.5">
              Varanasi Sector Dossier &rarr;
            </p>
          </div>
          <MapPin size={15} className="text-[#C62828]" />
        </Link>
      </div>

      {/* Data Quality Modal */}
      {showQualityModal && dataQuality && (
        <div className="fixed inset-0 z-50 bg-[#102A43]/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white border border-stone-300 w-full max-w-lg rounded-[2px] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#102A43] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info size={16} className="text-[#E0A11A]" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider">
                  SURVEILLANCE DATA QUALITY AUDIT
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQualityModal(false)}
                className="text-white/60 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-[2px]">
                <div>
                  <span className="text-xs font-mono text-stone-500 block">OVERALL COMPLETENESS</span>
                  <span className="text-xl font-bold font-mono text-[#102A43]">
                    {dataQuality.rating.toUpperCase()} ({dataQuality.score}%)
                  </span>
                </div>
                <div className="text-right text-xs font-mono text-stone-600">
                  <span>{dataQuality.details.total_checked} Total Checked</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-stone-700 block">
                  IDENTIFIED GAPS &amp; ANOMALIES:
                </span>
                <ul className="space-y-1.5 text-xs text-stone-700">
                  {dataQuality.issues.map((issue, idx) => (
                    <li key={idx} className="flex items-start gap-2 p-2 bg-stone-50 rounded border border-stone-200">
                      <span className="text-amber-600 font-bold">&bull;</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-[#FAF9F5] border border-amber-300/80 rounded-[2px] text-[11px] text-stone-600 font-sans">
                <strong>Data Governance Standard:</strong> Records with partial fields are retained in the surveillance stream with lower statistical weighting rather than being silently discarded.
              </div>

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => setShowQualityModal(false)}
                  className="px-4 py-1.5 bg-[#102A43] text-white text-xs font-mono font-bold rounded-[2px]"
                >
                  CLOSE AUDIT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardIntro>
  )
}
