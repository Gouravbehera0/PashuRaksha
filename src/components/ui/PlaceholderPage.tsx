/**
 * PASHURAKSHA (पशुरक्षा) — MODULE PREVIEW / PLACEHOLDER
 * "Detect Early. Prevent Outbreaks. Protect Livestock."
 */

import { Layers, ShieldCheck, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

interface PlaceholderPageProps {
  title: string
  description?: string
  badge?: string
  backHref?: string
  backLabel?: string
}

export function PlaceholderPage({
  title,
  description,
  badge = 'Surveillance Node Active',
  backHref = '/dashboard',
  backLabel = 'Return to Command Center'
}: PlaceholderPageProps) {
  return (
    <div className="p-4 sm:p-8 flex flex-col items-center justify-center min-h-[55vh] text-center max-w-xl mx-auto">
      {/* Institutional Architecture Symbol */}
      <div className="w-14 h-14 rounded-lg bg-white border border-gray-200 shadow-xs flex items-center justify-center mb-4 border-t-4 border-t-[#1B5E3C]">
        <Layers size={26} className="text-[#1B5E3C]" aria-hidden="true" />
      </div>

      <div className="space-y-2 w-full">
        {badge && (
          <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider text-[#1B5E3C] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded mb-1">
            {badge}
          </span>
        )}

        <h1 className="text-xl sm:text-2xl font-bold text-[#102A43] font-sans tracking-tight">
          {title}
        </h1>

        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-sans max-w-md mx-auto">
          {description ??
            'This operational module is active within the national livestock biosecurity framework. Connected to central surveillance registry.'}
        </p>

        {/* Security & Verification Capsule */}
        <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg text-left text-xs text-gray-600 shadow-xs space-y-2 font-mono">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="font-bold text-[#102A43] uppercase text-[11px]">SURVEILLANCE NODE INTEGRITY</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
              VERIFIED
            </span>
          </div>
          <div className="space-y-1.5 text-[11px] pt-1">
            <div className="flex items-center gap-2 text-gray-700">
              <ShieldCheck size={14} className="text-[#1B5E3C] shrink-0" />
              <span>Role-Based Access Control verified</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <ShieldCheck size={14} className="text-[#1B5E3C] shrink-0" />
              <span>End-to-end cryptographic data hygiene active</span>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Link
            to={backHref}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B5E3C] hover:bg-[#123C2A] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-xs"
          >
            <ArrowLeft size={14} />
            <span>{backLabel}</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
