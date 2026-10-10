import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Tag, User, MapPin,
  CheckCircle2, ShieldAlert, Plus, Pill, FlaskConical,
  Phone, WifiOff, RefreshCw
} from 'lucide-react'
import { getMeasurements } from '@/lib/iot'
import type { SensorMeasurement } from '@/lib/iot'
import {
  getVetCaseById,
  updateCaseStatus,
  updateCasePriority,
  recordCaseExamination,
  addCaseNote,
  requestSampleCollection,
  createLabReferral,
  addLabResult,
  createVeterinaryTreatment,
  resolveCase
} from '@/services/vetService'
import {
  saveVetDraftNote,
  getVetDraftNotes,
  deleteVetDraftNote,
  type VetDraftNote
} from '@/services/offline'
import { CaseLocationMap } from '@/components/maps/CaseLocationMap'
import { ExplainableRiskWidget } from '@/components/risk/ExplainableRiskWidget'
import { ExplainableIntelligencePanel } from '@/components/intelligence/ExplainableIntelligencePanel'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { CaseStatusPill } from '@/components/ui/CaseStatusPill'
import { AnimalIcon } from '@/components/ui/AnimalIcon'
import type {
  VeterinaryCase,
  VetCaseStatus,
  CasePriority,
  SampleType,
  LabResultStatus
} from '@/types'

export function VetCaseDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [vetCase, setVetCase] = useState<VeterinaryCase | null>(null)
  const [iotReadings, setIotReadings] = useState<SensorMeasurement[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'clinical' | 'samples' | 'rx' | 'notes' | 'timeline'>('clinical')

  // Status & Priority form controls
  const [currentStatus, setCurrentStatus] = useState<VetCaseStatus>('Veterinary Review')
  const [currentPriority, setCurrentPriority] = useState<CasePriority>('HIGH')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Local draft notes for offline field operations
  const [localDraftNotes, setLocalDraftNotes] = useState<VetDraftNote[]>([])
  const [syncingDrafts, setSyncingDrafts] = useState(false)

  // Examination Form
  const [temp, setTemp] = useState<string>('103.5')
  const [tempUnit, setTempUnit] = useState<'F' | 'C'>('F')
  const examSymptoms = ['Fever', 'Cough']
  const [physicalObs, setPhysicalObs] = useState<string>('')
  const [behaviour, setBehaviour] = useState<'Alert' | 'Dull' | 'Depressed' | 'Excited' | 'Recumbent'>('Dull')
  const [appetite, setAppetite] = useState<'Normal' | 'Reduced' | 'Anorexic/Off-feed'>('Reduced')
  const [hydration, setHydration] = useState<'Normal' | 'Mild Dehydration' | 'Severe Dehydration'>('Mild Dehydration')
  const [respiratory, setRespiratory] = useState<'Normal' | 'Dyspnea/Rapid' | 'Wheezing/Cough' | 'Stridor'>('Dyspnea/Rapid')
  const [mucous, setMucous] = useState<'Normal Pink' | 'Congested/Red' | 'Pale' | 'Icteric/Yellow'>('Congested/Red')
  const otherObs = ''
  const [savingExam, setSavingExam] = useState(false)

  // Notes Form
  const [noteType, setNoteType] = useState<'General Observation' | 'Clinical Observation' | 'Follow-up' | 'Treatment' | 'Lab' | 'Administrative'>('Clinical Observation')
  const [noteContent, setNoteContent] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  // Sample Request Form
  const [showSampleModal, setShowSampleModal] = useState(false)
  const [sampleType, setSampleType] = useState<SampleType>('Blood')
  const [sampleInstructions, setSampleInstructions] = useState('Collect 5ml whole blood in EDTA tube and 5ml in plain serum vial.')
  const [samplePriority, setSamplePriority] = useState<CasePriority>('HIGH')
  const sampleNotes = 'Rule out acute systemic infectious pathogens.'
  const [savingSample, setSavingSample] = useState(false)

  // Lab Referral Form
  const [showLabModal, setShowLabModal] = useState(false)
  const [referralLab, setReferralLab] = useState('District Disease Diagnostic Laboratory (DDDL) Varanasi')
  const [referralTest, setReferralTest] = useState('Complete Blood Count (CBC) & Blood Smear Protozoan Screen')
  const [selectedSampleId, setSelectedSampleId] = useState('')
  const [savingReferral, setSavingReferral] = useState(false)

  // Lab Result Form
  const [showResultModal, setShowResultModal] = useState(false)
  const [activeRefId, setActiveRefId] = useState('')
  const [resultStatus, setResultStatus] = useState<LabResultStatus>('Negative')
  const [resultSummary, setResultSummary] = useState('No haemoprotozoa detected. Mild leukocytosis.')
  const [pathogen, setPathogen] = useState('Negative for Blood Parasites')
  const [interpretation, setInterpretation] = useState('Clinical pyrexia secondary to localized soft tissue inflammation. Infection ruled out; continue conservative treatment.')
  const [savingResult, setSavingResult] = useState(false)

  // Treatment Form
  const [showTreatmentModal, setShowTreatmentModal] = useState(false)
  const [rxCondition, setRxCondition] = useState('Acute Pyrexia & Respiratory Congestion')
  const [rxMedicine, setRxMedicine] = useState('Meloxicam + Paracetamol (IM) & Enrofloxacin 10%')
  const [rxDosage, setRxDosage] = useState('15ml daily for 3 consecutive days')
  const [rxStartDate, setRxStartDate] = useState(new Date().toISOString().split('T')[0])
  const [rxEndDate, setRxEndDate] = useState(new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0])
  const [rxInstructions, setRxInstructions] = useState('Keep isolated in shaded stall. Provide warm water and fresh green fodder.')
  const [savingRx, setSavingRx] = useState(false)

  // Resolution Modal
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [resolutionSummary, setResolutionSummary] = useState('Clinical symptoms fully resolved following 3-day antipyretic course. Animal alert and feeding normally.')
  const [finalStatus, setFinalStatus] = useState<'Resolved' | 'Monitoring' | 'Rejected'>('Resolved')
  const [followUpReq, setFollowUpReq] = useState(false)
  const [followUpDate, setFollowUpDate] = useState('')
  const [savingResolution, setSavingResolution] = useState(false)

  const reloadCase = async () => {
    if (!id) return
    try {
      const [data, drafts] = await Promise.all([
        getVetCaseById(id),
        getVetDraftNotes(id)
      ])
      if (data) {
        setVetCase(data)
        setCurrentStatus(data.status)
        setCurrentPriority(data.priority)
        setRxCondition(data.description || 'Clinical Concern')
        if (data.samples && data.samples.length > 0) {
          setSelectedSampleId(data.samples[0].id)
        }
        if (data.animal_id) {
          try {
            const readings = await getMeasurements({ animalId: data.animal_id, limit: 10 })
            setIotReadings(readings)
          } catch (e) {
            // Non-blocking
          }
        }
      }
      setLocalDraftNotes(drafts)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reloadCase()
  }, [id])

  const handleUpdateStatusAndPriority = async () => {
    if (!vetCase) return
    try {
      setUpdatingStatus(true)
      await updateCaseStatus(vetCase.id, currentStatus)
      await updateCasePriority(vetCase.id, currentPriority)
      await reloadCase()
    } catch (err) {
      console.error(err)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vetCase) return
    try {
      setSavingExam(true)
      await recordCaseExamination(vetCase.id, {
        veterinarian_name: 'Dr. Priya Sharma (Veterinary Officer)',
        temperature: parseFloat(temp) || undefined,
        temperature_unit: tempUnit,
        observed_symptoms: examSymptoms,
        physical_observations: physicalObs,
        behaviour,
        appetite,
        hydration,
        respiratory_condition: respiratory,
        mucous_membrane: mucous,
        other_observations: otherObs,
      })
      await reloadCase()
    } catch (err) {
      console.error(err)
    } finally {
      setSavingExam(false)
    }
  }

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vetCase || !noteContent.trim()) return

    // If offline: save local draft note to IndexedDB
    if (!navigator.onLine) {
      try {
        setSavingNote(true)
        const newDraft: VetDraftNote = {
          local_id: `draft_note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          case_id: vetCase.id,
          vet_id: 'demo-vet',
          veterinarian_name: 'Dr. Priya Sharma (Field MVU)',
          note_type: noteType,
          content: noteContent.trim(),
          created_at: new Date().toISOString(),
          sync_status: 'DRAFT_LOCAL',
        }
        await saveVetDraftNote(newDraft)
        setLocalDraftNotes((prev) => [newDraft, ...prev])
        setNoteContent('')
      } catch (err) {
        console.error('Failed to save offline draft note:', err)
      } finally {
        setSavingNote(false)
      }
      return
    }

    try {
      setSavingNote(true)
      await addCaseNote(vetCase.id, {
        veterinarian_name: 'Dr. Priya Sharma',
        note_type: noteType,
        content: noteContent.trim(),
      })
      setNoteContent('')
      await reloadCase()
    } catch (err) {
      console.warn('Network error while saving note, caching as local draft:', err)
      try {
        const newDraft: VetDraftNote = {
          local_id: `draft_note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          case_id: vetCase.id,
          vet_id: 'demo-vet',
          veterinarian_name: 'Dr. Priya Sharma (Field MVU)',
          note_type: noteType,
          content: noteContent.trim(),
          created_at: new Date().toISOString(),
          sync_status: 'DRAFT_LOCAL',
        }
        await saveVetDraftNote(newDraft)
        setLocalDraftNotes((prev) => [newDraft, ...prev])
        setNoteContent('')
      } catch (storeErr) {
        console.error(storeErr)
      }
    } finally {
      setSavingNote(false)
    }
  }

  const handleSyncDraftNotes = async () => {
    if (!navigator.onLine || !vetCase || localDraftNotes.length === 0) return
    try {
      setSyncingDrafts(true)
      for (const draft of localDraftNotes) {
        await addCaseNote(vetCase.id, {
          veterinarian_name: draft.veterinarian_name,
          note_type: draft.note_type as any,
          content: draft.content,
        })
        await deleteVetDraftNote(draft.local_id)
      }
      await reloadCase()
    } catch (err) {
      console.error('Error syncing draft notes:', err)
    } finally {
      setSyncingDrafts(false)
    }
  }

  const handleRequestSample = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vetCase) return
    try {
      setSavingSample(true)
      await requestSampleCollection({
        case_id: vetCase.id,
        animal_id: vetCase.animal_id,
        sample_type: sampleType,
        collection_instructions: sampleInstructions,
        priority: samplePriority,
        requested_by: 'Dr. Priya Sharma',
        notes: sampleNotes,
      })
      setShowSampleModal(false)
      await reloadCase()
    } catch (err) {
      console.error(err)
    } finally {
      setSavingSample(false)
    }
  }

  const handleCreateLabReferral = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vetCase || !selectedSampleId) return
    try {
      setSavingReferral(true)
      await createLabReferral({
        case_id: vetCase.id,
        sample_id: selectedSampleId,
        lab_name: referralLab,
        test_requested: referralTest,
        requested_by: 'Dr. Priya Sharma',
        priority: currentPriority,
      })
      setShowLabModal(false)
      await reloadCase()
    } catch (err) {
      console.error(err)
    } finally {
      setSavingReferral(false)
    }
  }

  const handleSaveLabResult = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vetCase || !activeRefId) return
    try {
      setSavingResult(true)
      await addLabResult({
        referral_id: activeRefId,
        case_id: vetCase.id,
        lab_name: referralLab,
        test_name: referralTest,
        result_status: resultStatus,
        result_summary: resultSummary,
        pathogen_identified: pathogen,
        veterinarian_interpretation: interpretation,
      })
      setShowResultModal(false)
      await reloadCase()
    } catch (err) {
      console.error(err)
    } finally {
      setSavingResult(false)
    }
  }

  const handleSaveTreatment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vetCase) return
    try {
      setSavingRx(true)
      await createVeterinaryTreatment({
        animal_id: vetCase.animal_id,
        owner_id: vetCase.owner_id,
        case_id: vetCase.id,
        condition: rxCondition,
        medicine: rxMedicine,
        dosage: rxDosage,
        start_date: rxStartDate,
        end_date: rxEndDate || undefined,
        veterinarian_name: 'Dr. Priya Sharma (Reg: VCI/UP/2019/8412)',
        notes: rxInstructions,
      })
      setShowTreatmentModal(false)
      await reloadCase()
    } catch (err) {
      console.error(err)
    } finally {
      setSavingRx(false)
    }
  }

  const handleFinalizeResolution = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vetCase) return

    // Prevent case resolution when only stored locally / offline
    if (!navigator.onLine) {
      alert('STATUTORY RESTRICTION: Case resolution cannot be completed while offline. State epidemiological regulations require real-time server timestamping and biosecurity audit clearance.')
      return
    }

    try {
      setSavingResolution(true)
      await resolveCase(vetCase.id, {
        resolution_summary: resolutionSummary,
        final_status: finalStatus,
        follow_up_required: followUpReq,
        follow_up_date: followUpDate || undefined,
      })
      setShowResolveModal(false)
      await reloadCase()
    } catch (err) {
      console.error(err)
    } finally {
      setSavingResolution(false)
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-stone-500 max-w-6xl mx-auto">
        Loading clinical case workspace...
      </div>
    )
  }

  if (!vetCase) {
    return (
      <div className="p-8 text-center max-w-4xl mx-auto space-y-3 bg-white border border-stone-300 mt-6">
        <h2 className="text-base font-bold text-[#102A43]">Case Not Found</h2>
        <p className="text-xs text-stone-600">The requested veterinary case identifier does not exist.</p>
        <Link to="/vet/cases" className="text-xs font-bold text-[#102A43] hover:underline">
          &larr; Back to Case Registry
        </Link>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* 1. Breadcrumb & Back */}
      <div className="flex items-center justify-between text-xs font-mono text-stone-500">
        <div className="flex items-center gap-2">
          <Link to="/vet/command-center" className="hover:text-[#102A43]">
            COMMAND CENTER
          </Link>
          <span>&gt;</span>
          <Link to="/vet/cases" className="hover:text-[#102A43]">
            CASES
          </Link>
          <span>&gt;</span>
          <span className="text-[#102A43] font-bold">{vetCase.case_number}</span>
        </div>

        <Link
          to="/vet/cases"
          className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900 font-bold"
        >
          <ArrowLeft size={13} />
          <span>ALL CASES</span>
        </Link>
      </div>

      {/* 2. Official Case Header */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs border-l-4 border-l-[#102A43] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono font-bold text-[#102A43] bg-stone-100 border border-stone-300 px-2 py-0.5 rounded-[1px]">
              CASE #{vetCase.case_number}
            </span>
            <PriorityBadge priority={vetCase.priority} />
            <CaseStatusPill status={vetCase.status} />
          </div>

          <h1 className="text-lg sm:text-xl font-bold text-[#102A43] font-sans">
            Clinical Case Dossier &middot; {vetCase.symptoms.join(', ')}
          </h1>
          <p className="text-xs text-stone-600 mt-0.5 font-sans">
            Assigned: <strong>{vetCase.assigned_vet_name || 'Dr. Priya Sharma'}</strong> &middot; Reported on {new Date(vetCase.reported_at).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        {/* Quick Review / Resolve Actions */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap font-mono">
          <button
            type="button"
            onClick={() => setShowTreatmentModal(true)}
            className="px-3 py-2 bg-[#1B5E3C] hover:bg-[#123C2A] text-white text-xs font-bold rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Pill size={14} />
            <span>+ PRESCRIBE RX</span>
          </button>
          <button
            type="button"
            onClick={() => setShowSampleModal(true)}
            className="px-3 py-2 bg-[#102A43] hover:bg-[#1B5E3C] text-white text-xs font-bold rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FlaskConical size={14} />
            <span>+ REQUEST SAMPLE</span>
          </button>
          <button
            type="button"
            onClick={() => setShowResolveModal(true)}
            className="px-3.5 py-2 bg-[#2E7D32] hover:bg-[#1B5E3C] text-white text-xs font-bold rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 size={14} />
            <span>RESOLVE CASE</span>
          </button>
        </div>
      </div>

      {/* 3. Status & Priority Quick Updater Strip */}
      <div className="bg-[#102A43] text-white p-3 rounded-[2px] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-white/70 uppercase text-[11px] font-bold">
            VETERINARY REVIEW CONTROLS:
          </span>

          <div className="flex items-center gap-1.5">
            <span className="text-white/50 text-[10px]">STATUS:</span>
            <select
              value={currentStatus}
              onChange={(e) => setCurrentStatus(e.target.value as VetCaseStatus)}
              className="bg-white/10 text-white border border-white/20 rounded-[2px] px-2 py-1 text-xs focus:outline-none"
            >
              <option value="Reported" className="text-black">Reported</option>
              <option value="Under Review" className="text-black">Under Review</option>
              <option value="Veterinary Review" className="text-black">Veterinary Review</option>
              <option value="Sample Required" className="text-black">Sample Required</option>
              <option value="Lab Pending" className="text-black">Lab Pending</option>
              <option value="Treatment" className="text-black">Treatment</option>
              <option value="Monitoring" className="text-black">Monitoring</option>
              <option value="Resolved" className="text-black">Resolved</option>
              <option value="Rejected" className="text-black">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-white/50 text-[10px]">PRIORITY:</span>
            <select
              value={currentPriority}
              onChange={(e) => setCurrentPriority(e.target.value as CasePriority)}
              className="bg-white/10 text-white border border-white/20 rounded-[2px] px-2 py-1 text-xs focus:outline-none"
            >
              <option value="CRITICAL" className="text-black">CRITICAL</option>
              <option value="HIGH" className="text-black">HIGH</option>
              <option value="MEDIUM" className="text-black">MEDIUM</option>
              <option value="LOW" className="text-black">LOW</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          disabled={updatingStatus}
          onClick={handleUpdateStatusAndPriority}
          className="px-3 py-1 bg-[#8BC34A] hover:bg-[#7CB342] text-[#102A43] font-bold rounded-[2px] transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          {updatingStatus ? 'SAVING...' : 'UPDATE CASE DESK'}
        </button>
      </div>

      {/* 4. Three-Column Dossier Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card A: Animal Information */}
        <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <span className="text-xs font-mono font-bold uppercase text-[#102A43] flex items-center gap-1.5">
              <Tag size={14} className="text-[#1B5E3C]" />
              ANIMAL INFORMATION
            </span>
            <Link
              to={`/vet/animals/${vetCase.animal_id}`}
              className="text-[11px] font-mono text-[#1B5E3C] hover:underline font-bold"
            >
              FULL DOSSIER &rarr;
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[2px] bg-[#EBF5EE] border border-[#2E7D32]/30 flex items-center justify-center text-[#1B5E3C] shrink-0">
              <AnimalIcon type={vetCase.animal?.animal_type || 'Cow'} className="w-6 h-6 text-[#123C2A]" />
            </div>
            <div>
              <p className="font-mono font-bold text-sm text-[#102A43]">
                {vetCase.animal?.animal_tag || 'Animal'}
              </p>
              <p className="text-xs text-stone-600">
                {vetCase.animal?.animal_type} &middot; {vetCase.animal?.breed || 'Indigenous'}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-stone-100 font-sans">
            <div>
              <dt className="text-stone-500">Gender:</dt>
              <dd className="font-semibold text-stone-800">{vetCase.animal?.gender || 'Female'}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Age:</dt>
              <dd className="font-mono text-stone-800">{vetCase.animal?.age ? `${vetCase.animal.age} Yrs` : 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Body Weight:</dt>
              <dd className="font-mono text-stone-800">{vetCase.animal?.weight ? `${vetCase.animal.weight} kg` : 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Health Status:</dt>
              <dd className="font-semibold text-[#C62828]">{vetCase.animal?.health_status || 'Under Review'}</dd>
            </div>
          </dl>
        </div>

        {/* Card B: Farmer / Owner Information */}
        <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <span className="text-xs font-mono font-bold uppercase text-[#102A43] flex items-center gap-1.5">
              <User size={14} className="text-[#102A43]" />
              FARMER INFORMATION
            </span>
            <Link
              to={`/vet/farmers/${vetCase.owner_id}`}
              className="text-[11px] font-mono text-[#102A43] hover:underline font-bold"
            >
              HERD PROFILE &rarr;
            </Link>
          </div>

          <div>
            <p className="font-bold text-sm text-[#102A43]">
              {vetCase.owner?.full_name || 'Rajendra Singh'}
            </p>
            <p className="text-xs text-stone-600 flex items-center gap-1 mt-0.5">
              <MapPin size={12} className="text-stone-400" />
              {vetCase.village || 'Rampur Khurd'}, {vetCase.district || 'Varanasi'}
            </p>
          </div>

          <div className="pt-2 border-t border-stone-100 space-y-2 text-xs font-sans">
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Verified Contact:</span>
              <a
                href={`tel:${vetCase.owner?.phone || '+919839144820'}`}
                className="font-mono font-bold text-[#1B5E3C] flex items-center gap-1 hover:underline"
              >
                <Phone size={12} />
                <span>{vetCase.owner?.phone || '+91 98391 44820'}</span>
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500">INAPH Owner ID:</span>
              <span className="font-mono text-stone-700">IN-2024-88419</span>
            </div>
          </div>
        </div>

        {/* Card C: Reported Clinical Triage */}
        <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <span className="text-xs font-mono font-bold uppercase text-[#C62828] flex items-center gap-1.5">
              <ShieldAlert size={14} />
              REPORTED SYMPTOMS
            </span>
            <span className="text-[10px] font-mono font-bold text-[#C62828] bg-[#FDF0EE] px-1.5 py-0.2 rounded">
              {vetCase.reported_severity}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {vetCase.symptoms.map((s, idx) => (
              <span
                key={idx}
                className="text-xs font-semibold px-2 py-0.5 bg-stone-100 border border-stone-200 rounded text-stone-800"
              >
                {s}
              </span>
            ))}
          </div>

          {vetCase.description && (
            <p className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-[2px] border border-stone-100 font-sans italic">
              &ldquo;{vetCase.description}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* 4.5. Decision-Support Health Risk Assessment Widget */}
      <ExplainableRiskWidget vetCase={vetCase} />

      {/* 4.6. Advanced AI & Disease Intelligence Dossier (Stage 10) */}
      <ExplainableIntelligencePanel
        caseId={vetCase.id}
        userRole="veterinarian"
        veterinarianName="Dr. Priya Sharma"
        onPriorityOverridden={(newPrio) => {
          // Sync priority pill if mapped
          if (newPrio === 'CRITICAL REVIEW') setCurrentPriority('CRITICAL')
          else if (newPrio === 'URGENT REVIEW') setCurrentPriority('HIGH')
          else if (newPrio === 'PRIORITY REVIEW') setCurrentPriority('MEDIUM')
          else setCurrentPriority('LOW')
        }}
      />

      {/* 5. GIS Case Location Map */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#102A43] flex items-center gap-1.5">
            <MapPin size={14} className="text-[#C62828]" />
            GIS CASE LOCATION &middot; स्थल मानचित्र
          </h3>
          <span className="text-[11px] font-mono text-stone-500">
            DISPATCH COORD: {vetCase.latitude || 25.3176}, {vetCase.longitude || 82.9739}
          </span>
        </div>

        <CaseLocationMap
          latitude={vetCase.latitude || 25.3176}
          longitude={vetCase.longitude || 82.9739}
          animalTag={vetCase.animal?.animal_tag || 'Animal'}
          village={vetCase.village || 'Rampur Khurd'}
          district={vetCase.district || 'Varanasi'}
          height="220px"
        />
      </div>

      {/* 6. Clinical Tabs */}
      <div className="flex items-center gap-1 border-b border-stone-300 font-mono text-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('clinical')}
          className={`px-4 py-2.5 border-b-2 font-bold whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'clinical'
              ? 'border-[#102A43] text-[#102A43] bg-white'
              : 'border-transparent text-stone-600 hover:text-[#102A43]'
          }`}
        >
          CLINICAL EXAMINATION &bull; परीक्षण
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('samples')}
          className={`px-4 py-2.5 border-b-2 font-bold whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'samples'
              ? 'border-[#102A43] text-[#102A43] bg-white'
              : 'border-transparent text-stone-600 hover:text-[#102A43]'
          }`}
        >
          SAMPLES &amp; LAB ({vetCase.samples?.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rx')}
          className={`px-4 py-2.5 border-b-2 font-bold whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'rx'
              ? 'border-[#102A43] text-[#102A43] bg-white'
              : 'border-transparent text-stone-600 hover:text-[#102A43]'
          }`}
        >
          PRESCRIPTIONS ({vetCase.treatments?.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2.5 border-b-2 font-bold whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'notes'
              ? 'border-[#102A43] text-[#102A43] bg-white'
              : 'border-transparent text-stone-600 hover:text-[#102A43]'
          }`}
        >
          CASE NOTES ({vetCase.notes?.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2.5 border-b-2 font-bold whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'timeline'
              ? 'border-[#102A43] text-[#102A43] bg-white'
              : 'border-transparent text-stone-600 hover:text-[#102A43]'
          }`}
        >
          CASE TIMELINE
        </button>
      </div>

      {/* 7. Tab Contents */}

      {/* TAB 1: CLINICAL EXAMINATION */}
      {activeTab === 'clinical' && (
        <div className="space-y-4">
          {/* Stage 11 IoT Smart Telemetry Card (if available) */}
          {iotReadings.length > 0 && (
            <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs border-l-4 border-l-[#1B5E3C] space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase bg-[#1B5E3C] text-white px-2 py-0.5 rounded">
                    STAGE 11 IOT SENSOR STREAM
                  </span>
                  <span className="text-[10px] font-mono bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-bold">
                    DEMO SENSOR DATA
                  </span>
                </div>
                <Link
                  to="/vet/iot"
                  className="text-xs text-[#102A43] font-semibold hover:underline flex items-center gap-1 font-mono"
                >
                  IoT Triage &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {iotReadings.slice(0, 4).map((r) => (
                  <div key={r.id} className="p-2.5 bg-stone-50 border border-stone-200 rounded">
                    <span className="text-[10px] text-stone-500 font-mono uppercase block">{r.measurement_type}</span>
                    <span className="text-base font-bold font-mono text-stone-900">{r.value} {r.unit}</span>
                    <span className={`text-[9px] font-mono block mt-0.5 ${r.is_flagged_for_review ? 'text-red-700 font-bold' : 'text-emerald-700'}`}>
                      {r.is_flagged_for_review ? 'FLAGGED ANOMALOUS' : 'NORMAL RANGE'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historical examinations logged */}
          {vetCase.examinations && vetCase.examinations.length > 0 && (
            <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase text-[#102A43] border-b border-stone-200 pb-2">
                LOGGED CLINICAL EXAMINATIONS ({vetCase.examinations.length})
              </h3>

              <div className="space-y-3">
                {vetCase.examinations.map((ex) => (
                  <div key={ex.id} className="p-3 bg-stone-50 border border-stone-200 rounded-[2px] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#102A43]">
                        Examined by {ex.veterinarian_name}
                      </span>
                      <span className="font-mono text-stone-500">
                        {new Date(ex.examined_at).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-stone-200 font-mono">
                      <div>
                        <span className="text-stone-500 block">Temperature:</span>
                        <strong className="text-[#C62828]">{ex.temperature ? `${ex.temperature} °${ex.temperature_unit || 'F'}` : 'Not taken'}</strong>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Behaviour:</span>
                        <strong className="text-stone-800">{ex.behaviour || 'Normal'}</strong>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Appetite:</span>
                        <strong className="text-stone-800">{ex.appetite || 'Normal'}</strong>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Hydration:</span>
                        <strong className="text-stone-800">{ex.hydration || 'Normal'}</strong>
                      </div>
                    </div>

                    {ex.physical_observations && (
                      <p className="text-stone-700 bg-white p-2 rounded border border-stone-200">
                        <strong>Clinical Observations:</strong> {ex.physical_observations}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Record New Examination Form */}
          <div className="bg-white border border-stone-300 p-4 sm:p-5 rounded-[2px] shadow-xs space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase text-[#102A43] border-b border-stone-200 pb-2">
              RECORD CLINICAL EXAMINATION &middot; नया परीक्षण दर्ज करें
            </h3>

            <form onSubmit={handleSaveExam} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Temperature */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 font-sans">
                    Body Temperature (शरीर का तापमान)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={temp}
                      onChange={(e) => setTemp(e.target.value)}
                      placeholder="e.g. 103.5"
                      className="flex-1 px-3 py-1.5 border border-stone-300 rounded-[2px] text-xs font-mono"
                    />
                    <select
                      value={tempUnit}
                      onChange={(e) => setTempUnit(e.target.value as 'F' | 'C')}
                      className="px-2 py-1.5 border border-stone-300 rounded-[2px] text-xs font-mono"
                    >
                      <option value="F">°F</option>
                      <option value="C">°C</option>
                    </select>
                  </div>
                  <span className="text-[10px] text-stone-500">Normal cattle temp: ~101.5 °F</span>
                </div>

                {/* Behaviour */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 font-sans">
                    Behaviour (व्यवहार)
                  </label>
                  <select
                    value={behaviour}
                    onChange={(e) => setBehaviour(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-[2px] text-xs"
                  >
                    <option value="Alert">Alert (सचेत)</option>
                    <option value="Dull">Dull (सुस्त)</option>
                    <option value="Depressed">Depressed (उदासीन)</option>
                    <option value="Excited">Excited (उत्तेजित)</option>
                    <option value="Recumbent">Recumbent (बैठा हुआ / असमर्थ)</option>
                  </select>
                </div>

                {/* Appetite */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 font-sans">
                    Appetite &amp; Feed (भूख एवं चारा)
                  </label>
                  <select
                    value={appetite}
                    onChange={(e) => setAppetite(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-[2px] text-xs"
                  >
                    <option value="Normal">Normal (सामान्य)</option>
                    <option value="Reduced">Reduced (कम)</option>
                    <option value="Anorexic/Off-feed">Anorexic/Off-feed (चारा बंद)</option>
                  </select>
                </div>

                {/* Hydration */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 font-sans">
                    Hydration Status
                  </label>
                  <select
                    value={hydration}
                    onChange={(e) => setHydration(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-[2px] text-xs"
                  >
                    <option value="Normal">Normal Hydration</option>
                    <option value="Mild Dehydration">Mild Dehydration (हल्का निर्जलीकरण)</option>
                    <option value="Severe Dehydration">Severe Dehydration (गंभीर निर्जलीकरण)</option>
                  </select>
                </div>

                {/* Respiratory */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 font-sans">
                    Respiratory Condition
                  </label>
                  <select
                    value={respiratory}
                    onChange={(e) => setRespiratory(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-[2px] text-xs"
                  >
                    <option value="Normal">Normal Eupnea</option>
                    <option value="Dyspnea/Rapid">Dyspnea / Rapid Breathing</option>
                    <option value="Wheezing/Cough">Wheezing / Coughing</option>
                    <option value="Stridor">Stridor / Upper Airway Sound</option>
                  </select>
                </div>

                {/* Mucous Membrane */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 font-sans">
                    Mucous Membrane
                  </label>
                  <select
                    value={mucous}
                    onChange={(e) => setMucous(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-[2px] text-xs"
                  >
                    <option value="Normal Pink">Normal Pink</option>
                    <option value="Congested/Red">Congested / Hyperemic (Red)</option>
                    <option value="Pale">Pale / Anemic</option>
                    <option value="Icteric/Yellow">Icteric / Jaundiced (Yellow)</option>
                  </select>
                </div>
              </div>

              {/* Physical observations */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 font-sans">
                  Clinical Examination &amp; Auscultation Findings
                </label>
                <textarea
                  rows={2}
                  value={physicalObs}
                  onChange={(e) => setPhysicalObs(e.target.value)}
                  placeholder="Record heart rate, lung sounds, ruminal motility, lymph node enlargement, skin lesions..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-[2px] text-xs text-stone-800"
                />
              </div>

              <div className="flex justify-end font-mono">
                <button
                  type="submit"
                  disabled={savingExam}
                  className="px-4 py-2 bg-[#102A43] hover:bg-[#1B5E3C] text-white text-xs font-bold rounded-[2px] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {savingExam ? 'SAVING EXAM...' : 'SAVE CLINICAL EXAMINATION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: SAMPLES & LAB REFERRALS */}
      {activeTab === 'samples' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h3 className="text-xs font-mono font-bold uppercase text-[#102A43]">
                DIAGNOSTIC SAMPLE COLLECTION &amp; LAB TRACKING
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSampleModal(true)}
                  className="px-3 py-1 bg-[#102A43] hover:bg-[#1B5E3C] text-white text-xs font-bold rounded-[2px] font-mono cursor-pointer"
                >
                  + REQUEST SAMPLE
                </button>
                {vetCase.samples && vetCase.samples.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowLabModal(true)}
                    className="px-3 py-1 bg-[#8A6A3D] hover:bg-[#70552F] text-white text-xs font-bold rounded-[2px] font-mono cursor-pointer"
                  >
                    + CREATE LAB REFERRAL
                  </button>
                )}
              </div>
            </div>

            {/* Samples List */}
            {(!vetCase.samples || vetCase.samples.length === 0) ? (
              <p className="text-xs text-stone-500 py-6 text-center">
                No diagnostic samples requested for this case yet. Click &ldquo;Request Sample&rdquo; to initiate collection.
              </p>
            ) : (
              <div className="space-y-3">
                {vetCase.samples.map((smp) => (
                  <div key={smp.id} className="p-3 bg-stone-50 border border-stone-200 rounded-[2px] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#102A43]">{smp.sample_number}</span>
                        <span className="font-mono text-[10px] bg-white border border-stone-200 px-1.5 py-0.2 rounded font-bold">
                          {smp.sample_type}
                        </span>
                        <PriorityBadge priority={smp.priority} size="sm" />
                      </div>
                      <span className="font-mono font-bold text-[#8A6A3D]">{smp.status}</span>
                    </div>

                    <p className="text-stone-700">
                      <strong>Instructions:</strong> {smp.collection_instructions || 'Standard sterile protocol'}
                    </p>
                    <p className="text-[11px] text-stone-500 font-mono">
                      Requested by {smp.requested_by} on {smp.requested_date}
                      {smp.notes && ` · Notes: ${smp.notes}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lab Referrals & Results */}
          <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase text-[#102A43] border-b border-stone-200 pb-2">
              LAB REFERRALS &amp; INTERPRETED RESULTS
            </h3>

            {(!vetCase.lab_referrals || vetCase.lab_referrals.length === 0) ? (
              <p className="text-xs text-stone-500 py-6 text-center">
                No laboratory referrals registered.
              </p>
            ) : (
              <div className="space-y-3">
                {vetCase.lab_referrals.map((ref) => (
                  <div key={ref.id} className="p-3.5 bg-stone-50 border border-stone-200 rounded-[2px] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#102A43]">{ref.referral_number}</span>
                        <span className="font-bold text-stone-800">&middot; {ref.lab_name}</span>
                      </div>
                      <span className="font-mono text-[10px] bg-[#EBF5EE] text-[#1B5E3C] border border-[#2E7D32]/30 px-2 py-0.5 rounded font-bold">
                        {ref.status}
                      </span>
                    </div>

                    <p className="text-stone-700">
                      <strong>Requested Assay:</strong> {ref.test_requested}
                    </p>

                    {/* Result if uploaded */}
                    {ref.result ? (
                      <div className="mt-2 p-3 bg-white border border-stone-300 rounded-[2px] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-[#102A43]">
                            RESULT: {ref.result.result_status.toUpperCase()}
                          </span>
                          <span className="font-mono text-[10px] text-stone-500">
                            {ref.result.result_date}
                          </span>
                        </div>
                        <p className="text-stone-800">
                          <strong>Finding:</strong> {ref.result.result_summary}
                        </p>
                        <p className="text-[#102A43] bg-stone-50 p-2 rounded border border-stone-200">
                          <strong>Veterinarian Clinical Interpretation:</strong> {ref.result.veterinarian_interpretation}
                        </p>
                      </div>
                    ) : (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveRefId(ref.id)
                            setShowResultModal(true)
                          }}
                          className="px-3 py-1 bg-[#102A43] hover:bg-[#1B5E3C] text-white text-[11px] font-mono font-bold rounded-[2px] cursor-pointer"
                        >
                          + ENTER &amp; INTERPRET RESULT
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PRESCRIPTIONS */}
      {activeTab === 'rx' && (
        <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <h3 className="text-xs font-mono font-bold uppercase text-[#102A43]">
              PRESCRIBED TREATMENTS &amp; DRUG REGIMENS
            </h3>
            <button
              type="button"
              onClick={() => setShowTreatmentModal(true)}
              className="px-3 py-1 bg-[#1B5E3C] hover:bg-[#123C2A] text-white text-xs font-bold rounded-[2px] font-mono cursor-pointer flex items-center gap-1"
            >
              <Plus size={13} />
              <span>ISSUE PRESCRIPTION</span>
            </button>
          </div>

          {(!vetCase.treatments || vetCase.treatments.length === 0) ? (
            <p className="text-xs text-stone-500 py-6 text-center">
              No clinical treatments prescribed for this animal yet. Click &ldquo;Issue Prescription&rdquo; to record drug courses.
            </p>
          ) : (
            <div className="space-y-3">
              {vetCase.treatments.map((t) => (
                <div key={t.id} className="p-3.5 bg-stone-50 border border-stone-200 rounded-[2px] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#102A43]">
                      CONDITION: {t.condition}
                    </span>
                    <span className="font-mono text-[10px] bg-white border border-stone-200 px-2 py-0.5 rounded text-stone-600">
                      {t.start_date} &rarr; {t.end_date || 'Active'}
                    </span>
                  </div>

                  <p className="text-[#1B5E3C] font-bold text-sm">
                    {t.medicine}
                  </p>
                  {t.dosage && (
                    <p className="font-mono text-stone-700">
                      <strong>Dosage &amp; Frequency:</strong> {t.dosage}
                    </p>
                  )}
                  {t.notes && (
                    <p className="text-stone-600 italic">
                      <strong>Advisory:</strong> {t.notes}
                    </p>
                  )}
                  <p className="text-[11px] text-stone-500 font-mono border-t border-stone-200 pt-1">
                    Issued by: {t.veterinarian_name || 'Government Veterinary Officer'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: VETERINARY NOTES */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          {/* Add Note Form */}
          <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase text-[#102A43] border-b border-stone-200 pb-2">
              ADD INTERNAL CASE NOTE &middot; आंतरिक केस नोट (NOT VISIBLE TO FARMERS)
            </h3>

            <form onSubmit={handleSaveNote} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 font-sans">
                    Note Classification
                  </label>
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-[2px] text-xs font-sans"
                  >
                    <option value="Clinical Observation">Clinical Observation</option>
                    <option value="General Observation">General Observation</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Treatment">Treatment</option>
                    <option value="Lab">Lab</option>
                    <option value="Administrative">Administrative</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 font-sans">
                  Clinical Commentary &amp; Triage Plan
                </label>
                <textarea
                  rows={3}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Record observations, client discussions, differential diagnoses, or MVU instructions..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-[2px] text-xs text-stone-800"
                  required
                />
              </div>

              <div className="flex justify-end font-mono">
                <button
                  type="submit"
                  disabled={savingNote}
                  className="px-4 py-2 bg-[#102A43] hover:bg-[#1B5E3C] text-white text-xs font-bold rounded-[2px] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {savingNote ? 'SAVING NOTE...' : 'APPEND VET NOTE'}
                </button>
              </div>
            </form>
          </div>

          {/* Offline Draft Notes Alert Banner */}
          {localDraftNotes.length > 0 && (
            <div className="bg-[#FFFDF7] border-2 border-[#E0A11A] p-3.5 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-2.5">
                <WifiOff size={18} className="text-[#8C5D00] shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-[#FFF3D6] text-[#8C5D00] px-1.5 py-0.2 rounded-[1px] uppercase">
                      {localDraftNotes.length} OFFLINE DRAFT NOTE(S)
                    </span>
                    <span className="text-[10px] font-mono text-stone-500">
                      STORED IN LOCAL INDEXEDDB
                    </span>
                  </div>
                  <p className="text-xs text-stone-700 mt-0.5 font-sans">
                    These clinical observations were recorded in field offline mode. Synchronize when connected to update official state registry.
                  </p>
                </div>
              </div>
              {typeof navigator !== 'undefined' && navigator.onLine && (
                <button
                  type="button"
                  onClick={handleSyncDraftNotes}
                  disabled={syncingDrafts}
                  className="px-3 py-1.5 bg-[#1B5E3C] hover:bg-[#123C2A] text-white text-xs font-bold rounded-[2px] font-mono shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[36px]"
                >
                  <RefreshCw size={12} className={syncingDrafts ? 'animate-spin' : ''} />
                  <span>{syncingDrafts ? 'SYNCING...' : 'SYNC DRAFT NOTES'}</span>
                </button>
              )}
            </div>
          )}

          {/* Chronological Notes Feed */}
          <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h3 className="text-xs font-mono font-bold uppercase text-[#102A43]">
                CHRONOLOGICAL CASE NOTES ({(vetCase.notes?.length || 0) + localDraftNotes.length})
              </h3>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-[#1B5E3C] font-semibold">● {vetCase.notes?.length || 0} Synchronized</span>
                {localDraftNotes.length > 0 && (
                  <span className="text-[#8C5D00] font-semibold">● {localDraftNotes.length} Offline Draft</span>
                )}
              </div>
            </div>

            {(!vetCase.notes || vetCase.notes.length === 0) && localDraftNotes.length === 0 ? (
              <p className="text-xs text-stone-500 py-6 text-center">
                No case notes logged.
              </p>
            ) : (
              <div className="space-y-3">
                {/* 1. Offline Draft Notes First */}
                {localDraftNotes.map((d) => (
                  <div key={d.local_id} className="p-3 bg-[#FFFDF7] border-2 border-[#E0A11A]/50 rounded-[2px] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#102A43] bg-white border border-stone-300 px-1.5 py-0.2 rounded text-[10px]">
                          {d.note_type}
                        </span>
                        <span className="text-[9px] font-mono font-bold bg-[#FFF3D6] text-[#8C5D00] border border-[#E0A11A]/60 px-1.5 py-0.2 rounded-[1px]">
                          OFFLINE DRAFT — PENDING SERVER SYNC
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-stone-500">
                        {new Date(d.created_at).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-stone-900 pt-0.5 font-sans font-medium">{d.content}</p>
                    <p className="text-[10px] font-mono text-stone-500 pt-1 border-t border-[#E0A11A]/20">
                      Author: {d.veterinarian_name} &middot; Local Storage Id: {d.local_id.slice(0, 14)}
                    </p>
                  </div>
                ))}

                {/* 2. Confirmed Server Notes */}
                {vetCase.notes?.map((n) => (
                  <div key={n.id} className="p-3 bg-stone-50 border border-stone-200 rounded-[2px] space-y-1 text-xs">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#102A43] bg-white border border-stone-200 px-1.5 py-0.2 rounded text-[10px]">
                          {n.note_type}
                        </span>
                        <span className="text-[9px] font-mono font-bold bg-[#EBF5EE] text-[#1B5E3C] border border-[#1B5E3C]/30 px-1.5 py-0.2 rounded-[1px]">
                          CONFIRMED SYNCHRONIZED NOTE
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-stone-500">
                        {new Date(n.created_at).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-stone-800 pt-1 font-sans">{n.content}</p>
                    <p className="text-[10px] font-mono text-stone-400 pt-1 border-t border-stone-100">
                      Author: {n.veterinarian_name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: CASE TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="bg-white border border-stone-300 p-4 sm:p-5 rounded-[2px] shadow-xs space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase text-[#102A43] border-b border-stone-200 pb-2">
            OFFICIAL CLINICAL CASE TIMELINE
          </h3>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
            {/* 1. Reported */}
            <div className="relative">
              <span className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-[#C62828] border-2 border-white ring-2 ring-[#C62828]/30" />
              <div>
                <p className="text-xs font-bold text-[#102A43]">Health Issue Reported by Farmer</p>
                <p className="text-[11px] font-mono text-stone-500">
                  {new Date(vetCase.reported_at).toLocaleString('en-IN')} &middot; Symptoms: {vetCase.symptoms.join(', ')}
                </p>
              </div>
            </div>

            {/* 2. Assigned */}
            <div className="relative">
              <span className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-[#102A43] border-2 border-white ring-2 ring-[#102A43]/30" />
              <div>
                <p className="text-xs font-bold text-[#102A43]">Case Assigned to Veterinary Officer</p>
                <p className="text-[11px] font-mono text-stone-500">
                  {vetCase.assigned_at ? new Date(vetCase.assigned_at).toLocaleString('en-IN') : 'Automated Triage'} &middot; {vetCase.assigned_vet_name || 'Dr. Priya Sharma'}
                </p>
              </div>
            </div>

            {/* 3. Examination */}
            {vetCase.examinations && vetCase.examinations.length > 0 && (
              <div className="relative">
                <span className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-[#1B5E3C] border-2 border-white ring-2 ring-[#1B5E3C]/30" />
                <div>
                  <p className="text-xs font-bold text-[#1B5E3C]">Clinical Vitals Examination Recorded</p>
                  <p className="text-[11px] font-mono text-stone-500">
                    {new Date(vetCase.examinations[0].examined_at).toLocaleString('en-IN')} &middot; Temp: {vetCase.examinations[0].temperature || 'N/A'} °F
                  </p>
                </div>
              </div>
            )}

            {/* 4. Sample */}
            {vetCase.samples && vetCase.samples.length > 0 && (
              <div className="relative">
                <span className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-[#8A6A3D] border-2 border-white ring-2 ring-[#8A6A3D]/30" />
                <div>
                  <p className="text-xs font-bold text-[#8A6A3D]">Sample Collection Initiated</p>
                  <p className="text-[11px] font-mono text-stone-500">
                    {vetCase.samples[0].sample_number} ({vetCase.samples[0].sample_type}) &middot; Status: {vetCase.samples[0].status}
                  </p>
                </div>
              </div>
            )}

            {/* 5. Treatment */}
            {vetCase.treatments && vetCase.treatments.length > 0 && (
              <div className="relative">
                <span className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-[#2E7D32] border-2 border-white ring-2 ring-[#2E7D32]/30" />
                <div>
                  <p className="text-xs font-bold text-[#2E7D32]">Prescription Issued</p>
                  <p className="text-[11px] font-mono text-stone-500">
                    {vetCase.treatments[0].medicine} &middot; {vetCase.treatments[0].dosage}
                  </p>
                </div>
              </div>
            )}

            {/* 6. Resolution */}
            {vetCase.status === 'Resolved' && (
              <div className="relative">
                <span className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-[#2E7D32] border-2 border-white ring-2 ring-[#2E7D32]/30" />
                <div>
                  <p className="text-xs font-bold text-[#1B5E3C]">Case Resolved &amp; Discharged</p>
                  <p className="text-[11px] font-mono text-stone-500">
                    {vetCase.resolved_at ? new Date(vetCase.resolved_at).toLocaleString('en-IN') : 'Completed'} &middot; {vetCase.resolution_summary}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Request Sample Modal */}
      {showSampleModal && (
        <div className="fixed inset-0 bg-[#102A43]/60 backdrop-blur-xs z-50 flex items-center justify-center p-3">
          <div className="bg-white border border-stone-300 rounded-[2px] max-w-md w-full p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-[#102A43] font-sans border-b border-stone-200 pb-2">
              Request Diagnostic Sample Collection &middot; नमूना संग्रह अनुरोध
            </h3>

            <form onSubmit={handleRequestSample} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Sample Type</label>
                <select
                  value={sampleType}
                  onChange={(e) => setSampleType(e.target.value as SampleType)}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-[2px] text-xs font-sans"
                >
                  <option value="Blood">Blood (रक्त नमूना)</option>
                  <option value="Swab">Nasal / Lesion Swab (स्वाब)</option>
                  <option value="Fecal">Fecal / Dung (मल नमूना)</option>
                  <option value="Urine">Urine (मूत्र)</option>
                  <option value="Tissue">Tissue / Skin Scraping</option>
                  <option value="Milk">Milk (दूध नमूना)</option>
                  <option value="Other">Other Diagnostic Specimen</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Collection Instructions</label>
                <textarea
                  rows={2}
                  value={sampleInstructions}
                  onChange={(e) => setSampleInstructions(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-[2px] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Priority</label>
                  <select
                    value={samplePriority}
                    onChange={(e) => setSamplePriority(e.target.value as CasePriority)}
                    className="w-full px-2.5 py-1.5 border border-stone-300 rounded-[2px] text-xs font-mono"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 font-mono">
                <button
                  type="button"
                  onClick={() => setShowSampleModal(false)}
                  className="px-3 py-1.5 border border-stone-300 text-stone-700 text-xs font-bold rounded-[2px]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={savingSample}
                  className="px-4 py-1.5 bg-[#102A43] text-white text-xs font-bold rounded-[2px] disabled:opacity-50"
                >
                  {savingSample ? 'REQUESTING...' : 'DISPATCH REQUEST'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Lab Referral Modal */}
      {showLabModal && (
        <div className="fixed inset-0 bg-[#102A43]/60 backdrop-blur-xs z-50 flex items-center justify-center p-3">
          <div className="bg-white border border-stone-300 rounded-[2px] max-w-md w-full p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-[#102A43] font-sans border-b border-stone-200 pb-2">
              Create Diagnostic Lab Referral &middot; प्रयोगशाला प्रेषण
            </h3>

            <form onSubmit={handleCreateLabReferral} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Select Sample</label>
                <select
                  value={selectedSampleId}
                  onChange={(e) => setSelectedSampleId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-[2px] text-xs font-mono"
                  required
                >
                  {vetCase.samples?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.sample_number} &middot; {s.sample_type} ({s.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Referral Laboratory</label>
                <select
                  value={referralLab}
                  onChange={(e) => setReferralLab(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-[2px] text-xs font-sans"
                >
                  <option value="District Disease Diagnostic Laboratory (DDDL) Varanasi">
                    District Disease Diagnostic Laboratory (DDDL) Varanasi
                  </option>
                  <option value="Regional Disease Diagnostic Laboratory (RDDL) Bareilly / IVRI">
                    Regional Disease Diagnostic Laboratory (RDDL) Bareilly / IVRI
                  </option>
                  <option value="Central Disease Diagnostic Laboratory (CDDL)">
                    Central Disease Diagnostic Laboratory (CDDL)
                  </option>
                  <option value="State Animal Disease Investigation Center Lucknow">
                    State Animal Disease Investigation Center Lucknow
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Requested Assay / Test</label>
                <input
                  type="text"
                  value={referralTest}
                  onChange={(e) => setReferralTest(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-[2px] text-xs font-sans"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 font-mono">
                <button
                  type="button"
                  onClick={() => setShowLabModal(false)}
                  className="px-3 py-1.5 border border-stone-300 text-stone-700 text-xs font-bold rounded-[2px]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={savingReferral}
                  className="px-4 py-1.5 bg-[#8A6A3D] text-white text-xs font-bold rounded-[2px] disabled:opacity-50"
                >
                  {savingReferral ? 'REFERRING...' : 'DISPATCH TO LAB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Enter & Interpret Lab Result */}
      {showResultModal && (
        <div className="fixed inset-0 bg-[#102A43]/60 backdrop-blur-xs z-50 flex items-center justify-center p-3">
          <div className="bg-white border border-stone-300 rounded-[2px] max-w-lg w-full p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-[#102A43] font-sans border-b border-stone-200 pb-2">
              Record &amp; Interpret Lab Assay Result &middot; जांच परिणाम व्याख्या
            </h3>

            <form onSubmit={handleSaveLabResult} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Result Status</label>
                  <select
                    value={resultStatus}
                    onChange={(e) => setResultStatus(e.target.value as LabResultStatus)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-[2px] text-xs font-mono font-bold"
                  >
                    <option value="Negative">Negative (नकारात्मक)</option>
                    <option value="Positive">Positive (सकारात्मक / पुष्टि)</option>
                    <option value="Inconclusive">Inconclusive (अस्पष्ट)</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Pathogen / Antigen Screen</label>
                  <input
                    type="text"
                    value={pathogen}
                    onChange={(e) => setPathogen(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-[2px] text-xs font-sans"
                    placeholder="e.g. Pasteurella multocida / Negative"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Lab Report Summary</label>
                <textarea
                  rows={2}
                  value={resultSummary}
                  onChange={(e) => setResultSummary(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-[2px] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102A43] mb-1 font-sans">
                  Veterinarian Clinical Interpretation (चिकित्सक व्याख्या) <span className="text-[#C62828]">*</span>
                </label>
                <textarea
                  rows={3}
                  value={interpretation}
                  onChange={(e) => setInterpretation(e.target.value)}
                  placeholder="Record your clinical judgement based on the lab result..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-[2px] text-xs text-stone-800"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 font-mono">
                <button
                  type="button"
                  onClick={() => setShowResultModal(false)}
                  className="px-3 py-1.5 border border-stone-300 text-stone-700 text-xs font-bold rounded-[2px]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={savingResult}
                  className="px-4 py-1.5 bg-[#102A43] text-white text-xs font-bold rounded-[2px] disabled:opacity-50"
                >
                  {savingResult ? 'SAVING...' : 'SAVE INTERPRETATION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Issue Treatment Modal */}
      {showTreatmentModal && (
        <div className="fixed inset-0 bg-[#102A43]/60 backdrop-blur-xs z-50 flex items-center justify-center p-3">
          <div className="bg-white border border-stone-300 rounded-[2px] max-w-lg w-full p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-[#102A43] font-sans border-b border-stone-200 pb-2">
              Issue Veterinary Clinical Prescription &middot; औषध पर्ची
            </h3>

            <form onSubmit={handleSaveTreatment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Diagnosed Condition</label>
                <input
                  type="text"
                  value={rxCondition}
                  onChange={(e) => setRxCondition(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-[2px] text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Medicines &amp; Formulations</label>
                <input
                  type="text"
                  value={rxMedicine}
                  onChange={(e) => setRxMedicine(e.target.value)}
                  placeholder="e.g. Meloxicam + Paracetamol 15ml & Enrofloxacin 10%"
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-[2px] text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Dosage &amp; Administration Frequency</label>
                <input
                  type="text"
                  value={rxDosage}
                  onChange={(e) => setRxDosage(e.target.value)}
                  placeholder="e.g. 15ml IM daily for 3 days"
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-[2px] text-xs font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={rxStartDate}
                    onChange={(e) => setRxStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-[2px] text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Course End Date</label>
                  <input
                    type="date"
                    value={rxEndDate}
                    onChange={(e) => setRxEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-[2px] text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Instructions &amp; Withholding Period</label>
                <textarea
                  rows={2}
                  value={rxInstructions}
                  onChange={(e) => setRxInstructions(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-[2px] text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 font-mono">
                <button
                  type="button"
                  onClick={() => setShowTreatmentModal(false)}
                  className="px-3 py-1.5 border border-stone-300 text-stone-700 text-xs font-bold rounded-[2px]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={savingRx}
                  className="px-4 py-1.5 bg-[#1B5E3C] text-white text-xs font-bold rounded-[2px] disabled:opacity-50"
                >
                  {savingRx ? 'RECORDING RX...' : 'PRESCRIBE & SYNC TO FARMER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Case Resolution Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-[#102A43]/60 backdrop-blur-xs z-50 flex items-center justify-center p-3">
          <div className="bg-white border border-stone-300 rounded-[2px] max-w-lg w-full p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-[#102A43] font-sans border-b border-stone-200 pb-2">
              Finalize &amp; Resolve Clinical Case &middot; प्रकरण समाधान
            </h3>

            <form onSubmit={handleFinalizeResolution} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Final Status Outcome</label>
                <select
                  value={finalStatus}
                  onChange={(e) => setFinalStatus(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-[2px] text-xs font-bold"
                >
                  <option value="Resolved">Resolved (पूर्ण स्वस्थ / समाधान)</option>
                  <option value="Monitoring">Monitoring (सतत निगरानी)</option>
                  <option value="Rejected">Rejected / False Alarm (खारिज)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Resolution Summary &amp; Discharge Notes</label>
                <textarea
                  rows={3}
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-[2px] text-xs"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="followUpCheck"
                  checked={followUpReq}
                  onChange={(e) => setFollowUpReq(e.target.checked)}
                  className="rounded-[2px] accent-[#1B5E3C]"
                />
                <label htmlFor="followUpCheck" className="text-xs font-bold text-stone-700 cursor-pointer">
                  Schedule follow-up visit by Mobile Veterinary Unit (MVU)
                </label>
              </div>

              {followUpReq && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Follow-up Date</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-[2px] text-xs font-mono"
                    required
                  />
                </div>
              )}

              {/* Offline Resolution Block Notice */}
              {typeof navigator !== 'undefined' && !navigator.onLine && (
                <div className="bg-[#FFF8F7] border border-[#C62828] p-3 rounded-[2px] text-xs text-[#7B1818] space-y-1">
                  <p className="font-bold font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <WifiOff size={14} className="text-[#C62828]" />
                    OFFLINE RESOLUTION RESTRICTION
                  </p>
                  <p>
                    Case resolution cannot be finalized while working offline. State animal disease surveillance standards require live connectivity to verify biosecurity audit trails and notify the livestock owner.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 font-mono">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-3 py-1.5 border border-stone-300 text-stone-700 text-xs font-bold rounded-[2px]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={savingResolution || (typeof navigator !== 'undefined' && !navigator.onLine)}
                  className="px-4 py-1.5 bg-[#2E7D32] text-white text-xs font-bold rounded-[2px] disabled:opacity-50 disabled:bg-stone-400 cursor-pointer"
                >
                  {savingResolution ? 'FINALIZING...' : 'FINALIZE & CLOSE CASE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
