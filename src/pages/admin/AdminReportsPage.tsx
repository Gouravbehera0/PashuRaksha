import { useState, useEffect } from 'react'
import {
  Printer,
  Filter,
  RefreshCw,
  FileBarChart,
  FileText
} from 'lucide-react'
import {
  generateSurveillanceReport,
  getSurveillanceReports,
} from '@/services/intelligence'
import { ReportingDashboard } from '@/components/reports/ReportingDashboard'
import type { ReportType, SurveillanceReport } from '@/types'

const REPORT_TYPES: ReportType[] = [
  'Health Surveillance Report',
  'Outbreak Report',
  'Vaccination Report',
  'Mortality Report',
  'Veterinary Activity Report',
  'District Health Report'
]

export function AdminReportsPage() {
  const [mode, setMode] = useState<'console' | 'bulletins'>('console')
  const [reports, setReports] = useState<SurveillanceReport[]>([])
  const [activeReport, setActiveReport] = useState<SurveillanceReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  // Form Controls
  const [reportType, setReportType] = useState<ReportType>('Health Surveillance Report')
  const [periodStart, setPeriodStart] = useState(
    new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  )
  const [periodEnd, setPeriodEnd] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [district, setDistrict] = useState('Varanasi')
  const [village, setVillage] = useState('All')
  const [animalType, setAnimalType] = useState('All')
  const [riskLevel, setRiskLevel] = useState('All')

  const loadReports = async () => {
    try {
      setLoading(true)
      const list = await getSurveillanceReports()
      setReports(list)
      if (list.length > 0 && !activeReport) {
        setActiveReport(list[0])
      }
    } catch (err) {
      console.error('[AdminReports] Failed to fetch reports:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setGenerating(true)
      const rep = await generateSurveillanceReport(reportType, {
        district,
        village,
        animal_type: animalType,
        risk_level: riskLevel,
        period_start: periodStart,
        period_end: periodEnd,
      })
      setReports((prev) => [rep, ...prev])
      setActiveReport(rep)
    } catch (err) {
      console.error('Failed to generate report:', err)
    } finally {
      setGenerating(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="p-8 text-center font-mono text-xs text-stone-500">
        <RefreshCw className="animate-spin inline mr-2 text-[#1B5E3C]" size={16} />
        INITIALIZING SURVEILLANCE BULLETINS REGISTRY...
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-5 max-w-7xl mx-auto font-sans">
      {/* 1. Header Banner */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs border-l-4 border-l-[#102A43] flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#102A43] text-white px-2 py-0.5 rounded-[1px]">
              BIOSECURITY RETURNS &middot; रोग निगरानी रिपोर्ट
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              NATIONAL SURVEILLANCE REPORTING ENGINE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#102A43]">
            Statutory Disease Surveillance Bulletins & Reporting
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            Compile, review, audit and export standardized livestock health surveillance returns and district epidemiological summaries.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadReports}
            className="p-2 border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 rounded-[2px] transition-colors cursor-pointer"
            title="Refresh Registry"
            aria-label="Refresh Registry"
          >
            <RefreshCw size={15} />
          </button>
          {mode === 'bulletins' && activeReport && (
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-[#1B5E3C] hover:bg-[#123C2A] text-white text-xs font-mono font-bold rounded-[2px] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer size={14} />
              <span>PRINT BULLETIN</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex border-b border-stone-300 gap-2 print:hidden">
        <button
          type="button"
          onClick={() => setMode('console')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            mode === 'console'
              ? 'border-[#102A43] text-[#102A43] bg-white'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <FileBarChart size={14} />
          Master Statutory Reporting Console (All 7 Categories)
        </button>
        <button
          type="button"
          onClick={() => setMode('bulletins')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            mode === 'bulletins'
              ? 'border-[#102A43] text-[#102A43] bg-white'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <FileText size={14} />
          Historical Surveillance Bulletins
        </button>
      </div>

      {mode === 'console' ? (
        <ReportingDashboard userRole="admin" />
      ) : (
        <div className="space-y-5">

      {/* 2. Report Compilation Parameters Panel (Form) */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3 print:hidden">
        <div className="flex items-center justify-between border-b border-stone-200 pb-2">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-[#102A43]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#102A43]">
              SURVEILLANCE BULLETIN PARAMETERS
            </h2>
          </div>
          <span className="text-[10px] font-mono text-stone-500">
            DYNAMIC DATABASE COMPILATION
          </span>
        </div>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-mono font-bold text-stone-700 uppercase mb-1">
              REPORT TYPE
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full p-2 bg-stone-50 border border-stone-300 rounded-[2px] text-stone-800 focus:outline-none focus:border-[#102A43]"
            >
              {REPORT_TYPES.map((rt) => (
                <option key={rt} value={rt}>{rt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-mono font-bold text-stone-700 uppercase mb-1">
              PERIOD START
            </label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              required
              className="w-full p-2 bg-stone-50 border border-stone-300 rounded-[2px] font-mono text-stone-800 focus:outline-none focus:border-[#102A43]"
            />
          </div>

          <div>
            <label className="block font-mono font-bold text-stone-700 uppercase mb-1">
              PERIOD END
            </label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              required
              className="w-full p-2 bg-stone-50 border border-stone-300 rounded-[2px] font-mono text-stone-800 focus:outline-none focus:border-[#102A43]"
            />
          </div>

          <div>
            <label className="block font-mono font-bold text-stone-700 uppercase mb-1">
              DISTRICT JURISDICTION
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full p-2 bg-stone-50 border border-stone-300 rounded-[2px] text-stone-800 focus:outline-none focus:border-[#102A43]"
            >
              <option value="Varanasi">Varanasi</option>
              <option value="Mirzapur">Mirzapur</option>
              <option value="Chandauli">Chandauli</option>
              <option value="All">All Districts</option>
            </select>
          </div>

          <div>
            <label className="block font-mono font-bold text-stone-700 uppercase mb-1">
              VILLAGE SECTOR
            </label>
            <select
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className="w-full p-2 bg-stone-50 border border-stone-300 rounded-[2px] text-stone-800 focus:outline-none focus:border-[#102A43]"
            >
              <option value="All">All Villages</option>
              <option value="Rampur Khurd">Rampur Khurd</option>
              <option value="Shivpur">Shivpur</option>
              <option value="Cholapur">Cholapur</option>
              <option value="Kashi Gaon">Kashi Gaon</option>
            </select>
          </div>

          <div>
            <label className="block font-mono font-bold text-stone-700 uppercase mb-1">
              SPECIES
            </label>
            <select
              value={animalType}
              onChange={(e) => setAnimalType(e.target.value)}
              className="w-full p-2 bg-stone-50 border border-stone-300 rounded-[2px] text-stone-800 focus:outline-none focus:border-[#102A43]"
            >
              <option value="All">All Species</option>
              <option value="Cow">Cattle / Cow</option>
              <option value="Buffalo">Buffalo</option>
              <option value="Goat">Goat</option>
              <option value="Sheep">Sheep</option>
            </select>
          </div>

          <div>
            <label className="block font-mono font-bold text-stone-700 uppercase mb-1">
              RISK TIER FILTER
            </label>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              className="w-full p-2 bg-stone-50 border border-stone-300 rounded-[2px] text-stone-800 focus:outline-none focus:border-[#102A43]"
            >
              <option value="All">All Tiers</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={generating}
              className="w-full p-2 bg-[#102A43] hover:bg-[#1B5E3C] text-white font-mono font-bold rounded-[2px] transition-colors cursor-pointer"
            >
              {generating ? 'COMPILING BULLETIN...' : 'GENERATE BULLETIN &rarr;'}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Report Preview & Document View */}
      {activeReport ? (
        <div className="bg-white border border-stone-300 rounded-[2px] shadow-sm p-6 sm:p-8 space-y-6 print:border-none print:p-0">
          {/* Document Masthead */}
          <div className="border-b-2 border-[#102A43] pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-500">
                PASHURAKSHA &middot; DIGITAL LIVESTOCK HEALTH SURVEILLANCE PLATFORM
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#102A43] font-serif tracking-tight mt-1">
                LIVESTOCK HEALTH SURVEILLANCE BULLETIN
              </h2>
              <p className="text-xs font-mono font-semibold text-[#1B5E3C] mt-0.5">
                {activeReport.title}
              </p>
            </div>

            <div className="text-left sm:text-right font-mono text-xs text-stone-600 shrink-0">
              <span className="block font-bold">DOC ID: {activeReport.id.toUpperCase()}</span>
              <span className="block text-[11px] text-stone-500">
                GENERATED: {new Date(activeReport.created_at).toLocaleString('en-IN')}
              </span>
              <span className="block text-[11px] text-stone-500">
                STATUS: STATUTORY TRANSMISSION
              </span>
            </div>
          </div>

          {/* Reporting Period & Scope Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-3.5 border border-stone-200 rounded-[2px] font-mono text-xs">
            <div>
              <span className="text-[10px] text-stone-500 uppercase block font-bold">REPORTING PERIOD</span>
              <span className="font-bold text-[#102A43] block mt-0.5">
                {activeReport.period_start} &rarr; {activeReport.period_end}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-stone-500 uppercase block font-bold">JURISDICTION</span>
              <span className="font-bold text-[#102A43] block mt-0.5">
                {activeReport.parameters.district || 'Varanasi'} District
              </span>
            </div>

            <div>
              <span className="text-[10px] text-stone-500 uppercase block font-bold">TARGET SECTOR</span>
              <span className="font-bold text-[#102A43] block mt-0.5">
                {activeReport.parameters.village || 'All Villages'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-stone-500 uppercase block font-bold">SPECIES STRATA</span>
              <span className="font-bold text-[#102A43] block mt-0.5">
                {activeReport.parameters.animal_type || 'All Species'}
              </span>
            </div>
          </div>

          {/* Key Metric Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono text-xs">
            <div className="p-3 border border-stone-200 rounded-[2px] bg-white">
              <span className="text-[10px] text-stone-500 uppercase block font-bold">TOTAL REPORTS</span>
              <span className="text-2xl font-black text-[#102A43] block mt-1">
                {activeReport.metrics.total_reports}
              </span>
            </div>

            <div className="p-3 border border-stone-200 rounded-[2px] bg-white">
              <span className="text-[10px] text-stone-500 uppercase block font-bold">HIGH RISK</span>
              <span className="text-2xl font-black text-[#C62828] block mt-1">
                {activeReport.metrics.high_risk_count}
              </span>
            </div>

            <div className="p-3 border border-stone-200 rounded-[2px] bg-white">
              <span className="text-[10px] text-stone-500 uppercase block font-bold">CLUSTERS</span>
              <span className="text-2xl font-black text-[#102A43] block mt-1">
                {activeReport.metrics.active_clusters}
              </span>
            </div>

            <div className="p-3 border border-stone-200 rounded-[2px] bg-white">
              <span className="text-[10px] text-stone-500 uppercase block font-bold">MORTALITY</span>
              <span className="text-2xl font-black text-[#7B1818] block mt-1">
                {activeReport.metrics.mortality_count}
              </span>
            </div>

            <div className="p-3 border border-stone-200 rounded-[2px] bg-white">
              <span className="text-[10px] text-stone-500 uppercase block font-bold">VACCINATION</span>
              <span className="text-2xl font-black text-[#1B5E3C] block mt-1">
                {activeReport.metrics.vaccination_coverage_pct}%
              </span>
            </div>

            <div className="p-3 border border-stone-200 rounded-[2px] bg-white">
              <span className="text-[10px] text-stone-500 uppercase block font-bold">TREND</span>
              <span className="text-sm font-black text-stone-800 block mt-2">
                {activeReport.metrics.trend}
              </span>
            </div>
          </div>

          {/* Epidemiological Findings & Priority Sectors */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#102A43] border-b border-stone-200 pb-1">
              EPIDEMIOLOGICAL SUMMARY &amp; PRIORITY SECTORS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-[2px] space-y-1">
                <span className="font-mono font-bold text-stone-700 block">PRIORITY GEOGRAPHIC SECTORS</span>
                <p className="text-stone-600">
                  Villages requiring immediate veterinary field inspection:
                </p>
                <div className="flex items-center gap-1.5 flex-wrap pt-1 font-mono">
                  {(activeReport.metrics.priority_villages || ['Rampur Khurd', 'Shivpur']).map((v: string) => (
                    <span key={v} className="bg-white border border-stone-300 px-2 py-0.5 rounded text-[#102A43] font-bold">
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-stone-50 border border-stone-200 rounded-[2px] space-y-1">
                <span className="font-mono font-bold text-stone-700 block">PREDOMINANT SYNDROMIC PATTERNS</span>
                <p className="text-stone-600">
                  Clinical manifestations frequently recorded in surveillance logs:
                </p>
                <div className="flex items-center gap-1.5 flex-wrap pt-1 font-mono">
                  {(activeReport.metrics.dominant_symptoms || ['Fever', 'Cough', 'Swelling']).map((s: string) => (
                    <span key={s} className="bg-white border border-stone-300 px-2 py-0.5 rounded text-stone-800">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Decision-Support Recommendations */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#102A43] border-b border-stone-200 pb-1">
              DECISION-SUPPORT BIOSECURITY RECOMMENDATIONS
            </h3>
            <div className="space-y-2 text-xs">
              {(activeReport.recommendations || []).map((rec: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 p-2.5 bg-[#FAF9F5] border border-stone-200 rounded-[2px]">
                  <span className="font-mono font-bold text-[#102A43]">{idx + 1}.</span>
                  <span className="text-stone-800">{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Legal / Surveillance Disclaimer */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-[2px] text-[10px] font-mono text-stone-500 leading-relaxed">
            <strong>NOTICE OF BIOSECURITY SURVEILLANCE GOVERNANCE:</strong> This bulletin has been automatically synthesized from live field sensor telemetry and veterinary case dossiers registered in the PashuRaksha platform. The contents serve as statistical early-warning and decision-support guidance for qualified veterinary personnel. It does not constitute automated disease certification without clinical laboratory confirmation.
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-stone-500 font-mono bg-white border border-stone-300">
          Select or compile a surveillance bulletin to view on-screen report.
        </div>
      )}

      {/* 4. Previous Bulletins Table */}
      <div className="bg-white border border-stone-300 rounded-[2px] shadow-xs print:hidden">
        <div className="p-3.5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#102A43]">
            GENERATED SURVEILLANCE BULLETINS REGISTRY ({reports.length})
          </h3>
          <span className="text-[10px] font-mono text-stone-500">AUDIT TRAIL PRESERVED</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-stone-100/70 text-stone-600 border-b border-stone-200 font-mono text-[11px]">
              <tr>
                <th className="py-2 px-3">Bulletin Title</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Reporting Window</th>
                <th className="py-2 px-3">Total Reports</th>
                <th className="py-2 px-3">High Risk</th>
                <th className="py-2 px-3">Compiled Date</th>
                <th className="py-2 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono">
              {reports.map((r) => (
                <tr
                  key={r.id}
                  className={`hover:bg-stone-50/80 transition-colors cursor-pointer ${
                    activeReport?.id === r.id ? 'bg-stone-50 font-semibold' : ''
                  }`}
                  onClick={() => setActiveReport(r)}
                >
                  <td className="py-2.5 px-3 font-sans font-bold text-[#102A43]">
                    {r.title}
                  </td>
                  <td className="py-2.5 px-3 text-stone-600 text-[11px]">
                    {r.report_type}
                  </td>
                  <td className="py-2.5 px-3 text-stone-500 text-[11px]">
                    {r.period_start} to {r.period_end}
                  </td>
                  <td className="py-2.5 px-3 text-stone-700">
                    {r.metrics.total_reports}
                  </td>
                  <td className="py-2.5 px-3 text-[#C62828] font-bold">
                    {r.metrics.high_risk_count}
                  </td>
                  <td className="py-2.5 px-3 text-stone-500 text-[11px]">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveReport(r)
                      }}
                      className="px-2 py-1 bg-[#102A43] text-white text-[10px] font-bold rounded-[1px] hover:bg-[#1B5E3C] cursor-pointer"
                    >
                      VIEW
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
      )}
    </div>
  )
}
