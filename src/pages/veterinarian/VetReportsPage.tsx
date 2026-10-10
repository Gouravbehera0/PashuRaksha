// ============================================================
// PASHURAKSHA (पशुरक्षा) — STATUTORY EPIDEMIOLOGICAL REPORTS
// Stage 3: NADRS-II Statutory Returns & District Health Reports
// ============================================================

import { useState } from 'react'
import {
  BarChart3,
  FileText,
  Printer,
  Building,
  CheckCircle2,
  Heart,
  TrendingDown,
  FileCheck
} from 'lucide-react'
import { ReportingDashboard } from '@/components/reports/ReportingDashboard'

export function VetReportsPage() {
  const [mode, setMode] = useState<'console' | 'nadrs'>('console')
  const [selectedMonth, setSelectedMonth] = useState('October 2026')
  const [selectedFormat, setSelectedFormat] = useState('NADRS-II Weekly Return')
  const [submitting, setSubmitting] = useState(false)
  const [submittedNotice, setSubmittedNotice] = useState(false)

  const handleExportPrint = () => {
    window.print()
  }

  const handleSubmitReturn = () => {
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setSubmittedNotice(true)
      setTimeout(() => setSubmittedNotice(false), 5000)
    }, 1000)
  }

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-6 max-w-7xl mx-auto print:p-0 print:max-w-none">
      {/* Official Government Header */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs border-l-4 border-l-[#123C2A] flex flex-col md:flex-row md:items-center justify-between gap-3 print:border-none">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#123C2A] text-white px-2 py-0.5 rounded-[1px]">
              EPIDEMIOLOGICAL REPORTING DESK
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              DISTRICT BIOSECURITY &middot; EPIDEMIOLOGICAL CADRE
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#102A43] font-sans flex items-center gap-2">
            <BarChart3 size={20} className="text-[#1B5E3C]" />
            Statutory Disease Reports & Returns &middot; सांख्यिकी रिपोर्ट
          </h1>
          <p className="text-xs text-stone-600 mt-0.5 font-sans">
            NADRS-II weekly & monthly returns, morbidity tracking, and block epidemiological summaries.
          </p>
        </div>

        {/* Export & Actions */}
        <div className="flex items-center gap-2 flex-wrap print:hidden">
          {mode === 'nadrs' && (
            <button
              onClick={handleExportPrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold cursor-pointer"
            >
              <Printer size={13} />
              Print / PDF
            </button>
          )}
          <button
            onClick={handleSubmitReturn}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[2px] bg-[#123C2A] text-white hover:bg-[#1B5E3C] text-xs font-semibold disabled:opacity-50 cursor-pointer"
          >
            <FileCheck size={14} />
            {submitting ? 'Submitting...' : 'Certify & Submit to CVO'}
          </button>
        </div>
      </div>

      {submittedNotice && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs rounded-[2px] flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>
            NADRS-II Epidemiological Return successfully certified by Dr. Priya Sharma and submitted to Chief Veterinary Officer (CVO) Varanasi.
          </span>
        </div>
      )}

      {/* Mode Navigation Tabs */}
      <div className="flex border-b border-stone-300 gap-2 print:hidden">
        <button
          type="button"
          onClick={() => setMode('console')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            mode === 'console'
              ? 'border-[#123C2A] text-[#123C2A] bg-white font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <BarChart3 size={14} />
          Clinical & Epidemiological Reports (All 7 Categories)
        </button>
        <button
          type="button"
          onClick={() => setMode('nadrs')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            mode === 'nadrs'
              ? 'border-[#123C2A] text-[#123C2A] bg-white font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <FileText size={14} />
          Statutory NADRS-II Return Document
        </button>
      </div>

      {mode === 'console' ? (
        <ReportingDashboard userRole="veterinarian" />
      ) : (
        <div className="space-y-6">
          {/* Control Selector Strip */}
          <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
            <div>
          <label className="block text-[10px] font-mono uppercase text-stone-500 font-semibold mb-1">
            Reporting Period
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-[2px] focus:outline-none focus:border-[#123C2A] bg-white"
          >
            <option value="October 2026">October 2026 (Active Surveillance Cycle)</option>
            <option value="September 2026">September 2026</option>
            <option value="August 2026">August 2026</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase text-stone-500 font-semibold mb-1">
            Statutory Format Standard
          </label>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-[2px] focus:outline-none focus:border-[#123C2A] bg-white"
          >
            <option value="NADRS-II Weekly Return">NADRS-II Weekly Return (National Standard)</option>
            <option value="Monthly Zonal Morbidity Return">Monthly Zonal Morbidity Return</option>
            <option value="Vaccination & Prophylaxis Audit">Vaccination & Prophylaxis Audit</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase text-stone-500 font-semibold mb-1">
            Jurisdiction Block
          </label>
          <div className="px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-[2px] font-semibold text-stone-800 flex items-center gap-1.5">
            <Building size={13} className="text-[#102A43]" />
            Sadar Block, Varanasi District (Zone 4)
          </div>
        </div>
      </div>

      {/* Official Printable Report Sheet */}
      <div className="bg-white border border-stone-300 p-6 rounded-[2px] shadow-xs space-y-6 font-sans">
        {/* Official Header Badge */}
        <div className="text-center border-b-2 border-[#123C2A] pb-4 space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-stone-500 tracking-widest">
            DEPARTMENT OF ANIMAL HUSBANDRY & DAIRYING &middot; GOVERNMENT OF UTTAR PRADESH
          </div>
          <h2 className="text-lg font-bold text-[#102A43] font-serif uppercase tracking-wide">
            FORM NADRS-II: WEEKLY LIVESTOCK DISEASE SURVEILLANCE RETURN
          </h2>
          <div className="text-xs text-stone-600 font-mono">
            Reporting Officer: Dr. Priya Sharma (VCI/UP/2019/8412) &middot; Sadar Veterinary Hospital &middot; Week Ending: 07-Oct-2026
          </div>
        </div>

        {/* High-Level Epidemiological Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-[2px]">
            <div className="text-[10px] font-mono uppercase text-stone-500">Morbidity (Reported Cases)</div>
            <div className="text-xl font-bold font-mono text-[#102A43] mt-1">3 Cases</div>
            <div className="text-[10px] text-green-700 flex items-center gap-0.5 mt-0.5 font-medium">
              <TrendingDown size={12} /> Low Incident Rate
            </div>
          </div>

          <div className="p-3 bg-stone-50 border border-stone-200 rounded-[2px]">
            <div className="text-[10px] font-mono uppercase text-stone-500">Mortality (Confirmed Deaths)</div>
            <div className="text-xl font-bold font-mono text-[#1B5E3C] mt-1">0 Deaths</div>
            <div className="text-[10px] text-green-700 font-medium mt-0.5">0.0% Case Fatality Rate</div>
          </div>

          <div className="p-3 bg-stone-50 border border-stone-200 rounded-[2px]">
            <div className="text-[10px] font-mono uppercase text-stone-500">Lab Diagnostic Referrals</div>
            <div className="text-xl font-bold font-mono text-[#102A43] mt-1">1 Dispatched</div>
            <div className="text-[10px] text-stone-600 font-medium mt-0.5">DDDL Varanasi Smear Clear</div>
          </div>

          <div className="p-3 bg-stone-50 border border-stone-200 rounded-[2px]">
            <div className="text-[10px] font-mono uppercase text-stone-500">Containment Ring Radius</div>
            <div className="text-xl font-bold font-mono text-red-700 mt-1">5 km Buffer</div>
            <div className="text-[10px] text-amber-700 font-medium mt-0.5">Rampur Khurd Cordon Active</div>
          </div>
        </div>

        {/* Species-wise Morbidity Breakdown Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
            <Heart size={14} className="text-[#123C2A]" />
            Table 1: Species-wise Clinical Incident Distribution
          </h3>
          <div className="border border-stone-300 rounded-[2px] overflow-hidden">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#102A43] text-white font-mono uppercase text-[10px]">
                  <th className="p-2.5">Species</th>
                  <th className="p-2.5">Susceptible Population</th>
                  <th className="p-2.5">New Clinical Cases</th>
                  <th className="p-2.5">Under Treatment</th>
                  <th className="p-2.5">Resolved / Discharged</th>
                  <th className="p-2.5">Case Fatality Rate (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                <tr className="hover:bg-stone-50">
                  <td className="p-2.5 font-semibold text-stone-900">Indigenous Cattle (Gir / Sahiwal)</td>
                  <td className="p-2.5 font-mono">1,420</td>
                  <td className="p-2.5 font-mono font-bold text-red-700">2</td>
                  <td className="p-2.5 font-mono">1</td>
                  <td className="p-2.5 font-mono text-green-700">1</td>
                  <td className="p-2.5 font-mono">0.0%</td>
                </tr>
                <tr className="hover:bg-stone-50">
                  <td className="p-2.5 font-semibold text-stone-900">Buffalo (Murrah / Nili-Ravi)</td>
                  <td className="p-2.5 font-mono">980</td>
                  <td className="p-2.5 font-mono font-bold text-amber-700">1</td>
                  <td className="p-2.5 font-mono">1</td>
                  <td className="p-2.5 font-mono text-green-700">0</td>
                  <td className="p-2.5 font-mono">0.0%</td>
                </tr>
                <tr className="hover:bg-stone-50">
                  <td className="p-2.5 font-semibold text-stone-900">Goat & Sheep</td>
                  <td className="p-2.5 font-mono">650</td>
                  <td className="p-2.5 font-mono text-stone-500">0</td>
                  <td className="p-2.5 font-mono text-stone-500">0</td>
                  <td className="p-2.5 font-mono text-stone-500">0</td>
                  <td className="p-2.5 font-mono">0.0%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Disease Surveillance & Diagnostic Classification */}
        <div className="space-y-2">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
            <FileText size={14} className="text-[#123C2A]" />
            Table 2: Syndromic Field Case Details (Current Return)
          </h3>
          <div className="border border-stone-300 rounded-[2px] overflow-hidden">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#102A43] text-white font-mono uppercase text-[10px]">
                  <th className="p-2.5">Case ID</th>
                  <th className="p-2.5">Village</th>
                  <th className="p-2.5">Animal ID</th>
                  <th className="p-2.5">Primary Clinical Presentation</th>
                  <th className="p-2.5">Diagnostic Action</th>
                  <th className="p-2.5">Current Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                <tr className="hover:bg-stone-50">
                  <td className="p-2.5 font-mono font-bold text-[#102A43]">PR-CASE-2048</td>
                  <td className="p-2.5">Rampur Khurd</td>
                  <td className="p-2.5 font-mono">PR-COW-003</td>
                  <td className="p-2.5">Pyrexia (104.2 F) & Mucopurulent Rhinitis</td>
                  <td className="p-2.5">Auscultation & Antipyretic Rx</td>
                  <td className="p-2.5 text-blue-700 font-semibold">Veterinary Review</td>
                </tr>
                <tr className="hover:bg-stone-50">
                  <td className="p-2.5 font-mono font-bold text-[#102A43]">PR-CASE-2049</td>
                  <td className="p-2.5">Rampur Khurd</td>
                  <td className="p-2.5 font-mono">PR-BUF-002</td>
                  <td className="p-2.5">Hock Joint Swelling & Lameness</td>
                  <td className="p-2.5">Blood Smear via DDDL Varanasi (Neg)</td>
                  <td className="p-2.5 text-amber-700 font-semibold">Sample Required</td>
                </tr>
                <tr className="hover:bg-stone-50">
                  <td className="p-2.5 font-mono font-bold text-[#102A43]">PR-CASE-2050</td>
                  <td className="p-2.5">Rampur Khurd</td>
                  <td className="p-2.5 font-mono">PR-COW-001</td>
                  <td className="p-2.5">Oral Vesicles & Salivation (FMD Susp.)</td>
                  <td className="p-2.5">MVU Triage Dispatched</td>
                  <td className="p-2.5 text-red-700 font-semibold">Critical / Reported</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Statutory Certification & Officer Signature Block */}
        <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <div className="text-[10px] font-mono text-stone-500 uppercase">Statutory Authority</div>
            <div className="font-bold text-[#102A43]">PashuRaksha Government Surveillance Engine</div>
            <div className="text-[10px] text-stone-500">Bharat Pashudhan Digital Health Integration</div>
          </div>

          <div className="text-right">
            <div className="font-mono text-stone-800 font-bold">Dr. Priya Sharma, B.V.Sc & A.H.</div>
            <div className="text-[11px] text-stone-600">Veterinary Officer &middot; Sadar Dispensary</div>
            <div className="text-[10px] font-mono text-stone-400">Reg: VCI/UP/2019/8412 &middot; Digital Sign Verified</div>
          </div>
        </div>
      </div>
      </div>
      )}
    </div>
  )
}
