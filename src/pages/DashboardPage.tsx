import { Suspense, lazy } from 'react'
import { AlertTriangle, TrendingUp, Activity, MapPin, ShieldAlert, Radio, FileText, CheckCircle2 } from 'lucide-react'
import { MetricCard, AlertBanner, RiskBadge, CaseStatusBadge } from '@/components/ui/RiskComponents'
import { WalkingCowLoading } from '@/components/ui/WalkingCowLoading'
import { DEMO_STATS, DEMO_CASES, DEMO_ALERTS } from '@/data/demo'
import { formatDate } from '@/lib/utils'

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
    <div className="p-3 sm:p-5 lg:p-6 space-y-5 max-w-7xl mx-auto">
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

      {/* Footer Prototype Notice */}
      <div className="text-center text-[11px] text-stone-500 border-t border-stone-200 pt-3 font-mono">
        PASHURAKSHA STAGE 1 FOUNDATION &middot; ALL EPIDEMIOLOGICAL STATISTICS ARE DEMONSTRATION SEED VALUES FOR PROTOTYPE VERIFICATION &middot; NOT CONNECTED TO LIVE PRODUCTION DATABASE
      </div>
    </div>
  )
}
