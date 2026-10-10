// ============================================================
// PASHURAKSHA (पशुरक्षा) — FARMER IOT SMART DEVICES PAGE
// Stage 11: Modular Livestock Health IoT Subsystem
// "Detect Early. Prevent Outbreaks. Protect Livestock."
// ============================================================

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Cpu,
  Wifi,
  WifiOff,
  BatteryCharging,
  BatteryMedium,
  BatteryLow,
  Thermometer,
  Activity,
  Radio,
  Clock,
  RotateCw,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertTriangle,
  Flame,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/i18n'
import {
  getFarmerDevices,
  triggerDemoScenario,
  getDeviceStatusBadgeClass,
} from '@/lib/iot'
import type { IoTDevice } from '@/lib/iot'

export function FarmerDevicesPage() {
  const { user } = useAuth()
  const { language } = useTranslation()

  const [devices, setDevices] = useState<IoTDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('ALL')
  const [simulating, setSimulating] = useState(false)
  const [simulationResult, setSimulationResult] = useState<string | null>(null)

  const ownerId = user?.id || 'demo-farmer'

  const loadDevices = async () => {
    try {
      setLoading(true)
      const data = await getFarmerDevices(ownerId)
      setDevices(data)
    } catch (err) {
      console.error('Failed to load farmer IoT devices:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDevices()
  }, [ownerId])

  const filteredDevices = devices.filter((d) => {
    if (filterType === 'ALL') return true
    if (filterType === 'ACTIVE') return d.status === 'ACTIVE'
    if (filterType === 'OFFLINE') return d.status === 'OFFLINE'
    return d.device_type === filterType
  })

  const activeCount = devices.filter((d) => d.status === 'ACTIVE').length
  const offlineCount = devices.filter((d) => d.status === 'OFFLINE').length
  const assignedCount = devices.filter((d) => d.assigned_animal_id).length

  const handleRunSimulator = async (scenario: 'gir_normal' | 'pyrexia_spike' | 'rumination_drop' | 'shed_heat_stress') => {
    setSimulating(true)
    setSimulationResult(null)
    try {
      const res = await triggerDemoScenario(scenario)
      if (res.success) {
        setSimulationResult(`Simulation ingest succeeded: ${res.scenario} (${res.measurementsGenerated} telemetry points recorded).`)
        await loadDevices()
      } else {
        setSimulationResult(`Simulation notice: ${res.message}`)
      }
    } catch (err: any) {
      setSimulationResult(`Simulation error: ${err.message || 'Unknown'}`)
    } finally {
      setSimulating(false)
    }
  }

  const getBatteryIcon = (batteryLevel: number) => {
    if (batteryLevel > 60) return <BatteryCharging className="w-4 h-4 text-emerald-600" />
    if (batteryLevel > 20) return <BatteryMedium className="w-4 h-4 text-amber-500" />
    return <BatteryLow className="w-4 h-4 text-red-600 animate-pulse" />
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'SMART_EAR_TAG':
        return <Radio className="w-5 h-5 text-[#1B5E3C]" />
      case 'RUMEN_BOLUS':
        return <Activity className="w-5 h-5 text-indigo-700" />
      case 'ENVIRONMENTAL_SENSOR':
        return <Thermometer className="w-5 h-5 text-orange-600" />
      default:
        return <Cpu className="w-5 h-5 text-stone-700" />
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Page Header & Institutional Identity */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase bg-[#1B5E3C] text-white px-2 py-0.5 rounded-[1px]">
              {language === 'hi' ? 'स्मार्ट पशु निगरानी' : 'SMART IOT MONITORING'}
            </span>
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-[1px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
              DEMO / SIMULATED SENSORS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
            {language === 'hi' ? 'स्मार्ट डिवाइस व पशु टेलीमेट्री' : 'Smart Devices & Livestock Telemetry'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
            {language === 'hi'
              ? 'टैग, बोलस व शेड सेंसर्स द्वारा पशुओं के तापमान, गतिविधि व स्वास्थ्य की 24×7 निगरानी।'
              : 'Continuous health signals from paired ear tags, rumen boluses & shed sensors.'}
          </p>
        </div>

        {/* Demo Mode Notice */}
        <div className="bg-stone-50 border border-stone-300 rounded p-3 text-xs text-stone-700 flex items-start gap-2 max-w-md">
          <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-stone-900">
              {language === 'hi' ? 'डेमो डिवाइस सिमुलेशन मोड' : 'Simulated Hardware Mode'}
            </p>
            <p className="text-[11px] text-stone-600">
              {language === 'hi'
                ? 'भौतिक हार्डवेयर न होने पर भी टेस्ट डेटा भेजकर अलर्ट और ग्राफ का परीक्षण करें।'
                : 'Test telemetry validation, alerts, and graphs without physical sensors connected.'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Simulation Banner (if active) */}
      {simulationResult && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{simulationResult}</span>
          </div>
          <button
            onClick={() => setSimulationResult(null)}
            className="text-stone-500 hover:text-stone-800 text-[11px] underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-stone-200 p-4 rounded-[2px] shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium uppercase tracking-wider mb-1">
            <span>{language === 'hi' ? 'कुल उपकरण' : 'Total Devices'}</span>
            <Cpu className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl font-bold font-serif text-stone-900">{devices.length}</div>
          <div className="text-[11px] text-stone-500 mt-1">
            {assignedCount} {language === 'hi' ? 'पशुओं से जुड़े हैं' : 'linked to animals'}
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-4 rounded-[2px] shadow-xs border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium uppercase tracking-wider mb-1">
            <span>{language === 'hi' ? 'सक्रिय ऑनलाइन' : 'Active Online'}</span>
            <Wifi className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-serif text-emerald-800">{activeCount}</div>
          <div className="text-[11px] text-emerald-700 mt-1">
            {language === 'hi' ? 'नियमित सिग्नल प्राप्त' : 'Sending valid heartbeats'}
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-4 rounded-[2px] shadow-xs border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium uppercase tracking-wider mb-1">
            <span>{language === 'hi' ? 'ऑफ़लाइन सेंसर' : 'Offline Sensors'}</span>
            <WifiOff className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-serif text-amber-900">{offlineCount}</div>
          <div className="text-[11px] text-stone-500 mt-1">
            {language === 'hi' ? 'कनेक्टिविटी या बैटरी कमी' : 'Signal loss or discharged'}
          </div>
        </div>

        <div className="bg-stone-50 border border-stone-300 p-4 rounded-[2px] shadow-xs flex flex-col justify-between">
          <div className="text-xs font-medium text-stone-700 mb-2">
            {language === 'hi' ? 'परीक्षण डेटा भेजें' : 'Test Simulation'}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleRunSimulator('gir_normal')}
              disabled={simulating}
              className="text-[11px] font-mono bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 px-2 py-1 rounded shadow-xs"
              title="Simulate normal temperature and rumination"
            >
              Normal
            </button>
            <button
              onClick={() => handleRunSimulator('pyrexia_spike')}
              disabled={simulating}
              className="text-[11px] font-mono bg-red-50 border border-red-300 hover:bg-red-100 text-red-800 px-2 py-1 rounded shadow-xs flex items-center gap-1"
              title="Simulate high fever spike"
            >
              <Flame className="w-3 h-3 text-red-600" /> Fever Spike
            </button>
            <button
              onClick={() => handleRunSimulator('rumination_drop')}
              disabled={simulating}
              className="text-[11px] font-mono bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-900 px-2 py-1 rounded shadow-xs"
              title="Simulate digestive rumination collapse"
            >
              Rumination
            </button>
          </div>
        </div>
      </div>

      {/* 4. Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-2">
        {[
          { key: 'ALL', label: language === 'hi' ? 'सभी उपकरण' : 'All Devices' },
          { key: 'ACTIVE', label: language === 'hi' ? 'सक्रिय (ऑनलाइन)' : 'Active (Online)' },
          { key: 'OFFLINE', label: language === 'hi' ? 'ऑफ़लाइन' : 'Offline' },
          { key: 'SMART_EAR_TAG', label: language === 'hi' ? 'ईयर टैग्स' : 'Smart Ear Tags' },
          { key: 'RUMEN_BOLUS', label: language === 'hi' ? 'रूमेन बोलुस' : 'Rumen Boluses' },
          { key: 'ENVIRONMENTAL_SENSOR', label: language === 'hi' ? 'पर्यावरण शेड' : 'Shed Sensors' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              filterType === tab.key
                ? 'bg-[#1B5E3C] text-white shadow-xs font-semibold'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            {tab.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={loadDevices}
            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded border border-stone-300 text-xs flex items-center gap-1"
            title="Refresh Fleet"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 5. Device Fleet Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-stone-500 font-mono text-xs">
          Loading smart device registry...
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="bg-white border border-stone-300 rounded p-12 text-center max-w-lg mx-auto">
          <Cpu className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-900">
            {language === 'hi' ? 'कोई डिवाइस नहीं मिला' : 'No Devices Found'}
          </h3>
          <p className="text-xs text-stone-600 mt-1 mb-4">
            {language === 'hi'
              ? 'इस फ़िल्टर में कोई पंजीकृत सेंसर नहीं है। डेमो डेटा लोड करने हेतु सिमुलेशन बटन दबाएं।'
              : 'No smart devices match this filter. Use the simulation buttons above to load demo telemetry.'}
          </p>
          <button
            onClick={() => handleRunSimulator('gir_normal')}
            className="bg-[#1B5E3C] text-white text-xs font-semibold px-4 py-2 rounded hover:bg-[#123C2A]"
          >
            Load Sample Devices & Telemetry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map((device) => {
            const isOffline = device.status === 'OFFLINE'
            const badgeClass = getDeviceStatusBadgeClass(device.status)
            const battery = device.battery_level ?? 80

            return (
              <div
                key={device.id}
                className="bg-white border border-stone-200 rounded-[2px] shadow-xs hover:border-stone-400 transition-all flex flex-col justify-between"
              >
                {/* Card Header */}
                <div className="p-4 border-b border-stone-100">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-stone-50 border border-stone-200 rounded">
                        {getDeviceIcon(device.device_type)}
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase text-stone-500">
                          {device.device_type.replace(/_/g, ' ')}
                        </span>
                        <h3 className="text-sm font-bold text-stone-900 font-mono">
                          {device.device_eui}
                        </h3>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${badgeClass}`}>
                        {device.status}
                      </span>
                      {device.is_demo && (
                        <span className="text-[9px] font-mono bg-stone-100 text-stone-600 px-1 py-0.2 rounded border border-stone-300">
                          DEMO DATA
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Animal Association */}
                  <div className="bg-stone-50 border border-stone-200 p-2.5 rounded text-xs mt-3">
                    <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-semibold mb-0.5">
                      {language === 'hi' ? 'संबद्ध पशु' : 'Associated Animal'}:
                    </span>
                    {device.assigned_animal_id ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-stone-900">
                            {device.assigned_animal_tag || 'Animal'}
                          </span>
                          <span className="text-stone-500 text-[11px] ml-1">
                            ({device.assigned_animal_type || 'Livestock'})
                          </span>
                        </div>
                        <Link
                          to={`/farmer/animals/${device.assigned_animal_id}`}
                          className="text-[#1B5E3C] hover:underline text-[11px] font-mono flex items-center gap-0.5"
                        >
                          View Animal <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    ) : (
                      <span className="text-stone-500 italic text-[11px]">
                        {language === 'hi' ? 'कोई पशु संबद्ध नहीं (तैयार)' : 'Unassigned (In Reserve)'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body: Vital Metrics & Battery */}
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-stone-50 p-2 rounded border border-stone-150">
                      <div className="flex items-center justify-between text-stone-500 text-[11px] mb-0.5">
                        <span>Battery</span>
                        {getBatteryIcon(battery)}
                      </div>
                      <span className="font-mono font-bold text-stone-900 text-sm">
                        {battery}%
                      </span>
                    </div>

                    <div className="bg-stone-50 p-2 rounded border border-stone-150">
                      <div className="flex items-center justify-between text-stone-500 text-[11px] mb-0.5">
                        <span>Signal</span>
                        <Wifi className="w-3.5 h-3.5 text-stone-400" />
                      </div>
                      <span className="font-mono font-bold text-stone-900 text-sm">
                        -68 dBm
                      </span>
                    </div>
                  </div>

                  {/* Hardware Offline Warning if applicable */}
                  {isOffline && (
                    <div className="bg-amber-50 border border-amber-200 rounded p-2 text-[11px] text-amber-900 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Device Offline:</strong> Connectivity or battery loss. This does not mean the animal is unhealthy.
                      </span>
                    </div>
                  )}

                  {/* Last Heartbeat */}
                  <div className="text-[11px] text-stone-500 flex items-center justify-between font-mono pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" /> Last Signal:
                    </span>
                    <span>
                      {device.last_communication_at
                        ? new Date(device.last_communication_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Never'}
                    </span>
                  </div>
                </div>

                {/* Card Footer: Detail Link */}
                <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-stone-500">
                    FW: {device.firmware_version || 'v2.4'}
                  </span>
                  <Link
                    to={`/farmer/devices/${device.id}`}
                    className="text-xs font-semibold text-[#1B5E3C] hover:text-[#123C2A] flex items-center gap-1 hover:underline"
                  >
                    View History & Charts &rarr;
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
