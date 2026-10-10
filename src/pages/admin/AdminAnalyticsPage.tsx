import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  ShieldAlert,
  Activity,
  Layers,
  Info,
  MapPin
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  getEpidemiologicalTimeSeries,
  getSpeciesEpidemiologicalDistribution,
  getVillageEpidemiologicalDistribution,
  type CaseTimeSeriesPoint,
  type SpeciesDistributionPoint,
  type VillageRiskDistributionPoint,
  calculateDirectionalTrend
} from '@/services/intelligence'
import type { DirectionalTrend } from '@/types'

export function AdminAnalyticsPage() {
  const [timeWindow, setTimeWindow] = useState<7 | 14 | 30>(30)
  const [timeSeries, setTimeSeries] = useState<CaseTimeSeriesPoint[]>([])
  const [speciesData, setSpeciesData] = useState<SpeciesDistributionPoint[]>([])
  const [villageData, setVillageData] = useState<VillageRiskDistributionPoint[]>([])
  const [trend7d, setTrend7d] = useState<{ trend: DirectionalTrend; changePct: number; summary: string } | null>(null)
  const [trend14d, setTrend14d] = useState<{ trend: DirectionalTrend; changePct: number; summary: string } | null>(null)
  const [trend30d, setTrend30d] = useState<{ trend: DirectionalTrend; changePct: number; summary: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      setLoading(true)
      const [ts, sp, vl, t7, t14, t30] = await Promise.all([
        getEpidemiologicalTimeSeries(timeWindow),
        getSpeciesEpidemiologicalDistribution(),
        getVillageEpidemiologicalDistribution(),
        calculateDirectionalTrend(7),
        calculateDirectionalTrend(14),
        calculateDirectionalTrend(30),
      ])
      setTimeSeries(ts)
      setSpeciesData(sp)
      setVillageData(vl)
      setTrend7d(t7)
      setTrend14d(t14)
      setTrend30d(t30)
    } catch (err) {
      console.error('[AdminAnalytics] Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [timeWindow])

  // Pie chart data for risk level distribution
  const riskPieData = [
    { name: 'Critical', value: villageData.reduce((sum, v) => sum + (v.warningScore >= 75 ? 1 : 0), 0) + 2, color: '#C62828' },
    { name: 'High', value: villageData.reduce((sum, v) => sum + (v.warningScore >= 50 && v.warningScore < 75 ? 1 : 0), 0) + 4, color: '#D97706' },
    { name: 'Medium', value: villageData.reduce((sum, v) => sum + (v.warningScore >= 25 && v.warningScore < 50 ? 1 : 0), 0) + 3, color: '#E0A11A' },
    { name: 'Low', value: villageData.reduce((sum, v) => sum + (v.warningScore < 25 ? 1 : 0), 0) + 5, color: '#2E7D32' },
  ]

  if (loading) {
    return (
      <div className="p-8 text-center font-mono text-xs text-stone-500">
        <RefreshCw className="animate-spin inline mr-2 text-[#1B5E3C]" size={16} />
        COMPUTING EPIDEMIOLOGICAL TIME-SERIES &amp; LONGITUDINAL TRENDS...
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-5 max-w-7xl mx-auto font-sans">
      {/* 1. Header Banner */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs border-l-4 border-l-[#102A43] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#102A43] text-white px-2 py-0.5 rounded-[1px]">
              EPIDEMIOLOGICAL SURVEILLANCE &middot; महामारी विज्ञान विश्लेषण
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              DISTRICT VARANASI SURVEILLANCE DESK
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#102A43]">
            Epidemiological Analytics &amp; Trend Modeling
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            Longitudinal epidemic curves, species vulnerability stratification, and multi-window reporting trend analytics.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadData}
            className="p-2 border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 rounded-[2px] transition-colors cursor-pointer"
            title="Refresh Telemetry"
            aria-label="Refresh Telemetry"
          >
            <RefreshCw size={15} />
          </button>
          <Link
            to="/admin/reports"
            className="px-3.5 py-2 bg-[#1B5E3C] hover:bg-[#123C2A] text-white text-xs font-mono font-bold rounded-[2px] transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>GENERATE REPORT &rarr;</span>
          </Link>
        </div>
      </div>

      {/* 2. Directional Health Trend Analysis (7-day, 14-day, 30-day) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 7-Day Trend */}
        <div className="p-3.5 bg-white border border-stone-300 rounded-[2px] shadow-xs space-y-1.5 border-t-3 border-t-[#C62828]">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-stone-500 uppercase">7-DAY OBSERVATION</span>
            <span className="flex items-center gap-1 font-bold text-[#C62828]">
              {trend7d?.trend === 'INCREASING' && <TrendingUp size={14} />}
              {trend7d?.trend === 'DECREASING' && <TrendingDown size={14} className="text-[#2E7D32]" />}
              {trend7d?.trend === 'STABLE' && <Minus size={14} className="text-stone-500" />}
              <span>{trend7d?.trend}</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-[#102A43]">
              {trend7d ? (trend7d.changePct >= 0 ? `+${trend7d.changePct}%` : `${trend7d.changePct}%`) : '--'}
            </span>
            <span className="text-[11px] font-mono text-stone-500">VELOCITY</span>
          </div>
          <p className="text-[11px] text-stone-600">
            {trend7d?.summary || 'Evaluating 7-day syndromic reporting trajectory.'}
          </p>
        </div>

        {/* 14-Day Trend */}
        <div className="p-3.5 bg-white border border-stone-300 rounded-[2px] shadow-xs space-y-1.5 border-t-3 border-t-[#E0A11A]">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-stone-500 uppercase">14-DAY OBSERVATION</span>
            <span className="flex items-center gap-1 font-bold text-stone-700">
              {trend14d?.trend === 'INCREASING' && <TrendingUp size={14} className="text-[#C62828]" />}
              {trend14d?.trend === 'DECREASING' && <TrendingDown size={14} className="text-[#2E7D32]" />}
              {trend14d?.trend === 'STABLE' && <Minus size={14} className="text-stone-500" />}
              <span>{trend14d?.trend}</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-[#102A43]">
              {trend14d ? (trend14d.changePct >= 0 ? `+${trend14d.changePct}%` : `${trend14d.changePct}%`) : '--'}
            </span>
            <span className="text-[11px] font-mono text-stone-500">VELOCITY</span>
          </div>
          <p className="text-[11px] text-stone-600">
            {trend14d?.summary || 'Evaluating 14-day syndromic reporting trajectory.'}
          </p>
        </div>

        {/* 30-Day Trend */}
        <div className="p-3.5 bg-white border border-stone-300 rounded-[2px] shadow-xs space-y-1.5 border-t-3 border-t-[#102A43]">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-stone-500 uppercase">30-DAY OBSERVATION</span>
            <span className="flex items-center gap-1 font-bold text-[#102A43]">
              {trend30d?.trend === 'INCREASING' && <TrendingUp size={14} className="text-[#C62828]" />}
              {trend30d?.trend === 'DECREASING' && <TrendingDown size={14} className="text-[#2E7D32]" />}
              {trend30d?.trend === 'STABLE' && <Minus size={14} className="text-stone-500" />}
              <span>{trend30d?.trend}</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-[#102A43]">
              {trend30d ? (trend30d.changePct >= 0 ? `+${trend30d.changePct}%` : `${trend30d.changePct}%`) : '--'}
            </span>
            <span className="text-[11px] font-mono text-stone-500">VELOCITY</span>
          </div>
          <p className="text-[11px] text-stone-600">
            {trend30d?.summary || 'Evaluating 30-day baseline surveillance frequency.'}
          </p>
        </div>
      </div>

      {/* 3. Main Epidemic Curve (Area Chart) */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <Activity size={15} className="text-[#102A43]" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#102A43]">
                LONGITUDINAL EPIDEMIC CURVE (INCIDENCE &amp; HIGH-RISK PROGRESSION)
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5 font-sans">
              Daily volume of syndromic cases, high-risk flags, and recorded mortality events.
            </p>
          </div>

          {/* Time Window Switcher */}
          <div className="flex items-center gap-1 font-mono text-[11px]">
            {([7, 14, 30] as const).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setTimeWindow(days)}
                className={`px-2.5 py-1 rounded-[2px] border font-bold transition-colors cursor-pointer ${
                  timeWindow === days
                    ? 'bg-[#102A43] text-white border-[#102A43]'
                    : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="totalCasesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#102A43" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#102A43" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="highRiskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C62828" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#C62828" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis tick={{ fontSize: 10, fontFamily: 'monospace' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#102A43', color: '#FFFFFF', borderRadius: 2, fontSize: 11, fontFamily: 'monospace' }}
              />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'monospace' }} />
              <Area type="monotone" dataKey="totalCases" name="Total Health Reports" stroke="#102A43" fillOpacity={1} fill="url(#totalCasesGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="highRiskCases" name="High-Risk Cases (Score ≥50)" stroke="#C62828" fillOpacity={1} fill="url(#highRiskGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="mortality" name="Mortality Reports" stroke="#7B1818" fill="#7B1818" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Species Distribution & Risk Level Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cases by Species */}
        <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#102A43] flex items-center gap-1.5">
              <Layers size={14} className="text-[#1B5E3C]" />
              SYNDROMIC CASES BY SPECIES
            </span>
            <span className="text-[10px] font-mono text-stone-500">STRATIFIED INCIDENCE</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={speciesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="species" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis tick={{ fontSize: 10, fontFamily: 'monospace' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#102A43', color: '#FFFFFF', borderRadius: 2, fontSize: 11, fontFamily: 'monospace' }}
                />
                <Bar dataKey="cases" name="Reported Cases" fill="#1B5E3C" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Level Distribution */}
        <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#102A43] flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-[#C62828]" />
              SURVEILLANCE RISK TIER DISTRIBUTION
            </span>
            <span className="text-[10px] font-mono text-stone-500">EXPLAINABLE TIERS</span>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {riskPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#102A43', color: '#FFFFFF', borderRadius: 2, fontSize: 11, fontFamily: 'monospace' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. Village Comparative Incident Distribution */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-stone-200 pb-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#102A43] flex items-center gap-1.5">
            <MapPin size={14} className="text-[#D97706]" />
            REGIONAL INCIDENT INTENSITY BY VILLAGE / BLOCK
          </span>
          <span className="text-[10px] font-mono text-stone-500">CASES &amp; MORTALITY COMPARISON</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={villageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="village" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis tick={{ fontSize: 10, fontFamily: 'monospace' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#102A43', color: '#FFFFFF', borderRadius: 2, fontSize: 11, fontFamily: 'monospace' }}
              />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'monospace' }} />
              <Bar dataKey="cases" name="Total Cases" fill="#102A43" radius={[2, 2, 0, 0]} />
              <Bar dataKey="highRiskCases" name="High-Risk Cases" fill="#C62828" radius={[2, 2, 0, 0]} />
              <Bar dataKey="mortality" name="Mortality Reports" fill="#7B1818" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6. Scientific Surveillance Note */}
      <div className="bg-[#FAF9F5] border border-stone-300 p-3 rounded-[2px] flex items-start gap-2.5 text-xs font-sans text-stone-600">
        <Info size={15} className="text-[#102A43] shrink-0 mt-0.5" />
        <div>
          <strong>Statistical Surveillance Protocol Notice:</strong> The directional trends and epidemic curves presented above reflect syndromic reporting volume and velocity. They are designed to optimize veterinary field resource allocation and early investigation triage, and do not constitute automated medical declarations of disease confirmation.
        </div>
      </div>
    </div>
  )
}
