// ============================================================
// PASHURAKSHA (पशुरक्षा) — FARMER DEVICE DETAIL & TELEMETRY PAGE
// Stage 11: Modular Livestock Health IoT Subsystem
// "Detect Early. Prevent Outbreaks. Protect Livestock."
// ============================================================

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Cpu,
  Thermometer,
  Activity,
  Layers,
  Flame,
  RotateCw,
} from 'lucide-react'
import { useTranslation } from '@/i18n'
import {
  getDeviceById,
  getDeviceTelemetryHistory,
  getHistoricalDeviceAssignments,
  getSpeciesThresholds,
  triggerDemoScenario,
  getDeviceStatusBadgeClass,
} from '@/lib/iot'
import type { IoTDevice, SensorMeasurement, AnimalDeviceAssignment } from '@/lib/iot'

export function FarmerDeviceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { language } = useTranslation()

  const [device, setDevice] = useState<IoTDevice | null>(null)
  const [measurements, setMeasurements] = useState<SensorMeasurement[]>([])
  const [assignments, setAssignments] = useState<AnimalDeviceAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [metricTab, setMetricTab] = useState<'BODY_TEMPERATURE' | 'RUMINATION_TIME' | 'ACTIVITY_LEVEL'>('BODY_TEMPERATURE')
  const [simulating, setSimulating] = useState(false)

  const loadData = async () => {
    if (!id) return
    try {
      setLoading(true)
      const dev = await getDeviceById(id)
      setDevice(dev)
      if (dev) {
        const [history, histAssignments] = await Promise.all([
          getDeviceTelemetryHistory(dev.id, 50),
          getHistoricalDeviceAssignments(dev.id),
        ])
        setMeasurements(history)
        setAssignments(histAssignments)
      }
    } catch (err) {
      console.error('Failed to load device details:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  if (loading) {
    return (
      <div className="p-8 text-center font-mono text-xs text-stone-500">
        Loading sensor telemetry and hardware audit...
      </div>
    )
  }

  if (!device) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <Cpu className="w-12 h-12 text-stone-400 mx-auto" />
        <h2 className="text-lg font-bold text-stone-900">Device Not Found</h2>
        <p className="text-xs text-stone-600">The requested smart livestock sensor ID does not exist in the registry.</p>
        <Link to="/farmer/devices" className="text-xs text-[#1B5E3C] font-semibold hover:underline">
          &larr; Return to Device Fleet
        </Link>
      </div>
    )
  }

  const thresholds = getSpeciesThresholds(device.assigned_animal_type || 'Cow')
  const filteredMeasurements = measurements.filter((m) => m.measurement_type === metricTab)

  const latestTemp = measurements.find((m) => m.measurement_type === 'BODY_TEMPERATURE')
  const latestActivity = measurements.find((m) => m.measurement_type === 'ACTIVITY_LEVEL')
  const latestRumination = measurements.find((m) => m.measurement_type === 'RUMINATION_TIME')

  const handleSimulateFever = async () => {
    setSimulating(true)
    try {
      await triggerDemoScenario('pyrexia_spike')
      await loadData()
    } finally {
      setSimulating(false)
    }
  }

  const battery = device.battery_level ?? 80

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Breadcrumb & Header */}
      <div>
        <Link
          to="/farmer/devices"
          className="text-xs font-semibold text-[#1B5E3C] hover:underline flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Devices
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-200 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-bold uppercase bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-300">
                {device.device_type.replace(/_/g, ' ')}
              </span>
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${getDeviceStatusBadgeClass(device.status)}`}>
                {device.status}
              </span>
              {device.is_demo && (
                <span className="text-[10px] font-mono bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-bold">
                  DEMO SENSOR
                </span>
              )}
            </div>
            <h1 className="text-2xl font-serif font-bold text-stone-900 font-mono">
              {device.device_eui}
            </h1>
            <p className="text-xs text-stone-600 mt-0.5">
              Name: <span className="font-semibold">{device.name}</span> &middot; Firmware: {device.firmware_version || 'v2.4'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-2 border border-stone-300 rounded hover:bg-stone-50 text-stone-700 text-xs flex items-center gap-1"
            >
              <RotateCw className="w-3.5 h-3.5" /> Refresh Telemetry
            </button>
            <button
              onClick={handleSimulateFever}
              disabled={simulating}
              className="bg-red-50 border border-red-300 text-red-800 hover:bg-red-100 px-3 py-2 rounded text-xs font-semibold flex items-center gap-1.5"
            >
              <Flame className="w-3.5 h-3.5 text-red-600" />
              Simulate Fever Spike
            </button>
          </div>
        </div>
      </div>

      {/* 2. Device Hardware & Associated Animal Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Linked Animal Card */}
        <div className="bg-white border border-stone-200 p-4 rounded-[2px] shadow-xs md:col-span-2">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
              {language === 'hi' ? 'संबद्ध पशु विवरण' : 'Paired Livestock Health Profile'}
            </span>
            {device.assigned_animal_id && (
              <Link
                to={`/farmer/animals/${device.assigned_animal_id}`}
                className="text-xs text-[#1B5E3C] hover:underline font-semibold"
              >
                Full Medical Profile &rarr;
              </Link>
            )}
          </div>

          {device.assigned_animal_id ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-stone-500 uppercase block font-semibold">Animal Tag</span>
                <span className="font-bold text-stone-900 text-sm font-mono">{device.assigned_animal_tag || 'PR-COW-001'}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 uppercase block font-semibold">Species</span>
                <span className="font-medium text-stone-800">{device.assigned_animal_type || 'Cow'}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 uppercase block font-semibold">Village Centroid</span>
                <span className="font-mono font-medium text-stone-800">{device.village || 'Rampur Khurd'}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 uppercase block font-semibold">Normal Temp Range</span>
                <span className="font-mono text-stone-700">
                  {thresholds.body_temp_c.min_normal}°C - {thresholds.body_temp_c.max_normal}°C
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-stone-500 text-xs italic bg-stone-50 rounded">
              Device currently unassigned. Telemetry will be saved as hardware background data.
            </div>
          )}
        </div>

        {/* Battery & Signal Health */}
        <div className="bg-white border border-stone-200 p-4 rounded-[2px] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-600 block border-b border-stone-100 pb-2 mb-3">
            Telemetry Radio & Battery
          </span>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-stone-600">Battery Level</span>
              <span className="font-mono font-bold text-stone-900">{battery}%</span>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  battery > 60
                    ? 'bg-emerald-600'
                    : battery > 20
                    ? 'bg-amber-500'
                    : 'bg-red-600'
                }`}
                style={{ width: `${battery}%` }}
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-stone-600">Radio Signal (RSSI)</span>
              <span className="font-mono text-stone-800">-68 dBm</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-100">
              <span>Last Communication:</span>
              <span className="font-mono">
                {device.last_communication_at ? new Date(device.last_communication_at).toLocaleTimeString() : 'Never'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Latest Physiological Readings Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Body Temperature Card */}
        <div className="bg-white border border-stone-200 p-4 rounded-[2px] shadow-xs border-l-4 border-l-rose-600">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">Body Temperature</span>
            <Thermometer className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold font-serif text-stone-900 font-mono">
              {latestTemp ? latestTemp.value : '--'}
            </span>
            <span className="text-stone-600 text-sm font-semibold">°C</span>
          </div>
          <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between">
            <span>Normal: {thresholds.body_temp_c.min_normal} - {thresholds.body_temp_c.max_normal} °C</span>
            <span
              className={`font-semibold ${
                latestTemp?.is_flagged_for_review
                  ? 'text-red-600 font-bold'
                  : 'text-emerald-700'
              }`}
            >
              {latestTemp?.is_flagged_for_review ? 'ALERT: Abnormal' : 'Normal'}
            </span>
          </div>
        </div>

        {/* Rumination Card */}
        <div className="bg-white border border-stone-200 p-4 rounded-[2px] shadow-xs border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">Rumination Time</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold font-serif text-stone-900 font-mono">
              {latestRumination ? latestRumination.value : '--'}
            </span>
            <span className="text-stone-600 text-sm font-semibold">min/day</span>
          </div>
          <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between">
            <span>Target: &gt; {thresholds.rumination_min_day?.warning_low ?? 320} min/day</span>
            <span
              className={`font-semibold ${
                latestRumination && latestRumination.value < (thresholds.rumination_min_day?.warning_low ?? 320)
                  ? 'text-amber-600 font-bold'
                  : 'text-emerald-700'
              }`}
            >
              {latestRumination && latestRumination.value < (thresholds.rumination_min_day?.warning_low ?? 320) ? 'Low Rumination' : 'Normal Chewing'}
            </span>
          </div>
        </div>

        {/* Activity Card */}
        <div className="bg-white border border-stone-200 p-4 rounded-[2px] shadow-xs border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">Activity Level</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold font-serif text-stone-900 font-mono">
              {latestActivity ? latestActivity.value : '--'}
            </span>
            <span className="text-stone-600 text-sm font-semibold">index</span>
          </div>
          <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between">
            <span>Baseline: 40 - 150</span>
            <span className="font-semibold text-emerald-700">Stable</span>
          </div>
        </div>
      </div>

      {/* 4. Telemetry Time-Series Chart */}
      <div className="bg-white border border-stone-200 rounded-[2px] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              {language === 'hi' ? 'समय-श्रृंखला टेलीमेट्री रुझान' : 'Telemetry Time-Series Trends'}
            </h3>
            <p className="text-xs text-stone-500">
              Physiological signals with ICAR-IVRI bounds ({thresholds.body_temp_c.min_normal}°C - {thresholds.body_temp_c.max_normal}°C for {device.assigned_animal_type || 'Cow'})
            </p>
          </div>

          {/* Metric Selector */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded text-xs font-medium">
            <button
              onClick={() => setMetricTab('BODY_TEMPERATURE')}
              className={`px-3 py-1 rounded transition-colors ${
                metricTab === 'BODY_TEMPERATURE'
                  ? 'bg-white shadow-xs text-stone-900 font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Temperature (°C)
            </button>
            <button
              onClick={() => setMetricTab('RUMINATION_TIME')}
              className={`px-3 py-1 rounded transition-colors ${
                metricTab === 'RUMINATION_TIME'
                  ? 'bg-white shadow-xs text-stone-900 font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Rumination (min)
            </button>
            <button
              onClick={() => setMetricTab('ACTIVITY_LEVEL')}
              className={`px-3 py-1 rounded transition-colors ${
                metricTab === 'ACTIVITY_LEVEL'
                  ? 'bg-white shadow-xs text-stone-900 font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Activity
            </button>
          </div>
        </div>

        {/* Visual Chart Bars / Plot */}
        {filteredMeasurements.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-500">
            No telemetry points recorded for this metric yet.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="h-44 w-full flex items-end gap-2 pt-6 pb-2 border-b border-stone-200 overflow-x-auto">
              {filteredMeasurements.slice(0, 24).reverse().map((point, idx) => {
                const val = point.value
                let pct = 50
                if (metricTab === 'BODY_TEMPERATURE') {
                  pct = Math.min(100, Math.max(10, ((val - 35) / (43 - 35)) * 100))
                } else if (metricTab === 'RUMINATION_TIME') {
                  pct = Math.min(100, Math.max(10, (val / 600) * 100))
                } else {
                  pct = Math.min(100, Math.max(10, (val / 160) * 100))
                }

                const isWarning = point.is_flagged_for_review

                return (
                  <div
                    key={point.id || idx}
                    className="flex-1 min-w-[28px] max-w-[40px] flex flex-col items-center group relative"
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-10 hidden group-hover:flex flex-col items-center bg-stone-900 text-white text-[10px] font-mono px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none shadow-md">
                      <span>{val} {point.unit}</span>
                      <span className="text-[9px] text-stone-300">
                        {new Date(point.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Bar */}
                    <div
                      className={`w-full rounded-t transition-all ${
                        isWarning
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-[#1B5E3C] hover:bg-[#123C2A]'
                      }`}
                      style={{ height: `${pct}%` }}
                    />
                    <span className="text-[9px] font-mono text-stone-500 mt-1 truncate">
                      {new Date(point.recorded_at).toLocaleTimeString([], { hour: '2-digit' })}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-[#1B5E3C] rounded-xs inline-block" /> Normal In-Range
                <span className="w-3 h-3 bg-red-500 rounded-xs inline-block ml-3" /> Flagged Out-of-Range
              </span>
              <span>Showing last {Math.min(filteredMeasurements.length, 24)} readings</span>
            </div>
          </div>
        )}
      </div>

      {/* 5. Historical Animal Assignment Audit Trail (Req 4.6) */}
      <div className="bg-white border border-stone-200 rounded-[2px] p-5 shadow-xs">
        <div className="border-b border-stone-100 pb-2 mb-3">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-stone-500" />
            Device Assignment Audit Trail (Immutable Assignment Intervals)
          </h3>
          <p className="text-xs text-stone-500">
            Historical audit log ensuring past telemetry remains attached to the animal wearing the device at that specific timestamp.
          </p>
        </div>

        {assignments.length === 0 ? (
          <div className="text-xs text-stone-500 italic py-3">No historical reassignments recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-stone-200">
              <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                <tr>
                  <th className="p-2.5">Animal ID</th>
                  <th className="p-2.5">Assigned On</th>
                  <th className="p-2.5">Unassigned On</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Operator</th>
                  <th className="p-2.5">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 font-mono text-[11px]">
                {assignments.map((asg) => (
                  <tr key={asg.id} className="hover:bg-stone-50">
                    <td className="p-2.5 font-bold text-stone-900">{asg.animal_tag || asg.animal_id}</td>
                    <td className="p-2.5 text-stone-600">
                      {new Date(asg.assigned_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="p-2.5 text-stone-600">
                      {asg.unassigned_at
                        ? new Date(asg.unassigned_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                        : 'Currently Active'}
                    </td>
                    <td className="p-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          asg.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {asg.is_active ? 'ACTIVE' : 'HISTORICAL'}
                      </span>
                    </td>
                    <td className="p-2.5 text-stone-700">{asg.assigned_by}</td>
                    <td className="p-2.5 text-stone-500">{asg.assignment_reason || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Raw Telemetry Ingestion Log */}
      <div className="bg-white border border-stone-200 rounded-[2px] p-5 shadow-xs">
        <h3 className="text-sm font-bold text-stone-900 mb-3">
          Raw Telemetry Ingestion Log (Last 50 Packets)
        </h3>
        <div className="overflow-x-auto max-h-72 overflow-y-auto border border-stone-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200 sticky top-0">
              <tr>
                <th className="p-2">Timestamp</th>
                <th className="p-2">Metric Type</th>
                <th className="p-2">Value</th>
                <th className="p-2">Flag Status</th>
                <th className="p-2">Validation Status</th>
                <th className="p-2">Associated Animal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 font-mono text-[11px]">
              {measurements.map((m) => (
                <tr key={m.id} className="hover:bg-stone-50">
                  <td className="p-2 text-stone-500">
                    {new Date(m.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="p-2 font-bold text-stone-800">{m.measurement_type}</td>
                  <td className="p-2 font-bold">
                    {m.value} <span className="font-normal text-stone-500">{m.unit}</span>
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        m.is_flagged_for_review ? 'bg-red-100 text-red-800 font-bold' : 'bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      {m.is_flagged_for_review ? 'ANOMALOUS' : 'NORMAL'}
                    </span>
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        m.quality_status === 'VALID'
                          ? 'bg-stone-100 text-stone-700'
                          : 'bg-amber-100 text-amber-900 font-bold'
                      }`}
                    >
                      {m.quality_status}
                    </span>
                  </td>
                  <td className="p-2 text-stone-600">{m.animal_tag || m.animal_id || 'UNASSIGNED'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
