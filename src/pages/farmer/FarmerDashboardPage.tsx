import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Phone, ShieldAlert, Heart, Syringe,
  Plus, FileText, Bell, ArrowRight, Activity, Clock, AlertTriangle, ShieldCheck,
  WifiOff, RefreshCw, Cpu, Radio, MapPin, Wifi, ChevronDown, ChevronRight
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/i18n'
import { useSyncState } from '@/services/offline'
import { getFarmerStats, getRecentHealthActivity } from '@/services/farmerService'
import { getAlerts } from '@/services/alertService'
import { AnimalIcon } from '@/components/ui/AnimalIcon'
import { DashboardIntro } from '@/components/dashboard/DashboardIntro'
import type { FarmerStats, RecentHealthActivity, Alert } from '@/types'

function BovineOutlineIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 8C3 6 4 3 6 3C8 3 8 5 9 7" />
      <path d="M20 8C21 6 20 3 18 3C16 3 16 5 15 7" />
      <rect x="7" y="7" width="10" height="11" rx="2" />
      <circle cx="10" cy="11" r="1" fill="currentColor" />
      <circle cx="14" cy="11" r="1" fill="currentColor" />
      <ellipse cx="12" cy="15" rx="2.5" ry="1.5" />
    </svg>
  )
}

export function FarmerDashboardPage() {
  const { user } = useAuth()
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const { isOnline, pendingCount, triggerSync, lifecycleState } = useSyncState()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<FarmerStats>({
    total_livestock: 0,
    healthy: 0,
    under_observation: 0,
    high_risk: 0,
    vaccinations_due: 0,
  })
  const [activities, setActivities] = useState<RecentHealthActivity[]>([])
  const [criticalAlerts, setCriticalAlerts] = useState<Alert[]>([])

  const ownerId = user?.id || 'demo-farmer'

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      try {
        setLoading(true)
        const [statsData, activitiesData, alertsData] = await Promise.all([
          getFarmerStats(ownerId),
          getRecentHealthActivity(ownerId),
          getAlerts(ownerId),
        ])
        if (isMounted) {
          setStats(statsData)
          setActivities(activitiesData)
          setCriticalAlerts(alertsData.filter((a) => !a.is_read && (a.severity === 'danger' || a.severity === 'warning')))
        }
      } catch (err) {
        console.error('Error loading farmer dashboard:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadData()
    return () => {
      isMounted = false
    }
  }, [ownerId])

  return (
    <DashboardIntro
      role="farmer"
      roleBadge="किसान डिजिटल स्वास्थ्य कमान · Grassroots Livestock Triage"
      roleTitle="Farmer Livestock Health Command"
    >
      <div className="p-3 sm:p-5 lg:p-6 space-y-5 max-w-6xl mx-auto">
      {/* ─── A. MOBILE VIEW (Android / iOS Portrait — Matches Reference Image) ─── */}
      <div className="block lg:hidden space-y-3.5">
        {/* Title & Status Row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#102A43] tracking-tight font-sans">
              {language === 'hi' ? 'किसान डैशबोर्ड' : 'Farmer Dashboard'}
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-stone-600 mt-0.5">
              <MapPin size={14} className="text-[#1B5E3C] shrink-0 fill-[#1B5E3C]/20" />
              <span>Rampur Khurd, Sadar, Varanasi (U.P.)</span>
            </div>
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EBF5EE] text-[#1B5E3C] text-xs font-semibold border border-[#1B5E3C]/20 shadow-xs">
              <Wifi size={14} className="text-[#1B5E3C]" />
              <span>{isOnline ? 'Online' : 'Offline'}</span>
              <ChevronDown size={13} className="text-[#1B5E3C]" />
            </div>
          </div>
        </div>

        {/* Offline Mode / Pending Sync Banner (Mobile) */}
        {(!isOnline || pendingCount > 0) && (
          <div className={`p-3 rounded-xl border shadow-xs flex items-center justify-between gap-2.5 ${
            !isOnline ? 'bg-[#FFFDF7] border-[#E0A11A]' : 'bg-[#EBF5EE] border-[#1B5E3C]'
          }`}>
            <div className="flex items-center gap-2">
              <WifiOff size={18} className={`shrink-0 ${!isOnline ? 'text-[#8C5D00]' : 'text-[#1B5E3C]'}`} />
              <div className="text-xs">
                <span className="font-bold font-mono">
                  {!isOnline ? 'OFFLINE MODE' : `${pendingCount} REPORT(S) READY TO SYNC`}
                </span>
              </div>
            </div>
            {isOnline && pendingCount > 0 && (
              <button
                type="button"
                onClick={() => triggerSync(ownerId)}
                disabled={lifecycleState === 'SYNCING'}
                className="px-2.5 py-1 bg-[#1B5E3C] text-white text-[10px] font-bold rounded-lg font-mono"
              >
                {lifecycleState === 'SYNCING' ? 'SYNCING...' : 'SYNC NOW'}
              </button>
            )}
          </div>
        )}

        {/* Alert Card 1: Community Outbreak Warning */}
        <div className="bg-white border border-red-200 rounded-xl p-3.5 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <AlertTriangle size={24} className="text-[#E53935] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] font-mono font-bold text-[#C62828] uppercase tracking-wider">
                COMMUNITY OUTBREAK WARNING &middot; क्षेत्रीय चेतावनी
              </p>
              <h3 className="text-sm font-bold text-[#102A43] mt-0.5 truncate">
                {criticalAlerts[0]?.title || 'FMD Vaccination Due Soon'}
              </h3>
              <p className="text-xs text-stone-600 mt-0.5 line-clamp-2">
                {criticalAlerts[0]?.message || 'Foot & Mouth Disease (FMD) booster vaccination is due for Cow #PR-COW-001 on 18 Oct 2026.'}
              </p>
            </div>
          </div>
          <Link
            to="/farmer/alerts"
            className="text-[#C62828] p-1 shrink-0 hover:translate-x-0.5 transition-transform"
            aria-label="View community warning details"
          >
            <ChevronRight size={20} />
          </Link>
        </div>

        {/* Alert Card 2: Immediate Clinical Triage */}
        <div className="bg-[#FFF8F7] border border-red-200 rounded-xl p-3.5 shadow-xs flex items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E53935] animate-pulse shrink-0" />
              <span className="text-[10px] font-mono font-bold text-[#C62828] uppercase tracking-wider">
                IMMEDIATE CLINICAL TRIAGE &middot; त्वरित आपातकाल
              </span>
            </div>
            <h3 className="text-sm font-bold text-[#102A43]">
              {language === 'hi'
                ? 'पशु में बीमारी के लक्षण दिख रहे हैं?'
                : 'Animal showing disease symptoms?'}
            </h3>
            <p className="text-xs text-stone-600 line-clamp-2">
              {language === 'hi'
                ? 'लक्षण दर्ज करें और मोबाइल पशु चिकित्सा इकाई (MVU) बुलाएं।'
                : 'Submit clinical signs immediately to alert your local Veterinary Officer and dispatch MVU.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/farmer/report-health')}
            className="bg-[#C62828] hover:bg-[#A81D1D] active:bg-[#7B1818] text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm transition-colors cursor-pointer text-center leading-tight uppercase font-sans min-h-[44px]"
          >
            <ShieldAlert size={16} className="shrink-0" />
            <span className="text-[10px] sm:text-[11px] leading-tight text-left">
              REPORT<br />HEALTH ISSUE
            </span>
          </button>
        </div>

        {/* Livestock Statistics: Row 1 (2 cols) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Total Livestock */}
          <div className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-xs border-t-4 border-t-[#1B5E3C]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                TOTAL LIVESTOCK
              </span>
              <Heart size={16} className="text-[#1B5E3C]" />
            </div>
            <p className="text-2xl font-bold text-[#102A43] font-sans">
              {loading ? '--' : String(stats.total_livestock).padStart(2, '0')}
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5">Registered head</p>
          </div>

          {/* Healthy */}
          <div className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-xs border-t-4 border-t-[#2E7D32]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                HEALTHY
              </span>
              <ShieldCheck size={16} className="text-[#2E7D32]" />
            </div>
            <p className="text-2xl font-bold text-[#2E7D32] font-sans">
              {loading ? '--' : String(stats.healthy).padStart(2, '0')}
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5">Zero symptoms</p>
          </div>
        </div>

        {/* Livestock Statistics: Row 2 (3 cols) */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Under Observation */}
          <div className="bg-white border border-stone-200 rounded-xl p-2.5 sm:p-3 shadow-xs border-t-4 border-t-[#E0A11A]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500 truncate">
                UNDER OBSERVATION
              </span>
              <Activity size={13} className="text-[#E0A11A] shrink-0" />
            </div>
            <p className="text-2xl font-bold text-[#D97706] font-sans">
              {loading ? '--' : String(stats.under_observation).padStart(2, '0')}
            </p>
            <p className="text-[10px] text-stone-500 mt-0.5 truncate">Active follow-up</p>
          </div>

          {/* High Risk */}
          <div className="bg-white border border-stone-200 rounded-xl p-2.5 sm:p-3 shadow-xs border-t-4 border-t-[#C62828]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500 truncate">
                HIGH RISK
              </span>
              <ShieldAlert size={13} className="text-[#C62828] shrink-0" />
            </div>
            <p className="text-2xl font-bold text-[#C62828] font-sans">
              {loading ? '--' : String(stats.high_risk).padStart(2, '0')}
            </p>
            <p className="text-[10px] text-stone-500 mt-0.5 truncate">Critical triage</p>
          </div>

          {/* Vaccinations Due */}
          <div className="bg-white border border-stone-200 rounded-xl p-2.5 sm:p-3 shadow-xs border-t-4 border-t-[#8A6A3D]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500 truncate">
                VACCINATIONS DUE
              </span>
              <Syringe size={13} className="text-[#8A6A3D] shrink-0" />
            </div>
            <p className="text-2xl font-bold text-[#8A6A3D] font-sans">
              {loading ? '--' : String(stats.vaccinations_due).padStart(2, '0')}
            </p>
            <p className="text-[10px] text-stone-500 mt-0.5 truncate">Next 14 days</p>
          </div>
        </div>

        {/* Quick Actions (4-Col Row) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#102A43]">
              {language === 'hi' ? 'त्वरित कार्य' : 'Quick Actions'}
            </h2>
            <Link
              to="/farmer/animals"
              className="text-xs font-semibold text-[#1B5E3C] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {/* 1. Register Animal */}
            <button
              type="button"
              onClick={() => navigate('/farmer/animals/add')}
              className="bg-white border border-stone-200 rounded-xl p-2 sm:p-2.5 flex flex-col items-center text-center justify-center shadow-xs hover:border-[#1B5E3C] transition-all cursor-pointer group min-h-[90px]"
            >
              <div className="w-10 h-10 rounded-xl bg-[#EBF5EE] text-[#1B5E3C] flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <BovineOutlineIcon className="w-5 h-5 text-[#1B5E3C]" />
              </div>
              <span className="text-[11px] font-bold text-[#102A43] leading-tight">
                Register<br />Animal
              </span>
            </button>

            {/* 2. Report Symptoms */}
            <button
              type="button"
              onClick={() => navigate('/farmer/report-health')}
              className="bg-white border border-stone-200 rounded-xl p-2 sm:p-2.5 flex flex-col items-center text-center justify-center shadow-xs hover:border-[#C62828] transition-all cursor-pointer group min-h-[90px]"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FFF0F0] text-[#C62828] flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <ShieldAlert size={20} className="text-[#C62828]" />
              </div>
              <span className="text-[11px] font-bold text-[#102A43] leading-tight">
                Report<br />Symptoms
              </span>
            </button>

            {/* 3. Report Mortality */}
            <button
              type="button"
              onClick={() => navigate('/farmer/report-mortality')}
              className="bg-white border border-stone-200 rounded-xl p-2 sm:p-2.5 flex flex-col items-center text-center justify-center shadow-xs hover:border-[#102A43] transition-all cursor-pointer group min-h-[90px]"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F0F4F8] text-[#102A43] flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <FileText size={20} className="text-[#102A43]" />
              </div>
              <span className="text-[11px] font-bold text-[#102A43] leading-tight">
                Report<br />Mortality
              </span>
            </button>

            {/* 4. Village Alerts */}
            <button
              type="button"
              onClick={() => navigate('/farmer/alerts')}
              className="bg-white border border-stone-200 rounded-xl p-2 sm:p-2.5 flex flex-col items-center text-center justify-center shadow-xs hover:border-[#D97706] transition-all cursor-pointer group min-h-[90px]"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] text-[#D97706] flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <Bell size={20} className="text-[#D97706]" />
              </div>
              <span className="text-[11px] font-bold text-[#102A43] leading-tight">
                Village<br />Alerts
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── B. DESKTOP VIEW (Screens >= lg — Sovereign Command Architecture) ─── */}
      <div className="hidden lg:block space-y-5">
        {/* 1. Institutional Greeting & National Portal Banner */}
        <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs border-l-4 border-l-[#1B5E3C] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#1B5E3C] text-white px-2 py-0.5 rounded-[1px]">
                {language === 'hi' ? 'पशुपालक सेवा पोर्टल' : 'FARMER PORTAL'} &middot; GIGW SECURE
              </span>
              <span className="text-[10px] font-mono text-stone-500">
                INAPH OWNER ID: IN-2024-88419
              </span>
              <span className="text-[10px] font-mono text-[#1B5E3C] font-semibold bg-[#EBF5EE] px-1.5 py-0.5 rounded-[1px]">
                VILLAGE SURVEILLANCE ACTIVE
              </span>
            </div>
            <h1 className="text-xl font-bold text-[#102A43] font-sans">
              {language === 'hi' ? 'पशु स्वास्थ्य डैशबोर्ड' : 'Farmer Health Dashboard'}
            </h1>
            <p className="text-xs text-stone-600 mt-0.5 font-sans">
              Owner: <strong className="text-[#102A43]">{user?.email?.split('@')[0] || 'Rajendra Singh'}</strong> &middot; Village: Rampur Khurd &middot; Block: Sadar &middot; District: Varanasi (U.P.)
            </p>
          </div>

          {/* 1962 Toll-Free MVU Hotline */}
          <a
            href="tel:1962"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-[#123C2A] text-white text-xs font-bold rounded-[2px] hover:bg-[#1B5E3C] transition-colors shrink-0 border border-[#8A6A3D]/40 font-mono shadow-xs min-h-[44px]"
            title="Connect to National Mobile Veterinary Emergency Dispatch"
          >
            <Phone size={14} className="text-[#8BC34A] animate-pulse" />
            <span>CALL 1962 (TOLL-FREE MVU)</span>
          </a>
        </div>

        {/* Offline Mode / Pending Sync Banner (Desktop) */}
        {(!isOnline || pendingCount > 0) && (
          <div className={`p-4 rounded-[2px] border-2 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            !isOnline ? 'bg-[#FFFDF7] border-[#E0A11A]' : 'bg-[#EBF5EE] border-[#1B5E3C]'
          }`}>
            <div className="flex items-start gap-3">
              <WifiOff size={22} className={`shrink-0 mt-0.5 ${!isOnline ? 'text-[#8C5D00]' : 'text-[#1B5E3C]'}`} />
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-[1px] uppercase ${
                    !isOnline ? 'bg-[#FFF3D6] text-[#8C5D00]' : 'bg-white text-[#1B5E3C]'
                  }`}>
                    {!isOnline ? 'OFFLINE OPERATION MODE' : 'OFFLINE DATA READY FOR SYNC'}
                  </span>
                  {pendingCount > 0 && (
                    <span className="text-[10px] font-mono font-bold bg-[#102A43] text-white px-1.5 py-0.2 rounded-[1px]">
                      {pendingCount} PENDING REPORT(S)
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-800 font-sans mt-1">
                  {!isOnline
                    ? (language === 'hi'
                      ? 'इंटरनेट बंद है। आप रिपोर्ट और लक्षण सामान्य रूप से दर्ज कर सकते हैं — सब कुछ डिवाइस पर सुरक्षित रहेगा और नेटवर्क आने पर अपने आप सिंक होगा।'
                      : 'Device is offline. All reports are securely cached in local IndexedDB and will automatically synchronize with Sadar Veterinary Desk when network returns.')
                    : (language === 'hi'
                      ? `आपके पास ${pendingCount} ऑफ़लाइन रिपोर्ट सिंक होने के लिए तैयार हैं।`
                      : `You have ${pendingCount} offline report(s) ready to upload to government servers.`)}
                </p>
              </div>
            </div>

            {isOnline && pendingCount > 0 && (
              <button
                type="button"
                onClick={() => triggerSync(ownerId)}
                disabled={lifecycleState === 'SYNCING'}
                className="px-4 py-2 bg-[#1B5E3C] hover:bg-[#123C2A] text-white text-xs font-bold rounded-[2px] font-mono transition-colors shrink-0 flex items-center gap-1.5 min-h-[44px] cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={13} className={lifecycleState === 'SYNCING' ? 'animate-spin' : ''} />
                <span>{lifecycleState === 'SYNCING' ? 'SYNCING...' : (language === 'hi' ? 'अभी सिंक करें' : 'SYNC NOW')}</span>
              </button>
            )}
          </div>
        )}

        {/* 2. Urgent Community Advisory Banner (if unread outbreak warnings exist) */}
        {criticalAlerts.length > 0 && (
          <div className="bg-[#FFF8F7] border border-[#C62828] p-3.5 rounded-[2px] shadow-xs flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-[#C62828] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-mono font-bold text-[#C62828] uppercase tracking-wider">
                  COMMUNITY OUTBREAK WARNING &middot; क्षेत्रीय चेतावनी
                </p>
                <p className="text-xs font-bold text-[#7B1818] mt-0.5">
                  {criticalAlerts[0].title}
                </p>
                <p className="text-xs text-stone-700 mt-0.5">
                  {criticalAlerts[0].message}
                </p>
              </div>
            </div>
            <Link
              to="/farmer/alerts"
              className="text-xs font-bold text-[#C62828] hover:underline shrink-0 whitespace-nowrap self-center font-mono"
            >
              VIEW ALL ({criticalAlerts.length}) &rarr;
            </Link>
          </div>
        )}

        {/* 3. Primary Emergency Action Bar — High Contrast for Immediate Triage */}
        <div className="bg-[#FFF8F7] border-2 border-[#C62828] p-4 sm:p-5 rounded-[2px] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C62828] animate-pulse" aria-hidden="true" />
              <span className="text-xs font-mono font-bold text-[#C62828] uppercase tracking-wider">
                IMMEDIATE CLINICAL TRIAGE &middot; त्वरित आपातकाल
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#7B1818]">
              {language === 'hi'
                ? 'पशु में बीमारी के लक्षण दिख रहे हैं? तुरंत रिपोर्ट करें'
                : 'Animal showing disease symptoms? File clinical report'}
            </h2>
            <p className="text-xs text-stone-600 mt-0.5">
              {language === 'hi'
                ? 'ब्लॉक पशु चिकित्सा अधिकारी को सतर्क करने और मोबाइल पशु चिकित्सा इकाई (MVU) बुलाने के लिए लक्षण दर्ज करें।'
                : 'Submit clinical signs immediately to alert your local Veterinary Officer and dispatch Mobile Veterinary Unit (MVU).'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/farmer/report-health')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 py-3.5 px-6 bg-[#C62828] hover:bg-[#A81D1D] active:bg-[#7B1818] text-white font-bold text-sm tracking-wide rounded-[2px] shadow-sm transition-colors min-h-[50px] shrink-0 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C62828]"
          >
            <ShieldAlert size={18} />
            <span>{language === 'hi' ? 'पशु बीमारी रिपोर्ट करें' : 'REPORT HEALTH ISSUE'} &rarr;</span>
          </button>
        </div>

        {/* 4. Live Statistics Grid (Desktop 5 Columns) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Total Livestock */}
          <div className="bg-white border border-stone-300 p-3.5 rounded-[2px] border-t-4 border-t-[#1B5E3C] shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider font-sans">{t('farmer.total_livestock')}</span>
              <Heart size={15} className="text-[#1B5E3C]" />
            </div>
            <p className="text-2xl font-bold font-mono text-[#102A43]">
              {loading ? '--' : String(stats.total_livestock).padStart(2, '0')}
            </p>
            <p className="text-[11px] text-stone-500 mt-1">{language === 'hi' ? 'कुल पंजीकृत पशु' : 'Registered head'}</p>
          </div>

          {/* Healthy */}
          <div className="bg-white border border-stone-300 p-3.5 rounded-[2px] border-t-4 border-t-[#2E7D32] shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider font-sans">{t('farmer.healthy')}</span>
              <ShieldCheck size={15} className="text-[#2E7D32]" />
            </div>
            <p className="text-2xl font-bold font-mono text-[#2E7D32]">
              {loading ? '--' : String(stats.healthy).padStart(2, '0')}
            </p>
            <p className="text-[11px] text-stone-500 mt-1">{language === 'hi' ? 'स्वस्थ एवं सुरक्षित' : 'Zero symptoms'}</p>
          </div>

          {/* Under Observation */}
          <div className="bg-white border border-stone-300 p-3.5 rounded-[2px] border-t-4 border-t-[#E0A11A] shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider font-sans">{t('farmer.under_observation')}</span>
              <Activity size={15} className="text-[#E0A11A]" />
            </div>
            <p className="text-2xl font-bold font-mono text-[#8C5D00]">
              {loading ? '--' : String(stats.under_observation).padStart(2, '0')}
            </p>
            <p className="text-[11px] text-stone-500 mt-1">{language === 'hi' ? 'निगरानी में' : 'Active follow-up'}</p>
          </div>

          {/* High Risk */}
          <div className="bg-white border border-stone-300 p-3.5 rounded-[2px] border-t-4 border-t-[#C62828] shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider font-sans">{t('farmer.high_risk')}</span>
              <ShieldAlert size={15} className="text-[#C62828]" />
            </div>
            <p className="text-2xl font-bold font-mono text-[#C62828]">
              {loading ? '--' : String(stats.high_risk).padStart(2, '0')}
            </p>
            <p className="text-[11px] text-stone-500 mt-1">{language === 'hi' ? 'उच्च जोखिम / गंभीर' : 'Critical triage'}</p>
          </div>

          {/* Vaccinations Due */}
          <div className="bg-white border border-stone-300 p-3.5 rounded-[2px] border-t-4 border-t-[#8A6A3D] shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider font-sans">{t('farmer.vaccinations_due')}</span>
              <Syringe size={15} className="text-[#8A6A3D]" />
            </div>
            <p className="text-2xl font-bold font-mono text-[#8A6A3D]">
              {loading ? '--' : String(stats.vaccinations_due).padStart(2, '0')}
            </p>
            <p className="text-[11px] text-stone-500 mt-1">{language === 'hi' ? 'आगामी 14 दिनों में देय' : 'Next 14 days'}</p>
          </div>
        </div>

        {/* 5. Desktop Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            type="button"
            onClick={() => navigate('/farmer/animals/add')}
            className="p-3.5 bg-white border border-stone-300 rounded-[2px] hover:border-[#1B5E3C] hover:bg-stone-50 transition-all text-left flex flex-col justify-between group shadow-xs cursor-pointer min-h-[52px]"
          >
            <div className="flex items-center justify-between text-stone-400 group-hover:text-[#1B5E3C] mb-2">
              <span className="w-8 h-8 rounded-[2px] bg-[#EBF5EE] text-[#1B5E3C] flex items-center justify-center">
                <Plus size={16} />
              </span>
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#102A43] group-hover:text-[#1B5E3C]">
                {language === 'hi' ? 'पशु पंजीकृत करें' : 'Register Animal'}
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">INAPH Ear Tag</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/farmer/report-health')}
            className="p-3.5 bg-white border border-stone-300 rounded-[2px] hover:border-[#C62828] hover:bg-stone-50 transition-all text-left flex flex-col justify-between group shadow-xs cursor-pointer min-h-[52px]"
          >
            <div className="flex items-center justify-between text-stone-400 group-hover:text-[#C62828] mb-2">
              <span className="w-8 h-8 rounded-[2px] bg-[#FFF8F7] text-[#C62828] flex items-center justify-center">
                <ShieldAlert size={16} />
              </span>
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#102A43] group-hover:text-[#C62828]">
                {language === 'hi' ? 'लक्षण रिपोर्ट करें' : 'Report Symptoms'}
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">Clinical Signs</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/farmer/report-mortality')}
            className="p-3.5 bg-white border border-stone-300 rounded-[2px] hover:border-[#102A43] hover:bg-stone-50 transition-all text-left flex flex-col justify-between group shadow-xs cursor-pointer min-h-[52px]"
          >
            <div className="flex items-center justify-between text-stone-400 group-hover:text-[#102A43] mb-2">
              <span className="w-8 h-8 rounded-[2px] bg-stone-100 text-stone-700 flex items-center justify-center">
                <FileText size={16} />
              </span>
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#102A43] group-hover:text-[#102A43]">
                {language === 'hi' ? 'मृत्यु दर्ज करें' : 'Report Mortality'}
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">Statutory Log</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/farmer/alerts')}
            className="p-3.5 bg-white border border-stone-300 rounded-[2px] hover:border-[#E0A11A] hover:bg-stone-50 transition-all text-left flex flex-col justify-between group shadow-xs cursor-pointer min-h-[52px]"
          >
            <div className="flex items-center justify-between text-stone-400 group-hover:text-[#E0A11A] mb-2">
              <span className="w-8 h-8 rounded-[2px] bg-[#FFFDF7] text-[#8C5D00] flex items-center justify-center">
                <Bell size={16} />
              </span>
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#102A43] group-hover:text-[#8C5D00]">
                {language === 'hi' ? 'सतर्कता संदेश देखें' : 'Village Alerts'}
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">Biosecurity Alerts</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/farmer/devices')}
            className="p-3.5 bg-white border border-stone-300 rounded-[2px] hover:border-[#1B5E3C] hover:bg-stone-50 transition-all text-left flex flex-col justify-between group shadow-xs cursor-pointer min-h-[52px]"
          >
            <div className="flex items-center justify-between text-stone-400 group-hover:text-[#1B5E3C] mb-2">
              <span className="w-8 h-8 rounded-[2px] bg-[#EBF5EE] text-[#1B5E3C] flex items-center justify-center">
                <Cpu size={16} />
              </span>
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#102A43] group-hover:text-[#1B5E3C]">
                {language === 'hi' ? 'स्मार्ट IoT डिवाइस' : 'Smart IoT Devices'}
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">Wearables & Vitals</p>
            </div>
          </button>
        </div>
      </div>

      {/* 6.5. Smart IoT Livestock Telemetry Panel */}
      <div className="bg-white border border-stone-300 rounded-[2px] shadow-xs p-4 border-l-4 border-l-[#1B5E3C] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-[2px] bg-[#EBF5EE] text-[#1B5E3C] flex items-center justify-center shrink-0">
            <Radio size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#102A43]">
                {language === 'hi' ? 'स्मार्ट पशु स्वास्थ्य टेलीमेट्री' : 'Smart Livestock Vitals Telemetry'}
              </h3>
              <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                STAGE 11 IOT
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-0.5">
              {language === 'hi'
                ? 'ईयर टैग व रूमेन बोलुस से 24x7 तापमान, गतिविधि और जुगाली की निरंतर निगरानी।'
                : 'Continuous 24x7 monitoring of body temperature, rumination, and activity via paired smart tags.'}
            </p>
          </div>
        </div>
        <Link
          to="/farmer/devices"
          className="text-xs font-bold text-[#1B5E3C] hover:text-[#123C2A] bg-stone-50 border border-stone-300 hover:bg-stone-100 px-3.5 py-2 rounded-[2px] whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5 font-mono shadow-xs"
        >
          <span>VIEW SENSOR FLEET</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* 7. Recent Health Activity Log */}
      <div className="bg-white border border-stone-300 rounded-[2px] shadow-xs">
        <div className="p-3.5 sm:p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <h3 className="text-sm font-bold text-[#102A43] font-sans">
              {language === 'hi' ? 'हालिया स्वास्थ्य गतिविधि' : 'Recent Livestock Health Activity'}
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Live audit trail of symptom submissions, vaccines administered, and treatments.
            </p>
          </div>
          <Link
            to="/farmer/cases"
            className="text-xs font-bold text-[#1B5E3C] hover:text-[#123C2A] flex items-center gap-1 font-mono"
          >
            <span>TRACK ALL CASES</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {activities.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500">
            No health activities recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-stone-200 overflow-x-auto">
            {activities.map((act) => (
              <div
                key={act.id}
                className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-[2px] bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600 shrink-0">
                    <AnimalIcon type={act.animal_type} className="w-5 h-5 text-[#102A43]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold font-mono text-[#102A43]">
                        {act.animal_tag}
                      </span>
                      <span className="text-[10px] font-mono bg-stone-100 px-1.5 py-0.2 rounded text-stone-600">
                        {act.animal_type}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        act.activity_type === 'Health Report'
                          ? 'bg-[#FFF8F7] text-[#C62828] border border-[#C62828]/20'
                          : act.activity_type === 'Vaccination'
                          ? 'bg-[#EBF5EE] text-[#1B5E3C] border border-[#1B5E3C]/20'
                          : 'bg-[#FFFDF7] text-[#8C5D00] border border-[#E0A11A]/20'
                      }`}>
                        {act.activity_type}
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 mt-0.5 truncate font-sans">
                      {act.status}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono text-stone-400 block flex items-center gap-1 justify-end">
                    <Clock size={11} />
                    {new Date(act.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </span>
                  <Link
                    to="/farmer/cases"
                    className="text-[11px] font-mono font-bold text-[#1B5E3C] hover:underline"
                  >
                    STATUS &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </DashboardIntro>
  )
}
