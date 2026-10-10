// ============================================================
// PASHURAKSHA (पशुरक्षा) — VETERINARIAN LIVESTOCK OWNERS DIRECTORY
// Stage 3: Farmer / Livestock Owner Directory & Herd Profiles
// ============================================================

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Search,
  Filter,
  Eye,
  MapPin,
  Phone,
  Heart,
  AlertTriangle,
  Folder,
  RefreshCw,
  ShieldCheck
} from 'lucide-react'
import { getAllFarmers } from '@/services/vetService'
import type { FarmerProfileView } from '@/types'

export function VetFarmersPage() {
  const [farmers, setFarmers] = useState<FarmerProfileView[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedVillage, setSelectedVillage] = useState('All')

  const loadFarmers = async () => {
    setLoading(true)
    try {
      const data = await getAllFarmers()
      setFarmers(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFarmers()
  }, [])

  const villages = ['All', ...Array.from(new Set(farmers.map((f) => f.village || 'Rampur Khurd')))]

  const filteredFarmers = farmers.filter((f) => {
    const matchesVillage = selectedVillage === 'All' || (f.village || 'Rampur Khurd') === selectedVillage
    const s = search.toLowerCase()
    const matchesSearch =
      !search ||
      f.full_name.toLowerCase().includes(s) ||
      (f.phone && f.phone.includes(s)) ||
      (f.village && f.village.toLowerCase().includes(s))

    return matchesVillage && matchesSearch
  })

  // Quick stats
  const totalHerds = farmers.reduce((acc, f) => acc + f.total_animals, 0)
  const activeCasesTotal = farmers.reduce((acc, f) => acc + f.active_cases_count, 0)

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Official Government Header */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs border-l-4 border-l-[#123C2A] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#123C2A] text-white px-2 py-0.5 rounded-[1px]">
              COMMUNITY ANIMAL HUSBANDRY CADRE
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              KISAN SURVEILLANCE & HERD REGISTRY
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#102A43] font-sans flex items-center gap-2">
            <Users size={20} className="text-[#1B5E3C]" />
            Livestock Owners & Farmers &middot; पशुपालक पंजीका
          </h1>
          <p className="text-xs text-stone-600 mt-0.5 font-sans">
            Jurisdiction: Sadar Veterinary Hospital &middot; District: Varanasi (Zone 4)
          </p>
        </div>

        {/* Quick Tally Chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="px-3 py-1.5 rounded-[2px] bg-stone-100 border border-stone-300 text-stone-800 font-mono">
            <span className="font-bold text-sm">{farmers.length}</span> Registered Farmers
          </div>
          <div className="px-3 py-1.5 rounded-[2px] bg-green-50 border border-green-200 text-green-800 font-mono">
            <span className="font-bold text-sm">{totalHerds}</span> Total Livestock Head
          </div>
          {activeCasesTotal > 0 && (
            <div className="px-3 py-1.5 rounded-[2px] bg-red-50 border border-red-200 text-red-800 font-mono">
              <span className="font-bold text-sm">{activeCasesTotal}</span> Active In-Herd Cases
            </div>
          )}
          <button
            onClick={loadFarmers}
            className="p-2 border border-stone-300 rounded-[2px] text-stone-600 hover:text-[#123C2A] hover:bg-stone-50"
            title="Refresh Roster"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-2.5 text-stone-400" size={16} />
            <input
              type="text"
              placeholder="Search by farmer name, phone number, village..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-[2px] focus:outline-none focus:border-[#123C2A]"
            />
          </div>

          {/* Village */}
          <div>
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-[2px] focus:outline-none focus:border-[#123C2A] bg-white"
            >
              {villages.map((v) => (
                <option key={v} value={v}>Village: {v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Applied filters notice */}
        <div className="flex items-center justify-between text-xs text-stone-500 pt-1 border-t border-stone-100">
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-stone-400" />
            <span>Showing <strong>{filteredFarmers.length}</strong> of {farmers.length} farmers</span>
          </div>
          {(selectedVillage !== 'All' || search) && (
            <button
              onClick={() => {
                setSelectedVillage('All')
                setSearch('')
              }}
              className="text-[#123C2A] hover:underline font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Farmers Grid / Table */}
      <div className="bg-white border border-stone-300 rounded-[2px] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-stone-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw size={24} className="animate-spin text-[#123C2A]" />
            <p className="text-xs font-mono">Loading district farmer registry...</p>
          </div>
        ) : filteredFarmers.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users size={32} className="mx-auto text-stone-300" />
            <p className="text-sm font-semibold text-stone-700">No farmers found</p>
            <p className="text-xs text-stone-500">Adjust the village filter or search term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#102A43] text-white font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Farmer Name</th>
                  <th className="py-2.5 px-3">Phone Contact</th>
                  <th className="py-2.5 px-3">Village / District</th>
                  <th className="py-2.5 px-3">Registered Herd</th>
                  <th className="py-2.5 px-3">Active Cases</th>
                  <th className="py-2.5 px-3">Vaccinations</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredFarmers.map((farmer) => (
                  <tr key={farmer.owner_id} className="hover:bg-stone-50 transition-colors">
                    {/* Name */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-stone-900 text-sm flex items-center gap-1.5">
                        <Users size={14} className="text-[#1B5E3C]" />
                        {farmer.full_name}
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono">
                        UID: {farmer.owner_id}
                      </span>
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 font-mono text-stone-700">
                        <Phone size={12} className="text-stone-400" />
                        <span>{farmer.phone || '+91 98000 00000'}</span>
                      </div>
                    </td>

                    {/* Village */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 text-stone-800">
                        <MapPin size={12} className="text-stone-400" />
                        <span>{farmer.village || 'Rampur Khurd'}</span>
                      </div>
                      <div className="text-[10px] text-stone-500">
                        District: {farmer.district || 'Varanasi'}
                      </div>
                    </td>

                    {/* Total Herd */}
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[2px] bg-stone-100 font-mono font-bold text-stone-800 border border-stone-200">
                        <Heart size={11} className="text-[#1B5E3C]" />
                        {farmer.total_animals} Animals
                      </span>
                    </td>

                    {/* Active Cases */}
                    <td className="py-3 px-3">
                      {farmer.active_cases_count > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-800 border border-red-200">
                          <AlertTriangle size={11} />
                          {farmer.active_cases_count} Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200">
                          <ShieldCheck size={11} />
                          Nil (Clear)
                        </span>
                      )}
                    </td>

                    {/* Vaccinations */}
                    <td className="py-3 px-3 font-mono text-stone-700">
                      {farmer.vaccinations_count} administered
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/vet/farmers/${farmer.owner_id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[2px] bg-[#123C2A] text-white hover:bg-[#1B5E3C] text-[11px] font-semibold transition-colors"
                        >
                          <Eye size={12} />
                          Herd Dossier
                        </Link>
                        {farmer.phone && (
                          <a
                            href={`tel:${farmer.phone.replace(/[^0-9+]/g, '')}`}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-[2px] border border-stone-300 text-stone-700 hover:bg-stone-100 text-[11px] transition-colors"
                            title="Call Farmer"
                          >
                            <Phone size={12} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Advisory Note */}
      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-[2px] text-xs text-amber-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Folder size={16} className="text-amber-800 shrink-0" />
          <span>
            Farmers with active cases require routine telephonic check-ins every 24–48 hours until full resolution is recorded.
          </span>
        </div>
        <Link
          to="/vet/cases"
          className="shrink-0 text-xs font-semibold text-amber-900 underline hover:text-[#123C2A]"
        >
          View Active Case Queue &rarr;
        </Link>
      </div>
    </div>
  )
}
