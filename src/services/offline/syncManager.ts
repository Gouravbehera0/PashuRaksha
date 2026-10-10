// ============================================================
// PASHURAKSHA (पशुरक्षा) — SYNCHRONIZATION MANAGER
// Stage 6: Safe, Idempotent Background & On-Demand Synchronization
// ============================================================

import { useState, useEffect } from 'react'
import {
  getPendingHealthReports,
  updatePendingHealthReport,
  getPendingMortalityReports,
  updatePendingMortalityReport,
  getSyncMeta,
  setSyncMeta
} from './db'
import { createSymptomReport } from '@/services/symptomReportService'
import { createMortalityReport } from '@/services/mortalityReportService'

export type NetworkConnectionState = 'ONLINE' | 'OFFLINE'
export type SyncLifecycleState = 'IDLE' | 'SYNCING' | 'SYNC_COMPLETE' | 'SYNC_FAILED'

export interface SyncEngineState {
  isOnline: boolean
  connectionState: NetworkConnectionState
  lifecycleState: SyncLifecycleState
  pendingCount: number
  lastSyncTime: string | null
  lastError: string | null
}

let syncListeners: Array<(state: SyncEngineState) => void> = []

let currentState: SyncEngineState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  connectionState: typeof navigator !== 'undefined' && navigator.onLine ? 'ONLINE' : 'OFFLINE',
  lifecycleState: 'IDLE',
  pendingCount: 0,
  lastSyncTime: null,
  lastError: null,
}

function notifyListeners() {
  syncListeners.forEach((listener) => listener({ ...currentState }))
}

/**
 * Initializes network status listeners and loads metadata
 */
export async function initializeSyncManager() {
  if (typeof window === 'undefined') return

  // Load last sync time from metadata
  const savedLastSync = await getSyncMeta<string>('last_successful_sync')
  if (savedLastSync) {
    currentState.lastSyncTime = savedLastSync
  }

  // Calculate pending count
  await refreshPendingCount()

  window.addEventListener('online', () => {
    currentState.isOnline = true
    currentState.connectionState = 'ONLINE'
    notifyListeners()
    // Auto-trigger sync when connectivity returns
    triggerSyncNow()
  })

  window.addEventListener('offline', () => {
    currentState.isOnline = false
    currentState.connectionState = 'OFFLINE'
    currentState.lifecycleState = 'IDLE'
    notifyListeners()
  })
}

/**
 * Recounts total pending items across all offline queues
 */
export async function refreshPendingCount(userId?: string): Promise<number> {
  try {
    const [health, mortality] = await Promise.all([
      getPendingHealthReports(userId),
      getPendingMortalityReports(userId),
    ])

    const pendingHealth = health.filter((h) => h.sync_status !== 'SYNCED').length
    const pendingMortality = mortality.filter((m) => m.sync_status !== 'SYNCED').length
    const total = pendingHealth + pendingMortality

    currentState.pendingCount = total
    notifyListeners()
    return total
  } catch {
    return 0
  }
}

/**
 * Idempotent sync loop for offline reports
 */
export async function triggerSyncNow(userId?: string): Promise<{
  syncedHealth: number
  syncedMortality: number
  errors: number
}> {
  if (!navigator.onLine) {
    currentState.connectionState = 'OFFLINE'
    currentState.lifecycleState = 'IDLE'
    notifyListeners()
    return { syncedHealth: 0, syncedMortality: 0, errors: 0 }
  }

  currentState.lifecycleState = 'SYNCING'
  currentState.lastError = null
  notifyListeners()

  let syncedHealth = 0
  let syncedMortality = 0
  let errorCount = 0

  try {
    // 1. Synchronize Pending Health Reports
    const healthReports = await getPendingHealthReports(userId)
    const toSyncHealth = healthReports.filter((r) => r.sync_status !== 'SYNCED')

    for (const report of toSyncHealth) {
      try {
        await updatePendingHealthReport(report.local_id, {
          last_sync_attempt: new Date().toISOString(),
          retry_count: report.retry_count + 1,
        })

        // Call backend service with idempotency key
        const serverReport = await createSymptomReport({
          animal_id: report.animal_id,
          owner_id: report.owner_id,
          symptoms: report.symptoms,
          severity: report.severity,
          description: report.description,
          photo_url: report.photo_url,
          latitude: report.latitude,
          longitude: report.longitude,
          idempotency_key: report.idempotency_key,
        })

        await updatePendingHealthReport(report.local_id, {
          sync_status: 'SYNCED',
          server_id: serverReport.id,
          last_error: undefined,
        })
        syncedHealth++
      } catch (err: any) {
        errorCount++
        console.warn('[SyncManager] Health report sync error:', err)
        await updatePendingHealthReport(report.local_id, {
          sync_status: 'FAILED',
          last_error: err?.message || 'Network sync error',
        })
      }
    }

    // 2. Synchronize Pending Mortality Reports
    const mortalityReports = await getPendingMortalityReports(userId)
    const toSyncMortality = mortalityReports.filter((r) => r.sync_status !== 'SYNCED')

    for (const rep of toSyncMortality) {
      try {
        await updatePendingMortalityReport(rep.local_id, {
          last_sync_attempt: new Date().toISOString(),
          retry_count: rep.retry_count + 1,
        })

        const serverMort = await createMortalityReport({
          animal_id: rep.animal_id,
          owner_id: rep.owner_id,
          cause_description: rep.cause_description,
          latitude: rep.latitude,
          longitude: rep.longitude,
          idempotency_key: rep.idempotency_key,
        })

        await updatePendingMortalityReport(rep.local_id, {
          sync_status: 'SYNCED',
          server_id: serverMort.id,
          last_error: undefined,
        })
        syncedMortality++
      } catch (err: any) {
        errorCount++
        console.warn('[SyncManager] Mortality sync error:', err)
        await updatePendingMortalityReport(rep.local_id, {
          sync_status: 'FAILED',
          last_error: err?.message || 'Network sync error',
        })
      }
    }

    // Finalize state
    await refreshPendingCount(userId)

    if (errorCount === 0) {
      const nowStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      currentState.lastSyncTime = nowStr
      currentState.lifecycleState = 'SYNC_COMPLETE'
      await setSyncMeta('last_successful_sync', nowStr)
    } else {
      currentState.lifecycleState = 'SYNC_FAILED'
      currentState.lastError = `${errorCount} item(s) failed to sync. Will retry.`
    }
  } catch (err: any) {
    currentState.lifecycleState = 'SYNC_FAILED'
    currentState.lastError = err?.message || 'Sync failed.'
  } finally {
    notifyListeners()
  }

  return { syncedHealth, syncedMortality, errors: errorCount }
}

/**
 * React hook to bind to live synchronization state
 */
export function useSyncState() {
  const [state, setState] = useState<SyncEngineState>({ ...currentState })

  useEffect(() => {
    const listener = (updated: SyncEngineState) => setState(updated)
    syncListeners.push(listener)
    refreshPendingCount()

    return () => {
      syncListeners = syncListeners.filter((l) => l !== listener)
    }
  }, [])

  return {
    ...state,
    triggerSync: triggerSyncNow,
  }
}
