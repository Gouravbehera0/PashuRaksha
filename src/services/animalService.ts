// ============================================================
// PASHURAKSHA (पशुरक्षा) — ANIMAL / LIVESTOCK SERVICE
// Direct Supabase table integration with 'animals'
// ============================================================

import { supabase } from '@/lib/supabase'
import type { Animal, AnimalType, AnimalGender, AnimalHealthStatus } from '@/types'

// In-memory fallback cache for development/demo sessions when Supabase is not configured
let inMemoryAnimals: Animal[] = [
  {
    id: 'a001-demo-gir-cow',
    owner_id: 'demo-farmer',
    animal_tag: 'PR-COW-001',
    animal_type: 'Cow',
    breed: 'Gir',
    gender: 'Female',
    date_of_birth: '2022-04-15',
    age: 4,
    color: 'Red & White speckled',
    weight: 385,
    location: 'Rampur Khurd, Varanasi',
    village: 'Rampur Khurd',
    district: 'Varanasi',
    health_status: 'Healthy',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'a002-demo-murrah-buf',
    owner_id: 'demo-farmer',
    animal_tag: 'PR-BUF-002',
    animal_type: 'Buffalo',
    breed: 'Murrah',
    gender: 'Female',
    date_of_birth: '2021-09-10',
    age: 5,
    color: 'Jet Black',
    weight: 520,
    location: 'Rampur Khurd, Varanasi',
    village: 'Rampur Khurd',
    district: 'Varanasi',
    health_status: 'Under Observation',
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'a003-demo-gir-heifer',
    owner_id: 'demo-farmer',
    animal_tag: 'PR-COW-003',
    animal_type: 'Cow',
    breed: 'Sahiwal',
    gender: 'Female',
    date_of_birth: '2023-01-20',
    age: 3,
    color: 'Brownish Red',
    weight: 310,
    location: 'Rampur Khurd, Varanasi',
    village: 'Rampur Khurd',
    district: 'Varanasi',
    health_status: 'High Risk',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'a004-demo-barbari-goat',
    owner_id: 'demo-farmer',
    animal_tag: 'PR-GOT-004',
    animal_type: 'Goat',
    breed: 'Barbari',
    gender: 'Female',
    date_of_birth: '2023-05-10',
    age: 2,
    color: 'White & Brown patched',
    weight: 32,
    location: 'Chiraigaon, Varanasi',
    village: 'Chiraigaon',
    district: 'Varanasi',
    health_status: 'Under Observation',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'a005-demo-poultry',
    owner_id: 'demo-farmer',
    animal_tag: 'PR-PLT-005',
    animal_type: 'Poultry',
    breed: 'Kadaknath',
    gender: 'Female',
    date_of_birth: '2024-02-01',
    age: 1,
    color: 'Black',
    weight: 1.8,
    location: 'Cholapur, Varanasi',
    village: 'Cholapur',
    district: 'Varanasi',
    health_status: 'Healthy',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'a006-demo-nali-sheep',
    owner_id: 'demo-farmer',
    animal_tag: 'PR-SHP-006',
    animal_type: 'Sheep',
    breed: 'Nali',
    gender: 'Male',
    date_of_birth: '2023-08-14',
    age: 2,
    color: 'Creamy White',
    weight: 42,
    location: 'Bhadohi Rural, Bhadohi',
    village: 'Bhadohi Rural',
    district: 'Bhadohi',
    health_status: 'Healthy',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
]

/**
 * Generate human-readable animal tag (e.g. PR-COW-001, PR-BUF-002)
 */
export function generateAnimalTag(animalType: AnimalType, currentCount: number): string {
  const prefixMap: Record<AnimalType, string> = {
    Cow: 'PR-COW',
    Buffalo: 'PR-BUF',
    Goat: 'PR-GOT',
    Sheep: 'PR-SHP',
    Poultry: 'PR-PLT',
    Other: 'PR-ANM',
  }
  const prefix = prefixMap[animalType] || 'PR-ANM'
  const num = String(currentCount + 1).padStart(3, '0')
  return `${prefix}-${num}`
}

/**
 * Fetch all animals belonging to the authenticated farmer
 */
export async function getAnimals(ownerId: string): Promise<Animal[]> {
  try {
    const { data, error } = await supabase
      .from('animals')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    if (data && data.length > 0) {
      // Background cache for offline use
      import('@/services/offline/db').then(({ cacheAnimalsLocally }) => {
        cacheAnimalsLocally(data as Animal[]).catch(() => {})
      })
      return data as Animal[]
    }
  } catch (err) {
    console.warn('[AnimalService] Supabase query notice:', err)
  }

  // Try IndexedDB offline storage
  try {
    const { getCachedAnimals } = await import('@/services/offline/db')
    const offlineCached = await getCachedAnimals(ownerId)
    if (offlineCached && offlineCached.length > 0) {
      return offlineCached
    }
  } catch {
    // ignore
  }

  // Fallback to active session cache for farmer
  return inMemoryAnimals.filter((a) => a.owner_id === ownerId || ownerId.startsWith('demo-'))
}

/**
 * Fetch all registered animals across the district (Veterinarian & Administrator access)
 */
export async function getAllAnimals(): Promise<Animal[]> {
  try {
    const { data, error } = await supabase
      .from('animals')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    if (data && data.length > 0) return data as Animal[]
  } catch (err) {
    console.warn('[AnimalService] Supabase all animals query notice:', err)
  }

  return inMemoryAnimals
}

/**
 * Fetch a single animal by its unique ID
 */
export async function getAnimalById(animalId: string): Promise<Animal | null> {
  try {
    const { data, error } = await supabase
      .from('animals')
      .select('*')
      .eq('id', animalId)
      .single()

    if (error) throw error
    if (data) return data as Animal
  } catch (err) {
    console.warn('[AnimalService] Supabase single query notice:', err)
  }

  const found = inMemoryAnimals.find((a) => a.id === animalId)
  return found ?? null
}

/**
 * Register a new animal in Supabase
 */
export async function addAnimal(
  animalData: {
    owner_id: string
    animal_type: AnimalType
    breed?: string
    gender: AnimalGender
    date_of_birth?: string
    age?: number
    color?: string
    weight?: number
    location?: string
    village?: string
    district?: string
    photo_url?: string
    health_status?: AnimalHealthStatus
  }
): Promise<Animal> {
  // Validation checks: Prevent negative weight and future birth dates
  const today = new Date().toISOString().split('T')[0]
  if (animalData.date_of_birth && animalData.date_of_birth > today) {
    throw new Error('Date of birth cannot be in the future.')
  }
  if (animalData.weight !== undefined && animalData.weight < 0) {
    throw new Error('Livestock weight cannot be negative.')
  }

  const existingAnimals = await getAnimals(animalData.owner_id)
  const animal_tag = generateAnimalTag(animalData.animal_type, existingAnimals.length)

  const newRecord: Omit<Animal, 'id'> = {
    owner_id: animalData.owner_id,
    animal_tag,
    animal_type: animalData.animal_type,
    breed: animalData.breed || 'Indigenous Non-Descript',
    gender: animalData.gender,
    date_of_birth: animalData.date_of_birth,
    age: animalData.age || 2,
    color: animalData.color || 'Standard',
    weight: animalData.weight,
    location: animalData.location,
    village: animalData.village || 'Rampur Khurd',
    district: animalData.district || 'Varanasi',
    photo_url: animalData.photo_url,
    health_status: animalData.health_status || 'Healthy',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  try {
    const { data, error } = await supabase
      .from('animals')
      .insert([newRecord])
      .select()
      .single()

    if (error) throw error
    if (data) {
      inMemoryAnimals.unshift(data as Animal)
      return data as Animal
    }
  } catch (err) {
    console.warn('[AnimalService] Supabase insert notice:', err)
  }

  // Create local session object
  const fallbackRecord: Animal = {
    ...newRecord,
    id: `anim-${Date.now()}`,
  }
  inMemoryAnimals.unshift(fallbackRecord)
  return fallbackRecord
}

/**
 * Update animal health status in Supabase
 */
export async function updateAnimalHealthStatus(
  animalId: string,
  healthStatus: AnimalHealthStatus
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('animals')
      .update({ health_status: healthStatus, updated_at: new Date().toISOString() })
      .eq('id', animalId)

    if (error) throw error
  } catch (err) {
    console.warn('[AnimalService] Supabase update status notice:', err)
  }

  const target = inMemoryAnimals.find((a) => a.id === animalId)
  if (target) {
    target.health_status = healthStatus
    target.updated_at = new Date().toISOString()
  }
  return true
}
