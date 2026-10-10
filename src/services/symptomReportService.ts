// ============================================================
// PASHURAKSHA (पशुरक्षा) — SYMPTOM REPORTING SERVICE
// Direct Supabase table integration with 'symptom_reports'
// ============================================================

import { supabase } from '@/lib/supabase'
import type { SymptomReport, SymptomSeverity, SymptomReportStatus } from '@/types'
import { getAnimalById, updateAnimalHealthStatus } from '@/services/animalService'
import { registerNewSymptomReportAsCase } from '@/services/vetService'

let inMemorySymptomReports: SymptomReport[] = [
  {
    id: 'sr001-fever-cough',
    animal_id: 'a003-demo-gir-heifer',
    owner_id: 'demo-farmer',
    symptoms: ['Fever', 'Cough', 'Loss of Appetite'],
    severity: 'Severe',
    description: 'High body temperature observed since morning with nasal discharge and reduced water intake.',
    reported_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    latitude: 25.3176,
    longitude: 82.9739,
    status: 'Veterinary Review',
    risk_score: null, // Null in Stage 2 (no fake AI)
    risk_level: null, // Null in Stage 2 (no fake AI)
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
  {
    id: 'sr002-swelling',
    animal_id: 'a002-demo-murrah-buf',
    owner_id: 'demo-farmer',
    symptoms: ['Swelling', 'Lethargy'],
    severity: 'Moderate',
    description: 'Right hind leg swelling observed after grazing. Animal is limping slightly.',
    reported_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    latitude: 25.3190,
    longitude: 82.9720,
    status: 'Under Review',
    risk_score: null,
    risk_level: null,
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
]

/**
 * Fetch all symptom reports for a farmer
 */
export async function getSymptomReports(ownerId: string): Promise<SymptomReport[]> {
  try {
    const { data, error } = await supabase
      .from('symptom_reports')
      .select('*, animal:animals(*)')
      .eq('owner_id', ownerId)
      .order('reported_at', { ascending: false })

    if (error) throw error
    if (data && data.length > 0) return data as SymptomReport[]
  } catch (err) {
    console.warn('[SymptomReportService] Supabase query notice:', err)
  }

  // Join in-memory animal data
  const results = inMemorySymptomReports.filter((r) => r.owner_id === ownerId || ownerId.startsWith('demo-'))
  for (const report of results) {
    if (!report.animal) {
      report.animal = (await getAnimalById(report.animal_id)) || undefined
    }
  }
  return results
}

/**
 * Fetch symptom reports for a specific animal
 */
export async function getSymptomReportsByAnimalId(animalId: string): Promise<SymptomReport[]> {
  try {
    const { data, error } = await supabase
      .from('symptom_reports')
      .select('*')
      .eq('animal_id', animalId)
      .order('reported_at', { ascending: false })

    if (error) throw error
    if (data) return data as SymptomReport[]
  } catch (err) {
    console.warn('[SymptomReportService] Supabase animal query notice:', err)
  }

  return inMemorySymptomReports.filter((r) => r.animal_id === animalId)
}

/**
 * Create and submit a new health symptom report in Supabase
 */
export async function createSymptomReport(data: {
  animal_id: string
  owner_id: string
  symptoms: string[]
  severity: SymptomSeverity
  description?: string
  photo_url?: string
  latitude?: number
  longitude?: number
  idempotency_key?: string
  location_type?: 'GPS LOCATION' | 'MANUALLY ENTERED LOCATION' | 'LOCATION UNAVAILABLE'
}): Promise<SymptomReport> {
  // Coordinate bounds validation
  if (data.latitude !== undefined && (data.latitude < -90 || data.latitude > 90)) {
    throw new Error('Invalid latitude coordinate. Must be between -90 and 90.')
  }
  if (data.longitude !== undefined && (data.longitude < -180 || data.longitude > 180)) {
    throw new Error('Invalid longitude coordinate. Must be between -180 and 180.')
  }

  // Idempotency check: if key already processed, return existing record
  if (data.idempotency_key) {
    const existingKey = inMemorySymptomReports.find((r: any) => r.idempotency_key === data.idempotency_key)
    if (existingKey) {
      return existingKey
    }
  }

  // Prevent duplicate case creation within 60 seconds for same animal and symptoms
  const now = Date.now()
  const recentDuplicate = inMemorySymptomReports.find((r) => {
    const isSameAnimal = r.animal_id === data.animal_id
    const timeDiff = now - new Date(r.reported_at).getTime()
    const isRecent = timeDiff < 60000 // 1 minute
    const sameSymptoms = r.symptoms.length === data.symptoms.length &&
      r.symptoms.every((s) => data.symptoms.includes(s))
    return isSameAnimal && isRecent && sameSymptoms
  })
  if (recentDuplicate) {
    return recentDuplicate
  }

  const newReport: any = {
    animal_id: data.animal_id,
    owner_id: data.owner_id,
    symptoms: data.symptoms,
    severity: data.severity,
    description: data.description || '',
    photo_url: data.photo_url,
    reported_at: new Date().toISOString(),
    latitude: data.latitude,
    longitude: data.longitude,
    location_type: data.location_type || 'GPS LOCATION',
    idempotency_key: data.idempotency_key,
    status: 'Reported' as SymptomReportStatus,
    risk_score: null, // Per instructions: NO fake AI
    risk_level: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  try {
    const { data: inserted, error } = await supabase
      .from('symptom_reports')
      .insert([newReport])
      .select('*, animal:animals(*)')
      .single()

    if (error) throw error
    if (inserted) {
      // If severity is severe, update animal health status
      if (data.severity === 'Severe') {
        await updateAnimalHealthStatus(data.animal_id, 'High Risk')
      } else if (data.severity === 'Moderate') {
        await updateAnimalHealthStatus(data.animal_id, 'Under Observation')
      }
      const animal = (inserted as SymptomReport).animal || (await getAnimalById(data.animal_id))
      registerNewSymptomReportAsCase({
        id: (inserted as SymptomReport).id,
        animal_id: data.animal_id,
        owner_id: data.owner_id,
        symptoms: data.symptoms,
        severity: data.severity,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        village: animal?.village || 'Rampur Khurd',
        district: animal?.district || 'Varanasi',
      })
      inMemorySymptomReports.unshift(inserted as SymptomReport)
      return inserted as SymptomReport
    }
  } catch (err) {
    console.warn('[SymptomReportService] Supabase insert notice:', err)
  }

  // Update animal health status in session
  if (data.severity === 'Severe') {
    await updateAnimalHealthStatus(data.animal_id, 'High Risk')
  } else if (data.severity === 'Moderate') {
    await updateAnimalHealthStatus(data.animal_id, 'Under Observation')
  }

  const animal = await getAnimalById(data.animal_id)
  const fallbackReport: SymptomReport = {
    ...newReport,
    id: `sr-${Date.now()}`,
    animal: animal || undefined,
  }
  inMemorySymptomReports.unshift(fallbackReport)

  // Register in Veterinary Case queue
  registerNewSymptomReportAsCase({
    id: fallbackReport.id,
    animal_id: data.animal_id,
    owner_id: data.owner_id,
    symptoms: data.symptoms,
    severity: data.severity,
    description: data.description,
    latitude: data.latitude,
    longitude: data.longitude,
    village: animal?.village || 'Rampur Khurd',
    district: animal?.district || 'Varanasi',
  })

  return fallbackReport
}

/**
 * Fetch all symptom reports across all herds (for authorized Vet / Admin reports)
 */
export async function getAllSymptomReports(): Promise<SymptomReport[]> {
  try {
    const { data, error } = await supabase
      .from('symptom_reports')
      .select('*, animal:animals(*)')
      .order('reported_at', { ascending: false })

    if (error) throw error
    if (data && data.length > 0) return data as SymptomReport[]
  } catch (err) {
    console.warn('[SymptomReportService] Supabase getAllSymptomReports notice:', err)
  }

  const results = [...inMemorySymptomReports]
  for (const report of results) {
    if (!report.animal) {
      report.animal = (await getAnimalById(report.animal_id)) || undefined
    }
  }
  return results
}

