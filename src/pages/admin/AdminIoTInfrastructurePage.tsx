// ============================================================
// PASHURAKSHA (पशुरक्षा) — ADMIN IOT INFRASTRUCTURE & FLEET OPS
// Stage 11: Modular Livestock Health IoT Subsystem
// Standard: NADRS-II Fleet Hardware Management & Surveillance
// "Detect Early. Prevent Outbreaks. Protect Livestock."
// ============================================================

import { useState, useEffect } from 'react'
import {
  Plus,
  RotateCw,
  CheckCircle2,
  Flame,
  WifiOff,
  Sliders,
  X,
} from 'lucide-react'
import {
  getIoTDeviceKPIStats,
  getAllRegisteredDevices,
  registerNewIoTDevice,
  auditFleetDeviceHeartbeats,
  triggerDemoScenario,
  getDeviceStatusBadgeClass,
} from '@/lib/iot'
import type { IoTDevice, IoTDeviceType } from '@/lib/iot'

interface AdminKpiStats {
  total_devices: number
  active_devices: number
  offline_devices: number
  low_battery_devices: number
  readings_ingested_24h: number
  anomalies_detected_24h: number
}

export function AdminIoTInfrastructurePage() {
  const [kpis, setKpis] = useState<AdminKpiStats | null>(null)
  const [devices, setDevices] = useState<IoTDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Register device modal state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [newSerial, setNewSerial] = useState('')
  const [newType, setNewType] = useState<IoTDeviceType>('SMART_EAR_TAG')
  const [newVillage, setNewVillage] = useState('Rampur Khurd')
  const [newDistrict, setNewDistrict] = useState('Varanasi')

  const loadData = async () => {
    try {
      setLoading(true)
      const [kpiData, deviceData] = await Promise.all([
        getIoTDeviceKPIStats(),
        getAllRegisteredDevices(),
      ])
      setKpis(kpiData)
      setDevices(deviceData)
    } catch (err) {
      console.error('Failed to load admin IoT data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAuditHeartbeats = async () => {
    const updatedCount = await auditFleetDeviceHeartbeats()
    setMessage(`Heartbeat audit complete: ${updatedCount} silent device(s) transitioned to OFFLINE.`)
    await loadData()
  }

  const handleSimulate = async (scenario: 'gir_normal' | 'pyrexia_spike' | 'rumination_drop' | 'shed_heat_stress') => {
    setSimulating(true)
    try {
      const res = await triggerDemoScenario(scenario)
      setMessage(`Simulator execution succeeded: ${res.scenario} (${res.measurementsGenerated} packets ingested).`)
      await loadData()
    } catch (err: any) {
      setMessage(`Simulator notice: ${err.message}`)
    } finally {
      setSimulating(false)
    }
  }

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSerial.trim()) return

    try {
      await registerNewIoTDevice({
        device_eui: newSerial.trim().toUpperCase(),
        device_type: newType,
        village: newVillage,
        district: newDistrict,
        manufacturer: 'Bharat Smart Dairy Tech Ltd',
        firmware_version: 'v2.4.1-prod',
        is_demo: true,
      })
      setMessage(`Device ${newSerial.toUpperCase()} successfully provisioned in registry.`)
      setIsRegisterOpen(false)
      setNewSerial('')
      await loadData()
    } catch (err: any) {
      setMessage(`Registration failed: ${err.message}`)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase bg-[#123C2A] text-white px-2 py-0.5 rounded-[1px]">
              NATIONAL LIVESTOCK IOT INFRASTRUCTURE
            </span>
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-[1px]">
              STAGE 11: FLEET OPS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
            Smart Livestock Telemetry Infrastructure & Fleet Control
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
            Central ingestion pipeline, sensor health diagnostics, and district-level hardware registry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="bg-[#1B5E3C] hover:bg-[#123C2A] text-white text-xs font-semibold px-3 py-2 rounded flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Provision New Sensor
          </button>
          <button
            onClick={loadData}
            className="p-2 border border-stone-300 rounded hover:bg-stone-50 text-stone-700 text-xs"
            title="Refresh Registry"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Feedback Notification */}
      {message && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded text-xs flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="underline text-stone-500 hover:text-stone-800">
            Dismiss
          </button>
        </div>
      )}

      {/* 3. Fleet Health KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-stone-200 p-3.5 rounded-[2px] shadow-xs">
          <span className="text-[10px] uppercase font-bold text-stone-500 block">Total Devices</span>
          <span className="text-2xl font-bold font-serif text-stone-900 font-mono mt-1 block">
            {kpis?.total_devices ?? '--'}
          </span>
          <span className="text-[10px] text-stone-500 mt-0.5 block">Registered fleet</span>
        </div>

        <div className="bg-white border border-stone-200 p-3.5 rounded-[2px] shadow-xs border-l-4 border-l-emerald-600">
          <span className="text-[10px] uppercase font-bold text-stone-500 block">Active Online</span>
          <span className="text-2xl font-bold font-serif text-emerald-800 font-mono mt-1 block">
            {kpis?.active_devices ?? '--'}
          </span>
          <span className="text-[10px] text-emerald-700 mt-0.5 block">Valid heartbeats</span>
        </div>

        <div className="bg-white border border-stone-200 p-3.5 rounded-[2px] shadow-xs border-l-4 border-l-amber-500">
          <span className="text-[10px] uppercase font-bold text-stone-500 block">Offline Devices</span>
          <span className="text-2xl font-bold font-serif text-amber-900 font-mono mt-1 block">
            {kpis?.offline_devices ?? '--'}
          </span>
          <span className="text-[10px] text-stone-500 mt-0.5 block">&gt; 180m silent</span>
        </div>

        <div className="bg-white border border-stone-200 p-3.5 rounded-[2px] shadow-xs border-l-4 border-l-red-500">
          <span className="text-[10px] uppercase font-bold text-stone-500 block">Battery Critical</span>
          <span className="text-2xl font-bold font-serif text-red-800 font-mono mt-1 block">
            {kpis?.low_battery_devices ?? '--'}
          </span>
          <span className="text-[10px] text-red-600 mt-0.5 block">&lt; 20% charge</span>
        </div>

        <div className="bg-white border border-stone-200 p-3.5 rounded-[2px] shadow-xs">
          <span className="text-[10px] uppercase font-bold text-stone-500 block">Ingested (24h)</span>
          <span className="text-2xl font-bold font-serif text-stone-900 font-mono mt-1 block">
            {kpis?.readings_ingested_24h ?? '--'}
          </span>
          <span className="text-[10px] text-stone-500 mt-0.5 block">Telemetry packets</span>
        </div>

        <div className="bg-white border border-stone-200 p-3.5 rounded-[2px] shadow-xs border-l-4 border-l-rose-600">
          <span className="text-[10px] uppercase font-bold text-stone-500 block">Active Alerts</span>
          <span className="text-2xl font-bold font-serif text-rose-800 font-mono mt-1 block">
            {kpis?.anomalies_detected_24h ?? '--'}
          </span>
          <span className="text-[10px] text-rose-600 mt-0.5 block">Requiring review</span>
        </div>
      </div>

      {/* 4. Demo Simulation Control Sandbox */}
      <div className="bg-stone-50 border border-stone-300 rounded-[2px] p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-stone-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">
              Interactive Hardware Telemetry Simulation Testbed
            </h3>
            <span className="text-[10px] font-mono bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded border border-amber-300 font-bold">
              DEMO LAB
            </span>
          </div>
          <span className="text-[11px] text-stone-500">
            Injects realistic packets into ingestion gateway with ICAR-IVRI validation.
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <button
            onClick={() => handleSimulate('gir_normal')}
            disabled={simulating}
            className="p-2.5 bg-white border border-stone-300 rounded hover:bg-stone-100 text-left text-xs transition-all shadow-xs"
          >
            <span className="font-bold text-stone-900 block">1. Normal Gir Cow</span>
            <span className="text-[10px] text-stone-500 block mt-0.5">38.5°C nominal</span>
          </button>

          <button
            onClick={() => handleSimulate('pyrexia_spike')}
            disabled={simulating}
            className="p-2.5 bg-red-50 border border-red-300 rounded hover:bg-red-100 text-left text-xs transition-all shadow-xs"
          >
            <span className="font-bold text-red-900 block flex items-center gap-1">
              <Flame className="w-3 h-3 text-red-600" /> 2. Pyrexia Spike
            </span>
            <span className="text-[10px] text-red-700 block mt-0.5">40.2°C acute fever spike</span>
          </button>

          <button
            onClick={() => handleSimulate('rumination_drop')}
            disabled={simulating}
            className="p-2.5 bg-amber-50 border border-amber-300 rounded hover:bg-amber-100 text-left text-xs transition-all shadow-xs"
          >
            <span className="font-bold text-amber-900 block">3. Rumination Collapse</span>
            <span className="text-[10px] text-amber-700 block mt-0.5">180 min/day digestive drop</span>
          </button>

          <button
            onClick={() => handleSimulate('shed_heat_stress')}
            disabled={simulating}
            className="p-2.5 bg-orange-50 border border-orange-300 rounded hover:bg-orange-100 text-left text-xs transition-all shadow-xs"
          >
            <span className="font-bold text-orange-900 block">4. Dairy Shed Heat Stress</span>
            <span className="text-[10px] text-orange-700 block mt-0.5">THI &gt; 80 heat alert</span>
          </button>

          <button
            onClick={handleAuditHeartbeats}
            disabled={simulating}
            className="p-2.5 bg-stone-100 border border-stone-400 rounded hover:bg-stone-200 text-left text-xs transition-all shadow-xs"
          >
            <span className="font-bold text-stone-900 block flex items-center gap-1">
              <WifiOff className="w-3 h-3 text-stone-600" /> 5. Audit Heartbeats
            </span>
            <span className="text-[10px] text-stone-600 block mt-0.5">Sweep silent sensors offline</span>
          </button>
        </div>
      </div>

      {/* 5. Device Registry Table */}
      <div className="bg-white border border-stone-200 rounded-[2px] p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900">Registered Sensor Fleet Directory</h3>
            <p className="text-xs text-stone-500">
              National registry of RFID ear tags, rumen telemetry boluses, and IoT microclimate gateways.
            </p>
          </div>
          <span className="text-xs font-mono text-stone-600">
            Total Provisioned: {devices.length}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-stone-500">Loading device registry...</div>
        ) : (
          <div className="overflow-x-auto border border-stone-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                <tr>
                  <th className="p-2.5">Sensor EUI</th>
                  <th className="p-2.5">Device Type</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Assigned Animal</th>
                  <th className="p-2.5">Location</th>
                  <th className="p-2.5">Battery</th>
                  <th className="p-2.5">Firmware</th>
                  <th className="p-2.5">Last Communication</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 font-mono text-[11px]">
                {devices.map((d) => {
                  const battery = d.battery_level ?? 80
                  return (
                    <tr key={d.id} className="hover:bg-stone-50">
                      <td className="p-2.5 font-bold text-stone-900">
                        {d.device_eui}
                        {d.is_demo && (
                          <span className="ml-1 text-[9px] bg-stone-100 text-stone-600 px-1 py-0.2 rounded border border-stone-300">
                            DEMO
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-stone-700">{d.device_type.replace(/_/g, ' ')}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getDeviceStatusBadgeClass(d.status)}`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-stone-800">
                        {d.assigned_animal_tag ? (
                          `${d.assigned_animal_tag} (${d.assigned_animal_type || 'Cow'})`
                        ) : (
                          <span className="text-stone-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-2.5 text-stone-600">
                        {d.village || 'Rampur Khurd'}, {d.district || 'Varanasi'}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`font-bold ${
                            battery < 20 ? 'text-red-600' : battery < 60 ? 'text-amber-600' : 'text-emerald-700'
                          }`}
                        >
                          {battery}%
                        </span>
                      </td>
                      <td className="p-2.5 text-stone-500">{d.firmware_version || 'v2.4'}</td>
                      <td className="p-2.5 text-stone-500">
                        {d.last_communication_at
                          ? new Date(d.last_communication_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Never'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Provision Device Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded max-w-md w-full p-5 space-y-4 shadow-xl border border-stone-300">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h3 className="text-sm font-bold text-stone-900">Provision New IoT Sensor</h3>
              <button onClick={() => setIsRegisterOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterDevice} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Sensor EUI / Hardware ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PR-IOT-TAG-9901"
                  value={newSerial}
                  onChange={(e) => setNewSerial(e.target.value)}
                  className="w-full border border-stone-300 rounded p-2 font-mono text-xs focus:outline-none focus:border-[#1B5E3C]"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Sensor Form Factor</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as IoTDeviceType)}
                  className="w-full border border-stone-300 rounded p-2 text-xs focus:outline-none focus:border-[#1B5E3C]"
                >
                  <option value="SMART_EAR_TAG">Smart Ear Tag (Temperature & Movement)</option>
                  <option value="RUMEN_BOLUS">Rumen Telemetry Bolus (Core Body Temp & Rumination)</option>
                  <option value="SMART_COLLAR">Smart Collar (GPS & Activity)</option>
                  <option value="LEG_PEDOMETER">Leg Pedometer (Steps & Lying Time)</option>
                  <option value="ENVIRONMENTAL_SENSOR">Environmental Sensor (Dairy Shed THI)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Village</label>
                  <input
                    type="text"
                    value={newVillage}
                    onChange={(e) => setNewVillage(e.target.value)}
                    className="w-full border border-stone-300 rounded p-2 text-xs focus:outline-none focus:border-[#1B5E3C]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">District</label>
                  <input
                    type="text"
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    className="w-full border border-stone-300 rounded p-2 text-xs focus:outline-none focus:border-[#1B5E3C]"
                  />
                </div>
              </div>

              <div className="bg-amber-50 p-2.5 rounded text-[11px] text-amber-900 border border-amber-200">
                <strong>Simulated Hardware Notice:</strong> Device will be provisioned in Demo Mode (<span className="font-mono">is_demo: true</span>) with test synthetic telemetry enabled.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-3 py-1.5 border border-stone-300 text-stone-600 rounded hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#1B5E3C] hover:bg-[#123C2A] text-white rounded font-semibold"
                >
                  Provision Sensor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
