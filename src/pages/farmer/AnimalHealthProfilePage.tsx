import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Tag, ShieldAlert, Calendar, MapPin, Syringe,
  Printer, Plus
} from 'lucide-react'
import { getAnimalById } from '@/services/animalService'
import { getSymptomReportsByAnimalId } from '@/services/symptomReportService'
import { getVaccinationsByAnimalId, addFarmerVaccinationRecord } from '@/services/vaccinationService'
import { getTreatmentsByAnimalId } from '@/services/treatmentService'
import { HealthStatusPill } from '@/components/ui/HealthStatusPill'
import { AnimalIcon } from '@/components/ui/AnimalIcon'
import type { Animal, SymptomReport, Vaccination, Treatment } from '@/types'

export function AnimalHealthProfilePage() {
  const { id } = useParams<{ id: string }>()

  const [animal, setAnimal] = useState<Animal | null>(null)
  const [reports, setReports] = useState<SymptomReport[]>([])
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'vaccines' | 'treatments' | 'reports'>('overview')

  // Modal to record offline vaccination
  const [showVacModal, setShowVacModal] = useState(false)
  const [vacName, setVacName] = useState('FMD (Foot & Mouth Disease)')
  const [vacDate, setVacDate] = useState(new Date().toISOString().split('T')[0])
  const [vacNextDate, setVacNextDate] = useState('')
  const [vacAdmin, setVacAdmin] = useState('Block Camp / Sadar Clinic')
  const [savingVac, setSavingVac] = useState(false)

  useEffect(() => {
    async function loadData() {
      if (!id) return
      try {
        setLoading(true)
        const [animalData, reportsData, vacData, trtData] = await Promise.all([
          getAnimalById(id),
          getSymptomReportsByAnimalId(id),
          getVaccinationsByAnimalId(id),
          getTreatmentsByAnimalId(id),
        ])
        setAnimal(animalData)
        setReports(reportsData)
        setVaccinations(vacData)
        setTreatments(trtData)
      } catch (err) {
        console.error('Failed to load animal profile:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  const handleRecordVaccine = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!animal) return
    try {
      setSavingVac(true)
      const newVac = await addFarmerVaccinationRecord({
        animal_id: animal.id,
        owner_id: animal.owner_id,
        vaccine_name: vacName,
        vaccination_date: vacDate,
        next_due_date: vacNextDate || undefined,
        administered_by: vacAdmin,
      })
      setVaccinations((prev) => [newVac, ...prev])
      setShowVacModal(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSavingVac(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-stone-500 max-w-5xl mx-auto">
        Loading digital animal health passport...
      </div>
    )
  }

  if (!animal) {
    return (
      <div className="p-8 text-center max-w-5xl mx-auto space-y-3 bg-white border border-stone-300 mt-6">
        <h2 className="text-base font-bold text-[#102A43]">Animal Record Not Found</h2>
        <p className="text-xs text-stone-600">The requested animal identifier does not exist in the registry.</p>
        <Link
          to="/farmer/animals"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#1B5E3C] hover:underline"
        >
          &larr; Return to Livestock Registry
        </Link>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-5 max-w-5xl mx-auto">
      {/* 1. Breadcrumb */}
      <div className="flex items-center justify-between text-xs font-mono text-stone-500">
        <div className="flex items-center gap-2">
          <Link to="/farmer/dashboard" className="hover:text-[#1B5E3C]">
            DASHBOARD
          </Link>
          <span>&gt;</span>
          <Link to="/farmer/animals" className="hover:text-[#1B5E3C]">
            LIVESTOCK REGISTRY
          </Link>
          <span>&gt;</span>
          <span className="text-[#102A43] font-bold">{animal.animal_tag}</span>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-stone-300 rounded-[2px] text-stone-700 hover:bg-stone-50 text-[11px] font-bold transition-colors cursor-pointer"
        >
          <Printer size={13} />
          <span>PRINT HEALTH PASSPORT</span>
        </button>
      </div>

      {/* 2. Animal Header Passport Card */}
      <div className="bg-white border border-stone-300 rounded-[2px] shadow-xs overflow-hidden">
        {/* Top Identification Bar */}
        <div className="bg-[#102A43] text-white px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag size={14} className="text-[#8BC34A]" />
            <span className="text-xs font-mono uppercase tracking-wider text-white/70">
              NATIONAL LIVESTOCK PASSPORT &middot;
            </span>
            <span className="text-xs font-mono font-bold text-white tracking-widest">
              {animal.animal_tag}
            </span>
          </div>
          <span className="text-[10px] font-mono text-white/70 bg-white/10 px-2 py-0.5 rounded-[1px]">
            INAPH COMPLIANT
          </span>
        </div>

        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-[2px] bg-[#EBF5EE] border border-[#2E7D32]/30 flex items-center justify-center text-[#1B5E3C] shrink-0">
              <AnimalIcon type={animal.animal_type} className="w-10 h-10 text-[#123C2A]" />
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-[#102A43]">
                  {animal.animal_type} &middot; {animal.breed || 'Indigenous'}
                </h1>
                <HealthStatusPill status={animal.health_status} />
              </div>

              <div className="flex items-center gap-3 text-xs text-stone-600 mt-1.5 flex-wrap font-sans">
                <span>Gender: <strong className="text-stone-800">{animal.gender}</strong></span>
                <span>&middot;</span>
                <span>Age: <strong className="text-stone-800">{animal.age ? `${animal.age} Years` : 'N/A'}</strong></span>
                <span>&middot;</span>
                <span>Weight: <strong className="text-stone-800 font-mono">{animal.weight ? `${animal.weight} kg` : 'N/A'}</strong></span>
                <span>&middot;</span>
                <span>Marks: <strong className="text-stone-800">{animal.color || 'Standard'}</strong></span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-1 font-sans">
                <MapPin size={12} className="text-stone-400" />
                <span>{animal.village || 'Rampur Khurd'}, {animal.district || 'Varanasi'}</span>
              </div>
            </div>
          </div>

          {/* Quick Issue Report Button */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 font-mono">
            <Link
              to={`/farmer/report-health?animalId=${animal.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#C62828] hover:bg-[#A81D1D] text-white text-xs font-bold rounded-[2px] shadow-xs transition-colors"
            >
              <ShieldAlert size={15} />
              <span>REPORT SYMPTOMS</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-stone-300 font-mono text-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 border-b-2 font-bold whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'overview'
              ? 'border-[#1B5E3C] text-[#1B5E3C] bg-white'
              : 'border-transparent text-stone-600 hover:text-[#102A43]'
          }`}
        >
          OVERVIEW &bull; विवरण
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2.5 border-b-2 font-bold whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'timeline'
              ? 'border-[#1B5E3C] text-[#1B5E3C] bg-white'
              : 'border-transparent text-stone-600 hover:text-[#102A43]'
          }`}
        >
          HEALTH HISTORY ({reports.length + vaccinations.length + treatments.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vaccines')}
          className={`px-4 py-2.5 border-b-2 font-bold whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'vaccines'
              ? 'border-[#1B5E3C] text-[#1B5E3C] bg-white'
              : 'border-transparent text-stone-600 hover:text-[#102A43]'
          }`}
        >
          VACCINATIONS ({vaccinations.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('treatments')}
          className={`px-4 py-2.5 border-b-2 font-bold whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'treatments'
              ? 'border-[#1B5E3C] text-[#1B5E3C] bg-white'
              : 'border-transparent text-stone-600 hover:text-[#102A43]'
          }`}
        >
          TREATMENTS ({treatments.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 border-b-2 font-bold whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'reports'
              ? 'border-[#1B5E3C] text-[#1B5E3C] bg-white'
              : 'border-transparent text-stone-600 hover:text-[#102A43]'
          }`}
        >
          REPORTS ({reports.length})
        </button>
      </div>

      {/* 4. Tab Contents */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Vitals Summary Card */}
            <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-[#102A43] font-mono uppercase tracking-wider border-b border-stone-200 pb-2">
                PASSPORT ATTRIBUTES
              </h3>
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <dt className="text-stone-500">Official Tag:</dt>
                  <dd className="font-mono font-bold text-[#102A43]">{animal.animal_tag}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Species:</dt>
                  <dd className="font-semibold text-stone-800">{animal.animal_type}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Breed:</dt>
                  <dd className="font-semibold text-stone-800">{animal.breed || 'Indigenous'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Gender:</dt>
                  <dd className="font-semibold text-stone-800">{animal.gender}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Age:</dt>
                  <dd className="font-mono text-stone-800">{animal.age ? `${animal.age} Years` : 'N/A'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Weight:</dt>
                  <dd className="font-mono text-stone-800">{animal.weight ? `${animal.weight} kg` : 'N/A'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Registered On:</dt>
                  <dd className="font-mono text-stone-600">
                    {new Date(animal.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Next Vaccine Advisory */}
            <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3 border-t-4 border-t-[#8A6A3D]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#102A43] font-mono uppercase tracking-wider">
                  VACCINATION STATUS
                </h3>
                <Syringe size={15} className="text-[#8A6A3D]" />
              </div>
              {vaccinations.length > 0 && vaccinations[0].next_due_date ? (
                <div>
                  <p className="text-xs text-stone-500">Next Scheduled Dose:</p>
                  <p className="text-sm font-bold text-[#102A43] mt-0.5">{vaccinations[0].vaccine_name}</p>
                  <p className="text-xs font-mono font-bold text-[#8C5D00] mt-1 flex items-center gap-1">
                    <Calendar size={12} />
                    Due: {vaccinations[0].next_due_date}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-2">
                    Administered by: {vaccinations[0].administered_by || 'Veterinary Officer'}
                  </p>
                </div>
              ) : (
                <div className="text-xs text-stone-500 py-3">
                  No upcoming vaccination dates on file.
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowVacModal(true)}
                className="w-full py-1.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-[2px] transition-colors cursor-pointer font-mono"
              >
                + RECORD VACCINATION
              </button>
            </div>

            {/* Health Surveillance Summary */}
            <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3 border-t-4 border-t-[#1B5E3C]">
              <h3 className="text-xs font-bold text-[#102A43] font-mono uppercase tracking-wider">
                CLINICAL EPISODES
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="bg-stone-50 p-2 rounded-[2px] border border-stone-200">
                  <p className="text-xl font-bold font-mono text-[#102A43]">{reports.length}</p>
                  <p className="text-[10px] text-stone-500 uppercase mt-0.5">Reports</p>
                </div>
                <div className="bg-stone-50 p-2 rounded-[2px] border border-stone-200">
                  <p className="text-xl font-bold font-mono text-[#8A6A3D]">{vaccinations.length}</p>
                  <p className="text-[10px] text-stone-500 uppercase mt-0.5">Vaccines</p>
                </div>
                <div className="bg-stone-50 p-2 rounded-[2px] border border-stone-200">
                  <p className="text-xl font-bold font-mono text-[#1B5E3C]">{treatments.length}</p>
                  <p className="text-[10px] text-stone-500 uppercase mt-0.5">Rx Courses</p>
                </div>
              </div>
              <div className="pt-2 text-[11px] text-stone-600 border-t border-stone-100">
                Village Primary Center: Sadar Veterinary Hospital (Phone: 0542-2501962)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UNIFIED TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="bg-white border border-stone-300 p-4 sm:p-5 rounded-[2px] shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-[#102A43] font-mono uppercase tracking-wider border-b border-stone-200 pb-2">
            CHRONOLOGICAL HEALTH TIMELINE &middot; सम्पूर्ण स्वास्थ्य इतिहास
          </h3>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
            {/* Initial Registration Event */}
            <div className="relative">
              <span className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-[#1B5E3C] border-2 border-white ring-2 ring-[#1B5E3C]/30" />
              <div>
                <p className="text-xs font-bold text-[#102A43]">
                  Registered into National Surveillance Grid
                </p>
                <p className="text-[11px] font-mono text-stone-500 mt-0.5">
                  {new Date(animal.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })} &middot; Assigned Tag {animal.animal_tag}
                </p>
              </div>
            </div>

            {/* Reports */}
            {reports.map((rep) => (
              <div key={rep.id} className="relative">
                <span className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-[#C62828] border-2 border-white ring-2 ring-[#C62828]/30" />
                <div className="bg-stone-50 p-3 rounded-[2px] border border-stone-200">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#7B1818]">
                      Symptom Report: {rep.symptoms.join(', ')}
                    </p>
                    <span className="text-[10px] font-mono font-bold bg-[#FDF0EE] text-[#C62828] px-1.5 py-0.5 rounded-[1px]">
                      {rep.severity}
                    </span>
                  </div>
                  {rep.description && (
                    <p className="text-xs text-stone-600 mt-1">{rep.description}</p>
                  )}
                  <p className="text-[10px] font-mono text-stone-500 mt-1.5">
                    {new Date(rep.reported_at).toLocaleDateString('en-IN')} &middot; Status: {rep.status}
                  </p>
                </div>
              </div>
            ))}

            {/* Vaccinations */}
            {vaccinations.map((vac) => (
              <div key={vac.id} className="relative">
                <span className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-[#8A6A3D] border-2 border-white ring-2 ring-[#8A6A3D]/30" />
                <div className="bg-stone-50 p-3 rounded-[2px] border border-stone-200">
                  <p className="text-xs font-bold text-[#102A43]">
                    Vaccination Administered: {vac.vaccine_name}
                  </p>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    Administered by: {vac.administered_by || 'Veterinary Officer'}
                  </p>
                  <p className="text-[10px] font-mono text-stone-500 mt-1">
                    Date: {vac.vaccination_date}
                    {vac.next_due_date && ` · Next Due: ${vac.next_due_date}`}
                  </p>
                </div>
              </div>
            ))}

            {/* Treatments */}
            {treatments.map((trt) => (
              <div key={trt.id} className="relative">
                <span className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-[#2E7D32] border-2 border-white ring-2 ring-[#2E7D32]/30" />
                <div className="bg-stone-50 p-3 rounded-[2px] border border-stone-200">
                  <p className="text-xs font-bold text-[#1B5E3C]">
                    Prescription: {trt.condition}
                  </p>
                  <p className="text-xs text-stone-800 font-semibold mt-0.5">
                    {trt.medicine} ({trt.dosage || 'Standard dosage'})
                  </p>
                  {trt.notes && (
                    <p className="text-[11px] text-stone-600 mt-1 italic">{trt.notes}</p>
                  )}
                  <p className="text-[10px] font-mono text-stone-500 mt-1.5">
                    Prescribed by: {trt.veterinarian_name} &middot; Period: {trt.start_date} to {trt.end_date || 'ongoing'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: VACCINATIONS */}
      {activeTab === 'vaccines' && (
        <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <h3 className="text-xs font-bold text-[#102A43] font-mono uppercase tracking-wider">
              VACCINATION DOSES & BOOSTER RECORDS
            </h3>
            <button
              type="button"
              onClick={() => setShowVacModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1B5E3C] hover:bg-[#123C2A] text-white text-xs font-bold rounded-[2px] transition-colors font-mono cursor-pointer"
            >
              <Plus size={14} />
              <span>RECORD VACCINATION</span>
            </button>
          </div>

          {vaccinations.length === 0 ? (
            <p className="text-xs text-stone-500 py-6 text-center">
              No vaccination records logged for this animal yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 font-mono text-[11px]">
                  <tr>
                    <th className="p-2.5">Vaccine Name</th>
                    <th className="p-2.5">Administered Date</th>
                    <th className="p-2.5">Next Due Date</th>
                    <th className="p-2.5">Administering Agency</th>
                    <th className="p-2.5">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {vaccinations.map((vac) => (
                    <tr key={vac.id} className="hover:bg-stone-50">
                      <td className="p-2.5 font-bold text-[#102A43]">{vac.vaccine_name}</td>
                      <td className="p-2.5 font-mono">{vac.vaccination_date}</td>
                      <td className="p-2.5 font-mono text-[#8C5D00] font-bold">
                        {vac.next_due_date || 'N/A'}
                      </td>
                      <td className="p-2.5 text-stone-700">{vac.administered_by || 'Field Camp'}</td>
                      <td className="p-2.5 text-stone-500">{vac.notes || 'Routine dose'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TREATMENTS */}
      {activeTab === 'treatments' && (
        <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-[#102A43] font-mono uppercase tracking-wider border-b border-stone-200 pb-2">
            VETERINARY PRESCRIPTIONS &amp; DOSAGE PROTOCOLS
          </h3>

          {treatments.length === 0 ? (
            <p className="text-xs text-stone-500 py-6 text-center">
              No veterinary prescriptions logged for this animal.
            </p>
          ) : (
            <div className="space-y-3">
              {treatments.map((trt) => (
                <div key={trt.id} className="p-3.5 bg-stone-50 border border-stone-200 rounded-[2px] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#102A43] font-mono">
                      CONDITION: {trt.condition}
                    </span>
                    <span className="text-[10px] font-mono bg-white border border-stone-200 px-2 py-0.5 rounded text-stone-600">
                      {trt.start_date} &rarr; {trt.end_date || 'Active'}
                    </span>
                  </div>
                  <div className="text-xs text-stone-800">
                    <strong>Prescribed Medicine:</strong> {trt.medicine}
                  </div>
                  {trt.dosage && (
                    <div className="text-xs text-stone-700 font-mono">
                      <strong>Dosage &amp; Frequency:</strong> {trt.dosage}
                    </div>
                  )}
                  {trt.notes && (
                    <div className="text-xs text-stone-600 italic">
                      <strong>Instructions:</strong> {trt.notes}
                    </div>
                  )}
                  <div className="text-[11px] text-stone-500 border-t border-stone-200 pt-1.5 mt-1 font-mono">
                    Prescribing Veterinarian: {trt.veterinarian_name || 'Government Veterinary Officer'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: REPORTS */}
      {activeTab === 'reports' && (
        <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-[#102A43] font-mono uppercase tracking-wider border-b border-stone-200 pb-2">
            SUBMITTED SYMPTOM REPORTS
          </h3>

          {reports.length === 0 ? (
            <p className="text-xs text-stone-500 py-6 text-center">
              No clinical symptom reports submitted for this animal.
            </p>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div key={rep.id} className="p-3.5 bg-stone-50 border border-stone-200 rounded-[2px] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-[#102A43]">
                        {new Date(rep.reported_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-[#FDF0EE] text-[#C62828] border border-[#C62828]/30 rounded">
                        {rep.severity}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono bg-white border border-stone-200 px-2 py-0.5 rounded text-stone-700">
                      Status: {rep.status}
                    </span>
                  </div>
                  <div className="text-xs text-stone-800">
                    <strong>Reported Symptoms:</strong> {rep.symptoms.join(', ')}
                  </div>
                  {rep.description && (
                    <p className="text-xs text-stone-600">{rep.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Offline Vaccination Record Modal */}
      {showVacModal && (
        <div className="fixed inset-0 bg-[#102A43]/60 backdrop-blur-xs z-50 flex items-center justify-center p-3">
          <div className="bg-white border border-stone-300 rounded-[2px] max-w-md w-full p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-[#102A43] font-sans border-b border-stone-200 pb-2">
              टीकाकरण रिकॉर्ड करें &middot; Record Vaccination Event
            </h3>

            <form onSubmit={handleRecordVaccine} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Vaccine Name (टीका)
                </label>
                <input
                  type="text"
                  value={vacName}
                  onChange={(e) => setVacName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-[2px] text-xs"
                  required
                />
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
                  Administered By / Facility
                </label>
                <input
                  type="text"
                  value={vacAdmin}
                  onChange={(e) => setVacAdmin(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-[2px] text-xs"
                  placeholder="e.g. MVU Unit 4 / Dr. Priya Sharma"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 font-mono">
                <button
                  type="button"
                  onClick={() => setShowVacModal(false)}
                  className="px-3 py-1.5 border border-stone-300 text-stone-700 text-xs font-bold rounded-[2px]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={savingVac}
                  className="px-4 py-1.5 bg-[#1B5E3C] text-white text-xs font-bold rounded-[2px] disabled:opacity-50"
                >
                  {savingVac ? 'SAVING...' : 'SAVE RECORD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
