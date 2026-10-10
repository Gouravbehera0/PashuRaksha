// ============================================================
// PASHURAKSHA (पशुरक्षा) — SYMPTOM PATTERN ANALYSIS ENGINE
// Stage 10: Advanced AI & Disease Intelligence
// Standard: Transparent Syndromic Pattern Identification (No Auto-Diagnosis)
// "Detect Early. Prevent Outbreaks. Protect Livestock."
// ============================================================

import type { ExtractedCaseFeatures } from './featureEngineering'
import type { SymptomPatternResult } from './intelligenceTypes'

export const PATTERN_ANALYSIS_VERSION = 'pashuraksha-pattern-v1.0'

interface PatternRule {
  id: string
  patternName: string
  category: SymptomPatternResult['category']
  requiredKeys: string[]
  anyOfKeys?: string[]
  severityTier: SymptomPatternResult['severityTier']
  clinicalIndicators: string[]
  recommendedActions: string[]
  immediateReview: boolean
}

const REGISTERED_PATTERNS: PatternRule[] = [
  {
    id: 'pat-vesicular-mucosal',
    patternName: 'Acute Vesicular & Oral Syndrome',
    category: 'vesicular_mucosal',
    requiredKeys: ['blisters or ulcers in mouth/hooves'],
    anyOfKeys: ['excessive salivation / drooling', 'drooling', 'high fever (>104°f)', 'fever', 'limping / lameness'],
    severityTier: 'CRITICAL',
    immediateReview: true,
    clinicalIndicators: [
      'Mucosal epithelial ulceration or coronary band vesicle reported',
      'Accompanied by hypersalivation, pyrexia, or locomotor reluctance',
      'Correlates with acute vesicular aphthovirus syndromic signal',
    ],
    recommendedActions: [
      'Enforce immediate stall isolation of the animal from common grazing areas.',
      'Veterinary Officer physical inspection within 4 hours with PPE protocols.',
      'Collect unruptured vesicular fluid or epithelial tissue tag for District Lab PCR.',
      'Alert block Mobile Veterinary Unit (MVU) for ring biosecurity inspection.',
    ],
  },
  {
    id: 'pat-bronchopulmonary',
    patternName: 'Acute Pyrexia & Bronchopulmonary Distress',
    category: 'respiratory',
    requiredKeys: ['difficulty breathing'],
    anyOfKeys: ['fever', 'high fever (>104°f)', 'cough', 'nasal discharge'],
    severityTier: 'HIGH',
    immediateReview: true,
    clinicalIndicators: [
      'Severe respiratory compromise (dyspnea) documented',
      'Active systemic inflammatory involvement (pyrexia / discharge)',
      'High risk for infectious bovine respiratory consolidation (BRD)',
    ],
    recommendedActions: [
      'Perform thorough thoracic auscultation for crackles, wheezes, or pleural friction rubs.',
      'Administer NSAID antipyretics and broad-spectrum antimicrobial as indicated.',
      'Ensure well-ventilated, dry, draft-free microclimate for the animal.',
      'Collect deep nasal swab if symptoms persist beyond 48 hours.',
    ],
  },
  {
    id: 'pat-hemorrhagic-enteric',
    patternName: 'Acute Hemorrhagic Enteritis Syndrome',
    category: 'enteric_digestive',
    requiredKeys: ['bloody stool'],
    anyOfKeys: ['fever', 'high fever (>104°f)', 'weakness', 'diarrhea'],
    severityTier: 'CRITICAL',
    immediateReview: true,
    clinicalIndicators: [
      'Severe lower gastrointestinal mucosal bleeding (melena / fresh blood)',
      'Rapid dehydration and systemic endotoxemia risk',
      'Syndromic signal consistent with acute bacteremia or protozoal coccidiosis',
    ],
    recommendedActions: [
      'Immediate intravenous fluid resuscitation and electrolyte replacement.',
      'Collect fecal sample for immediate DDDL parasitology and culture.',
      'Isolate from communal herd water troughs to avoid waterborne transmission.',
    ],
  },
  {
    id: 'pat-cutaneous-nodular',
    patternName: 'Cutaneous Circumscribed Nodular Syndrome',
    category: 'vesicular_mucosal',
    requiredKeys: ['skin lesions / nodules'],
    anyOfKeys: ['fever', 'swelling', 'sudden drop in milk production', 'lethargy'],
    severityTier: 'HIGH',
    immediateReview: true,
    clinicalIndicators: [
      'Multiple circumscribed cutaneous nodules or eruptive skin lesions',
      'Systemic involvement (production collapse / fever)',
      'Correlates with capripoxvirus / vector-borne nodular transmission signals',
    ],
    recommendedActions: [
      'Implement vector-control spraying (flies, ticks, mosquitoes) around herd sheds.',
      'Clean lesions with mild antiseptic (potassium permanganate or povidone iodine).',
      'Notify block veterinary cadre for ring vaccination schedule verification.',
    ],
  },
  {
    id: 'pat-locomotor-swelling',
    patternName: 'Localized Edema & Locomotor Discomfort',
    category: 'locomotor_musculoskeletal',
    requiredKeys: ['swelling'],
    anyOfKeys: ['limping / lameness', 'weakness'],
    severityTier: 'ELEVATED',
    immediateReview: false,
    clinicalIndicators: [
      'Localized limb or joint edema without acute systemic respiratory distress',
      'Pododermatitis, physical contusion, or localized arthritis indicated',
    ],
    recommendedActions: [
      'Inspect hooves, interdigital space, and joints for mechanical puncture or foreign bodies.',
      'Apply cold compress / antiseptic dressing and restrict movement.',
      'Monitor body temperature twice daily to rule out creeping cellulitis.',
    ],
  },
  {
    id: 'pat-undifferentiated-systemic',
    patternName: 'Undifferentiated Pyrexia & Inappetence',
    category: 'systemic_pyretic',
    requiredKeys: ['fever'],
    anyOfKeys: ['loss of appetite', 'lethargy', 'weakness'],
    severityTier: 'ELEVATED',
    immediateReview: false,
    clinicalIndicators: [
      'Elevated body temperature with non-specific appetite reduction',
      'Early prodromal phase of systemic infection or tick-borne disease',
    ],
    recommendedActions: [
      'Review herd tick burden; check ear folds, udder, and perineal region.',
      'Re-check body temperature in 12 hours; if >104°F, dispatch MVU.',
      'Provide palatable green fodder and clean electrolyte water.',
    ],
  },
]

/**
 * Analyzes case features and matches explainable syndromic patterns
 */
export function analyzeSymptomPatterns(features: ExtractedCaseFeatures): SymptomPatternResult {
  const normKeys = new Set(features.normalizedSymptoms.map((s) => s.normalizedKey))
  const matchedPatterns: PatternRule[] = []

  // Check registered patterns
  for (const rule of REGISTERED_PATTERNS) {
    const hasRequired = rule.requiredKeys.every((k) => normKeys.has(k))
    if (!hasRequired) continue

    let hasAnyOf = true
    if (rule.anyOfKeys && rule.anyOfKeys.length > 0) {
      hasAnyOf = rule.anyOfKeys.some((k) => normKeys.has(k))
    }

    if (hasRequired && hasAnyOf) {
      matchedPatterns.push(rule)
    }
  }

  // Priority selection: pick most severe matched pattern
  const severityRank: Record<SymptomPatternResult['severityTier'], number> = {
    CRITICAL: 4,
    HIGH: 3,
    ELEVATED: 2,
    ROUTINE: 1,
  }

  matchedPatterns.sort((a, b) => severityRank[b.severityTier] - severityRank[a.severityTier])

  const selectedPattern = matchedPatterns[0]

  // Construct factor contributions
  const contributingFactors: SymptomPatternResult['contributingFactors'] = []

  features.normalizedSymptoms.forEach((s) => {
    let influence = 20
    if (s.clinicalSignificance === 'critical') influence = 40
    else if (s.clinicalSignificance === 'severe') influence = 30
    else if (s.clinicalSignificance === 'moderate') influence = 20
    else influence = 10

    contributingFactors.push({
      factor: s.raw,
      influence,
      description: `${s.physiologicalSign} (${s.clinicalSignificance} clinical significance)`,
    })
  })

  if (features.symptomSeverity === 'Severe') {
    contributingFactors.push({
      factor: 'Observer Severity: Severe',
      influence: 25,
      description: 'Field observer noted acute distress or severe functional impairment',
    })
  }

  if (features.hasMortalitySignal) {
    contributingFactors.push({
      factor: 'Mortality Association',
      influence: 35,
      description: 'Recent mortality event reported in the same herd or village cluster',
    })
  }

  const dataLimitations: string[] = [
    ...features.missingDataNotes,
    'Symptom observations are reported by field users and do NOT constitute a definitive pathological diagnosis without laboratory validation.',
    'Statistical pattern signals serve solely as veterinary decision-support triage recommendations.',
  ]

  if (selectedPattern) {
    return {
      id: `spr-${features.caseId}-${Date.now().toString(36)}`,
      patternName: selectedPattern.patternName,
      category: selectedPattern.category,
      matchedSymptoms: features.normalizedSymptoms.map((s) => s.raw),
      clinicalIndicators: selectedPattern.clinicalIndicators,
      contributingFactors,
      severityTier: selectedPattern.severityTier,
      requiresImmediateReview: selectedPattern.immediateReview,
      recommendedClinicalActions: selectedPattern.recommendedActions,
      dataLimitations,
      analysisVersion: PATTERN_ANALYSIS_VERSION,
      analyzedAt: new Date().toISOString(),
    }
  }

  // Generic unassigned fallback
  const fallbackTier: SymptomPatternResult['severityTier'] =
    features.symptomSeverity === 'Severe'
      ? 'HIGH'
      : features.symptomSeverity === 'Moderate'
      ? 'ELEVATED'
      : 'ROUTINE'

  return {
    id: `spr-generic-${features.caseId}`,
    patternName: 'Non-Specific Clinical Presentation',
    category: features.affectedCategories[0] || 'general_unspecified',
    matchedSymptoms: features.normalizedSymptoms.map((s) => s.raw),
    clinicalIndicators: [
      'Presentation does not meet specialized syndromic thresholds',
      `Primary observed signs: ${features.normalizedSymptoms.map((s) => s.raw).join(', ') || 'General Malaise'}`,
    ],
    contributingFactors,
    severityTier: fallbackTier,
    requiresImmediateReview: fallbackTier === 'HIGH',
    recommendedClinicalActions: [
      'Standard physical examination during scheduled veterinary rounds.',
      'Check vital parameters (temperature, heart rate, rumination frequency).',
      'Advise owner to record appetite and temperature twice daily.',
    ],
    dataLimitations,
    analysisVersion: PATTERN_ANALYSIS_VERSION,
    analyzedAt: new Date().toISOString(),
  }
}
