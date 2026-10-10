// ============================================================
// PASHURAKSHA (पशुरक्षा) — IOT DEVICE REGISTRY & ANIMAL ASSIGNMENTS
// Stage 11: Device Inventory, Reassignment Audit & State Engine
// Standard: NADRS-II National Livestock Tagging Framework
// "Detect Early. Prevent Outbreaks. Protect Livestock."
// ============================================================

import { supabase } from '@/lib/supabase'
import type {
  IoTDevice,
  AnimalDeviceAssignment,
  DeviceStatus,
  IoTDeviceType,
  DeviceEvent,
} from './iotTypes'

// ── In-Memory Deterministic Seed Data (With Clear DEMO Separation) ──
let inMemoryDevices: IoTDevice[] = [
  {
    id: 'dev-001-gir-tag',
    device_eui: 'PR-IOT-TAG-8821',
    name: 'Smart Ear Tag #8821 (Gir Cow)',
    device_type: 'SMART_EAR_TAG',
    manufacturer: 'Bharat BioSensors Ltd.',
    model: 'BBS-EarTag-Pro',
    firmware_version: 'v2.4.1',
    hardware_version: 'rev-C',
    battery_level: 88,
    status: 'ACTIVE',
    is_demo: true,
    owner_id: 'demo-farmer',
    owner_name: 'Ramkishan Patel',
    assigned_animal_id: 'a001-demo-gir-cow',
    assigned_animal_tag: 'PR-COW-001',
    assigned_animal_type: 'Cow',
    village: 'Rampur Khurd',
    district: 'Varanasi',
    installation_date: '2026-08-15T10:00:00Z',
    last_communication_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    last_measurement_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    calibration_notes: 'Temperature probe calibrated at 38.5°C via digital water bath standard.',
    created_at: '2026-08-15T10:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dev-002-murrah-bolus',
    device_eui: 'PR-IOT-BOLUS-4402',
    name: 'Rumen Bolus #4402 (Murrah Buffalo)',
    device_type: 'RUMEN_BOLUS',
    manufacturer: 'Vani RumenTech',
    model: 'VR-Bolus-100',
    firmware_version: 'v1.9.0',
    hardware_version: 'rev-B',
    battery_level: 72,
    status: 'ACTIVE',
    is_demo: true,
    owner_id: 'demo-farmer',
    owner_name: 'Ramkishan Patel',
    assigned_animal_id: 'a002-demo-murrah-buf',
    assigned_animal_tag: 'PR-BUF-002',
    assigned_animal_type: 'Buffalo',
    village: 'Rampur Khurd',
    district: 'Varanasi',
    installation_date: '2026-09-01T09:00:00Z',
    last_communication_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    last_measurement_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    calibration_notes: 'Rumen internal core temp sensor calibrated; baseline bolus gravimetric weight 800g.',
    created_at: '2026-09-01T09:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dev-003-sahiwal-tag',
    device_eui: 'PR-IOT-TAG-9914',
    name: 'Smart Ear Tag #9914 (Sahiwal Cow)',
    device_type: 'SMART_EAR_TAG',
    manufacturer: 'Bharat BioSensors Ltd.',
    model: 'BBS-EarTag-Pro',
    firmware_version: 'v2.4.1',
    hardware_version: 'rev-C',
    battery_level: 14,
    status: 'ACTIVE',
    is_demo: true,
    owner_id: 'demo-farmer',
    owner_name: 'Ramkishan Patel',
    assigned_animal_id: 'a003-demo-gir-heifer',
    assigned_animal_tag: 'PR-COW-003',
    assigned_animal_type: 'Cow',
    village: 'Rampur Khurd',
    district: 'Varanasi',
    installation_date: '2026-09-10T11:00:00Z',
    last_communication_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    last_measurement_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    calibration_notes: 'Battery warning state. Requires recharging or maintenance.',
    created_at: '2026-09-10T11:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dev-004-goat-collar',
    device_eui: 'PR-IOT-COL-1029',
    name: 'Smart Biometric Collar #1029 (Barbari Goat)',
    device_type: 'SMART_COLLAR',
    manufacturer: 'PashuCare Telemetry',
    model: 'PC-Collar-S2',
    firmware_version: 'v3.1.2',
    hardware_version: 'rev-A',
    battery_level: 45,
    status: 'OFFLINE',
    is_demo: true,
    owner_id: 'demo-farmer',
    owner_name: 'Ramkishan Patel',
    assigned_animal_id: 'a004-demo-barbari-goat',
    assigned_animal_tag: 'PR-GOT-004',
    assigned_animal_type: 'Goat',
    village: 'Chiraigaon',
    district: 'Varanasi',
    installation_date: '2026-09-20T14:30:00Z',
    last_communication_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), // 5h ago (>180m -> OFFLINE)
    last_measurement_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    calibration_notes: 'Off-grid hill pasture gateway unreachable; heartbeat timed out.',
    created_at: '2026-09-20T14:30:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dev-005-shed-env',
    device_eui: 'PR-IOT-ENV-0081',
    name: 'Shed Environmental Station (Rampur Dairy)',
    device_type: 'ENVIRONMENTAL_SENSOR',
    manufacturer: 'AgriClimate India',
    model: 'AC-ShedStation-4G',
    firmware_version: 'v1.4.0',
    hardware_version: 'rev-2',
    battery_level: 95,
    status: 'ACTIVE',
    is_demo: true,
    owner_id: 'demo-farmer',
    owner_name: 'Ramkishan Patel',
    village: 'Rampur Khurd',
    district: 'Varanasi',
    installation_date: '2026-08-01T08:00:00Z',
    last_communication_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    last_measurement_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    calibration_notes: 'Mounted at 2.5m elevation in central aisle. Dual dry-bulb and hygrometer sensors.',
    created_at: '2026-08-01T08:00:00Z',
    updated_at: new Date().toISOString(),
  },
]

let inMemoryAssignments: AnimalDeviceAssignment[] = [
  {
    id: 'asn-001',
    device_id: 'dev-001-gir-tag',
    animal_id: 'a001-demo-gir-cow',
    animal_tag: 'PR-COW-001',
    owner_id: 'demo-farmer',
    assigned_at: '2026-08-15T10:00:00Z',
    is_active: true,
    assigned_by: 'Dr. Priya Sharma (Veterinary Officer)',
    created_at: '2026-08-15T10:00:00Z',
  },
  {
    id: 'asn-002',
    device_id: 'dev-002-murrah-bolus',
    animal_id: 'a002-demo-murrah-buf',
    animal_tag: 'PR-BUF-002',
    owner_id: 'demo-farmer',
    assigned_at: '2026-09-01T09:00:00Z',
    is_active: true,
    assigned_by: 'Dr. Priya Sharma (Veterinary Officer)',
    created_at: '2026-09-01T09:00:00Z',
  },
  {
    id: 'asn-003',
    device_id: 'dev-003-sahiwal-tag',
    animal_id: 'a003-demo-gir-heifer',
    animal_tag: 'PR-COW-003',
    owner_id: 'demo-farmer',
    assigned_at: '2026-09-10T11:00:00Z',
    is_active: true,
    assigned_by: 'Dr. Priya Sharma (Veterinary Officer)',
    created_at: '2026-09-10T11:00:00Z',
  },
  {
    id: 'asn-004',
    device_id: 'dev-004-goat-collar',
    animal_id: 'a004-demo-barbari-goat',
    animal_tag: 'PR-GOT-004',
    owner_id: 'demo-farmer',
    assigned_at: '2026-09-20T14:30:00Z',
    is_active: true,
    assigned_by: 'Ramkishan Patel (Farmer Owner)',
    created_at: '2026-09-20T14:30:00Z',
  },
]

let inMemoryEvents: DeviceEvent[] = [
  {
    id: 'evt-001',
    device_id: 'dev-001-gir-tag',
    device_eui: 'PR-IOT-TAG-8821',
    event_type: 'REGISTERED',
    severity: 'INFO',
    details: 'Device registered to National Livestock Registry under owner Ramkishan Patel.',
    actor_id: 'demo-vet',
    created_at: '2026-08-15T09:30:00Z',
  },
  {
    id: 'evt-002',
    device_id: 'dev-001-gir-tag',
    device_eui: 'PR-IOT-TAG-8821',
    event_type: 'ASSIGNED',
    severity: 'INFO',
    details: 'Device assigned to Gir Cow #PR-COW-001.',
    actor_id: 'demo-vet',
    created_at: '2026-08-15T10:00:00Z',
  },
  {
    id: 'evt-003',
    device_id: 'dev-004-goat-collar',
    device_eui: 'PR-IOT-COL-1029',
    event_type: 'STATUS_CHANGE',
    severity: 'WARNING',
    details: 'Heartbeat signal lost for >180 minutes. Device transitioned to OFFLINE state.',
    actor_id: 'system',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'evt-004',
    device_id: 'dev-003-sahiwal-tag',
    device_eui: 'PR-IOT-TAG-9914',
    event_type: 'BATTERY_CRITICAL',
    severity: 'WARNING',
    details: 'Battery level reached 14% (<20% warning threshold).',
    actor_id: 'system',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
]

/**
 * Returns all registered devices permitted for the user's role and identity
 */
export async function getRegisteredDevices(options?: {
  ownerId?: string
  role?: string
  status?: string
  animalId?: string
}): Promise<IoTDevice[]> {
  try {
    let query = supabase.from('iot_devices').select('*').order('created_at', { ascending: false })

    if (options?.ownerId && options.role === 'farmer') {
      query = query.eq('owner_id', options.ownerId)
    }
    if (options?.status && options.status !== 'All') {
      query = query.eq('status', options.status)
    }
    if (options?.animalId && options.animalId !== 'All') {
      query = query.eq('assigned_animal_id', options.animalId)
    }

    const { data, error } = await query
    if (error) throw error
    if (data && data.length > 0) return data as IoTDevice[]
  } catch (err) {
    console.warn('[IoT Registry] Supabase query notice (using in-memory fallback):', err)
  }

  // Filter in-memory fallback
  let list = [...inMemoryDevices]
  if (options?.ownerId && options.role === 'farmer') {
    list = list.filter((d) => d.owner_id === options.ownerId || d.owner_id === 'demo-farmer')
  }
  if (options?.status && options.status !== 'All') {
    list = list.filter((d) => d.status === options.status)
  }
  if (options?.animalId && options.animalId !== 'All') {
    list = list.filter((d) => d.assigned_animal_id === options.animalId)
  }

  return list
}

/**
 * Retrieves a single device by ID or EUI
 */
export async function getDeviceById(idOrEui: string): Promise<IoTDevice | null> {
  try {
    const { data, error } = await supabase
      .from('iot_devices')
      .select('*')
      .or(`id.eq.${idOrEui},device_eui.eq.${idOrEui}`)
      .single()

    if (error) throw error
    if (data) return data as IoTDevice
  } catch (err) {
    console.warn('[IoT Registry] Supabase query notice:', err)
  }

  return inMemoryDevices.find((d) => d.id === idOrEui || d.device_eui === idOrEui) || null
}

/**
 * Registers a new IoT device in the inventory
 */
export async function registerDevice(params: {
  device_eui: string
  name: string
  device_type: IoTDeviceType
  manufacturer?: string
  model?: string
  firmware_version?: string
  owner_id: string
  owner_name?: string
  village?: string
  district?: string
  is_demo?: boolean
  calibration_notes?: string
  registered_by: string
}): Promise<IoTDevice> {
  const eui = params.device_eui.trim().toUpperCase()

  // Validate duplicate device registration
  const existing = await getDeviceById(eui)
  if (existing) {
    throw new Error(`Device with Hardware EUI '${eui}' is already registered in PashuRaksha.`)
  }

  const newDevice: IoTDevice = {
    id: `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    device_eui: eui,
    name: params.name.trim(),
    device_type: params.device_type,
    manufacturer: params.manufacturer?.trim(),
    model: params.model?.trim(),
    firmware_version: params.firmware_version?.trim() || 'v2.4.1',
    battery_level: 100,
    status: 'ACTIVE',
    is_demo: Boolean(params.is_demo),
    owner_id: params.owner_id,
    owner_name: params.owner_name,
    village: params.village || 'Rampur Khurd',
    district: params.district || 'Varanasi',
    installation_date: new Date().toISOString(),
    last_communication_at: new Date().toISOString(),
    calibration_notes: params.calibration_notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  try {
    const { data, error } = await supabase.from('iot_devices').insert(newDevice).select().single()
    if (error) throw error
    if (data) inMemoryDevices.unshift(data as IoTDevice)
  } catch (err) {
    console.warn('[IoT Registry] Supabase insert notice (saving in-memory):', err)
    inMemoryDevices.unshift(newDevice)
  }

  // Audit event
  recordDeviceEvent({
    device_id: newDevice.id,
    device_eui: newDevice.device_eui,
    event_type: 'REGISTERED',
    severity: 'INFO',
    details: `Device registered by ${params.registered_by}`,
    actor_id: params.registered_by,
  })

  return newDevice
}

/**
 * Updates a device's operational status
 */
export async function updateDeviceStatus(
  deviceId: string,
  newStatus: DeviceStatus,
  reason?: string,
  updatedBy?: string
): Promise<IoTDevice | null> {
  const device = inMemoryDevices.find((d) => d.id === deviceId)
  if (!device) return null

  const oldStatus = device.status
  device.status = newStatus
  device.updated_at = new Date().toISOString()

  try {
    await supabase.from('iot_devices').update({ status: newStatus, updated_at: device.updated_at }).eq('id', deviceId)
  } catch (err) {
    console.warn('[IoT Registry] Supabase status update notice:', err)
  }

  recordDeviceEvent({
    device_id: device.id,
    device_eui: device.device_eui,
    event_type: 'STATUS_CHANGE',
    severity: newStatus === 'OFFLINE' || newStatus === 'MAINTENANCE' ? 'WARNING' : 'INFO',
    details: `Status transitioned from ${oldStatus} to ${newStatus}. ${reason || ''}`.trim(),
    actor_id: updatedBy,
  })

  return device
}

/**
 * Associates an authorized device with a registered animal
 */
export async function assignDeviceToAnimal(params: {
  deviceId: string
  animalId: string
  animalTag: string
  animalType?: string
  ownerId: string
  assignedBy: string
  assignmentReason?: string
}): Promise<AnimalDeviceAssignment> {
  const device = inMemoryDevices.find((d) => d.id === params.deviceId)
  if (!device) {
    throw new Error('Device not found in registry.')
  }

  // Security Check: Farmer can only assign devices to their own animals unless vet/admin
  if (device.owner_id !== params.ownerId && !params.assignedBy.toLowerCase().includes('vet') && !params.assignedBy.toLowerCase().includes('admin')) {
    throw new Error('Authorization denied: Cannot assign device across different livestock holdings.')
  }

  // If already assigned to an animal, close the previous active assignment record
  const existingActive = inMemoryAssignments.find(
    (a) => a.device_id === params.deviceId && a.is_active
  )
  if (existingActive) {
    existingActive.is_active = false
    existingActive.unassigned_at = new Date().toISOString()
  }

  // Create new active assignment
  const newAssignment: AnimalDeviceAssignment = {
    id: `asn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    device_id: params.deviceId,
    animal_id: params.animalId,
    animal_tag: params.animalTag,
    owner_id: params.ownerId,
    assigned_at: new Date().toISOString(),
    is_active: true,
    assignment_reason: params.assignmentReason || 'Clinical health surveillance association',
    assigned_by: params.assignedBy,
    created_at: new Date().toISOString(),
  }

  inMemoryAssignments.unshift(newAssignment)

  // Update device record with current assignment
  device.assigned_animal_id = params.animalId
  device.assigned_animal_tag = params.animalTag
  device.assigned_animal_type = params.animalType || device.assigned_animal_type
  device.updated_at = new Date().toISOString()

  try {
    await supabase.from('animal_device_assignments').insert(newAssignment)
    await supabase
      .from('iot_devices')
      .update({
        assigned_animal_id: params.animalId,
        assigned_animal_tag: params.animalTag,
        updated_at: device.updated_at,
      })
      .eq('id', params.deviceId)
  } catch (err) {
    console.warn('[IoT Registry] Supabase assignment notice:', err)
  }

  recordDeviceEvent({
    device_id: device.id,
    device_eui: device.device_eui,
    event_type: 'ASSIGNED',
    severity: 'INFO',
    details: `Assigned to animal #${params.animalTag} (${params.animalType || 'Livestock'}).`,
    actor_id: params.assignedBy,
  })

  return newAssignment
}

/**
 * Unassigns a device from its currently associated animal
 */
export async function unassignDeviceFromAnimal(
  deviceId: string,
  unassignedBy: string,
  reason?: string
): Promise<boolean> {
  const device = inMemoryDevices.find((d) => d.id === deviceId)
  if (!device) return false

  const active = inMemoryAssignments.find((a) => a.device_id === deviceId && a.is_active)
  if (active) {
    active.is_active = false
    active.unassigned_at = new Date().toISOString()
  }

  const previousTag = device.assigned_animal_tag
  device.assigned_animal_id = undefined
  device.assigned_animal_tag = undefined
  device.updated_at = new Date().toISOString()

  try {
    if (active) {
      await supabase
        .from('animal_device_assignments')
        .update({ is_active: false, unassigned_at: active.unassigned_at })
        .eq('id', active.id)
    }
    await supabase
      .from('iot_devices')
      .update({ assigned_animal_id: null, assigned_animal_tag: null, updated_at: device.updated_at })
      .eq('id', deviceId)
  } catch (err) {
    console.warn('[IoT Registry] Supabase unassign notice:', err)
  }

  recordDeviceEvent({
    device_id: device.id,
    device_eui: device.device_eui,
    event_type: 'UNASSIGNED',
    severity: 'INFO',
    details: `Unassigned from animal #${previousTag || 'Unknown'}. Reason: ${reason || 'Maintenance/Reassignment'}`,
    actor_id: unassignedBy,
  })

  return true
}

/**
 * Returns assignment audit history for a device or animal
 */
export function getDeviceAssignmentHistory(
  deviceIdOrAnimalId: string
): AnimalDeviceAssignment[] {
  return inMemoryAssignments.filter(
    (a) => a.device_id === deviceIdOrAnimalId || a.animal_id === deviceIdOrAnimalId
  )
}

/**
 * Records an immutable device audit event
 */
export function recordDeviceEvent(event: Omit<DeviceEvent, 'id' | 'created_at'>): DeviceEvent {
  const created: DeviceEvent = {
    ...event,
    id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    created_at: new Date().toISOString(),
  }
  inMemoryEvents.unshift(created)
  return created
}

/**
 * Returns audit events for a device
 */
export function getDeviceEvents(deviceId: string): DeviceEvent[] {
  return inMemoryEvents.filter((e) => e.device_id === deviceId)
}

/**
 * Returns devices owned by a specific farmer
 */
export async function getFarmerDevices(ownerId: string): Promise<IoTDevice[]> {
  return getRegisteredDevices({ ownerId })
}

/**
 * Returns all registered devices across holdings
 */
export async function getAllRegisteredDevices(): Promise<IoTDevice[]> {
  return getRegisteredDevices()
}

/**
 * Convenience alias for getting device historical assignments
 */
export async function getHistoricalDeviceAssignments(
  deviceId: string
): Promise<AnimalDeviceAssignment[]> {
  return getDeviceAssignmentHistory(deviceId)
}

/**
 * Convenience wrapper to fetch telemetry history for a device
 */
export async function getDeviceTelemetryHistory(deviceId: string, limit = 50) {
  const { getMeasurements } = await import('./measurementService')
  return getMeasurements({ deviceId, limit })
}

/**
 * Convenience wrapper for provisioning a new device
 */
export async function registerNewIoTDevice(params: {
  device_eui: string
  device_type: IoTDeviceType
  name?: string
  village?: string
  district?: string
  manufacturer?: string
  firmware_version?: string
  is_demo?: boolean
  owner_id?: string
}): Promise<IoTDevice> {
  return registerDevice({
    device_eui: params.device_eui,
    device_type: params.device_type,
    name: params.name || `IoT Sensor ${params.device_eui}`,
    village: params.village,
    district: params.district,
    manufacturer: params.manufacturer,
    firmware_version: params.firmware_version,
    is_demo: params.is_demo ?? true,
    owner_id: params.owner_id || 'demo-farmer',
    registered_by: 'admin-portal',
  })
}

/**
 * Returns consistent Tailwind badge CSS for device status
 */
export function getDeviceStatusBadgeClass(status: DeviceStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-300'
    case 'OFFLINE':
      return 'bg-stone-200 text-stone-700 border border-stone-300'
    case 'MAINTENANCE':
      return 'bg-amber-100 text-amber-800 border border-amber-300'
    case 'INACTIVE':
      return 'bg-stone-100 text-stone-600'
    case 'UNREGISTERED':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-stone-100 text-stone-700'
  }
}

