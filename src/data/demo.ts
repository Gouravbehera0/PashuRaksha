import type { DashboardStats, HealthCase, Alert, MapMarker } from '@/types'

// === Seed Data — DEVELOPMENT/DEMO USE ONLY ===
// These are placeholder values for visual development.
// Real data will be fetched from Supabase.

export const DEMO_STATS: DashboardStats = {
  total_livestock: 12540,
  active_cases: 126,
  high_risk_cases: 18,
  possible_outbreaks: 4,
  vaccinations_due: 327,
}

export const DEMO_CASES: HealthCase[] = [
  {
    id: 'c001',
    case_number: 'PR-2024-001',
    animal_id: 'a001',
    reported_by: 'Rajan Yadav',
    status: 'under_review',
    risk_level: 'high',
    symptoms: ['fever', 'loss of appetite', 'nasal discharge'],
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    reported_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
  {
    id: 'c002',
    case_number: 'PR-2024-002',
    animal_id: 'a002',
    reported_by: 'Sunita Devi',
    assigned_vet: 'Dr. Priya Sharma',
    status: 'treatment_ongoing',
    risk_level: 'medium',
    symptoms: ['lameness', 'swollen feet'],
    diagnosis: 'Foot and Mouth Disease (suspected)',
    district: 'Muzaffarpur',
    state: 'Bihar',
    reported_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: 'c003',
    case_number: 'PR-2024-003',
    animal_id: 'a003',
    reported_by: 'Mohan Singh',
    status: 'reported',
    risk_level: 'critical',
    symptoms: ['sudden death of multiple animals', 'fever', 'bleeding'],
    district: 'Patna',
    state: 'Bihar',
    reported_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: 'c004',
    case_number: 'PR-2024-004',
    animal_id: 'a004',
    reported_by: 'Kavita Patel',
    status: 'resolved',
    risk_level: 'low',
    symptoms: ['minor wound', 'limping'],
    diagnosis: 'Minor laceration',
    district: 'Surat',
    state: 'Gujarat',
    reported_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
]

export const DEMO_ALERTS: Alert[] = [
  {
    id: 'al001',
    user_id: 'demo-admin',
    alert_type: 'Outbreak',
    severity: 'critical',
    title: 'Possible Outbreak — Bihar',
    message: 'Multiple cases of acute fever reported in Patna and Muzaffarpur districts. Cluster analysis initiated.',
    is_read: false,
    created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
  {
    id: 'al002',
    user_id: 'demo-vet',
    alert_type: 'Vaccination',
    severity: 'warning',
    title: 'FMD Vaccination Due — 327 Animals',
    message: 'Scheduled Foot and Mouth Disease vaccination overdue for 327 animals across 12 villages.',
    is_read: false,
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'al003',
    user_id: 'demo-farmer',
    alert_type: 'Veterinary',
    severity: 'danger',
    title: 'Case Escalated — PR-2024-001',
    message: 'Case PR-2024-001 in Varanasi has been escalated to High Risk. Immediate veterinary visit required.',
    is_read: true,
    created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
]

export const DEMO_MAP_MARKERS: MapMarker[] = [
  { id: 'm001', lat: 25.5941, lng: 85.1376, type: 'case', risk_level: 'critical', label: 'Patna — Critical', district: 'Patna' },
  { id: 'm002', lat: 26.1197, lng: 85.3910, type: 'case', risk_level: 'high', label: 'Muzaffarpur — High', district: 'Muzaffarpur' },
  { id: 'm003', lat: 25.3176, lng: 82.9739, type: 'case', risk_level: 'high', label: 'Varanasi — High', district: 'Varanasi' },
  { id: 'm004', lat: 21.1702, lng: 72.8311, type: 'case', risk_level: 'low', label: 'Surat — Low', district: 'Surat' },
  { id: 'm005', lat: 28.6139, lng: 77.2090, type: 'vet_center', label: 'IVRI Delhi Office', district: 'Delhi' },
  { id: 'm006', lat: 26.8467, lng: 80.9462, type: 'vet_center', label: 'Veterinary Center Lucknow', district: 'Lucknow' },
  { id: 'm007', lat: 25.5941, lng: 85.1376, type: 'outbreak_zone', risk_level: 'critical', label: 'Outbreak Zone — Bihar', district: 'Patna' },
]
