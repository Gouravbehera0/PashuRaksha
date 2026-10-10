// ============================================================
// PASHURAKSHA (पशुरक्षा) — DIAGNOSTIC LAB REFERRALS & RESULTS
// Stage 3: Diagnostic Laboratory Chain of Custody & Interpretation
// ============================================================

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FileBarChart,
  Search,
  CheckCircle2,
  Clock,
  FlaskConical,
  ExternalLink,
  RefreshCw,
  X,
  Stethoscope,
  Send,
  Building
} from 'lucide-react'
import { getAllLabReferrals, getAllSampleRequests, addLabResult } from '@/services/vetService'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import type { LabReferral, SampleRequest, LabResultStatus } from '@/types'

export function VetLabPage() {
  const [referrals, setReferrals] = useState<LabReferral[]>([])
  const [samples, setSamples] = useState<SampleRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'referrals' | 'samples'>('referrals')
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('All')
  const [selectedPriority, setSelectedPriority] = useState<string>('All')

  // Interpretation Modal State
  const [interpretingRef, setInterpretingRef] = useState<LabReferral | null>(null)
  const [interpResultStatus, setInterpResultStatus] = useState<LabResultStatus>('Negative')
  const [interpSummary, setInterpSummary] = useState('')
  const [interpPathogen, setInterpPathogen] = useState('')
  const [interpNotes, setInterpNotes] = useState('')
  const [savingInterp, setSavingInterp] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const refs = await getAllLabReferrals()
      const smps = await getAllSampleRequests()
      setReferrals(refs)
      setSamples(smps)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredReferrals = referrals.filter((r) => {
    const matchesStatus = selectedStatus === 'All' || r.status === selectedStatus
    const matchesPriority = selectedPriority === 'All' || r.priority === selectedPriority
    const s = search.toLowerCase()
    const matchesSearch =
      !search ||
      r.referral_number.toLowerCase().includes(s) ||
      r.lab_name.toLowerCase().includes(s) ||
      r.test_requested.toLowerCase().includes(s)

    return matchesStatus && matchesPriority && matchesSearch
  })

  const filteredSamples = samples.filter((s) => {
    const q = search.toLowerCase()
    return !search || s.sample_number.toLowerCase().includes(q) || s.sample_type.toLowerCase().includes(q)
  })

  const handleSaveInterpretation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!interpretingRef || !interpNotes.trim()) return

    setSavingInterp(true)
    try {
      await addLabResult({
        referral_id: interpretingRef.id,
        case_id: interpretingRef.case_id,
        lab_name: interpretingRef.lab_name,
        test_name: interpretingRef.test_requested,
        result_status: interpResultStatus,
        result_summary: interpSummary,
        pathogen_identified: interpPathogen,
        veterinarian_interpretation: interpNotes,
        veterinarian_name: 'Dr. Priya Sharma (Veterinary Officer)',
      })

      setInterpretingRef(null)
      setInterpNotes('')
      setInterpSummary('')
      setInterpPathogen('')
      await loadData()
    } finally {
      setSavingInterp(false)
    }
  }

  const getStatusBadge = (status: LabReferral['status']) => {
    switch (status) {
      case 'Completed':
      case 'Result Uploaded':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200">
            <CheckCircle2 size={12} />
            Result Uploaded
          </span>
        )
      case 'Testing Ongoing':
      case 'Received by Lab':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} />
            Testing In Progress
          </span>
        )
      case 'Sample Dispatched':
      case 'Referred':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Send size={12} />
            Dispatched
          </span>
        )
    }
  }

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Official Government Header */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs border-l-4 border-l-[#102A43] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#102A43] text-white px-2 py-0.5 rounded-[1px]">
              EPIDEMIOLOGICAL DIAGNOSTIC DESK
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              DDDL &middot; RDDL &middot; CDDL NETWORK
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#102A43] font-sans flex items-center gap-2">
            <FlaskConical size={20} className="text-[#102A43]" />
            Diagnostic Lab Referrals & Chain of Custody &middot; निदान प्रयोगशाला
          </h1>
          <p className="text-xs text-stone-600 mt-0.5 font-sans">
            Central cold-chain sample dispatch, laboratory assay validation, and clinical interpretation.
          </p>
        </div>

        {/* Tally Chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="px-3 py-1.5 rounded-[2px] bg-stone-100 border border-stone-300 text-stone-800 font-mono">
            <span className="font-bold text-sm">{referrals.length}</span> Total Referrals
          </div>
          <div className="px-3 py-1.5 rounded-[2px] bg-amber-50 border border-amber-200 text-amber-800 font-mono">
            <span className="font-bold text-sm">
              {referrals.filter((r) => r.status !== 'Result Uploaded' && r.status !== 'Completed').length}
            </span> Lab Pending
          </div>
          <button
            onClick={loadData}
            className="p-2 border border-stone-300 rounded-[2px] text-stone-600 hover:text-[#123C2A] hover:bg-stone-50"
            title="Refresh Referrals"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-300 flex items-center gap-2">
        <button
          onClick={() => setActiveTab('referrals')}
          className={`px-4 py-2 text-xs font-semibold tracking-wide border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'referrals'
              ? 'border-[#102A43] text-[#102A43] bg-stone-50'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <FileBarChart size={14} />
          Diagnostic Referrals ({referrals.length})
        </button>
        <button
          onClick={() => setActiveTab('samples')}
          className={`px-4 py-2 text-xs font-semibold tracking-wide border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'samples'
              ? 'border-[#102A43] text-[#102A43] bg-stone-50'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <FlaskConical size={14} />
          Field Sample Requests ({samples.length})
        </button>
      </div>

      {/* Search and Filter */}
      {activeTab === 'referrals' && (
        <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-stone-400" size={16} />
              <input
                type="text"
                placeholder="Search referral #, lab, test..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-[2px] focus:outline-none focus:border-[#102A43]"
              />
            </div>
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-[2px] focus:outline-none focus:border-[#102A43] bg-white"
              >
                <option value="All">All Referral Statuses</option>
                <option value="Sample Dispatched">Sample Dispatched</option>
                <option value="Received by Lab">Received by Lab</option>
                <option value="Testing Ongoing">Testing Ongoing</option>
                <option value="Result Uploaded">Result Uploaded</option>
              </select>
            </div>
            <div>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-[2px] focus:outline-none focus:border-[#102A43] bg-white"
              >
                <option value="All">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Referrals View */}
      {activeTab === 'referrals' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-stone-500 font-mono text-xs">
              Loading laboratory referrals...
            </div>
          ) : filteredReferrals.length === 0 ? (
            <div className="bg-white border border-stone-300 p-8 rounded-[2px] text-center text-stone-500">
              <FlaskConical size={32} className="mx-auto text-stone-300 mb-2" />
              <p className="text-sm font-semibold text-stone-700">No laboratory referrals found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReferrals.map((ref) => (
                <div
                  key={ref.id}
                  className="bg-white border border-stone-300 rounded-[2px] p-4 shadow-xs space-y-3 hover:border-stone-400 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm text-[#102A43]">
                        {ref.referral_number}
                      </span>
                      <PriorityBadge priority={ref.priority} />
                      {getStatusBadge(ref.status)}
                    </div>
                    <div className="text-xs text-stone-500 font-mono">
                      Date: {ref.referral_date} &middot; Ref by: {ref.requested_by}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-stone-500 uppercase font-mono text-[10px]">Destination Facility</div>
                      <div className="font-semibold text-stone-900 flex items-center gap-1.5 mt-0.5">
                        <Building size={14} className="text-[#102A43]" />
                        {ref.lab_name}
                      </div>
                    </div>
                    <div>
                      <div className="text-stone-500 uppercase font-mono text-[10px]">Diagnostic Test Requested</div>
                      <div className="font-semibold text-stone-900 mt-0.5">
                        {ref.test_requested}
                      </div>
                    </div>
                  </div>

                  {ref.notes && (
                    <div className="text-xs text-stone-600 bg-stone-50 p-2 rounded-[2px] border border-stone-200">
                      <strong>Cold Chain & Packaging Note:</strong> {ref.notes}
                    </div>
                  )}

                  {/* Lab Result & Clinical Interpretation Section */}
                  {ref.result ? (
                    <div className="p-3.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[2px] space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-[#16A34A]" />
                          <span className="text-xs font-bold text-stone-900">
                            Laboratory Test Result Verified
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            ref.result.result_status === 'Negative'
                              ? 'bg-green-100 text-green-800'
                              : ref.result.result_status === 'Positive'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ref.result.result_status}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-stone-500">
                          Result Date: {ref.result.result_date}
                        </span>
                      </div>

                      {ref.result.result_summary && (
                        <div className="text-xs text-stone-700">
                          <strong>Assay Summary:</strong> {ref.result.result_summary}
                        </div>
                      )}

                      {ref.result.pathogen_identified && (
                        <div className="text-xs text-stone-700 font-mono">
                          <strong>Pathogen/Strain:</strong> {ref.result.pathogen_identified}
                        </div>
                      )}

                      <div className="p-2.5 bg-white border border-stone-200 rounded-[2px] text-xs text-stone-800">
                        <div className="font-semibold text-[#102A43] flex items-center gap-1 mb-1">
                          <Stethoscope size={13} />
                          Veterinarian Clinical Interpretation (Not Automated AI):
                        </div>
                        <p className="italic text-stone-700">
                          "{ref.result.veterinarian_interpretation}"
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                      <span className="text-xs text-stone-500 italic">
                        Awaiting laboratory diagnostic report from {ref.lab_name}
                      </span>
                      <button
                        onClick={() => {
                          setInterpretingRef(ref)
                          setInterpResultStatus('Negative')
                          setInterpSummary('')
                          setInterpPathogen('')
                          setInterpNotes('')
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-[#102A43] text-white hover:bg-[#1B3A57] text-xs font-semibold cursor-pointer"
                      >
                        <Stethoscope size={13} />
                        Record Lab Result & Interpretation
                      </button>
                    </div>
                  )}

                  {/* Case Link */}
                  <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                    <span className="font-mono">Linked to Case ID: {ref.case_id}</span>
                    <Link
                      to={`/vet/cases/${ref.case_id}`}
                      className="text-[#102A43] hover:underline font-semibold flex items-center gap-1"
                    >
                      Open Case Workspace <ExternalLink size={11} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Field Sample Requests View */}
      {activeTab === 'samples' && (
        <div className="bg-white border border-stone-300 rounded-[2px] shadow-xs overflow-hidden">
          {filteredSamples.length === 0 ? (
            <div className="p-8 text-center text-stone-500 font-mono text-xs">
              No field sample collection requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#102A43] text-white font-mono uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Sample Number</th>
                    <th className="py-2.5 px-3">Sample Type</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Instructions</th>
                    <th className="py-2.5 px-3">Requested By</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {filteredSamples.map((s) => (
                    <tr key={s.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-[#102A43]">
                        {s.sample_number}
                      </td>
                      <td className="py-3 px-3 font-semibold text-stone-900">
                        {s.sample_type}
                      </td>
                      <td className="py-3 px-3">
                        <PriorityBadge priority={s.priority} />
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-stone-600 max-w-xs truncate">
                        {s.collection_instructions || 'Standard sterile protocol'}
                      </td>
                      <td className="py-3 px-3 text-stone-700">
                        {s.requested_by}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          to={`/vet/cases/${s.case_id}`}
                          className="text-[#102A43] hover:underline font-semibold"
                        >
                          View Case &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Record Lab Result & Veterinary Interpretation */}
      {interpretingRef && (
        <div className="fixed inset-0 bg-[#102A43]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-stone-300 rounded-[2px] max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#102A43] font-sans flex items-center gap-1.5">
                  <Stethoscope size={16} />
                  Record Lab Result & Interpretation
                </h3>
                <p className="text-[11px] text-stone-500 font-mono">
                  Referral: {interpretingRef.referral_number} &middot; {interpretingRef.lab_name}
                </p>
              </div>
              <button
                onClick={() => setInterpretingRef(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveInterpretation} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono uppercase text-stone-600 font-semibold mb-1">
                  Laboratory Test Result Status
                </label>
                <select
                  value={interpResultStatus}
                  onChange={(e) => setInterpResultStatus(e.target.value as LabResultStatus)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-[2px] focus:outline-none focus:border-[#102A43]"
                  required
                >
                  <option value="Negative">Negative (No pathogen detected)</option>
                  <option value="Positive">Positive (Pathogen detected)</option>
                  <option value="Inconclusive">Inconclusive (Repeat sample requested)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-stone-600 font-semibold mb-1">
                  Pathogen / Serotype Identified (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Trypanosoma evansi / Negative for Blood Parasites"
                  value={interpPathogen}
                  onChange={(e) => setInterpPathogen(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-[2px] focus:outline-none focus:border-[#102A43]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-stone-600 font-semibold mb-1">
                  Lab Findings Summary
                </label>
                <input
                  type="text"
                  placeholder="e.g. Microscopic smear clear of haemoprotozoa. Platelet count normal."
                  value={interpSummary}
                  onChange={(e) => setInterpSummary(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-[2px] focus:outline-none focus:border-[#102A43]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-stone-600 font-semibold mb-1">
                  Veterinarian Clinical Interpretation *
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter your clinical judgment, differential diagnosis conclusions, and next steps for field care..."
                  value={interpNotes}
                  onChange={(e) => setInterpNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-[2px] focus:outline-none focus:border-[#102A43]"
                  required
                />
                <p className="text-[10px] text-stone-500 mt-0.5">
                  The veterinarian is the sole clinical decision-maker. This note records your official clinical judgment.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setInterpretingRef(null)}
                  className="px-3 py-1.5 text-xs border border-stone-300 rounded-[2px] hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingInterp || !interpNotes.trim()}
                  className="px-4 py-1.5 text-xs bg-[#102A43] text-white rounded-[2px] hover:bg-[#1B3A57] font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {savingInterp ? 'Saving Interpretation...' : 'Save & Certify Result'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
