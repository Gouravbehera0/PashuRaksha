// ============================================================
// PASHURAKSHA (पशुरक्षा) — RISK & OUTBREAK INTELLIGENCE TYPES
// Stage 4: Modular Health Risk Engine & Early Outbreak Detection
// ============================================================

import type { VeterinaryCase } from '@/types'

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface RiskFactorContribution {
  name: string
  points: number
  description: string
  category: 'symptom' | 'severity' | 'affected_animals' | 'nearby_cluster' | 'mortality'
}

export interface RiskAssessment {
  id: string
  case_id: string
  animal_id: string
  risk_score: number // 0–100
  risk_level: RiskLevel
  symptom_score: number
  severity_score: number
  cluster_score: number
  mortality_score: number
  affected_animal_score: number
  factors: Record<string, number>
  contributions?: RiskFactorContribution[]
  reasons: string[]
  recommended_action: string
  engine_version: string
  calculated_at: string
}

export interface RiskEngineConfig {
  version: string
  weights: {
    symptomSeverityMax: number // 30
    symptomCombinationMax: number // 20
    affectedAnimalsMax: number // 20
    recentNearbyCasesMax: number // 15
    mortalitySignalMax: number // 15
  }
  thresholds: {
    lowMax: number // 24
    mediumMax: number // 49
    highMax: number // 74
    criticalMin: number // 75
  }
}

export type ClusterStatus =
  | 'Detected'
  | 'Under Investigation'
  | 'Escalated'
  | 'Monitoring'
  | 'Dismissed'
  | 'Confirmed'

export interface OutbreakCluster {
  id: string
  cluster_code: string // e.g. OB-VAR-2026-001
  cluster_name: string
  status: ClusterStatus
  risk_level: RiskLevel
  cluster_score: number // 0–100
  case_count: number
  affected_animal_count: number
  affected_village_count: number
  common_symptoms: string[]
  center_latitude: number
  center_longitude: number
  radius_km: number
  affected_villages: string[]
  first_case_at: string
  last_case_at: string
  investigation_notes?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
  cases?: VeterinaryCase[]
}

export interface ClusterDetectionConfig {
  defaultRadiusKm: number // e.g. 5.0
  temporalWindowDays: number // e.g. 7
  minCasesForCluster: number // e.g. 3
  possibleOutbreakScoreThreshold: number // e.g. 70
  elevatedClusterScoreThreshold: number // e.g. 50
  symptomSimilarityThreshold: number // e.g. 0.35 (Jaccard)
}

export type AlertType =
  | 'POSSIBLE_OUTBREAK'
  | 'ELEVATED_CLUSTER'
  | 'HIGH_RISK_CASE'
  | 'MORTALITY_SPIKE'
  | 'LAB_CONFIRMATION'

export interface IntelligenceAlert {
  id: string
  alert_code: string
  title: string
  alert_type: AlertType
  severity: RiskLevel
  cluster_id?: string
  case_id?: string
  target_role: 'veterinarian' | 'admin' | 'all'
  target_district?: string
  target_village?: string
  message: string
  recommended_action: string
  status: 'Active' | 'Acknowledged' | 'Dismissed'
  acknowledged_by?: string
  acknowledged_at?: string
  created_at: string
}
