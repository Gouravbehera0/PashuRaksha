// ============================================================
// PASHURAKSHA (पशुरक्षा) — CENTRAL REPORTING DASHBOARD COMPONENT
// Stage 9: Multi-Role Statutory & Clinical Reporting Console
// Standard: GIGW Government Design Tokens / Responsive / Printable PDF
// "Detect Early. Prevent Outbreaks. Protect Livestock."
// ============================================================

import React, { useState, useEffect, useMemo } from 'react'
import {
  FileText,
  Printer,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Search,
  RotateCcw,
  AlertTriangle,
  Info,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
  Heart,
  Syringe,
  Crosshair,
  BarChart3
} from 'lucide-react'
import { compileReportDataset } from '@/services/reports/reportingEngine'
import { exportToCsv, exportToExcel, triggerPrintReport } from '@/services/reports/exportUtils'
import type { UserRole } from '@/types'
import type {
  ReportCategory,
  ReportFilterState,
  CompiledReportDataset,
} from '@/services/reports/reportingTypes'

interface ReportingDashboardProps {
  userRole: UserRole
  currentUserId?: string
  defaultCategory?: ReportCategory
}

const CATEGORY_TABS: { id: ReportCategory; label: string; icon: React.ReactNode; roles: UserRole[] }[] = [
  {
    id: 'livestock-health',
    label: 'Livestock Health Surveillance',
    icon: <Activity size={15} />,
    roles: ['admin', 'veterinarian'],
  },
  {
    id: 'disease-surveillance',
    label: 'Disease & Syndromic Signals',
    icon: <Shield size={15} />,
    roles: ['admin', 'veterinarian'],
  },
  {
    id: 'mortality',
    label: 'Mortality Analytics',
    icon: <Crosshair size={15} />,
    roles: ['admin', 'veterinarian'],
  },
  {
    id: 'vaccination',
    label: 'Vaccination Coverage',
    icon: <Syringe size={15} />,
    roles: ['admin', 'veterinarian'],
  },
  {
    id: 'outbreaks',
    label: 'Outbreak Investigations',
    icon: <AlertTriangle size={15} />,
    roles: ['admin', 'veterinarian'],
  },
  {
    id: 'veterinary-performance',
    label: 'Veterinary Caseload & Workload',
    icon: <BarChart3 size={15} />,
    roles: ['admin', 'veterinarian'],
  },
  {
    id: 'data-quality',
    label: 'Data Quality & Registry Audit',
    icon: <CheckCircle2 size={15} />,
    roles: ['admin', 'veterinarian'],
  },
  {
    id: 'farmer-herd-dossier',
    label: 'Livestock Health Dossier',
    icon: <Heart size={15} />,
    roles: ['farmer'],
  },
]

export function ReportingDashboard({
  userRole,
  currentUserId,
  defaultCategory,
}: ReportingDashboardProps) {
  // Available tabs for the current role
  const availableTabs = useMemo(() => {
    return CATEGORY_TABS.filter((t) => t.roles.includes(userRole))
  }, [userRole])

  const initialCat = defaultCategory || availableTabs[0]?.id || 'livestock-health'

  // Filter State
  const [filters, setFilters] = useState<ReportFilterState>({
    category: initialCat,
    dateRange: '30d',
    district: 'All',
    village: 'All',
    species: 'All',
    caseStatus: 'All',
    riskLevel: 'All',
    searchQuery: '',
    ownerId: userRole === 'farmer' ? currentUserId || 'demo-farmer' : undefined,
  })

  // Data & Execution State
  const [dataset, setDataset] = useState<CompiledReportDataset | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 12

  // Fetch / Compile Report
  const loadReport = async () => {
    try {
      setLoading(true)
      const compiled = await compileReportDataset(filters, userRole, currentUserId)
      setDataset(compiled)
      setCurrentPage(1)
    } catch (err) {
      console.error('[ReportingDashboard] Compilation failed:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadReport()
  }, [filters.category, filters.dateRange, filters.district, filters.village, filters.species, filters.caseStatus, filters.riskLevel])

  const handleRefresh = () => {
    setRefreshing(true)
    loadReport()
  }

  // Row filtering by search query
  const filteredRows = useMemo(() => {
    if (!dataset) return []
    if (!filters.searchQuery.trim()) return dataset.rows
    const q = filters.searchQuery.toLowerCase().trim()
    return dataset.rows.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(q))
    )
  }, [dataset, filters.searchQuery])

  // Pagination slicing
  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, currentPage, pageSize])

  // Reset Filters
  const handleResetFilters = () => {
    setFilters((prev) => ({
      ...prev,
      dateRange: '30d',
      district: 'All',
      village: 'All',
      species: 'All',
      caseStatus: 'All',
      riskLevel: 'All',
      searchQuery: '',
    }))
  }

  return (
    <div className="space-y-5 font-sans">
      {/* ── 1. OFFICIAL STATUTORY REPORT HEADER ── */}
      <div className="bg-white border border-stone-300 p-4 sm:p-5 rounded-[2px] shadow-xs border-l-4 border-l-[#102A43] flex flex-col md:flex-row md:items-center justify-between gap-4 print:border-none print:p-0">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#102A43] text-white px-2 py-0.5 rounded-[1px]">
              EPIDEMIOLOGICAL REPORTING DESK
            </span>
            <span className="text-[10px] font-mono text-stone-500 uppercase">
              GOVERNMENT OF INDIA &middot; PASHURAKSHA SURVEILLANCE
            </span>
            {dataset && (
              <span className="text-[10px] font-mono bg-stone-100 text-stone-700 px-1.5 py-0.5 border border-stone-200">
                DOC ID: {dataset.documentId}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#102A43] leading-tight">
            {dataset?.reportTitle || 'Livestock Health Reports & Analytics'}
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            {dataset?.reportSubtitle || 'Official statutory epidemiological summary and clinical returns.'}
          </p>
        </div>

        {/* Export & Print Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap print:hidden">
          <button
            type="button"
            onClick={triggerPrintReport}
            className="px-3 py-2 bg-white hover:bg-stone-50 text-[#102A43] border border-stone-300 text-xs font-mono font-bold rounded-[2px] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Open Printable PDF View"
          >
            <Printer size={13} className="text-[#1B5E3C]" />
            <span>PRINT / PDF</span>
          </button>

          <button
            type="button"
            onClick={() => dataset && exportToCsv(dataset)}
            className="px-3 py-2 bg-white hover:bg-stone-50 text-[#102A43] border border-stone-300 text-xs font-mono font-bold rounded-[2px] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Download RFC-4180 Sanitized CSV"
          >
            <Download size={13} className="text-[#123C2A]" />
            <span>EXPORT CSV</span>
          </button>

          <button
            type="button"
            onClick={() => dataset && exportToExcel(dataset)}
            className="px-3.5 py-2 bg-[#1B5E3C] hover:bg-[#123C2A] text-white text-xs font-mono font-bold rounded-[2px] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Download Spreadsheet Excel Format"
          >
            <FileSpreadsheet size={13} />
            <span>EXPORT EXCEL</span>
          </button>
        </div>
      </div>

      {/* ── 2. REPORT CATEGORY SELECTOR TABS ── */}
      {availableTabs.length > 1 && (
        <div className="flex items-center gap-1 overflow-x-auto border-b border-stone-300 pb-px print:hidden">
          {availableTabs.map((tab) => {
            const isActive = filters.category === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilters((f) => ({ ...f, category: tab.id }))}
                className={`px-3 py-2 text-xs font-mono font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors border-t-2 ${
                  isActive
                    ? 'bg-white text-[#102A43] border-[#1B5E3C] border-l border-r border-stone-300 shadow-xs'
                    : 'text-stone-600 hover:text-[#102A43] border-transparent hover:bg-stone-100'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── 3. COMPOSABLE FILTER TOOLBAR ── */}
      <div className="bg-[#FAF9F5] border border-stone-300 p-3 rounded-[2px] text-xs font-sans print:hidden space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <Search size={13} className="absolute left-2.5 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search by case #, tag, village, symptom..."
              value={filters.searchQuery}
              onChange={(e) => setFilters((f) => ({ ...f, searchQuery: e.target.value }))}
              className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-stone-300 text-xs focus:outline-none focus:border-[#1B5E3C]"
            />
          </div>

          {/* Date Window */}
          <div className="flex items-center gap-1.5 bg-white border border-stone-300 px-2 py-1">
            <Calendar size={12} className="text-stone-400" />
            <span className="text-[10px] font-mono text-stone-500 uppercase font-bold">Window:</span>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters((f) => ({ ...f, dateRange: e.target.value as any }))}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="7d">Past 7 Days</option>
              <option value="30d">Past 30 Days</option>
              <option value="90d">Past Quarter (90 Days)</option>
              <option value="year">Past 1 Year</option>
              <option value="all">All Historical</option>
            </select>
          </div>

          {/* District Filter (Disabled for farmer) */}
          {!userRole.includes('farmer') && (
            <div className="flex items-center gap-1.5 bg-white border border-stone-300 px-2 py-1">
              <span className="text-[10px] font-mono text-stone-500 uppercase font-bold">District:</span>
              <select
                value={filters.district}
                onChange={(e) => setFilters((f) => ({ ...f, district: e.target.value, village: 'All' }))}
                className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All">All Districts</option>
                <option value="Varanasi">Varanasi</option>
                <option value="Mirzapur">Mirzapur</option>
                <option value="Bhadohi">Bhadohi</option>
              </select>
            </div>
          )}

          {/* Village Filter */}
          {!userRole.includes('farmer') && (
            <div className="flex items-center gap-1.5 bg-white border border-stone-300 px-2 py-1">
              <span className="text-[10px] font-mono text-stone-500 uppercase font-bold">Village:</span>
              <select
                value={filters.village}
                onChange={(e) => setFilters((f) => ({ ...f, village: e.target.value }))}
                className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All">All Villages</option>
                <option value="Rampur Khurd">Rampur Khurd</option>
                <option value="Shivpur">Shivpur</option>
                <option value="Chiraigaon">Chiraigaon</option>
                <option value="Cholapur">Cholapur</option>
                <option value="Mirzapur Sadar">Mirzapur Sadar</option>
                <option value="Bhadohi Rural">Bhadohi Rural</option>
              </select>
            </div>
          )}

          {/* Species Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-stone-300 px-2 py-1">
            <span className="text-[10px] font-mono text-stone-500 uppercase font-bold">Species:</span>
            <select
              value={filters.species}
              onChange={(e) => setFilters((f) => ({ ...f, species: e.target.value as any }))}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All">All Species</option>
              <option value="Cow">Cattle / Cow</option>
              <option value="Buffalo">Buffalo</option>
              <option value="Goat">Caprine / Goat</option>
              <option value="Sheep">Ovine / Sheep</option>
              <option value="Poultry">Poultry</option>
            </select>
          </div>

          {/* Reset Filters & Refresh */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-mono text-[11px] font-bold rounded-[2px] transition-colors flex items-center gap-1"
            >
              <RotateCcw size={11} />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1.5 bg-[#1B5E3C] hover:bg-[#123C2A] text-white rounded-[2px] transition-colors"
              title="Refresh Dataset"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. EXECUTIVE SUMMARY METRICS BANNER ── */}
      {dataset && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="bg-white border border-stone-300 p-3 rounded-[2px] shadow-xs">
            <div className="text-[10px] font-mono uppercase text-stone-500 font-bold">
              Total Symptom Reports
            </div>
            <div className="text-xl font-bold font-mono text-[#102A43] mt-1">
              {dataset.summary.totalSymptomReports}
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5">Farmer Submissions</div>
          </div>

          <div className="bg-white border border-stone-300 p-3 rounded-[2px] shadow-xs">
            <div className="text-[10px] font-mono uppercase text-stone-500 font-bold">
              Unique Livestock
            </div>
            <div className="text-xl font-bold font-mono text-[#1B5E3C] mt-1">
              {dataset.summary.totalUniqueAnimals}
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5">Distinct Tags In Scope</div>
          </div>

          <div className="bg-white border border-stone-300 p-3 rounded-[2px] shadow-xs">
            <div className="text-[10px] font-mono uppercase text-stone-500 font-bold">
              Veterinary Cases
            </div>
            <div className="text-xl font-bold font-mono text-[#102A43] mt-1">
              {dataset.summary.totalVeterinaryCases}
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5">
              {dataset.summary.activeCasesCount} active &bull; {dataset.summary.resolvedCasesCount} resolved
            </div>
          </div>

          <div className="bg-white border border-stone-300 p-3 rounded-[2px] shadow-xs">
            <div className="text-[10px] font-mono uppercase text-stone-500 font-bold">
              Recorded Mortalities
            </div>
            <div className="text-xl font-bold font-mono text-[#C62828] mt-1">
              {dataset.summary.mortalityEventsCount}
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5">Verified Deceased Events</div>
          </div>

          <div className="bg-white border border-stone-300 p-3 rounded-[2px] shadow-xs">
            <div className="text-[10px] font-mono uppercase text-stone-500 font-bold">
              Outbreak Clusters
            </div>
            <div className="text-xl font-bold font-mono text-[#E65100] mt-1">
              {dataset.summary.potentialOutbreakClustersCount}
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5">5 km Cordon Zones</div>
          </div>

          <div className="bg-white border border-stone-300 p-3 rounded-[2px] shadow-xs">
            <div className="text-[10px] font-mono uppercase text-stone-500 font-bold">
              Vaccination Logs
            </div>
            <div className="text-xl font-bold font-mono text-[#123C2A] mt-1">
              {dataset.summary.totalVaccinationRecords}
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5">Prophylactic Doses</div>
          </div>
        </div>
      )}

      {/* ── 5. INTERACTIVE DATA TABLE PREVIEW ── */}
      <div className="bg-white border border-stone-300 rounded-[2px] shadow-xs overflow-hidden">
        <div className="p-3 bg-[#FAF9F5] border-b border-stone-300 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-[#1B5E3C]" />
            <strong className="text-[#102A43]">TABLE PREVIEW &middot; {dataset?.category.toUpperCase()}</strong>
            <span className="text-stone-500">
              ({filteredRows.length} total records match filters)
            </span>
          </div>

          <div className="text-stone-600 text-[11px] print:hidden">
            Page {currentPage} of {totalPages}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-stone-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#1B5E3C] mb-2" />
            COMPILING STATUTORY DATASET...
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-600">
            <AlertTriangle className="w-6 h-6 text-[#E0A11A] mx-auto mb-2" />
            <div className="font-bold text-[#102A43]">No Epidemiological Records Found In Selected Scope</div>
            <p className="text-[11px] text-stone-500 mt-1">
              Adjust the date range, district, or species filter to view matching records.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-3 px-3 py-1 bg-stone-200 text-stone-800 text-xs font-mono font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#123C2A] text-white font-mono text-[11px]">
                  {dataset?.headers.map((h, idx) => (
                    <th key={idx} className="p-2.5 font-bold border-b border-[#123C2A]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {paginatedRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className={`hover:bg-stone-50 transition-colors ${
                      rIdx % 2 === 0 ? 'bg-white' : 'bg-[#FAF9F5]'
                    }`}
                  >
                    {Object.values(row).map((val, cIdx) => (
                      <td key={cIdx} className="p-2.5 text-stone-700 text-[11px] font-mono">
                        {typeof val === 'string' && val.includes('CRITICAL') ? (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-800 font-bold border border-red-300 rounded-[1px]">
                            {val}
                          </span>
                        ) : typeof val === 'string' && val.includes('HIGH') ? (
                          <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 font-bold border border-orange-300 rounded-[1px]">
                            {val}
                          </span>
                        ) : typeof val === 'string' && val === 'OVERDUE' ? (
                          <span className="px-1.5 py-0.5 bg-red-50 text-red-700 font-bold border border-red-200">
                            OVERDUE
                          </span>
                        ) : (
                          String(val ?? '—')
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Pagination */}
        {totalPages > 1 && (
          <div className="p-3 bg-[#FAF9F5] border-t border-stone-300 flex items-center justify-between text-xs font-mono print:hidden">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft size={13} />
              Previous
            </button>

            <span className="text-stone-600">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length}
            </span>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 disabled:opacity-40 flex items-center gap-1"
            >
              Next
              <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>

      {/* ── 6. DATA LIMITATIONS & METHODOLOGY NOTICE ── */}
      {dataset && (
        <div className="bg-[#FAF9F5] border border-stone-300 p-4 rounded-[2px] text-xs font-sans space-y-2">
          <div className="flex items-center gap-2 text-[#102A43] font-mono font-bold text-xs uppercase border-b border-stone-200 pb-1">
            <Info size={14} className="text-[#1B5E3C]" />
            <span>Methodology, Denominators &amp; Statutory Limitations</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-stone-700">
            <div>
              <strong className="block text-stone-900 mb-1">Data Limitations:</strong>
              <ul className="list-disc list-inside space-y-0.5 text-stone-600">
                {dataset.dataLimitations.map((lim, idx) => (
                  <li key={idx}>{lim}</li>
                ))}
              </ul>
            </div>

            <div>
              <strong className="block text-stone-900 mb-1">Calculation Methodology:</strong>
              <ul className="list-disc list-inside space-y-0.5 text-stone-600">
                {dataset.methodologyNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="text-[10px] text-stone-500 pt-2 border-t border-stone-200 font-mono">
            Notice: Generated under Department of Animal Husbandry &amp; Dairying National Guidelines &middot;
            Confidentiality preserved: Smallholder phone numbers and private household coordinates masked.
          </div>
        </div>
      )}
    </div>
  )
}
