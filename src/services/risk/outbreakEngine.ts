// ============================================================
// PASHURAKSHA (पशुरक्षा) — EARLY OUTBREAK DETECTION ENGINE
// Stage 4: Cluster Scoring, Thresholds, Investigation & Alerts
// ============================================================

import { supabase } from '@/lib/supabase'
import { getVetCases, logAuditAction } from '@/services/vetService'
import {
  detectSpatioTemporalClusters,
  haversineDistanceKm,
  type DetectedClusterCandidate,
  DEFAULT_CLUSTER_CONFIG
} from './clusterDetection'
import type {
  OutbreakCluster,
  ClusterStatus,
  IntelligenceAlert,
  RiskLevel
} from './riskTypes'

// In-memory demo & evaluation store
let inMemoryClusters: OutbreakCluster[] = [
  {
    id: 'cluster-001',
    cluster_code: 'OB-VAR-2026-001',
    cluster_name: 'Varanasi Zone 4 (Rampur Khurd–Shivpur Cluster)',
    status: 'Under Investigation',
    risk_level: 'HIGH',
    cluster_score: 78,
    case_count: 4,
    affected_animal_count: 12,
    affected_village_count: 2,
    common_symptoms: ['Fever', 'Cough', 'Nasal Discharge', 'Loss of Appetite'],
    center_latitude: 25.3182,
    center_longitude: 82.9735,
    radius_km: 3.8,
    affected_villages: ['Rampur Khurd', 'Shivpur'],
    first_case_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    last_case_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    investigation_notes: 'MVU Unit 4 dispatched for field triage and cold-chain sample retrieval. Preliminary viral panel requested at DDDL Varanasi.',
    reviewed_by: 'Dr. Priya Sharma (Veterinary Officer)',
    reviewed_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
  {
    id: 'cluster-002',
    cluster_code: 'OB-VAR-2026-002',
    cluster_name: 'Chiraigaon Peripheral Caprine Respiratory Cluster',
    status: 'Monitoring',
    risk_level: 'MEDIUM',
    cluster_score: 54,
    case_count: 3,
    affected_animal_count: 8,
    affected_village_count: 1,
    common_symptoms: ['Cough', 'Lethargy', 'Nasal Discharge'],
    center_latitude: 25.3780,
    center_longitude: 83.0320,
    radius_km: 2.4,
    affected_villages: ['Chiraigaon'],
    first_case_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    last_case_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    investigation_notes: 'Community de-worming and stall ventilation advisory issued to village pradhan.',
    reviewed_by: 'Dr. Anand Verma (MVU)',
    reviewed_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
]

let inMemoryAlerts: IntelligenceAlert[] = [
  {
    id: 'alert-001',
    alert_code: 'ALT-OB-2026-001',
    title: 'POSSIBLE OUTBREAK DETECTED: Rampur Khurd–Shivpur Epicenter',
    alert_type: 'POSSIBLE_OUTBREAK',
    severity: 'HIGH',
    cluster_id: 'cluster-001',
    target_role: 'veterinarian',
    target_district: 'Varanasi',
    target_village: 'Rampur Khurd',
    message: '4 similar livestock cases reported within 3.8 km radius during the last 4 days. High cluster score (78/100). Common signals: Fever, Cough, Nasal Discharge.',
    recommended_action: 'Deploy Mobile Veterinary Unit (MVU-4) for ring-inspection and diagnostic sample collection.',
    status: 'Active',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'alert-002',
    alert_code: 'ALT-OB-2026-002',
    title: 'ELEVATED HEALTH CLUSTER: Chiraigaon Sector',
    alert_type: 'ELEVATED_CLUSTER',
    severity: 'MEDIUM',
    cluster_id: 'cluster-002',
    target_role: 'veterinarian',
    target_district: 'Varanasi',
    target_village: 'Chiraigaon',
    message: '3 caprine respiratory cases reported within 2.4 km buffer. Cluster score (54/100).',
    recommended_action: 'Monitor local reporting frequency and advise isolated paddock grazing.',
    status: 'Acknowledged',
    acknowledged_by: 'Dr. Anand Verma',
    acknowledged_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
]

/**
 * Compute 0–100 Outbreak Cluster Score from candidate components
 */
export function scoreClusterCandidate(candidate: DetectedClusterCandidate): {
  score: number
  riskLevel: RiskLevel
  status: ClusterStatus
} {
  // 1. Case Count score (0–25)
  // 3 cases = 12, 4 cases = 17, 5 cases = 21, >=6 cases = 25
  const count = candidate.cases.length
  const caseCountScore = Math.min(25, Math.round(count * 4.5))

  // 2. Geographic Concentration score (0–20)
  // Tighter radius yields higher density score
  // <= 2km = 20, <= 4km = 16, <= 6km = 12, > 6km = 8
  let geoScore = 12
  if (candidate.radiusKm <= 2.5) {
    geoScore = 20
  } else if (candidate.radiusKm <= 4.0) {
    geoScore = 16
  } else if (candidate.radiusKm <= 6.0) {
    geoScore = 12
  } else {
    geoScore = 8
  }

  // 3. Temporal Concentration score (0–15)
  // Cases occurring over a short time span = higher burst
  const firstT = new Date(candidate.earliestCaseAt).getTime()
  const lastT = new Date(candidate.latestCaseAt).getTime()
  const spanDays = Math.max(0.5, (lastT - firstT) / (24 * 3600 * 1000))
  let temporalScore = 10
  if (spanDays <= 2) {
    temporalScore = 15
  } else if (spanDays <= 4) {
    temporalScore = 12
  } else {
    temporalScore = 9
  }

  // 4. Symptom Similarity score (0–15)
  const simScore = Math.min(15, Math.round(candidate.avgSymptomSimilarity * 20))

  // 5. Severity score (0–15)
  const severeCount = candidate.cases.filter((c) => c.reported_severity === 'Severe').length
  const severityScore = Math.min(15, Math.round((severeCount / count) * 15) + (severeCount > 0 ? 5 : 0))

  // 6. Mortality Presence score (0–10)
  // Check if any case description mentions dead/mortality
  const hasMortality = candidate.cases.some((c) =>
    (c.description || '').toLowerCase().includes('dead') ||
    (c.description || '').toLowerCase().includes('death')
  )
  const mortalityScore = hasMortality ? 10 : 0

  const totalScore = Math.min(
    100,
    caseCountScore + geoScore + temporalScore + simScore + severityScore + mortalityScore
  )

  let riskLevel: RiskLevel = 'LOW'
  let status: ClusterStatus = 'Monitoring'

  if (totalScore >= DEFAULT_CLUSTER_CONFIG.possibleOutbreakScoreThreshold && count >= DEFAULT_CLUSTER_CONFIG.minCasesForCluster) {
    riskLevel = totalScore >= 85 ? 'CRITICAL' : 'HIGH'
    status = 'Detected'
  } else if (totalScore >= DEFAULT_CLUSTER_CONFIG.elevatedClusterScoreThreshold) {
    riskLevel = 'MEDIUM'
    status = 'Monitoring'
  }

  return {
    score: totalScore,
    riskLevel,
    status,
  }
}

/**
 * Execute full outbreak detection pipeline across active cases
 */
export async function runOutbreakDetectionPipeline(): Promise<OutbreakCluster[]> {
  const allCases = await getVetCases()
  const candidates = detectSpatioTemporalClusters(allCases, DEFAULT_CLUSTER_CONFIG)

  for (let idx = 0; idx < candidates.length; idx++) {
    const candidate = candidates[idx]
    const { score, riskLevel, status } = scoreClusterCandidate(candidate)

    const code = `OB-VAR-2026-${String(idx + 1).padStart(3, '0')}`
    const existing = inMemoryClusters.find((c) => c.cluster_code === code)

    if (existing) {
      existing.cluster_score = score
      existing.risk_level = riskLevel
      existing.case_count = candidate.cases.length
      existing.affected_village_count = candidate.affectedVillages.length
      existing.center_latitude = candidate.centerLatitude
      existing.center_longitude = candidate.centerLongitude
      existing.radius_km = candidate.radiusKm
      existing.common_symptoms = candidate.commonSymptoms
      existing.updated_at = new Date().toISOString()
      existing.cases = candidate.cases
    } else {
      const newCluster: OutbreakCluster = {
        id: `cluster-${Date.now()}-${idx}`,
        cluster_code: code,
        cluster_name: `${candidate.affectedVillages.join('–')} Health Cluster`,
        status,
        risk_level: riskLevel,
        cluster_score: score,
        case_count: candidate.cases.length,
        affected_animal_count: candidate.cases.length * 3, // Estimated herd contacts
        affected_village_count: candidate.affectedVillages.length,
        common_symptoms: candidate.commonSymptoms,
        center_latitude: candidate.centerLatitude,
        center_longitude: candidate.centerLongitude,
        radius_km: candidate.radiusKm,
        affected_villages: candidate.affectedVillages,
        first_case_at: candidate.earliestCaseAt,
        last_case_at: candidate.latestCaseAt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        cases: candidate.cases,
      }

      inMemoryClusters.unshift(newCluster)

      // Generate alert if score meets outbreak or elevated threshold
      if (score >= DEFAULT_CLUSTER_CONFIG.possibleOutbreakScoreThreshold) {
        generateClusterAlert(newCluster, 'POSSIBLE_OUTBREAK')
      } else if (score >= DEFAULT_CLUSTER_CONFIG.elevatedClusterScoreThreshold) {
        generateClusterAlert(newCluster, 'ELEVATED_CLUSTER')
      }

      logAuditAction({
        user_id: 'system',
        user_name: 'Outbreak Intelligence Engine',
        user_role: 'system',
        action: 'Cluster Detected',
        details: `Cluster ${code} detected with score ${score}/100 in ${candidate.affectedVillages.join(', ')}.`,
      })
    }
  }

  return inMemoryClusters
}

/**
 * Generate event-driven intelligence alert
 */
export function generateClusterAlert(
  cluster: OutbreakCluster,
  alertType: 'POSSIBLE_OUTBREAK' | 'ELEVATED_CLUSTER'
): IntelligenceAlert {
  const code = `ALT-OB-2026-${String(inMemoryAlerts.length + 1).padStart(3, '0')}`

  // Avoid spamming duplicate alerts for the same cluster
  const existing = inMemoryAlerts.find((a) => a.cluster_id === cluster.id && a.status === 'Active')
  if (existing) return existing

  const isOutbreak = alertType === 'POSSIBLE_OUTBREAK'
  const title = isOutbreak
    ? `POSSIBLE HEALTH CLUSTER DETECTED: ${cluster.cluster_name}`
    : `ELEVATED HEALTH CLUSTER: ${cluster.cluster_name}`

  const newAlert: IntelligenceAlert = {
    id: `alert-${Date.now()}`,
    alert_code: code,
    title,
    alert_type: alertType,
    severity: cluster.risk_level,
    cluster_id: cluster.id,
    target_role: isOutbreak ? 'all' : 'veterinarian',
    target_district: 'Varanasi',
    target_village: cluster.affected_villages[0] || 'Rampur Khurd',
    message: `${cluster.case_count} similar livestock health cases detected within ${cluster.radius_km} km during the last 7 days. Common signals: ${cluster.common_symptoms.join(', ')}.`,
    recommended_action: isOutbreak
      ? 'Veterinary field investigation recommended. Deploy Mobile Veterinary Unit (MVU) and initiate ring surveillance.'
      : 'Maintain clinical monitoring and review incoming symptom reports from sector.',
    status: 'Active',
    created_at: new Date().toISOString(),
  }

  inMemoryAlerts.unshift(newAlert)

  try {
    supabase.from('intelligence_alerts').insert([{
      alert_code: newAlert.alert_code,
      title: newAlert.title,
      alert_type: newAlert.alert_type,
      severity: newAlert.severity,
      cluster_id: newAlert.cluster_id,
      target_role: newAlert.target_role,
      target_district: newAlert.target_district,
      target_village: newAlert.target_village,
      message: newAlert.message,
      recommended_action: newAlert.recommended_action,
      status: newAlert.status,
    }]).then(({ error }) => {
      if (error) console.warn('[OutbreakEngine] Supabase alert notice:', error)
    })
  } catch (err) {
    // Non-blocking
  }

  return newAlert
}

/**
 * Fetch all outbreak clusters with optional status filter
 */
export async function getOutbreakClusters(statusFilter?: string): Promise<OutbreakCluster[]> {
  try {
    let query = supabase.from('outbreak_clusters').select('*').order('created_at', { ascending: false })
    if (statusFilter && statusFilter !== 'All') {
      query = query.eq('status', statusFilter)
    }
    const { data } = await query
    if (data && data.length > 0) {
      return data as OutbreakCluster[]
    }
  } catch (err) {
    // Fallback to cache
  }

  if (statusFilter && statusFilter !== 'All') {
    return inMemoryClusters.filter((c) => c.status === statusFilter)
  }
  return inMemoryClusters
}

/**
 * Fetch a single cluster by ID with hydrated case data
 */
export async function getClusterById(clusterId: string): Promise<OutbreakCluster | null> {
  const cluster = inMemoryClusters.find((c) => c.id === clusterId || c.cluster_code === clusterId)
  if (!cluster) return null

  // Hydrate linked cases
  if (!cluster.cases || cluster.cases.length === 0) {
    const allCases = await getVetCases()
    cluster.cases = allCases.filter((c) =>
      cluster.affected_villages.includes(c.village || '') ||
      (c.latitude && c.longitude && haversineDistanceKm(cluster.center_latitude, cluster.center_longitude, c.latitude, c.longitude) <= cluster.radius_km)
    )
  }

  return cluster
}

/**
 * Update investigation status of a cluster (Restricted to authorized vet/admin)
 */
export async function updateClusterInvestigationStatus(
  clusterId: string,
  status: ClusterStatus,
  notes?: string,
  reviewer = 'Dr. Priya Sharma (Veterinary Officer)'
): Promise<boolean> {
  const cluster = inMemoryClusters.find((c) => c.id === clusterId)
  if (cluster) {
    const prevStatus = cluster.status
    cluster.status = status
    cluster.reviewed_by = reviewer
    cluster.reviewed_at = new Date().toISOString()
    if (notes) cluster.investigation_notes = notes
    cluster.updated_at = new Date().toISOString()

    try {
      await supabase
        .from('outbreak_clusters')
        .update({
          status,
          investigation_notes: notes,
          reviewed_by: reviewer,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', clusterId)
    } catch (err) {
      // Non-blocking
    }

    await logAuditAction({
      user_id: 'demo-vet',
      user_name: reviewer,
      user_role: 'veterinarian',
      action: 'Cluster Updated',
      details: `Cluster ${cluster.cluster_code} status transitioned from ${prevStatus} to ${status}. Notes: ${notes || 'None'}`,
    })

    return true
  }

  return false
}

/**
 * Fetch intelligence alerts
 */
export async function getIntelligenceAlerts(role?: string): Promise<IntelligenceAlert[]> {
  try {
    let query = supabase.from('intelligence_alerts').select('*').order('created_at', { ascending: false })
    if (role && role !== 'admin') {
      query = query.or(`target_role.eq.${role},target_role.eq.all`)
    }
    const { data } = await query
    if (data && data.length > 0) {
      return data as IntelligenceAlert[]
    }
  } catch (err) {
    // Fallback
  }

  if (role && role !== 'admin') {
    return inMemoryAlerts.filter((a) => a.target_role === role || a.target_role === 'all')
  }
  return inMemoryAlerts
}

/**
 * Acknowledge an intelligence alert
 */
export async function acknowledgeIntelligenceAlert(
  alertId: string,
  officerName = 'Dr. Priya Sharma (Veterinary Officer)'
): Promise<boolean> {
  const alert = inMemoryAlerts.find((a) => a.id === alertId)
  if (alert) {
    alert.status = 'Acknowledged'
    alert.acknowledged_by = officerName
    alert.acknowledged_at = new Date().toISOString()

    try {
      await supabase
        .from('intelligence_alerts')
        .update({
          status: 'Acknowledged',
          acknowledged_by: officerName,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', alertId)
    } catch (err) {
      // Non-blocking
    }

    return true
  }

  return false
}
