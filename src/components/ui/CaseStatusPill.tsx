import type { VetCaseStatus } from '@/types'

interface CaseStatusPillProps {
  status: VetCaseStatus | string
  className?: string
  size?: 'sm' | 'md'
}

export function CaseStatusPill({ status, className = '', size = 'md' }: CaseStatusPillProps) {
  const norm = (status || 'Reported').toLowerCase()

  let style = 'bg-stone-100 text-stone-700 border-stone-300'

  if (norm === 'reported') {
    style = 'bg-stone-100 text-[#102A43] border-stone-300 font-bold'
  } else if (norm === 'under review') {
    style = 'bg-[#FFF8E6] text-[#8C5D00] border-[#E0A11A]/40 font-bold'
  } else if (norm === 'veterinary review') {
    style = 'bg-[#E8F1F5] text-[#102A43] border-[#102A43]/40 font-bold'
  } else if (norm === 'sample required') {
    style = 'bg-[#FDF0EE] text-[#C62828] border-[#C62828]/40 font-bold'
  } else if (norm === 'lab pending') {
    style = 'bg-[#FFFDF7] text-[#8A6A3D] border-[#8A6A3D]/40 font-bold'
  } else if (norm === 'treatment') {
    style = 'bg-[#EBF5EE] text-[#2E7D32] border-[#2E7D32]/40 font-bold'
  } else if (norm === 'monitoring') {
    style = 'bg-[#E8F1F5] text-[#1B5E3C] border-[#1B5E3C]/40 font-bold'
  } else if (norm === 'resolved') {
    style = 'bg-[#EBF5EE] text-[#1B5E3C] border-[#1B5E3C]/40 font-bold'
  } else if (norm === 'rejected') {
    style = 'bg-stone-200 text-stone-600 border-stone-300 line-through'
  }

  const padding = size === 'sm' ? 'px-1.5 py-0.2 text-[9px]' : 'px-2 py-0.5 text-[10px]'

  return (
    <span
      className={`inline-flex items-center rounded-[2px] font-mono uppercase tracking-wider border ${padding} ${style} ${className}`}
      role="status"
    >
      {status}
    </span>
  )
}
