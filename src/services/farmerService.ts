// ============================================================
// PASHURAKSHA (पशुरक्षा) — FARMER AGGREGATION SERVICE
// Computes live statistics & recent health activity from Supabase
// ============================================================

import type { FarmerStats, RecentHealthActivity } from '@/types'
import { getAnimals } from '@/services/animalService'
import { getSymptomReports } from '@/services/symptomReportService'
import { getVaccinations } from '@/services/vaccinationService'
import { getTreatments } from '@/services/treatmentService'
import { getMortalityReports } from '@/services/mortalityReportService'

/**
 * Compute actual farmer statistics derived from live Supabase tables
 */
export async function getFarmerStats(ownerId: string): Promise<FarmerStats> {
  const animals = await getAnimals(ownerId)
  const vaccinations = await getVaccinations(ownerId)

  const total_livestock = animals.length
  let healthy = 0
  let under_observation = 0
  let high_risk = 0

  for (const animal of animals) {
    if (animal.health_status === 'Healthy') {
      healthy++
    } else if (animal.health_status === 'Under Observation') {
      under_observation++
    } else if (animal.health_status === 'High Risk' || animal.health_status === 'Critical') {
      high_risk++
    }
  }

  // Count vaccinations due in the next 14 days or overdue
  const fourteenDaysLater = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]

  const vaccinations_due = vaccinations.filter(
    (v) => v.next_due_date && v.next_due_date <= fourteenDaysLater
  ).length

  return {
    total_livestock,
    healthy,
    under_observation,
    high_risk,
    vaccinations_due,
  }
}

/**
 * Compile a unified recent health activity timeline from all 4 clinical tables
 */
export async function getRecentHealthActivity(ownerId: string): Promise<RecentHealthActivity[]> {
  const [symptomReports, vaccinations, treatments, mortalityReports] = await Promise.all([
    getSymptomReports(ownerId),
    getVaccinations(ownerId),
    getTreatments(ownerId),
    getMortalityReports(ownerId),
  ])

  const activities: RecentHealthActivity[] = []

  // Add symptom reports
  for (const report of symptomReports) {
    activities.push({
      id: `act-sr-${report.id}`,
      animal_id: report.animal_id,
      animal_tag: report.animal?.animal_tag || 'Animal',
      animal_type: report.animal?.animal_type || 'Cow',
      activity_type: 'Health Report',
      date: report.reported_at,
      status: report.status,
      severity: report.severity,
    })
  }

  // Add vaccinations
  for (const vac of vaccinations) {
    activities.push({
      id: `act-vac-${vac.id}`,
      animal_id: vac.animal_id,
      animal_tag: vac.animal?.animal_tag || 'Animal',
      animal_type: vac.animal?.animal_type || 'Cow',
      activity_type: 'Vaccination',
      date: vac.vaccination_date,
      status: 'Completed',
    })
  }

  // Add treatments
  for (const trt of treatments) {
    activities.push({
      id: `act-trt-${trt.id}`,
      animal_id: trt.animal_id,
      animal_tag: trt.animal?.animal_tag || 'Animal',
      animal_type: trt.animal?.animal_type || 'Cow',
      activity_type: 'Treatment',
      date: trt.start_date,
      status: trt.end_date ? 'Active Course' : 'Initiated',
    })
  }

  // Add mortality reports
  for (const mor of mortalityReports) {
    activities.push({
      id: `act-mor-${mor.id}`,
      animal_id: mor.animal_id,
      animal_tag: mor.animal?.animal_tag || 'Animal',
      animal_type: mor.animal?.animal_type || 'Cow',
      activity_type: 'Mortality',
      date: mor.reported_at,
      status: mor.status,
    })
  }

  // Sort descending by date
  return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8)
}
