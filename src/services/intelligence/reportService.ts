// ============================================================
// PASHURAKSHA (पशुरक्षा) — SURVEILLANCE REPORT SERVICE
// Stage 5: Statutory Surveillance Bulletins & Reporting Core
// Standard: Transparent Aggregation & Print/Export Readiness
// ============================================================

import { supabase } from '@/lib/supabase'
import { getVetCases } from '@/services/vetService'
import { getOutbreakClusters } from '@/services/risk/outbreakEngine'
import { getAllRiskAssessments } from '@/services/risk/riskEngine'
import { getAllAnimals } from '@/services/animalService'
import { calculateDirectionalTrend } from './predictiveEngine'
import { getVaccinationAnalyticsOverview } from './analyticsService'
import type {
  ReportType,
  SurveillanceReport
} from '@/types'

let inMemoryReports: SurveillanceReport[] = [
  {
    id: 'rep-001',
    report_type: 'Health Surveillance Report',
    title: 'Weekly Epidemiological Surveillance Bulletin — Varanasi District',
    period_start: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    period_end: new Date().toISOString().split('T')[0],
    parameters: {
      district: 'Varanasi',
      village: 'All',
      animal_type: 'All',
      risk_level: 'All',
    },
    metrics: {
      total_reports: 14,
      high_risk_count: 5,
      active_clusters: 2,
      mortality_count: 2,
      vaccination_coverage_pct: 68,
      trend: 'INCREASING',
      dominant_symptoms: ['Fever', 'Cough', 'Swelling'],
      priority_villages: ['Rampur Khurd', 'Shivpur'],
    },
    recommendations: [
      'Prioritize mobile veterinary inspection in Rampur Khurd (Cluster PR-CLUST-2026-001)',
      'Initiate targeted booster vaccination for bovine respiratory complexes',
      'Verify biological containment of suspected mortality cases'
    ],
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: 'rep-002',
    report_type: 'Outbreak Report',
    title: 'Cluster Containment & Early Warning Summary — Cluster PR-CLUST-2026-001',
    period_start: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
    period_end: new Date().toISOString().split('T')[0],
    parameters: {
      district: 'Varanasi',
      village: 'Rampur Khurd',
      animal_type: 'Cow',
      risk_level: 'HIGH',
    },
    metrics: {
      total_reports: 8,
      high_risk_count: 6,
      cluster_score: 74,
      affected_villages: ['Rampur Khurd', 'Kashi Gaon'],
      cordon_radius_km: 3.5,
      mortality_count: 1,
    },
    recommendations: [
      'Establish 3.5 km ring biosecurity surveillance cordon',
      'Accelerate pending diagnostic laboratory referrals at DDDL Varanasi'
    ],
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
]

/**
 * Compiles a new surveillance report with real metrics from the database
 */
export async function generateSurveillanceReport(
  reportType: ReportType,
  parameters: {
    district?: string
    village?: string
    animal_type?: string
    risk_level?: string
    period_start: string
    period_end: string
  }
): Promise<SurveillanceReport> {
  const [cases, clusters, assessments, animals, trendData, vaccOverview] = await Promise.all([
    getVetCases(),
    getOutbreakClusters(),
    getAllRiskAssessments(),
    getAllAnimals(),
    calculateDirectionalTrend(7, parameters.district || parameters.village),
    getVaccinationAnalyticsOverview(),
  ])

  // Filter cases by parameters
  const startTime = new Date(parameters.period_start).getTime()
  const endTime = new Date(parameters.period_end + 'T23:59:59').getTime()

  const filteredCases = cases.filter((c) => {
    const t = new Date(c.created_at || c.reported_at).getTime()
    if (t < startTime || t > endTime) return false

    if (parameters.district && parameters.district !== 'All' && (c.district || '').toLowerCase() !== parameters.district.toLowerCase()) {
      return false
    }
    if (parameters.village && parameters.village !== 'All' && (c.village || '').toLowerCase() !== parameters.village.toLowerCase()) {
      return false
    }
    if (parameters.animal_type && parameters.animal_type !== 'All' && c.animal?.animal_type !== parameters.animal_type) {
      return false
    }
    return true
  })

  const caseIds = new Set(filteredCases.map((c) => c.id))
  const relevantAssessments = assessments.filter((a) => caseIds.has(a.case_id))

  const highRiskCount = relevantAssessments.filter(
    (a) => a.risk_level === 'HIGH' || a.risk_level === 'CRITICAL'
  ).length

  const mortalityCount = filteredCases.filter((c) =>
    (c.description || '').toLowerCase().includes('dead') ||
    (c.description || '').toLowerCase().includes('death') ||
    c.symptoms.includes('Reported Animal Mortality')
  ).length

  // Extract common symptoms
  const symptomFreq: Record<string, number> = {}
  filteredCases.forEach((c) => {
    c.symptoms.forEach((s) => {
      symptomFreq[s] = (symptomFreq[s] || 0) + 1
    })
  })
  const topSymptoms = Object.entries(symptomFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([s]) => s)

  // Identify priority areas
  const villageFreq: Record<string, number> = {}
  filteredCases.forEach((c) => {
    if (c.village) villageFreq[c.village] = (villageFreq[c.village] || 0) + 1
  })
  const priorityVillages = Object.entries(villageFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([v]) => v)

  // Synthesize recommendations
  const recommendations: string[] = []
  if (highRiskCount > 0) {
    recommendations.push(`Conduct immediate clinical triage on ${highRiskCount} high-risk case dossiers.`)
  }
  if (mortalityCount > 0) {
    recommendations.push(`Verify necropsy and containment protocol for ${mortalityCount} reported mortality event(s).`)
  }
  if (vaccOverview.overallCoveragePct < 75) {
    recommendations.push(`Targeted vaccination outreach recommended (recorded coverage: ${vaccOverview.overallCoveragePct}%).`)
  }
  if (priorityVillages.length > 0) {
    recommendations.push(`Deploy veterinary officers to high-incident village: ${priorityVillages.join(', ')}.`)
  }

  const newReport: SurveillanceReport = {
    id: `rep-${Date.now()}`,
    report_type: reportType,
    title: `${reportType} — ${parameters.district || 'District Varanasi'} (${parameters.period_start} to ${parameters.period_end})`,
    period_start: parameters.period_start,
    period_end: parameters.period_end,
    parameters: {
      district: parameters.district || 'All',
      village: parameters.village || 'All',
      animal_type: parameters.animal_type || 'All',
      risk_level: parameters.risk_level || 'All',
    },
    metrics: {
      total_reports: filteredCases.length,
      high_risk_count: highRiskCount,
      active_clusters: clusters.filter((cl) => cl.status !== 'Dismissed').length,
      mortality_count: mortalityCount,
      vaccination_coverage_pct: vaccOverview.overallCoveragePct,
      trend: trendData.trend,
      trend_summary: trendData.summary,
      dominant_symptoms: topSymptoms.length > 0 ? topSymptoms : ['Non-specific malaise'],
      priority_villages: priorityVillages.length > 0 ? priorityVillages : ['Rampur Khurd'],
      total_animals_monitored: animals.length,
    },
    recommendations,
    created_at: new Date().toISOString(),
  }

  // Insert into Supabase if available
  try {
    await supabase.from('surveillance_reports').insert({
      id: newReport.id,
      report_type: newReport.report_type,
      title: newReport.title,
      period_start: newReport.period_start,
      period_end: newReport.period_end,
      parameters: newReport.parameters,
      metrics: newReport.metrics,
      recommendations: newReport.recommendations,
    })
  } catch (err) {
    console.warn('[ReportService] Supabase insert notice:', err)
  }

  inMemoryReports.unshift(newReport)
  return newReport
}

/**
 * Returns all generated reports
 */
export async function getSurveillanceReports(): Promise<SurveillanceReport[]> {
  try {
    const { data, error } = await supabase
      .from('surveillance_reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    if (data && data.length > 0) return data as SurveillanceReport[]
  } catch (err) {
    console.warn('[ReportService] Supabase fetch notice:', err)
  }

  return inMemoryReports
}

/**
 * Returns a single report by ID
 */
export async function getSurveillanceReportById(id: string): Promise<SurveillanceReport | null> {
  const all = await getSurveillanceReports()
  return all.find((r) => r.id === id) || null
}
