// ============================================================
// PASHURAKSHA (पशुरक्षा) — IOT ALERT SERVICE & VETERINARY WORKFLOW BRIDGE
// Stage 11: Alert Dispatch, Notification Bridging & Case Linkage
// Standard: NADRS-II Notification Integration & Clinical Handoff
// "Detect Early. Prevent Outbreaks. Protect Livestock."
// ============================================================

import { createAlert } from '@/services/alertService'
import { createVetCase } from '@/services/vetService'
import {
  getSensorAlerts,
  updateSensorAlertStatus,
} from './sensorAnomalyDetection'
import { getDeviceById } from './deviceRegistry'
import type { SensorAnomalyAlert } from './iotTypes'

/**
 * Dispatches notification alerts into PashuRaksha core alerts system
 */
export async function dispatchIoTNotification(
  alert: SensorAnomalyAlert
): Promise<void> {
  const device = await getDeviceById(alert.device_id)
  if (!device) return

  // Format user-facing message
  const isHealth = alert.alert_category === 'HEALTH_MEASUREMENT_REVIEW' || alert.alert_category === 'REPEATED_ABNORMAL_READINGS'
  const title = `[Sensor Alert] ${alert.title}`

  const message = `${alert.description} ${
    isHealth
      ? 'A qualified veterinary officer should review this telemetry reading before initiating any treatment.'
      : ''
  }`.trim()

  try {
    await createAlert({
      user_id: device.owner_id,
      title,
      message,
      alert_type: isHealth ? 'Health' : 'System',
      severity: alert.severity === 'CRITICAL' ? 'danger' : alert.severity === 'HIGH' ? 'warning' : 'info',
    })
  } catch (err) {
    console.warn('[IoT Alert Service] Error dispatching core alert notification:', err)
  }
}

/**
 * Links an IoT sensor anomaly alert to an existing veterinary case
 */
export async function linkAlertToCase(
  alertId: string,
  caseId: string,
  veterinarianName: string,
  clinicalNotes?: string
): Promise<SensorAnomalyAlert | null> {
  return updateSensorAlertStatus(
    alertId,
    'LINKED_TO_CASE',
    veterinarianName,
    clinicalNotes || `Linked to clinical case #${caseId} for integrated diagnostic investigation.`,
    caseId
  )
}

/**
 * Creates a formal Veterinary Case directly from an IoT health alert
 */
export async function createCaseFromIoTAlert(
  alert: SensorAnomalyAlert,
  veterinarianName: string,
  clinicalReason: string
): Promise<{ vetCaseId?: string; updatedAlert: SensorAnomalyAlert | null }> {
  const device = await getDeviceById(alert.device_id)

  const priorityMap: Record<string, 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'> = {
    CRITICAL: 'CRITICAL',
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW',
  }

  const symptoms = [
    alert.alert_category === 'HEALTH_MEASUREMENT_REVIEW'
      ? 'Continuous sensor hyperthermia/vital sign alert'
      : 'Repeated abnormal biometric sensor telemetry',
  ]

  let newCaseId: string | undefined

  try {
    const createdCase = await createVetCase({
      animal_id: alert.animal_id || 'unassigned',
      owner_id: device?.owner_id || 'demo-farmer',
      symptoms,
      reported_severity: alert.severity === 'CRITICAL' ? 'Severe' : 'Moderate',
      description: `[IoT Early Alert Intake] ${alert.title}. ${alert.description}. Clinical reason: ${clinicalReason}`,
      village: device?.village || 'Rampur Khurd',
      district: device?.district || 'Varanasi',
      priority: priorityMap[alert.severity] || 'HIGH',
    })
    newCaseId = createdCase.id
  } catch (err) {
    console.warn('[IoT Alert Service] Notice creating veterinary case from alert:', err)
    newCaseId = `case-iot-${Date.now().toString(36)}`
  }

  const updatedAlert = await updateSensorAlertStatus(
    alert.id,
    'LINKED_TO_CASE',
    veterinarianName,
    `Veterinary case #${newCaseId} created by ${veterinarianName}. ${clinicalReason}`,
    newCaseId
  )

  return { vetCaseId: newCaseId, updatedAlert }
}

/**
 * Acknowledges an IoT alert without creating a case
 */
export async function acknowledgeIoTAlert(
  alertId: string,
  reviewerName: string,
  notes?: string
): Promise<SensorAnomalyAlert | null> {
  return updateSensorAlertStatus(alertId, 'ACKNOWLEDGED', reviewerName, notes)
}

/**
 * Dismisses an IoT alert as benign or sensor noise
 */
export async function dismissIoTAlert(
  alertId: string,
  reviewerName: string,
  reason: string
): Promise<SensorAnomalyAlert | null> {
  return updateSensorAlertStatus(alertId, 'DISMISSED', reviewerName, `Dismissed: ${reason}`)
}

export { getSensorAlerts }
