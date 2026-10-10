// ============================================================
// PASHURAKSHA (पशुरक्षा) — VETERINARIAN ANIMAL HEALTH DOSSIER
// Stage 3: Clinical Health Dossier & Medical Record History
// ============================================================

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Heart,
  Tag,
  MapPin,
  Calendar,
  CheckCircle2,
  User,
  Phone,
  Syringe,
  Pill,
  Folder,
  Activity,
  ExternalLink,
  Radio
} from 'lucide-react'
import { getAnimalById, updateAnimalHealthStatus } from '@/services/animalService'
import { getVetCases } from '@/services/vetService'
import { getTreatmentsByAnimalId } from '@/services/treatmentService'
import { getVaccinationsByAnimalId } from '@/services/vaccinationService'
import { getMeasurements, getSpeciesThresholds } from '@/lib/iot'
import type { SensorMeasurement } from '@/lib/iot'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { CaseStatusPill } from '@/components/ui/CaseStatusPill'
import type { Animal, AnimalHealthStatus, VeterinaryCase, Treatment, Vaccination } from '@/types'

export function VetAnimalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [animal, setAnimal] = useState<Animal | null>(null)
  const [cases, setCases] = useState<VeterinaryCase[]>([])
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [iotMeasurements, setIotMeasurements] = useState<SensorMeasurement[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'cases' | 'treatments' | 'vaccinations' | 'iot'>('cases')
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const loadData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const a = await getAnimalById(id)
      setAnimal(a)

      const allCases = await getVetCases()
      const animalCases = allCases.filter((c) => c.animal_id === id)
      setCases(animalCases)

      const trts = await getTreatmentsByAnimalId(id)
      setTreatments(trts)

      const vacs = await getVaccinationsByAnimalId(id)
      setVaccinations(vacs)

      const iot = await getMeasurements({ animalId: id, limit: 30 })
      setIotMeasurements(iot)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  const handleStatusChange = async (newStatus: AnimalHealthStatus) => {
    if (!animal) return
    setStatusUpdating(true)
    setStatusMessage(null)
    try {
      await updateAnimalHealthStatus(animal.id, newStatus)
      setAnimal({ ...animal, health_status: newStatus })
      setStatusMessage(`Health status updated to ${newStatus}`)
      setTimeout(() => setStatusMessage(null), 4000)
    } finally {
      setStatusUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-stone-500 font-mono text-xs">
        Loading animal clinical dossier...
      </div>
    )
  }

  if (!animal) {
    return (
      <div className="p-8 text-center space-y-4">
        <Heart size={36} className="mx-auto text-stone-400" />
        <h2 className="text-lg font-bold text-stone-800">Animal Dossier Not Found</h2>
        <p className="text-xs text-stone-600">The requested animal record could not be located.</p>
        <Link
          to="/vet/animals"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-[#123C2A] text-white text-xs font-semibold"
        >
          <ArrowLeft size={14} /> Back to Animal Registry
        </Link>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/vet/animals"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#123C2A] hover:underline"
        >
          <ArrowLeft size={14} />
          Back to Livestock Registry
        </Link>
        <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">
          VETERINARY CLINICAL DOSSIER &middot; INAPH COMPLIANT
        </span>
      </div>

      {/* Header Profile Card */}
      <div className="bg-white border border-stone-300 rounded-[2px] p-5 shadow-xs border-l-4 border-l-[#123C2A]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-lg font-bold text-[#102A43] flex items-center gap-1.5">
                <Tag size={18} className="text-[#1B5E3C]" />
                {animal.animal_tag}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-[2px] bg-stone-100 text-stone-700 border border-stone-300">
                {animal.animal_type} &middot; {animal.breed || 'Indigenous'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-[2px] bg-stone-100 text-stone-600 font-mono">
                {animal.age || 2} Years &middot; {animal.gender}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-stone-600 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-stone-400" />
                {animal.village || 'Rampur Khurd'}, {animal.district || 'Varanasi'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={13} className="text-stone-400" />
                Registered: {new Date(animal.created_at).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              {animal.weight && (
                <span className="text-stone-500 font-mono">
                  Weight: {animal.weight} kg
                </span>
              )}
            </div>
          </div>

          {/* Clinical Status Controller */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-stone-50 p-3 rounded-[2px] border border-stone-200">
            <div>
              <div className="text-[10px] font-mono uppercase text-stone-500 font-semibold mb-1">
                Clinical Health Status
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={animal.health_status}
                  disabled={statusUpdating}
                  onChange={(e) => handleStatusChange(e.target.value as AnimalHealthStatus)}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-[2px] border border-stone-300 bg-white focus:outline-none focus:border-[#123C2A]"
                >
                  <option value="Healthy">Healthy (स्वस्थ)</option>
                  <option value="Under Observation">Under Observation (निगरानी में)</option>
                  <option value="High Risk">High Risk (उच्च जोखिम)</option>
                  <option value="Quarantine">Quarantine (संगरोध)</option>
                  <option value="Deceased">Deceased (मृत्यु दर्ज)</option>
                </select>
                {statusUpdating && (
                  <span className="text-xs text-stone-500 font-mono animate-pulse">Updating...</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-3 p-2 bg-green-50 border border-green-200 text-green-800 text-xs rounded-[2px] flex items-center gap-1.5">
            <CheckCircle2 size={14} />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Grid: Owner Details & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Owner Card */}
        <div className="bg-white border border-stone-300 rounded-[2px] p-4 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold flex items-center gap-1.5">
              <User size={13} className="text-[#123C2A]" />
              Livestock Owner
            </span>
            <Link
              to={`/vet/farmers/${animal.owner_id}`}
              className="text-[11px] font-semibold text-[#123C2A] hover:underline flex items-center gap-1"
            >
              Full Profile <ExternalLink size={11} />
            </Link>
          </div>
          <div>
            <div className="font-semibold text-stone-900 text-sm">Rajendra Singh</div>
            <div className="text-xs text-stone-600 flex items-center gap-1 mt-0.5">
              <MapPin size={12} className="text-stone-400" />
              {animal.village || 'Rampur Khurd'}, Varanasi
            </div>
            <div className="text-xs text-stone-600 flex items-center gap-1 mt-1 font-mono">
              <Phone size={12} className="text-stone-400" />
              +91 98391 44820
            </div>
          </div>
        </div>

        {/* Case Metrics Card */}
        <div className="bg-white border border-stone-300 rounded-[2px] p-4 shadow-xs space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold flex items-center gap-1.5 border-b border-stone-200 pb-2">
            <Folder size={13} className="text-[#123C2A]" />
            Lifetime Case Record
          </div>
          <div className="grid grid-cols-2 gap-2 text-center pt-1">
            <div className="bg-stone-50 p-2 rounded-[2px] border border-stone-200">
              <div className="text-lg font-bold font-mono text-[#102A43]">{cases.length}</div>
              <div className="text-[10px] text-stone-600">Total Cases</div>
            </div>
            <div className="bg-stone-50 p-2 rounded-[2px] border border-stone-200">
              <div className="text-lg font-bold font-mono text-red-700">
                {cases.filter((c) => c.status !== 'Resolved' && c.status !== 'Rejected').length}
              </div>
              <div className="text-[10px] text-stone-600">Active Illness</div>
            </div>
          </div>
        </div>

        {/* Preventative & Clinical Card */}
        <div className="bg-white border border-stone-300 rounded-[2px] p-4 shadow-xs space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold flex items-center gap-1.5 border-b border-stone-200 pb-2">
            <Activity size={13} className="text-[#123C2A]" />
            Preventive & Rx Record
          </div>
          <div className="grid grid-cols-2 gap-2 text-center pt-1">
            <div className="bg-stone-50 p-2 rounded-[2px] border border-stone-200">
              <div className="text-lg font-bold font-mono text-[#1B5E3C]">{vaccinations.length}</div>
              <div className="text-[10px] text-stone-600">Vaccinations</div>
            </div>
            <div className="bg-stone-50 p-2 rounded-[2px] border border-stone-200">
              <div className="text-lg font-bold font-mono text-[#102A43]">{treatments.length}</div>
              <div className="text-[10px] text-stone-600">Prescriptions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-stone-300 flex items-center gap-2">
        <button
          onClick={() => setActiveTab('cases')}
          className={`px-4 py-2 text-xs font-semibold tracking-wide border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'cases'
              ? 'border-[#123C2A] text-[#123C2A] bg-stone-50'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <Folder size={14} />
          Clinical Cases ({cases.length})
        </button>
        <button
          onClick={() => setActiveTab('treatments')}
          className={`px-4 py-2 text-xs font-semibold tracking-wide border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'treatments'
              ? 'border-[#123C2A] text-[#123C2A] bg-stone-50'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <Pill size={14} />
          Prescribed Treatments ({treatments.length})
        </button>
        <button
          onClick={() => setActiveTab('vaccinations')}
          className={`px-4 py-2 text-xs font-semibold tracking-wide border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'vaccinations'
              ? 'border-[#123C2A] text-[#123C2A] bg-stone-50'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <Syringe size={14} />
          Vaccination Log ({vaccinations.length})
        </button>
        <button
          onClick={() => setActiveTab('iot')}
          className={`px-4 py-2 text-xs font-semibold tracking-wide border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'iot'
              ? 'border-[#123C2A] text-[#123C2A] bg-stone-50'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <Radio size={14} />
          Smart IoT Telemetry ({iotMeasurements.length})
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'cases' && (
        <div className="bg-white border border-stone-300 rounded-[2px] shadow-xs overflow-hidden">
          {cases.length === 0 ? (
            <div className="p-8 text-center text-stone-500">
              <p className="text-xs font-mono">No clinical health cases recorded for this animal.</p>
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
                    <th className="py-2.5 px-3">Assigned Vet</th>
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
                      <td className="py-3 px-3 text-stone-700">
                        {c.assigned_vet_name || 'Dr. Priya Sharma'}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-stone-600">
                        {new Date(c.reported_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          to={`/vet/cases/${c.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[2px] bg-[#123C2A] text-white hover:bg-[#1B5E3C] text-[11px] font-semibold"
                        >
                          Workspace &rarr;
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

      {activeTab === 'treatments' && (
        <div className="bg-white border border-stone-300 rounded-[2px] shadow-xs overflow-hidden">
          {treatments.length === 0 ? (
            <div className="p-8 text-center text-stone-500">
              <p className="text-xs font-mono">No prescribed treatments on record for this animal.</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-200">
              {treatments.map((t) => (
                <div key={t.id} className="p-4 hover:bg-stone-50 transition-colors space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-stone-900 text-sm flex items-center gap-2">
                        <Pill size={15} className="text-[#1B5E3C]" />
                        {t.condition}
                      </div>
                      <div className="text-xs font-mono text-stone-700 mt-1">
                        Rx: <strong className="text-[#102A43]">{t.medicine}</strong> &middot; {t.dosage}
                      </div>
                    </div>
                    <div className="text-right text-[11px] font-mono text-stone-500 shrink-0">
                      <div>Start: {t.start_date}</div>
                      {t.end_date && <div>End: {t.end_date}</div>}
                    </div>
                  </div>
                  {t.notes && (
                    <div className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-[2px] border border-stone-200">
                      <strong>Clinical Instructions:</strong> {t.notes}
                    </div>
                  )}
                  <div className="text-[11px] text-stone-500 font-mono flex items-center gap-1">
                    <span>Prescribed by:</span>
                    <strong className="text-stone-700">{t.veterinarian_name}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'vaccinations' && (
        <div className="bg-white border border-stone-300 rounded-[2px] shadow-xs overflow-hidden">
          {vaccinations.length === 0 ? (
            <div className="p-8 text-center text-stone-500">
              <p className="text-xs font-mono">No vaccination records found for this animal.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#102A43] text-white font-mono uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Vaccine Name</th>
                    <th className="py-2.5 px-3">Batch Number</th>
                    <th className="py-2.5 px-3">Administered Date</th>
                    <th className="py-2.5 px-3">Next Due Date</th>
                    <th className="py-2.5 px-3">Administered By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {vaccinations.map((v) => (
                    <tr key={v.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3 px-3 font-semibold text-stone-900">
                        {v.vaccine_name}
                      </td>
                      <td className="py-3 px-3 font-mono text-stone-700">
                        {v.notes || 'BATCH-2026-FMD'}
                      </td>
                      <td className="py-3 px-3 font-mono text-stone-700">
                        {v.vaccination_date}
                      </td>
                      <td className="py-3 px-3 font-mono text-stone-700">
                        {v.next_due_date || 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-stone-700">
                        {v.administered_by || 'Veterinary Officer'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'iot' && (
        <div className="bg-white border border-stone-300 rounded-[2px] shadow-xs p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold uppercase bg-[#1B5E3C] text-white px-2 py-0.5 rounded">
                  STAGE 11 IOT TELEMETRY
                </span>
                <span className="text-[10px] font-mono bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-bold">
                  DEMO / SENSOR DATA
                </span>
              </div>
              <h3 className="text-base font-bold text-stone-900">
                Continuous Physiological Telemetry Record
              </h3>
              <p className="text-xs text-stone-500">
                Sensor measurements from paired RFID tags or rumen bolus with ICAR-IVRI baseline bounds.
              </p>
            </div>
            <Link
              to="/vet/iot"
              className="text-xs text-[#102A43] font-semibold hover:underline bg-stone-50 border border-stone-300 px-3 py-1.5 rounded flex items-center gap-1 font-mono"
            >
              Open District IoT Triage Console &rarr;
            </Link>
          </div>

          {/* Species Baseline Reference */}
          {animal && (() => {
            const thresholds = getSpeciesThresholds(animal.animal_type || 'Cow')
            return (
              <div className="bg-stone-50 border border-stone-200 p-3 rounded text-xs flex items-center justify-between flex-wrap gap-2">
                <span className="font-semibold text-stone-700">
                  ICAR-IVRI Baseline ({animal.animal_type}):
                </span>
                <span className="font-mono text-stone-600">
                  Normal Temp: {thresholds.body_temp_c.min_normal}°C - {thresholds.body_temp_c.max_normal}°C
                </span>
                <span className="font-mono text-stone-600">
                  Target Rumination: &gt; {thresholds.rumination_min_day?.warning_low ?? 320} min/day
                </span>
                <span className="font-mono text-stone-600">
                  Normal Heart Rate: {thresholds.heart_rate_bpm?.min_normal ?? 48} - {thresholds.heart_rate_bpm?.max_normal ?? 84} bpm
                </span>
              </div>
            )
          })()}

          {iotMeasurements.length === 0 ? (
            <div className="p-8 text-center text-stone-500 font-mono text-xs">
              No active IoT telemetry recorded for this animal yet.
            </div>
          ) : (
            <div className="overflow-x-auto border border-stone-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#102A43] text-white font-mono uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Sensor EUI</th>
                    <th className="py-2.5 px-3">Metric</th>
                    <th className="py-2.5 px-3">Value</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Validation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 font-mono text-[11px]">
                  {iotMeasurements.map((m) => (
                    <tr key={m.id} className="hover:bg-stone-50">
                      <td className="py-2.5 px-3 text-stone-600">
                        {new Date(m.recorded_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-stone-800">{m.device_eui || m.device_id}</td>
                      <td className="py-2.5 px-3 text-stone-700">{m.measurement_type}</td>
                      <td className="py-2.5 px-3 font-bold text-stone-900">
                        {m.value} {m.unit}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            m.is_flagged_for_review
                              ? 'bg-red-100 text-red-900 border border-red-200'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {m.is_flagged_for_review ? 'FLAGGED ANOMALY' : 'NORMAL'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-stone-600">
                        {m.quality_status || 'VALID'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
