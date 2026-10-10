// ============================================================
// PASHURAKSHA (पशुरक्षा) — GEOSPATIAL & TEMPORAL CLUSTER DETECTION
// Stage 4: Haversine Spatial Distance & Spatio-Temporal Grouping
// ============================================================

import type { VeterinaryCase } from '@/types'
import type { ClusterDetectionConfig } from './riskTypes'

export const DEFAULT_CLUSTER_CONFIG: ClusterDetectionConfig = {
  defaultRadiusKm: 5.0,
  temporalWindowDays: 7,
  minCasesForCluster: 3,
  possibleOutbreakScoreThreshold: 70,
  elevatedClusterScoreThreshold: 50,
  symptomSimilarityThreshold: 0.3,
}

/**
 * Calculate accurate geographic distance in kilometers using Haversine formula
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth radius in kilometers
  const toRad = (angle: number) => (angle * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const phi1 = toRad(lat1)
  const phi2 = toRad(lat2)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(phi1) * Math.cos(phi2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 100) / 100
}

/**
 * Calculate symptom set similarity using Jaccard index (0.0 to 1.0)
 */
export function calculateSymptomSimilarity(symptomsA: string[], symptomsB: string[]): number {
  if (symptomsA.length === 0 || symptomsB.length === 0) return 0

  const setA = new Set(symptomsA.map((s) => s.toLowerCase().trim()))
  const setB = new Set(symptomsB.map((s) => s.toLowerCase().trim()))

  let intersectionCount = 0
  for (const s of setA) {
    if (setB.has(s)) {
      intersectionCount++
    } else {
      // Check partial match
      for (const b of setB) {
        if (s.includes(b) || b.includes(s)) {
          intersectionCount++
          break
        }
      }
    }
  }

  const unionCount = setA.size + setB.size - intersectionCount
  return unionCount === 0 ? 0 : Math.round((intersectionCount / unionCount) * 100) / 100
}

export interface DetectedClusterCandidate {
  cases: VeterinaryCase[]
  centerLatitude: number
  centerLongitude: number
  radiusKm: number
  affectedVillages: string[]
  commonSymptoms: string[]
  avgSymptomSimilarity: number
  earliestCaseAt: string
  latestCaseAt: string
}

/**
 * Detect spatio-temporal clusters from a dataset of veterinary cases
 */
export function detectSpatioTemporalClusters(
  cases: VeterinaryCase[],
  config: ClusterDetectionConfig = DEFAULT_CLUSTER_CONFIG
): DetectedClusterCandidate[] {
  // 1. Filter cases with valid coordinates and within temporal window
  const now = Date.now()
  const windowMs = config.temporalWindowDays * 24 * 3600 * 1000

  const activeCases = cases.filter((c) => {
    if (!c.latitude || !c.longitude) return false
    const reportedTime = new Date(c.reported_at || c.created_at).getTime()
    return now - reportedTime <= windowMs
  })

  if (activeCases.length < config.minCasesForCluster) {
    return []
  }

  // 2. Spatial density clustering (Grouping cases within radius that share symptoms)
  const visited = new Set<string>()
  const clusters: DetectedClusterCandidate[] = []

  for (let i = 0; i < activeCases.length; i++) {
    const seedCase = activeCases[i]
    if (visited.has(seedCase.id)) continue

    const clusterCases: VeterinaryCase[] = [seedCase]
    visited.add(seedCase.id)

    for (let j = 0; j < activeCases.length; j++) {
      if (i === j) continue
      const candidateCase = activeCases[j]
      if (visited.has(candidateCase.id)) continue

      const dist = haversineDistanceKm(
        seedCase.latitude!,
        seedCase.longitude!,
        candidateCase.latitude!,
        candidateCase.longitude!
      )

      if (dist <= config.defaultRadiusKm) {
        const similarity = calculateSymptomSimilarity(seedCase.symptoms, candidateCase.symptoms)
        // If within radius and shares at least basic syndromic overlap
        if (similarity >= config.symptomSimilarityThreshold || similarity >= 0.2) {
          clusterCases.push(candidateCase)
          visited.add(candidateCase.id)
        }
      }
    }

    // Only qualify as cluster if meets minimum cases count
    if (clusterCases.length >= config.minCasesForCluster) {
      // Calculate geographic centroid
      const totalLat = clusterCases.reduce((acc, c) => acc + c.latitude!, 0)
      const totalLon = clusterCases.reduce((acc, c) => acc + c.longitude!, 0)
      const centerLat = Math.round((totalLat / clusterCases.length) * 1000000) / 1000000
      const centerLon = Math.round((totalLon / clusterCases.length) * 1000000) / 1000000

      // Calculate actual cluster radius (max distance from centroid or default min)
      let maxDist = 1.0
      for (const c of clusterCases) {
        const d = haversineDistanceKm(centerLat, centerLon, c.latitude!, c.longitude!)
        if (d > maxDist) maxDist = d
      }
      const radiusKm = Math.min(config.defaultRadiusKm * 1.5, Math.max(2.0, Math.round(maxDist * 10) / 10))

      // Collect unique affected villages
      const villages = Array.from(new Set(clusterCases.map((c) => c.village || 'Rampur Khurd'))).filter(Boolean)

      // Frequency map of symptoms
      const symptomFreq: Record<string, number> = {}
      for (const c of clusterCases) {
        for (const s of c.symptoms) {
          symptomFreq[s] = (symptomFreq[s] || 0) + 1
        }
      }

      // Sort symptoms by frequency, take top 4 common symptoms
      const commonSymptoms = Object.entries(symptomFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([s]) => s)

      // Time range
      const timestamps = clusterCases.map((c) => new Date(c.reported_at || c.created_at).getTime())
      const earliestCaseAt = new Date(Math.min(...timestamps)).toISOString()
      const latestCaseAt = new Date(Math.max(...timestamps)).toISOString()

      // Average pairwise symptom similarity
      let simSum = 0
      let pairCount = 0
      for (let m = 0; m < clusterCases.length; m++) {
        for (let n = m + 1; n < clusterCases.length; n++) {
          simSum += calculateSymptomSimilarity(clusterCases[m].symptoms, clusterCases[n].symptoms)
          pairCount++
        }
      }
      const avgSymptomSimilarity = pairCount > 0 ? Math.round((simSum / pairCount) * 100) / 100 : 0.5

      clusters.push({
        cases: clusterCases,
        centerLatitude: centerLat,
        centerLongitude: centerLon,
        radiusKm,
        affectedVillages: villages,
        commonSymptoms,
        avgSymptomSimilarity,
        earliestCaseAt,
        latestCaseAt,
      })
    }
  }

  return clusters
}
