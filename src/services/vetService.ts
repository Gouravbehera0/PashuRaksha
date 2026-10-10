// ============================================================
// PASHURAKSHA (पशुरक्षा) — VETERINARY INTELLIGENCE SERVICE
// Stage 3: Clinical Case Management, Triage, Diagnostics & Rx
// ============================================================

import { supabase } from '@/lib/supabase'
import { getAnimalById, updateAnimalHealthStatus } from '@/services/animalService'
import { getTreatmentsByAnimalId } from '@/services/treatmentService'
import { getVaccinationsByAnimalId } from '@/services/vaccinationService'
import type {
  VeterinaryCase,
  VetCaseStatus,
  CasePriority,
  CaseExamination,
  CaseNote,
  SampleRequest,
  LabReferral,
  LabResult,
  AuditLog,
  VetKPIStats,
  FarmerProfileView,
  Animal,
  Treatment
} from '@/types'

// In-memory persistent store for development & offline evaluation
let inMemoryCases: VeterinaryCase[] = [
  {
    id: 'case-001',
    case_number: 'PR-CASE-2048',
    report_id: 'sr001-fever-cough',
    animal_id: 'a003-demo-gir-heifer',
    owner_id: 'demo-farmer',
    assigned_vet_id: 'demo-vet',
    assigned_vet_name: 'Dr. Priya Sharma (Veterinary Officer)',
    status: 'Veterinary Review',
    priority: 'HIGH',
    symptoms: ['Fever', 'Cough', 'Loss of Appetite'],
    reported_severity: 'Severe',
    description: 'High body temperature observed since morning with nasal discharge and reduced water intake.',
    village: 'Rampur Khurd',
    district: 'Varanasi',
    latitude: 25.3176,
    longitude: 82.9739,
    reported_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    assigned_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
  {
    id: 'case-002',
    case_number: 'PR-CASE-2049',
    report_id: 'sr002-swelling',
    animal_id: 'a002-demo-murrah-buf',
    owner_id: 'demo-farmer',
    assigned_vet_id: 'demo-vet',
    assigned_vet_name: 'Dr. Priya Sharma (Veterinary Officer)',
    status: 'Sample Required',
    priority: 'MEDIUM',
    symptoms: ['Swelling', 'Lethargy'],
    reported_severity: 'Moderate',
    description: 'Right hind leg swelling observed after grazing. Animal is limping slightly.',
    village: 'Rampur Khurd',
    district: 'Varanasi',
    latitude: 25.3190,
    longitude: 82.9720,
    reported_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    assigned_at: new Date(Date.now() - 36 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: 'case-003',
    case_number: 'PR-CASE-2050',
    animal_id: 'a001-demo-gir-cow',
    owner_id: 'demo-farmer',
    assigned_vet_name: 'Dr. Priya Sharma (Veterinary Officer)',
    status: 'Reported',
    priority: 'CRITICAL',
    symptoms: ['Blisters or Ulcers in Mouth/Hooves', 'Excessive Salivation / Drooling', 'Fever'],
    reported_severity: 'Severe',
    description: 'Oral lesions observed with ropy salivation. Rapid drop in milk. Needs urgent MVU inspection.',
    village: 'Rampur Khurd',
    district: 'Varanasi',
    latitude: 25.3180,
    longitude: 82.9745,
    reported_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
  {
    id: 'case-004',
    case_number: 'PR-CASE-2051',
    animal_id: 'a004-demo-barbari-goat',
    owner_id: 'demo-farmer',
    assigned_vet_id: 'demo-vet',
    assigned_vet_name: 'Dr. Anand Verma (MVU)',
    status: 'Monitoring',
    priority: 'MEDIUM',
    symptoms: ['Cough', 'Nasal Discharge', 'Lethargy'],
    reported_severity: 'Moderate',
    description: 'Spasmodic cough in doe flock. Grazed near riverside pastures.',
    village: 'Chiraigaon',
    district: 'Varanasi',
    latitude: 25.3780,
    longitude: 83.0320,
    reported_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'case-005',
    case_number: 'PR-CASE-2052',
    animal_id: 'a004-demo-barbari-goat',
    owner_id: 'demo-farmer',
    assigned_vet_id: 'demo-vet',
    assigned_vet_name: 'Dr. Anand Verma (MVU)',
    status: 'Treatment',
    priority: 'LOW',
    symptoms: ['Cough', 'Lethargy'],
    reported_severity: 'Mild',
    description: 'Mild respiratory wheezing in kid. Oral rehydration and antibiotic provided.',
    village: 'Chiraigaon',
    district: 'Varanasi',
    latitude: 25.3795,
    longitude: 83.0310,
    reported_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'case-006',
    case_number: 'PR-CASE-2053',
    animal_id: 'a001-demo-gir-cow',
    owner_id: 'demo-farmer',
    assigned_vet_name: 'Dr. Priya Sharma (Veterinary Officer)',
    status: 'Resolved',
    priority: 'HIGH',
    symptoms: ['Fever', 'Loss of Appetite'],
    reported_severity: 'Severe',
    description: 'Post-parturient fever resolved after calcium borogluconate & antibiotic therapy.',
    village: 'Shivpur',
    district: 'Varanasi',
    latitude: 25.3520,
    longitude: 82.9640,
    reported_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    resolved_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    resolution_summary: 'Full recovery confirmed on examination. Normal milk yield restored.',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'case-007',
    case_number: 'PR-CASE-2054',
    animal_id: 'a005-demo-poultry',
    owner_id: 'demo-farmer',
    assigned_vet_name: 'Dr. Priya Sharma (Veterinary Officer)',
    status: 'Resolved',
    priority: 'LOW',
    symptoms: ['Lethargy', 'Sudden Drop in Production'],
    reported_severity: 'Mild',
    description: 'Flock stress due to heat wave. Electrolyte supplementation completed.',
    village: 'Cholapur',
    district: 'Varanasi',
    latitude: 25.4120,
    longitude: 82.9890,
    reported_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    resolved_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    resolution_summary: 'Flock vitals stable. Production back to baseline.',
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'case-008',
    case_number: 'PR-CASE-2055',
    animal_id: 'a002-demo-murrah-buf',
    owner_id: 'demo-farmer',
    status: 'Reported',
    priority: 'MEDIUM',
    symptoms: ['Bloat', 'Abdominal Pain'],
    reported_severity: 'Moderate',
    description: 'Acute tympany reported by farmer via phone call. Location reported verbally as Mirzapur Sadar without GPS lock.',
    village: 'Mirzapur Sadar',
    district: 'Mirzapur',
    // DELIBERATELY UNMAPPED — Coordinates missing to test unmapped cases handling
    latitude: undefined,
    longitude: undefined,
    reported_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'case-009',
    case_number: 'PR-CASE-2056',
    animal_id: 'a006-demo-nali-sheep',
    owner_id: 'demo-farmer',
    status: 'Reported',
    priority: 'LOW',
    symptoms: ['Skin Itching / Wool Loss'],
    reported_severity: 'Mild',
    description: 'Ectoparasitic dermatitis reported from dry pasture belt. GPS location disabled by reporting user.',
    village: 'Bhadohi Rural',
    district: 'Bhadohi',
    // DELIBERATELY UNMAPPED — Coordinates missing to test unmapped cases handling
    latitude: undefined,
    longitude: undefined,
    reported_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
]

let inMemoryExaminations: CaseExamination[] = [
  {
    id: 'exam-001',
    case_id: 'case-001',
    veterinarian_name: 'Dr. Priya Sharma',
    temperature: 104.2,
    temperature_unit: 'F',
    observed_symptoms: ['Fever', 'Cough', 'Nasal Congestion'],
    physical_observations: 'Mucopurulent nasal discharge from both nostrils. Auscultation reveals broncho-vesicular sounds in anterior lung fields.',
    behaviour: 'Dull',
    appetite: 'Reduced',
    hydration: 'Mild Dehydration',
    respiratory_condition: 'Dyspnea/Rapid',
    mucous_membrane: 'Congested/Red',
    other_observations: 'Ruminal motility slightly sluggish (1 cycle per 2 minutes).',
    examined_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
]

let inMemoryNotes: CaseNote[] = [
  {
    id: 'note-001',
    case_id: 'case-001',
    veterinarian_name: 'Dr. Priya Sharma',
    note_type: 'Clinical Observation',
    content: 'Patient responded with mild discomfort during deep palpation of thoracic cage. Prescribed antipyretic meloxicam + paracetamol and broad spectrum antibiotic cover.',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'note-002',
    case_id: 'case-001',
    veterinarian_name: 'Dr. Priya Sharma',
    note_type: 'Administrative',
    content: 'Advised owner to isolate heifer in shaded stall and withhold common grazing for 72 hours.',
    created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
]

let inMemorySamples: SampleRequest[] = [
  {
    id: 'smp-001',
    sample_number: 'SMP-2026-0081',
    case_id: 'case-002',
    animal_id: 'a002-demo-murrah-buf',
    sample_type: 'Blood',
    collection_instructions: 'Collect 5ml whole blood in EDTA vial and 5ml in plain serum vial under sterile precautions.',
    priority: 'HIGH',
    requested_by: 'Dr. Priya Sharma',
    requested_date: '2026-10-06',
    status: 'Sent to Lab',
    notes: 'Rule out blood protozoan parasites (Trypanosomiasis / Theileriosis).',
    collected_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 36 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
]

let inMemoryLabReferrals: LabReferral[] = [
  {
    id: 'ref-001',
    referral_number: 'REF-2026-0042',
    case_id: 'case-002',
    sample_id: 'smp-001',
    lab_name: 'District Disease Diagnostic Laboratory (DDDL) Varanasi',
    test_requested: 'Blood Smear Examination (Giemsa stain) & Complete Hemogram',
    requested_by: 'Dr. Priya Sharma',
    referral_date: '2026-10-06',
    priority: 'HIGH',
    status: 'Result Uploaded',
    notes: 'Cold chain maintained in thermal container with ice gel packs.',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    result: {
      id: 'res-001',
      referral_id: 'ref-001',
      case_id: 'case-002',
      lab_name: 'District Disease Diagnostic Laboratory (DDDL) Varanasi',
      test_name: 'Blood Smear & Protozoan Screen',
      result_status: 'Negative',
      result_summary: 'No haemoprotozoa detected on thin and thick blood smears. Mild leukocytosis noted (11,800 /uL).',
      pathogen_identified: 'Negative for Blood Parasites',
      result_date: '2026-10-07',
      veterinarian_interpretation: 'Traumatic contusion with localized soft tissue inflammation. Infection ruled out; continue topical anti-inflammatory therapy.',
      created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    },
  },
]

let inMemoryAuditLogs: AuditLog[] = [
  {
    id: 'aud-001',
    user_id: 'demo-vet',
    user_name: 'Dr. Priya Sharma',
    user_role: 'veterinarian',
    action: 'Case Assigned',
    case_id: 'case-001',
    details: 'Case PR-CASE-2048 assigned to Sadar Veterinary Hospital triage queue.',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'aud-002',
    user_id: 'demo-vet',
    user_name: 'Dr. Priya Sharma',
    user_role: 'veterinarian',
    action: 'Examination Recorded',
    case_id: 'case-001',
    details: 'Clinical vitals recorded: Temp 104.2 F, auscultation abnormal.',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
]

/**
 * Fetch all veterinary cases with optional filters
 */
export async function getVetCases(filters?: {
  status?: string
  priority?: string
  village?: string
  search?: string
}): Promise<VeterinaryCase[]> {
  try {
    let query = supabase
      .from('veterinary_cases')
      .select('*, animal:animals(*)')
      .order('created_at', { ascending: false })

    if (filters?.status && filters.status !== 'All') {
      query = query.eq('status', filters.status)
    }
    if (filters?.priority && filters.priority !== 'All') {
      query = query.eq('priority', filters.priority)
    }

    const { data, error } = await query
    if (error) throw error
    if (data && data.length > 0) return data as VeterinaryCase[]
  } catch (err) {
    console.warn('[VetService] Supabase cases query notice:', err)
  }

  // Session fallback with filter application
  let list = [...inMemoryCases]

  if (filters?.status && filters.status !== 'All') {
    list = list.filter((c) => c.status === filters.status)
  }
  if (filters?.priority && filters.priority !== 'All') {
    list = list.filter((c) => c.priority === filters.priority)
  }
  if (filters?.village && filters.village !== 'All') {
    list = list.filter((c) => c.village?.toLowerCase() === filters.village?.toLowerCase())
  }
  if (filters?.search) {
    const s = filters.search.toLowerCase()
    list = list.filter(
      (c) =>
        c.case_number.toLowerCase().includes(s) ||
        c.village?.toLowerCase().includes(s) ||
        c.symptoms.some((sym) => sym.toLowerCase().includes(s))
    )
  }

  // Hydrate animal data for in-memory cases
  for (const c of list) {
    if (!c.animal) {
      c.animal = (await getAnimalById(c.animal_id)) || undefined
    }
  }

  return list
}

/**
 * Fetch a single case by ID with all clinical sub-records
 */
export async function getVetCaseById(caseId: string): Promise<VeterinaryCase | null> {
  try {
    const { data, error } = await supabase
      .from('veterinary_cases')
      .select(`
        *,
        animal:animals(*),
        examinations:case_examinations(*),
        notes:case_notes(*),
        samples:sample_requests(*),
        lab_referrals:lab_referrals(*, result:lab_results(*))
      `)
      .eq('id', caseId)
      .single()

    if (error) throw error
    if (data) return data as VeterinaryCase
  } catch (err) {
    console.warn('[VetService] Supabase single case query notice:', err)
  }

  // Session fallback
  const c = inMemoryCases.find((x) => x.id === caseId || x.case_number === caseId)
  if (!c) return null

  const animal = await getAnimalById(c.animal_id)
  const examinations = inMemoryExaminations.filter((e) => e.case_id === c.id)
  const notes = inMemoryNotes.filter((n) => n.case_id === c.id)
  const samples = inMemorySamples.filter((s) => s.case_id === c.id)
  const lab_referrals = inMemoryLabReferrals.filter((r) => r.case_id === c.id)
  const treatments = await getTreatmentsByAnimalId(c.animal_id)

  return {
    ...c,
    animal: animal || undefined,
    examinations,
    notes,
    samples,
    lab_referrals,
    treatments,
    owner: {
      id: c.owner_id,
      user_id: c.owner_id,
      full_name: 'Rajendra Singh (Farmer)',
      phone: '+91 98391 44820',
      village: c.village || 'Rampur Khurd',
      district: c.district || 'Varanasi',
      role: 'farmer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  }
}

/**
 * Update case priority
 */
export async function updateCasePriority(
  caseId: string,
  priority: CasePriority,
  vetName = 'Dr. Priya Sharma'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('veterinary_cases')
      .update({ priority, updated_at: new Date().toISOString() })
      .eq('id', caseId)

    if (error) throw error
  } catch (err) {
    console.warn('[VetService] Priority update notice:', err)
  }

  const target = inMemoryCases.find((c) => c.id === caseId)
  if (target) {
    target.priority = priority
    target.updated_at = new Date().toISOString()
  }

  await logAuditAction({
    user_id: 'demo-vet',
    user_name: vetName,
    user_role: 'veterinarian',
    action: 'Priority Changed',
    case_id: caseId,
    details: `Priority updated to ${priority}.`,
  })

  return true
}

/**
 * Standardized Case Lifecycle Status Progression Rules
 * REPORTED -> UNDER REVIEW -> VETERINARY REVIEW -> SAMPLE REQUIRED -> LAB PENDING -> TREATMENT -> MONITORING -> RESOLVED
 */
export const VALID_CASE_TRANSITIONS: Record<VetCaseStatus, VetCaseStatus[]> = {
  'Reported': ['Under Review', 'Veterinary Review', 'Rejected'],
  'Under Review': ['Veterinary Review', 'Sample Required', 'Treatment', 'Rejected'],
  'Veterinary Review': ['Sample Required', 'Lab Pending', 'Treatment', 'Monitoring', 'Rejected'],
  'Sample Required': ['Lab Pending', 'Treatment', 'Veterinary Review'],
  'Lab Pending': ['Treatment', 'Veterinary Review', 'Monitoring'],
  'Treatment': ['Monitoring', 'Resolved', 'Veterinary Review'],
  'Monitoring': ['Resolved', 'Treatment', 'Veterinary Review'],
  'Resolved': ['Monitoring', 'Veterinary Review'], // Re-opening on clinical recurrence
  'Rejected': ['Under Review'],
}

export function isValidCaseStatusTransition(from: VetCaseStatus, to: VetCaseStatus): boolean {
  if (from === to) return true
  const allowed = VALID_CASE_TRANSITIONS[from]
  return allowed ? allowed.includes(to) : true
}

export function getAllowedNextStatuses(current: VetCaseStatus): VetCaseStatus[] {
  return VALID_CASE_TRANSITIONS[current] || []
}

/**
 * Update case status with transition validation
 */
export async function updateCaseStatus(
  caseId: string,
  status: VetCaseStatus,
  vetName = 'Dr. Priya Sharma',
  notes?: string
): Promise<boolean> {
  const target = inMemoryCases.find((c) => c.id === caseId)
  if (target && !isValidCaseStatusTransition(target.status, status)) {
    console.warn(`[VetService] Disallowed case status transition: ${target.status} -> ${status}`)
  }
  try {
    const { error } = await supabase
      .from('veterinary_cases')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', caseId)

    if (error) throw error
  } catch (err) {
    console.warn('[VetService] Status update notice:', err)
  }

  if (target) {
    target.status = status
    target.updated_at = new Date().toISOString()
  }

  await logAuditAction({
    user_id: 'demo-vet',
    user_name: vetName,
    user_role: 'veterinarian',
    action: 'Status Changed',
    case_id: caseId,
    details: `Case status changed to ${status}.${notes ? ` Note: ${notes}` : ''}`,
  })

  return true
}

/**
 * Assign case to a veterinarian
 */
export async function assignCase(
  caseId: string,
  vetId: string,
  vetName: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('veterinary_cases')
      .update({
        assigned_vet_id: vetId,
        assigned_vet_name: vetName,
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', caseId)

    if (error) throw error
  } catch (err) {
    console.warn('[VetService] Assign case notice:', err)
  }

  const target = inMemoryCases.find((c) => c.id === caseId)
  if (target) {
    target.assigned_vet_id = vetId
    target.assigned_vet_name = vetName
    target.assigned_at = new Date().toISOString()
    target.updated_at = new Date().toISOString()
  }

  await logAuditAction({
    user_id: vetId,
    user_name: vetName,
    user_role: 'veterinarian',
    action: 'Case Assigned',
    case_id: caseId,
    details: `Case assigned to ${vetName}.`,
  })

  // Dispatch alert to the assigned veterinarian
  try {
    const { createAlert } = await import('@/services/alertService')
    await createAlert({
      user_id: vetId,
      title: 'New Clinical Case Assigned',
      message: `Case #${target?.case_number || caseId} in ${target?.village || 'field sector'} has been assigned to your clinical roster.`,
      alert_type: 'Veterinary',
      severity: target?.priority === 'CRITICAL' ? 'danger' : 'warning',
      animal_id: target?.animal_id,
    })
  } catch (err) {
    // Non-blocking
  }

  return true
}

/**
 * Record a clinical examination
 */
export async function recordCaseExamination(
  caseId: string,
  data: {
    veterinarian_name: string
    temperature?: number
    temperature_unit?: 'F' | 'C'
    observed_symptoms: string[]
    physical_observations?: string
    behaviour?: 'Alert' | 'Dull' | 'Depressed' | 'Excited' | 'Recumbent'
    appetite?: 'Normal' | 'Reduced' | 'Anorexic/Off-feed'
    hydration?: 'Normal' | 'Mild Dehydration' | 'Severe Dehydration'
    respiratory_condition?: 'Normal' | 'Dyspnea/Rapid' | 'Wheezing/Cough' | 'Stridor'
    mucous_membrane?: 'Normal Pink' | 'Congested/Red' | 'Pale' | 'Icteric/Yellow'
    other_observations?: string
  }
): Promise<CaseExamination> {
  const newExam: CaseExamination = {
    id: `exam-${Date.now()}`,
    case_id: caseId,
    veterinarian_name: data.veterinarian_name,
    temperature: data.temperature,
    temperature_unit: data.temperature_unit || 'F',
    observed_symptoms: data.observed_symptoms,
    physical_observations: data.physical_observations,
    behaviour: data.behaviour,
    appetite: data.appetite,
    hydration: data.hydration,
    respiratory_condition: data.respiratory_condition,
    mucous_membrane: data.mucous_membrane,
    other_observations: data.other_observations,
    examined_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }

  try {
    const { data: inserted, error } = await supabase
      .from('case_examinations')
      .insert([newExam])
      .select()
      .single()

    if (error) throw error
    if (inserted) {
      inMemoryExaminations.unshift(inserted as CaseExamination)
      await updateCaseStatus(caseId, 'Veterinary Review', data.veterinarian_name)
      return inserted as CaseExamination
    }
  } catch (err) {
    console.warn('[VetService] Examination insert notice:', err)
  }

  inMemoryExaminations.unshift(newExam)
  await updateCaseStatus(caseId, 'Veterinary Review', data.veterinarian_name)

  await logAuditAction({
    user_id: 'demo-vet',
    user_name: data.veterinarian_name,
    user_role: 'veterinarian',
    action: 'Examination Recorded',
    case_id: caseId,
    details: `Clinical exam logged. Temp: ${data.temperature || 'N/A'} ${data.temperature_unit || 'F'}.`,
  })

  return newExam
}

/**
 * Add a veterinary case note
 */
export async function addCaseNote(
  caseId: string,
  noteData: {
    veterinarian_name: string
    note_type: CaseNote['note_type']
    content: string
  }
): Promise<CaseNote> {
  const newNote: CaseNote = {
    id: `note-${Date.now()}`,
    case_id: caseId,
    veterinarian_name: noteData.veterinarian_name,
    note_type: noteData.note_type,
    content: noteData.content,
    created_at: new Date().toISOString(),
  }

  try {
    const { data: inserted, error } = await supabase
      .from('case_notes')
      .insert([newNote])
      .select()
      .single()

    if (error) throw error
    if (inserted) {
      inMemoryNotes.unshift(inserted as CaseNote)
      return inserted as CaseNote
    }
  } catch (err) {
    console.warn('[VetService] Note insert notice:', err)
  }

  inMemoryNotes.unshift(newNote)

  await logAuditAction({
    user_id: 'demo-vet',
    user_name: noteData.veterinarian_name,
    user_role: 'veterinarian',
    action: 'Note Added',
    case_id: caseId,
    details: `${noteData.note_type}: ${noteData.content.slice(0, 60)}...`,
  })

  return newNote
}

/**
 * Request diagnostic sample collection
 */
export async function requestSampleCollection(data: {
  case_id: string
  animal_id: string
  sample_type: SampleRequest['sample_type']
  collection_instructions?: string
  priority?: CasePriority
  requested_by: string
  notes?: string
}): Promise<SampleRequest> {
  const sampleNum = `SMP-2026-${String(inMemorySamples.length + 82).padStart(4, '0')}`
  const newSample: SampleRequest = {
    id: `smp-${Date.now()}`,
    sample_number: sampleNum,
    case_id: data.case_id,
    animal_id: data.animal_id,
    sample_type: data.sample_type,
    collection_instructions: data.collection_instructions,
    priority: data.priority || 'HIGH',
    requested_by: data.requested_by,
    requested_date: new Date().toISOString().split('T')[0],
    status: 'Requested',
    notes: data.notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  try {
    const { data: inserted, error } = await supabase
      .from('sample_requests')
      .insert([newSample])
      .select()
      .single()

    if (error) throw error
    if (inserted) {
      inMemorySamples.unshift(inserted as SampleRequest)
      await updateCaseStatus(data.case_id, 'Sample Required', data.requested_by)
      return inserted as SampleRequest
    }
  } catch (err) {
    console.warn('[VetService] Sample request insert notice:', err)
  }

  inMemorySamples.unshift(newSample)
  await updateCaseStatus(data.case_id, 'Sample Required', data.requested_by)

  await logAuditAction({
    user_id: 'demo-vet',
    user_name: data.requested_by,
    user_role: 'veterinarian',
    action: 'Sample Requested',
    case_id: data.case_id,
    details: `Sample ${sampleNum} (${data.sample_type}) requested with ${data.priority || 'HIGH'} priority.`,
  })

  return newSample
}

/**
 * Create a lab referral record
 */
export async function createLabReferral(data: {
  case_id: string
  sample_id: string
  lab_name: string
  test_requested: string
  requested_by: string
  priority?: CasePriority
  notes?: string
}): Promise<LabReferral> {
  const refNum = `REF-2026-${String(inMemoryLabReferrals.length + 43).padStart(4, '0')}`
  const newRef: LabReferral = {
    id: `ref-${Date.now()}`,
    referral_number: refNum,
    case_id: data.case_id,
    sample_id: data.sample_id,
    lab_name: data.lab_name,
    test_requested: data.test_requested,
    requested_by: data.requested_by,
    referral_date: new Date().toISOString().split('T')[0],
    priority: data.priority || 'HIGH',
    status: 'Sample Dispatched',
    notes: data.notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Update sample status
  const sample = inMemorySamples.find((s) => s.id === data.sample_id)
  if (sample) {
    sample.status = 'Sent to Lab'
    sample.updated_at = new Date().toISOString()
  }

  try {
    const { data: inserted, error } = await supabase
      .from('lab_referrals')
      .insert([newRef])
      .select()
      .single()

    if (error) throw error
    if (inserted) {
      inMemoryLabReferrals.unshift(inserted as LabReferral)
      await updateCaseStatus(data.case_id, 'Lab Pending', data.requested_by)
      return inserted as LabReferral
    }
  } catch (err) {
    console.warn('[VetService] Lab referral insert notice:', err)
  }

  inMemoryLabReferrals.unshift(newRef)
  await updateCaseStatus(data.case_id, 'Lab Pending', data.requested_by)

  await logAuditAction({
    user_id: 'demo-vet',
    user_name: data.requested_by,
    user_role: 'veterinarian',
    action: 'Lab Referral Created',
    case_id: data.case_id,
    details: `Referral ${refNum} created to ${data.lab_name}. Test: ${data.test_requested}.`,
  })

  return newRef
}

/**
 * Record and interpret lab results (Interpreted by veterinarian, not automatic AI!)
 */
export async function addLabResult(data: {
  referral_id: string
  case_id: string
  lab_name: string
  test_name: string
  result_status: LabResult['result_status']
  result_summary?: string
  pathogen_identified?: string
  veterinarian_interpretation: string
  veterinarian_name?: string
}): Promise<LabResult> {
  const newResult: LabResult = {
    id: `res-${Date.now()}`,
    referral_id: data.referral_id,
    case_id: data.case_id,
    lab_name: data.lab_name,
    test_name: data.test_name,
    result_status: data.result_status,
    result_summary: data.result_summary,
    pathogen_identified: data.pathogen_identified,
    result_date: new Date().toISOString().split('T')[0],
    veterinarian_interpretation: data.veterinarian_interpretation,
    created_at: new Date().toISOString(),
  }

  // Update referral status
  const ref = inMemoryLabReferrals.find((r) => r.id === data.referral_id)
  if (ref) {
    ref.status = 'Result Uploaded'
    ref.result = newResult
    ref.updated_at = new Date().toISOString()
  }

  try {
    const { data: inserted, error } = await supabase
      .from('lab_results')
      .insert([newResult])
      .select()
      .single()

    if (error) throw error
    if (inserted) return inserted as LabResult
  } catch (err) {
    console.warn('[VetService] Lab result insert notice:', err)
  }

  await logAuditAction({
    user_id: 'demo-vet',
    user_name: data.veterinarian_name || 'Dr. Priya Sharma',
    user_role: 'veterinarian',
    action: 'Lab Result Interpreted',
    case_id: data.case_id,
    details: `Lab result for ${data.test_name}: ${data.result_status}. Clinical interpretation: ${data.veterinarian_interpretation}`,
  })

  // Dispatch alert to assigned veterinarian
  try {
    const { createAlert } = await import('@/services/alertService')
    const targetCase = inMemoryCases.find((c) => c.id === data.case_id)
    const vetUserId = targetCase?.assigned_vet_id || 'demo-vet'
    await createAlert({
      user_id: vetUserId,
      title: `Lab Result Available: Case #${targetCase?.case_number || data.case_id}`,
      message: `${data.test_name} result: ${data.result_status}. Pathogen: ${data.pathogen_identified || 'None'}. Review clinical dossier.`,
      alert_type: 'Veterinary',
      severity: data.result_status === 'Positive' ? 'danger' : 'info',
      animal_id: targetCase?.animal_id,
    })
  } catch (err) {
    // Non-blocking
  }

  return newResult
}

/**
 * Create a clinical prescription / treatment record
 */
export async function createVeterinaryTreatment(data: {
  animal_id: string
  owner_id: string
  case_id?: string
  condition: string
  medicine: string
  dosage: string
  start_date: string
  end_date?: string
  veterinarian_name: string
  notes?: string
}): Promise<Treatment> {
  const newTrt: Treatment = {
    id: `trt-${Date.now()}`,
    animal_id: data.animal_id,
    owner_id: data.owner_id,
    condition: data.condition,
    medicine: data.medicine,
    dosage: data.dosage,
    start_date: data.start_date,
    end_date: data.end_date,
    veterinarian_name: data.veterinarian_name,
    notes: data.notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  try {
    const { data: inserted, error } = await supabase
      .from('treatments')
      .insert([newTrt])
      .select()
      .single()

    if (error) throw error
    if (inserted) {
      if (data.case_id) {
        await updateCaseStatus(data.case_id, 'Treatment', data.veterinarian_name)
      }
      return inserted as Treatment
    }
  } catch (err) {
    console.warn('[VetService] Treatment insert notice:', err)
  }

  if (data.case_id) {
    await updateCaseStatus(data.case_id, 'Treatment', data.veterinarian_name)
    await logAuditAction({
      user_id: 'demo-vet',
      user_name: data.veterinarian_name,
      user_role: 'veterinarian',
      action: 'Treatment Prescribed',
      case_id: data.case_id,
      details: `Prescription issued: ${data.medicine} (${data.dosage}) for ${data.condition}.`,
    })
  }

  return newTrt
}

/**
 * Resolve or close a case
 */
export async function resolveCase(
  caseId: string,
  data: {
    resolution_summary: string
    final_status: 'Resolved' | 'Monitoring' | 'Rejected'
    follow_up_required?: boolean
    follow_up_date?: string
    veterinarian_name?: string
  }
): Promise<boolean> {
  const target = inMemoryCases.find((c) => c.id === caseId)
  if (target) {
    target.status = data.final_status
    target.resolved_at = new Date().toISOString()
    target.resolution_summary = data.resolution_summary
    target.follow_up_required = data.follow_up_required || false
    target.follow_up_date = data.follow_up_date
    target.updated_at = new Date().toISOString()

    // If resolved, animal health status can be updated
    if (data.final_status === 'Resolved') {
      await updateAnimalHealthStatus(target.animal_id, 'Healthy')
    } else if (data.final_status === 'Monitoring') {
      await updateAnimalHealthStatus(target.animal_id, 'Under Observation')
    }
  }

  try {
    const { error } = await supabase
      .from('veterinary_cases')
      .update({
        status: data.final_status,
        resolved_at: new Date().toISOString(),
        resolution_summary: data.resolution_summary,
        follow_up_required: data.follow_up_required,
        follow_up_date: data.follow_up_date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', caseId)

    if (error) throw error
  } catch (err) {
    console.warn('[VetService] Resolve case notice:', err)
  }

  await logAuditAction({
    user_id: 'demo-vet',
    user_name: data.veterinarian_name || 'Dr. Priya Sharma',
    user_role: 'veterinarian',
    action: 'Case Resolved',
    case_id: caseId,
    details: `Case resolved as ${data.final_status}. Summary: ${data.resolution_summary}`,
  })

  return true
}

/**
 * Compute real KPI statistics for the command center
 */
export async function getVetKPIStats(): Promise<VetKPIStats> {
  const cases = await getVetCases()

  let new_cases = 0
  let under_review = 0
  let high_priority = 0
  let sample_required = 0
  let lab_pending = 0
  let cases_resolved = 0

  for (const c of cases) {
    if (c.status === 'Reported') new_cases++
    if (c.status === 'Under Review' || c.status === 'Veterinary Review') under_review++
    if (c.priority === 'CRITICAL' || c.priority === 'HIGH') high_priority++
    if (c.status === 'Sample Required') sample_required++
    if (c.status === 'Lab Pending') lab_pending++
    if (c.status === 'Resolved') cases_resolved++
  }

  return {
    new_cases,
    under_review,
    high_priority,
    sample_required,
    lab_pending,
    cases_resolved,
    total_cases: cases.length,
  }
}

/**
 * Fetch farmer profile summary for veterinarian review
 */
export async function getFarmerProfileForVet(ownerId: string): Promise<FarmerProfileView> {
  const cases = await getVetCases()
  const farmerCases = cases.filter((c) => c.owner_id === ownerId || ownerId.startsWith('demo-'))

  const active_cases_count = farmerCases.filter((c) => c.status !== 'Resolved').length
  const historical_cases_count = farmerCases.filter((c) => c.status === 'Resolved').length

  const animals: Animal[] = [
    {
      id: 'a001-demo-gir-cow',
      owner_id: ownerId,
      animal_tag: 'PR-COW-001',
      animal_type: 'Cow',
      breed: 'Gir',
      gender: 'Female',
      age: 4,
      health_status: 'Healthy',
      village: 'Rampur Khurd',
      district: 'Varanasi',
      created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: 'a002-demo-murrah-buf',
      owner_id: ownerId,
      animal_tag: 'PR-BUF-002',
      animal_type: 'Buffalo',
      breed: 'Murrah',
      gender: 'Female',
      age: 5,
      health_status: 'Under Observation',
      village: 'Rampur Khurd',
      district: 'Varanasi',
      created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'a003-demo-gir-heifer',
      owner_id: ownerId,
      animal_tag: 'PR-COW-003',
      animal_type: 'Cow',
      breed: 'Sahiwal',
      gender: 'Female',
      age: 3,
      health_status: 'High Risk',
      village: 'Rampur Khurd',
      district: 'Varanasi',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ]

  const vacs = await getVaccinationsByAnimalId('a001-demo-gir-cow')

  return {
    owner_id: ownerId,
    full_name: 'Rajendra Singh',
    phone: '+91 98391 44820',
    village: 'Rampur Khurd',
    district: 'Varanasi',
    total_animals: animals.length,
    active_cases_count,
    historical_cases_count,
    vaccinations_count: vacs.length,
    animals,
  }
}

/**
 * Log audit trail entry
 */
export async function logAuditAction(entry: Omit<AuditLog, 'id' | 'created_at'>): Promise<void> {
  const newLog: AuditLog = {
    ...entry,
    id: `aud-${Date.now()}`,
    created_at: new Date().toISOString(),
  }
  inMemoryAuditLogs.unshift(newLog)

  try {
    await supabase.from('audit_logs').insert([newLog])
  } catch (err) {
    // Audit logging is non-blocking
  }
}

/**
 * Fetch audit logs
 */
export async function getAuditLogs(caseId?: string): Promise<AuditLog[]> {
  try {
    let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false })
    if (caseId) query = query.eq('case_id', caseId)
    const { data } = await query
    if (data && data.length > 0) return data as AuditLog[]
  } catch (err) {
    // Fallback to session
  }

  if (caseId) {
    return inMemoryAuditLogs.filter((l) => l.case_id === caseId)
  }
  return inMemoryAuditLogs
}

/**
 * Synchronize newly created farmer symptom reports into veterinary cases
 */
export function registerNewSymptomReportAsCase(report: {
  id: string
  animal_id: string
  owner_id: string
  symptoms: string[]
  severity: 'Mild' | 'Moderate' | 'Severe'
  description?: string
  latitude?: number
  longitude?: number
  village?: string
  district?: string
}): VeterinaryCase {
  const seq = inMemoryCases.length + 2051
  const priority: CasePriority =
    report.severity === 'Severe' ? 'CRITICAL' : report.severity === 'Moderate' ? 'HIGH' : 'MEDIUM'

  const newCase: VeterinaryCase = {
    id: `case-${Date.now()}`,
    case_number: `PR-CASE-${seq}`,
    report_id: report.id,
    animal_id: report.animal_id,
    owner_id: report.owner_id,
    assigned_vet_name: 'Dr. Priya Sharma (Veterinary Officer)',
    status: 'Reported',
    priority,
    symptoms: report.symptoms,
    reported_severity: report.severity,
    description: report.description,
    village: report.village || 'Rampur Khurd',
    district: report.district || 'Varanasi',
    latitude: report.latitude || 25.3176,
    longitude: report.longitude || 82.9739,
    reported_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  inMemoryCases.unshift(newCase)

  // Persist to Supabase
  try {
    supabase.from('veterinary_cases').insert([{
      case_number: newCase.case_number,
      report_id: report.id,
      animal_id: report.animal_id,
      owner_id: report.owner_id,
      assigned_vet_name: newCase.assigned_vet_name,
      status: newCase.status,
      priority: newCase.priority,
      symptoms: newCase.symptoms,
      reported_severity: newCase.reported_severity,
      description: newCase.description,
      village: newCase.village,
      district: newCase.district,
      latitude: newCase.latitude,
      longitude: newCase.longitude,
      reported_at: newCase.reported_at,
    }]).then(({ error }) => {
      if (error) console.warn('[VetService] Supabase case insert notice:', error)
    })
  } catch (err) {
    // Non-blocking
  }

  logAuditAction({
    user_id: report.owner_id,
    user_name: 'Farmer Portal Dispatch',
    user_role: 'farmer',
    action: 'Case Created',
    case_id: newCase.id,
    details: `Case ${newCase.case_number} automatically opened from clinical symptom submission.`,
  })

  // Stage 4: Trigger explainable health risk scoring & cluster detection pipeline
  setTimeout(async () => {
    try {
      const { calculateCaseRisk, saveRiskAssessment } = await import('@/services/risk/riskEngine')
      const { runOutbreakDetectionPipeline } = await import('@/services/risk/outbreakEngine')
      const assessment = calculateCaseRisk(newCase, inMemoryCases)
      await saveRiskAssessment(assessment)
      await runOutbreakDetectionPipeline()
    } catch (err) {
      console.warn('[VetService] Automatic risk pipeline notice:', err)
    }
  }, 0)

  return newCase
}

/**
 * Synchronize newly created farmer mortality reports into veterinary cases
 */
export function registerNewMortalityReportAsCase(report: {
  id: string
  animal_id: string
  owner_id: string
  cause_description?: string
  latitude?: number
  longitude?: number
  village?: string
  district?: string
}): VeterinaryCase {
  const seq = inMemoryCases.length + 2051
  const newCase: VeterinaryCase = {
    id: `case-${Date.now()}`,
    case_number: `PR-CASE-${seq}`,
    mortality_report_id: report.id,
    animal_id: report.animal_id,
    owner_id: report.owner_id,
    assigned_vet_name: 'Dr. Priya Sharma (Veterinary Officer)',
    status: 'Reported',
    priority: 'CRITICAL',
    symptoms: ['Reported Animal Mortality'],
    reported_severity: 'Severe',
    description: report.cause_description
      ? `Reported Animal Mortality: ${report.cause_description}`
      : 'Reported Animal Mortality submitted by owner. Post-mortem review required.',
    village: report.village || 'Rampur Khurd',
    district: report.district || 'Varanasi',
    latitude: report.latitude || 25.3176,
    longitude: report.longitude || 82.9739,
    reported_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  inMemoryCases.unshift(newCase)

  // Persist to Supabase
  try {
    supabase.from('veterinary_cases').insert([{
      case_number: newCase.case_number,
      animal_id: report.animal_id,
      owner_id: report.owner_id,
      assigned_vet_name: newCase.assigned_vet_name,
      status: newCase.status,
      priority: newCase.priority,
      symptoms: newCase.symptoms,
      reported_severity: newCase.reported_severity,
      description: newCase.description,
      village: newCase.village,
      district: newCase.district,
      latitude: newCase.latitude,
      longitude: newCase.longitude,
      reported_at: newCase.reported_at,
    }]).then(({ error }) => {
      if (error) console.warn('[VetService] Supabase mortality case insert notice:', error)
    })
  } catch (err) {
    // Non-blocking
  }

  logAuditAction({
    user_id: report.owner_id,
    user_name: 'Farmer Portal Dispatch',
    user_role: 'farmer',
    action: 'Case Created',
    case_id: newCase.id,
    details: `Critical Case ${newCase.case_number} opened following animal mortality report.`,
  })

  // Trigger explainable health risk scoring & outbreak detection pipeline with mortality signal
  setTimeout(async () => {
    try {
      const { calculateCaseRisk, saveRiskAssessment } = await import('@/services/risk/riskEngine')
      const { runOutbreakDetectionPipeline } = await import('@/services/risk/outbreakEngine')
      const assessment = calculateCaseRisk(newCase, inMemoryCases, true)
      await saveRiskAssessment(assessment)
      await runOutbreakDetectionPipeline()
    } catch (err) {
      console.warn('[VetService] Automatic mortality risk pipeline notice:', err)
    }
  }, 0)

  return newCase
}

/**
 * Creates a new veterinary clinical case directly (e.g. from IoT alerts, triage, or referrals)
 */
export async function createVetCase(payload: {
  animal_id: string
  owner_id: string
  symptoms: string[]
  reported_severity: 'Mild' | 'Moderate' | 'Severe'
  description: string
  village?: string
  district?: string
  priority?: CasePriority
}): Promise<VeterinaryCase> {
  const seq = inMemoryCases.length + 2060
  const newCase: VeterinaryCase = {
    id: `case-${Date.now()}`,
    case_number: `PR-CASE-${seq}`,
    animal_id: payload.animal_id,
    owner_id: payload.owner_id,
    assigned_vet_id: 'demo-vet',
    assigned_vet_name: 'Dr. Priya Sharma (Veterinary Officer)',
    status: 'Reported',
    priority: payload.priority || 'MEDIUM',
    symptoms: payload.symptoms,
    reported_severity: payload.reported_severity,
    description: payload.description,
    village: payload.village || 'Rampur Khurd',
    district: payload.district || 'Varanasi',
    reported_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  inMemoryCases.unshift(newCase)

  try {
    await supabase.from('veterinary_cases').insert([{
      case_number: newCase.case_number,
      animal_id: newCase.animal_id,
      owner_id: newCase.owner_id,
      assigned_vet_id: newCase.assigned_vet_id,
      assigned_vet_name: newCase.assigned_vet_name,
      status: newCase.status,
      priority: newCase.priority,
      symptoms: newCase.symptoms,
      reported_severity: newCase.reported_severity,
      description: newCase.description,
      village: newCase.village,
      district: newCase.district,
      reported_at: newCase.reported_at,
    }])
  } catch (err) {
    // Non-blocking in demo/preview
  }

  logAuditAction({
    user_id: payload.owner_id,
    user_name: 'Clinical Dispatch',
    user_role: 'veterinarian',
    action: 'Case Created',
    case_id: newCase.id,
    details: `Veterinary case ${newCase.case_number} established: ${payload.description}`,
  })

  // Trigger risk assessment
  setTimeout(async () => {
    try {
      const { calculateCaseRisk, saveRiskAssessment } = await import('@/services/risk/riskEngine')
      const { runOutbreakDetectionPipeline } = await import('@/services/risk/outbreakEngine')
      const assessment = calculateCaseRisk(newCase, inMemoryCases)
      await saveRiskAssessment(assessment)
      await runOutbreakDetectionPipeline()
    } catch (err) {
      console.warn('[VetService] Automatic risk pipeline notice:', err)
    }
  }, 0)

  return newCase
}

/**
 * Fetch all diagnostic lab referrals across all cases
 */
export async function getAllLabReferrals(): Promise<LabReferral[]> {
  try {
    const { data, error } = await supabase
      .from('lab_referrals')
      .select('*, result:lab_results(*)')
      .order('created_at', { ascending: false })

    if (error) throw error
    if (data && data.length > 0) return data as LabReferral[]
  } catch (err) {
    console.warn('[VetService] Lab referrals query notice:', err)
  }

  return inMemoryLabReferrals
}

/**
 * Fetch all sample collection requests across all cases
 */
export async function getAllSampleRequests(): Promise<SampleRequest[]> {
  try {
    const { data, error } = await supabase
      .from('sample_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    if (data && data.length > 0) return data as SampleRequest[]
  } catch (err) {
    console.warn('[VetService] Sample requests query notice:', err)
  }

  return inMemorySamples
}

/**
 * Fetch all registered livestock in the district for veterinarian review
 */
export async function getAllDistrictAnimals(): Promise<Animal[]> {
  try {
    const { data, error } = await supabase
      .from('animals')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    if (data && data.length > 0) return data as Animal[]
  } catch (err) {
    console.warn('[VetService] District animals query notice:', err)
  }

  return [
    {
      id: 'a001-demo-gir-cow',
      owner_id: 'demo-farmer',
      animal_tag: 'PR-COW-001',
      animal_type: 'Cow',
      breed: 'Gir',
      gender: 'Female',
      age: 4,
      health_status: 'Healthy',
      location: 'Rampur Khurd, Varanasi',
      village: 'Rampur Khurd',
      district: 'Varanasi',
      created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: 'a002-demo-murrah-buf',
      owner_id: 'demo-farmer',
      animal_tag: 'PR-BUF-002',
      animal_type: 'Buffalo',
      breed: 'Murrah',
      gender: 'Female',
      age: 5,
      health_status: 'Under Observation',
      location: 'Rampur Khurd, Varanasi',
      village: 'Rampur Khurd',
      district: 'Varanasi',
      created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'a003-demo-gir-heifer',
      owner_id: 'demo-farmer',
      animal_tag: 'PR-COW-003',
      animal_type: 'Cow',
      breed: 'Sahiwal',
      gender: 'Female',
      age: 3,
      health_status: 'High Risk',
      location: 'Rampur Khurd, Varanasi',
      village: 'Rampur Khurd',
      district: 'Varanasi',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'a004-demo-goat-jamunapari',
      owner_id: 'farmer-003',
      animal_tag: 'PR-GOT-004',
      animal_type: 'Goat',
      breed: 'Jamunapari',
      gender: 'Female',
      age: 2,
      health_status: 'Under Observation',
      location: 'Chiraigaon, Varanasi',
      village: 'Chiraigaon',
      district: 'Varanasi',
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'a005-demo-buf-nili',
      owner_id: 'farmer-002',
      animal_tag: 'PR-BUF-005',
      animal_type: 'Buffalo',
      breed: 'Nili-Ravi',
      gender: 'Female',
      age: 6,
      health_status: 'Healthy',
      location: 'Shivpur, Varanasi',
      village: 'Shivpur',
      district: 'Varanasi',
      created_at: new Date(Date.now() - 50 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
  ]
}

/**
 * Fetch all farmers registered in the jurisdiction
 */
export async function getAllFarmers(): Promise<FarmerProfileView[]> {
  const primaryFarmer = await getFarmerProfileForVet('demo-farmer')

  const otherFarmers: FarmerProfileView[] = [
    {
      owner_id: 'farmer-002',
      full_name: 'Ramesh Yadav',
      phone: '+91 98452 11983',
      village: 'Shivpur',
      district: 'Varanasi',
      total_animals: 4,
      active_cases_count: 0,
      historical_cases_count: 1,
      vaccinations_count: 8,
      animals: [],
    },
    {
      owner_id: 'farmer-003',
      full_name: 'Suresh Patel',
      phone: '+91 94158 77621',
      village: 'Chiraigaon',
      district: 'Varanasi',
      total_animals: 6,
      active_cases_count: 1,
      historical_cases_count: 3,
      vaccinations_count: 11,
      animals: [],
    },
    {
      owner_id: 'farmer-004',
      full_name: 'Sunita Devi',
      phone: '+91 97931 33490',
      village: 'Cholapur',
      district: 'Varanasi',
      total_animals: 2,
      active_cases_count: 0,
      historical_cases_count: 0,
      vaccinations_count: 4,
      animals: [],
    },
    {
      owner_id: 'farmer-005',
      full_name: 'Harish Chandra',
      phone: '+91 98380 55122',
      village: 'Kashi Vidyapeeth',
      district: 'Varanasi',
      total_animals: 5,
      active_cases_count: 0,
      historical_cases_count: 2,
      vaccinations_count: 9,
      animals: [],
    },
  ]

  return [primaryFarmer, ...otherFarmers]
}

/**
 * Fetch all treatments across the district
 */
export async function getAllVeterinaryTreatments(): Promise<Treatment[]> {
  try {
    const { data, error } = await supabase
      .from('treatments')
      .select('*, animal:animals(*)')
      .order('start_date', { ascending: false })

    if (error) throw error
    if (data && data.length > 0) return data as Treatment[]
  } catch (err) {
    console.warn('[VetService] Treatments query notice:', err)
  }

  return [
    {
      id: 'trt001-antipyretic',
      animal_id: 'a003-demo-gir-heifer',
      owner_id: 'demo-farmer',
      condition: 'Acute Pyrexia & Suspected Upper Respiratory Congestion',
      medicine: 'Meloxicam + Paracetamol (Intramuscular) & Enrofloxacin 10%',
      dosage: '15ml daily for 3 consecutive days',
      start_date: '2026-10-06',
      end_date: '2026-10-09',
      veterinarian_name: 'Dr. Priya Sharma (Reg: VCI/UP/2019/8412)',
      notes: 'Maintain isolated shelter. Provide warm saline water and fresh green fodder.',
      created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
      updated_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    },
    {
      id: 'trt002-joint-wound',
      animal_id: 'a002-demo-murrah-buf',
      owner_id: 'demo-farmer',
      condition: 'Right Hock Joint Contusion with Superficial Abrasion',
      medicine: 'Povidone Iodine 5% Spray + Topical Zinc Oxide Ointment',
      dosage: 'Apply twice daily after antiseptic cleaning',
      start_date: '2026-10-04',
      end_date: '2026-10-10',
      veterinarian_name: 'Dr. Anand Verma (MVU Unit 4)',
      notes: 'Restricted tethered movement. Keep stall dry and clean.',
      created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
      updated_at: new Date(Date.now() - 72 * 3600000).toISOString(),
    },
  ]
}

