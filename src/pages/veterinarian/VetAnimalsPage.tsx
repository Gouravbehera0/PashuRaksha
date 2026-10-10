// ============================================================
// PASHURAKSHA (पशुरक्षा) — VETERINARY LIVESTOCK REGISTRY
// Stage 3: District Livestock Health Records for Veterinarians
// ============================================================

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Heart,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Tag,
  Calendar,
  RefreshCw,
  FileText
} from 'lucide-react'
import { getAllDistrictAnimals } from '@/services/vetService'
import type { Animal, AnimalType, AnimalHealthStatus } from '@/types'

const speciesOptions: (AnimalType | 'All')[] = ['All', 'Cow', 'Buffalo', 'Goat', 'Sheep', 'Poultry', 'Other']
const statusOptions: (AnimalHealthStatus | 'All')[] = ['All', 'Healthy', 'Under Observation', 'High Risk', 'Critical']

export function VetAnimalsPage() {
  const [animals, setAnimals] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedSpecies, setSelectedSpecies] = useState<AnimalType | 'All'>('All')
  const [selectedStatus, setSelectedStatus] = useState<AnimalHealthStatus | 'All'>('All')
  const [selectedVillage, setSelectedVillage] = useState('All')

  const loadAnimals = async () => {
    setLoading(true)
    try {
      const data = await getAllDistrictAnimals()
      setAnimals(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnimals()
  }, [])

  const villages = ['All', ...Array.from(new Set(animals.map((a) => a.village || 'Rampur Khurd')))]

  const filteredAnimals = animals.filter((animal) => {
    const matchesSpecies = selectedSpecies === 'All' || animal.animal_type === selectedSpecies
    const matchesStatus = selectedStatus === 'All' || animal.health_status === selectedStatus
    const matchesVillage = selectedVillage === 'All' || (animal.village || 'Rampur Khurd') === selectedVillage
    const s = search.toLowerCase()
    const matchesSearch =
      !search ||
      animal.animal_tag.toLowerCase().includes(s) ||
      animal.breed?.toLowerCase().includes(s) ||
      animal.village?.toLowerCase().includes(s) ||
      animal.animal_type.toLowerCase().includes(s)

    return matchesSpecies && matchesStatus && matchesVillage && matchesSearch
  })

  // Quick tally
  const highRiskCount = animals.filter((a) => a.health_status === 'High Risk' || a.health_status === 'Critical').length
  const observationCount = animals.filter((a) => a.health_status === 'Under Observation').length
  const healthyCount = animals.filter((a) => a.health_status === 'Healthy').length

  const getStatusBadge = (status: AnimalHealthStatus) => {
    switch (status) {
      case 'Healthy':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]">
            <CheckCircle2 size={12} />
            Healthy
          </span>
        )
      case 'Under Observation':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FFF8E1] text-[#E0A11A] border border-[#FFE082]">
            <Clock size={12} />
            Observation
          </span>
        )
      case 'High Risk':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FFEBEE] text-[#C62828] border border-[#EF9A9A]">
            <AlertTriangle size={12} />
            High Risk
          </span>
        )
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#EDE7F6] text-[#512DA8] border border-[#D1C4E9]">
            <AlertTriangle size={12} />
            Critical
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Official Government Header */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs border-l-4 border-l-[#123C2A] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#123C2A] text-white px-2 py-0.5 rounded-[1px]">
              DISTRICT LIVESTOCK DOSSIERS
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              INAPH &middot; BHARAT PASHUDHAN COMPLIANT
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#102A43] font-sans flex items-center gap-2">
            <Heart size={20} className="text-[#1B5E3C]" />
            Livestock Health Records &middot; पशु स्वास्थ्य पंजीका
          </h1>
          <p className="text-xs text-stone-600 mt-0.5 font-sans">
            Jurisdiction: Sadar Veterinary Hospital &middot; District: Varanasi (Zone 4)
          </p>
        </div>

        {/* Quick Tally Chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="px-3 py-1.5 rounded-[2px] bg-red-50 border border-red-200 text-red-800 font-mono">
            <span className="font-bold text-sm">{highRiskCount}</span> High Risk / Quarantine
          </div>
          <div className="px-3 py-1.5 rounded-[2px] bg-amber-50 border border-amber-200 text-amber-800 font-mono">
            <span className="font-bold text-sm">{observationCount}</span> Observation
          </div>
          <div className="px-3 py-1.5 rounded-[2px] bg-green-50 border border-green-200 text-green-800 font-mono">
            <span className="font-bold text-sm">{healthyCount}</span> Healthy
          </div>
          <button
            onClick={loadAnimals}
            className="p-2 border border-stone-300 rounded-[2px] text-stone-600 hover:text-[#123C2A] hover:bg-stone-50"
            title="Refresh Registry"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-stone-400" size={16} />
            <input
              type="text"
              placeholder="Search by tag, breed, village..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-[2px] focus:outline-none focus:border-[#123C2A]"
            />
          </div>

          {/* Species */}
          <div>
            <select
              value={selectedSpecies}
              onChange={(e) => setSelectedSpecies(e.target.value as AnimalType | 'All')}
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-[2px] focus:outline-none focus:border-[#123C2A] bg-white"
            >
              <option value="All">All Species (प्रजाति)</option>
              {speciesOptions.filter((s) => s !== 'All').map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Health Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as AnimalHealthStatus | 'All')}
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-[2px] focus:outline-none focus:border-[#123C2A] bg-white"
            >
              <option value="All">All Health Statuses (स्वास्थ्य स्थिति)</option>
              {statusOptions.filter((s) => s !== 'All').map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
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
            <span>Showing <strong>{filteredAnimals.length}</strong> of {animals.length} animals</span>
          </div>
          {(selectedSpecies !== 'All' || selectedStatus !== 'All' || selectedVillage !== 'All' || search) && (
            <button
              onClick={() => {
                setSelectedSpecies('All')
                setSelectedStatus('All')
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

      {/* Livestock Table */}
      <div className="bg-white border border-stone-300 rounded-[2px] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-stone-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw size={24} className="animate-spin text-[#123C2A]" />
            <p className="text-xs font-mono">Loading district livestock dossiers...</p>
          </div>
        ) : filteredAnimals.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Heart size={32} className="mx-auto text-stone-300" />
            <p className="text-sm font-semibold text-stone-700">No livestock records matching criteria</p>
            <p className="text-xs text-stone-500">Adjust the species, status, or search query above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#102A43] text-white font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Ear Tag / ID</th>
                  <th className="py-2.5 px-3">Species & Breed</th>
                  <th className="py-2.5 px-3">Age / Gender</th>
                  <th className="py-2.5 px-3">Village / Location</th>
                  <th className="py-2.5 px-3">Current Health</th>
                  <th className="py-2.5 px-3">Registered Date</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredAnimals.map((animal) => (
                  <tr key={animal.id} className="hover:bg-stone-50 transition-colors">
                    {/* Tag */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-[#102A43]">
                        <Tag size={13} className="text-[#1B5E3C]" />
                        <span>{animal.animal_tag}</span>
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono">ID: {animal.id.slice(0, 8)}</span>
                    </td>

                    {/* Species & Breed */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-stone-900">{animal.animal_type}</div>
                      <div className="text-[11px] text-stone-600">{animal.breed || 'Indig. Non-descript'}</div>
                    </td>

                    {/* Age / Gender */}
                    <td className="py-3 px-3">
                      <div className="text-stone-800 font-medium">{animal.age || 2} Years</div>
                      <div className="text-[11px] text-stone-500">{animal.gender}</div>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 text-stone-800">
                        <MapPin size={12} className="text-stone-400" />
                        <span>{animal.village || 'Rampur Khurd'}</span>
                      </div>
                      <div className="text-[10px] text-stone-500">District: {animal.district || 'Varanasi'}</div>
                    </td>

                    {/* Current Health */}
                    <td className="py-3 px-3">
                      {getStatusBadge(animal.health_status)}
                    </td>

                    {/* Registration Date */}
                    <td className="py-3 px-3 text-stone-600">
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <Calendar size={12} className="text-stone-400" />
                        {new Date(animal.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/vet/animals/${animal.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[2px] bg-[#123C2A] text-white hover:bg-[#1B5E3C] text-[11px] font-semibold transition-colors"
                        >
                          <Eye size={12} />
                          Clinical Dossier
                        </Link>
                        <Link
                          to={`/vet/cases?search=${animal.animal_tag}`}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-[2px] border border-stone-300 text-stone-700 hover:bg-stone-100 text-[11px] transition-colors"
                          title="View Linked Cases"
                        >
                          <FileText size={12} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notice Banner */}
      <div className="p-3.5 bg-[#E8F1F5] border border-[#102A43]/20 rounded-[2px] text-xs text-[#102A43] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-[#102A43] shrink-0" />
          <span>
            Animal dossiers adhere to <strong>Bharat Pashudhan</strong> tagging norms. Any change in health classification triggers immediate automated surveillance telemetry.
          </span>
        </div>
        <Link
          to="/vet/cases"
          className="shrink-0 text-xs font-semibold text-[#102A43] underline hover:text-[#123C2A]"
        >
          Active Clinical Cases &rarr;
        </Link>
      </div>
    </div>
  )
}
