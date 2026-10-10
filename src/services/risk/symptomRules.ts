// ============================================================
// PASHURAKSHA (पशुरक्षा) — CONFIGURABLE SYMPTOM RULES
// Stage 4: Symptom Signals, Weights & Syndromic Combinations
// Standard: Health-risk signals only (Does not diagnose diseases)
// ============================================================

import type { RiskFactorContribution } from './riskTypes'

export interface SymptomRuleDefinition {
  weight: number
  category: 'respiratory' | 'systemic' | 'vesicular' | 'digestive' | 'general'
  signalDescription: string
}

export const SYMPTOM_WEIGHTS: Record<string, SymptomRuleDefinition> = {
  // Respiratory signals
  'Difficulty Breathing': { weight: 12, category: 'respiratory', signalDescription: 'Acute dyspnea / lower respiratory distress' },
  'Cough': { weight: 8, category: 'respiratory', signalDescription: 'Airway irritation / broncho-alveolar symptom' },
  'Nasal Discharge': { weight: 7, category: 'respiratory', signalDescription: 'Mucopurulent upper respiratory involvement' },

  // Vesicular / Mucosal signals
  'Blisters or Ulcers in Mouth/Hooves': { weight: 12, category: 'vesicular', signalDescription: 'Oral / coronary band vesicle signal' },
  'Excessive Salivation / Drooling': { weight: 10, category: 'vesicular', signalDescription: 'Stomatitis / ropy salivation signal' },
  'Skin Lesions / Nodules': { weight: 10, category: 'vesicular', signalDescription: 'Cutaneous circumscribed nodular signal' },

  // Systemic signals
  'Fever': { weight: 10, category: 'systemic', signalDescription: 'Pyrexia indicative of acute systemic immune response' },
  'High Fever (>104°F)': { weight: 14, category: 'systemic', signalDescription: 'Hyperpyrexia critical systemic alert' },
  'Abnormal Behaviour': { weight: 8, category: 'systemic', signalDescription: 'Neurological / severe prostration signal' },
  'Sudden Drop in Milk Production': { weight: 6, category: 'systemic', signalDescription: 'Acute production collapse indicator' },

  // Digestive / Enteric signals
  'Diarrhea': { weight: 8, category: 'digestive', signalDescription: 'Enteric inflammation signal' },
  'Bloody Stool': { weight: 12, category: 'digestive', signalDescription: 'Hemorrhagic enteritis severe signal' },

  // General & Locomotor
  'Swelling': { weight: 6, category: 'general', signalDescription: 'Localized edema / tissue swelling' },
  'Limping / Lameness': { weight: 7, category: 'general', signalDescription: 'Pododermatitis / locomotor pain' },
  'Loss of Appetite': { weight: 5, category: 'general', signalDescription: 'Inappetence / ruminal stasis indicator' },
  'Weakness': { weight: 5, category: 'general', signalDescription: 'Generalized asthenia' },
  'Lethargy': { weight: 4, category: 'general', signalDescription: 'Reduced alertness' },
}

export const SEVERITY_MULTIPLIERS: Record<'Mild' | 'Moderate' | 'Severe', number> = {
  Mild: 0.7,
  Moderate: 1.0,
  Severe: 1.4,
}

export interface SyndromicCombination {
  name: string
  requiredSymptoms: string[]
  bonusPoints: number
  description: string
}

export const SYNDROMIC_COMBINATIONS: SyndromicCombination[] = [
  {
    name: 'Acute Vesicular & Oral Syndrome',
    requiredSymptoms: ['Blisters or Ulcers in Mouth/Hooves', 'Excessive Salivation / Drooling'],
    bonusPoints: 12,
    description: 'Concurrent oral lesions and profuse drooling indicate high-priority vesicular alert',
  },
  {
    name: 'Lower Respiratory Distress Syndrome',
    requiredSymptoms: ['Fever', 'Difficulty Breathing'],
    bonusPoints: 10,
    description: 'Pyrexia with acute dyspnea indicates severe pulmonary involvement',
  },
  {
    name: 'Bronchopulmonary Cluster Syndrome',
    requiredSymptoms: ['Cough', 'Nasal Discharge', 'Fever'],
    bonusPoints: 8,
    description: 'Classic triad of contagious upper/lower respiratory condition',
  },
  {
    name: 'Acute Enteric Dehydration Syndrome',
    requiredSymptoms: ['Diarrhea', 'Weakness', 'Loss of Appetite'],
    bonusPoints: 8,
    description: 'Rapid fluid loss and gastrointestinal debility',
  },
]

/**
 * Match user symptoms against rule weights flexibly (handles partial match and casing)
 */
export function findMatchingSymptomRule(symptom: string): { key: string; rule: SymptomRuleDefinition } | null {
  const norm = symptom.toLowerCase().trim()

  for (const [key, rule] of Object.entries(SYMPTOM_WEIGHTS)) {
    if (key.toLowerCase() === norm) {
      return { key, rule }
    }
  }

  // Partial match fallback
  for (const [key, rule] of Object.entries(SYMPTOM_WEIGHTS)) {
    const k = key.toLowerCase()
    if (norm.includes(k) || k.includes(norm)) {
      return { key, rule }
    }
  }

  return null
}

/**
 * Evaluate symptom signals and return explainable components
 */
export function evaluateSymptomSignals(
  symptoms: string[],
  reportedSeverity: 'Mild' | 'Moderate' | 'Severe' = 'Moderate',
  maxSymptomScore = 30,
  maxCombinationScore = 20
): {
  symptomScore: number
  combinationScore: number
  factors: Record<string, number>
  contributions: RiskFactorContribution[]
  reasons: string[]
} {
  const factors: Record<string, number> = {}
  const contributions: RiskFactorContribution[] = []
  const reasons: string[] = []

  let rawSymptomPoints = 0
  const mult = SEVERITY_MULTIPLIERS[reportedSeverity] || 1.0

  // 1. Calculate individual symptom signals
  for (const sym of symptoms) {
    const match = findMatchingSymptomRule(sym)
    const baseWeight = match ? match.rule.weight : 5
    const adjustedPoints = Math.round(baseWeight * mult)

    rawSymptomPoints += adjustedPoints
    factors[sym] = adjustedPoints

    contributions.push({
      name: sym,
      points: adjustedPoints,
      description: match?.rule.signalDescription || `Reported symptom (${reportedSeverity})`,
      category: 'symptom',
    })
  }

  // Cap symptom score to configured maximum
  const symptomScore = Math.min(maxSymptomScore, rawSymptomPoints)

  if (reportedSeverity === 'Severe') {
    reasons.push('Severe clinical severity reported by field observer')
  }
  if (symptoms.length >= 3) {
    reasons.push(`Multiple concurrent symptoms (${symptoms.length}) presented`)
  }

  // 2. Evaluate Syndromic Combinations
  let rawComboPoints = 0
  for (const combo of SYNDROMIC_COMBINATIONS) {
    const hasAll = combo.requiredSymptoms.every((req) =>
      symptoms.some((s) => s.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(s.toLowerCase()))
    )

    if (hasAll) {
      rawComboPoints += combo.bonusPoints
      factors[combo.name] = combo.bonusPoints
      contributions.push({
        name: combo.name,
        points: combo.bonusPoints,
        description: combo.description,
        category: 'severity',
      })
      reasons.push(`Syndromic signal detected: ${combo.name}`)
    }
  }

  const combinationScore = Math.min(maxCombinationScore, rawComboPoints)

  return {
    symptomScore,
    combinationScore,
    factors,
    contributions,
    reasons,
  }
}
