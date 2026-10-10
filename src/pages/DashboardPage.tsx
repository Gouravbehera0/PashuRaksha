import { Suspense, lazy } from 'react'
import { AlertTriangle, TrendingUp, Activity, MapPin, ShieldAlert, Radio, FileText, CheckCircle2, Wifi, ChevronDown, ChevronRight, Folder } from 'lucide-react'
import { MetricCard, AlertBanner, RiskBadge, CaseStatusBadge } from '@/components/ui/RiskComponents'
import { WalkingCowLoading } from '@/components/ui/WalkingCowLoading'
import { DashboardIntro } from '@/components/dashboard/DashboardIntro'
import { DEMO_STATS, DEMO_CASES, DEMO_ALERTS } from '@/data/demo'
import { formatDate } from '@/lib/utils'
import { Link } from 'react-router-dom'

// Lazy load map to optimize bundle
const LivestockMap = lazy(() =>
  import('@/components/maps/LivestockMap').then((m) => ({ default: m.LivestockMap }))
)

// Clean vector bovine icon (no cartoon emojis)
function BovineVectorIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-stone-400">
      <path d="M4 8C3 6 4 3 6 3C8 3 8 5 9 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20 8C21 6 20 3 18 3C16 3 16 5 15 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="7" y="7" width="10" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="10" cy="11" r="1" fill="currentColor" />
      <circle cx="14" cy="11" r="1" fill="currentColor" />
      <ellipse cx="12" cy="15" rx="2.5" ry="1.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

export function DashboardPage() {
  return (
    <DashboardIntro
      role="shared"
      roleBadge="राष्ट्रीय पशु स्वास्थ्य निगरानी कमान · National Command Center"
      roleTitle="National Livestock Health Command"
    >
      <div className="p-3 sm:p-5 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* ─── A. MOBILE VIEW (Android / iOS Portrait — Matches Reference Image) ─── */}
      <div className="block lg:hidden space-y-3.5">
        {/* Title & Status Row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#102A43] tracking-tight font-sans">
              National Command Center
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-stone-600 mt-0.5">
              <MapPin size={14} className="text-[#1B5E3C] shrink-0 fill-[#1B5E3C]/20" />
              <span>National Livestock Health Surveillance Network</span>
            </div>
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EBF5EE] text-[#1B5E3C] text-xs font-semibold border border-[#1B5E3C]/20 shadow-xs">
              <Wifi size={14} className="text-[#1B5E3C]" />
              <span>Online</span>
              <ChevronDown size={13} className="text-[#1B5E3C]" />
            </div>
          </div>
        </div>

        {/* Alert Card 1: Outbreak Warning */}
        <div className="bg-white border border-red-200 rounded-xl p-3.5 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <AlertTriangle size={24} className="text-[#E53935] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] font-mono font-bold text-[#C62828] uppercase tracking-wider">
                COMMUNITY OUTBREAK WARNING &middot; क्षेत्रीय चेतावनी
              </p>
              <h3 className="text-sm font-bold text-[#102A43] mt-0.5 truncate">
                FMD Containment Zone Formed
              </h3>
              <p className="text-xs text-stone-600 mt-0.5 line-clamp-2">
                Bulandshahr / Khurja Block: 5km radius biosecurity ring active.
              </p>
            </div>
          </div>
          <Link to="/vet/outbreaks" className="text-[#C62828] p-1 shrink-0">
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
              Active disease signals under investigation
            </h3>
            <p className="text-xs text-stone-600 line-clamp-2">
              National syndromic surveillance network actively evaluating field case clusters.
            </p>
          </div>
          <Link
            to="/vet/cases"
            className="bg-[#C62828] hover:bg-[#A81D1D] active:bg-[#7B1818] text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm transition-colors cursor-pointer text-center leading-tight uppercase font-sans min-h-[44px]"
          >
            <ShieldAlert size={16} className="shrink-0" />
            <span className="text-[10px] sm:text-[11px] leading-tight text-left">
              TRIAGE<br />CASES
            </span>
          </Link>
        </div>

        {/* Statistics: Row 1 (2 cols) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-xs border-t-4 border-t-[#1B5E3C]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              TOTAL LIVESTOCK
            </span>
            <p className="text-2xl font-bold text-[#102A43] font-sans mt-1">
              {DEMO_STATS.total_livestock.toLocaleString()}
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5">Registered head</p>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-xs border-t-4 border-t-[#2E7D32]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              ACTIVE CASES
            </span>
            <p className="text-2xl font-bold text-[#2E7D32] font-sans mt-1">
              {DEMO_STATS.active_cases.toLocaleString()}
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5">Active triage</p>
          </div>
        </div>

        {/* Statistics: Row 2 (3 cols) */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white border border-stone-200 rounded-xl p-2.5 sm:p-3 shadow-xs border-t-4 border-t-[#E0A11A]">
            <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500 block truncate">
              OUTBREAKS
            </span>
            <p className="text-2xl font-bold text-[#D97706] font-sans mt-1">
              {DEMO_STATS.possible_outbreaks.toLocaleString()}
            </p>
            <p className="text-[10px] text-stone-500 mt-0.5 truncate">Cluster alerts</p>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-2.5 sm:p-3 shadow-xs border-t-4 border-t-[#C62828]">
            <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500 block truncate">
              HIGH RISK
            </span>
            <p className="text-2xl font-bold text-[#C62828] font-sans mt-1">
              {DEMO_STATS.high_risk_cases.toLocaleString()}
            </p>
            <p className="text-[10px] text-stone-500 mt-0.5 truncate">Critical triage</p>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-2.5 sm:p-3 shadow-xs border-t-4 border-t-[#8A6A3D]">
            <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500 block truncate">
              VACCINES DUE
            </span>
            <p className="text-2xl font-bold text-[#8A6A3D] font-sans mt-1">
              {DEMO_STATS.vaccinations_due.toLocaleString()}
            </p>
            <p className="text-[10px] text-stone-500 mt-0.5 truncate">Next 14 days</p>
          </div>
        </div>

        {/* Quick Actions (4-Col Row) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#102A43]">
              Quick Actions
            </h2>
            <Link to="/vet/cases" className="text-xs font-semibold text-[#1B5E3C] hover:underline flex items-center gap-1">
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <Link
              to="/vet/cases"
              className="bg-white border border-stone-200 rounded-xl p-2 sm:p-2.5 flex flex-col items-center text-center justify-center shadow-xs hover:border-[#1B5E3C] transition-all group min-h-[90px]"
            >
              <div className="w-10 h-10 rounded-xl bg-[#EBF5EE] text-[#1B5E3C] flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <Folder size={20} className="text-[#1B5E3C]" />
              </div>
              <span className="text-[11px] font-bold text-[#102A43] leading-tight">
                Case<br />Queue
              </span>
            </Link>

            <Link
              to="/admin/surveillance-map"
              className="bg-white border border-stone-200 rounded-xl p-2 sm:p-2.5 flex flex-col items-center text-center justify-center shadow-xs hover:border-[#C62828] transition-all group min-h-[90px]"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FFF0F0] text-[#C62828] flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <MapPin size={20} className="text-[#C62828]" />
              </div>
              <span className="text-[11px] font-bold text-[#102A43] leading-tight">
                GIS<br />Map
              </span>
            </Link>

            <Link
              to="/vet/outbreaks"
              className="bg-white border border-stone-200 rounded-xl p-2 sm:p-2.5 flex flex-col items-center text-center justify-center shadow-xs hover:border-[#102A43] transition-all group min-h-[90px]"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F0F4F8] text-[#102A43] flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <ShieldAlert size={20} className="text-[#102A43]" />
              </div>
              <span className="text-[11px] font-bold text-[#102A43] leading-tight">
                Outbreak<br />Desk
              </span>
            </Link>

            <Link
              to="/admin/analytics"
              className="bg-white border border-stone-200 rounded-xl p-2 sm:p-2.5 flex flex-col items-center text-center justify-center shadow-xs hover:border-[#D97706] transition-all group min-h-[90px]"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] text-[#D97706] flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <TrendingUp size={20} className="text-[#D97706]" />
              </div>
              <span className="text-[11px] font-bold text-[#102A43] leading-tight">
                Epidemic<br />Analytics
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── B. DESKTOP VIEW (Screens >= lg) ─── */}
      <div className="hidden lg:block space-y-5">
      {/* Institutional Command Header */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 border-l-4 border-l-[#1B5E3C]">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#102A43] text-white px-2 py-0.5 rounded-[1px]">
              NATIONAL COMMAND CONSOLE
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              EPIDEMIOLOGICAL SURVEILLANCE & EARLY WARNING NETWORK
            </span>
          </div>
          <h1 className="text-xl lg:text-2xl font-extrabold text-[#102A43] tracking-tight font-sans">
            Livestock Health Command Center
          </h1>
          <p className="text-xs text-stone-600 mt-0.5 font-sans">
            National Surveillance Feed &middot;{' '}
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-[#1B5E3C] bg-[#EBF5EE] border border-[#2E7D32]/40 px-2.5 py-1.5 rounded-[2px] font-mono font-semibold">
            <Radio size={14} className="text-[#1B5E3C] animate-pulse" />
            <span>NADRS-II SYNC: ACTIVE</span>
          </div>
          <span className="text-[10px] font-mono font-bold bg-[#FFF8E6] border border-[#E0A11A]/50 text-[#8C5D00] px-2 py-1.5 rounded-[2px]">
            DEMO SEED DATA
          </span>
        </div>
      </div>

      {/* Critical Biosecurity Alert Banners */}
      <div className="space-y-2">
        {DEMO_ALERTS.filter((a) => !a.is_read && (a.severity === 'critical' || a.severity === 'danger'))
          .slice(0, 2)
          .map((alert) => (
            <AlertBanner
              key={alert.id}
              severity={alert.severity}
              title={alert.title}
              message={alert.message}
              timestamp={formatDate(alert.created_at)}
            />
          ))}
      </div>

      {/* Key National Surveillance Metrics (5 Mandatory Stats) */}
      <section aria-labelledby="surveillance-metrics-heading">
        <h2 id="surveillance-metrics-heading" className="sr-only">
          Key National Surveillance Statistics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetricCard
            label="TOTAL LIVESTOCK"
            value={DEMO_STATS.total_livestock}
            subLabel="Identified & registered in INAPH"
            variant="default"
            icon={<BovineVectorIcon />}
            isDemoData
          />
          <MetricCard
            label="ACTIVE CASES"
            value={DEMO_STATS.active_cases}
            subLabel="Under clinical veterinary triage"
            variant="default"
            icon={<Activity size={24} className="text-stone-400" />}
            isDemoData
          />
          <MetricCard
            label="HIGH-RISK CASES"
            value={DEMO_STATS.high_risk_cases}
            subLabel="Immediate field intervention"
            variant="danger"
            icon={<AlertTriangle size={24} className="text-[#C62828]" />}
            isDemoData
          />
          <MetricCard
            label="POSSIBLE OUTBREAKS"
            value={DEMO_STATS.possible_outbreaks}
            subLabel="Geographic clusters flagged"
            variant="danger"
            icon={<ShieldAlert size={24} className="text-[#C62828]" />}
            isDemoData
          />
          <MetricCard
            label="VACCINATIONS DUE"
            value={DEMO_STATS.vaccinations_due}
            subLabel="Foot & Mouth (FMD) protocol"
            variant="warning"
            icon={<TrendingUp size={24} className="text-[#E0A11A]" />}
            isDemoData
          />
        </div>
      </section>

      {/* Main Command Center Grid: GIS Surveillance Map + Clinical Triage Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* GIS Surveillance Map Panel (8 cols on lg) */}
        <section
          className="lg:col-span-7 xl:col-span-8 bg-white border border-stone-300 rounded-[2px] shadow-xs overflow-hidden flex flex-col"
          aria-labelledby="gis-map-heading"
        >
          <div className="px-4 py-3 bg-[#F7F5EE] border-b border-stone-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-[#1B5E3C]" aria-hidden="true" />
              <h2 id="gis-map-heading" className="text-xs font-bold font-sans uppercase tracking-wider text-[#102A43]">
                National Epidemiological GIS Map
              </h2>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className="flex items-center gap-1 text-[#7B1818] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#7B1818]" aria-hidden="true" />
                Critical Zone
              </span>
              <span className="flex items-center gap-1 text-[#C62828] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#C62828]" aria-hidden="true" />
                High
              </span>
              <span className="flex items-center gap-1 text-[#1B5E3C] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#2E7D32]" aria-hidden="true" />
                Normal
              </span>
            </div>
          </div>

          <div className="h-[360px] lg:h-[420px] w-full relative">
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center bg-stone-50 p-4">
                  <WalkingCowLoading
                    fullScreen={false}
                    size="sm"
                    message="Initializing GIS Telemetry..."
                    subMessage="Rendering spatial containment buffers & cluster pins"
                  />
                </div>
              }
            >
              <LivestockMap />
            </Suspense>
          </div>
        </section>

        {/* Clinical Triage Queue / Recent Cases Panel (4-5 cols on lg) */}
        <section
          className="lg:col-span-5 xl:col-span-4 bg-white border border-stone-300 rounded-[2px] shadow-xs flex flex-col"
          aria-labelledby="triage-log-heading"
        >
          <div className="px-4 py-3 bg-[#F7F5EE] border-b border-stone-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-[#102A43]" aria-hidden="true" />
              <h2 id="triage-log-heading" className="text-xs font-bold font-sans uppercase tracking-wider text-[#102A43]">
                Live Clinical Triage Queue
              </h2>
            </div>
            <span className="text-[9px] font-mono font-bold bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded-[1px]">
              NADRS LOG
            </span>
          </div>

          <div
            className="divide-y divide-stone-200 overflow-y-auto max-h-[380px] lg:max-h-[420px] flex-1 font-sans"
            role="list"
            aria-label="Clinical health triage cases"
          >
            {DEMO_CASES.map((c) => (
              <div
                key={c.id}
                className="p-3.5 hover:bg-stone-50 transition-colors cursor-pointer group"
                role="listitem"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-mono font-bold text-[#102A43] group-hover:text-[#1B5E3C] transition-colors">
                    {c.case_number}
                  </span>
                  <RiskBadge level={c.risk_level} showPriorityCode showDot />
                </div>

                <div className="flex items-center justify-between text-xs text-stone-700 mb-1">
                  <span className="font-semibold text-stone-900 truncate">
                    {c.district}, {c.state}
                  </span>
                  <CaseStatusBadge status={c.status} />
                </div>

                {/* Clinical Symptoms */}
                <div className="text-[11px] text-stone-600 bg-stone-50 border border-stone-200 p-1.5 rounded-[2px] mt-1.5 font-mono">
                  <span className="text-stone-400">SYMPTOMS: </span>
                  <span>{c.symptoms.join(', ')}</span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-stone-500 mt-2 font-mono">
                  <span>REPORTED BY: {c.reported_by}</span>
                  <span>{formatDate(c.reported_at)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-[#F7F5EE] border-t border-stone-300 flex items-center justify-between text-xs font-sans">
            <span className="text-[11px] text-stone-600 font-mono">Showing 4 of 126 active cases</span>
            <button className="text-xs font-bold text-[#1B5E3C] hover:text-[#123C2A] uppercase tracking-wider cursor-pointer focus-visible:outline focus-visible:outline-2">
              Full Triage Log &rarr;
            </button>
          </div>
        </section>
      </div>

      {/* Institutional Biosecurity Advisory Strip */}
      <div className="bg-[#F7F5EE] border border-stone-300 p-3 rounded-[2px] flex items-center justify-between gap-3 text-xs text-stone-700 font-sans">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-[#1B5E3C] shrink-0" />
          <span>
            <strong>SURVEILLANCE NOTICE:</strong> Mandatory ring vaccination protocol active within 50km containment zones in Bihar & Eastern UP.
          </span>
        </div>
        <span className="text-[10px] font-mono text-stone-500 shrink-0 hidden sm:inline">
          PROTOCOL: NADRS-EPIDEM-V2
        </span>
      </div>

      {/* Sovereign Platform Notice */}
      <div className="text-center text-[11px] text-stone-500 border-t border-stone-200 pt-3 font-mono">
        PASHURAKSHA SOVEREIGN LIVESTOCK SURVEILLANCE &middot; NADRS-II REAL-TIME EPIDEMIOLOGICAL COMMAND NETWORK
      </div>
      </div>
      </div>
    </DashboardIntro>
  )
}
