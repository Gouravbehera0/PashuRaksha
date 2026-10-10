// ============================================================
// PASHURAKSHA (पशुरक्षा) — FEATURE ENGINEERING & SYMPTOM NORMALIZATION
// Stage 10: Advanced AI & Disease Intelligence
// Standard: Safe Data Imputation & Controlled Categorical Normalization
// "Detect Early. Prevent Outbreaks. Protect Livestock."
// ============================================================

import type { VeterinaryCase, Animal, SymptomSeverity } from '@/types'
import type { NormalizedSymptom, NormalizedSymptomCategory } from './intelligenceTypes'

const SYMPTOM_DICTIONARY: Record<
  string,
  {
    category: NormalizedSymptomCategory
    sign: string
    significance: 'mild' | 'moderate' | 'severe' | 'critical'
  }
> = {
  // Vesicular / Mucosal
  'blisters or ulcers in mouth/hooves': {
    category: 'vesicular_mucosal',
    sign: 'Epithelial vesicle or erosion on buccal mucosa / interdigital cleft',
    significance: 'critical',
  },
  'mouth blisters': {
    category: 'vesicular_mucosal',
    sign: 'Buccal vesicle lesion',
    significance: 'severe',
  },
  'hoof blisters': {
    category: 'vesicular_mucosal',
    sign: 'Interdigital or coronary band vesicle lesion',
    significance: 'severe',
  },
  'excessive salivation / drooling': {
    category: 'vesicular_mucosal',
    sign: 'Ptyalism / ropy mucous salivation',
    significance: 'severe',
  },
  'drooling': {
    category: 'vesicular_mucosal',
    sign: 'Ptyalism',
    significance: 'moderate',
  },
  'skin lesions / nodules': {
    category: 'vesicular_mucosal',
    sign: 'Cutaneous circumscribed nodular dermatosis',
    significance: 'severe',
  },

  // Respiratory
  'difficulty breathing': {
    category: 'respiratory',
    sign: 'Acute dyspnea / laboured abdominal respiration',
    significance: 'critical',
  },
  'cough': {
    category: 'respiratory',
    sign: 'Spasmodic cough / airway irritation',
    significance: 'moderate',
  },
  'nasal discharge': {
    category: 'respiratory',
    sign: 'Mucopurulent or serous rhinorrhea',
    significance: 'moderate',
  },

  // Systemic / Pyretic
  'high fever (>104°f)': {
    category: 'systemic_pyretic',
    sign: 'Hyperpyrexia exceeding 104°F (40°C)',
    significance: 'critical',
  },
  'fever': {
    category: 'systemic_pyretic',
    sign: 'Pyrexia indicative of active systemic inflammatory response',
    significance: 'moderate',
  },
  'abnormal behaviour': {
    category: 'neurological',
    sign: 'Neurological excitation, agitation or hyperesthesia',
    significance: 'severe',
  },
  'sudden drop in milk production': {
    category: 'production_collapse',
    sign: 'Acute agalactia / steep lactation collapse',
    significance: 'moderate',
  },

  // Enteric / Digestive
  'bloody stool': {
    category: 'enteric_digestive',
    sign: 'Hemorrhagic enteritis / melena',
    significance: 'critical',
  },
  'diarrhea': {
    category: 'enteric_digestive',
    sign: 'Profuse watery enteritis',
    significance: 'moderate',
  },
  'bloat': {
    category: 'enteric_digestive',
    sign: 'Acute ruminal tympany / distension',
    significance: 'severe',
  },

  // Locomotor / Musculoskeletal
  'swelling': {
    category: 'locomotor_musculoskeletal',
    sign: 'Localized peripheral edema / crepitant muscular swelling',
    significance: 'moderate',
  },
  'limping / lameness': {
    category: 'locomotor_musculoskeletal',
    sign: 'Locomotor reluctance / gait alteration',
    significance: 'moderate',
  },
  'recumbency': {
    category: 'locomotor_musculoskeletal',
    sign: 'Inability to rise / sternal or lateral recumbency',
    significance: 'critical',
  },

  // General
  'loss of appetite': {
    category: 'general_unspecified',
    sign: 'Inappetence / ruminal hypomotility',
    significance: 'mild',
  },
  'weakness': {
    category: 'general_unspecified',
    sign: 'Generalized asthenia / reduced muscular stamina',
    significance: 'mild',
  },
  'lethargy': {
    category: 'general_unspecified',
    sign: 'Dullness and depression of sensorium',
    significance: 'mild',
  },
}

/**
 * Normalizes a raw symptom string into a structured physiological categorization
 */
export function normalizeSymptom(raw: string): NormalizedSymptom {
  if (!raw || typeof raw !== 'string') {
    return {
      raw: 'Unknown',
      normalizedKey: 'unknown',
      category: 'general_unspecified',
      physiologicalSign: 'Unspecified symptom',
      clinicalSignificance: 'mild',
    }
  }

  const clean = raw.trim().toLowerCase()
  const matched = SYMPTOM_DICTIONARY[clean]

  if (matched) {
    return {
      raw,
      normalizedKey: clean,
      category: matched.category,
      physiologicalSign: matched.sign,
      clinicalSignificance: matched.significance,
    }
  }

  // Fallback heuristic keyword matching for rural synonyms
  if (clean.includes('blister') || clean.includes('ulcer') || clean.includes('mouth') || clean.includes('foot') || clean.includes('tongue')) {
    return {
      raw,
      normalizedKey: 'vesicular_symptom_generic',
      category: 'vesicular_mucosal',
      physiologicalSign: 'Observed mucosal or cutaneous lesion',
      clinicalSignificance: 'severe',
    }
  }

  if (clean.includes('breath') || clean.includes('cough') || clean.includes('nasal') || clean.includes('snort')) {
    return {
      raw,
      normalizedKey: 'respiratory_symptom_generic',
      category: 'respiratory',
      physiologicalSign: 'Respiratory tract disturbance',
      clinicalSignificance: 'moderate',
    }
  }

  if (clean.includes('fever') || clean.includes('hot') || clean.includes('temp') || clean.includes('pyrexia')) {
    return {
      raw,
      normalizedKey: 'pyretic_symptom_generic',
      category: 'systemic_pyretic',
      physiologicalSign: 'Elevated body temperature',
      clinicalSignificance: 'moderate',
    }
  }

  if (clean.includes('blood') || clean.includes('stool') || clean.includes('dung') || clean.includes('diarrhea')) {
    return {
      raw,
      normalizedKey: 'enteric_symptom_generic',
      category: 'enteric_digestive',
      physiologicalSign: 'Gastrointestinal tract abnormality',
      clinicalSignificance: 'severe',
    }
  }

  return {
    raw,
    normalizedKey: clean.replace(/[^a-z0-9]/g, '_'),
    category: 'general_unspecified',
    physiologicalSign: `Uncategorized clinical observation: "${raw}"`,
    clinicalSignificance: 'mild',
  }
}

export interface ExtractedCaseFeatures {
  caseId: string
  caseNumber: string
  species: string
  breed: string
  ageYears?: number
  ageGroup: 'Young' | 'Juvenile' | 'Adult' | 'Geriatric' | 'Unknown'
  normalizedSymptoms: NormalizedSymptom[]
  affectedCategories: NormalizedSymptomCategory[]
  symptomSeverity: SymptomSeverity
  severityScoreWeight: number // 0 to 1
  affectedAnimalCount: number
  hasMortalitySignal: boolean
  durationAwaitingReviewHours: number
  hasCoordinates: boolean
  latitude?: number
  longitude?: number
  village: string
  district: string
  missingDataNotes: string[]
}

/**
 * Extracts and safely validates structured feature vectors from raw clinical records
 */
export function extractCaseFeatures(
  vetCase: VeterinaryCase,
  animal?: Animal | null,
  hasMortality: boolean = false
): ExtractedCaseFeatures {
  const missingDataNotes: string[] = []

  // Safe age extraction
  const ageYears = animal?.age ?? (animal?.date_of_birth ? calculateAgeFromDob(animal.date_of_birth) : undefined)
  let ageGroup: ExtractedCaseFeatures['ageGroup'] = 'Unknown'
  if (ageYears !== undefined) {
    if (ageYears < 1) ageGroup = 'Young'
    else if (ageYears <= 3) ageGroup = 'Juvenile'
    else if (ageYears <= 8) ageGroup = 'Adult'
    else ageGroup = 'Geriatric'
  } else {
    missingDataNotes.push('Animal age is not recorded in registry; physiological susceptibility cannot be age-stratified.')
  }

  // Symptom normalization
  const rawSymptoms = Array.isArray(vetCase.symptoms) && vetCase.symptoms.length > 0 ? vetCase.symptoms : []
  if (rawSymptoms.length === 0) {
    missingDataNotes.push('No discrete structured symptoms checked; assessment is reliant on triage narrative.')
  }
  const normalizedSymptoms = rawSymptoms.map(normalizeSymptom)
  const categorySet = new Set<NormalizedSymptomCategory>()
  normalizedSymptoms.forEach((s) => categorySet.add(s.category))

  // Coordinates check
  const hasCoordinates = typeof vetCase.latitude === 'number' && typeof vetCase.longitude === 'number' && !isNaN(vetCase.latitude)
  if (!hasCoordinates) {
    missingDataNotes.push('GPS spatial coordinates missing; geospatial proximity scoring is disabled for this record.')
  }

  // Latency calculation
  const reportTime = new Date(vetCase.reported_at || vetCase.created_at).getTime()
  const now = Date.now()
  const durationAwaitingReviewHours = Math.max(0, Math.round(((now - reportTime) / (3600 * 1000)) * 10) / 10)

  // Severity Weight
  const severityScoreWeight =
    vetCase.reported_severity === 'Severe'
      ? 1.0
      : vetCase.reported_severity === 'Moderate'
      ? 0.6
      : 0.3

  // Affected animal count fallback
  const affectedAnimalCount = 1 // single registered animal per case unless herd expansion recorded

  return {
    caseId: vetCase.id,
    caseNumber: vetCase.case_number,
    species: animal?.animal_type || vetCase.animal?.animal_type || 'Cow',
    breed: animal?.breed || vetCase.animal?.breed || 'Indigenous',
    ageYears,
    ageGroup,
    normalizedSymptoms,
    affectedCategories: Array.from(categorySet),
    symptomSeverity: vetCase.reported_severity || 'Moderate',
    severityScoreWeight,
    affectedAnimalCount,
    hasMortalitySignal: hasMortality,
    durationAwaitingReviewHours,
    hasCoordinates,
    latitude: vetCase.latitude,
    longitude: vetCase.longitude,
    village: vetCase.village || 'Rampur Khurd',
    district: vetCase.district || 'Varanasi',
    missingDataNotes,
  }
}

function calculateAgeFromDob(dobStr: string): number | undefined {
  const t = new Date(dobStr).getTime()
  if (isNaN(t)) return undefined
  const diffYears = (Date.now() - t) / (365.25 * 86400000)
  return Math.max(0, Math.round(diffYears * 10) / 10)
}
