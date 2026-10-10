// ============================================================
// PASHURAKSHA (पशुरक्षा) — IOT & SMART LIVESTOCK MONITORING TYPES
// Stage 11: Modular Livestock Health IoT Subsystem
// Standard: NADRS-II Compatible / Veterinary Clinical Reference Standard
// "Detect Early. Prevent Outbreaks. Protect Livestock."
// ============================================================

export type IoTDeviceType =
  | 'SMART_EAR_TAG'
  | 'RUMEN_BOLUS'
  | 'SMART_COLLAR'
  | 'LEG_PEDOMETER'
  | 'ENVIRONMENTAL_SENSOR'
  | 'HANDHELD_CLINICAL_SCANNER'

export type DeviceStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'OFFLINE'
  | 'MAINTENANCE'
  | 'UNREGISTERED'

export type SensorMeasurementType =
  | 'BODY_TEMPERATURE'
  | 'ACTIVITY_LEVEL'
  | 'HEART_RATE'
  | 'RUMINATION_TIME'
  | 'AMBIENT_TEMPERATURE'
  | 'AMBIENT_HUMIDITY'
  | 'HEAT_INDEX_THI'
  | 'BATTERY_LEVEL'
  | 'GPS_LOCATION'

export type DataQualityStatus =
  | 'VALID'
  | 'OUT_OF_RANGE'
  | 'SUSPECT_SPIKE'
  | 'STALE'
  | 'INVALID_CHECKSUM'
  | 'DEMO_DATA'

export type IoTAlertCategory =
  | 'HEALTH_MEASUREMENT_REVIEW'
  | 'REPEATED_ABNORMAL_READINGS'
  | 'DEVICE_OFFLINE'
  | 'SENSOR_DATA_INVALID'
  | 'BATTERY_LOW'
  | 'DEVICE_MAINTENANCE_REQUIRED'

export type IoTAlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export type IoTAlertStatus =
  | 'ACTIVE'
  | 'ACKNOWLEDGED'
  | 'INVESTIGATING'
  | 'LINKED_TO_CASE'
  | 'RESOLVED'
  | 'DISMISSED'

export interface IoTDevice {
  id: string
  device_eui: string
  name: string
  device_type: IoTDeviceType
  manufacturer?: string
  model?: string
  firmware_version?: string
  hardware_version?: string
  battery_level?: number // 0 - 100%
  status: DeviceStatus
  is_demo: boolean
  owner_id: string
  owner_name?: string
  assigned_animal_id?: string
  assigned_animal_tag?: string
  assigned_animal_type?: string
  village?: string
  district?: string
  installation_date?: string
  last_communication_at?: string
  last_measurement_at?: string
  calibration_notes?: string
  created_at: string
  updated_at: string
}

export interface AnimalDeviceAssignment {
  id: string
  device_id: string
  animal_id: string
  animal_tag: string
  owner_id: string
  assigned_at: string
  unassigned_at?: string
  assignment_reason?: string
  is_active: boolean
  assigned_by: string
  created_at: string
}

export interface SensorMeasurement {
  id: string
  device_id: string
  device_eui: string
  animal_id?: string
  animal_tag?: string
  owner_id?: string
  measurement_type: SensorMeasurementType
  value: number
  unit: string
  recorded_at: string // Time on device (WGS-84 ISO)
  received_at: string // Ingestion time at server
  quality_status: DataQualityStatus
  is_late: boolean
  is_flagged_for_review: boolean
  flag_reason?: string
  is_demo: boolean
  idempotency_key?: string
  metadata?: Record<string, any>
}

export interface SensorAnomalyAlert {
  id: string
  alert_category: IoTAlertCategory
  severity: IoTAlertSeverity
  status: IoTAlertStatus
  animal_id?: string
  animal_tag?: string
  device_id: string
  device_eui: string
  triggering_measurement_id?: string
  triggering_value?: number
  triggering_unit?: string
  threshold_rule: string
  detected_at: string
  title: string
  description: string
  clinical_note?: string
  recommended_action: string
  acknowledged_by?: string
  acknowledged_at?: string
  linked_vet_case_id?: string
  is_demo: boolean
  created_at: string
  updated_at: string
}

export interface DeviceEvent {
  id: string
  device_id: string
  device_eui: string
  event_type:
    | 'REGISTERED'
    | 'ASSIGNED'
    | 'UNASSIGNED'
    | 'STATUS_CHANGE'
    | 'BATTERY_CRITICAL'
    | 'FIRMWARE_UPDATE'
    | 'INGESTION_ERROR'
  severity: 'INFO' | 'WARNING' | 'ERROR'
  details: string
  actor_id?: string
  created_at: string
}

export interface IngestionPayload {
  device_eui: string
  device_auth_token?: string
  recorded_at?: string
  idempotency_key?: string
  battery_level?: number
  firmware_version?: string
  measurements: {
    type: SensorMeasurementType
    value: number
    unit: string
    timestamp?: string
    metadata?: Record<string, any>
  }[]
  is_demo?: boolean
}

export interface IngestionResult {
  success: boolean
  device_id?: string
  device_eui: string
  processed_count: number
  rejected_count: number
  errors: string[]
  created_measurements: SensorMeasurement[]
  generated_alerts: SensorAnomalyAlert[]
}

export interface SpeciesSensorThreshold {
  species: string
  body_temp_c: {
    min_normal: number
    max_normal: number
    critical_hypo: number
    critical_fever: number
    absolute_min_plausible: number
    absolute_max_plausible: number
  }
  heart_rate_bpm?: {
    min_normal: number
    max_normal: number
  }
  rumination_min_day?: {
    normal_target: number
    warning_low: number
    critical_collapse: number
  }
  activity_index?: {
    baseline_drop_threshold_pct: number // drop in activity indicating depression/recumbency
    spike_threshold_pct: number // spike indicating agitation/estrus
  }
}

export interface IoTFilterState {
  deviceType: 'All' | IoTDeviceType
  deviceStatus: 'All' | DeviceStatus
  measurementType: 'All' | SensorMeasurementType
  animalId: 'All' | string
  district: string
  village: string
  searchQuery: string
  onlyFlagged: boolean
  onlyDemo: boolean
}

export interface IoTKpiStats {
  total_devices: number
  active_devices: number
  offline_devices: number
  maintenance_devices: number
  monitored_animals: number
  measurements_24h: number
  unacknowledged_alerts: number
  invalid_readings_24h: number
  active_demo_devices: number
}
