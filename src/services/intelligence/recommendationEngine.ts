// ============================================================
// PASHURAKSHA (पशुरक्षा) — INTELLIGENT RECOMMENDATION ENGINE
// Stage 5: Rule-Based Decision Support with Explainable Justifications
// Standard: Decision-support & Early Warning (No auto-diagnosis)
// ============================================================

import { supabase } from '@/lib/supabase'
import { getVetCases } from '@/services/vetService'
import { getOutbreakClusters } from '@/services/risk/outbreakEngine'
import type {
  IntelligenceRecommendation,
  RecommendationPriority,
  RecommendationStatus
} from '@/types'

let inMemoryRecommendations: IntelligenceRecommendation[] = [
  {
    id: 'rec-001',
    area_name: 'Rampur Khurd',
    recommendation_type: 'HIGH_CASE_GROWTH',
    title: 'Prioritize Field Veterinary Investigation in Rampur Khurd',
    description: 'Surveillance telemetry detects an acceleration in acute bovine respiratory distress signals within a 3.5 km radius.',
    reasons: [
      '6 health reports recorded within the last 7 days (150% increase over previous week)',
      '4 reports evaluated as HIGH or CRITICAL risk scores (≥60)',
      'Shared symptoms: High Fever, Cough, and Purulent Nasal Discharge',
      'Cases are geographically clustered within Rampur Khurd village boundaries'
    ],
    priority: 'CRITICAL',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'rec-002',
    area_name: 'Shivpur Sector',
    recommendation_type: 'MULTIPLE_SIMILAR_CASES',
    title: 'Investigate Peripheral Herd Contacts in Shivpur',
    description: 'Multiple smallholder dairy units report synchronized lethargy and oral swelling without confirmed etiology.',
    reasons: [
      '3 distinct livestock owners reported similar clinical signs within 48 hours',
      '2 biological diagnostic samples pending laboratory referral',
      'Potential communal grazing or water source overlap identified'
    ],
    priority: 'HIGH',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: 'rec-003',
    area_name: 'Kashi Gaon / Rampur',
    recommendation_type: 'MORTALITY_SIGNAL',
    title: 'Immediate Biosecurity & Post-Mortem Verification',
    description: 'Suspected sudden mortality reported in adult cattle herd requires forensic veterinary inspection and carcass containment.',
    reasons: [
      'Reported sudden death in non-vaccinated cattle heifer',
      'Proximity to active respiratory cluster PR-CLUST-2026-001',
      'World Organisation for Animal Health (WOAH) guidelines recommend rapid biosecurity containment'
    ],
    priority: 'CRITICAL',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
  {
    id: 'rec-004',
    area_name: 'Cholapur Block',
    recommendation_type: 'LOW_VACCINATION_COVERAGE',
    title: 'Conduct Targeted Ring Vaccination Outreach',
    description: 'Recorded FMD and HS booster coverage in the block is below the recommended 75% herd biosecurity threshold.',
    reasons: [
      'Recorded vaccination coverage across registered livestock is 42%',
      'Adjoining sector has active possible outbreak alert',
      'Preventive immunization drive recommended before seasonal monsoon transition'
    ],
    priority: 'MEDIUM',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
]

/**
 * Dynamically synthesizes decision-support recommendations from database state
 */
export async function generateDecisionRecommendations(): Promise<IntelligenceRecommendation[]> {
  try {
    const [cases, clusters] = await Promise.all([
      getVetCases(),
      getOutbreakClusters(),
    ])

    const recs: IntelligenceRecommendation[] = []

    // 1. Evaluate Active Clusters for High-Priority Containment
    clusters.filter((cl) => cl.status !== 'Dismissed').forEach((cluster) => {
      if (cluster.cluster_score >= 70) {
        recs.push({
          id: `rec-clust-${cluster.id}`,
          area_name: cluster.affected_villages[0] || 'Varanasi',
          recommendation_type: 'CLUSTER_CONTAINMENT',
          title: `Deploy Rapid Containment Protocol for Cluster ${cluster.cluster_code}`,
          description: `Spatiotemporal cluster ${cluster.cluster_name} has exceeded biosecurity threshold with score ${cluster.cluster_score}/100.`,
          reasons: [
            `${cluster.case_count} cases detected across ${cluster.affected_village_count} villages`,
            `High symptom concordance: ${cluster.common_symptoms.join(', ')}`,
            `Estimated radius: ${cluster.radius_km} km around epicenter`,
            'Veterinary field verification and ring biosecurity recommended'
          ],
          priority: 'CRITICAL',
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
        })
      }
    })

    // 2. Evaluate High Mortality Signals
    const mortalityCases = cases.filter((c) =>
      (c.description || '').toLowerCase().includes('death') ||
      (c.description || '').toLowerCase().includes('dead') ||
      c.symptoms.includes('Reported Animal Mortality')
    )

    if (mortalityCases.length > 0) {
      const topMortality = mortalityCases[0]
      recs.push({
        id: `rec-mort-${topMortality.id}`,
        area_name: topMortality.village || 'Rampur Khurd',
        recommendation_type: 'MORTALITY_SIGNAL',
        title: `Conduct On-Site Biosecurity Triage for Mortality Case #${topMortality.case_number}`,
        description: 'Livestock mortality report recorded. Field necropsy and sanitary disposal inspection recommended.',
        reasons: [
          `Mortality recorded in ${topMortality.village || 'Rampur Khurd'}`,
          `Associated symptoms or notes: "${topMortality.description || 'Reported death'}"`,
          'Timely carcass disposal verification prevents vector dissemination'
        ],
        priority: 'CRITICAL',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
      })
    }

    // Combine generated with seeded recommendations
    const existingIds = new Set(recs.map((r) => r.id))
    inMemoryRecommendations.forEach((r) => {
      if (!existingIds.has(r.id)) recs.push(r)
    })

    return recs
  } catch (err) {
    console.error('[RecommendationEngine] Failed to generate recommendations:', err)
    return inMemoryRecommendations
  }
}

/**
 * Fetch recommendations with optional filtering
 */
export async function getRecommendations(filters?: {
  area?: string
  status?: RecommendationStatus
  priority?: RecommendationPriority
}): Promise<IntelligenceRecommendation[]> {
  try {
    let query = supabase
      .from('intelligence_recommendations')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.priority) query = query.eq('priority', filters.priority)

    const { data, error } = await query
    if (error) throw error
    if (data && data.length > 0) {
      let filtered = data as IntelligenceRecommendation[]
      if (filters?.area) {
        filtered = filtered.filter((r) => r.area_name.toLowerCase().includes(filters.area!.toLowerCase()))
      }
      return filtered
    }
  } catch (err) {
    console.warn('[RecommendationEngine] Supabase fetch notice:', err)
  }

  // Fallback to generated list
  let list = await generateDecisionRecommendations()
  if (filters?.status) {
    list = list.filter((r) => r.status === filters.status)
  }
  if (filters?.priority) {
    list = list.filter((r) => r.priority === filters.priority)
  }
  if (filters?.area) {
    list = list.filter((r) => r.area_name.toLowerCase().includes(filters.area!.toLowerCase()))
  }

  return list
}

/**
 * Update the status of a recommendation (e.g. mark ACTIONED or DISMISSED)
 */
export async function updateRecommendationStatus(
  id: string,
  status: RecommendationStatus
): Promise<IntelligenceRecommendation | null> {
  try {
    const { data, error } = await supabase
      .from('intelligence_recommendations')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (data) return data as IntelligenceRecommendation
  } catch (err) {
    console.warn('[RecommendationEngine] Supabase update notice:', err)
  }

  const idx = inMemoryRecommendations.findIndex((r) => r.id === id)
  if (idx !== -1) {
    inMemoryRecommendations[idx].status = status
    return inMemoryRecommendations[idx]
  }

  return null
}
