import { Link } from 'react-router-dom'
import { PlaceholderPage } from '@/components/ui/PlaceholderPage'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export function SettingsPage() {
  return (
    <div className="p-3 sm:p-5 lg:p-6 max-w-6xl mx-auto">
      <PlaceholderPage
        title="प्रणाली सेटिंग्स &middot; System Preferences &amp; Profile"
        description="Configure SMS/Email alert frequencies, language preferences (Hindi, English, Regional), notification radii, and authorized digital signature keys."
        badge="Platform &mdash; Configuration"
      />
    </div>
  )
}

export function NotFoundPage() {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center max-w-lg mx-auto font-sans">
      <div className="w-12 h-12 rounded-[2px] bg-[#FFF8F7] border border-[#C62828]/40 flex items-center justify-center mb-4">
        <AlertCircle size={24} className="text-[#C62828]" aria-hidden="true" />
      </div>

      <p className="font-mono text-3xl font-extrabold text-[#102A43] tracking-wider mb-1">
        ERROR 404
      </p>

      <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-stone-100 text-stone-600 px-2 py-0.5 border border-stone-300 rounded-[1px] mb-3">
        RESOURCE NOT LOCATED ON SURVEILLANCE GATEWAY
      </span>

      <p className="text-xs text-stone-600 mb-6 leading-relaxed">
        The requested routing URL or surveillance node does not exist or has been relocated to another district jurisdiction.
      </p>

      <Link
        to="/"
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1B5E3C] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] hover:bg-[#123C2A] transition-colors focus-visible:outline focus-visible:outline-2 cursor-pointer shadow-2xs font-mono"
      >
        <ArrowLeft size={14} />
        <span>RETURN TO COMMAND CENTER</span>
      </Link>
    </div>
  )
}
