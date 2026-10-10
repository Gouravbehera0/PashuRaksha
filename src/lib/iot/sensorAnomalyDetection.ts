// ============================================================
// PASHURAKSHA (पशुरक्षा) — SENSOR ANOMALY DETECTION ENGINE
// Stage 11: Multi-Factor Telemetry Outlier Analysis & Clinical Triage
// Standard: NADRS Early Clinical Warning / ICAR-IVRI Reference
// "Detect Early. Prevent Outbreaks. Protect Livestock."
// ============================================================

import { supabase } from '@/lib/supabase'
import type {
  SensorMeasurement,
  SensorAnomalyAlert,
  IoTAlertStatus,
  IoTDevice,
} from './iotTypes'
import {
  evaluateMeasurementAgainstBaseline,
} from './sensorThresholds'

// In-memory deterministic alerts store (with Demo separation)
let inMemoryAlerts: SensorAnomalyAlert[] = [
  {
    id: 'alt-iot-001',
    alert_category: 'HEALTH_MEASUREMENT_REVIEW',
    severity: 'HIGH',
    status: 'ACTIVE',
    animal_id: 'a003-demo-gir-heifer',
    animal_tag: 'PR-COW-003',
    device_id: 'dev-003-sahiwal-tag',
    device_eui: 'PR-IOT-TAG-9914',
    triggering_value: 39.9,
    triggering_unit: '°C',
    threshold_rule: 'Body temp 39.9°C exceeds upper critical fever boundary (39.8°C)',
    detected_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    title: 'Severe Pyrexia Warning (Sahiwal Cow #PR-COW-003)',
    description:
      'Continuous ear-tag probe recorded 39.9°C (normal: 38.0°C–39.3°C). Reading is 0.6°C above upper normal limit.',
    clinical_note:
      'Suspected systemic pyrexia. Requires prompt physical inspection for mucosal lesions or respiratory distress.',
    recommended_action:
      'Dispatch field veterinarian for physical auscultation and clinical triage.',
    is_demo: true,
    created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'alt-iot-002',
    alert_category: 'DEVICE_OFFLINE',
    severity: 'MEDIUM',
    status: 'ACTIVE',
    animal_id: 'a004-demo-barbari-goat',
    animal_tag: 'PR-GOT-004',
    device_id: 'dev-004-goat-collar',
    device_eui: 'PR-IOT-COL-1029',
    threshold_rule: 'Heartbeat timeout > 180 minutes without telemetry packet',
    detected_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    title: 'Sensor Offline: Smart Collar #1029 (Goat #PR-GOT-004)',
    description:
      'No telemetry transmission received for 5 hours. Last reported battery was 45%. Note: Device offline does not indicate animal sickness.',
    clinical_note: 'Gateway connectivity timeout or animal grazing beyond LoRaWAN range.',
    recommended_action:
      'Check local gateway power and verify collar positioning on animal during evening penning.',
    is_demo: true,
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'alt-iot-003',
    alert_category: 'BATTERY_LOW',
    severity: 'MEDIUM',
    status: 'ACTIVE',
    animal_id: 'a003-demo-gir-heifer',
    animal_tag: 'PR-COW-003',
    device_id: 'dev-003-sahiwal-tag',
    device_eui: 'PR-IOT-TAG-9914',
    triggering_value: 14,
    triggering_unit: '%',
    threshold_rule: 'Battery level 14% below 20% operational warning threshold',
    detected_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    title: 'Low Battery: Smart Ear Tag #9914 (14%)',
    description:
      'Battery level is at 14%. Telemetry reporting frequency reduced to preserve vital power.',
    recommended_action:
      'Schedule device recharging or battery cell replacement during next milking cycle.',
    is_demo: true,
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
]

/**
 * Evaluates an incoming measurement against anomaly rules and historical readings
 */
export function analyzeMeasurementForAnomalies(
  measurement: SensorMeasurement,
  device: IoTDevice,
  recentAnimalMeasurements: SensorMeasurement[]
): SensorAnomalyAlert | null {
  // 1. Single-reading physiological evaluation
  const evaluation = evaluateMeasurementAgainstBaseline(
    measurement.measurement_type,
    measurement.value,
    device.assigned_animal_type
  )

  // 1.1 Sensor Hardware Malfunction: readings outside biological life plausibility
  if (!evaluation.isPlausible) {
    // Avoid duplicate within 12h
    if (isAlertRecentlyActive(device.id, 'SENSOR_DATA_INVALID')) return null

    return {
      id: `alt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      alert_category: 'SENSOR_DATA_INVALID',
      severity: 'MEDIUM',
      status: 'ACTIVE',
      animal_id: measurement.animal_id,
      animal_tag: measurement.animal_tag,
      device_id: device.id,
      device_eui: device.device_eui,
      triggering_measurement_id: measurement.id,
      triggering_value: measurement.value,
      triggering_unit: measurement.unit,
      threshold_rule: evaluation.ruleTriggered || 'Physical implausibility boundary violation',
      detected_at: new Date().toISOString(),
      title: `Sensor Malfunction / Detachment Flag (${device.name})`,
      description: `Sensor recorded ${measurement.value} ${measurement.unit}, which is biologically implausible. Note: This indicates hardware/probe detachment, not animal disease.`,
      clinical_note: evaluation.clinicalNote || 'Sensor requires physical re-attachment or recalibration.',
      recommended_action: 'Inspect device sensor probe placement on animal and recalibrate.',
      is_demo: device.is_demo,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  // 1.2 Physiological Critical / Warning Breach
  if (evaluation.severity === 'CRITICAL' || evaluation.severity === 'WARNING') {
    // Check if repeated abnormal readings within 6 hours
    const sameTypeRecent = recentAnimalMeasurements
      .filter((m) => m.measurement_type === measurement.measurement_type)
      .slice(0, 5)

    const abnormalCount = sameTypeRecent.filter((m) => m.is_flagged_for_review).length

    const isRepeated = abnormalCount >= 2 // Current makes 3rd abnormal reading
    const alertCategory = isRepeated ? 'REPEATED_ABNORMAL_READINGS' : 'HEALTH_MEASUREMENT_REVIEW'
    const severity = evaluation.severity === 'CRITICAL' || isRepeated ? 'CRITICAL' : 'HIGH'

    // Deduplication check: Suppress if identical category active within 12h
    if (isAlertRecentlyActive(device.id, alertCategory)) return null

    const animalLabel = measurement.animal_tag ? `Animal #${measurement.animal_tag}` : device.name

    return {
      id: `alt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      alert_category: alertCategory,
      severity,
      status: 'ACTIVE',
      animal_id: measurement.animal_id,
      animal_tag: measurement.animal_tag,
      device_id: device.id,
      device_eui: device.device_eui,
      triggering_measurement_id: measurement.id,
      triggering_value: measurement.value,
      triggering_unit: measurement.unit,
      threshold_rule: evaluation.ruleTriggered || 'Physiological threshold breach',
      detected_at: new Date().toISOString(),
      title: `${isRepeated ? 'Repeated ' : ''}${measurement.measurement_type.replace(/_/g, ' ')} Alert (${animalLabel})`,
      description: `Sensor telemetry recorded ${measurement.value} ${measurement.unit}. ${evaluation.ruleTriggered || ''}`,
      clinical_note: evaluation.clinicalNote,
      recommended_action:
        severity === 'CRITICAL'
          ? 'Urgent veterinary examination required. Inspect animal in pen.'
          : 'Schedule clinical review with local veterinary officer.',
      is_demo: device.is_demo,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  // 1.3 Rapid Shift from Baseline (e.g. Temperature shift >= 1.5°C within 12h)
  if (measurement.measurement_type === 'BODY_TEMPERATURE') {
    const tempReadings = recentAnimalMeasurements
      .filter((m) => m.measurement_type === 'BODY_TEMPERATURE' && m.quality_status === 'VALID')
      .slice(0, 6)

    if (tempReadings.length >= 3) {
      const avgBaseline = tempReadings.reduce((sum, m) => sum + m.value, 0) / tempReadings.length
      const diff = Math.abs(measurement.value - avgBaseline)
      if (diff >= 1.5) {
        if (!isAlertRecentlyActive(device.id, 'HEALTH_MEASUREMENT_REVIEW')) {
          return {
            id: `alt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
            alert_category: 'HEALTH_MEASUREMENT_REVIEW',
            severity: 'HIGH',
            status: 'ACTIVE',
            animal_id: measurement.animal_id,
            animal_tag: measurement.animal_tag,
            device_id: device.id,
            device_eui: device.device_eui,
            triggering_measurement_id: measurement.id,
            triggering_value: measurement.value,
            triggering_unit: measurement.unit,
            threshold_rule: `Rapid temperature deviation of ${diff.toFixed(1)}°C from baseline (${avgBaseline.toFixed(1)}°C)`,
            detected_at: new Date().toISOString(),
            title: `Rapid Body Temperature Shift (${measurement.animal_tag ? '#' + measurement.animal_tag : device.name})`,
            description: `Sudden shift of ${diff.toFixed(1)}°C observed compared to 24h average (${avgBaseline.toFixed(1)}°C).`,
            clinical_note: 'Early phase of acute infection or stress prostration.',
            recommended_action: 'Monitor body temperature and clinical signs every 4 hours.',
            is_demo: device.is_demo,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        }
      }
    }
  }

  return null
}

/**
 * Checks whether an alert in this category for this device is already active within the suppression window
 */
function isAlertRecentlyActive(deviceId: string, category: string, suppressionHours: number = 12): boolean {
  const cutoff = Date.now() - suppressionHours * 3600 * 1000
  return inMemoryAlerts.some((a) => {
    if (a.device_id !== deviceId || a.alert_category !== category) return false
    if (a.status === 'RESOLVED' || a.status === 'DISMISSED') return false
    const alertTime = new Date(a.detected_at).getTime()
    return alertTime >= cutoff
  })
}

/**
 * Stores a newly generated sensor anomaly alert
 */
export async function persistSensorAlert(alert: SensorAnomalyAlert): Promise<SensorAnomalyAlert> {
  inMemoryAlerts.unshift(alert)

  try {
    await supabase.from('sensor_alerts').insert(alert)
  } catch (err) {
    console.warn('[IoT Anomaly] Supabase alert insert notice:', err)
  }

  return alert
}

/**
 * Returns all sensor anomaly alerts filterable by role, status, severity, and device
 */
export async function getSensorAlerts(options?: {
  ownerId?: string
  role?: string
  status?: string
  severity?: string
  deviceId?: string
  animalId?: string
}): Promise<SensorAnomalyAlert[]> {
  try {
    let query = supabase.from('sensor_alerts').select('*').order('detected_at', { ascending: false })

    if (options?.status && options.status !== 'All') {
      query = query.eq('status', options.status)
    }
    if (options?.severity && options.severity !== 'All') {
      query = query.eq('severity', options.severity)
    }
    if (options?.deviceId) {
      query = query.eq('device_id', options.deviceId)
    }
    if (options?.animalId) {
      query = query.eq('animal_id', options.animalId)
    }

    const { data, error } = await query
    if (error) throw error
    if (data && data.length > 0) return data as SensorAnomalyAlert[]
  } catch (err) {
    console.warn('[IoT Anomaly] Supabase query notice (using in-memory fallback):', err)
  }

  let list = [...inMemoryAlerts]
  if (options?.status && options.status !== 'All') {
    list = list.filter((a) => a.status === options.status)
  }
  if (options?.severity && options.severity !== 'All') {
    list = list.filter((a) => a.severity === options.severity)
  }
  if (options?.deviceId) {
    list = list.filter((a) => a.device_id === options.deviceId)
  }
  if (options?.animalId) {
    list = list.filter((a) => a.animal_id === options.animalId)
  }

  return list
}

/**
 * Updates the lifecycle status of a sensor alert (acknowledgement, investigation, resolution)
 */
export async function updateSensorAlertStatus(
  alertId: string,
  newStatus: IoTAlertStatus,
  reviewerName: string,
  clinicalNotes?: string,
  linkedVetCaseId?: string
): Promise<SensorAnomalyAlert | null> {
  const alert = inMemoryAlerts.find((a) => a.id === alertId)
  if (!alert) return null

  alert.status = newStatus
  alert.acknowledged_by = reviewerName
  alert.acknowledged_at = new Date().toISOString()
  if (clinicalNotes) alert.clinical_note = clinicalNotes
  if (linkedVetCaseId) alert.linked_vet_case_id = linkedVetCaseId
  alert.updated_at = new Date().toISOString()

  try {
    await supabase
      .from('sensor_alerts')
      .update({
        status: newStatus,
        acknowledged_by: reviewerName,
        acknowledged_at: alert.acknowledged_at,
        clinical_note: alert.clinical_note,
        linked_vet_case_id: alert.linked_vet_case_id,
        updated_at: alert.updated_at,
      })
      .eq('id', alertId)
  } catch (err) {
    console.warn('[IoT Anomaly] Supabase alert status update notice:', err)
  }

  return alert
}
