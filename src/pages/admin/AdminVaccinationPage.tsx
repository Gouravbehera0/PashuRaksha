import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Syringe,
  ShieldCheck,
  AlertTriangle,
  Clock,
  RefreshCw,
  BarChart3,
  Info
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import { getVaccinationAnalyticsOverview, type VaccinationOverview } from '@/services/intelligence'

export function AdminVaccinationPage() {
  const [data, setData] = useState<VaccinationOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'All' | 'Good' | 'Attention' | 'High Attention'>('All')

  const loadData = async () => {
    try {
      setLoading(true)
      const overview = await getVaccinationAnalyticsOverview()
      setData(overview)
    } catch (err) {
      console.error('[AdminVaccination] Failed to load vaccination data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading || !data) {
    return (
      <div className="p-8 text-center font-mono text-xs text-stone-500">
        <RefreshCw className="animate-spin inline mr-2 text-[#1B5E3C]" size={16} />
        INITIALIZING VACCINATION COVERAGE TELEMETRY...
      </div>
    )
  }

  const filteredVillages = data.villageGaps.filter((v) => {
    if (statusFilter === 'All') return true
    return v.status === statusFilter
  })

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-5 max-w-7xl mx-auto font-sans">
      {/* 1. Header Banner */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs border-l-4 border-l-[#1B5E3C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#1B5E3C] text-white px-2 py-0.5 rounded-[1px]">
              PREVENTIVE BIODEFENSE &middot; टीकाकरण कवरेज एवं अंतराल
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              NATIONAL LIVESTOCK IMMUNIZATION SURVEILLANCE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#102A43]">
            Vaccination Coverage &amp; Gap Detection
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            Species-stratified immunization rates, regional gap detection, and targeted outreach prioritizations.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadData}
            className="p-2 border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 rounded-[2px] transition-colors cursor-pointer"
            title="Refresh Data"
            aria-label="Refresh Data"
          >
            <RefreshCw size={15} />
          </button>
          <Link
            to="/admin/reports"
            className="px-3 py-2 bg-[#102A43] hover:bg-[#1B5E3C] text-white text-xs font-mono font-bold rounded-[2px] transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>IMMUNIZATION BULLETIN &rarr;</span>
          </Link>
        </div>
      </div>

      {/* Telemetry Notice Strip */}
      <div className="bg-[#FAF9F5] border border-stone-300 px-3.5 py-2 rounded-[2px] flex items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-stone-700">
          <Info size={14} className="text-[#102A43]" />
          <span>
            Coverage percentages calculated from recorded vaccination logbooks in the active surveillance system.
          </span>
        </div>
        <span className="text-[10px] text-stone-500 hidden sm:inline">
          BASED ON AVAILABLE RECORDS
        </span>
      </div>

      {/* 2. Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        <div className="bg-white border border-stone-300 p-3.5 rounded-[2px] shadow-xs border-t-2 border-t-[#1B5E3C]">
          <div className="flex items-center justify-between text-stone-500 text-[10px] font-bold uppercase">
            <span>OVERALL COVERAGE</span>
            <ShieldCheck size={14} className="text-[#1B5E3C]" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-[#102A43]">{data.overallCoveragePct}%</span>
            <span className="text-[10px] text-stone-500">HERD THRESHOLD: 75%</span>
          </div>
        </div>

        <div className="bg-white border border-stone-300 p-3.5 rounded-[2px] shadow-xs border-t-2 border-t-[#102A43]">
          <div className="flex items-center justify-between text-stone-500 text-[10px] font-bold uppercase">
            <span>TOTAL VACCINATED</span>
            <Syringe size={14} className="text-[#102A43]" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-[#102A43]">{data.totalVaccinated}</span>
            <span className="text-[10px] text-stone-500">OF {data.totalLivestock} HEADS</span>
          </div>
        </div>

        <div className="bg-white border border-stone-300 p-3.5 rounded-[2px] shadow-xs border-t-2 border-t-[#E0A11A]">
          <div className="flex items-center justify-between text-stone-500 text-[10px] font-bold uppercase">
            <span>VACCINATIONS DUE</span>
            <Clock size={14} className="text-[#8C5D00]" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-[#8C5D00]">{data.vaccinationsDue}</span>
            <span className="text-[10px] text-stone-500">SCHEDULED</span>
          </div>
        </div>

        <div className="bg-white border border-stone-300 p-3.5 rounded-[2px] shadow-xs border-t-2 border-t-[#C62828]">
          <div className="flex items-center justify-between text-stone-500 text-[10px] font-bold uppercase">
            <span>OVERDUE BOOSTERS</span>
            <AlertTriangle size={14} className="text-[#C62828]" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-[#C62828]">{data.vaccinationsOverdue}</span>
            <span className="text-[10px] text-[#C62828] font-bold">ACTION REQUIRED</span>
          </div>
        </div>
      </div>

      {/* 3. Coverage by Species (Chart & Breakdown) */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200 pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 size={15} className="text-[#102A43]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#102A43]">
              SPECIES-STRATIFIED VACCINATION COVERAGE
            </h2>
          </div>
          <span className="text-[10px] font-mono text-stone-500">
            PERCENTAGE OF REGISTERED POPULATION IMMUNIZED
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.speciesBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="species" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fontFamily: 'monospace' }} />
              <Tooltip
                formatter={(value: any) => [`${value}%`, 'Coverage']}
                contentStyle={{ backgroundColor: '#102A43', color: '#FFFFFF', borderRadius: 2, fontSize: 11, fontFamily: 'monospace' }}
              />
              <Bar dataKey="coveragePct" fill="#1B5E3C">
                {data.speciesBreakdown.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.coveragePct >= 75 ? '#1B5E3C' : entry.coveragePct >= 50 ? '#E0A11A' : '#C62828'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 font-mono text-xs">
          {data.speciesBreakdown.map((sp) => (
            <div key={sp.species} className="p-2.5 bg-stone-50 border border-stone-200 rounded-[2px]">
              <span className="text-stone-500 font-bold block">{sp.species}</span>
              <span className="text-base font-black text-[#102A43] block mt-0.5">{sp.coveragePct}%</span>
              <span className="text-[10px] text-stone-400 block">{sp.vaccinated}/{sp.totalPopulation} Heads</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Regional Vaccination Gap Detection Table */}
      <div className="bg-white border border-stone-300 rounded-[2px] shadow-xs">
        <div className="p-3.5 sm:p-4 border-b border-stone-200 bg-stone-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E0A11A] animate-pulse" />
              <h2 className="text-sm font-bold text-[#102A43] uppercase tracking-wide font-mono">
                REGIONAL VACCINATION GAP DETECTION &middot; क्षेत्र-वार टीकाकरण अंतराल
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5 font-sans">
              Identifies villages exhibiting low recorded vaccination coverage for targeted outreach.
            </p>
          </div>

          <div className="flex items-center gap-1 font-mono text-[11px] flex-wrap">
            {(['All', 'High Attention', 'Attention', 'Good'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`px-2.5 py-1 rounded-[2px] border font-bold transition-colors cursor-pointer ${
                  statusFilter === filter
                    ? 'bg-[#102A43] text-white border-[#102A43]'
                    : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-stone-100/70 text-stone-600 border-b border-stone-200 font-mono text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Village / Sector</th>
                <th className="py-2.5 px-3">Recorded Coverage</th>
                <th className="py-2.5 px-3">Status Assessment</th>
                <th className="py-2.5 px-3">Active Cases</th>
                <th className="py-2.5 px-3">Mortality Signals</th>
                <th className="py-2.5 px-3">Biosecurity Recommendation</th>
                <th className="py-2.5 px-3 text-right">Area Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredVillages.map((v) => {
                const isHighAttention = v.status === 'High Attention'
                const isAttention = v.status === 'Attention'

                return (
                  <tr key={v.village} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-3 font-semibold text-[#102A43]">
                      {v.village}
                    </td>

                    <td className="py-3 px-3 font-mono font-bold whitespace-nowrap">
                      <span className={isHighAttention ? 'text-[#C62828]' : isAttention ? 'text-[#8C5D00]' : 'text-[#1B5E3C]'}>
                        {v.vaccinationCoveragePct}%
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-[1px] font-mono text-[10px] font-bold ${
                        isHighAttention
                          ? 'bg-[#FDF0EE] text-[#C62828] border border-[#C62828]/30'
                          : isAttention
                          ? 'bg-amber-50 text-amber-800 border border-amber-300'
                          : 'bg-[#EBF5EE] text-[#1B5E3C] border border-[#1B5E3C]/30'
                      }`}>
                        {isHighAttention ? 'Low recorded coverage' : isAttention ? 'Attention' : 'Good'}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-stone-700">
                      {v.cases} cases ({v.highRiskCases} high risk)
                    </td>

                    <td className="py-3 px-3 font-mono text-stone-700">
                      {v.mortality > 0 ? (
                        <span className="text-[#C62828] font-bold">{v.mortality} event(s)</span>
                      ) : (
                        <span className="text-stone-400">0</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-stone-600 max-w-xs">
                      {isHighAttention ? (
                        <span className="text-amber-900 font-semibold text-[11px]">
                          Targeted vaccination outreach &amp; field verification recommended.
                        </span>
                      ) : isAttention ? (
                        <span className="text-stone-700 text-[11px]">
                          Routine booster campaign to reach biosecurity threshold.
                        </span>
                      ) : (
                        <span className="text-stone-500 text-[11px]">
                          Adequate recorded biosecurity coverage.
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <Link
                        to={`/admin/villages/${v.village.toLowerCase().replace(/\s+/g, '-')}`}
                        className="px-2.5 py-1 bg-[#102A43] hover:bg-[#1B5E3C] text-white text-[11px] font-mono font-bold rounded-[2px] transition-colors inline-block"
                      >
                        VIEW &rarr;
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
