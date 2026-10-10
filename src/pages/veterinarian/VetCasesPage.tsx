import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Folder, Search, ArrowRight, RefreshCw,
  MapPin, ArrowUpDown, ChevronLeft, ChevronRight
} from 'lucide-react'
import { getVetCases } from '@/services/vetService'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { CaseStatusPill } from '@/components/ui/CaseStatusPill'
import { AnimalIcon } from '@/components/ui/AnimalIcon'
import type { VeterinaryCase, VetCaseStatus, CasePriority } from '@/types'

const STATUS_OPTIONS: (VetCaseStatus | 'All')[] = [
  'All',
  'Reported',
  'Under Review',
  'Veterinary Review',
  'Sample Required',
  'Lab Pending',
  'Treatment',
  'Monitoring',
  'Resolved',
  'Rejected',
]

const PRIORITY_OPTIONS: (CasePriority | 'All')[] = [
  'All',
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
]

export function VetCasesPage() {
  const navigate = useNavigate()
  const [cases, setCases] = useState<VeterinaryCase[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [priorityFilter, setPriorityFilter] = useState<string>('All')
  const [speciesFilter, setSpeciesFilter] = useState<string>('All')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'priority'>('newest')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await getVetCases()
      setCases(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredCases = useMemo(() => {
    let result = cases.filter((c) => {
      const matchesSearch =
        c.case_number.toLowerCase().includes(search.toLowerCase()) ||
        c.village?.toLowerCase().includes(search.toLowerCase()) ||
        c.district?.toLowerCase().includes(search.toLowerCase()) ||
        c.symptoms.some((s) => s.toLowerCase().includes(search.toLowerCase())) ||
        (c.animal?.animal_tag && c.animal.animal_tag.toLowerCase().includes(search.toLowerCase()))

      const matchesStatus = statusFilter === 'All' || c.status === statusFilter
      const matchesPriority = priorityFilter === 'All' || c.priority === priorityFilter
      const matchesSpecies = speciesFilter === 'All' || c.animal?.animal_type.toLowerCase() === speciesFilter.toLowerCase()

      return matchesSearch && matchesStatus && matchesPriority && matchesSpecies
    })

    // Sorting
    result.sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      if (sortOrder === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      if (sortOrder === 'priority') {
        const pOrder: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
        return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0)
      }
      return 0
    })

    return result
  }, [cases, search, statusFilter, priorityFilter, speciesFilter, sortOrder])

  const totalPages = Math.ceil(filteredCases.length / pageSize) || 1
  const paginatedCases = filteredCases.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs border-l-4 border-l-[#102A43] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#102A43] text-white px-2 py-0.5 rounded-[1px]">
              NADRS CASE MANAGEMENT
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              TOTAL RECORDED: {cases.length}
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#102A43] font-sans">
            Clinical Case Management Log &middot; पशु स्वास्थ्य मामला पंजी
          </h1>
          <p className="text-xs text-stone-600 mt-0.5 font-sans">
            Structured clinical registry with triage history, diagnostic chain-of-custody, and prescription records.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadData}
            className="p-2 border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 rounded-[2px] transition-colors cursor-pointer"
            title="Refresh Registry"
            aria-label="Refresh Registry"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 2. Search & Multifaceted Filter Bar */}
      <div className="bg-white border border-stone-300 p-3.5 rounded-[2px] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Global Search */}
          <div className="relative lg:col-span-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Case ID, Tag, Village, or Symptoms..."
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-[2px] text-xs text-stone-800 focus:bg-white focus:outline-none focus:border-[#102A43]"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-2.5 py-2 bg-white border border-stone-300 rounded-[2px] text-xs text-stone-800 focus:outline-none focus:border-[#102A43] font-sans"
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  Status: {st}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-2.5 py-2 bg-white border border-stone-300 rounded-[2px] text-xs text-stone-800 focus:outline-none focus:border-[#102A43] font-sans"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  Priority: {p}
                </option>
              ))}
            </select>
          </div>

          {/* Species Filter */}
          <div>
            <select
              value={speciesFilter}
              onChange={(e) => {
                setSpeciesFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-2.5 py-2 bg-white border border-stone-300 rounded-[2px] text-xs text-stone-800 focus:outline-none focus:border-[#102A43] font-sans"
            >
              <option value="All">Species: All</option>
              <option value="Cow">Cow (गाय)</option>
              <option value="Buffalo">Buffalo (भैंस)</option>
              <option value="Goat">Goat (बकरी)</option>
              <option value="Sheep">Sheep (भेड़)</option>
              <option value="Poultry">Poultry (मुर्गी)</option>
            </select>
          </div>
        </div>

        {/* Sort & Quick Filter Pills */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 font-mono text-[11px] flex-wrap">
            <span className="text-stone-400 uppercase font-bold mr-1">QUICK STATUS:</span>
            {['All', 'Reported', 'Veterinary Review', 'Sample Required', 'Resolved'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st)
                  setCurrentPage(1)
                }}
                className={`px-2 py-0.5 rounded-[2px] border transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#102A43] text-white border-[#102A43] font-bold'
                    : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-stone-500">SORT:</span>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'priority' : sortOrder === 'priority' ? 'oldest' : 'newest')}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-[2px] text-stone-700 font-bold transition-colors cursor-pointer"
            >
              <ArrowUpDown size={12} />
              <span>{sortOrder === 'newest' ? 'Newest First' : sortOrder === 'priority' ? 'High Priority' : 'Oldest First'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Cases Registry Table */}
      <div className="bg-white border border-stone-300 rounded-[2px] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-stone-500">
            Loading case management log...
          </div>
        ) : paginatedCases.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Folder size={28} className="text-stone-400 mx-auto" />
            <h3 className="text-sm font-bold text-[#102A43]">No Cases Found</h3>
            <p className="text-xs text-stone-500">
              No livestock health cases match the current filter parameters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-stone-100 text-stone-600 border-b border-stone-200 font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-3.5">Case Number</th>
                  <th className="py-2.5 px-3.5">Animal Details</th>
                  <th className="py-2.5 px-3.5">Village &amp; District</th>
                  <th className="py-2.5 px-3.5">Clinical Symptoms</th>
                  <th className="py-2.5 px-3.5">Reported At</th>
                  <th className="py-2.5 px-3.5">Priority</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {paginatedCases.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/vet/cases/${c.id}`)}
                    className="hover:bg-stone-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3.5 font-mono font-bold text-[#102A43] whitespace-nowrap">
                      {c.case_number}
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap">
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

                    <td className="py-3 px-3.5 text-stone-700 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className="text-stone-400" />
                        {c.village || 'Rampur Khurd'}, {c.district || 'Varanasi'}
                      </span>
                    </td>

                    <td className="py-3 px-3.5 max-w-xs">
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

                    <td className="py-3 px-3.5 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                      {new Date(c.reported_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <PriorityBadge priority={c.priority} size="sm" />
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <CaseStatusPill status={c.status} size="sm" />
                    </td>

                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
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
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {filteredCases.length > 0 && (
          <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs font-mono text-stone-600">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} &ndash;{' '}
              {Math.min(currentPage * pageSize, filteredCases.length)} of {filteredCases.length} cases
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 border border-stone-300 rounded-[2px] disabled:opacity-40 hover:bg-stone-200 cursor-pointer"
                aria-label="Previous Page"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 font-bold">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 border border-stone-300 rounded-[2px] disabled:opacity-40 hover:bg-stone-200 cursor-pointer"
                aria-label="Next Page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
