/**
 * PASHURAKSHA — LIVESTOCK HEALTH SURVEILLANCE PLATFORM
 * Stage 12: Pilot Deployment & Field Validation Types
 * "Detect Early. Prevent Outbreaks. Protect Livestock."
 */

export type PilotPhase = 'dry_run' | 'controlled_pilot' | 'operational_field'

export type IssueSeverity = 'BLOCKER' | 'HIGH' | 'MEDIUM' | 'LOW'

export type IssueStatus = 'OPEN' | 'UNDER_INVESTIGATION' | 'RESOLVED' | 'VERIFIED'

export type ReadinessClassification = 'BLOCKER' | 'HIGH' | 'MEDIUM' | 'LOW'

export type VerificationStatus = 
  | 'VERIFIED_FUNCTIONAL'
  | 'CONTROLLED_TEST_ONLY'
  | 'AWAITING_FIELD_VALIDATION'

export type UsabilityCohort = 'farmer' | 'veterinarian'

export type UsabilityTaskStatus = 'PASSED' | 'NEEDS_TRAINING' | 'IN_PROGRESS' | 'NOT_STARTED'

export interface PilotGeography {
  state: string
  district: string
  blocks: string[]
  villages: string[]
  primaryCentroid: {
    latitude: number
    longitude: number
    districtName: string
  }
}

export interface PilotParticipant {
  id: string
  name: string
  role: 'farmer' | 'veterinarian' | 'admin'
  villageOrBlock: string
  contactMasked: string
  isTestPersona: boolean
  assignedAnimalCount?: number
  qualification?: string
}

export interface PilotFeatureFlags {
  offlineVoiceReporting: boolean
  iotSimulatorStream: boolean
  emergencyAutoEscalation: boolean
  privacyCentroidMasking: boolean
  strictAuditLogging: boolean
  networkThrottleSimulation: boolean
  syntheticDataIsolation: boolean
}

export interface PilotConfiguration {
  id: string
  name: string
  codeName: string
  targetGeography: PilotGeography
  startDate: string
  endDate: string
  phase: PilotPhase
  participants: PilotParticipant[]
  flags: PilotFeatureFlags
  isolationTag: string
  maxConcurrentHousholds: number
  targetSpecies: string[]
}

export interface ReadinessChecklistItem {
  id: string
  stageNumber: number
  stageName: string
  subsystem: string
  classification: ReadinessClassification
  verificationStatus: VerificationStatus
  title: string
  description: string
  evidence: string
  knownLimitations: string
  fieldReadinessScore: number // 0-100
}

export type ValidationTestCategory =
  | 'AUTH_RLS'
  | 'FARMER_REPORTING'
  | 'VET_CLINICAL'
  | 'RISK_CALCULATION'
  | 'OUTBREAK_DETECTION'
  | 'OFFLINE_SYNC'
  | 'GIS_PRIVACY'
  | 'IOT_TELEMETRY'
  | 'DATA_ISOLATION'

export type ValidationTestStatus = 'IDLE' | 'RUNNING' | 'PASSED' | 'FAILED' | 'SKIPPED'

export interface ValidationAssertion {
  name: string
  passed: boolean
  expected: string
  actual: string
  details?: string
}

export interface ValidationTestCase {
  id: string
  code: string
  category: ValidationTestCategory
  title: string
  description: string
  status: ValidationTestStatus
  executionDurationMs?: number
  assertions: ValidationAssertion[]
  logOutput: string[]
  timestamp?: string
}

export interface UsabilityProtocolTask {
  id: string
  cohort: UsabilityCohort
  taskTitle: string
  targetUserGroup: string
  description: string
  prerequisites: string
  digitalLiteracyNote: string
  hindiSupportVerified: boolean
  targetCompletionSeconds: number
  actualAverageSeconds?: number
  successCriteria: string[]
  observedEdgeCases: string[]
  status: UsabilityTaskStatus
}

export interface PilotIssue {
  id: string
  issueCode: string
  reportedAt: string
  severity: IssueSeverity
  subsystem: string
  title: string
  reproductionSteps: string[]
  expectedBehavior: string
  actualObservedBehavior: string
  status: IssueStatus
  mitigationOrFix: string
  verifiedInPilotRun: boolean
}

export interface PerformanceBenchmark {
  metricId: string
  name: string
  category: 'LATENCY' | 'THROUGHPUT' | 'STORAGE' | 'NETWORK'
  targetBenchmark: string
  measuredValue: string
  unit: string
  status: 'PASS' | 'WARN' | 'FAIL'
  assessmentNote: string
}

export interface PilotSummaryReport {
  generatedAt: string
  pilotId: string
  phase: PilotPhase
  totalStagesAudited: number
  readinessPercentage: number
  blockersCount: number
  highRiskCount: number
  automatedTestsPassed: number
  automatedTestsTotal: number
  farmerUsabilityScore: number
  vetUsabilityScore: number
  privacyComplianceVerified: boolean
  dataIsolationVerified: boolean
  goNoGoRecommendation: 'GO_FOR_CONTROLLED_FIELD_PILOT' | 'CONDITIONAL_WITH_MITIGATION' | 'NO_GO_BLOCKERS_PRESENT'
  recommendationJustification: string
}
