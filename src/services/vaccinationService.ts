// ============================================================
// PASHURAKSHA (पशुरक्षा) — VACCINATION SERVICE
// Direct Supabase table integration with 'vaccinations'
// ============================================================

import { supabase } from '@/lib/supabase'
import type { Vaccination } from '@/types'
import { getAnimalById } from '@/services/animalService'

let inMemoryVaccinations: Vaccination[] = [
  {
    id: 'vac001-fmd',
    animal_id: 'a001-demo-gir-cow',
    owner_id: 'demo-farmer',
    vaccine_name: 'FMD (Foot and Mouth Disease) Vaccine',
    vaccination_date: '2026-04-10',
    next_due_date: '2026-10-18', // Due soon!
    administered_by: 'Dr. Priya Sharma (Veterinary Officer)',
    notes: 'National FMD Ring Vaccination Camp 2026',
    created_at: new Date(Date.now() - 180 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 180 * 86400000).toISOString(),
  },
  {
    id: 'vac002-hs',
    animal_id: 'a002-demo-murrah-buf',
    owner_id: 'demo-farmer',
    vaccine_name: 'Haemorrhagic Septicaemia (HS) Vaccine',
    vaccination_date: '2026-06-15',
    next_due_date: '2026-12-15',
    administered_by: 'Dr. Priya Sharma (Veterinary Officer)',
    notes: 'Pre-monsoon preventive dose administered at Sadar Clinic',
    created_at: new Date(Date.now() - 110 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 110 * 86400000).toISOString(),
  },
  {
    id: 'vac003-bq',
    animal_id: 'a003-demo-gir-heifer',
    owner_id: 'demo-farmer',
    vaccine_name: 'Black Quarter (BQ) Vaccine',
    vaccination_date: '2026-05-20',
    next_due_date: '2026-10-25', // Due soon!
    administered_by: 'Dr. Anand Verma (MVU Unit 4)',
    notes: 'Annual booster dose',
    created_at: new Date(Date.now() - 140 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 140 * 86400000).toISOString(),
  },
]

/**
 * Fetch all vaccination records for a farmer
 */
export async function getVaccinations(ownerId: string): Promise<Vaccination[]> {
  try {
    const { data, error } = await supabase
      .from('vaccinations')
      .select('*, animal:animals(*)')
      .eq('owner_id', ownerId)
      .order('next_due_date', { ascending: true })

    if (error) throw error
    if (data && data.length > 0) {
      import('@/services/offline/db').then(({ cacheVaccinationsLocally }) => {
        cacheVaccinationsLocally(data as Vaccination[]).catch(() => {})
      })
      return data as Vaccination[]
    }
  } catch (err) {
    console.warn('[VaccinationService] Supabase query notice:', err)
  }

  // Try IndexedDB offline storage
  try {
    const { getCachedVaccinations } = await import('@/services/offline/db')
    const offlineCached = await getCachedVaccinations(ownerId)
    if (offlineCached && offlineCached.length > 0) {
      return offlineCached
    }
  } catch {
    // ignore
  }

  const results = inMemoryVaccinations.filter((v) => v.owner_id === ownerId || ownerId.startsWith('demo-'))
  for (const vac of results) {
    if (!vac.animal) {
      vac.animal = (await getAnimalById(vac.animal_id)) || undefined
    }
  }
  return results
}

/**
 * Fetch vaccination records for a specific animal
 */
export async function getVaccinationsByAnimalId(animalId: string): Promise<Vaccination[]> {
  try {
    const { data, error } = await supabase
      .from('vaccinations')
      .select('*')
      .eq('animal_id', animalId)
      .order('vaccination_date', { ascending: false })

    if (error) throw error
    if (data) return data as Vaccination[]
  } catch (err) {
    console.warn('[VaccinationService] Supabase animal query notice:', err)
  }

  return inMemoryVaccinations.filter((v) => v.animal_id === animalId)
}

/**
 * Add a manual vaccination record by farmer (clearly tagged as farmer-recorded)
 */
export async function addFarmerVaccinationRecord(data: {
  animal_id: string
  owner_id: string
  vaccine_name: string
  vaccination_date: string
  next_due_date?: string
  administered_by?: string
  notes?: string
}): Promise<Vaccination> {
  // Validation checks: Prevent future vaccination dates and invalid due dates
  const today = new Date().toISOString().split('T')[0]
  if (data.vaccination_date > today) {
    throw new Error('Vaccination date cannot be in the future.')
  }
  if (data.next_due_date && data.next_due_date < data.vaccination_date) {
    throw new Error('Next due date cannot be earlier than vaccination administration date.')
  }

  // Prevent duplicate vaccination records (same animal, same vaccine, same date)
  const existing = inMemoryVaccinations.find(
    (v) =>
      v.animal_id === data.animal_id &&
      v.vaccine_name.toLowerCase() === data.vaccine_name.toLowerCase() &&
      v.vaccination_date === data.vaccination_date
  )
  if (existing) {
    return existing
  }

  const newRecord: Omit<Vaccination, 'id'> = {
    animal_id: data.animal_id,
    owner_id: data.owner_id,
    vaccine_name: data.vaccine_name,
    vaccination_date: data.vaccination_date,
    next_due_date: data.next_due_date,
    administered_by: data.administered_by || 'Farmer Recorded (Pending Verification)',
    notes: data.notes || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  try {
    const { data: inserted, error } = await supabase
      .from('vaccinations')
      .insert([newRecord])
      .select('*, animal:animals(*)')
      .single()

    if (error) throw error
    if (inserted) {
      inMemoryVaccinations.unshift(inserted as Vaccination)
      return inserted as Vaccination
    }
  } catch (err) {
    console.warn('[VaccinationService] Supabase insert notice:', err)
  }

  const animal = await getAnimalById(data.animal_id)
  const fallbackRecord: Vaccination = {
    ...newRecord,
    id: `vac-${Date.now()}`,
    animal: animal || undefined,
  }
  inMemoryVaccinations.unshift(fallbackRecord)
  return fallbackRecord
}

/**
 * Fetch all vaccination records across all herds (for authorized Vet / Admin reports)
 */
export async function getAllVaccinations(): Promise<Vaccination[]> {
  try {
    const { data, error } = await supabase
      .from('vaccinations')
      .select('*, animal:animals(*)')
      .order('vaccination_date', { ascending: false })

    if (error) throw error
    if (data && data.length > 0) return data as Vaccination[]
  } catch (err) {
    console.warn('[VaccinationService] Supabase getAllVaccinations notice:', err)
  }

  const results = [...inMemoryVaccinations]
  for (const vac of results) {
    if (!vac.animal) {
      vac.animal = (await getAnimalById(vac.animal_id)) || undefined
    }
  }
  return results
}

