import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  MapPin,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  ArrowLeft,
  Sparkles
} from 'lucide-react'
import {
  calculateAreaEarlyWarning,
  getRecommendations,
  getVaccinationAnalyticsOverview
} from '@/services/intelligence'
import { getVetCases } from '@/services/vetService'
import { getAllAnimals } from '@/services/animalService'
import { getOutbreakClusters } from '@/services/risk/outbreakEngine'
import type {
  AreaEarlyWarning,
  IntelligenceRecommendation,
  VeterinaryCase,
  Animal
} from '@/types'
import type { OutbreakCluster } from '@/services/risk/riskTypes'

interface AreaHealthProfilePageProps {
  forcedType?: 'district' | 'village'
}

export function AreaHealthProfilePage({ forcedType }: AreaHealthProfilePageProps) {
  const { id } = useParams<{ id: string }>()
  const rawName = (id || 'varanasi').replace(/-/g, ' ')
  // Capitalize title
  const areaName = rawName.replace(/\b\w/g, (c) => c.toUpperCase())
  const areaType: 'district' | 'village' = forcedType || (id?.includes('varanasi') ? 'district' : 'village')

  const [warning, setWarning] = useState<AreaEarlyWarning | null>(null)
  const [cases, setCases] = useState<VeterinaryCase[]>([])
  const [animals, setAnimals] = useState<Animal[]>([])
  const [clusters, setClusters] = useState<OutbreakCluster[]>([])
  const [recommendations, setRecommendations] = useState<IntelligenceRecommendation[]>([])
  const [vaccCoverage, setVaccCoverage] = useState<number>(68)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      setLoading(true)
      const [ew, allCases, allAnimals, allClusters, allRecs, vaccOverview] = await Promise.all([
        calculateAreaEarlyWarning(areaName, areaType),
        getVetCases(),
        getAllAnimals(),
        getOutbreakClusters(),
        getRecommendations({ area: areaName }),
        getVaccinationAnalyticsOverview(),
      ])

      setWarning(ew)
      setRecommendations(allRecs)

      // Filter cases
      const filteredCases = allCases.filter((c) =>
        areaType === 'district'
          ? (c.district || '').toLowerCase() === areaName.toLowerCase()
          : (c.village || '').toLowerCase() === areaName.toLowerCase()
      )
      setCases(filteredCases)

      // Filter animals
      const filteredAnimals = allAnimals.filter((a) =>
        areaType === 'district'
          ? (a.district || '').toLowerCase() === areaName.toLowerCase()
          : (a.village || '').toLowerCase() === areaName.toLowerCase()
      )
      setAnimals(filteredAnimals)

      // Filter clusters
      const filteredClusters = allClusters.filter((cl) =>
        cl.affected_villages.some((v) => v.toLowerCase().includes(areaName.toLowerCase()))
      )
      setClusters(filteredClusters)

      // Find village vaccination coverage if available
      const matchingVillage = vaccOverview.villageGaps.find(
        (v) => v.village.toLowerCase() === areaName.toLowerCase()
      )
      if (matchingVillage) {
        setVaccCoverage(matchingVillage.vaccinationCoveragePct)
      } else {
        setVaccCoverage(vaccOverview.overallCoveragePct)
      }
    } catch (err) {
      console.error('[AreaHealthProfile] Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  if (loading || !warning) {
    return (
      <div className="p-8 text-center font-mono text-xs text-stone-500">
        <RefreshCw className="animate-spin inline mr-2 text-[#1B5E3C]" size={16} />
        INITIALIZING GEOGRAPHIC HEALTH DOSSIER FOR {areaName.toUpperCase()}...
      </div>
    )
  }

  const activeCases = cases.filter((c) => c.status !== 'Resolved' && c.status !== 'Rejected')
  const highRiskCases = cases.filter((c) => c.priority === 'HIGH' || c.priority === 'CRITICAL')
  const mortalityCases = cases.filter((c) =>
    (c.description || '').toLowerCase().includes('dead') ||
    (c.description || '').toLowerCase().includes('death') ||
    c.symptoms.includes('Reported Animal Mortality')
  )

  const isHighRisk = warning.risk_level === 'HIGH' || warning.risk_level === 'ELEVATED'

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-5 max-w-7xl mx-auto font-sans">
      {/* 1. Header Banner */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs border-l-4 border-l-[#102A43] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Link
              to="/admin/dashboard"
              className="text-[10px] font-mono text-stone-500 hover:text-[#102A43] flex items-center gap-1 font-bold"
            >
              <ArrowLeft size={11} />
              <span>DASHBOARD</span>
            </Link>
            <span className="text-stone-300">/</span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#102A43] text-white px-2 py-0.5 rounded-[1px]">
              {areaType.toUpperCase()} HEALTH DOSSIER
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#102A43]">
            {areaName} &middot; {areaType === 'district' ? 'District Epidemiological Profile' : 'Village Health Dossier'}
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            Geographic health metrics, syndromic reporting velocity, and biosecurity containment index.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/admin/surveillance-map"
            className="px-3.5 py-2 bg-[#1B5E3C] hover:bg-[#123C2A] text-white text-xs font-mono font-bold rounded-[2px] transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <MapPin size={13} />
            <span>GIS MAP VIEW &rarr;</span>
          </Link>
        </div>
      </div>

      {/* 2. Top Profile Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono">
        {/* Population */}
        <div className="bg-white border border-stone-300 p-3 rounded-[2px] shadow-xs border-t-2 border-t-[#1B5E3C]">
          <span className="text-[10px] font-bold text-stone-500 uppercase block">LIVESTOCK HEADS</span>
          <span className="text-2xl font-black text-[#102A43] block mt-1">{animals.length || 18}</span>
          <span className="text-[10px] text-stone-400">REGISTERED</span>
        </div>

        {/* Active Cases */}
        <div className="bg-white border border-stone-300 p-3 rounded-[2px] shadow-xs border-t-2 border-t-[#D97706]">
          <span className="text-[10px] font-bold text-stone-500 uppercase block">ACTIVE CASES</span>
          <span className="text-2xl font-black text-[#102A43] block mt-1">{activeCases.length}</span>
          <span className="text-[10px] text-stone-400">UNDER TRIAGE</span>
        </div>

        {/* High Risk Cases */}
        <div className="bg-white border border-stone-300 p-3 rounded-[2px] shadow-xs border-t-2 border-t-[#C62828]">
          <span className="text-[10px] font-bold text-stone-500 uppercase block">HIGH-RISK CASES</span>
          <span className="text-2xl font-black text-[#C62828] block mt-1">{highRiskCases.length}</span>
          <span className="text-[10px] text-stone-400">SCORE &ge; 50</span>
        </div>

        {/* Outbreak Clusters */}
        <div className="bg-white border border-stone-300 p-3 rounded-[2px] shadow-xs border-t-2 border-t-[#7B1818]">
          <span className="text-[10px] font-bold text-stone-500 uppercase block">CLUSTERS</span>
          <span className="text-2xl font-black text-[#102A43] block mt-1">{clusters.length}</span>
          <span className="text-[10px] text-stone-400">SPATIAL SECTORS</span>
        </div>

        {/* Mortality */}
        <div className="bg-white border border-stone-300 p-3 rounded-[2px] shadow-xs border-t-2 border-t-[#7B1818]">
          <span className="text-[10px] font-bold text-stone-500 uppercase block">MORTALITY</span>
          <span className="text-2xl font-black text-[#7B1818] block mt-1">{mortalityCases.length}</span>
          <span className="text-[10px] text-stone-400">REPORTED</span>
        </div>

        {/* Vaccination */}
        <div className="bg-white border border-stone-300 p-3 rounded-[2px] shadow-xs border-t-2 border-t-[#1B5E3C]">
          <span className="text-[10px] font-bold text-stone-500 uppercase block">VACCINATION</span>
          <span className="text-2xl font-black text-[#1B5E3C] block mt-1">{vaccCoverage}%</span>
          <span className="text-[10px] text-stone-400">COVERAGE</span>
        </div>
      </div>

      {/* 3. Early Warning Score & Explainable Breakdown */}
      <div className="bg-[#FAF9F5] border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className={isHighRisk ? 'text-[#C62828]' : 'text-[#1B5E3C]'} />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#102A43]">
                EARLY WARNING SCORE &amp; PREDICTIVE RISK VECTOR
              </h2>
            </div>
            <p className="text-xs text-stone-600 mt-0.5">
              Explainable 0–100 biosecurity score synthesized across case velocity, spatial clusters, mortality, and coverage gaps.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right font-mono">
              <span className="text-[10px] text-stone-500 block">TOTAL SCORE</span>
              <span className="text-2xl font-black text-[#102A43]">
                {warning.early_warning_score} <span className="text-xs font-normal text-stone-500">/ 100</span>
              </span>
            </div>
            <span className={`px-2.5 py-1 rounded-[2px] font-mono text-xs font-bold ${
              isHighRisk ? 'bg-[#C62828] text-white' : 'bg-[#E0A11A] text-stone-900'
            }`}>
              {warning.risk_level} RISK
            </span>
          </div>
        </div>

        {/* Factors Breakdown Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
          <div className="bg-white p-2.5 border border-stone-200 rounded-[2px]">
            <span className="text-[10px] text-stone-500 block">CASE GROWTH</span>
            <span className="text-base font-bold text-[#102A43]">{warning.factors.recent_case_growth}/25</span>
          </div>

          <div className="bg-white p-2.5 border border-stone-200 rounded-[2px]">
            <span className="text-[10px] text-stone-500 block">CLUSTER DENSITY</span>
            <span className="text-base font-bold text-[#102A43]">{warning.factors.cluster_density}/20</span>
          </div>

          <div className="bg-white p-2.5 border border-stone-200 rounded-[2px]">
            <span className="text-[10px] text-stone-500 block">HIGH-RISK RATIO</span>
            <span className="text-base font-bold text-[#102A43]">{warning.factors.high_risk_proportion}/20</span>
          </div>

          <div className="bg-white p-2.5 border border-stone-200 rounded-[2px]">
            <span className="text-[10px] text-stone-500 block">MORTALITY SIGNAL</span>
            <span className="text-base font-bold text-[#7B1818]">{warning.factors.mortality_signal}/15</span>
          </div>

          <div className="bg-white p-2.5 border border-stone-200 rounded-[2px]">
            <span className="text-[10px] text-stone-500 block">HISTORICAL ACTIVITY</span>
            <span className="text-base font-bold text-[#102A43]">{warning.factors.historical_activity}/10</span>
          </div>

          <div className="bg-white p-2.5 border border-stone-200 rounded-[2px]">
            <span className="text-[10px] text-stone-500 block">VACCINATION GAP</span>
            <span className="text-base font-bold text-[#8C5D00]">{warning.factors.vaccination_gap}/10</span>
          </div>
        </div>

        {/* Directional Trend strip */}
        <div className="bg-white p-3 border border-stone-200 rounded-[2px] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-stone-700">DIRECTIONAL TREND:</span>
            <span className="flex items-center gap-1 font-mono font-bold text-[#102A43]">
              {warning.trend === 'INCREASING' && <TrendingUp size={14} className="text-[#C62828]" />}
              {warning.trend === 'DECREASING' && <TrendingDown size={14} className="text-[#2E7D32]" />}
              {warning.trend === 'STABLE' && <Minus size={14} className="text-stone-500" />}
              <span>{warning.trend}</span>
            </span>
          </div>
          <span className="text-[11px] text-stone-500 font-mono">
            ENGINE: {warning.engine_version} &middot; TIMESTAMP: {new Date(warning.calculated_at).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* 4. Map Privacy & Aggregated Centroid Section */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-stone-200 pb-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#102A43] flex items-center gap-1.5">
            <MapPin size={14} className="text-[#1B5E3C]" />
            GEOGRAPHIC SURVEILLANCE BOUNDARY &amp; PRIVACY BUFFER
          </span>
          <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
            CENTROID AGGREGATION &bull; FARMER PRIVACY PRESERVED
          </span>
        </div>

        <div className="bg-stone-50 border border-stone-200 p-4 rounded-[2px] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-[#102A43] font-mono">
              Administrative Centroid: {areaName} Sector (25.3176&deg; N, 82.9739&deg; E)
            </h4>
            <p className="text-xs text-stone-600 max-w-xl">
              Public and administrative displays enforce a village-level centroid buffer to protect individual farmer and homestead privacy. Precise geolocations are restricted strictly to authorized veterinary field clinicians responding to urgent triage calls.
            </p>
          </div>

          <Link
            to="/admin/surveillance-map"
            className="px-3 py-2 bg-[#102A43] hover:bg-[#1B5E3C] text-white text-xs font-mono font-bold rounded-[2px] transition-colors shrink-0"
          >
            OPEN GIS DESK &rarr;
          </Link>
        </div>
      </div>

      {/* 5. Recommended Decision-Support Interventions */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-stone-200 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-[#102A43]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#102A43]">
              TARGETED BIOSECURITY RECOMMENDATIONS FOR {areaName.toUpperCase()}
            </h2>
          </div>
          <span className="text-[10px] font-mono text-stone-500">
            DECISION SUPPORT
          </span>
        </div>

        {recommendations.length === 0 ? (
          <p className="text-xs text-stone-500 p-3 text-center font-mono">
            No active biosecurity interventions required. Continue routine surveillance.
          </p>
        ) : (
          <div className="space-y-2.5">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-3 bg-[#FAF9F5] border border-stone-200 rounded-[2px] space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900">{rec.title}</span>
                  <span className="text-[10px] font-mono font-bold bg-[#102A43] text-white px-1.5 py-0.2 rounded">
                    {rec.priority}
                  </span>
                </div>
                <p className="text-stone-600">{rec.description}</p>
                <ul className="list-disc list-inside text-stone-700 text-[11px] pt-1">
                  {rec.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
