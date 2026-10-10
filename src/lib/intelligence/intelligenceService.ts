// ============================================================
// PASHURAKSHA (पशुरक्षा) — DISEASE INTELLIGENCE ORCHESTRATION SERVICE
// Stage 10: Advanced AI & Disease Intelligence
// Standard: Modular Unified Facade (Zero Redundant Calculations)
// "Detect Early. Prevent Outbreaks. Protect Livestock."
// ============================================================

import { getVetCases, getVetCaseById } from '@/services/vetService'
import { getAnimalById } from '@/services/animalService'
import { getAllRiskAssessments, getRiskAssessmentByCaseId, calculateCaseRisk } from '@/services/risk/riskEngine'
import { getOutbreakClusters } from '@/services/risk/outbreakEngine'
import { getAllMortalityReports } from '@/services/mortalityReportService'
import type { VeterinaryCase } from '@/types'
import type {
  CaseIntelligenceDossier,
  AnomalyDetectionWarning,
  CasePrioritizationRecommendation,
  MLModelDefinition,
  ModelEvaluationMetrics,
  AnomalyStatus,
  CasePrioritizationLabel
} from './intelligenceTypes'
import { extractCaseFeatures } from './featureEngineering'
import { analyzeSymptomPatterns } from './symptomPatternAnalysis'
import { detectAnomalies, updateAnomalyStatus, getAllAnomalies } from './anomalyDetection'
import { calculateCasePrioritization, overrideCaseTriagePriority } from './casePrioritization'
import { getRegisteredModels } from './modelRegistry'
import { generateModelEvaluationReport } from './modelEvaluation'

export { getCasePriorityOverride } from './casePrioritization'
export { getModelDefinition } from './modelRegistry'

/**
 * Compiles a comprehensive explainable intelligence dossier for a single veterinary case
 */
export async function getCaseIntelligenceDossier(caseId: string): Promise<CaseIntelligenceDossier | null> {
  const vetCase = await getVetCaseById(caseId)
  if (!vetCase) return null

  // Concurrent queries for related intelligence entities
  const [animal, existingAssessment, allMortality, allClusters, allAnomalies] = await Promise.all([
    vetCase.animal_id ? getAnimalById(vetCase.animal_id) : Promise.resolve(null),
    getRiskAssessmentByCaseId(caseId),
    getAllMortalityReports(),
    getOutbreakClusters(),
    Promise.resolve(getAllAnomalies()),
  ])

  // Determine mortality signal in village or herd
  const hasMortality = allMortality.some(
    (m) =>
      m.animal_id === vetCase.animal_id ||
      (m.animal?.village && vetCase.village && m.animal.village.toLowerCase() === vetCase.village.toLowerCase())
  )

  // Determine active cluster association
  const matchedCluster = allClusters.find(
    (cl) =>
      cl.status !== 'Dismissed' &&
      (cl.affected_villages.includes(vetCase.village || '') ||
        (cl.cases && cl.cases.some((c) => c.id === caseId)))
  )

  // Risk Assessment fallback
  const riskAssessment = existingAssessment || calculateCaseRisk(vetCase)

  // 1. Feature Engineering
  const features = extractCaseFeatures(vetCase, animal || vetCase.animal, hasMortality)

  // 2. Symptom Pattern Analysis
  const patternAnalysis = analyzeSymptomPatterns(features)

  // 3. Case Prioritization
  const prioritization = calculateCasePrioritization(
    vetCase,
    riskAssessment,
    hasMortality,
    !!matchedCluster
  )

  // 4. Associated Anomaly Warnings
  const associatedAnomalies = allAnomalies.filter(
    (a) =>
      a.status !== 'Dismissed' &&
      (a.jurisdiction.village?.toLowerCase() === (vetCase.village || '').toLowerCase() ||
        a.associatedCaseIds.includes(caseId))
  )

  const recommendedAction =
    prioritization.recommendedPriority === 'CRITICAL REVIEW'
      ? 'EMERGENCY CLINICAL TRIAGE: Dispatch Mobile Veterinary Unit immediately. Isolate animal and inspect herd.'
      : prioritization.recommendedPriority === 'URGENT REVIEW'
      ? 'PRIORITY CLINICAL EXAMINATION: Schedule on-site examination within 12 hours. Review vitals and sample collection.'
      : prioritization.recommendedPriority === 'PRIORITY REVIEW'
      ? 'VETERINARY REVIEW: Conduct physical check during next standard block rounds. Advise owner on supportive care.'
      : 'ROUTINE SURVEILLANCE: Normal health monitoring. Advise livestock keeper to notify if pyrexia worsens.'

  return {
    caseId: vetCase.id,
    caseNumber: vetCase.case_number,
    animalTag: vetCase.animal?.animal_tag || animal?.animal_tag || `TAG-${caseId.slice(-4).toUpperCase()}`,
    village: vetCase.village || 'Rampur Khurd',
    district: vetCase.district || 'Varanasi',
    riskLevel: riskAssessment.risk_level,
    riskScore: riskAssessment.risk_score,
    prioritization,
    patternAnalysis,
    associatedAnomalies,
    associatedClusterCode: matchedCluster?.cluster_code,
    dataLimitations: [
      ...patternAnalysis.dataLimitations,
      'Prioritization recommendations represent operational workflow triage guidance and must not be used as clinical diagnoses.',
    ],
    recommendedAction,
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Returns all active veterinary cases prioritized by composite intelligence score
 */
export async function getPrioritizedTriageQueue(
  district?: string,
  assignedVetId?: string
): Promise<{ vetCase: VeterinaryCase; prioritization: CasePrioritizationRecommendation }[]> {
  const allCases = await getVetCases()
  const allAssessments = await getAllRiskAssessments()
  const allMortality = await getAllMortalityReports()
  const allClusters = await getOutbreakClusters()

  const assessmentMap = new Map<string, any>()
  allAssessments.forEach((a) => assessmentMap.set(a.case_id, a))

  const mortalityVillages = new Set(allMortality.map((m) => (m.animal?.village || '').toLowerCase()))

  const filteredCases = allCases.filter((c) => {
    if (district && district !== 'All' && c.district?.toLowerCase() !== district.toLowerCase()) {
      return false
    }
    if (assignedVetId && c.assigned_vet_id !== assignedVetId) {
      return false
    }
    // Only show active unclosed cases
    return c.status !== 'Resolved' && c.status !== 'Rejected'
  })

  const results = filteredCases.map((vetCase) => {
    const risk = assessmentMap.get(vetCase.id) || calculateCaseRisk(vetCase)
    const hasMort = mortalityVillages.has((vetCase.village || '').toLowerCase())
    const hasCluster = allClusters.some(
      (cl) => cl.status !== 'Dismissed' && cl.affected_villages.includes(vetCase.village || '')
    )

    const prio = calculateCasePrioritization(vetCase, risk, hasMort, hasCluster)
    return {
      vetCase,
      prioritization: prio,
    }
  })

  // Sort by composite score descending
  results.sort((a, b) => b.prioritization.compositeScore - a.prioritization.compositeScore)

  return results
}

/**
 * Executes statistical anomaly detection for a district or whole jurisdiction
 */
export async function getJurisdictionalAnomalies(
  district?: string
): Promise<AnomalyDetectionWarning[]> {
  const [allCases, allMortality] = await Promise.all([
    getVetCases(),
    getAllMortalityReports(),
  ])

  const filteredCases = district && district !== 'All'
    ? allCases.filter((c) => c.district?.toLowerCase() === district.toLowerCase())
    : allCases

  const filteredMortality = district && district !== 'All'
    ? allMortality.filter((m) => (m.animal?.district || '').toLowerCase() === district.toLowerCase())
    : allMortality

  const anomalies = detectAnomalies(filteredCases, filteredMortality)
  return anomalies
}

/**
 * Updates an anomaly warning investigation state with audit tracking
 */
export function setAnomalyInvestigationStatus(
  anomalyId: string,
  status: AnomalyStatus,
  notes?: string,
  reviewedBy?: string
): AnomalyDetectionWarning | null {
  return updateAnomalyStatus(anomalyId, status, notes, reviewedBy)
}

/**
 * Overrides a case triage priority recommendation with vet justification
 */
export function recordCasePriorityOverride(
  caseId: string,
  previousPriority: CasePrioritizationLabel,
  newPriority: CasePrioritizationLabel,
  reason: string,
  overriddenBy: string
): void {
  overrideCaseTriagePriority(caseId, previousPriority, newPriority, reason, overriddenBy)
}

/**
 * Exports catalog of registered intelligence engines and models
 */
export function listIntelligenceModels(): MLModelDefinition[] {
  return getRegisteredModels()
}

/**
 * Exports evaluation metrics report for a registered model
 */
export function getModelEvaluationReport(modelId: string): ModelEvaluationMetrics {
  return generateModelEvaluationReport(modelId)
}
