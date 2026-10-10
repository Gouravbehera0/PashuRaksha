import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus, Search, Heart, ShieldAlert,
  MapPin, Tag, RefreshCw
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getAnimals } from '@/services/animalService'
import { HealthStatusPill } from '@/components/ui/HealthStatusPill'
import { AnimalIcon } from '@/components/ui/AnimalIcon'
import type { Animal } from '@/types'

export function FarmerAnimalsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [animals, setAnimals] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('All')
  const [selectedStatus, setSelectedStatus] = useState<string>('All')

  const ownerId = user?.id || 'demo-farmer'

  const loadAnimals = async () => {
    try {
      setLoading(true)
      const data = await getAnimals(ownerId)
      setAnimals(data)
    } catch (err) {
      console.error('Failed to load animals:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnimals()
  }, [ownerId])

  const filteredAnimals = useMemo(() => {
    return animals.filter((animal) => {
      // Search filter
      const matchesSearch =
        animal.animal_tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (animal.breed && animal.breed.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (animal.color && animal.color.toLowerCase().includes(searchQuery.toLowerCase()))

      // Type filter
      const matchesType =
        selectedType === 'All' || animal.animal_type.toLowerCase() === selectedType.toLowerCase()

      // Status filter
      const matchesStatus =
        selectedStatus === 'All' || animal.health_status.toLowerCase() === selectedStatus.toLowerCase()

      return matchesSearch && matchesType && matchesStatus
    })
  }, [animals, searchQuery, selectedType, selectedStatus])

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-5 max-w-6xl mx-auto">
      {/* 1. Page Header */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs border-l-4 border-l-[#1B5E3C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#1B5E3C] text-white px-2 py-0.5 rounded-[1px]">
              INAPH / NADRS-II REGISTRY
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              TOTAL REGISTERED: {animals.length}
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#102A43] font-sans">
            पंजीकृत पशुधन सूची &middot; Registered Livestock Inventory
          </h1>
          <p className="text-xs text-stone-600 mt-0.5 font-sans">
            Individual animal health records linked to RFID ear-tags and statutory vaccination schedules.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadAnimals}
            className="p-2 border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 rounded-[2px] transition-colors cursor-pointer"
            title="Refresh Registry"
            aria-label="Refresh Registry"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={() => navigate('/farmer/animals/add')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B5E3C] hover:bg-[#123C2A] text-white text-xs font-bold rounded-[2px] shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>+ पशु पंजीकृत करें &middot; REGISTER ANIMAL</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white border border-stone-300 p-3.5 rounded-[2px] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search input */}
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Ear-Tag (e.g. PR-COW-001) or breed (e.g. Gir, Murrah)..."
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-[2px] text-xs text-[#102A43] placeholder-stone-400 focus:bg-white focus:outline-none focus:border-[#1B5E3C] transition-colors"
            />
          </div>

          {/* Species selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-bold text-stone-600 whitespace-nowrap font-sans">
              Species:
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full sm:w-auto px-2.5 py-1.5 bg-white border border-stone-300 rounded-[2px] text-xs font-sans text-stone-800 focus:outline-none focus:border-[#1B5E3C]"
            >
              <option value="All">All Species (सभी प्रजातियां)</option>
              <option value="Cow">Cattle / Cow (गाय)</option>
              <option value="Buffalo">Buffalo (भैंस)</option>
              <option value="Goat">Goat (बकरी)</option>
              <option value="Sheep">Sheep (भेड़)</option>
              <option value="Poultry">Poultry (मुर्गी)</option>
              <option value="Other">Other (अन्य)</option>
            </select>
          </div>

          {/* Health status selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-bold text-stone-600 whitespace-nowrap font-sans">
              Health:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full sm:w-auto px-2.5 py-1.5 bg-white border border-stone-300 rounded-[2px] text-xs font-sans text-stone-800 focus:outline-none focus:border-[#1B5E3C]"
            >
              <option value="All">All Health Status</option>
              <option value="Healthy">Healthy (स्वस्थ)</option>
              <option value="Under Observation">Under Observation (निगरानी में)</option>
              <option value="High Risk">High Risk (उच्च जोखिम)</option>
              <option value="Critical">Critical (गंभीर)</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Tag Chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-stone-100 text-[11px]">
          <span className="text-stone-500 font-mono text-[10px] uppercase font-bold mr-1">
            QUICK FILTER:
          </span>
          {['All', 'Cow', 'Buffalo', 'Goat', 'Sheep'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              className={`px-2 py-0.5 rounded-[2px] font-mono font-medium transition-colors cursor-pointer ${
                selectedType.toLowerCase() === type.toLowerCase()
                  ? 'bg-[#1B5E3C] text-white font-bold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {type === 'All' ? 'All Livestock' : type}
            </button>
          ))}
          <span className="text-stone-300">|</span>
          {['High Risk', 'Under Observation', 'Healthy'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(status)}
              className={`px-2 py-0.5 rounded-[2px] font-mono font-medium transition-colors cursor-pointer ${
                selectedStatus.toLowerCase() === status.toLowerCase()
                  ? 'bg-[#C62828] text-white font-bold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Animals Grid */}
      {loading ? (
        <div className="bg-white border border-stone-300 p-12 text-center text-xs text-stone-500">
          Loading livestock registry records...
        </div>
      ) : filteredAnimals.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-stone-300 p-8 rounded-[2px] text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center mx-auto">
            <Heart size={22} />
          </div>
          <h3 className="text-sm font-bold text-[#102A43]">
            कोई पशु नहीं मिला &middot; No Animals Found
          </h3>
          <p className="text-xs text-stone-600 max-w-sm mx-auto">
            {searchQuery || selectedType !== 'All' || selectedStatus !== 'All'
              ? 'No registered animals match your current search and filter criteria. Try clearing filters.'
              : 'You have not registered any livestock yet. Click below to add your first animal.'}
          </p>
          {(searchQuery || selectedType !== 'All' || selectedStatus !== 'All') ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setSelectedType('All')
                setSelectedStatus('All')
              }}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-[2px] transition-colors cursor-pointer"
            >
              Clear All Filters
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/farmer/animals/add')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B5E3C] hover:bg-[#123C2A] text-white text-xs font-bold rounded-[2px] transition-colors cursor-pointer"
            >
              <Plus size={16} />
              <span>+ Register Animal</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAnimals.map((animal) => (
            <div
              key={animal.id}
              className="bg-white border border-stone-300 rounded-[2px] shadow-xs hover:border-[#1B5E3C] transition-all flex flex-col justify-between"
            >
              {/* Card Header: Tag & Health Pill */}
              <div className="p-3.5 border-b border-stone-100 bg-stone-50/70 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Tag size={13} className="text-[#1B5E3C]" />
                  <span className="font-mono font-bold text-xs text-[#102A43]">
                    {animal.animal_tag}
                  </span>
                </div>
                <HealthStatusPill status={animal.health_status} size="sm" />
              </div>

              {/* Card Body */}
              <div className="p-3.5 space-y-3 flex-1">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-[2px] bg-[#EBF5EE] border border-[#2E7D32]/20 flex items-center justify-center text-[#1B5E3C] shrink-0">
                    <AnimalIcon type={animal.animal_type} className="w-7 h-7 text-[#123C2A]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#102A43]">
                      {animal.animal_type} &middot; {animal.breed || 'Indigenous'}
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {animal.gender} &middot; {animal.age ? `${animal.age} Years` : 'Age N/A'}
                    </p>
                  </div>
                </div>

                {/* Attributes Table */}
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-stone-100 font-sans">
                  <div>
                    <span className="text-stone-500 block">Weight:</span>
                    <strong className="text-stone-800 font-mono">
                      {animal.weight ? `${animal.weight} kg` : 'Not recorded'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-stone-500 block">Color / Marks:</span>
                    <strong className="text-stone-800 truncate block">
                      {animal.color || 'Standard'}
                    </strong>
                  </div>
                  <div className="col-span-2 flex items-center gap-1 text-stone-600 mt-1">
                    <MapPin size={11} className="text-stone-400 shrink-0" />
                    <span className="truncate">
                      {animal.village || 'Rampur Khurd'}, {animal.district || 'Varanasi'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Action Links */}
              <div className="p-2.5 bg-stone-50 border-t border-stone-200 flex items-center gap-2">
                <Link
                  to={`/farmer/animals/${animal.id}`}
                  className="flex-1 py-1.5 px-2 bg-white hover:bg-stone-100 border border-stone-300 text-[#102A43] text-[11px] font-bold rounded-[2px] text-center transition-colors font-mono"
                >
                  HEALTH PASSPORT &rarr;
                </Link>
                <Link
                  to={`/farmer/report-health?animalId=${animal.id}`}
                  className="py-1.5 px-2.5 bg-[#C62828] hover:bg-[#A81D1D] text-white text-[11px] font-bold rounded-[2px] flex items-center gap-1 transition-colors font-mono shrink-0"
                  title="Report Clinical Symptoms for this Animal"
                >
                  <ShieldAlert size={12} />
                  <span>REPORT ISSUE</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
