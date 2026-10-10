import type { AnimalHealthStatus } from '@/types'

interface HealthStatusPillProps {
  status: AnimalHealthStatus | string
  className?: string
  size?: 'sm' | 'md'
}

export function HealthStatusPill({ status, className = '', size = 'md' }: HealthStatusPillProps) {
  const norm = (status || 'Healthy').toLowerCase()

  let style = 'bg-[#EBF5EE] text-[#1B5E3C] border-[#2E7D32]/40'
  let label = 'Healthy · स्वस्थ'
  let dotColor = 'bg-[#2E7D32]'
  let pulse = false

  if (norm.includes('observation') || norm.includes('निगरानी')) {
    style = 'bg-[#FFF8E6] text-[#8C5D00] border-[#E0A11A]/50'
    label = 'Under Observation · निगरानी में'
    dotColor = 'bg-[#E0A11A]'
  } else if (norm.includes('high risk') || norm.includes('उच्च')) {
    style = 'bg-[#FDF0EE] text-[#C62828] border-[#C62828]/40'
    label = 'High Risk · उच्च जोखिम'
    dotColor = 'bg-[#C62828]'
    pulse = true
  } else if (norm.includes('critical') || norm.includes('गंभीर') || norm.includes('deceased')) {
    style = 'bg-[#7B1818] text-white border-[#520B0B]'
    label = 'Critical · अति गंभीर'
    dotColor = 'bg-red-200'
    pulse = true
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[2px] font-mono font-bold uppercase tracking-wider border ${padding} ${style} ${className}`}
      role="status"
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor} ${pulse ? 'animate-pulse' : ''}`}
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  )
}
