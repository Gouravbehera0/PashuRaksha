// ============================================================
// PASHURAKSHA (पशुरक्षा) — ALERT SERVICE
// Direct Supabase table integration with 'alerts'
// Categories: Health, Vaccination, Veterinary, Outbreak, System
// ============================================================

import { supabase } from '@/lib/supabase'
import type { Alert } from '@/types'

let inMemoryAlerts: Alert[] = [
  {
    id: 'alt001-vac-due',
    user_id: 'demo-farmer',
    title: 'FMD Vaccination Due Soon',
    message: 'Foot & Mouth Disease (FMD) booster vaccination is due for Cow #PR-COW-001 on 18 Oct 2026. Contact your local veterinary hospital.',
    alert_type: 'Vaccination',
    severity: 'warning',
    is_read: false,
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'alt002-vet-review',
    user_id: 'demo-farmer',
    title: 'Veterinary Officer Assigned to Case',
    message: 'Dr. Priya Sharma has reviewed your symptom submission for Cow #PR-COW-003 and initiated an observation file.',
    alert_type: 'Veterinary',
    severity: 'info',
    is_read: false,
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: 'alt003-outbreak-advisory',
    user_id: 'demo-farmer',
    title: 'District Biosecurity Cordon Advisory',
    message: 'Elevated bovine respiratory cases reported within 45km radius. Maintain strict quarantine and avoid shared grazing commons.',
    alert_type: 'Outbreak',
    severity: 'danger',
    is_read: false,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: 'alt004-system-notice',
    user_id: 'demo-farmer',
    title: 'Bharat Pashudhan (INAPH) Data Sync Completed',
    message: 'Your livestock health passport records have been synchronized with the national registry.',
    alert_type: 'System',
    severity: 'info',
    is_read: true,
    created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
  },
]

/**
 * Fetch all alerts targeted for the authenticated user
 */
export async function getAlerts(userId: string): Promise<Alert[]> {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    if (data && data.length > 0) return data as Alert[]
  } catch (err) {
    console.warn('[AlertService] Supabase query notice:', err)
  }

  return inMemoryAlerts.filter((a) => a.user_id === userId || userId.startsWith('demo-'))
}

/**
 * Mark a specific alert as read in Supabase
 */
export async function markAlertAsRead(alertId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('id', alertId)

    if (error) throw error
  } catch (err) {
    console.warn('[AlertService] Supabase update notice:', err)
  }

  const alert = inMemoryAlerts.find((a) => a.id === alertId)
  if (alert) {
    alert.is_read = true
  }
  return true
}

/**
 * Dispatch a new alert for an authenticated user
 */
export async function createAlert(data: {
  user_id: string
  title: string
  message: string
  alert_type: Alert['alert_type']
  severity: Alert['severity']
  animal_id?: string
}): Promise<Alert> {
  const newAlert: Alert = {
    id: `alt-${Date.now()}`,
    user_id: data.user_id,
    title: data.title,
    message: data.message,
    alert_type: data.alert_type,
    severity: data.severity,
    animal_id: data.animal_id,
    is_read: false,
    created_at: new Date().toISOString(),
  }

  try {
    const { data: inserted, error } = await supabase
      .from('alerts')
      .insert([newAlert])
      .select()
      .single()
    if (!error && inserted) {
      inMemoryAlerts.unshift(inserted as Alert)
      return inserted as Alert
    }
  } catch (err) {
    // Fallback
  }

  inMemoryAlerts.unshift(newAlert)
  return newAlert
}
