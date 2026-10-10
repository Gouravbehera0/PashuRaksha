// ============================================================
// PASHURAKSHA (पशुरक्षा) — SENSOR MEASUREMENT VALIDATION
// Stage 11: Ingestion Sanitization, Unit Verification & Replay Protection
// Standard: Secure Public Service Ingestion Gateway
// "Detect Early. Prevent Outbreaks. Protect Livestock."
// ============================================================

import type { IngestionPayload, SensorMeasurementType, DataQualityStatus } from './iotTypes'
import { DEVICE_THRESHOLDS, evaluateMeasurementAgainstBaseline } from './sensorThresholds'

export interface ValidatedMeasurementDraft {
  measurement_type: SensorMeasurementType
  value: number
  unit: string
  recorded_at: string
  received_at: string
  quality_status: DataQualityStatus
  is_late: boolean
  is_flagged_for_review: boolean
  flag_reason?: string
  idempotency_key?: string
  metadata?: Record<string, any>
}

export interface PayloadValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  validatedDrafts: ValidatedMeasurementDraft[]
}

// In-memory set of recently processed idempotency keys to prevent message replay (TTL simulation)
const processedIdempotencyKeys = new Set<string>()

/**
 * Expected unit mapping per measurement type. Prevents invalid unit conversion errors.
 */
export const VALID_MEASUREMENT_UNITS: Record<SensorMeasurementType, string[]> = {
  BODY_TEMPERATURE: ['°C', 'C'],
  ACTIVITY_LEVEL: ['index', 'steps/hr', 'score'],
  HEART_RATE: ['BPM', 'bpm'],
  RUMINATION_TIME: ['min/day', 'minutes', 'min'],
  AMBIENT_TEMPERATURE: ['°C', 'C'],
  AMBIENT_HUMIDITY: ['%', '% RH', 'percent'],
  HEAT_INDEX_THI: ['index', 'THI', 'score'],
  BATTERY_LEVEL: ['%'],
  GPS_LOCATION: ['coordinates', 'WGS84'],
}

/**
 * Validates an incoming IoT telemetry payload before database ingestion
 */
export function validateIngestionPayload(
  payload: IngestionPayload,
  assignedAnimalSpecies?: string
): PayloadValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const validatedDrafts: ValidatedMeasurementDraft[] = []

  // 1. Device Identifier Validation
  if (!payload.device_eui || typeof payload.device_eui !== 'string' || !payload.device_eui.trim()) {
    errors.push('Missing or invalid device_eui identifier in telemetry payload.')
    return { isValid: false, errors, warnings, validatedDrafts }
  }

  // 2. Payload Size Limit
  if (!Array.isArray(payload.measurements) || payload.measurements.length === 0) {
    errors.push('Telemetry payload contains no measurements array.')
    return { isValid: false, errors, warnings, validatedDrafts }
  }

  if (payload.measurements.length > DEVICE_THRESHOLDS.max_payload_measurements) {
    errors.push(
      `Payload size exceeds maximum allowed count (${payload.measurements.length} > ${DEVICE_THRESHOLDS.max_payload_measurements}).`
    )
    return { isValid: false, errors, warnings, validatedDrafts }
  }

  // 3. Duplicate Message / Idempotency Check
  if (payload.idempotency_key) {
    if (processedIdempotencyKeys.has(payload.idempotency_key)) {
      errors.push(`Duplicate message rejected: Idempotency key '${payload.idempotency_key}' already processed.`)
      return { isValid: false, errors, warnings, validatedDrafts }
    }
  }

  const now = Date.now()
  const receivedAtISO = new Date(now).toISOString()

  // 4. Validate Each Measurement Record
  for (let idx = 0; idx < payload.measurements.length; idx++) {
    const item = payload.measurements[idx]
    const itemPrefix = `Measurement[${idx}] (${item.type || 'unknown'}):`

    // Validate type
    if (!item.type || !(item.type in VALID_MEASUREMENT_UNITS)) {
      errors.push(`${itemPrefix} Unrecognized sensor measurement type '${item.type}'.`)
      continue
    }

    // Validate numeric value
    if (typeof item.value !== 'number' || isNaN(item.value) || !isFinite(item.value)) {
      errors.push(`${itemPrefix} Numeric value is required and must be finite. Received: ${item.value}`)
      continue
    }

    // Validate expected unit
    const acceptedUnits = VALID_MEASUREMENT_UNITS[item.type]
    const normalizedUnit = item.unit?.trim() || ''
    if (!acceptedUnits.some((u) => u.toLowerCase() === normalizedUnit.toLowerCase())) {
      errors.push(
        `${itemPrefix} Incompatible unit '${normalizedUnit}'. Expected one of [${acceptedUnits.join(', ')}].`
      )
      continue
    }

    // Validate timestamp
    const itemTimeStr = item.timestamp || payload.recorded_at || receivedAtISO
    const itemTimestamp = new Date(itemTimeStr).getTime()

    if (isNaN(itemTimestamp)) {
      errors.push(`${itemPrefix} Invalid ISO timestamp format '${itemTimeStr}'.`)
      continue
    }

    // Check future drift (max 15 mins allowed)
    if (itemTimestamp > now + DEVICE_THRESHOLDS.max_future_timestamp_seconds * 1000) {
      errors.push(
        `${itemPrefix} Future timestamp rejected (${new Date(itemTimestamp).toISOString()} is >15 minutes ahead of server clock).`
      )
      continue
    }

    // Check if reading is late (older than 72 hours)
    const isLate = now - itemTimestamp > 72 * 3600 * 1000
    if (isLate) {
      warnings.push(`${itemPrefix} Reading is received late (>72 hours delayed).`)
    }

    // Evaluate physiological plausibility
    const evaluation = evaluateMeasurementAgainstBaseline(
      item.type,
      item.value,
      assignedAnimalSpecies
    )

    let qualityStatus: DataQualityStatus = 'VALID'
    let isFlagged = false
    let flagReason: string | undefined

    if (payload.is_demo) {
      qualityStatus = 'DEMO_DATA'
    } else if (!evaluation.isPlausible) {
      qualityStatus = 'OUT_OF_RANGE'
      isFlagged = true
      flagReason = evaluation.ruleTriggered || 'Reading outside biological survival limits.'
    } else if (evaluation.severity === 'CRITICAL' || evaluation.severity === 'WARNING') {
      qualityStatus = 'VALID'
      isFlagged = true
      flagReason = evaluation.ruleTriggered
    }

    validatedDrafts.push({
      measurement_type: item.type,
      value: Math.round(item.value * 100) / 100,
      unit: acceptedUnits[0], // Store in canonical unit
      recorded_at: new Date(itemTimestamp).toISOString(),
      received_at: receivedAtISO,
      quality_status: qualityStatus,
      is_late: isLate,
      is_flagged_for_review: isFlagged,
      flag_reason: flagReason,
      idempotency_key: payload.idempotency_key ? `${payload.idempotency_key}-${idx}` : undefined,
      metadata: item.metadata,
    })
  }

  // Register idempotency key upon successful validation
  if (errors.length === 0 && payload.idempotency_key) {
    processedIdempotencyKeys.add(payload.idempotency_key)
    // Keep set bounded to latest 5000 keys
    if (processedIdempotencyKeys.size > 5000) {
      const first = processedIdempotencyKeys.values().next().value
      if (first) processedIdempotencyKeys.delete(first)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    validatedDrafts,
  }
}
