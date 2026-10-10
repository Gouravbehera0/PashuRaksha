// ============================================================
// PASHURAKSHA (पशुरक्षा) — LIVESTOCK HEALTH RISK ENGINE
// Stage 4: Transparent 0–100 Explainable Risk Scoring Engine
// Standard: Decision support & early warning (No auto-diagnosis)
// ============================================================

import { supabase } from '@/lib/supabase'
import type { VeterinaryCase } from '@/types'
import { evaluateSymptomSignals } from './symptomRules'
import { haversineDistanceKm } from './clusterDetection'
import type {
  RiskAssessment,
  RiskLevel,
  RiskEngineConfig,
  RiskFactorContribution
} from './riskTypes'

export const DEFAULT_RISK_CONFIG: RiskEngineConfig = {
  version: 'risk-engine-v1',
  weights: {
    symptomSeverityMax: 30,
    symptomCombinationMax: 20,
    affectedAnimalsMax: 20,
    recentNearbyCasesMax: 15,
    mortalitySignalMax: 15,
  },
  thresholds: {
    lowMax: 24,
    mediumMax: 49,
    highMax: 74,
    criticalMin: 75,
  },
}

// In-memory fallback store for offline evaluations & demo sessions
let inMemoryAssessments: RiskAssessment[] = [
  {
    id: 'risk-001',
    case_id: 'case-001',
    animal_id: 'a003-demo-gir-heifer',
    risk_score: 68,
    risk_level: 'HIGH',
    symptom_score: 25,
    severity_score: 18,
    cluster_score: 11,
    mortality_score: 0,
    affected_animal_score: 14,
    factors: {
      'Fever': 14,
      'Cough': 11,
      'Bronchopulmonary Cluster Syndrome': 8,
      'nearby_cases': 11,
      'affected_herd': 14,
    },
    contributions: [
      { name: 'Fever', points: 14, description: 'Pyrexia indicative of acute systemic response', category: 'symptom' },
      { name: 'Cough', points: 11, description: 'Airway congestion symptom', category: 'symptom' },
      { name: 'Bronchopulmonary Cluster Syndrome', points: 8, description: 'Syndromic respiratory signal', category: 'severity' },
      { name: 'Nearby Cases', points: 11, description: '2 similar cases reported within 4 km', category: 'nearby_cluster' },
      { name: 'Herd Susceptibility', points: 14, description: 'Farmer reports multiple in-herd animals showing dullness', category: 'affected_animals' },
    ],
    reasons: [
      'Severe clinical severity reported by field observer',
      'Syndromic signal detected: Bronchopulmonary Cluster Syndrome',
      '2 similar livestock health cases reported nearby within 4 km in past 7 days',
    ],
    recommended_action: 'Clinical veterinary examination and supportive therapy recommended. Isolate heifer from general herd.',
    engine_version: 'risk-engine-v1',
    calculated_at: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: 'risk-002',
    case_id: 'case-002',
    animal_id: 'a002-demo-murrah-buf',
    risk_score: 42,
    risk_level: 'MEDIUM',
    symptom_score: 18,
    severity_score: 8,
    cluster_score: 6,
    mortality_score: 0,
    affected_animal_score: 10,
    factors: {
      'Swelling': 6,
      'Lethargy': 4,
      'Limping / Lameness': 8,
      'nearby_cases': 6,
      'affected_herd': 10,
    },
    contributions: [
      { name: 'Swelling', points: 6, description: 'Localized tissue swelling / edema', category: 'symptom' },
      { name: 'Limping / Lameness', points: 8, description: 'Locomotor discomfort', category: 'symptom' },
      { name: 'Lethargy', points: 4, description: 'Reduced activity', category: 'symptom' },
      { name: 'Nearby Cases', points: 6, description: '1 case in same village buffer', category: 'nearby_cluster' },
    ],
    reasons: [
      'Moderate locomotor swelling observed',
      'Low proximity cluster signal',
    ],
    recommended_action: 'Perform local physical exam, anti-inflammatory protocol, and laboratory blood smear.',
    engine_version: 'risk-engine-v1',
    calculated_at: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
  {
    id: 'risk-003',
    case_id: 'case-003',
    animal_id: 'a001-demo-gir-cow',
    risk_score: 86,
    risk_level: 'CRITICAL',
    symptom_score: 30,
    severity_score: 20,
    cluster_score: 14,
    mortality_score: 0,
    affected_animal_score: 20,
    factors: {
      'Blisters or Ulcers in Mouth/Hooves': 17,
      'Excessive Salivation / Drooling': 14,
      'Fever': 14,
      'Acute Vesicular & Oral Syndrome': 12,
      'nearby_cases': 14,
      'affected_herd': 20,
    },
    contributions: [
      { name: 'Blisters or Ulcers', points: 17, description: 'Vesicular lesions on oral mucosa and feet', category: 'symptom' },
      { name: 'Excessive Salivation', points: 14, description: 'Profuse ropy salivation', category: 'symptom' },
      { name: 'Fever', points: 14, description: 'Pyrexia', category: 'symptom' },
      { name: 'Acute Vesicular & Oral Syndrome', points: 12, description: 'High-concern vesicular syndromic signal', category: 'severity' },
      { name: 'Nearby Cases', points: 14, description: 'Multiple cases reported in 3 km epicenter', category: 'nearby_cluster' },
      { name: 'Herd Exposure', points: 20, description: 'Entire milking stall at risk', category: 'affected_animals' },
    ],
    reasons: [
      'Severe vesicular mucosal lesions and salivation detected',
      'Syndromic signal detected: Acute Vesicular & Oral Syndrome',
      'Multiple cases within 3 km in same epidemiological zone',
      'High risk of rapid transmission within village herd',
    ],
    recommended_action: 'CRITICAL ALERT: Urgent Mobile Veterinary Unit (MVU) inspection. Enforce 5km containment cordon and sample collection for viral confirmation.',
    engine_version: 'risk-engine-v1',
    calculated_at: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
]

/**
 * Calculate 0–100 explainable risk score for a veterinary case
 */
export function calculateCaseRisk(
  c: VeterinaryCase,
  nearbyCases: VeterinaryCase[] = [],
  hasMortalitySignal = false,
  config: RiskEngineConfig = DEFAULT_RISK_CONFIG
): RiskAssessment {
  const factors: Record<string, number> = {}
  const allContributions: RiskFactorContribution[] = []
  const reasons: string[] = []

  // 1. Symptom Severity & Combinations (Max 30 + 20 = 50)
  const symptomEval = evaluateSymptomSignals(
    c.symptoms || [],
    c.reported_severity || 'Moderate',
    config.weights.symptomSeverityMax,
    config.weights.symptomCombinationMax
  )

  const symptomScore = symptomEval.symptomScore
  const severityScore = symptomEval.combinationScore
  Object.assign(factors, symptomEval.factors)
  allContributions.push(...symptomEval.contributions)
  reasons.push(...symptomEval.reasons)

  // 2. Number of Affected Animals Signal (Max 20)
  // Higher if description mentions multiple animals or severe drop in production
  let affectedAnimalScore = 8
  const desc = (c.description || '').toLowerCase()
  if (desc.includes('all cows') || desc.includes('entire herd') || desc.includes('multiple') || desc.includes('both')) {
    affectedAnimalScore = 18
    reasons.push('Owner reports multiple animals in herd displaying symptoms')
  } else if (c.symptoms.includes('Sudden Drop in Milk Production') || c.reported_severity === 'Severe') {
    affectedAnimalScore = 14
  }
  affectedAnimalScore = Math.min(config.weights.affectedAnimalsMax, affectedAnimalScore)
  factors['affected_animals'] = affectedAnimalScore
  allContributions.push({
    name: 'Herd Impact Factor',
    points: affectedAnimalScore,
    description: `${affectedAnimalScore >= 15 ? 'Multiple herd animals affected' : 'Individual patient observation'}`,
    category: 'affected_animals',
  })

  // 3. Recent Nearby Cases Signal (Max 15)
  let nearbyCount = 0
  if (c.latitude && c.longitude && nearbyCases.length > 0) {
    const now = Date.now()
    const sevenDaysMs = 7 * 24 * 3600 * 1000

    for (const other of nearbyCases) {
      if (other.id === c.id || !other.latitude || !other.longitude) continue
      const t = new Date(other.reported_at || other.created_at).getTime()
      if (now - t <= sevenDaysMs) {
        const dist = haversineDistanceKm(c.latitude, c.longitude, other.latitude, other.longitude)
        if (dist <= 5.0) {
          nearbyCount++
        }
      }
    }
  }

  let clusterScore = 0
  if (nearbyCount >= 4) {
    clusterScore = 15
    reasons.push(`High density signal: ${nearbyCount} similar cases reported within 5 km in the last 7 days`)
  } else if (nearbyCount >= 2) {
    clusterScore = 11
    reasons.push(`Moderate proximity signal: ${nearbyCount} similar cases reported within 5 km`)
  } else if (nearbyCount === 1) {
    clusterScore = 6
    reasons.push('1 nearby case detected within 5 km radius')
  }

  clusterScore = Math.min(config.weights.recentNearbyCasesMax, clusterScore)
  factors['nearby_cases'] = clusterScore
  allContributions.push({
    name: 'Geospatial Proximity Signal',
    points: clusterScore,
    description: `${nearbyCount} similar cases reported in vicinity within 7 days`,
    category: 'nearby_cluster',
  })

  // 4. Mortality Signal (Max 15)
  let mortalityScore = 0
  if (hasMortalitySignal || desc.includes('dead') || desc.includes('death') || desc.includes('died')) {
    mortalityScore = 15
    reasons.push('Mortality signal reported in locality or herd')
  }
  factors['mortality_signal'] = mortalityScore
  if (mortalityScore > 0) {
    allContributions.push({
      name: 'Mortality Presence',
      points: mortalityScore,
      description: 'Confirmed or suspected animal mortality in current reporting window',
      category: 'mortality',
    })
  }

  // 5. Total Risk Score (0–100)
  const rawTotal = symptomScore + severityScore + affectedAnimalScore + clusterScore + mortalityScore
  const riskScore = Math.min(100, Math.max(0, Math.round(rawTotal)))

  // Determine Risk Level
  let riskLevel: RiskLevel = 'LOW'
  if (riskScore >= config.thresholds.criticalMin) {
    riskLevel = 'CRITICAL'
  } else if (riskScore >= config.thresholds.mediumMax + 1) {
    riskLevel = 'HIGH'
  } else if (riskScore >= config.thresholds.lowMax + 1) {
    riskLevel = 'MEDIUM'
  }

  // Clinical Recommendation Text (Explainable & safe)
  let recommendedAction = 'Routine observation by livestock owner. Seek veterinary assistance if symptoms persist past 48 hours.'
  if (riskLevel === 'CRITICAL') {
    recommendedAction = 'CRITICAL ALERT: Urgent veterinary investigation recommended within 6 hours. Implement immediate stall isolation, withhold common grazing, and order diagnostic swab/blood panel.'
  } else if (riskLevel === 'HIGH') {
    recommendedAction = 'HIGH RISK: Clinical examination by Veterinary Officer recommended within 24 hours. Monitor vital signs and prepare diagnostic sample kit.'
  } else if (riskLevel === 'MEDIUM') {
    recommendedAction = 'ELEVATED CONCERN: Veterinary review advised. Provide symptomatic hydration, monitor appetite, and report any spread to co-housed stock.'
  }

  const assessment: RiskAssessment = {
    id: `risk-${Date.now()}`,
    case_id: c.id,
    animal_id: c.animal_id,
    risk_score: riskScore,
    risk_level: riskLevel,
    symptom_score: symptomScore,
    severity_score: severityScore,
    cluster_score: clusterScore,
    mortality_score: mortalityScore,
    affected_animal_score: affectedAnimalScore,
    factors,
    contributions: allContributions,
    reasons,
    recommended_action: recommendedAction,
    engine_version: config.version,
    calculated_at: new Date().toISOString(),
  }

  return assessment
}

/**
 * Save risk assessment to Supabase and in-memory cache
 */
export async function saveRiskAssessment(assessment: RiskAssessment): Promise<RiskAssessment> {
  inMemoryAssessments.unshift(assessment)

  try {
    const { error } = await supabase.from('risk_assessments').insert([{
      case_id: assessment.case_id,
      animal_id: assessment.animal_id,
      risk_score: assessment.risk_score,
      risk_level: assessment.risk_level,
      symptom_score: assessment.symptom_score,
      severity_score: assessment.severity_score,
      cluster_score: assessment.cluster_score,
      mortality_score: assessment.mortality_score,
      affected_animal_score: assessment.affected_animal_score,
      factors: assessment.factors,
      reasons: assessment.reasons,
      recommended_action: assessment.recommended_action,
      engine_version: assessment.engine_version,
      calculated_at: assessment.calculated_at,
    }])

    if (error) {
      console.warn('[RiskEngine] Supabase insert notice:', error)
    }
  } catch (err) {
    // Non-blocking
  }

  // Dispatch alert for HIGH or CRITICAL health risks (deduplicated)
  if (assessment.risk_level === 'HIGH' || assessment.risk_level === 'CRITICAL') {
    try {
      const { createAlert } = await import('@/services/alertService')
      const isCritical = assessment.risk_level === 'CRITICAL'
      await createAlert({
        user_id: 'demo-vet',
        title: `${isCritical ? 'CRITICAL RISK ALERT' : 'HIGH RISK ALERT'}: Score ${assessment.risk_score}/100`,
        message: `Case ${assessment.case_id} reached ${assessment.risk_level} risk level. Reasons: ${assessment.reasons.slice(0, 2).join('; ')}. Action: ${assessment.recommended_action}`,
        alert_type: 'Health',
        severity: isCritical ? 'danger' : 'warning',
        animal_id: assessment.animal_id,
      })
    } catch (err) {
      // Non-blocking
    }
  }

  return assessment
}

/**
 * Fetch risk assessment for a specific case
 */
export async function getRiskAssessmentByCaseId(caseId: string): Promise<RiskAssessment | null> {
  try {
    const { data, error } = await supabase
      .from('risk_assessments')
      .select('*')
      .eq('case_id', caseId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!error && data) {
      return data as RiskAssessment
    }
  } catch (err) {
    // Fallback to cache
  }

  const found = inMemoryAssessments.find((a) => a.case_id === caseId)
  return found || null
}

/**
 * Fetch all historical risk assessments
 */
export async function getAllRiskAssessments(): Promise<RiskAssessment[]> {
  try {
    const { data, error } = await supabase
      .from('risk_assessments')
      .select('*')
      .order('calculated_at', { ascending: false })

    if (!error && data && data.length > 0) {
      return data as RiskAssessment[]
    }
  } catch (err) {
    // Fallback
  }

  return inMemoryAssessments
}
