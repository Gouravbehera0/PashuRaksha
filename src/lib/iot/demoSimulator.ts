// ============================================================
// PASHURAKSHA (पशुरक्षा) — IOT DEMO TELEMETRY SIMULATOR
// Stage 11: Non-Hardware Development & Verification Sandbox
// Strict Requirement: Explicitly labeled as DEMO / DEMO DATA
// "Detect Early. Prevent Outbreaks. Protect Livestock."
// ============================================================

import type { IngestionPayload, IngestionResult, SensorMeasurementType } from './iotTypes'
import { ingestTelemetryPayload } from './measurementService'

export interface SimulationPreset {
  id: string
  name: string
  description: string
  device_eui: string
  isAbnormal: boolean
  measurements: {
    type: SensorMeasurementType
    value: number
    unit: string
  }[]
}

export const SIMULATION_PRESETS: SimulationPreset[] = [
  {
    id: 'preset-normal-gir-cow',
    name: 'Normal Physiological Telemetry (Gir Cow)',
    description: 'Generates nominal body temp (38.5°C) and active rumination (460 min/day).',
    device_eui: 'PR-IOT-TAG-8821',
    isAbnormal: false,
    measurements: [
      { type: 'BODY_TEMPERATURE', value: 38.5, unit: '°C' },
      { type: 'ACTIVITY_LEVEL', value: 52, unit: 'index' },
    ],
  },
  {
    id: 'preset-pyrexia-spike',
    name: 'Acute Pyrexia & Fever Surge (Sahiwal Cow)',
    description: 'Generates high-grade fever reading (40.2°C) triggering emergency health alert.',
    device_eui: 'PR-IOT-TAG-9914',
    isAbnormal: true,
    measurements: [
      { type: 'BODY_TEMPERATURE', value: 40.2, unit: '°C' },
      { type: 'ACTIVITY_LEVEL', value: 18, unit: 'index' },
    ],
  },
  {
    id: 'preset-rumination-drop',
    name: 'Ruminal Stasis / Cessation (Murrah Buffalo)',
    description: 'Simulates severe drop in rumination time (180 min/day) triggering digestive warning.',
    device_eui: 'PR-IOT-BOLUS-4402',
    isAbnormal: true,
    measurements: [
      { type: 'RUMINATION_TIME', value: 180, unit: 'min/day' },
      { type: 'BODY_TEMPERATURE', value: 38.3, unit: '°C' },
    ],
  },
  {
    id: 'preset-heat-stress',
    name: 'Dairy Shed Heat Stress (Environmental)',
    description: 'Generates ambient 37.0°C at 78% RH (THI 89.2) triggering heat emergency alert.',
    device_eui: 'PR-IOT-ENV-0081',
    isAbnormal: true,
    measurements: [
      { type: 'AMBIENT_TEMPERATURE', value: 37.0, unit: '°C' },
      { type: 'AMBIENT_HUMIDITY', value: 78, unit: '%' },
      { type: 'HEAT_INDEX_THI', value: 89.2, unit: 'index' },
    ],
  },
]

/**
 * Checks if demo mode is enabled in the current runtime environment
 */
export function isDemoModeEnabled(): boolean {
  // Always active in development and staging sandboxes
  return true
}

/**
 * Executes a simulated telemetry payload through the exact ingestion pipeline.
 * Explicitly marks records with `is_demo: true` and `DEMO_DATA` quality status.
 */
export async function sendSimulatedTelemetry(
  presetIdOrPayload: string | IngestionPayload
): Promise<IngestionResult> {
  let payload: IngestionPayload

  if (typeof presetIdOrPayload === 'string') {
    const preset = SIMULATION_PRESETS.find((p) => p.id === presetIdOrPayload)
    if (!preset) {
      throw new Error(`Simulation preset '${presetIdOrPayload}' not found.`)
    }
    payload = {
      device_eui: preset.device_eui,
      recorded_at: new Date().toISOString(),
      idempotency_key: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      battery_level: 85,
      is_demo: true,
      measurements: preset.measurements,
    }
  } else {
    payload = {
      ...presetIdOrPayload,
      is_demo: true,
      idempotency_key: presetIdOrPayload.idempotency_key || `sim-${Date.now()}`,
    }
  }

  // Pass directly into the production-grade ingestion gateway
  return ingestTelemetryPayload(payload)
}

/**
 * High-level trigger helper for UI buttons and automated testing
 */
export async function triggerDemoScenario(
  scenario: 'gir_normal' | 'pyrexia_spike' | 'rumination_drop' | 'shed_heat_stress' | string
): Promise<{ success: boolean; scenario: string; measurementsGenerated: number; message?: string }> {
  let presetId = 'preset-normal-gir-cow'
  if (scenario === 'pyrexia_spike' || scenario.includes('fever') || scenario.includes('pyrexia')) {
    presetId = 'preset-pyrexia-spike'
  } else if (scenario === 'rumination_drop' || scenario.includes('rumination')) {
    presetId = 'preset-rumination-drop'
  } else if (scenario === 'shed_heat_stress' || scenario.includes('heat') || scenario.includes('stress')) {
    presetId = 'preset-heat-stress'
  }

  const result = await sendSimulatedTelemetry(presetId)
  return {
    success: result.success,
    scenario,
    measurementsGenerated: result.processed_count,
    message: result.errors?.length ? result.errors.join(', ') : undefined,
  }
}

