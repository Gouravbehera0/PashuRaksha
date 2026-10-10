// ============================================================
// PASHURAKSHA (पशुरक्षा) — VETERINARY CASE PRIORITIZATION ENGINE
// Stage 10: Advanced AI & Disease Intelligence
// Standard: Transparent Workflow Triage Recommendations (Non-Diagnostic)
// "Detect Early. Prevent Outbreaks. Protect Livestock."
// ============================================================

import type { VeterinaryCase } from '@/types'
import type { RiskAssessment } from '@/services/risk/riskTypes'
import type {
  CasePrioritizationRecommendation,
  CasePrioritizationLabel,
  CasePrioritizationFactor
} from './intelligenceTypes'
import { extractCaseFeatures } from './featureEngineering'

export const PRIORITIZATION_VERSION = 'pashuraksha-prioritization-v1.0'

export interface PrioritizationWeights {
  riskScoreWeight: number // max 35 pts
  severityWeight: number // max 20 pts
  mortalityWeight: number // max 20 pts
  latencyWaitWeight: number // max 15 pts
  clusterAssociationWeight: number // max 10 pts
}

export const DEFAULT_PRIORITIZATION_WEIGHTS: PrioritizationWeights = {
  riskScoreWeight: 35,
  severityWeight: 20,
  mortalityWeight: 20,
  latencyWaitWeight: 15,
  clusterAssociationWeight: 10,
}

// In-memory store for veterinarian priority overrides & audit tracking
const priorityOverrideStore = new Map<
  string,
  {
    previousPriority: CasePrioritizationLabel
    newPriority: CasePrioritizationLabel
    reason: string
    overriddenBy: string
    overriddenAt: string
  }
>()

/**
 * Calculates a transparent, multi-factor workflow triage recommendation for a veterinary case
 */
export function calculateCasePrioritization(
  vetCase: VeterinaryCase,
  riskAssessment?: RiskAssessment | null,
  hasMortality: boolean = false,
  isPartOfActiveCluster: boolean = false,
  weights: PrioritizationWeights = DEFAULT_PRIORITIZATION_WEIGHTS
): CasePrioritizationRecommendation {
  const features = extractCaseFeatures(vetCase, vetCase.animal, hasMortality)
  const factors: CasePrioritizationFactor[] = []
  const contributingReasons: string[] = []

  // Factor 1: Stage 4 Baseline Risk Score (0–100 scaled to max 35 pts)
  const baselineScore = riskAssessment?.risk_score ?? (features.severityScoreWeight * 60)
  const riskContribution = Math.round((baselineScore / 100) * weights.riskScoreWeight)
  factors.push({
    name: 'Epidemiological Risk Score',
    weight: weights.riskScoreWeight,
    scoreContribution: riskContribution,
    description: `Baseline risk engine evaluated score of ${baselineScore}/100`,
    sourceField: 'risk_assessment.risk_score',
  })
  if (baselineScore >= 60) {
    contributingReasons.push(`High deterministic risk score (${baselineScore}/100) contributing +${riskContribution} pts`)
  }

  // Factor 2: Reported Symptom Severity (max 20 pts)
  let severityContribution = 5
  if (features.symptomSeverity === 'Severe') {
    severityContribution = weights.severityWeight
    contributingReasons.push(`Field observer reported Severe distress (+${severityContribution} pts)`)
  } else if (features.symptomSeverity === 'Moderate') {
    severityContribution = Math.round(weights.severityWeight * 0.5)
  }
  factors.push({
    name: 'Reported Clinical Severity',
    weight: weights.severityWeight,
    scoreContribution: severityContribution,
    description: `Observer classified distress level as "${features.symptomSeverity}"`,
    sourceField: 'veterinary_cases.reported_severity',
  })

  // Factor 3: Mortality Involvement (max 20 pts)
  const mortalityContribution = hasMortality ? weights.mortalityWeight : 0
  factors.push({
    name: 'Mortality Association',
    weight: weights.mortalityWeight,
    scoreContribution: mortalityContribution,
    description: hasMortality ? 'Documented livestock death associated with herd or village sector' : 'No mortality recorded',
    sourceField: 'mortality_reports',
  })
  if (hasMortality) {
    contributingReasons.push(`Linked mortality signal present (+${mortalityContribution} pts)`)
  }

  // Factor 4: Triage Latency / Wait Duration (max 15 pts)
  let latencyContribution = 0
  const waitHours = features.durationAwaitingReviewHours
  if (waitHours >= 24) {
    latencyContribution = weights.latencyWaitWeight
    contributingReasons.push(`Awaiting triage over 24 hours (${waitHours}h elapsed, +${latencyContribution} pts)`)
  } else if (waitHours >= 12) {
    latencyContribution = Math.round(weights.latencyWaitWeight * 0.7)
    contributingReasons.push(`Awaiting triage over 12 hours (${waitHours}h elapsed, +${latencyContribution} pts)`)
  } else if (waitHours >= 4) {
    latencyContribution = Math.round(weights.latencyWaitWeight * 0.35)
  }
  factors.push({
    name: 'Triage Queue Latency',
    weight: weights.latencyWaitWeight,
    scoreContribution: latencyContribution,
    description: `${waitHours} hours elapsed since report intake`,
    sourceField: 'veterinary_cases.reported_at',
  })

  // Factor 5: Outbreak Cluster Association (max 10 pts)
  const clusterContribution = isPartOfActiveCluster ? weights.clusterAssociationWeight : 0
  factors.push({
    name: 'Active Outbreak Cordon Association',
    weight: weights.clusterAssociationWeight,
    scoreContribution: clusterContribution,
    description: isPartOfActiveCluster ? 'Case is located within an active outbreak investigation buffer' : 'No active cluster containment cordon',
    sourceField: 'outbreak_clusters',
  })
  if (isPartOfActiveCluster) {
    contributingReasons.push(`Case is located inside an active outbreak surveillance cordon (+${clusterContribution} pts)`)
  }

  // Composite Calculation (capped at 100)
  const compositeScore = Math.min(
    100,
    riskContribution + severityContribution + mortalityContribution + latencyContribution + clusterContribution
  )

  // Map to recommended workflow priority
  let recommendedPriority: CasePrioritizationLabel = 'ROUTINE'
  if (compositeScore >= 75) {
    recommendedPriority = 'CRITICAL REVIEW'
  } else if (compositeScore >= 50) {
    recommendedPriority = 'URGENT REVIEW'
  } else if (compositeScore >= 25) {
    recommendedPriority = 'PRIORITY REVIEW'
  }

  // Check for existing veterinary override
  const existingOverride = priorityOverrideStore.get(vetCase.id)

  return {
    caseId: vetCase.id,
    caseNumber: vetCase.case_number,
    recommendedPriority: existingOverride ? existingOverride.newPriority : recommendedPriority,
    compositeScore,
    status: existingOverride ? 'Overridden' : 'Recommended',
    factors,
    contributingReasons: contributingReasons.length > 0 ? contributingReasons : ['Standard baseline clinical indicators'],
    override: existingOverride,
    version: PRIORITIZATION_VERSION,
    calculatedAt: new Date().toISOString(),
  }
}

/**
 * Records an authorized veterinary officer override of recommended triage priority
 */
export function overrideCaseTriagePriority(
  caseId: string,
  previousPriority: CasePrioritizationLabel,
  newPriority: CasePrioritizationLabel,
  reason: string,
  overriddenBy: string
): void {
  priorityOverrideStore.set(caseId, {
    previousPriority,
    newPriority,
    reason,
    overriddenBy,
    overriddenAt: new Date().toISOString(),
  })
}

/**
 * Retrieves the override audit log for a case
 */
export function getCasePriorityOverride(caseId: string) {
  return priorityOverrideStore.get(caseId) || null
}
