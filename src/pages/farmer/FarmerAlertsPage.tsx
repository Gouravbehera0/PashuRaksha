import { useState, useEffect } from 'react'
import {
  Bell, AlertTriangle, ShieldAlert, Info,
  RefreshCw, Check
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getAlerts, markAlertAsRead } from '@/services/alertService'
import type { Alert } from '@/types'

export function FarmerAlertsPage() {
  const { user } = useAuth()
  const userId = user?.id || 'demo-farmer'

  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('All')

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await getAlerts(userId)
      setAlerts(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [userId])

  const handleMarkAsRead = async (id: string) => {
    await markAlertAsRead(id)
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
    )
  }

  const handleMarkAllAsRead = async () => {
    const unread = alerts.filter((a) => !a.is_read)
    for (const a of unread) {
      await markAlertAsRead(a.id)
    }
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })))
  }

  const filtered = alerts.filter((a) => {
    if (filter === 'All') return true
    if (filter === 'Unread') return !a.is_read
    if (filter === 'Outbreak') return a.alert_type === 'Outbreak'
    if (filter === 'Vaccination') return a.alert_type === 'Vaccination'
    if (filter === 'Veterinary') return a.alert_type === 'Veterinary'
    return true
  })

  const unreadCount = alerts.filter((a) => !a.is_read).length

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-5 max-w-5xl mx-auto">
      {/* 1. Header */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs border-l-4 border-l-[#1B5E3C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#1B5E3C] text-white px-2 py-0.5 rounded-[1px]">
              BIOSECURITY DISPATCH
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              UNREAD ALERTS: {unreadCount}
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#102A43] font-sans">
            सतर्कता एवं सूचना केंद्र &middot; Biosecurity &amp; Advisory Center
          </h1>
          <p className="text-xs text-stone-600 mt-0.5 font-sans">
            Official containment alerts from the District Veterinary Office regarding active outbreaks, quarantine cordons, and vaccination drives.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadData}
            className="p-2 border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 rounded-[2px] transition-colors cursor-pointer"
            title="Refresh Alerts"
            aria-label="Refresh Alerts"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold rounded-[2px] transition-colors font-mono cursor-pointer"
            >
              <Check size={14} />
              <span>MARK ALL AS READ</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Filter Pills */}
      <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
        {['All', 'Unread', 'Outbreak', 'Vaccination', 'Veterinary'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-[2px] font-bold border transition-colors cursor-pointer ${
              filter === tab
                ? 'bg-[#102A43] text-white border-[#102A43]'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
            }`}
          >
            {tab === 'All'
              ? `All (${alerts.length})`
              : tab === 'Unread'
              ? `Unread (${unreadCount})`
              : tab}
          </button>
        ))}
      </div>

      {/* 3. Alerts Stream */}
      {loading ? (
        <div className="p-8 text-center text-xs text-stone-500 bg-white border border-stone-300">
          Loading alerts stream...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-stone-300 p-8 rounded-[2px] text-center space-y-2">
          <Bell size={24} className="text-stone-400 mx-auto" />
          <h3 className="text-sm font-bold text-[#102A43]">No Alerts In This Category</h3>
          <p className="text-xs text-stone-500">
            No active biosecurity alerts matching your selection.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alt) => {
            let borderStyle = 'border-l-4 border-l-[#102A43]'
            let badgeStyle = 'bg-stone-100 text-stone-800'
            let icon = <Info size={16} className="text-[#102A43]" />

            if (alt.severity === 'danger' || alt.severity === 'critical') {
              borderStyle = 'border-l-4 border-l-[#C62828]'
              badgeStyle = 'bg-[#FDF0EE] text-[#C62828] border border-[#C62828]/30 font-bold'
              icon = <ShieldAlert size={16} className="text-[#C62828]" />
            } else if (alt.severity === 'warning') {
              borderStyle = 'border-l-4 border-l-[#E0A11A]'
              badgeStyle = 'bg-[#FFF8E6] text-[#8C5D00] border border-[#E0A11A]/40 font-bold'
              icon = <AlertTriangle size={16} className="text-[#8C5D00]" />
            }

            return (
              <div
                key={alt.id}
                className={`bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${borderStyle} ${
                  alt.is_read ? 'opacity-85' : 'ring-1 ring-stone-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">{icon}</div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded-[1px] ${badgeStyle}`}>
                        {alt.alert_type} ADVISORY
                      </span>
                      {!alt.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[#C62828]" title="Unread Alert" />
                      )}
                      <span className="text-[10px] font-mono text-stone-400">
                        {new Date(alt.created_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#102A43] mt-1 font-sans">
                      {alt.title}
                    </h3>
                    <p className="text-xs text-stone-700 mt-1 leading-relaxed">
                      {alt.message}
                    </p>
                  </div>
                </div>

                {!alt.is_read && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(alt.id)}
                    className="self-end sm:self-start px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-mono font-bold rounded-[2px] transition-colors cursor-pointer shrink-0"
                  >
                    MARK READ
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
