// ============================================================
// PASHURAKSHA (पशुरक्षा) — OFFLINE STORAGE CORE (INDEXEDDB)
// Stage 6: Rural Accessibility & User-Scoped Offline Storage
// ============================================================

import type { Animal, Vaccination, SymptomSeverity } from '@/types'

const DB_NAME = 'PashuRaksha_OfflineDB_v1'
const DB_VERSION = 1

export type SyncStatus = 'PENDING_SYNC' | 'SYNCED' | 'FAILED'

export interface PendingHealthReport {
  local_id: string
  idempotency_key: string
  server_id?: string
  animal_id: string
  owner_id: string
  symptoms: string[]
  severity: SymptomSeverity
  description?: string
  photo_url?: string
  latitude?: number
  longitude?: number
  location_type: 'GPS LOCATION' | 'MANUALLY ENTERED LOCATION' | 'LOCATION UNAVAILABLE'
  sync_status: SyncStatus
  retry_count: number
  last_sync_attempt?: string
  last_error?: string
  created_at: string
}

export interface PendingMortalityReport {
  local_id: string
  idempotency_key: string
  server_id?: string
  animal_id: string
  owner_id: string
  cause_description: string
  photo_url?: string
  latitude?: number
  longitude?: number
  location_type: 'GPS LOCATION' | 'MANUALLY ENTERED LOCATION' | 'LOCATION UNAVAILABLE'
  sync_status: SyncStatus
  retry_count: number
  last_sync_attempt?: string
  last_error?: string
  created_at: string
}

export interface VetDraftNote {
  local_id: string
  case_id: string
  vet_id: string
  veterinarian_name: string
  note_type: string
  content: string
  is_draft?: boolean
  sync_status: 'DRAFT_LOCAL' | 'SYNCED'
  created_at: string
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result

      // 1. Pending Health Reports
      if (!db.objectStoreNames.contains('pending_health_reports')) {
        const store = db.createObjectStore('pending_health_reports', { keyPath: 'local_id' })
        store.createIndex('owner_id', 'owner_id', { unique: false })
        store.createIndex('sync_status', 'sync_status', { unique: false })
        store.createIndex('idempotency_key', 'idempotency_key', { unique: true })
        store.createIndex('created_at', 'created_at', { unique: false })
      }

      // 2. Pending Mortality Reports
      if (!db.objectStoreNames.contains('pending_mortality_reports')) {
        const store = db.createObjectStore('pending_mortality_reports', { keyPath: 'local_id' })
        store.createIndex('owner_id', 'owner_id', { unique: false })
        store.createIndex('sync_status', 'sync_status', { unique: false })
        store.createIndex('idempotency_key', 'idempotency_key', { unique: true })
        store.createIndex('created_at', 'created_at', { unique: false })
      }

      // 3. Cached Animals
      if (!db.objectStoreNames.contains('cached_animals')) {
        const store = db.createObjectStore('cached_animals', { keyPath: 'id' })
        store.createIndex('owner_id', 'owner_id', { unique: false })
      }

      // 4. Cached Vaccinations
      if (!db.objectStoreNames.contains('cached_vaccinations')) {
        const store = db.createObjectStore('cached_vaccinations', { keyPath: 'id' })
        store.createIndex('owner_id', 'owner_id', { unique: false })
      }

      // 5. Cached Cases
      if (!db.objectStoreNames.contains('cached_cases')) {
        db.createObjectStore('cached_cases', { keyPath: 'id' })
      }

      // 6. Vet Draft Notes
      if (!db.objectStoreNames.contains('vet_draft_notes')) {
        const store = db.createObjectStore('vet_draft_notes', { keyPath: 'local_id' })
        store.createIndex('case_id', 'case_id', { unique: false })
        store.createIndex('vet_id', 'vet_id', { unique: false })
      }

      // 7. Sync Meta
      if (!db.objectStoreNames.contains('sync_meta')) {
        db.createObjectStore('sync_meta', { keyPath: 'key' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// === PENDING HEALTH REPORTS ===

export async function savePendingHealthReport(report: PendingHealthReport): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_health_reports', 'readwrite')
    tx.objectStore('pending_health_reports').put(report)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getPendingHealthReports(ownerId?: string): Promise<PendingHealthReport[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_health_reports', 'readonly')
    const store = tx.objectStore('pending_health_reports')
    const req = store.getAll()
    req.onsuccess = () => {
      let results: PendingHealthReport[] = req.result || []
      if (ownerId) {
        results = results.filter((r) => r.owner_id === ownerId || ownerId.startsWith('demo-'))
      }
      resolve(results)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function updatePendingHealthReport(
  local_id: string,
  updates: Partial<PendingHealthReport>
): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_health_reports', 'readwrite')
    const store = tx.objectStore('pending_health_reports')
    const getReq = store.get(local_id)
    getReq.onsuccess = () => {
      if (getReq.result) {
        store.put({ ...getReq.result, ...updates })
      }
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function deletePendingHealthReport(local_id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_health_reports', 'readwrite')
    tx.objectStore('pending_health_reports').delete(local_id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// === PENDING MORTALITY REPORTS ===

export async function savePendingMortalityReport(report: PendingMortalityReport): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_mortality_reports', 'readwrite')
    tx.objectStore('pending_mortality_reports').put(report)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getPendingMortalityReports(ownerId?: string): Promise<PendingMortalityReport[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_mortality_reports', 'readonly')
    const store = tx.objectStore('pending_mortality_reports')
    const req = store.getAll()
    req.onsuccess = () => {
      let results: PendingMortalityReport[] = req.result || []
      if (ownerId) {
        results = results.filter((r) => r.owner_id === ownerId || ownerId.startsWith('demo-'))
      }
      resolve(results)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function updatePendingMortalityReport(
  local_id: string,
  updates: Partial<PendingMortalityReport>
): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_mortality_reports', 'readwrite')
    const store = tx.objectStore('pending_mortality_reports')
    const getReq = store.get(local_id)
    getReq.onsuccess = () => {
      if (getReq.result) {
        store.put({ ...getReq.result, ...updates })
      }
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// === CACHED ANIMALS ===

export async function cacheAnimalsLocally(animals: Animal[]): Promise<void> {
  if (!animals || animals.length === 0) return
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cached_animals', 'readwrite')
    const store = tx.objectStore('cached_animals')
    animals.forEach((a) => store.put(a))
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getCachedAnimals(ownerId?: string): Promise<Animal[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cached_animals', 'readonly')
    const req = tx.objectStore('cached_animals').getAll()
    req.onsuccess = () => {
      let results: Animal[] = req.result || []
      if (ownerId) {
        results = results.filter((a) => a.owner_id === ownerId || ownerId.startsWith('demo-'))
      }
      resolve(results)
    }
    req.onerror = () => reject(req.error)
  })
}

// === CACHED VACCINATIONS ===

export async function cacheVaccinationsLocally(vaccinations: Vaccination[]): Promise<void> {
  if (!vaccinations || vaccinations.length === 0) return
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cached_vaccinations', 'readwrite')
    const store = tx.objectStore('cached_vaccinations')
    vaccinations.forEach((v) => store.put(v))
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getCachedVaccinations(ownerId?: string): Promise<Vaccination[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cached_vaccinations', 'readonly')
    const req = tx.objectStore('cached_vaccinations').getAll()
    req.onsuccess = () => {
      let results: Vaccination[] = req.result || []
      if (ownerId) {
        results = results.filter((v) => v.owner_id === ownerId || ownerId.startsWith('demo-'))
      }
      resolve(results)
    }
    req.onerror = () => reject(req.error)
  })
}

// === FIELD VET DRAFT NOTES ===

export async function saveVetDraftNote(draft: VetDraftNote): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('vet_draft_notes', 'readwrite')
    tx.objectStore('vet_draft_notes').put(draft)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getVetDraftNotes(caseId: string): Promise<VetDraftNote[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('vet_draft_notes', 'readonly')
    const req = tx.objectStore('vet_draft_notes').getAll()
    req.onsuccess = () => {
      const results: VetDraftNote[] = req.result || []
      resolve(results.filter((d) => d.case_id === caseId))
    }
    req.onerror = () => reject(req.error)
  })
}

export async function deleteVetDraftNote(local_id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('vet_draft_notes', 'readwrite')
    tx.objectStore('vet_draft_notes').delete(local_id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// === SYNC METADATA & USER ISOLATION ===

export async function setSyncMeta(key: string, value: any): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_meta', 'readwrite')
    tx.objectStore('sync_meta').put({ key, value, updated_at: new Date().toISOString() })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getSyncMeta<T = any>(key: string): Promise<T | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_meta', 'readonly')
    const req = tx.objectStore('sync_meta').get(key)
    req.onsuccess = () => resolve(req.result ? req.result.value : null)
    req.onerror = () => reject(req.error)
  })
}

/**
 * Clean up user offline data on logout to prevent cross-account exposure on shared devices
 */
export async function cleanupUserOfflineData(ownerId: string): Promise<void> {
  if (!ownerId) return
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(
        ['pending_health_reports', 'pending_mortality_reports', 'cached_animals', 'vet_draft_notes'],
        'readwrite'
      )

      // Clean pending health reports
      const healthStore = tx.objectStore('pending_health_reports')
      const healthReq = healthStore.getAll()
      healthReq.onsuccess = () => {
        (healthReq.result || []).forEach((r: PendingHealthReport) => {
          if (r.owner_id === ownerId || ownerId.startsWith('demo-')) healthStore.delete(r.local_id)
        })
      }

      // Clean pending mortality reports
      const mortStore = tx.objectStore('pending_mortality_reports')
      const mortReq = mortStore.getAll()
      mortReq.onsuccess = () => {
        (mortReq.result || []).forEach((r: PendingMortalityReport) => {
          if (r.owner_id === ownerId || ownerId.startsWith('demo-')) mortStore.delete(r.local_id)
        })
      }

      // Clean cached animals
      const animalStore = tx.objectStore('cached_animals')
      const animalReq = animalStore.getAll()
      animalReq.onsuccess = () => {
        (animalReq.result || []).forEach((a: Animal) => {
          if (a.owner_id === ownerId || ownerId.startsWith('demo-')) animalStore.delete(a.id)
        })
      }

      // Clean vet notes
      const notesStore = tx.objectStore('vet_draft_notes')
      const notesReq = notesStore.getAll()
      notesReq.onsuccess = () => {
        (notesReq.result || []).forEach((n: any) => {
          if (n.author_id === ownerId || ownerId.startsWith('demo-')) notesStore.delete(n.local_id)
        })
      }

      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve() // Fail safely without blocking logout
    })
  } catch (err) {
    console.warn('[OfflineDB] Cleanup error:', err)
  }
}

