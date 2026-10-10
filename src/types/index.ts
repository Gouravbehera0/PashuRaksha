// ============================================================
// PASHURAKSHA (पशुरक्षा) — UNIFIED DOMAIN TYPES
// Stage 1 Foundation + Stage 2 Farmer Livestock Health Module
// ============================================================

// === User & Authentication Types ===

export type UserRole = 'farmer' | 'veterinarian' | 'admin'

export interface UserProfile {
  id: string
  user_id: string
  full_name: string
  phone?: string
  email?: string
  role: UserRole
  village?: string
  district?: string
  state?: string
  address?: string
  profile_image?: string
  created_at: string
  updated_at: string
}

// === Animal & Livestock Types ===

export type AnimalType = 'Cow' | 'Buffalo' | 'Goat' | 'Sheep' | 'Poultry' | 'Other'

export type AnimalGender = 'Male' | 'Female'

export type AnimalHealthStatus =
  | 'Healthy'
  | 'Under Observation'
  | 'High Risk'
  | 'Critical'

export interface Animal {
  id: string
  owner_id: string
  animal_tag: string
  animal_type: AnimalType
  breed?: string
  gender: AnimalGender
  date_of_birth?: string
  age?: number
  color?: string
  weight?: number
  location?: string
  village?: string
  district?: string
  photo_url?: string
  health_status: AnimalHealthStatus
  created_at: string
  updated_at: string
}

// === Symptom Report Types ===

export type SymptomSeverity = 'Mild' | 'Moderate' | 'Severe'

export type SymptomReportStatus =
  | 'Reported'
  | 'Under Review'
  | 'Veterinary Review'
  | 'Resolved'

export interface SymptomReport {
  id: string
  animal_id: string
  owner_id: string
  symptoms: string[]
  severity: SymptomSeverity
  description?: string
  photo_url?: string
  reported_at: string
  latitude?: number
  longitude?: number
  status: SymptomReportStatus
  risk_score?: number | null // Null in Stage 2
  risk_level?: string | null  // Null in Stage 2
  created_at: string
  updated_at: string
  animal?: Animal
}

// === Mortality Report Types ===

export type MortalityReportStatus = 'Reported' | 'Under Review' | 'Verified'

export interface MortalityReport {
  id: string
  animal_id: string
  owner_id: string
  cause_description?: string
  reported_at: string
  latitude?: number
  longitude?: number
  photo_url?: string
  status: MortalityReportStatus
  case_id?: string
  created_at: string
  animal?: Animal
}

// === Vaccination Types ===

export interface Vaccination {
  id: string
  animal_id: string
  owner_id: string
  vaccine_name: string
  vaccination_date: string
  next_due_date?: string
  administered_by?: string
  notes?: string
  created_at: string
  updated_at: string
  animal?: Animal
}

// === Treatment Types ===

export interface Treatment {
  id: string
  animal_id: string
  owner_id: string
  condition: string
  medicine: string
  dosage?: string
  start_date: string
  end_date?: string
  veterinarian_name?: string
  notes?: string
  created_at: string
  updated_at: string
  animal?: Animal
}

// === Alert Types ===

export type AlertType = 'Health' | 'Vaccination' | 'Veterinary' | 'Outbreak' | 'System'

export type AlertSeverity = 'info' | 'warning' | 'danger' | 'critical'

export interface Alert {
  id: string
  user_id: string
  title: string
  message: string
  alert_type: AlertType
  severity: AlertSeverity
  is_read: boolean
  animal_id?: string
  created_at: string
}

// === Farmer Dashboard & Analytics Types ===

export interface FarmerStats {
  total_livestock: number
  healthy: number
  under_observation: number
  high_risk: number
  vaccinations_due: number
}

export interface RecentHealthActivity {
  id: string
  animal_id: string
  animal_tag: string
  animal_type: AnimalType
  activity_type: 'Health Report' | 'Vaccination' | 'Treatment' | 'Mortality'
  date: string
  status: string
  severity?: string
}

// === Legacy Stage 1 Compatibility Types ===

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export type HealthStatus =
  | 'healthy'
  | 'under_observation'
  | 'sick'
  | 'critical'
  | 'recovered'
  | 'deceased'

export type CaseStatus =
  | 'reported'
  | 'under_review'
  | 'diagnosed'
  | 'treatment_ongoing'
  | 'resolved'
  | 'escalated'

export type AnimalSpecies =
  | 'cattle'
  | 'buffalo'
  | 'goat'
  | 'sheep'
  | 'pig'
  | 'poultry'
  | 'horse'
  | 'camel'
  | 'other'

export interface HealthCase {
  id: string
  case_number: string
  animal_id: string
  reported_by: string
  assigned_vet?: string
  symptoms: string[]
  diagnosis?: string
  status: CaseStatus
  risk_level: RiskLevel
  location_lat?: number
  location_lng?: number
  district?: string
  state?: string
  reported_at: string
  updated_at: string
}

export interface DashboardStats {
  total_livestock: number
  active_cases: number
  high_risk_cases: number
  possible_outbreaks: number
  vaccinations_due: number
}

export interface MapMarker {
  id: string
  lat: number
  lng: number
  type: 'case' | 'vet_center' | 'livestock_cluster' | 'outbreak_zone'
  risk_level?: RiskLevel
  label?: string
  district?: string
}

export interface NavItem {
  label: string
  href: string
  icon?: string
  badge?: number
  children?: NavItem[]
}

// ============================================================
// STAGE 3 — VETERINARY INTELLIGENCE & CASE MANAGEMENT TYPES
// ============================================================

export type VetCaseStatus =
  | 'Reported'
  | 'Under Review'
  | 'Veterinary Review'
  | 'Sample Required'
  | 'Lab Pending'
  | 'Treatment'
  | 'Monitoring'
  | 'Resolved'
  | 'Rejected'

export type CasePriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export interface VeterinaryCase {
  id: string
  case_number: string
  report_id?: string
  mortality_report_id?: string
  animal_id: string
  owner_id: string
  assigned_vet_id?: string
  assigned_vet_name?: string
  status: VetCaseStatus
  priority: CasePriority
  symptoms: string[]
  reported_severity: 'Mild' | 'Moderate' | 'Severe'
  description?: string
  village?: string
  district?: string
  latitude?: number
  longitude?: number
  reported_at: string
  assigned_at?: string
  resolved_at?: string
  resolution_summary?: string
  follow_up_required?: boolean
  follow_up_date?: string
  created_at: string
  updated_at: string
  // Hydrated joins
  animal?: Animal
  owner?: UserProfile
  examinations?: CaseExamination[]
  notes?: CaseNote[]
  samples?: SampleRequest[]
  lab_referrals?: LabReferral[]
  treatments?: Treatment[]
}

export interface CaseExamination {
  id: string
  case_id: string
  veterinarian_id?: string
  veterinarian_name: string
  temperature?: number
  temperature_unit?: 'F' | 'C'
  observed_symptoms: string[]
  physical_observations?: string
  behaviour?: 'Alert' | 'Dull' | 'Depressed' | 'Excited' | 'Recumbent'
  appetite?: 'Normal' | 'Reduced' | 'Anorexic/Off-feed'
  hydration?: 'Normal' | 'Mild Dehydration' | 'Severe Dehydration'
  respiratory_condition?: 'Normal' | 'Dyspnea/Rapid' | 'Wheezing/Cough' | 'Stridor'
  mucous_membrane?: 'Normal Pink' | 'Congested/Red' | 'Pale' | 'Icteric/Yellow'
  other_observations?: string
  examined_at: string
  created_at: string
}

export type NoteType =
  | 'General Observation'
  | 'Clinical Observation'
  | 'Follow-up'
  | 'Treatment'
  | 'Lab'
  | 'Administrative'

export interface CaseNote {
  id: string
  case_id: string
  veterinarian_id?: string
  veterinarian_name: string
  note_type: NoteType
  content: string
  created_at: string
}

export type SampleType =
  | 'Blood'
  | 'Swab'
  | 'Fecal'
  | 'Urine'
  | 'Tissue'
  | 'Milk'
  | 'Other'

export type SampleStatus =
  | 'Requested'
  | 'Collected'
  | 'Sent to Lab'
  | 'Received'
  | 'Testing'
  | 'Result Available'

export interface SampleRequest {
  id: string
  sample_number: string
  case_id: string
  animal_id: string
  sample_type: SampleType
  collection_instructions?: string
  priority: CasePriority
  requested_by: string
  requested_date: string
  status: SampleStatus
  notes?: string
  collected_at?: string
  created_at: string
  updated_at: string
}

export type LabReferralStatus =
  | 'Referred'
  | 'Sample Dispatched'
  | 'Received by Lab'
  | 'Testing Ongoing'
  | 'Result Uploaded'
  | 'Completed'

export interface LabReferral {
  id: string
  referral_number: string
  case_id: string
  sample_id: string
  lab_name: string
  test_requested: string
  requested_by: string
  referral_date: string
  priority: CasePriority
  status: LabReferralStatus
  notes?: string
  created_at: string
  updated_at: string
  result?: LabResult
}

export type LabResultStatus = 'Pending' | 'Negative' | 'Positive' | 'Inconclusive'

export interface LabResult {
  id: string
  referral_id: string
  case_id: string
  lab_name: string
  test_name: string
  result_status: LabResultStatus
  result_summary?: string
  pathogen_identified?: string
  result_date?: string
  attachment_url?: string
  veterinarian_interpretation?: string
  created_at: string
}

export type AuditAction =
  | 'Case Created'
  | 'Case Assigned'
  | 'Status Changed'
  | 'Priority Changed'
  | 'Note Added'
  | 'Examination Recorded'
  | 'Sample Requested'
  | 'Lab Referral Created'
  | 'Lab Result Interpreted'
  | 'Treatment Prescribed'
  | 'Case Resolved'
  | 'Cluster Detected'
  | 'Cluster Updated'
  | 'Recommendation Generated'
  | 'Risk Recalculated'
  | 'Area Score Calculated'
  | 'Report Generated'
  | 'FollowUp Created'
  | 'FollowUp Completed'

export interface AuditLog {
  id: string
  user_id: string
  user_name: string
  user_role: string
  action: AuditAction
  case_id?: string
  details?: string
  created_at: string
}

export interface VetKPIStats {
  new_cases: number
  under_review: number
  high_priority: number
  sample_required: number
  lab_pending: number
  cases_resolved: number
  total_cases: number
}

export interface FarmerProfileView {
  owner_id: string
  full_name: string
  phone?: string
  village?: string
  district?: string
  total_animals: number
  active_cases_count: number
  historical_cases_count: number
  vaccinations_count: number
  animals: Animal[]
}

// ============================================================
// STAGE 5: ADVANCED INTELLIGENCE & SURVEILLANCE TYPES
// ============================================================

// === Case Follow-Up Types ===
export type FollowUpStatus = 'Pending' | 'Due Today' | 'Overdue' | 'Completed'

export interface CaseFollowUp {
  id: string
  case_id: string
  assigned_veterinarian_id?: string
  assigned_veterinarian_name?: string
  follow_up_date: string
  notes: string
  status: FollowUpStatus
  created_at: string
  updated_at: string
  case?: VeterinaryCase
}

// === Early Warning & Predictive Layer Types ===
export type EarlyWarningRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'ELEVATED'
export type DirectionalTrend = 'INCREASING' | 'STABLE' | 'DECREASING'

export interface EarlyWarningFactors {
  recent_case_growth: number // 0-25
  cluster_density: number // 0-20
  high_risk_proportion: number // 0-20
  mortality_signal: number // 0-15
  historical_activity: number // 0-10
  vaccination_gap: number // 0-10
  notes?: string
}

export interface AreaEarlyWarning {
  id: string
  area_name: string
  area_type: 'district' | 'village'
  early_warning_score: number // 0-100
  risk_level: EarlyWarningRiskLevel
  trend: DirectionalTrend
  factors: EarlyWarningFactors
  calculated_at: string
  engine_version: string
}

// === Intelligent Recommendation Types ===
export type RecommendationPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'ROUTINE'
export type RecommendationStatus = 'ACTIVE' | 'ACTIONED' | 'DISMISSED'

export interface IntelligenceRecommendation {
  id: string
  area_name: string
  recommendation_type: string
  title: string
  description: string
  reasons: string[] // explainable list of reasons why
  priority: RecommendationPriority
  status: RecommendationStatus
  created_at: string
}

// === Statutory & Surveillance Report Types ===
export type ReportType =
  | 'Health Surveillance Report'
  | 'Outbreak Report'
  | 'Vaccination Report'
  | 'Mortality Report'
  | 'Veterinary Activity Report'
  | 'District Health Report'

export interface SurveillanceReport {
  id: string
  report_type: ReportType
  title: string
  period_start: string
  period_end: string
  parameters: {
    district?: string
    village?: string
    animal_type?: string
    risk_level?: string
  }
  metrics: Record<string, any>
  recommendations?: string[]
  created_at: string
}

// === Data Quality Assessment Types ===
export type DataQualityRating = 'Good' | 'Needs Attention' | 'Incomplete'

export interface DataQualitySummary {
  rating: DataQualityRating
  score: number // 0 - 100 %
  issues: string[]
  details: {
    missing_locations: number
    missing_animal_types: number
    missing_vaccination_dates: number
    incomplete_cases: number
    total_checked: number
  }
}

// === Smart Priority Types ===
export interface CasePriorityExplanation {
  priority: CasePriority
  score: number
  reasons: string[]
}


