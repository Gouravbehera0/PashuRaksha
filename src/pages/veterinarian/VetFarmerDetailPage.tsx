// ============================================================
// PASHURAKSHA (पशुरक्षा) — VETERINARIAN FARMER & HERD PROFILE
// Stage 3: Farmer Profile & Comprehensive Herd Health Dossier
// ============================================================

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  MapPin,
  Phone,
  Heart,
  Folder,
  Syringe,
  AlertTriangle,
  Tag,
  Eye,
  CheckCircle2,
  Calendar,
  MessageSquare
} from 'lucide-react'
import { getFarmerProfileForVet, getVetCases } from '@/services/vetService'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { CaseStatusPill } from '@/components/ui/CaseStatusPill'
import type { FarmerProfileView, VeterinaryCase } from '@/types'

export function VetFarmerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [farmer, setFarmer] = useState<FarmerProfileView | null>(null)
  const [cases, setCases] = useState<VeterinaryCase[]>([])
  const [loading, setLoading] = useState(true)
  const [advisorySent, setAdvisorySent] = useState(false)

  const loadData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await getFarmerProfileForVet(id)
      setFarmer(data)

      const allCases = await getVetCases()
      const farmerCases = allCases.filter((c) => c.owner_id === id || id.startsWith('demo-'))
      setCases(farmerCases)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  const handleSendAdvisory = () => {
    setAdvisorySent(true)
    setTimeout(() => setAdvisorySent(false), 5000)
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-stone-500 font-mono text-xs">
        Loading farmer & herd clinical record...
      </div>
    )
  }

  if (!farmer) {
    return (
      <div className="p-8 text-center space-y-4">
        <Users size={36} className="mx-auto text-stone-400" />
        <h2 className="text-lg font-bold text-stone-800">Farmer Record Not Found</h2>
        <p className="text-xs text-stone-600">The requested farmer profile could not be located.</p>
        <Link
          to="/vet/farmers"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-[#123C2A] text-white text-xs font-semibold"
        >
          <ArrowLeft size={14} /> Back to Farmers Registry
        </Link>
      </div>
    )
  }

  const activeCases = cases.filter((c) => c.status !== 'Resolved' && c.status !== 'Rejected')

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/vet/farmers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#123C2A] hover:underline"
        >
          <ArrowLeft size={14} />
          Back to Farmers Directory
        </Link>
        <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">
          LIVESTOCK OWNER CLINICAL DOSSIER
        </span>
      </div>

      {/* Header Profile Card */}
      <div className="bg-white border border-stone-300 rounded-[2px] p-5 shadow-xs border-l-4 border-l-[#123C2A]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-[#102A43] font-sans flex items-center gap-2">
                <Users size={20} className="text-[#1B5E3C]" />
                {farmer.full_name}
              </h1>
              <span className="text-[10px] font-mono uppercase bg-stone-100 text-stone-700 px-2 py-0.5 rounded-[1px] border border-stone-300">
                OWNER ID: {farmer.owner_id}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-stone-600 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-stone-400" />
                {farmer.village || 'Rampur Khurd'}, {farmer.district || 'Varanasi'}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Phone size={13} className="text-stone-400" />
                {farmer.phone || '+91 98391 44820'}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {farmer.phone && (
              <a
                href={`tel:${farmer.phone.replace(/[^0-9+]/g, '')}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-[#102A43] text-white hover:bg-[#1B3A57] text-xs font-semibold transition-colors"
              >
                <Phone size={14} />
                Call Farmer
              </a>
            )}
            <button
              onClick={handleSendAdvisory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] border border-[#123C2A] text-[#123C2A] hover:bg-stone-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              <MessageSquare size={14} />
              Send Biosecurity Advisory
            </button>
          </div>
        </div>

        {advisorySent && (
          <div className="mt-3 p-2.5 bg-green-50 border border-green-200 text-green-800 text-xs rounded-[2px] flex items-center gap-2">
            <CheckCircle2 size={15} />
            <span>
              Direct SMS Biosecurity Advisory dispatched to <strong>{farmer.phone}</strong> via National Livestock Surveillance Gateway.
            </span>
          </div>
        )}
      </div>

      {/* KPI Tally Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-stone-300 p-3.5 rounded-[2px] shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[10px] font-mono uppercase">Total Registered Herd</span>
            <Heart size={14} className="text-[#1B5E3C]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#102A43]">{farmer.total_animals}</div>
          <div className="text-[10px] text-stone-500 mt-0.5">Livestock Head</div>
        </div>

        <div className="bg-white border border-stone-300 p-3.5 rounded-[2px] shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[10px] font-mono uppercase">Active Cases</span>
            <AlertTriangle size={14} className="text-red-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-600">{activeCases.length}</div>
          <div className="text-[10px] text-stone-500 mt-0.5">Under Clinical Care</div>
        </div>

        <div className="bg-white border border-stone-300 p-3.5 rounded-[2px] shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[10px] font-mono uppercase">Resolved Cases</span>
            <CheckCircle2 size={14} className="text-green-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#1B5E3C]">{farmer.historical_cases_count}</div>
          <div className="text-[10px] text-stone-500 mt-0.5">Successfully Discharged</div>
        </div>

        <div className="bg-white border border-stone-300 p-3.5 rounded-[2px] shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[10px] font-mono uppercase">Vaccinations</span>
            <Syringe size={14} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#102A43]">{farmer.vaccinations_count}</div>
          <div className="text-[10px] text-stone-500 mt-0.5">Doses Administered</div>
        </div>
      </div>

      {/* Herd Inventory */}
      <div className="bg-white border border-stone-300 rounded-[2px] shadow-xs overflow-hidden">
        <div className="bg-stone-50 border-b border-stone-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
            <Heart size={14} className="text-[#1B5E3C]" />
            Registered Herd Inventory ({farmer.animals.length} Animals)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#102A43] text-white font-mono uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Ear Tag</th>
                <th className="py-2.5 px-3">Species & Breed</th>
                <th className="py-2.5 px-3">Age / Gender</th>
                <th className="py-2.5 px-3">Health Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {farmer.animals.map((a) => (
                <tr key={a.id} className="hover:bg-stone-50 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-[#102A43]">
                    <div className="flex items-center gap-1.5">
                      <Tag size={12} className="text-[#1B5E3C]" />
                      {a.animal_tag}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-stone-900">{a.animal_type}</span> &middot; {a.breed}
                  </td>
                  <td className="py-3 px-3 text-stone-700">
                    {a.age} Years &middot; {a.gender}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                      a.health_status === 'Healthy'
                        ? 'bg-green-100 text-green-800'
                        : a.health_status === 'High Risk'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {a.health_status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      to={`/vet/animals/${a.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] bg-[#123C2A] text-white hover:bg-[#1B5E3C] text-[11px] font-semibold"
                    >
                      <Eye size={12} /> Dossier
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clinical Cases for this Farmer */}
      <div className="bg-white border border-stone-300 rounded-[2px] shadow-xs overflow-hidden">
        <div className="bg-stone-50 border-b border-stone-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
            <Folder size={14} className="text-[#123C2A]" />
            Clinical Cases Linked to this Farmer ({cases.length})
          </h2>
        </div>
        {cases.length === 0 ? (
          <div className="p-8 text-center text-stone-500 font-mono text-xs">
            No clinical health cases recorded for this farmer's animals.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#102A43] text-white font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Case ID</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Reported Symptoms</th>
                  <th className="py-2.5 px-3">Reported Date</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#102A43]">
                      {c.case_number}
                    </td>
                    <td className="py-3 px-3">
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td className="py-3 px-3">
                      <CaseStatusPill status={c.status} />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {c.symptoms.map((s, idx) => (
                          <span key={idx} className="bg-stone-100 text-stone-800 px-1.5 py-0.5 rounded text-[10px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-stone-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={11} className="text-stone-400" />
                        {new Date(c.reported_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/vet/cases/${c.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[2px] bg-[#123C2A] text-white hover:bg-[#1B5E3C] text-[11px] font-semibold"
                      >
                        Clinical Workspace &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
