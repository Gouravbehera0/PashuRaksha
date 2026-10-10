import React, { useState } from 'react'
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  ChevronDown
} from 'lucide-react'
import { useSyncState } from '@/services/offline'
import { useTranslation } from '@/i18n'

interface SyncStatusBadgeProps {
  compact?: boolean
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ compact = false }) => {
  const { isOnline, lifecycleState, pendingCount, lastSyncTime, triggerSync } = useSyncState()
  const { t } = useTranslation()
  const [showDetails, setShowDetails] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const handleManualSync = async () => {
    try {
      setSyncing(true)
      await triggerSync()
    } finally {
      setSyncing(false)
    }
  }

  const isSyncing = lifecycleState === 'SYNCING' || syncing

  return (
    <div className="relative inline-block font-sans text-xs">
      {/* Primary Pill Button */}
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] border font-mono font-bold transition-colors cursor-pointer select-none focus-visible:outline focus-visible:outline-2 ${
          !isOnline
            ? 'bg-[#FDF0EE] text-[#C62828] border-[#C62828]/40'
            : pendingCount > 0
            ? 'bg-amber-50 text-amber-800 border-amber-300'
            : 'bg-[#EBF5EE] text-[#1B5E3C] border-[#1B5E3C]/30'
        }`}
        aria-expanded={showDetails}
        aria-label={`Connection Status: ${isOnline ? 'Online' : 'Offline'}. ${pendingCount} reports pending sync.`}
      >
        {isOnline ? (
          <Wifi size={13} className={pendingCount > 0 ? 'text-amber-600' : 'text-[#1B5E3C]'} />
        ) : (
          <WifiOff size={13} className="text-[#C62828]" />
        )}

        <span>
          {!isOnline
            ? t('sync.offline')
            : pendingCount > 0
            ? `${pendingCount} ${t('sync.pending_sync')}`
            : t('sync.online')}
        </span>

        {pendingCount > 0 && (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        )}

        {!compact && <ChevronDown size={11} className="text-stone-400" />}
      </button>

      {/* Dropdown / Details Popover */}
      {showDetails && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDetails(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 mt-1.5 w-72 bg-white border border-stone-300 rounded-[2px] shadow-lg p-3 z-50 space-y-2.5 text-xs text-stone-700 animate-in fade-in zoom-in-95 duration-100">
            {/* Connection Header */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <span className="font-mono font-bold uppercase tracking-wider text-[10px] text-stone-500">
                SYNCHRONIZATION CENTER
              </span>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-[1px] ${
                isOnline ? 'bg-[#EBF5EE] text-[#1B5E3C]' : 'bg-[#FDF0EE] text-[#C62828]'
              }`}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>

            {/* Pending Reports Counter */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600">Pending Submissions:</span>
                <span className="font-mono font-bold text-[#102A43]">
                  {pendingCount}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-sans">
                {pendingCount > 0
                  ? t('sync.pending_count', { count: pendingCount })
                  : 'All local records are synchronized with the central veterinary registry.'}
              </p>
            </div>

            {/* Last Synced Time */}
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-stone-500 bg-stone-50 p-2 rounded-[2px] border border-stone-200">
              <Clock size={12} className="text-stone-400" />
              <span>
                {lastSyncTime
                  ? t('sync.last_synced', { time: lastSyncTime })
                  : t('sync.never_synced')}
              </span>
            </div>

            {/* Retry Button */}
            <button
              type="button"
              disabled={isSyncing || !isOnline}
              onClick={handleManualSync}
              className={`w-full py-2 px-3 rounded-[2px] font-mono font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                !isOnline
                  ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
                  : 'bg-[#102A43] hover:bg-[#1B5E3C] text-white shadow-xs'
              }`}
            >
              <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? t('sync.syncing') : t('sync.retry_sync')}</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
