// ============================================================
// PASHURAKSHA (पशुरक्षा) — MORTALITY REPORTING SERVICE
// Direct Supabase table integration with 'mortality_reports'
// ============================================================

import { supabase } from '@/lib/supabase'
import type { MortalityReport, MortalityReportStatus } from '@/types'
import { getAnimalById, updateAnimalHealthStatus } from '@/services/animalService'
import { registerNewMortalityReportAsCase } from '@/services/vetService'

let inMemoryMortalityReports: MortalityReport[] = [
  {
    id: 'mr-001-demo',
    animal_id: 'a001-demo-gir-cow',
    owner_id: 'demo-farmer',
    cause_description: 'Acute tympany & recumbency post grazing; suspected bloat.',
    reported_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    status: 'Verified',
    latitude: 25.3185,
    longitude: 82.9740,
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
]

/**
 * Fetch all mortality reports for a farmer
 */
export async function getMortalityReports(ownerId: string): Promise<MortalityReport[]> {
  try {
    const { data, error } = await supabase
      .from('mortality_reports')
      .select('*, animal:animals(*)')
      .eq('owner_id', ownerId)
      .order('reported_at', { ascending: false })

    if (error) throw error
    if (data && data.length > 0) return data as MortalityReport[]
  } catch (err) {
    console.warn('[MortalityReportService] Supabase query notice:', err)
  }

  const results = inMemoryMortalityReports.filter((r) => r.owner_id === ownerId || ownerId.startsWith('demo-'))
  for (const report of results) {
    if (!report.animal) {
      report.animal = (await getAnimalById(report.animal_id)) || undefined
    }
  }
  return results
}

/**
 * Submit an animal mortality report in Supabase
 */
export async function createMortalityReport(data: {
  animal_id: string
  owner_id: string
  cause_description?: string
  photo_url?: string
  latitude?: number
  longitude?: number
  idempotency_key?: string
  location_type?: 'GPS LOCATION' | 'MANUALLY ENTERED LOCATION' | 'LOCATION UNAVAILABLE'
}): Promise<MortalityReport> {
  // Idempotency check: if key already processed, return existing record
  if (data.idempotency_key) {
    const existingKey = inMemoryMortalityReports.find((r: any) => r.idempotency_key === data.idempotency_key)
    if (existingKey) {
      return existingKey
    }
  }

  const newReport: any = {
    animal_id: data.animal_id,
    owner_id: data.owner_id,
    cause_description: data.cause_description || '',
    reported_at: new Date().toISOString(),
    latitude: data.latitude,
    longitude: data.longitude,
    location_type: data.location_type || 'GPS LOCATION',
    idempotency_key: data.idempotency_key,
    photo_url: data.photo_url,
    status: 'Reported' as MortalityReportStatus,
    created_at: new Date().toISOString(),
  }

  try {
    const { data: inserted, error } = await supabase
      .from('mortality_reports')
      .insert([newReport])
      .select('*, animal:animals(*)')
      .single()

    if (error) throw error
    if (inserted) {
      // Mark animal as critical/deceased in database
      await updateAnimalHealthStatus(data.animal_id, 'Critical')
      const animal = (inserted as MortalityReport).animal || (await getAnimalById(data.animal_id))
      const vetCase = registerNewMortalityReportAsCase({
        id: (inserted as MortalityReport).id,
        animal_id: data.animal_id,
        owner_id: data.owner_id,
        cause_description: data.cause_description,
        latitude: data.latitude,
        longitude: data.longitude,
        village: animal?.village || 'Rampur Khurd',
        district: animal?.district || 'Varanasi',
      })
      const reportWithCase = { ...(inserted as MortalityReport), case_id: vetCase.id }
      inMemoryMortalityReports.unshift(reportWithCase)
      return reportWithCase
    }
  } catch (err) {
    console.warn('[MortalityReportService] Supabase insert notice:', err)
  }

  await updateAnimalHealthStatus(data.animal_id, 'Critical')
  const animal = await getAnimalById(data.animal_id)
  const reportId = `mr-${Date.now()}`
  const vetCase = registerNewMortalityReportAsCase({
    id: reportId,
    animal_id: data.animal_id,
    owner_id: data.owner_id,
    cause_description: data.cause_description,
    latitude: data.latitude,
    longitude: data.longitude,
    village: animal?.village || 'Rampur Khurd',
    district: animal?.district || 'Varanasi',
  })
  const fallbackRecord: MortalityReport = {
    ...newReport,
    id: reportId,
    case_id: vetCase.id,
    animal: animal || undefined,
  }
  inMemoryMortalityReports.unshift(fallbackRecord)
  return fallbackRecord
}

/**
 * Fetch all mortality reports (for authorized Veterinarian and Admin reports)
 */
export async function getAllMortalityReports(): Promise<MortalityReport[]> {
  try {
    const { data, error } = await supabase
      .from('mortality_reports')
      .select('*, animal:animals(*)')
      .order('reported_at', { ascending: false })

    if (error) throw error
    if (data && data.length > 0) return data as MortalityReport[]
  } catch (err) {
    console.warn('[MortalityReportService] Supabase getAllMortalityReports notice:', err)
  }

  const results = [...inMemoryMortalityReports]
  for (const report of results) {
    if (!report.animal) {
      report.animal = (await getAnimalById(report.animal_id)) || undefined
    }
  }
  return results
}

