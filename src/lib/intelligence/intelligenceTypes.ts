// ============================================================
// PASHURAKSHA (पशुरक्षा) — ADVANCED DISEASE INTELLIGENCE TYPES
// Stage 10: Explainable AI, Symptom Pattern Analysis & Anomaly Detection
// Standard: Transparent Decision Support (Zero Fabricated Predictions)
// "Detect Early. Prevent Outbreaks. Protect Livestock."
// ============================================================

import type { RiskLevel } from '@/services/risk/riskTypes'

export type NormalizedSymptomCategory =
  | 'vesicular_mucosal'
  | 'respiratory'
  | 'systemic_pyretic'
  | 'enteric_digestive'
  | 'neurological'
  | 'locomotor_musculoskeletal'
  | 'production_collapse'
  | 'general_unspecified'

export interface NormalizedSymptom {
  raw: string
  normalizedKey: string
  category: NormalizedSymptomCategory
  physiologicalSign: string
  clinicalSignificance: 'mild' | 'moderate' | 'severe' | 'critical'
}

export interface SymptomPatternResult {
  id: string
  patternName: string
  category: NormalizedSymptomCategory
  matchedSymptoms: string[]
  clinicalIndicators: string[]
  contributingFactors: {
    factor: string
    influence: number // 0–100 scale
    description: string
  }[]
  severityTier: 'ROUTINE' | 'ELEVATED' | 'HIGH' | 'CRITICAL'
  requiresImmediateReview: boolean
  recommendedClinicalActions: string[]
  dataLimitations: string[]
  analysisVersion: string
  analyzedAt: string
}

export type CasePrioritizationLabel =
  | 'ROUTINE'
  | 'PRIORITY REVIEW'
  | 'URGENT REVIEW'
  | 'CRITICAL REVIEW'

export interface CasePrioritizationFactor {
  name: string
  weight: number
  scoreContribution: number
  description: string
  sourceField: string
}

export interface CasePrioritizationRecommendation {
  caseId: string
  caseNumber: string
  recommendedPriority: CasePrioritizationLabel
  compositeScore: number // 0–100
  status: 'Recommended' | 'Overridden' | 'Accepted'
  factors: CasePrioritizationFactor[]
  contributingReasons: string[]
  override?: {
    previousPriority: CasePrioritizationLabel
    newPriority: CasePrioritizationLabel
    reason: string
    overriddenBy: string
    overriddenAt: string
  }
  version: string
  calculatedAt: string
}

export type AnomalySignalType =
  | 'VOLUME_SURGE'
  | 'MORTALITY_SPIKE'
  | 'GEOGRAPHIC_CONCENTRATION'
  | 'SYNDROMIC_RECURRENCE'
  | 'SPECIES_VULNERABILITY'

export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type AnomalyStatus =
  | 'Detected'
  | 'Under Investigation'
  | 'Acknowledged'
  | 'Dismissed'
  | 'Escalated'

export interface AnomalyDetectionWarning {
  id: string
  signalType: AnomalySignalType
  title: string
  description: string
  severity: AnomalySeverity
  status: AnomalyStatus
  jurisdiction: {
    district: string
    village?: string
  }
  affectedCaseCount: number
  affectedMortalityCount: number
  observationWindowDays: number
  baselineWindowDays: number
  observedValue: number
  baselineValue: number
  percentageChange: number
  sufficientData: boolean
  contributingFactors: string[]
  dataLimitations: string[]
  investigationNotes?: string
  reviewedBy?: string
  reviewedAt?: string
  analysisVersion: string
  detectedAt: string
  associatedCaseIds: string[]
}

export type MLModelStatus =
  | 'ACTIVE_RULE_BASED'
  | 'ACTIVE_STATISTICAL'
  | 'UNTRAINED_SCAFFOLD'
  | 'DEPRECATED'

export interface MLModelDefinition {
  modelId: string
  modelName: string
  version: string
  intendedTask: string
  status: MLModelStatus
  algorithmType:
    | 'deterministic_scoring'
    | 'spatiotemporal_statistical'
    | 'supervised_ml_interface'
  inputFeaturesRequired: string[]
  dataSourceRequirements: string
  trainingStatus: string
  validationState:
    | 'Validated Deterministic'
    | 'Validated Statistical'
    | 'Incomplete (No Confirmed Veterinary Clinical Training Dataset)'
  clinicalSafetyNotice: string
}

export interface ModelEvaluationMetrics {
  modelId: string
  evaluatedAt: string
  evaluationType: string
  datasetSize: number
  confusionMatrix?: {
    truePositives: number
    falsePositives: number
    trueNegatives: number
    falseNegatives: number
  }
  sensitivityRecall?: number
  specificity?: number
  precision?: number
  f1Score?: number
  brierScore?: number
  classImbalanceRatio?: string
  limitationsSummary: string
  isClinicalValidationComplete: boolean
}

export interface CaseIntelligenceDossier {
  caseId: string
  caseNumber: string
  animalTag: string
  village: string
  district: string
  riskLevel: RiskLevel
  riskScore: number
  prioritization: CasePrioritizationRecommendation
  patternAnalysis: SymptomPatternResult
  associatedAnomalies: AnomalyDetectionWarning[]
  associatedClusterCode?: string
  dataLimitations: string[]
  recommendedAction: string
  generatedAt: string
}
