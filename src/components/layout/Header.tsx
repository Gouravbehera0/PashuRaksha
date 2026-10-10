import { Link, useLocation } from 'react-router-dom'
import { Bell, Phone, ShieldCheck, ChevronDown } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { SidebarToggle } from '@/components/layout/Sidebar'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/i18n'
import { SyncStatusBadge } from '@/components/offline/SyncStatusBadge'
import { getInitials } from '@/lib/utils'
import type { UserRole } from '@/types'

interface HeaderProps {
  onMenuOpen: () => void
  notificationCount?: number
}

function getRolePill(role: UserRole | null): { label: string; badgeClass: string } {
  switch (role) {
    case 'admin':
      return {
        label: 'NATIONAL ADMINISTRATOR',
        badgeClass: 'bg-[#102A43] text-[#F7F5EE] border border-[#8A6A3D]/50',
      }
    case 'veterinarian':
      return {
        label: 'VETERINARY CLINICAL DESK',
        badgeClass: 'bg-[#1B5E3C] text-[#F7F5EE] border border-[#2E7D32]/50',
      }
    case 'farmer':
      return {
        label: 'REGISTERED LIVESTOCK OWNER',
        badgeClass: 'bg-[#123C2A] text-[#F7F5EE] border border-[#8A6A3D]/40',
      }
    default:
      return {
        label: 'COMMAND OBSERVER',
        badgeClass: 'bg-stone-700 text-white border border-stone-800',
      }
  }
}

export function Header({ onMenuOpen, notificationCount = 2 }: HeaderProps) {
  const { user, role } = useAuth()
  const { t, language, setLanguage } = useTranslation()
  const location = useLocation()
  const userName = user?.email ?? user?.phone ?? 'Authorized User'
  const initials = getInitials(userName)
  const roleInfo = getRolePill(role)

  const getHeaderLinks = () => {
    switch (role) {
      case 'farmer':
        return [
          { label: t('nav.dashboard'), href: '/farmer/dashboard' },
          { label: t('nav.animals'), href: '/farmer/animals' },
          { label: t('nav.report_health'), href: '/farmer/report-health' },
          { label: t('nav.vaccinations'), href: '/farmer/vaccinations' },
          { label: t('nav.alerts'), href: '/farmer/alerts' },
        ]
      case 'veterinarian':
        return [
          { label: 'Command Center', href: '/vet/command-center' },
          { label: 'Cases', href: '/vet/cases' },
          { label: 'GIS Map', href: '/vet/surveillance-map' },
          { label: 'Outbreak Desk', href: '/vet/outbreaks' },
          { label: 'Reports', href: '/vet/reports' },
        ]
      case 'admin':
        return [
          { label: 'National Dashboard', href: '/admin/dashboard' },
          { label: 'GIS Command Map', href: '/admin/surveillance-map' },
          { label: 'Outbreaks', href: '/admin/outbreaks' },
          { label: 'Analytics', href: '/admin/analytics' },
          { label: 'System', href: '/admin/system' },
        ]
      default:
        return [
          { label: 'Command Center', href: '/dashboard' },
          { label: 'Animal Health', href: '/dashboard' },
          { label: 'Cases', href: '/dashboard' },
          { label: 'Outbreak Map', href: '/dashboard' },
          { label: 'Reports', href: '/dashboard' },
        ]
    }
  }

  const navLinks = getHeaderLinks()

  return (
    <header className="bg-white border-b border-stone-300 z-30 shrink-0 shadow-xs">
      {/* Top Institutional Utility Strip (GIGW Compliant Style) */}
      <div className="bg-[#123C2A] text-white border-b border-[#1B5E3C] text-[10px] font-sans">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-1 flex items-center justify-between gap-2 flex-wrap">
          {/* Left: Authority & Purpose Declaration */}
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-widest uppercase text-[#F7F5EE]">
              GOVERNMENT-READY LIVESTOCK HEALTH SURVEILLANCE PLATFORM
            </span>
            <span className="hidden sm:inline text-white/40">|</span>
            <span className="hidden sm:inline text-white/80 font-mono text-[9px] uppercase tracking-wider bg-white/10 px-1.5 py-0.2 rounded-[2px]">
              DIGITAL LIVESTOCK HEALTH INFRASTRUCTURE
            </span>
          </div>

          {/* Right: Emergency Line, Language & Accessibility */}
          <div className="flex items-center gap-3 ml-auto text-white/90">
            {/* National 1962 Helpline */}
            <div className="flex items-center gap-1 font-mono text-white/95 bg-[#1B5E3C] px-2 py-0.5 rounded-[2px] border border-[#2E7D32]/50">
              <Phone size={10} className="text-[#F7F5EE]" aria-hidden="true" />
              <span className="font-semibold">EMERGENCY HELPLINE: 1962</span>
            </div>

            {/* Accessibility Size Adjustments */}
            <div className="hidden md:flex items-center gap-1 text-white/80 font-mono text-[10px] border-l border-white/20 pl-2">
              <span className="cursor-pointer hover:text-white px-0.5" title="Standard Text">A</span>
              <span className="cursor-pointer hover:text-white px-0.5 font-bold" title="Larger Text">A+</span>
            </div>

            {/* Language Switch */}
            <div className="flex items-center gap-1.5 border-l border-white/20 pl-2">
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`font-sans text-[11px] transition-colors cursor-pointer ${
                  language === 'hi' ? 'font-bold text-white underline decoration-[#8BC34A] underline-offset-2' : 'text-white/70 hover:text-white'
                }`}
                title="Switch to Hindi / हिन्दी में बदलें"
              >
                हिन्दी
              </button>
              <span className="text-white/40">/</span>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`font-sans text-[11px] transition-colors cursor-pointer ${
                  language === 'en' ? 'font-bold text-white underline decoration-[#8BC34A] underline-offset-2' : 'text-white/70 hover:text-white'
                }`}
                title="Switch to English"
              >
                English
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Institutional Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Brand Logo */}
        <div className="flex items-center gap-3">
          <SidebarToggle onOpen={onMenuOpen} />
          <Link to={role === 'farmer' ? '/farmer/dashboard' : role === 'veterinarian' ? '/vet/command-center' : role === 'admin' ? '/admin/dashboard' : '/dashboard'} className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1B5E3C]">
            <Logo size="md" />
          </Link>
        </div>

        {/* Center: Institutional Horizontal Navigation (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 font-sans" aria-label="Institutional Navigation">
          {navLinks.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.label}
                to={item.href}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors rounded-[2px] border-b-2 ${
                  isActive
                    ? 'border-[#1B5E3C] text-[#123C2A] bg-[#F7F5EE]'
                    : 'border-transparent text-stone-600 hover:text-[#123C2A] hover:bg-stone-50'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right: Sync Status Badge, Security Badge, Notification & Profile */}
        <div className="flex items-center gap-2.5">
          {/* Offline Sync Status Badge */}
          <SyncStatusBadge />

          {/* Security Seal */}
          <div className="hidden xl:flex items-center gap-1 text-[10px] text-stone-500 font-mono bg-stone-50 border border-stone-200 px-2 py-1 rounded-[2px]">
            <ShieldCheck size={13} className="text-[#1B5E3C]" aria-hidden="true" />
            <span>NADRS-II SECURE</span>
          </div>

          {/* Notifications */}
          <button
            className="relative p-2 text-stone-600 hover:text-[#102A43] hover:bg-stone-100 rounded-[2px] transition-colors border border-stone-200 cursor-pointer focus-visible:outline focus-visible:outline-2"
            aria-label={`Notifications: ${notificationCount} unread`}
          >
            <Bell size={16} />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C62828] text-white text-[9px] font-bold font-mono rounded-full flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>

          {/* User Profile Block */}
          <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
            <div
              className="w-8 h-8 rounded-[2px] bg-[#123C2A] text-[#F7F5EE] border border-[#8A6A3D]/40 text-xs font-bold font-mono flex items-center justify-center select-none"
              aria-hidden="true"
            >
              {initials}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-[#102A43] leading-none truncate max-w-[130px]">
                {userName}
              </span>
              <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-1 py-0.2 rounded-[1px] mt-1 inline-block ${roleInfo.badgeClass}`}>
                {roleInfo.label}
              </span>
            </div>
            <ChevronDown size={12} className="hidden sm:block text-stone-400" aria-hidden="true" />
          </div>
        </div>
      </div>
    </header>
  )
}
