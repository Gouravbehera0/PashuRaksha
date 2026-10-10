// ============================================================
// PASHURAKSHA (पशुरक्षा) — VETERINARY TREATMENT PROTOCOLS & RX
// Stage 3: Clinical Prescriptions & Antibiotic Stewardship Desk
// ============================================================

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Pill,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  RefreshCw,
  Plus,
  X,
  AlertTriangle,
  Heart
} from 'lucide-react'
import { getAllVeterinaryTreatments, createVeterinaryTreatment, getAllDistrictAnimals } from '@/services/vetService'
import type { Treatment, Animal } from '@/types'

export function VetTreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [animals, setAnimals] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState<'All' | 'Active' | 'Completed'>('All')

  // New Prescription Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAnimalId, setSelectedAnimalId] = useState('')
  const [condition, setCondition] = useState('')
  const [medicine, setMedicine] = useState('')
  const [dosage, setDosage] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const trts = await getAllVeterinaryTreatments()
      const anims = await getAllDistrictAnimals()
      setTreatments(trts)
      setAnimals(anims)
      if (anims.length > 0 && !selectedAnimalId) {
        setSelectedAnimalId(anims[0].id)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredTreatments = treatments.filter((t) => {
    const today = new Date().toISOString().split('T')[0]
    const isActive = !t.end_date || t.end_date >= today
    if (filterActive === 'Active' && !isActive) return false
    if (filterActive === 'Completed' && isActive) return false

    const s = search.toLowerCase()
    return (
      !search ||
      t.condition.toLowerCase().includes(s) ||
      t.medicine.toLowerCase().includes(s) ||
      (t.veterinarian_name || '').toLowerCase().includes(s)
    )
  })

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAnimalId || !medicine.trim() || !condition.trim() || !dosage.trim()) return

    setSaving(true)
    try {
      const selectedAnimal = animals.find((a) => a.id === selectedAnimalId)
      await createVeterinaryTreatment({
        animal_id: selectedAnimalId,
        owner_id: selectedAnimal?.owner_id || 'demo-farmer',
        condition,
        medicine,
        dosage,
        start_date: startDate,
        end_date: endDate || undefined,
        veterinarian_name: 'Dr. Priya Sharma (Veterinary Officer)',
        notes,
      })

      setIsModalOpen(false)
      setCondition('')
      setMedicine('')
      setDosage('')
      setNotes('')
      await loadData()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Official Government Header */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs border-l-4 border-l-[#123C2A] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#123C2A] text-white px-2 py-0.5 rounded-[1px]">
              CLINICAL PHARMACOTHERAPY REGISTER
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              SVTG &middot; ANTIMICROBIAL STEWARDSHIP GUIDELINES
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#102A43] font-sans flex items-center gap-2">
            <Pill size={20} className="text-[#1B5E3C]" />
            Prescription & Treatment Protocols &middot; उपचार पंजीका
          </h1>
          <p className="text-xs text-stone-600 mt-0.5 font-sans">
            Prescription tracking, withdrawal period compliance, and antimicrobial resistance (AMR) stewardship.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[2px] bg-[#123C2A] text-white hover:bg-[#1B5E3C] text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            Issue Prescription
          </button>
          <button
            onClick={loadData}
            className="p-2 border border-stone-300 rounded-[2px] text-stone-600 hover:text-[#123C2A] hover:bg-stone-50"
            title="Refresh Protocols"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* AMR Stewardship Banner */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-stone-50 to-white">
        <div className="flex items-start gap-3">
          <ShieldCheck size={22} className="text-[#1B5E3C] shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-[#102A43] font-sans uppercase tracking-wide">
              National AMR Containment & Withdrawal Period Directive
            </div>
            <p className="text-xs text-stone-600 mt-0.5">
              Veterinarians are required to prioritize first-line antibiotics (Access group) before prescribing Watch/Reserve class fluoroquinolones or cephalosporins. Always advise livestock owners on milk & meat withholding durations.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2 font-mono text-[10px]">
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-bold">ACCESS: 1st Choice</span>
          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded font-bold">WATCH: Specific Indication</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-2.5 text-stone-400" size={16} />
            <input
              type="text"
              placeholder="Search by drug name, condition, veterinarian..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-[2px] focus:outline-none focus:border-[#123C2A]"
            />
          </div>
          <div>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as 'All' | 'Active' | 'Completed')}
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-[2px] focus:outline-none focus:border-[#123C2A] bg-white"
            >
              <option value="All">All Treatments (सभी उपचार)</option>
              <option value="Active">Active Courses (सक्रिय)</option>
              <option value="Completed">Completed Courses (पूर्ण)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Treatments List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-stone-500 font-mono text-xs">
            Loading prescription register...
          </div>
        ) : filteredTreatments.length === 0 ? (
          <div className="bg-white border border-stone-300 p-8 rounded-[2px] text-center text-stone-500">
            <Pill size={32} className="mx-auto text-stone-300 mb-2" />
            <p className="text-sm font-semibold text-stone-700">No treatments found</p>
          </div>
        ) : (
          filteredTreatments.map((t) => {
            const today = new Date().toISOString().split('T')[0]
            const isActive = !t.end_date || t.end_date >= today
            return (
              <div
                key={t.id}
                className="bg-white border border-stone-300 rounded-[2px] p-4 shadow-xs space-y-3 hover:border-stone-400 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-stone-900 flex items-center gap-1.5">
                      <Pill size={15} className="text-[#1B5E3C]" />
                      {t.condition}
                    </span>
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-800 border border-green-200">
                        <Clock size={11} /> Active Course
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                        <CheckCircle2 size={11} /> Course Completed
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-stone-500 font-mono flex items-center gap-2">
                    <span>Course: {t.start_date} {t.end_date ? `to ${t.end_date}` : '(Ongoing)'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-stone-50 p-3 rounded-[2px] border border-stone-200 space-y-1">
                    <div className="text-[10px] font-mono uppercase text-stone-500">Prescribed Medication & Dosage</div>
                    <div className="font-mono font-bold text-sm text-[#102A43]">{t.medicine}</div>
                    <div className="text-stone-700 font-semibold">{t.dosage}</div>
                  </div>

                  <div className="bg-stone-50 p-3 rounded-[2px] border border-stone-200 space-y-1">
                    <div className="text-[10px] font-mono uppercase text-stone-500">Prescribing Clinical Officer</div>
                    <div className="font-semibold text-stone-900">{t.veterinarian_name}</div>
                    <div className="text-stone-500 text-[11px] font-mono">
                      Target Animal ID: {t.animal_id}
                    </div>
                  </div>
                </div>

                {t.notes && (
                  <div className="text-xs text-stone-700 bg-amber-50/60 p-2.5 rounded-[2px] border border-amber-200/60 flex items-start gap-2">
                    <AlertTriangle size={14} className="text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>Withdrawal & Supportive Care Advice:</strong> {t.notes}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                  <Link
                    to={`/vet/animals/${t.animal_id}`}
                    className="text-[#123C2A] hover:underline font-semibold flex items-center gap-1"
                  >
                    <Heart size={12} />
                    View Animal Dossier
                  </Link>
                  <span className="font-mono text-[11px]">Logged in National Treatment Registry</span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal: Issue New Prescription */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#102A43]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-stone-300 rounded-[2px] max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#102A43] font-sans flex items-center gap-1.5">
                  <Pill size={16} />
                  Issue Veterinary Prescription
                </h3>
                <p className="text-[11px] text-stone-500 font-mono">
                  Standard Veterinary Treatment Guidelines (SVTG)
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePrescription} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono uppercase text-stone-600 font-semibold mb-1">
                  Select Patient Animal *
                </label>
                <select
                  value={selectedAnimalId}
                  onChange={(e) => setSelectedAnimalId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-[2px] focus:outline-none focus:border-[#123C2A]"
                  required
                >
                  {animals.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.animal_tag} — {a.animal_type} ({a.breed}) &middot; {a.village}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-stone-600 font-semibold mb-1">
                  Clinical Condition / Presumptive Diagnosis *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acute Bovine Respiratory Disease / Mastitis"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-[2px] focus:outline-none focus:border-[#123C2A]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-stone-600 font-semibold mb-1">
                  Medicine & Formulation *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Meloxicam + Paracetamol & Amoxicillin-Clavulanic Acid"
                  value={medicine}
                  onChange={(e) => setMedicine(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-[2px] focus:outline-none focus:border-[#123C2A]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-stone-600 font-semibold mb-1">
                  Dosage & Route *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 15ml Deep Intramuscular once daily for 3 days"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-[2px] focus:outline-none focus:border-[#123C2A]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-stone-600 font-semibold mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-[2px] focus:outline-none focus:border-[#123C2A]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-stone-600 font-semibold mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-[2px] focus:outline-none focus:border-[#123C2A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-stone-600 font-semibold mb-1">
                  Instructions & Withdrawal Advisory
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Discard milk for 72 hours post last dose. Keep stall dry and isolated."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-[2px] focus:outline-none focus:border-[#123C2A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs border border-stone-300 rounded-[2px] hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs bg-[#123C2A] text-white rounded-[2px] hover:bg-[#1B5E3C] font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Recording Prescription...' : 'Issue Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
