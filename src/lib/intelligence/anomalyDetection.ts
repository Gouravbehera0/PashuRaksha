// ============================================================
// PASHURAKSHA (पशुरक्षा) — STATISTICAL ANOMALY DETECTION ENGINE
// Stage 10: Advanced AI & Disease Intelligence
// Standard: Explainable Statistical Outlier & Trend Detection
// "Detect Early. Prevent Outbreaks. Protect Livestock."
// ============================================================

import type { VeterinaryCase, MortalityReport } from '@/types'
import type { AnomalyDetectionWarning, AnomalyStatus } from './intelligenceTypes'

export const ANOMALY_ENGINE_VERSION = 'pashuraksha-anomaly-v1.0'

export interface AnomalyDetectionConfig {
  observationWindowDays: number // default: 7
  baselineWindowDays: number // default: 30
  minCasesForVolumeSurge: number // default: 3 (prevents noise on 1->2 cases)
  volumeSurgeThresholdPct: number // default: 75%
  minMortalityForSpike: number // default: 2
  geographicConcentrationRatio: number // default: 0.50 (50% in 1 village)
  minDistrictCasesForGeoCheck: number // default: 4
}

export const DEFAULT_ANOMALY_CONFIG: AnomalyDetectionConfig = {
  observationWindowDays: 7,
  baselineWindowDays: 30,
  minCasesForVolumeSurge: 3,
  volumeSurgeThresholdPct: 75,
  minMortalityForSpike: 2,
  geographicConcentrationRatio: 0.50,
  minDistrictCasesForGeoCheck: 4,
}

// In-memory store for anomalies
let inMemoryAnomalies: AnomalyDetectionWarning[] = [
  {
    id: 'anom-001-ramp-surge',
    signalType: 'VOLUME_SURGE',
    title: 'Statistically Significant Reporting Surge',
    description: 'Rampur Khurd village recorded a 140% increase in incident reports over the past 7 days compared with its 30-day baseline average.',
    severity: 'HIGH',
    status: 'Under Investigation',
    jurisdiction: {
      district: 'Varanasi',
      village: 'Rampur Khurd',
    },
    affectedCaseCount: 4,
    affectedMortalityCount: 1,
    observationWindowDays: 7,
    baselineWindowDays: 30,
    observedValue: 4,
    baselineValue: 1.6,
    percentageChange: 150,
    sufficientData: true,
    contributingFactors: [
      'Observed 4 cases in 7 days against historical weekly baseline of 1.6 cases.',
      'Symptom reports primarily feature pyrexia, salivation, and oral vesicles.',
      'Meets minimum case threshold of >=3 cases required for statistical anomaly validation.',
    ],
    dataLimitations: [
      'Increased reporting may partly reflect heightened community awareness following recent Mobile Veterinary Unit awareness camps.',
      'This statistical signal is not proof of a new disease outbreak until field verification is completed by the District Epidemiologist.',
    ],
    investigationNotes: 'Dr. Priya Sharma dispatched veterinary mobile squad for herd examination and ring inspection.',
    reviewedBy: 'Dr. Priya Sharma (Veterinary Officer)',
    reviewedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    analysisVersion: ANOMALY_ENGINE_VERSION,
    detectedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    associatedCaseIds: ['case-001', 'case-002', 'case-003'],
  },
  {
    id: 'anom-002-vesicular-recurrence',
    signalType: 'SYNDROMIC_RECURRENCE',
    title: 'Repeated Vesicular Syndromic Signal',
    description: '3 separate herds within a 3.5 km radius reported acute oral mucosal vesicles and ropy salivation within a 5-day window.',
    severity: 'CRITICAL',
    status: 'Escalated',
    jurisdiction: {
      district: 'Varanasi',
      village: 'Rampur Khurd',
    },
    affectedCaseCount: 3,
    affectedMortalityCount: 0,
    observationWindowDays: 7,
    baselineWindowDays: 30,
    observedValue: 3,
    baselineValue: 0.3,
    percentageChange: 900,
    sufficientData: true,
    contributingFactors: [
      '3 distinct livestock owners reported identical vesicular / ptyalism symptoms.',
      'Geographic centroid located at 25.3176° N, 82.9739° E (Zone 4).',
      'High similarity index (Jaccard > 0.6) across reported clinical signs.',
    ],
    dataLimitations: [
      'Clinical signs are consistent with Foot-and-Mouth Disease, but definitive confirmation awaits DDDL laboratory RT-PCR returns.',
    ],
    investigationNotes: 'Escalated to Chief Veterinary Officer (CVO) Varanasi. 5 km precautionary ring cordon buffer established on GIS.',
    reviewedBy: 'Dr. Priya Sharma (Veterinary Officer)',
    reviewedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    analysisVersion: ANOMALY_ENGINE_VERSION,
    detectedAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    associatedCaseIds: ['case-001', 'case-003'],
  },
]

/**
 * Runs statistical anomaly detection over live case and mortality streams
 */
export function detectAnomalies(
  allCases: VeterinaryCase[],
  allMortality: MortalityReport[] = [],
  config: AnomalyDetectionConfig = DEFAULT_ANOMALY_CONFIG
): AnomalyDetectionWarning[] {
  const now = Date.now()
  const obsWindowMs = config.observationWindowDays * 86400000
  const baseWindowMs = config.baselineWindowDays * 86400000

  // 1. Filter cases in observation window (recent) vs baseline window
  const obsCases = allCases.filter((c) => {
    const t = new Date(c.reported_at || c.created_at).getTime()
    return !isNaN(t) && now - t <= obsWindowMs
  })

  const baselineCases = allCases.filter((c) => {
    const t = new Date(c.reported_at || c.created_at).getTime()
    return !isNaN(t) && now - t <= baseWindowMs
  })

  const obsMortality = allMortality.filter((m) => {
    const t = new Date(m.reported_at || m.created_at).getTime()
    return !isNaN(t) && now - t <= obsWindowMs
  })

  const detected: AnomalyDetectionWarning[] = []

  // Group cases by village
  const villageObsMap = new Map<string, VeterinaryCase[]>()
  obsCases.forEach((c) => {
    const v = c.village || 'Unknown Village'
    if (!villageObsMap.has(v)) villageObsMap.set(v, [])
    villageObsMap.get(v)!.push(c)
  })

  const villageBaseMap = new Map<string, VeterinaryCase[]>()
  baselineCases.forEach((c) => {
    const v = c.village || 'Unknown Village'
    if (!villageBaseMap.has(v)) villageBaseMap.set(v, [])
    villageBaseMap.get(v)!.push(c)
  })

  // ── SIGNAL 1: VOLUME SURGE BY VILLAGE ──
  villageObsMap.forEach((recentInVillage, villageName) => {
    const obsCount = recentInVillage.length
    if (obsCount < config.minCasesForVolumeSurge) {
      // Insufficient data to warrant statistical surge alarm
      return
    }

    const baseCount = (villageBaseMap.get(villageName) || []).length
    // Normalized baseline weekly rate
    const normalizedWeeklyBaseline = Math.max(0.5, (baseCount / (config.baselineWindowDays / 7)))
    const pctChange = Math.round(((obsCount - normalizedWeeklyBaseline) / normalizedWeeklyBaseline) * 100)

    if (pctChange >= config.volumeSurgeThresholdPct) {
      const existingWarning = inMemoryAnomalies.find(
        (a) => a.signalType === 'VOLUME_SURGE' && a.jurisdiction.village === villageName && a.status !== 'Dismissed'
      )

      if (existingWarning) {
        detected.push(existingWarning)
      } else {
        const newWarning: AnomalyDetectionWarning = {
          id: `anom-surge-${villageName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`,
          signalType: 'VOLUME_SURGE',
          title: `Reporting Surge in ${villageName}`,
          description: `${villageName} recorded ${obsCount} cases in the past ${config.observationWindowDays} days (${pctChange}% increase over baseline rate).`,
          severity: obsCount >= 5 || pctChange >= 150 ? 'HIGH' : 'MEDIUM',
          status: 'Detected',
          jurisdiction: {
            district: recentInVillage[0]?.district || 'Varanasi',
            village: villageName,
          },
          affectedCaseCount: obsCount,
          affectedMortalityCount: obsMortality.filter((m) => m.animal?.village === villageName).length,
          observationWindowDays: config.observationWindowDays,
          baselineWindowDays: config.baselineWindowDays,
          observedValue: obsCount,
          baselineValue: Math.round(normalizedWeeklyBaseline * 10) / 10,
          percentageChange: pctChange,
          sufficientData: true,
          contributingFactors: [
            `${obsCount} cases reported in current ${config.observationWindowDays}-day surveillance cycle.`,
            `Historical expected baseline: ${Math.round(normalizedWeeklyBaseline * 10) / 10} cases per week.`,
            `Exceeds minimum statistical validation volume of >=${config.minCasesForVolumeSurge} cases.`,
          ],
          dataLimitations: [
            'Baseline comparisons are sensitive to local reporting participation fluctuations.',
            'Statistical surge does not equate to clinical outbreak diagnosis without veterinary audit.',
          ],
          analysisVersion: ANOMALY_ENGINE_VERSION,
          detectedAt: new Date().toISOString(),
          associatedCaseIds: recentInVillage.map((c) => c.id),
        }
        inMemoryAnomalies.unshift(newWarning)
        detected.push(newWarning)
      }
    }
  })

  // ── SIGNAL 2: MORTALITY SPIKE ──
  const villageMortMap = new Map<string, MortalityReport[]>()
  obsMortality.forEach((m) => {
    const v = m.animal?.village || 'Unknown Village'
    if (!villageMortMap.has(v)) villageMortMap.set(v, [])
    villageMortMap.get(v)!.push(m)
  })

  villageMortMap.forEach((mortList, villageName) => {
    if (mortList.length >= config.minMortalityForSpike) {
      const existingWarning = inMemoryAnomalies.find(
        (a) => a.signalType === 'MORTALITY_SPIKE' && a.jurisdiction.village === villageName && a.status !== 'Dismissed'
      )

      if (existingWarning) {
        if (!detected.some((d) => d.id === existingWarning.id)) detected.push(existingWarning)
      } else {
        const newWarning: AnomalyDetectionWarning = {
          id: `anom-mort-${villageName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`,
          signalType: 'MORTALITY_SPIKE',
          title: `Mortality Cluster in ${villageName}`,
          description: `${mortList.length} mortality events recorded in ${villageName} within ${config.observationWindowDays} days.`,
          severity: 'CRITICAL',
          status: 'Detected',
          jurisdiction: {
            district: mortList[0]?.animal?.district || 'Varanasi',
            village: villageName,
          },
          affectedCaseCount: (villageObsMap.get(villageName) || []).length,
          affectedMortalityCount: mortList.length,
          observationWindowDays: config.observationWindowDays,
          baselineWindowDays: config.baselineWindowDays,
          observedValue: mortList.length,
          baselineValue: 0.2,
          percentageChange: Math.round(((mortList.length - 0.2) / 0.2) * 100),
          sufficientData: true,
          contributingFactors: [
            `${mortList.length} documented livestock deaths in same village cluster.`,
            'Requires immediate carcass biosecurity inspection and deep burial / cremation audit.',
            'Cordon verification required to prevent scavenger dissemination.',
          ],
          dataLimitations: [
            'Post-mortem necropsy verification is required to determine exact pathogen or toxigenic cause.',
          ],
          analysisVersion: ANOMALY_ENGINE_VERSION,
          detectedAt: new Date().toISOString(),
          associatedCaseIds: mortList.map((m) => m.case_id || m.id).filter(Boolean) as string[],
        }
        inMemoryAnomalies.unshift(newWarning)
        detected.push(newWarning)
      }
    }
  })

  // ── SIGNAL 3: GEOGRAPHIC CONCENTRATION IN DISTRICT ──
  if (obsCases.length >= config.minDistrictCasesForGeoCheck) {
    villageObsMap.forEach((casesInVillage, villageName) => {
      const ratio = casesInVillage.length / obsCases.length
      if (ratio >= config.geographicConcentrationRatio && casesInVillage.length >= 3) {
        const existingWarning = inMemoryAnomalies.find(
          (a) => a.signalType === 'GEOGRAPHIC_CONCENTRATION' && a.jurisdiction.village === villageName && a.status !== 'Dismissed'
        )

        if (existingWarning) {
          if (!detected.some((d) => d.id === existingWarning.id)) detected.push(existingWarning)
        } else {
          const newWarning: AnomalyDetectionWarning = {
            id: `anom-geocon-${villageName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`,
            signalType: 'GEOGRAPHIC_CONCENTRATION',
            title: `High Spatial Case Concentration: ${villageName}`,
            description: `${Math.round(ratio * 100)}% of all recent district cases (${casesInVillage.length}/${obsCases.length}) are concentrated in ${villageName}.`,
            severity: 'HIGH',
            status: 'Detected',
            jurisdiction: {
              district: casesInVillage[0]?.district || 'Varanasi',
              village: villageName,
            },
            affectedCaseCount: casesInVillage.length,
            affectedMortalityCount: 0,
            observationWindowDays: config.observationWindowDays,
            baselineWindowDays: config.baselineWindowDays,
            observedValue: Math.round(ratio * 100),
            baselineValue: 20,
            percentageChange: Math.round(((ratio - 0.20) / 0.20) * 100),
            sufficientData: true,
            contributingFactors: [
              `Village accounts for over ${Math.round(ratio * 100)}% of district morbidity volume.`,
              'Spatial hyper-clustering indicates localized vector or communal grazing exposure.',
            ],
            dataLimitations: [
              'High concentration may be exacerbated by single progressive farmer reporting multiple herd members.',
            ],
            analysisVersion: ANOMALY_ENGINE_VERSION,
            detectedAt: new Date().toISOString(),
            associatedCaseIds: casesInVillage.map((c) => c.id),
          }
          inMemoryAnomalies.unshift(newWarning)
          detected.push(newWarning)
        }
      }
    })
  }

  // Include any remaining in-memory anomalies that are active
  inMemoryAnomalies.forEach((saved) => {
    if (saved.status !== 'Dismissed' && !detected.some((d) => d.id === saved.id)) {
      detected.push(saved)
    }
  })

  return detected
}

/**
 * Updates the lifecycle status of an anomaly detection warning (audit tracked)
 */
export function updateAnomalyStatus(
  anomalyId: string,
  newStatus: AnomalyStatus,
  notes?: string,
  reviewedBy?: string
): AnomalyDetectionWarning | null {
  const target = inMemoryAnomalies.find((a) => a.id === anomalyId)
  if (!target) return null

  target.status = newStatus
  if (notes) target.investigationNotes = notes
  if (reviewedBy) target.reviewedBy = reviewedBy
  target.reviewedAt = new Date().toISOString()

  return target
}

/**
 * Returns all recorded anomalies (active and historical)
 */
export function getAllAnomalies(): AnomalyDetectionWarning[] {
  return [...inMemoryAnomalies]
}
