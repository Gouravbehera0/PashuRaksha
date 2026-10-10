// ============================================================
// PASHURAKSHA (पशुरक्षा) — REPORTING SYSTEM TYPES & CONTRACTS
// Stage 9: Government & Veterinary Reporting System
// "Detect Early. Prevent Outbreaks. Protect Livestock."
// ============================================================

import type { UserRole, VetCaseStatus, AnimalType } from '@/types'
import type { RiskLevel, ClusterStatus } from '@/services/risk/riskTypes'

export type ReportCategory =
  | 'livestock-health'
  | 'disease-surveillance'
  | 'mortality'
  | 'vaccination'
  | 'outbreaks'
  | 'veterinary-performance'
  | 'data-quality'
  | 'farmer-herd-dossier'

export interface ReportFilterState {
  category: ReportCategory
  dateRange: '7d' | '30d' | '90d' | 'year' | 'all' | 'custom'
  startDate?: string
  endDate?: string
  district: string
  village: string
  species: 'All' | AnimalType
  caseStatus: 'All' | VetCaseStatus
  riskLevel: 'All' | RiskLevel
  searchQuery: string
  ownerId?: string // Enforced for farmer role
}

export interface ReportSummaryMetrics {
  totalSymptomReports: number
  totalUniqueAnimals: number
  totalVeterinaryCases: number
  activeCasesCount: number
  resolvedCasesCount: number
  mortalityEventsCount: number
  casesAwaitingReviewCount: number
  potentialOutbreakClustersCount: number
  totalVaccinationRecords: number
  totalLabReferrals: number
  avgResolutionTimeHours?: number
  avgFirstReviewTimeHours?: number
}

// Data row representations for preview tables and export
export interface HealthSurveillanceRow {
  caseNumber: string
  animalTag: string
  species: string
  breed: string
  village: string
  district: string
  reportedDate: string
  status: string
  priority: string
  riskLevel: string
  riskScore: number
  resolutionTimeHours?: number
}

export interface DiseaseSurveillanceRow {
  caseNumber: string
  animalTag: string
  species: string
  reportedSymptoms: string
  algorithmRiskLevel: string
  suspectedCondition: string // Vet clinical impression
  laboratoryStatus: string
  labConfirmedPathogen: string
  village: string
  reportedDate: string
  currentStatus: string
}

export interface MortalityAnalyticsRow {
  reportId: string
  animalTag: string
  species: string
  breed: string
  village: string
  district: string
  reportedDate: string
  causeDescription: string
  verificationStatus: string
  associatedCaseNumber?: string
}

export interface VaccinationCoverageRow {
  recordId: string
  animalTag: string
  species: string
  village: string
  vaccineName: string
  administrationDate: string
  nextDueDate?: string
  isOverdue: boolean
  administeredBy: string
}

export interface OutbreakInvestigationRow {
  clusterCode: string
  clusterName: string
  status: ClusterStatus
  aggregateRiskScore: number
  riskLevel: RiskLevel
  cordonRadiusKm: number
  contributingCaseCount: number
  affectedVillages: string
  commonSymptoms: string
  detectionDate: string
}

export interface VeterinaryWorkloadRow {
  veterinarianName: string
  assignedCasesCount: number
  activeCasesCount: number
  awaitingReviewCount: number
  resolvedCasesCount: number
  pendingLabReferrals: number
  avgFirstReviewTimeHours?: number
  avgResolutionTimeHours?: number
}

export interface DataQualityIssueRow {
  issueId: string
  category: 'MISSING_COORDINATES' | 'MISSING_ANIMAL_TAG' | 'PENDING_LAB_RESULT' | 'OVERDUE_FOLLOW_UP' | 'UNASSIGNED_CASE'
  recordType: 'Veterinary Case' | 'Animal' | 'Lab Referral' | 'Vaccination'
  recordReference: string
  severity: 'CRITICAL' | 'WARNING' | 'NOTICE'
  description: string
  detectionDate: string
  suggestedCorrectiveAction: string
}

export interface FarmerHerdDossierRow {
  animalTag: string
  species: string
  breed: string
  ageYears: number
  healthStatus: string
  lastVaccineName?: string
  lastVaccinationDate?: string
  activeCaseNumber?: string
  activeCaseSymptoms?: string
}

export interface CompiledReportDataset {
  category: ReportCategory
  reportTitle: string
  reportSubtitle: string
  documentId: string
  generatedAt: string
  generatedByRole: UserRole
  dateWindowLabel: string
  filters: ReportFilterState
  summary: ReportSummaryMetrics
  headers: string[]
  rows: Record<string, any>[]
  dataLimitations: string[]
  methodologyNotes: string[]
}
