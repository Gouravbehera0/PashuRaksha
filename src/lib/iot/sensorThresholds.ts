// ============================================================
// PASHURAKSHA (पशुरक्षा) — SENSOR THRESHOLDS & VETERINARY REFERENCE RANGES
// Stage 11: Species-Specific Health Baselines & Anomaly Cut-offs
// Standards: ICAR-IVRI Clinical Veterinary Reference / OIE Guidelines
// "Detect Early. Prevent Outbreaks. Protect Livestock."
// ============================================================

import type { SpeciesSensorThreshold, SensorMeasurementType } from './iotTypes'

/**
 * Validated species-specific physiological thresholds.
 * Avoids universal thresholds that inaccurately flag normal variations as disease.
 */
export const SPECIES_SENSOR_THRESHOLDS: Record<string, SpeciesSensorThreshold> = {
  Cow: {
    species: 'Cow',
    body_temp_c: {
      min_normal: 38.0,
      max_normal: 39.3,
      critical_hypo: 37.5,
      critical_fever: 39.8,
      absolute_min_plausible: 32.0, // Values below this indicate sensor detached or ambient reading
      absolute_max_plausible: 44.0, // Values above this indicate sensor hardware malfunction
    },
    heart_rate_bpm: {
      min_normal: 48,
      max_normal: 84,
    },
    rumination_min_day: {
      normal_target: 450,
      warning_low: 320,
      critical_collapse: 200,
    },
    activity_index: {
      baseline_drop_threshold_pct: 45, // >45% drop implies recumbency/pain
      spike_threshold_pct: 70, // >70% spike implies restlessness/estrus
    },
  },
  Buffalo: {
    species: 'Buffalo',
    body_temp_c: {
      min_normal: 37.5,
      max_normal: 39.0,
      critical_hypo: 36.8,
      critical_fever: 39.5,
      absolute_min_plausible: 32.0,
      absolute_max_plausible: 44.0,
    },
    heart_rate_bpm: {
      min_normal: 40,
      max_normal: 60,
    },
    rumination_min_day: {
      normal_target: 480,
      warning_low: 340,
      critical_collapse: 220,
    },
    activity_index: {
      baseline_drop_threshold_pct: 50,
      spike_threshold_pct: 75,
    },
  },
  Goat: {
    species: 'Goat',
    body_temp_c: {
      min_normal: 38.5,
      max_normal: 40.0,
      critical_hypo: 38.0,
      critical_fever: 40.5,
      absolute_min_plausible: 33.0,
      absolute_max_plausible: 45.0,
    },
    heart_rate_bpm: {
      min_normal: 70,
      max_normal: 90,
    },
    rumination_min_day: {
      normal_target: 360,
      warning_low: 250,
      critical_collapse: 150,
    },
    activity_index: {
      baseline_drop_threshold_pct: 50,
      spike_threshold_pct: 80,
    },
  },
  Sheep: {
    species: 'Sheep',
    body_temp_c: {
      min_normal: 38.5,
      max_normal: 40.0,
      critical_hypo: 38.0,
      critical_fever: 40.5,
      absolute_min_plausible: 33.0,
      absolute_max_plausible: 45.0,
    },
    heart_rate_bpm: {
      min_normal: 70,
      max_normal: 90,
    },
    rumination_min_day: {
      normal_target: 380,
      warning_low: 260,
      critical_collapse: 160,
    },
    activity_index: {
      baseline_drop_threshold_pct: 50,
      spike_threshold_pct: 80,
    },
  },
  Poultry: {
    species: 'Poultry',
    body_temp_c: {
      min_normal: 40.5,
      max_normal: 42.0,
      critical_hypo: 39.5,
      critical_fever: 42.8,
      absolute_min_plausible: 35.0,
      absolute_max_plausible: 46.0,
    },
    heart_rate_bpm: {
      min_normal: 250,
      max_normal: 350,
    },
  },
}

/**
 * Environmental Thermal Humidity Index (THI) thresholds for dairy sheds
 */
export const ENVIRONMENTAL_THRESHOLDS = {
  ambient_temp_c: {
    normal_max: 30.0,
    heat_stress_warning: 35.0,
    emergency: 42.0,
  },
  ambient_humidity_pct: {
    normal_max: 75.0,
    excessive: 85.0,
  },
  thi_index: {
    comfortable: 72.0,
    mild_stress: 78.0,
    moderate_stress: 88.0,
    severe_emergency: 98.0,
  },
}

/**
 * Device operational thresholds
 */
export const DEVICE_THRESHOLDS = {
  offline_threshold_minutes: 180, // 3 hours without packet -> OFFLINE
  stale_data_hours: 24, // >24 hours without measurement -> STALE
  battery_warning_pct: 20, // Battery below 20%
  battery_critical_pct: 10, // Battery below 10%
  max_future_timestamp_seconds: 900, // 15 mins clock drift allowance
  max_payload_measurements: 50,
}

/**
 * Calculates Temperature-Humidity Index (THI) based on ambient temperature and relative humidity
 * Formula: THI = (1.8 * Tdb + 32) - [(0.55 - 0.0055 * RH) * (1.8 * Tdb - 26)]
 */
export function calculateTHI(tempC: number, rhPercent: number): number {
  const fahrenheit = 1.8 * tempC + 32
  const thi = fahrenheit - (0.55 - 0.0055 * rhPercent) * (fahrenheit - 58)
  return Math.round(thi * 10) / 10
}

/**
 * Returns threshold configuration for animal species (defaults to Cow if unspecified)
 */
export function getSpeciesThresholds(species?: string): SpeciesSensorThreshold {
  if (!species) return SPECIES_SENSOR_THRESHOLDS['Cow']
  return SPECIES_SENSOR_THRESHOLDS[species] || SPECIES_SENSOR_THRESHOLDS['Cow']
}

export type MeasurementEvaluation = {
  isPlausible: boolean
  isNormal: boolean
  severity: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'INVALID'
  ruleTriggered?: string
  clinicalNote?: string
}

/**
 * Evaluates a single sensor measurement against physiological species baselines
 */
export function evaluateMeasurementAgainstBaseline(
  type: SensorMeasurementType,
  value: number,
  species?: string
): MeasurementEvaluation {
  const thresholds = getSpeciesThresholds(species)

  switch (type) {
    case 'BODY_TEMPERATURE': {
      const cfg = thresholds.body_temp_c
      if (value < cfg.absolute_min_plausible || value > cfg.absolute_max_plausible) {
        return {
          isPlausible: false,
          isNormal: false,
          severity: 'INVALID',
          ruleTriggered: `Body temp ${value}°C is outside biological survival limits (${cfg.absolute_min_plausible}°C - ${cfg.absolute_max_plausible}°C)`,
          clinicalNote: 'Suspected hardware sensor detachment, probe failure, or air reading.',
        }
      }
      if (value >= cfg.critical_fever) {
        return {
          isPlausible: true,
          isNormal: false,
          severity: 'CRITICAL',
          ruleTriggered: `Critical pyrexia detected: ${value}°C exceeds critical threshold of ${cfg.critical_fever}°C`,
          clinicalNote: `Acute hyperthermic state in ${thresholds.species}. Immediate clinical examination advised.`,
        }
      }
      if (value <= cfg.critical_hypo) {
        return {
          isPlausible: true,
          isNormal: false,
          severity: 'CRITICAL',
          ruleTriggered: `Critical hypothermia: ${value}°C is below ${cfg.critical_hypo}°C`,
          clinicalNote: `Severe hypothermia or systemic circulatory collapse in ${thresholds.species}.`,
        }
      }
      if (value > cfg.max_normal) {
        return {
          isPlausible: true,
          isNormal: false,
          severity: 'WARNING',
          ruleTriggered: `Elevated temperature: ${value}°C exceeds upper normal ${cfg.max_normal}°C`,
          clinicalNote: `Mild-to-moderate pyrexia in ${thresholds.species}. Monitor for secondary symptoms.`,
        }
      }
      if (value < cfg.min_normal) {
        return {
          isPlausible: true,
          isNormal: false,
          severity: 'WARNING',
          ruleTriggered: `Sub-normal temperature: ${value}°C is below lower normal ${cfg.min_normal}°C`,
          clinicalNote: `Sub-normal reading in ${thresholds.species}. Check environmental exposure and probe placement.`,
        }
      }
      return { isPlausible: true, isNormal: true, severity: 'NORMAL' }
    }

    case 'HEART_RATE': {
      if (!thresholds.heart_rate_bpm) {
        return { isPlausible: true, isNormal: true, severity: 'NORMAL' }
      }
      const cfg = thresholds.heart_rate_bpm
      if (value < 20 || value > 240) {
        return {
          isPlausible: false,
          isNormal: false,
          severity: 'INVALID',
          ruleTriggered: `Heart rate ${value} BPM is outside physiological possibility`,
        }
      }
      if (value > cfg.max_normal * 1.3) {
        return {
          isPlausible: true,
          isNormal: false,
          severity: 'CRITICAL',
          ruleTriggered: `Severe tachycardia: ${value} BPM exceeds ${cfg.max_normal} BPM`,
          clinicalNote: 'Marked tachycardia indicative of acute pain, fever, sepsis, or heat prostration.',
        }
      }
      if (value > cfg.max_normal) {
        return {
          isPlausible: true,
          isNormal: false,
          severity: 'WARNING',
          ruleTriggered: `Elevated heart rate: ${value} BPM`,
          clinicalNote: 'Mild tachycardia or stress-induced elevation.',
        }
      }
      if (value < cfg.min_normal * 0.7) {
        return {
          isPlausible: true,
          isNormal: false,
          severity: 'CRITICAL',
          ruleTriggered: `Severe bradycardia: ${value} BPM is below ${cfg.min_normal} BPM`,
          clinicalNote: 'Depression of cardiovascular conduction or severe vagal response.',
        }
      }
      return { isPlausible: true, isNormal: true, severity: 'NORMAL' }
    }

    case 'RUMINATION_TIME': {
      if (!thresholds.rumination_min_day) {
        return { isPlausible: true, isNormal: true, severity: 'NORMAL' }
      }
      const cfg = thresholds.rumination_min_day
      if (value < 0 || value > 1440) {
        return {
          isPlausible: false,
          isNormal: false,
          severity: 'INVALID',
          ruleTriggered: `Rumination minutes ${value} outside 24h day boundary`,
        }
      }
      if (value <= cfg.critical_collapse) {
        return {
          isPlausible: true,
          isNormal: false,
          severity: 'CRITICAL',
          ruleTriggered: `Severe rumination cessation: ${value} min/day (<${cfg.critical_collapse})`,
          clinicalNote: 'Severe ruminal stasis or complete off-feed condition. Risk of acute digestive failure.',
        }
      }
      if (value <= cfg.warning_low) {
        return {
          isPlausible: true,
          isNormal: false,
          severity: 'WARNING',
          ruleTriggered: `Reduced rumination: ${value} min/day (<${cfg.warning_low})`,
          clinicalNote: 'Early indicator of systemic discomfort, subacute ruminal acidosis, or mastitis.',
        }
      }
      return { isPlausible: true, isNormal: true, severity: 'NORMAL' }
    }

    case 'ACTIVITY_LEVEL': {
      if (value < 0 || value > 250) {
        return {
          isPlausible: false,
          isNormal: false,
          severity: 'INVALID',
          ruleTriggered: `Activity level index ${value} out of calibrated scale`,
        }
      }
      if (value <= 10) {
        return {
          isPlausible: true,
          isNormal: false,
          severity: 'WARNING',
          ruleTriggered: `Severe lethargy / prolonged recumbency: activity index ${value}`,
          clinicalNote: 'Animal immobile for prolonged duration. Potential milk fever, downer syndrome, or severe lameness.',
        }
      }
      return { isPlausible: true, isNormal: true, severity: 'NORMAL' }
    }

    case 'HEAT_INDEX_THI': {
      if (value >= ENVIRONMENTAL_THRESHOLDS.thi_index.severe_emergency) {
        return {
          isPlausible: true,
          isNormal: false,
          severity: 'CRITICAL',
          ruleTriggered: `Severe thermal heat stress index: THI ${value}`,
          clinicalNote: 'Emergency heat stress level. Severe risk of drop in milk yield, heat stroke, and mortality.',
        }
      }
      if (value >= ENVIRONMENTAL_THRESHOLDS.thi_index.mild_stress) {
        return {
          isPlausible: true,
          isNormal: false,
          severity: 'WARNING',
          ruleTriggered: `Moderate heat stress index: THI ${value}`,
          clinicalNote: 'Provide shade, misting fans, and cold clean drinking water.',
        }
      }
      return { isPlausible: true, isNormal: true, severity: 'NORMAL' }
    }

    case 'BATTERY_LEVEL': {
      if (value < 0 || value > 100) {
        return { isPlausible: false, isNormal: false, severity: 'INVALID' }
      }
      if (value <= DEVICE_THRESHOLDS.battery_critical_pct) {
        return {
          isPlausible: true,
          isNormal: false,
          severity: 'CRITICAL',
          ruleTriggered: `Critical battery level: ${value}%`,
          clinicalNote: 'Device requires immediate battery replacement or recharging to maintain surveillance.',
        }
      }
      if (value <= DEVICE_THRESHOLDS.battery_warning_pct) {
        return {
          isPlausible: true,
          isNormal: false,
          severity: 'WARNING',
          ruleTriggered: `Low battery level: ${value}%`,
        }
      }
      return { isPlausible: true, isNormal: true, severity: 'NORMAL' }
    }

    default:
      return { isPlausible: true, isNormal: true, severity: 'NORMAL' }
  }
}
