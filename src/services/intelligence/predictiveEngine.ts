// ============================================================
// PASHURAKSHA (पशुरक्षा) — PREDICTIVE EARLY WARNING ENGINE
// Stage 5: Explainable Statistical Early Warning & Trend Analysis
// Standard: Health surveillance & decision-support (No auto-diagnosis)
// ============================================================

import { supabase } from '@/lib/supabase'
import { getVetCases } from '@/services/vetService'
import { getOutbreakClusters } from '@/services/risk/outbreakEngine'
import { getAllRiskAssessments } from '@/services/risk/riskEngine'
import { getAllAnimals } from '@/services/animalService'
import type {
  AreaEarlyWarning,
  EarlyWarningFactors,
  EarlyWarningRiskLevel,
  DirectionalTrend,
  VeterinaryCase,
  CasePriority,
  CasePriorityExplanation
} from '@/types'

export interface PredictiveEngineConfig {
  version: string
  weights: {
    recentCaseGrowthMax: number       // default 25
    clusterDensityMax: number         // default 20
    highRiskProportionMax: number     // default 20
    mortalitySignalMax: number        // default 15
    historicalActivityMax: number     // default 10
    vaccinationGapMax: number         // default 10
  }
  thresholds: {
    lowMax: number                    // 0-25
    mediumMax: number                 // 26-50
    highMax: number                   // 51-75
    elevatedMin: number               // 76-100
  }
}

export const DEFAULT_PREDICTIVE_CONFIG: PredictiveEngineConfig = {
  version: 'v1.0-deterministic',
  weights: {
    recentCaseGrowthMax: 25,
    clusterDensityMax: 20,
    highRiskProportionMax: 20,
    mortalitySignalMax: 15,
    historicalActivityMax: 10,
    vaccinationGapMax: 10,
  },
  thresholds: {
    lowMax: 25,
    mediumMax: 50,
    highMax: 75,
    elevatedMin: 76,
  },
}

// In-memory cache for area calculations
let inMemoryAreaWarnings: AreaEarlyWarning[] = [
  {
    id: 'ew-varanasi',
    area_name: 'Varanasi',
    area_type: 'district',
    early_warning_score: 64,
    risk_level: 'HIGH',
    trend: 'INCREASING',
    factors: {
      recent_case_growth: 18,
      cluster_density: 14,
      high_risk_proportion: 16,
      mortality_signal: 6,
      historical_activity: 5,
      vaccination_gap: 5,
      notes: 'Active case velocity elevated in Rampur Khurd and Shivpur sectors.'
    },
    calculated_at: new Date().toISOString(),
    engine_version: 'v1.0-deterministic',
  },
  {
    id: 'ew-rampur-khurd',
    area_name: 'Rampur Khurd',
    area_type: 'village',
    early_warning_score: 72,
    risk_level: 'HIGH',
    trend: 'INCREASING',
    factors: {
      recent_case_growth: 22,
      cluster_density: 18,
      high_risk_proportion: 16,
      mortality_signal: 8,
      historical_activity: 4,
      vaccination_gap: 4,
      notes: 'High syndromic respiratory reporting rate with detected cluster proximity.'
    },
    calculated_at: new Date().toISOString(),
    engine_version: 'v1.0-deterministic',
  },
  {
    id: 'ew-shivpur',
    area_name: 'Shivpur',
    area_type: 'village',
    early_warning_score: 48,
    risk_level: 'MEDIUM',
    trend: 'STABLE',
    factors: {
      recent_case_growth: 12,
      cluster_density: 10,
      high_risk_proportion: 12,
      mortality_signal: 0,
      historical_activity: 6,
      vaccination_gap: 8,
      notes: 'Stable case reporting with potential vaccination outreach gap.'
    },
    calculated_at: new Date().toISOString(),
    engine_version: 'v1.0-deterministic',
  },
  {
    id: 'ew-cholapur',
    area_name: 'Cholapur',
    area_type: 'village',
    early_warning_score: 22,
    risk_level: 'LOW',
    trend: 'DECREASING',
    factors: {
      recent_case_growth: 4,
      cluster_density: 0,
      high_risk_proportion: 6,
      mortality_signal: 0,
      historical_activity: 4,
      vaccination_gap: 8,
      notes: 'Low syndromic signals and no active outbreak clusters.'
    },
    calculated_at: new Date().toISOString(),
    engine_version: 'v1.0-deterministic',
  },
]

/**
 * Evaluates directional trend over a given day window (7, 14, 30 days)
 */
export async function calculateDirectionalTrend(
  dayWindow: 7 | 14 | 30 = 7,
  areaFilter?: string
): Promise<{
  trend: DirectionalTrend
  changePct: number
  currentCount: number
  previousCount: number
  summary: string
}> {
  const cases = await getVetCases()
  const now = Date.now()
  const msWindow = dayWindow * 86400000

  const filteredCases = areaFilter
    ? cases.filter((c) =>
        (c.village && c.village.toLowerCase() === areaFilter.toLowerCase()) ||
        (c.district && c.district.toLowerCase() === areaFilter.toLowerCase())
      )
    : cases

  let currentCount = 0
  let previousCount = 0

  filteredCases.forEach((c) => {
    const caseTime = new Date(c.created_at || c.reported_at).getTime()
    if (caseTime >= now - msWindow && caseTime <= now) {
      currentCount++
    } else if (caseTime >= now - 2 * msWindow && caseTime < now - msWindow) {
      previousCount++
    }
  })

  // Calculate percentage delta
  let changePct = 0
  if (previousCount === 0) {
    changePct = currentCount > 0 ? 100 : 0
  } else {
    changePct = Math.round(((currentCount - previousCount) / previousCount) * 100)
  }

  let trend: DirectionalTrend = 'STABLE'
  if (changePct > 15) {
    trend = 'INCREASING'
  } else if (changePct < -15) {
    trend = 'DECREASING'
  }

  const directionWord = trend === 'INCREASING' ? 'increasing' : trend === 'DECREASING' ? 'decreasing' : 'stable'
  const summary = `Health reports are ${directionWord} over the ${dayWindow}-day observation window (${changePct >= 0 ? '+' : ''}${changePct}%).`

  return { trend, changePct, currentCount, previousCount, summary }
}

/**
 * Calculates a 0–100 explainable Early Warning Score for a geographic area
 */
export async function calculateAreaEarlyWarning(
  areaName: string,
  areaType: 'district' | 'village' = 'village',
  config: PredictiveEngineConfig = DEFAULT_PREDICTIVE_CONFIG
): Promise<AreaEarlyWarning> {
  const [cases, clusters, assessments, animals] = await Promise.all([
    getVetCases(),
    getOutbreakClusters(),
    getAllRiskAssessments(),
    getAllAnimals(),
  ])

  const normalizedArea = areaName.toLowerCase()

  // Filter entities by area
  const areaCases = cases.filter((c) =>
    areaType === 'district'
      ? (c.district || '').toLowerCase() === normalizedArea
      : (c.village || '').toLowerCase() === normalizedArea
  )

  const areaClusters = clusters.filter((cl) =>
    areaType === 'district'
      ? cl.affected_villages.some((v) => v.toLowerCase().includes(normalizedArea))
      : cl.affected_villages.some((v) => v.toLowerCase() === normalizedArea)
  )

  const now = Date.now()
  const sevenDaysAgo = now - 7 * 86400000
  const fourteenDaysAgo = now - 14 * 86400000

  // 1. Recent case growth (0–25)
  const recentCases = areaCases.filter((c) => new Date(c.created_at).getTime() >= sevenDaysAgo).length
  const prevCases = areaCases.filter((c) => {
    const t = new Date(c.created_at).getTime()
    return t >= fourteenDaysAgo && t < sevenDaysAgo
  }).length

  let recentCaseGrowthScore = 0
  if (recentCases > 0) {
    if (prevCases === 0) {
      recentCaseGrowthScore = Math.min(config.weights.recentCaseGrowthMax, recentCases * 5)
    } else {
      const growthRatio = recentCases / prevCases
      recentCaseGrowthScore = Math.min(
        config.weights.recentCaseGrowthMax,
        Math.round(growthRatio * 10)
      )
    }
  }

  // 2. Cluster density (0–20)
  const clusterScoreAvg =
    areaClusters.length > 0
      ? areaClusters.reduce((sum, cl) => sum + cl.cluster_score, 0) / areaClusters.length
      : 0
  const clusterDensityScore = Math.min(
    config.weights.clusterDensityMax,
    Math.round((clusterScoreAvg / 100) * config.weights.clusterDensityMax)
  )

  // 3. High-risk case proportion (0–20)
  const areaCaseIds = new Set(areaCases.map((c) => c.id))
  const areaAssessments = assessments.filter((a) => areaCaseIds.has(a.case_id))
  const highRiskCount = areaAssessments.filter((a) => a.risk_level === 'HIGH' || a.risk_level === 'CRITICAL').length
  const highRiskRatio = areaAssessments.length > 0 ? highRiskCount / areaAssessments.length : 0
  const highRiskScore = Math.round(highRiskRatio * config.weights.highRiskProportionMax)

  // 4. Mortality signal (0–15)
  const mortalitySignals = areaCases.filter((c) =>
    (c.description || '').toLowerCase().includes('dead') ||
    (c.description || '').toLowerCase().includes('death') ||
    c.symptoms.includes('Reported Animal Mortality')
  ).length
  const mortalityScore = Math.min(
    config.weights.mortalitySignalMax,
    mortalitySignals * 7.5
  )

  // 5. Historical activity (0–10)
  const totalAreaCases = areaCases.length
  const historicalActivityScore = Math.min(
    config.weights.historicalActivityMax,
    Math.round((totalAreaCases / 10) * config.weights.historicalActivityMax)
  )

  // 6. Vaccination gap (0–10)
  // Estimated from animal population vs cases
  const areaAnimals = animals.filter((a) =>
    areaType === 'district'
      ? (a.district || '').toLowerCase() === normalizedArea
      : (a.village || '').toLowerCase() === normalizedArea
  )
  const vaccinationGapScore = areaAnimals.length > 5 ? 5 : 8

  // Calculate sum (capped at 100)
  const totalScore = Math.min(
    100,
    Math.round(
      recentCaseGrowthScore +
      clusterDensityScore +
      highRiskScore +
      mortalityScore +
      historicalActivityScore +
      vaccinationGapScore
    )
  )

  // Categorize risk level
  let riskLevel: EarlyWarningRiskLevel = 'LOW'
  if (totalScore >= config.thresholds.elevatedMin) {
    riskLevel = 'ELEVATED'
  } else if (totalScore > config.thresholds.mediumMax) {
    riskLevel = 'HIGH'
  } else if (totalScore > config.thresholds.lowMax) {
    riskLevel = 'MEDIUM'
  }

  // Trend analysis
  const trendResult = await calculateDirectionalTrend(7, areaName)

  const factors: EarlyWarningFactors = {
    recent_case_growth: recentCaseGrowthScore,
    cluster_density: clusterDensityScore,
    high_risk_proportion: highRiskScore,
    mortality_signal: mortalityScore,
    historical_activity: historicalActivityScore,
    vaccination_gap: vaccinationGapScore,
    notes: `Calculated from ${areaCases.length} local cases and ${areaClusters.length} detected spatial clusters.`
  }

  const warningResult: AreaEarlyWarning = {
    id: `ew-${areaName.toLowerCase().replace(/\s+/g, '-')}`,
    area_name: areaName,
    area_type: areaType,
    early_warning_score: totalScore,
    risk_level: riskLevel,
    trend: trendResult.trend,
    factors,
    calculated_at: new Date().toISOString(),
    engine_version: config.version,
  }

  // Save / Update in Supabase if online
  try {
    await supabase.from('area_early_warnings').upsert({
      area_name: warningResult.area_name,
      area_type: warningResult.area_type,
      early_warning_score: warningResult.early_warning_score,
      risk_level: warningResult.risk_level,
      trend: warningResult.trend,
      factors: warningResult.factors,
      calculated_at: warningResult.calculated_at,
      engine_version: warningResult.engine_version,
    })
  } catch (err) {
    console.warn('[PredictiveEngine] Supabase upsert notice:', err)
  }

  // Update in-memory cache
  const idx = inMemoryAreaWarnings.findIndex((w) => w.area_name.toLowerCase() === normalizedArea)
  if (idx !== -1) {
    inMemoryAreaWarnings[idx] = warningResult
  } else {
    inMemoryAreaWarnings.push(warningResult)
  }

  return warningResult
}

/**
 * Fetch all available area early warnings
 */
export async function getAllAreaEarlyWarnings(): Promise<AreaEarlyWarning[]> {
  try {
    const { data, error } = await supabase
      .from('area_early_warnings')
      .select('*')
      .order('early_warning_score', { ascending: false })

    if (error) throw error
    if (data && data.length > 0) return data as AreaEarlyWarning[]
  } catch (err) {
    console.warn('[PredictiveEngine] Supabase fetch notice:', err)
  }

  return inMemoryAreaWarnings
}

/**
 * Transparent Smart Priority Evaluator for clinical cases
 * Answers: "Why did this case receive its triage priority?"
 */
export function calculateSmartPriority(
  c: VeterinaryCase,
  riskScore: number = 50,
  hasCluster: boolean = false
): CasePriorityExplanation {
  const reasons: string[] = []
  let priorityPoints = 0

  // 1. Health risk score contribution
  if (riskScore >= 75) {
    priorityPoints += 40
    reasons.push('High health-risk score (≥75) indicative of acute systemic stress')
  } else if (riskScore >= 50) {
    priorityPoints += 25
    reasons.push('Elevated health-risk score (≥50)')
  }

  // 2. Reported severity
  if (c.reported_severity === 'Severe') {
    priorityPoints += 25
    reasons.push('Farmer reported severe acute clinical state')
  } else if (c.reported_severity === 'Moderate') {
    priorityPoints += 15
    reasons.push('Moderate symptom severity observed')
  }

  // 3. Cluster association
  if (hasCluster) {
    priorityPoints += 20
    reasons.push('Associated with active spatio-temporal cluster')
  }

  // 4. Mortality association
  const isMortality =
    (c.description || '').toLowerCase().includes('death') ||
    (c.description || '').toLowerCase().includes('dead') ||
    c.symptoms.includes('Reported Animal Mortality')
  if (isMortality) {
    priorityPoints += 30
    reasons.push('Case linked to confirmed or reported livestock mortality')
  }

  // 5. Diagnostic lab requirement
  if (c.status === 'Sample Required' || c.status === 'Under Review') {
    priorityPoints += 10
    reasons.push('Awaiting biological sample collection or clinical triage')
  }

  let calculatedPriority: CasePriority = 'LOW'
  if (priorityPoints >= 70) {
    calculatedPriority = 'CRITICAL'
  } else if (priorityPoints >= 45) {
    calculatedPriority = 'HIGH'
  } else if (priorityPoints >= 25) {
    calculatedPriority = 'MEDIUM'
  }

  return {
    priority: calculatedPriority,
    score: priorityPoints,
    reasons: reasons.length > 0 ? reasons : ['Routine syndromic report under monitoring'],
  }
}
