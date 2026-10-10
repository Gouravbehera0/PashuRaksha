// ============================================================
// PASHURAKSHA (पशुरक्षा) — SENSOR MEASUREMENT INGESTION & QUERY SERVICE
// Stage 11: Real-Time Ingestion Pipeline, Time-Series Stores & Downsampling
// Standard: Secure Edge Ingestion & NADRS-II Veterinary Database Integration
// "Detect Early. Prevent Outbreaks. Protect Livestock."
// ============================================================

import { supabase } from '@/lib/supabase'
import type {
  SensorMeasurement,
  IngestionPayload,
  IngestionResult,
  SensorMeasurementType,
} from './iotTypes'
import { getDeviceById, getDeviceAssignmentHistory } from './deviceRegistry'
import { validateIngestionPayload } from './measurementValidation'
import {
  analyzeMeasurementForAnomalies,
  persistSensorAlert,
} from './sensorAnomalyDetection'

// In-Memory Seed Measurements for Demo Animals (With Clear DEMO Separation)
const now = Date.now()
const hourMs = 3600 * 1000

let inMemoryMeasurements: SensorMeasurement[] = [
  // Cow #PR-COW-001 (Gir Cow) — Normal Telemetry
  {
    id: 'meas-cow-001-t1',
    device_id: 'dev-001-gir-tag',
    device_eui: 'PR-IOT-TAG-8821',
    animal_id: 'a001-demo-gir-cow',
    animal_tag: 'PR-COW-001',
    owner_id: 'demo-farmer',
    measurement_type: 'BODY_TEMPERATURE',
    value: 38.6,
    unit: '°C',
    recorded_at: new Date(now - 12 * 60 * 1000).toISOString(),
    received_at: new Date(now - 12 * 60 * 1000).toISOString(),
    quality_status: 'DEMO_DATA',
    is_late: false,
    is_flagged_for_review: false,
    is_demo: true,
  },
  {
    id: 'meas-cow-001-t2',
    device_id: 'dev-001-gir-tag',
    device_eui: 'PR-IOT-TAG-8821',
    animal_id: 'a001-demo-gir-cow',
    animal_tag: 'PR-COW-001',
    owner_id: 'demo-farmer',
    measurement_type: 'BODY_TEMPERATURE',
    value: 38.5,
    unit: '°C',
    recorded_at: new Date(now - 2 * hourMs).toISOString(),
    received_at: new Date(now - 2 * hourMs).toISOString(),
    quality_status: 'DEMO_DATA',
    is_late: false,
    is_flagged_for_review: false,
    is_demo: true,
  },
  {
    id: 'meas-cow-001-t3',
    device_id: 'dev-001-gir-tag',
    device_eui: 'PR-IOT-TAG-8821',
    animal_id: 'a001-demo-gir-cow',
    animal_tag: 'PR-COW-001',
    owner_id: 'demo-farmer',
    measurement_type: 'BODY_TEMPERATURE',
    value: 38.7,
    unit: '°C',
    recorded_at: new Date(now - 4 * hourMs).toISOString(),
    received_at: new Date(now - 4 * hourMs).toISOString(),
    quality_status: 'DEMO_DATA',
    is_late: false,
    is_flagged_for_review: false,
    is_demo: true,
  },
  {
    id: 'meas-cow-001-t4',
    device_id: 'dev-001-gir-tag',
    device_eui: 'PR-IOT-TAG-8821',
    animal_id: 'a001-demo-gir-cow',
    animal_tag: 'PR-COW-001',
    owner_id: 'demo-farmer',
    measurement_type: 'BODY_TEMPERATURE',
    value: 38.4,
    unit: '°C',
    recorded_at: new Date(now - 6 * hourMs).toISOString(),
    received_at: new Date(now - 6 * hourMs).toISOString(),
    quality_status: 'DEMO_DATA',
    is_late: false,
    is_flagged_for_review: false,
    is_demo: true,
  },
  {
    id: 'meas-cow-001-act',
    device_id: 'dev-001-gir-tag',
    device_eui: 'PR-IOT-TAG-8821',
    animal_id: 'a001-demo-gir-cow',
    animal_tag: 'PR-COW-001',
    owner_id: 'demo-farmer',
    measurement_type: 'ACTIVITY_LEVEL',
    value: 48,
    unit: 'index',
    recorded_at: new Date(now - 12 * 60 * 1000).toISOString(),
    received_at: new Date(now - 12 * 60 * 1000).toISOString(),
    quality_status: 'DEMO_DATA',
    is_late: false,
    is_flagged_for_review: false,
    is_demo: true,
  },

  // Buffalo #PR-BUF-002 (Murrah Buffalo) — Internal Bolus Telemetry
  {
    id: 'meas-buf-002-t1',
    device_id: 'dev-002-murrah-bolus',
    device_eui: 'PR-IOT-BOLUS-4402',
    animal_id: 'a002-demo-murrah-buf',
    animal_tag: 'PR-BUF-002',
    owner_id: 'demo-farmer',
    measurement_type: 'BODY_TEMPERATURE',
    value: 38.2,
    unit: '°C',
    recorded_at: new Date(now - 25 * 60 * 1000).toISOString(),
    received_at: new Date(now - 25 * 60 * 1000).toISOString(),
    quality_status: 'DEMO_DATA',
    is_late: false,
    is_flagged_for_review: false,
    is_demo: true,
  },
  {
    id: 'meas-buf-002-rum',
    device_id: 'dev-002-murrah-bolus',
    device_eui: 'PR-IOT-BOLUS-4402',
    animal_id: 'a002-demo-murrah-buf',
    animal_tag: 'PR-BUF-002',
    owner_id: 'demo-farmer',
    measurement_type: 'RUMINATION_TIME',
    value: 465,
    unit: 'min/day',
    recorded_at: new Date(now - 25 * 60 * 1000).toISOString(),
    received_at: new Date(now - 25 * 60 * 1000).toISOString(),
    quality_status: 'DEMO_DATA',
    is_late: false,
    is_flagged_for_review: false,
    is_demo: true,
  },

  // Cow #PR-COW-003 (Sahiwal) — Elevated Pyrexia Telemetry (Flagged)
  {
    id: 'meas-cow-003-t1',
    device_id: 'dev-003-sahiwal-tag',
    device_eui: 'PR-IOT-TAG-9914',
    animal_id: 'a003-demo-gir-heifer',
    animal_tag: 'PR-COW-003',
    owner_id: 'demo-farmer',
    measurement_type: 'BODY_TEMPERATURE',
    value: 39.9,
    unit: '°C',
    recorded_at: new Date(now - 35 * 60 * 1000).toISOString(),
    received_at: new Date(now - 35 * 60 * 1000).toISOString(),
    quality_status: 'DEMO_DATA',
    is_late: false,
    is_flagged_for_review: true,
    flag_reason: 'Body temp 39.9°C exceeds upper critical fever boundary (39.8°C)',
    is_demo: true,
  },
  {
    id: 'meas-cow-003-t2',
    device_id: 'dev-003-sahiwal-tag',
    device_eui: 'PR-IOT-TAG-9914',
    animal_id: 'a003-demo-gir-heifer',
    animal_tag: 'PR-COW-003',
    owner_id: 'demo-farmer',
    measurement_type: 'BODY_TEMPERATURE',
    value: 39.8,
    unit: '°C',
    recorded_at: new Date(now - 2 * hourMs).toISOString(),
    received_at: new Date(now - 2 * hourMs).toISOString(),
    quality_status: 'DEMO_DATA',
    is_late: false,
    is_flagged_for_review: true,
    flag_reason: 'Elevated temperature above normal',
    is_demo: true,
  },
  {
    id: 'meas-cow-003-t3',
    device_id: 'dev-003-sahiwal-tag',
    device_eui: 'PR-IOT-TAG-9914',
    animal_id: 'a003-demo-gir-heifer',
    animal_tag: 'PR-COW-003',
    owner_id: 'demo-farmer',
    measurement_type: 'BODY_TEMPERATURE',
    value: 39.4,
    unit: '°C',
    recorded_at: new Date(now - 4 * hourMs).toISOString(),
    received_at: new Date(now - 4 * hourMs).toISOString(),
    quality_status: 'DEMO_DATA',
    is_late: false,
    is_flagged_for_review: true,
    flag_reason: 'Elevated temperature above normal',
    is_demo: true,
  },

  // Environmental Station — Shed Telemetry
  {
    id: 'meas-env-001',
    device_id: 'dev-005-shed-env',
    device_eui: 'PR-IOT-ENV-0081',
    owner_id: 'demo-farmer',
    measurement_type: 'AMBIENT_TEMPERATURE',
    value: 31.4,
    unit: '°C',
    recorded_at: new Date(now - 5 * 60 * 1000).toISOString(),
    received_at: new Date(now - 5 * 60 * 1000).toISOString(),
    quality_status: 'DEMO_DATA',
    is_late: false,
    is_flagged_for_review: false,
    is_demo: true,
  },
  {
    id: 'meas-env-002',
    device_id: 'dev-005-shed-env',
    device_eui: 'PR-IOT-ENV-0081',
    owner_id: 'demo-farmer',
    measurement_type: 'AMBIENT_HUMIDITY',
    value: 74,
    unit: '%',
    recorded_at: new Date(now - 5 * 60 * 1000).toISOString(),
    received_at: new Date(now - 5 * 60 * 1000).toISOString(),
    quality_status: 'DEMO_DATA',
    is_late: false,
    is_flagged_for_review: false,
    is_demo: true,
  },
  {
    id: 'meas-env-003',
    device_id: 'dev-005-shed-env',
    device_eui: 'PR-IOT-ENV-0081',
    owner_id: 'demo-farmer',
    measurement_type: 'HEAT_INDEX_THI',
    value: 82.3,
    unit: 'index',
    recorded_at: new Date(now - 5 * 60 * 1000).toISOString(),
    received_at: new Date(now - 5 * 60 * 1000).toISOString(),
    quality_status: 'DEMO_DATA',
    is_late: false,
    is_flagged_for_review: true,
    flag_reason: 'Moderate heat stress index: THI 82.3',
    is_demo: true,
  },
]

/**
 * Resolves which animal was assigned to the device at a specific historical recording time
 * (Requirement 6: Historical measurements remain associated with the correct animal).
 */
export function resolveHistoricalAnimalAssignment(
  deviceId: string,
  recordedAtISO: string
): { animalId?: string; animalTag?: string } {
  const targetTime = new Date(recordedAtISO).getTime()
  const history = getDeviceAssignmentHistory(deviceId)

  for (const record of history) {
    const start = new Date(record.assigned_at).getTime()
    const end = record.unassigned_at ? new Date(record.unassigned_at).getTime() : Infinity

    if (targetTime >= start && targetTime <= end) {
      return { animalId: record.animal_id, animalTag: record.animal_tag }
    }
  }

  return {}
}

/**
 * Ingestion gateway pipeline for telemetry sent by physical devices, gateways, or simulator
 */
export async function ingestTelemetryPayload(
  payload: IngestionPayload
): Promise<IngestionResult> {
  // 1. Device Lookup & Verification
  const device = await getDeviceById(payload.device_eui)
  if (!device) {
    return {
      success: false,
      device_eui: payload.device_eui,
      processed_count: 0,
      rejected_count: payload.measurements?.length || 0,
      errors: [`Unregistered device: EUI '${payload.device_eui}' does not exist in registry.`],
      created_measurements: [],
      generated_alerts: [],
    }
  }

  // Check device status
  if (device.status === 'INACTIVE' || device.status === 'UNREGISTERED') {
    return {
      success: false,
      device_id: device.id,
      device_eui: device.device_eui,
      processed_count: 0,
      rejected_count: payload.measurements?.length || 0,
      errors: [`Device '${device.device_eui}' is currently in ${device.status} state. Telemetry rejected.`],
      created_measurements: [],
      generated_alerts: [],
    }
  }

  // 2. Payload Validation & Sanitization
  const validation = validateIngestionPayload(payload, device.assigned_animal_type)
  if (!validation.isValid) {
    return {
      success: false,
      device_id: device.id,
      device_eui: device.device_eui,
      processed_count: 0,
      rejected_count: payload.measurements.length,
      errors: validation.errors,
      created_measurements: [],
      generated_alerts: [],
    }
  }

  const createdMeasurements: SensorMeasurement[] = []
  const generatedAlerts: any[] = []

  // 3. Process Validated Drafts
  for (const draft of validation.validatedDrafts) {
    // Resolve animal assignment at the recording time
    const historicalAssignment = resolveHistoricalAnimalAssignment(device.id, draft.recorded_at)
    const animalId = historicalAssignment.animalId || device.assigned_animal_id
    const animalTag = historicalAssignment.animalTag || device.assigned_animal_tag

    const measurement: SensorMeasurement = {
      id: `meas-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      device_id: device.id,
      device_eui: device.device_eui,
      animal_id: animalId,
      animal_tag: animalTag,
      owner_id: device.owner_id,
      measurement_type: draft.measurement_type,
      value: draft.value,
      unit: draft.unit,
      recorded_at: draft.recorded_at,
      received_at: draft.received_at,
      quality_status: draft.quality_status,
      is_late: draft.is_late,
      is_flagged_for_review: draft.is_flagged_for_review,
      flag_reason: draft.flag_reason,
      is_demo: device.is_demo || Boolean(payload.is_demo),
      idempotency_key: draft.idempotency_key,
      metadata: draft.metadata,
    }

    inMemoryMeasurements.unshift(measurement)
    createdMeasurements.push(measurement)

    // Run anomaly evaluation
    const recent = inMemoryMeasurements.filter((m) => m.animal_id === animalId)
    const alert = analyzeMeasurementForAnomalies(measurement, device, recent)
    if (alert) {
      await persistSensorAlert(alert)
      generatedAlerts.push(alert)
    }
  }

  // 4. Update Device Telemetry Status
  device.last_communication_at = new Date().toISOString()
  if (validation.validatedDrafts.length > 0) {
    device.last_measurement_at = validation.validatedDrafts[0].recorded_at
  }
  if (typeof payload.battery_level === 'number') {
    device.battery_level = Math.max(0, Math.min(100, Math.round(payload.battery_level)))
  }
  if (device.status === 'OFFLINE') {
    device.status = 'ACTIVE'
  }
  device.updated_at = new Date().toISOString()

  // Asynchronous Supabase write
  try {
    if (createdMeasurements.length > 0) {
      await supabase.from('sensor_measurements').insert(createdMeasurements)
      await supabase
        .from('iot_devices')
        .update({
          last_communication_at: device.last_communication_at,
          last_measurement_at: device.last_measurement_at,
          battery_level: device.battery_level,
          status: device.status,
          updated_at: device.updated_at,
        })
        .eq('id', device.id)
    }
  } catch (err) {
    console.warn('[IoT Ingestion] Supabase persistence notice (cached in memory):', err)
  }

  return {
    success: true,
    device_id: device.id,
    device_eui: device.device_eui,
    processed_count: createdMeasurements.length,
    rejected_count: 0,
    errors: [],
    created_measurements: createdMeasurements,
    generated_alerts: generatedAlerts,
  }
}

/**
 * Queries stored measurements with filtering options
 */
export async function getMeasurements(options?: {
  animalId?: string
  deviceId?: string
  measurementType?: SensorMeasurementType | 'All'
  dateRangeHours?: number
  onlyFlagged?: boolean
  limit?: number
}): Promise<SensorMeasurement[]> {
  try {
    let query = supabase.from('sensor_measurements').select('*').order('recorded_at', { ascending: false })

    if (options?.animalId && options.animalId !== 'All') {
      query = query.eq('animal_id', options.animalId)
    }
    if (options?.deviceId) {
      query = query.eq('device_id', options.deviceId)
    }
    if (options?.measurementType && options.measurementType !== 'All') {
      query = query.eq('measurement_type', options.measurementType)
    }
    if (options?.onlyFlagged) {
      query = query.eq('is_flagged_for_review', true)
    }
    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query
    if (error) throw error
    if (data && data.length > 0) return data as SensorMeasurement[]
  } catch (err) {
    console.warn('[IoT Measurement] Supabase query notice (using in-memory fallback):', err)
  }

  let list = [...inMemoryMeasurements]
  if (options?.animalId && options.animalId !== 'All') {
    list = list.filter((m) => m.animal_id === options.animalId)
  }
  if (options?.deviceId) {
    list = list.filter((m) => m.device_id === options.deviceId)
  }
  if (options?.measurementType && options.measurementType !== 'All') {
    list = list.filter((m) => m.measurement_type === options.measurementType)
  }
  if (options?.onlyFlagged) {
    list = list.filter((m) => m.is_flagged_for_review)
  }
  if (options?.dateRangeHours) {
    const cutoff = Date.now() - options.dateRangeHours * 3600 * 1000
    list = list.filter((m) => new Date(m.recorded_at).getTime() >= cutoff)
  }
  if (options?.limit) {
    list = list.slice(0, options.limit)
  }

  return list
}

/**
 * Returns latest readings of each type for an animal profile summary
 */
export async function getLatestAnimalMeasurements(
  animalId: string
): Promise<Record<SensorMeasurementType, SensorMeasurement | undefined>> {
  const readings = await getMeasurements({ animalId, limit: 100 })
  const result: Partial<Record<SensorMeasurementType, SensorMeasurement>> = {}

  for (const m of readings) {
    if (!result[m.measurement_type]) {
      result[m.measurement_type] = m
    }
  }

  return result as Record<SensorMeasurementType, SensorMeasurement | undefined>
}
