import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Syringe, Calendar, Plus,
  RefreshCw, Tag, ArrowRight
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getVaccinations, addFarmerVaccinationRecord } from '@/services/vaccinationService'
import { getAnimals } from '@/services/animalService'
import type { Vaccination, Animal } from '@/types'

const NATIONAL_VACCINES = [
  'FMD (Foot and Mouth Disease) Vaccine',
  'Haemorrhagic Septicaemia (HS) Vaccine',
  'Black Quarter (BQ) Vaccine',
  'Brucellosis S19 / Strain 19',
  'Anthrax Spore Vaccine',
  'PPR (Peste des Petits Ruminants) Vaccine',
]

export function FarmerVaccinationsPage() {
  const { user } = useAuth()
  const ownerId = user?.id || 'demo-farmer'

  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [animals, setAnimals] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'due' | 'completed'>('all')

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [selectedAnimalId, setSelectedAnimalId] = useState('')
  const [vacName, setVacName] = useState(NATIONAL_VACCINES[0])
  const [vacDate, setVacDate] = useState(new Date().toISOString().split('T')[0])
  const [vacNextDate, setVacNextDate] = useState('')
  const [adminBy, setAdminBy] = useState('Block Veterinary Camp')
  const [notes, setNotes] = useState('Government free vaccination camp dose')
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [vData, aData] = await Promise.all([
        getVaccinations(ownerId),
        getAnimals(ownerId),
      ])
      setVaccinations(vData)
      setAnimals(aData)
      if (aData.length > 0) {
        setSelectedAnimalId(aData[0].id)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [ownerId])

  const nowStr = new Date().toISOString().split('T')[0]
  const fourteenDaysStr = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]

  const filtered = useMemo(() => {
    if (tab === 'due') {
      return vaccinations.filter(
        (v) => v.next_due_date && v.next_due_date <= fourteenDaysStr
      )
    }
    if (tab === 'completed') {
      return vaccinations.filter(
        (v) => !v.next_due_date || v.next_due_date > fourteenDaysStr
      )
    }
    return vaccinations
  }, [vaccinations, tab, fourteenDaysStr])

  const handleAddVaccine = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAnimalId) return

    try {
      setSaving(true)
      const created = await addFarmerVaccinationRecord({
        animal_id: selectedAnimalId,
        owner_id: ownerId,
        vaccine_name: vacName,
        vaccination_date: vacDate,
        next_due_date: vacNextDate || undefined,
        administered_by: adminBy,
        notes,
      })
      setVaccinations((prev) => [created, ...prev])
      setShowModal(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Breadcrumb & Navigation Shortcuts */}
      <div className="flex items-center justify-between text-xs font-mono text-stone-500">
        <div className="flex items-center gap-2">
          <Link to="/farmer/dashboard" className="hover:text-[#1B5E3C]">
            DASHBOARD
          </Link>
          <span>&gt;</span>
          <span className="text-[#102A43] font-bold">VACCINATION CALENDAR</span>
        </div>
        <Link
          to="/farmer/alerts"
          className="inline-flex items-center gap-1 text-[#1B5E3C] hover:underline font-bold"
        >
          <span>BIOSECURITY ALERTS</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* 1. Header */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs border-l-4 border-l-[#1B5E3C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#1B5E3C] text-white px-2 py-0.5 rounded-[1px]">
              NADCP COMPLIANT
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              NATIONAL LIVESTOCK VACCINATION CALENDAR
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#102A43] font-sans">
            टीकाकरण सारणी एवं इतिहास &middot; Vaccination Schedule &amp; History
          </h1>
          <p className="text-xs text-stone-600 mt-0.5 font-sans">
            Track mandatory national vaccination schedules for Foot &amp; Mouth Disease (FMD), HS, and BQ.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadData}
            className="p-2 border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 rounded-[2px] transition-colors cursor-pointer"
            title="Refresh Vaccinations"
            aria-label="Refresh Vaccinations"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1B5E3C] hover:bg-[#123C2A] text-white text-xs font-bold rounded-[2px] transition-colors font-mono cursor-pointer"
          >
            <Plus size={15} />
            <span>+ RECORD VACCINATION</span>
          </button>
        </div>
      </div>

      {/* 2. Mandatory Disease Advisory */}
      <div className="bg-[#FFFDF7] border border-[#E0A11A]/40 p-3.5 rounded-[2px] shadow-xs flex items-start gap-3">
        <Syringe size={18} className="text-[#8C5D00] shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-bold text-[#8C5D00] font-sans">
            National Livestock Disease Control Programme (NADCP) Advisory:
          </p>
          <p className="text-stone-700 mt-0.5">
            Bi-annual ring vaccination against Foot &amp; Mouth Disease (FMD) and Haemorrhagic Septicaemia (HS) is available free of cost through local Veterinary Dispensaries and Mobile Units.
          </p>
        </div>
      </div>

      {/* 3. Filter Tabs */}
      <div className="flex items-center gap-2 font-mono text-xs">
        <button
          type="button"
          onClick={() => setTab('all')}
          className={`px-3 py-1.5 rounded-[2px] font-bold border transition-colors cursor-pointer ${
            tab === 'all'
              ? 'bg-[#102A43] text-white border-[#102A43]'
              : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
          }`}
        >
          All Records ({vaccinations.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('due')}
          className={`px-3 py-1.5 rounded-[2px] font-bold border transition-colors cursor-pointer ${
            tab === 'due'
              ? 'bg-[#E0A11A] text-white border-[#E0A11A]'
              : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
          }`}
        >
          Due Soon / Overdue ({vaccinations.filter((v) => v.next_due_date && v.next_due_date <= fourteenDaysStr).length})
        </button>
        <button
          type="button"
          onClick={() => setTab('completed')}
          className={`px-3 py-1.5 rounded-[2px] font-bold border transition-colors cursor-pointer ${
            tab === 'completed'
              ? 'bg-[#2E7D32] text-white border-[#2E7D32]'
              : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
          }`}
        >
          Up To Date
        </button>
      </div>

      {/* 4. Vaccinations Cards / Table */}
      {loading ? (
        <div className="p-8 text-center text-xs text-stone-500 bg-white border border-stone-300">
          Loading vaccination calendar records...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-stone-300 p-8 rounded-[2px] text-center space-y-2">
          <Syringe size={24} className="text-stone-400 mx-auto" />
          <h3 className="text-sm font-bold text-[#102A43]">No Vaccination Records Found</h3>
          <p className="text-xs text-stone-500">
            No vaccines matching this filter have been logged.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((vac) => {
            const isDueSoon = vac.next_due_date && vac.next_due_date <= fourteenDaysStr
            const isOverdue = vac.next_due_date && vac.next_due_date < nowStr

            return (
              <div
                key={vac.id}
                className="bg-white border border-stone-300 rounded-[2px] p-4 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2">
                    <div className="flex items-center gap-2">
                      <Tag size={13} className="text-[#1B5E3C]" />
                      <span className="font-mono font-bold text-xs text-[#102A43]">
                        {vac.animal?.animal_tag || 'Animal'}
                      </span>
                      <span className="text-[10px] font-mono bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded">
                        {vac.animal?.animal_type || 'Livestock'}
                      </span>
                    </div>

                    {isOverdue ? (
                      <span className="text-[10px] font-mono font-bold bg-[#FDF0EE] text-[#C62828] border border-[#C62828]/30 px-1.5 py-0.5 rounded-[1px]">
                        OVERDUE
                      </span>
                    ) : isDueSoon ? (
                      <span className="text-[10px] font-mono font-bold bg-[#FFF8E6] text-[#8C5D00] border border-[#E0A11A]/40 px-1.5 py-0.5 rounded-[1px]">
                        DUE IN &lt; 14 DAYS
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold bg-[#EBF5EE] text-[#1B5E3C] border border-[#2E7D32]/30 px-1.5 py-0.5 rounded-[1px]">
                        CURRENT
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5">
                    <h3 className="text-sm font-bold text-[#102A43] font-sans">
                      {vac.vaccine_name}
                    </h3>
                    <p className="text-xs text-stone-600 mt-1">
                      Administered: <strong className="font-mono text-stone-800">{vac.vaccination_date}</strong>
                    </p>
                    {vac.next_due_date && (
                      <p className={`text-xs font-mono font-bold mt-0.5 flex items-center gap-1 ${
                        isOverdue ? 'text-[#C62828]' : isDueSoon ? 'text-[#8C5D00]' : 'text-stone-700'
                      }`}>
                        <Calendar size={12} />
                        Next Due: {vac.next_due_date}
                      </p>
                    )}
                    <p className="text-[11px] text-stone-500 mt-1">
                      Facility: {vac.administered_by || 'Veterinary Officer'}
                    </p>
                    {vac.notes && (
                      <p className="text-[11px] text-stone-600 italic mt-1">
                        Note: {vac.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-mono">
                  <Link
                    to={`/farmer/animals/${vac.animal_id}`}
                    className="text-[#1B5E3C] hover:underline font-bold"
                  >
                    VIEW ANIMAL PASSPORT &rarr;
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Record Vaccine Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#102A43]/60 backdrop-blur-xs z-50 flex items-center justify-center p-3">
          <div className="bg-white border border-stone-300 rounded-[2px] max-w-md w-full p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-[#102A43] font-sans border-b border-stone-200 pb-2">
              टीकाकरण प्रविष्टि दर्ज करें &middot; Record Vaccine Dose
            </h3>

            <form onSubmit={handleAddVaccine} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Select Animal (पशु चुनें)
                </label>
                <select
                  value={selectedAnimalId}
                  onChange={(e) => setSelectedAnimalId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-[2px] text-xs"
                  required
                >
                  {animals.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.animal_tag} - {a.animal_type} ({a.breed})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Vaccine Name (टीके का नाम)
                </label>
                <select
                  value={vacName}
                  onChange={(e) => setVacName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-[2px] text-xs"
                >
                  {NATIONAL_VACCINES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Date Administered
                  </label>
                  <input
                    type="date"
                    value={vacDate}
                    onChange={(e) => setVacDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-[2px] text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Next Due Date
                  </label>
                  <input
                    type="date"
                    value={vacNextDate}
                    onChange={(e) => setVacNextDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-[2px] text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Administering Agency / Doctor
                </label>
                <input
                  type="text"
                  value={adminBy}
                  onChange={(e) => setAdminBy(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-[2px] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Remarks / Camp Batch
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-[2px] text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 font-mono">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border border-stone-300 text-stone-700 text-xs font-bold rounded-[2px]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-[#1B5E3C] text-white text-xs font-bold rounded-[2px] disabled:opacity-50"
                >
                  {saving ? 'SAVING...' : 'SAVE VACCINE RECORD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
