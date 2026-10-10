import type { RiskLevel, HealthStatus, CaseStatus, AlertSeverity } from '@/types'

// === RiskBadge ===

const riskBadgeStyles: Record<RiskLevel, string> = {
  low: 'bg-[#EBF5EE] text-[#1B5E3C] border border-[#2E7D32]/40',
  medium: 'bg-[#FFF8E6] text-[#8C5D00] border border-[#E0A11A]/50',
  high: 'bg-[#FDF0EE] text-[#C62828] border border-[#C62828]/40',
  critical: 'bg-[#7B1818] text-[#FFFFFF] border border-[#520B0B]',
}

const riskLabels: Record<RiskLevel, string> = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
  critical: 'Critical Risk',
}

const priorityCodes: Record<RiskLevel, string> = {
  critical: 'P1-CRIT',
  high: 'P2-HIGH',
  medium: 'P3-MED',
  low: 'P4-LOW',
}

interface RiskBadgeProps {
  level: RiskLevel
  showPriorityCode?: boolean
  showDot?: boolean
  className?: string
}

export function RiskBadge({
  level,
  showPriorityCode = false,
  showDot = true,
  className = '',
}: RiskBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[11px] font-bold tracking-wider uppercase font-mono ${riskBadgeStyles[level]} ${className}`}
      role="status"
      aria-label={`Risk level: ${riskLabels[level]}`}
    >
      {showDot && (
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
            level === 'critical'
              ? 'bg-red-200 animate-risk-pulse'
              : level === 'high'
              ? 'bg-[#C62828]'
              : level === 'medium'
              ? 'bg-[#E0A11A]'
              : 'bg-[#2E7D32]'
          }`}
          aria-hidden="true"
        />
      )}
      <span>{showPriorityCode ? priorityCodes[level] : riskLabels[level]}</span>
    </span>
  )
}

// === RiskIndicator — Clinical Color Bar ===

interface RiskIndicatorProps {
  level: RiskLevel
  className?: string
}

export function RiskIndicator({ level, className = '' }: RiskIndicatorProps) {
  const barStyles: Record<RiskLevel, string> = {
    low: 'bg-[#2E7D32]',
    medium: 'bg-[#E0A11A]',
    high: 'bg-[#C62828]',
    critical: 'bg-[#7B1818] animate-risk-pulse',
  }
  return (
    <div
      className={`w-1 rounded-none ${barStyles[level]} ${className}`}
      role="presentation"
      aria-label={`Risk: ${level}`}
    />
  )
}

// === HealthStatusBadge ===

const healthStatusStyles: Record<HealthStatus, string> = {
  healthy: 'bg-[#EBF5EE] text-[#1B5E3C] border border-[#2E7D32]/40',
  under_observation: 'bg-[#E8F1F5] text-[#102A43] border border-[#102A43]/30',
  sick: 'bg-[#FFF8E6] text-[#8C5D00] border border-[#E0A11A]/40',
  critical: 'bg-[#FDF0EE] text-[#C62828] border border-[#C62828]/40',
  recovered: 'bg-[#EBF5EE] text-[#2E7D32] border border-[#2E7D32]/40',
  deceased: 'bg-stone-100 text-stone-700 border border-stone-300',
}

const healthStatusLabels: Record<HealthStatus, string> = {
  healthy: 'Healthy / स्वस्थ',
  under_observation: 'Under Observation',
  sick: 'Symptomatic / अस्वस्थ',
  critical: 'Critical Care',
  recovered: 'Recovered / स्वस्थ हुआ',
  deceased: 'Deceased',
}

interface HealthStatusBadgeProps {
  status: HealthStatus
  className?: string
}

export function HealthStatusBadge({ status, className = '' }: HealthStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-semibold ${healthStatusStyles[status]} ${className}`}
      role="status"
    >
      {healthStatusLabels[status]}
    </span>
  )
}

// === CaseStatusBadge ===

const caseStatusStyles: Record<CaseStatus, string> = {
  reported: 'bg-stone-100 text-stone-800 border border-stone-300',
  under_review: 'bg-[#E8F1F5] text-[#102A43] border border-[#102A43]/30',
  diagnosed: 'bg-[#F4F1EA] text-[#8A6A3D] border border-[#8A6A3D]/40',
  treatment_ongoing: 'bg-[#FFF8E6] text-[#8C5D00] border border-[#E0A11A]/40',
  resolved: 'bg-[#EBF5EE] text-[#1B5E3C] border border-[#2E7D32]/40',
  escalated: 'bg-[#FDF0EE] text-[#C62828] border border-[#C62828]/40',
}

const caseStatusLabels: Record<CaseStatus, string> = {
  reported: 'Reported',
  under_review: 'Under Triage',
  diagnosed: 'Diagnosed',
  treatment_ongoing: 'Treatment Active',
  resolved: 'Resolved',
  escalated: 'Escalated to DVO',
}

interface CaseStatusBadgeProps {
  status: CaseStatus
  className?: string
}

export function CaseStatusBadge({ status, className = '' }: CaseStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-mono font-semibold uppercase tracking-wider ${caseStatusStyles[status]} ${className}`}
      role="status"
    >
      {caseStatusLabels[status]}
    </span>
  )
}

// === AlertBanner ===

const alertBannerStyles: Record<AlertSeverity, { border: string; bg: string; titleColor: string; textColor: string; tag: string }> = {
  info: {
    border: 'border-l-4 border-l-[#102A43] border-y border-r border-stone-300',
    bg: 'bg-white',
    titleColor: 'text-[#102A43]',
    textColor: 'text-stone-700',
    tag: 'bg-[#E8F1F5] text-[#102A43] border border-[#102A43]/20',
  },
  warning: {
    border: 'border-l-4 border-l-[#E0A11A] border-y border-r border-[#E0A11A]/40',
    bg: 'bg-[#FFFDF7]',
    titleColor: 'text-[#8C5D00]',
    textColor: 'text-stone-800',
    tag: 'bg-[#FFF8E6] text-[#8C5D00] border border-[#E0A11A]/40',
  },
  danger: {
    border: 'border-l-4 border-l-[#C62828] border-y border-r border-[#C62828]/40',
    bg: 'bg-[#FFF8F7]',
    titleColor: 'text-[#C62828]',
    textColor: 'text-stone-800',
    tag: 'bg-[#FDF0EE] text-[#C62828] border border-[#C62828]/40',
  },
  critical: {
    border: 'border-l-4 border-l-[#7B1818] border-y border-r border-[#7B1818]',
    bg: 'bg-[#7B1818]',
    titleColor: 'text-white',
    textColor: 'text-stone-100',
    tag: 'bg-white/20 text-white border border-white/30',
  },
}

interface AlertBannerProps {
  severity: AlertSeverity
  title: string
  message: string
  timestamp?: string
  onDismiss?: () => void
  className?: string
}

export function AlertBanner({
  severity,
  title,
  message,
  timestamp,
  onDismiss,
  className = '',
}: AlertBannerProps) {
  const styles = alertBannerStyles[severity]
  return (
    <div
      role="alert"
      className={`p-3.5 rounded-[2px] shadow-sm flex items-start justify-between gap-3 ${styles.bg} ${styles.border} ${className}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[2px] ${styles.tag}`}>
            {severity === 'critical' ? 'CRITICAL OUTBREAK ALERT' : severity === 'danger' ? 'HIGH RISK ADVISORY' : 'SURVEILLANCE NOTICE'}
          </span>
          {timestamp && (
            <span className={`text-[10px] font-mono ${severity === 'critical' ? 'text-white/70' : 'text-stone-500'}`}>
              {timestamp}
            </span>
          )}
        </div>
        <p className={`text-sm font-bold tracking-tight ${styles.titleColor}`}>{title}</p>
        <p className={`text-xs mt-0.5 leading-relaxed ${styles.textColor}`}>{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className={`text-xs p-1 rounded hover:opacity-100 opacity-60 transition-opacity shrink-0 cursor-pointer ${
            severity === 'critical' ? 'text-white' : 'text-stone-600'
          }`}
        >
          ✕
        </button>
      )}
    </div>
  )
}

// === MetricCard (Institutional Command Center Data Cell) ===

interface MetricCardProps {
  label: string
  value: string | number
  subLabel?: string
  variant?: 'default' | 'danger' | 'warning' | 'success'
  icon?: React.ReactNode
  isDemoData?: boolean
  className?: string
}

const metricBorderVariants = {
  default: 'border-t-4 border-t-[#1B5E3C] border-stone-300',
  danger: 'border-t-4 border-t-[#C62828] border-stone-300',
  warning: 'border-t-4 border-t-[#E0A11A] border-stone-300',
  success: 'border-t-4 border-t-[#2E7D32] border-stone-300',
}

const metricValueColors = {
  default: 'text-[#102A43]',
  danger: 'text-[#C62828]',
  warning: 'text-[#966300]',
  success: 'text-[#1B5E3C]',
}

export function MetricCard({
  label,
  value,
  subLabel,
  variant = 'default',
  icon,
  isDemoData = false,
  className = '',
}: MetricCardProps) {
  return (
    <div
      className={`bg-white border p-3.5 rounded-[2px] shadow-sm relative flex flex-col justify-between ${metricBorderVariants[variant]} ${className}`}
      role="region"
      aria-label={label}
    >
      <div>
        <div className="flex items-start justify-between gap-1 mb-1">
          <p className="text-[11px] font-bold text-stone-600 uppercase tracking-wider font-sans leading-tight">
            {label}
          </p>
          {isDemoData && (
            <span className="text-[9px] font-mono font-bold text-stone-600 bg-stone-100 border border-stone-300 px-1 py-0.2 rounded-[2px] shrink-0 uppercase tracking-wider">
              DEMO
            </span>
          )}
        </div>
        <div className="flex items-baseline justify-between gap-2 mt-1.5">
          <p className={`text-2xl lg:text-3xl font-extrabold font-mono tabular-nums leading-none tracking-tight ${metricValueColors[variant]}`}>
            {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
          </p>
          {icon && (
            <div className="text-stone-400 shrink-0 opacity-80" aria-hidden="true">
              {icon}
            </div>
          )}
        </div>
      </div>
      {subLabel && (
        <p className="text-[11px] text-stone-600 mt-2.5 pt-2 border-t border-stone-100 font-sans leading-tight">
          {subLabel}
        </p>
      )}
    </div>
  )
}
