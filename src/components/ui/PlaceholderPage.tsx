import { Layers, CheckCircle2, Clock } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
  description?: string
  badge?: string
}

export function PlaceholderPage({ title, description, badge }: PlaceholderPageProps) {
  return (
    <div className="p-4 sm:p-8 flex flex-col items-center justify-center min-h-[55vh] text-center max-w-xl mx-auto">
      {/* Institutional Architecture Symbol */}
      <div className="w-14 h-14 rounded-[2px] bg-white border border-stone-300 shadow-2xs flex items-center justify-center mb-4 border-t-4 border-t-[#1B5E3C]">
        <Layers size={26} className="text-[#1B5E3C]" aria-hidden="true" />
      </div>

      <div className="space-y-2 w-full">
        {badge && (
          <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider text-[#1B5E3C] bg-[#EBF5EE] border border-[#2E7D32]/40 px-2 py-0.5 rounded-[1px] mb-1">
            {badge}
          </span>
        )}

        <h1 className="text-xl sm:text-2xl font-extrabold text-[#102A43] font-sans tracking-tight">
          {title}
        </h1>

        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans max-w-md mx-auto">
          {description ??
            'This operational module is part of the Stage 2 implementation. The routing table, role permissions, and visual architecture are active.'}
        </p>

        {/* Institutional Verification Matrix */}
        <div className="mt-6 p-4 bg-white border border-stone-300 rounded-[2px] text-left text-xs text-stone-600 shadow-2xs space-y-2 font-mono">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <span className="font-bold text-[#102A43] uppercase text-[11px]">STAGE 1 FOUNDATION STATUS</span>
            <span className="text-[10px] bg-[#EBF5EE] text-[#1B5E3C] px-1.5 py-0.2 rounded-[1px] font-bold">VERIFIED</span>
          </div>
          <div className="space-y-1.5 text-[11px] pt-1">
            <div className="flex items-center gap-2 text-stone-700">
              <CheckCircle2 size={13} className="text-[#1B5E3C] shrink-0" />
              <span>Route registered &amp; guarded in AppRouter.tsx</span>
            </div>
            <div className="flex items-center gap-2 text-stone-700">
              <CheckCircle2 size={13} className="text-[#1B5E3C] shrink-0" />
              <span>Role-aware navigation active in Sidebar &amp; Header</span>
            </div>
            <div className="flex items-center gap-2 text-stone-700">
              <CheckCircle2 size={13} className="text-[#1B5E3C] shrink-0" />
              <span>Supabase session &amp; role security architecture ready</span>
            </div>
            <div className="flex items-center gap-2 text-stone-500">
              <Clock size={13} className="text-[#E0A11A] shrink-0" />
              <span>Backend data persistence &amp; ML engines &mdash; Scheduled Stage 2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
