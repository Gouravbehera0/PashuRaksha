import type { CasePriority } from '@/types'

interface PriorityBadgeProps {
  priority: CasePriority | string
  className?: string
  size?: 'sm' | 'md'
}

export function PriorityBadge({ priority, className = '', size = 'md' }: PriorityBadgeProps) {
  const norm = (priority || 'MEDIUM').toUpperCase()

  let style = 'bg-[#FFF8E6] text-[#8C5D00] border-[#E0A11A]/50'
  let label = 'MEDIUM'
  let dotColor = 'bg-[#E0A11A]'
  let pulse = false

  if (norm === 'CRITICAL') {
    style = 'bg-[#7B1818] text-white border-[#520B0B]'
    label = 'CRITICAL PRIORITY'
    dotColor = 'bg-red-200'
    pulse = true
  } else if (norm === 'HIGH') {
    style = 'bg-[#FDF0EE] text-[#C62828] border-[#C62828]/40'
    label = 'HIGH PRIORITY'
    dotColor = 'bg-[#C62828]'
    pulse = true
  } else if (norm === 'LOW') {
    style = 'bg-[#EBF5EE] text-[#1B5E3C] border-[#2E7D32]/40'
    label = 'LOW PRIORITY'
    dotColor = 'bg-[#2E7D32]'
  }

  const padding = size === 'sm' ? 'px-1.5 py-0.2 text-[9px]' : 'px-2 py-0.5 text-[10px]'

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
