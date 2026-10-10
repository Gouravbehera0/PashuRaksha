// ============================================================
// PASHURAKSHA (पशुरक्षा) — VETERINARY FOLLOW-UP SERVICE
// Stage 5: Follow-Up Management, Timelines & Status Transitions
// ============================================================

import { supabase } from '@/lib/supabase'
import type { CaseFollowUp, FollowUpStatus } from '@/types'

// In-memory fallback dataset for offline/session state
let inMemoryFollowUps: CaseFollowUp[] = [
  {
    id: 'fu-001',
    case_id: 'case-001',
    assigned_veterinarian_id: 'demo-vet',
    assigned_veterinarian_name: 'Dr. Priya Sharma',
    follow_up_date: new Date().toISOString().split('T')[0], // Due Today
    notes: 'Re-evaluate pyrexia and auscultation following 48-hour antipyretic course.',
    status: 'Due Today',
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fu-002',
    case_id: 'case-002',
    assigned_veterinarian_id: 'demo-vet',
    assigned_veterinarian_name: 'Dr. Priya Sharma',
    follow_up_date: new Date(Date.now() - 24 * 3600000).toISOString().split('T')[0], // Overdue
    notes: 'Verify swelling remission and check peripheral lymph nodes.',
    status: 'Overdue',
    created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fu-003',
    case_id: 'case-003',
    assigned_veterinarian_id: 'demo-vet',
    assigned_veterinarian_name: 'Dr. Priya Sharma',
    follow_up_date: new Date(Date.now() + 48 * 3600000).toISOString().split('T')[0], // Upcoming (Pending)
    notes: 'Post-deworming appetite review and weight progression check.',
    status: 'Pending',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fu-004',
    case_id: 'case-004',
    assigned_veterinarian_id: 'demo-vet',
    assigned_veterinarian_name: 'Dr. Priya Sharma',
    follow_up_date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    notes: 'Recovery verified. Normal feeding resumed.',
    status: 'Completed',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
]

/**
 * Normalizes follow-up status based on current date
 */
function normalizeStatus(followUpDate: string, currentStatus: FollowUpStatus): FollowUpStatus {
  if (currentStatus === 'Completed') return 'Completed'
  const today = new Date().toISOString().split('T')[0]
  if (followUpDate === today) return 'Due Today'
  if (followUpDate < today) return 'Overdue'
  return 'Pending'
}

/**
 * Fetch case follow-ups with optional filters
 */
export async function getCaseFollowUps(filters?: {
  case_id?: string
  assigned_vet_id?: string
  status?: FollowUpStatus
}): Promise<CaseFollowUp[]> {
  try {
    let query = supabase
      .from('case_follow_ups')
      .select('*, case:veterinary_cases(*)')
      .order('follow_up_date', { ascending: true })

    if (filters?.case_id) query = query.eq('case_id', filters.case_id)
    if (filters?.assigned_vet_id) query = query.eq('assigned_veterinarian_id', filters.assigned_vet_id)
    if (filters?.status) query = query.eq('status', filters.status)

    const { data, error } = await query
    if (error) throw error
    if (data && data.length > 0) {
      return data.map((item) => ({
        ...item,
        status: normalizeStatus(item.follow_up_date, item.status),
      })) as CaseFollowUp[]
    }
  } catch (err) {
    console.warn('[FollowUpService] Supabase query notice:', err)
  }

  // Fallback to in-memory store
  let list = inMemoryFollowUps.map((item) => ({
    ...item,
    status: normalizeStatus(item.follow_up_date, item.status),
  }))

  if (filters?.case_id) {
    list = list.filter((f) => f.case_id === filters.case_id)
  }
  if (filters?.assigned_vet_id) {
    list = list.filter((f) => f.assigned_veterinarian_id === filters.assigned_vet_id)
  }
  if (filters?.status) {
    list = list.filter((f) => f.status === filters.status)
  }

  return list
}

/**
 * Create a new veterinary follow-up
 */
export async function createCaseFollowUp(data: {
  case_id: string
  assigned_veterinarian_id?: string
  assigned_veterinarian_name?: string
  follow_up_date: string
  notes: string
}): Promise<CaseFollowUp> {
  const calculatedStatus = normalizeStatus(data.follow_up_date, 'Pending')
  const newFollowUp: CaseFollowUp = {
    id: `fu-${Date.now()}`,
    case_id: data.case_id,
    assigned_veterinarian_id: data.assigned_veterinarian_id || 'demo-vet',
    assigned_veterinarian_name: data.assigned_veterinarian_name || 'Dr. Priya Sharma',
    follow_up_date: data.follow_up_date,
    notes: data.notes,
    status: calculatedStatus,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  try {
    const { data: dbData, error } = await supabase
      .from('case_follow_ups')
      .insert({
        case_id: newFollowUp.case_id,
        assigned_veterinarian_id: newFollowUp.assigned_veterinarian_id,
        assigned_veterinarian_name: newFollowUp.assigned_veterinarian_name,
        follow_up_date: newFollowUp.follow_up_date,
        notes: newFollowUp.notes,
        status: newFollowUp.status,
      })
      .select()
      .single()

    if (error) throw error
    if (dbData) return dbData as CaseFollowUp
  } catch (err) {
    console.warn('[FollowUpService] Supabase insert notice:', err)
  }

  inMemoryFollowUps.unshift(newFollowUp)
  return newFollowUp
}

/**
 * Update follow-up status (e.g. mark Completed or update notes)
 */
export async function updateFollowUpStatus(
  id: string,
  status: FollowUpStatus,
  notes?: string
): Promise<CaseFollowUp | null> {
  try {
    const updatePayload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    }
    if (notes) updatePayload.notes = notes

    const { data, error } = await supabase
      .from('case_follow_ups')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (data) return data as CaseFollowUp
  } catch (err) {
    console.warn('[FollowUpService] Supabase update notice:', err)
  }

  const idx = inMemoryFollowUps.findIndex((f) => f.id === id)
  if (idx !== -1) {
    inMemoryFollowUps[idx] = {
      ...inMemoryFollowUps[idx],
      status,
      notes: notes || inMemoryFollowUps[idx].notes,
      updated_at: new Date().toISOString(),
    }
    return inMemoryFollowUps[idx]
  }

  return null
}

/**
 * KPI summary of veterinary follow-ups
 */
export async function getFollowUpKPIs(): Promise<{
  due_today: number
  overdue: number
  upcoming: number
  completed: number
  total: number
}> {
  const followUps = await getCaseFollowUps()
  return {
    due_today: followUps.filter((f) => f.status === 'Due Today').length,
    overdue: followUps.filter((f) => f.status === 'Overdue').length,
    upcoming: followUps.filter((f) => f.status === 'Pending').length,
    completed: followUps.filter((f) => f.status === 'Completed').length,
    total: followUps.length,
  }
}
