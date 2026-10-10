import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  Phone,
  ShieldCheck,
  ChevronDown,
  LogOut,
  Settings,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
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
  const { user, role, signOut } = useAuth()
  const { t, language, setLanguage } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const userName = user?.email ?? user?.phone ?? 'Authorized Officer'
  const initials = getInitials(userName)
  const roleInfo = getRolePill(role)

  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    setProfileOpen(false)
    await signOut()
    navigate('/login', { replace: true })
  }

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

  const alertsPath =
    role === 'farmer' ? '/farmer/alerts' : role === 'veterinarian' ? '/vet/alerts' : '/admin/outbreaks'

  return (
    <header className="bg-white border-b border-stone-300 z-30 shrink-0 shadow-xs relative">
      {/* Top Institutional Utility Strip (GIGW Compliant Style) — Desktop Only */}
      <div className="hidden lg:block bg-[#123C2A] text-white border-b border-[#1B5E3C] text-[10px] font-sans">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-1 flex items-center justify-between gap-2 flex-wrap">
          {/* Left: Authority & Purpose Declaration */}
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-widest uppercase text-[#F7F5EE]">
              SOVEREIGN LIVESTOCK HEALTH SURVEILLANCE INFRASTRUCTURE
            </span>
            <span className="hidden sm:inline text-white/40">|</span>
            <span className="hidden sm:inline text-white/80 font-mono text-[9px] uppercase tracking-wider bg-white/10 px-1.5 py-0.2 rounded-[2px]">
              NADRS-II / ICAR COMPLIANT
            </span>
          </div>

          {/* Right: Emergency Line, Language & Accessibility */}
          <div className="flex items-center gap-3 ml-auto text-white/90">
            {/* National 1962 Helpline */}
            <div className="flex items-center gap-1 font-mono text-white/95 bg-[#1B5E3C] px-2 py-0.5 rounded-[2px] border border-[#2E7D32]/50">
              <Phone size={10} className="text-[#F7F5EE]" aria-hidden="true" />
              <span className="font-semibold">EMERGENCY HELPLINE: 1962</span>
            </div>

            {/* Language Switch */}
            <div className="flex items-center gap-1.5 border-l border-white/20 pl-2">
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`font-sans text-[11px] transition-colors cursor-pointer ${
                  language === 'hi'
                    ? 'font-bold text-white underline decoration-[#8BC34A] underline-offset-2'
                    : 'text-white/70 hover:text-white'
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
                  language === 'en'
                    ? 'font-bold text-white underline decoration-[#8BC34A] underline-offset-2'
                    : 'text-white/70 hover:text-white'
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Toggle & Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <SidebarToggle onOpen={onMenuOpen} />
          <Link
            to={
              role === 'farmer'
                ? '/farmer/dashboard'
                : role === 'veterinarian'
                ? '/vet/command-center'
                : role === 'admin'
                ? '/admin/dashboard'
                : '/dashboard'
            }
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1B5E3C] flex items-center"
          >
            <Logo size="sm" className="flex lg:hidden" />
            <Logo size="md" className="hidden lg:flex" />
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
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Offline Sync Status Badge */}
          <div className="hidden md:flex">
            <SyncStatusBadge />
          </div>

          {/* Security Seal */}
          <div className="hidden xl:flex items-center gap-1 text-[10px] text-stone-500 font-mono bg-stone-50 border border-stone-200 px-2 py-1 rounded-[2px]">
            <ShieldCheck size={13} className="text-[#1B5E3C]" aria-hidden="true" />
            <span>ISO 27001</span>
          </div>

          {/* Notifications Dropdown */}
          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen)
                setProfileOpen(false)
              }}
              className="relative p-1.5 sm:p-2 text-stone-700 hover:text-[#102A43] hover:bg-stone-100 rounded-full transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2"
              aria-label={`Notifications: ${notificationCount} unread`}
            >
              <Bell size={20} />
              {notificationCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#E53935] text-white text-[9px] font-bold font-mono rounded-full flex items-center justify-center shadow-xs">
                  {notificationCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-stone-200 rounded-xl shadow-lg z-50 overflow-hidden animate-fadeIn text-xs">
                <div className="p-3 bg-forest-900 text-white flex items-center justify-between">
                  <span className="font-bold tracking-wider uppercase text-[11px]">Surveillance Alerts</span>
                  <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full font-mono">2 Active</span>
                </div>
                <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto">
                  <div className="p-3 hover:bg-forest-50/50 transition-colors flex items-start gap-2.5">
                    <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-stone-900">FMD Containment Zone Formed</p>
                      <p className="text-[11px] text-stone-500 mt-0.5">Bulandshahr / Khurja Block: 5km radius cordon active.</p>
                      <p className="text-[10px] text-stone-400 mt-1">15 mins ago &bull; High Priority</p>
                    </div>
                  </div>
                  <div className="p-3 hover:bg-forest-50/50 transition-colors flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-forest-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-stone-900">Vaccination Drive Completed</p>
                      <p className="text-[11px] text-stone-500 mt-0.5">Ring-vaccination batch completed in Syana Sector 4.</p>
                      <p className="text-[10px] text-stone-400 mt-1">2 hours ago</p>
                    </div>
                  </div>
                </div>
                <div className="p-2.5 bg-stone-50 border-t border-stone-100 text-center">
                  <Link
                    to={alertsPath}
                    onClick={() => setNotificationsOpen(false)}
                    className="text-forest-700 hover:text-forest-900 font-bold inline-flex items-center gap-1 text-[11px]"
                  >
                    View All Platform Alerts
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Block & Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setProfileOpen(!profileOpen)
                setNotificationsOpen(false)
              }}
              className="flex items-center gap-1 cursor-pointer focus:outline-none"
            >
              <div
                className="w-8 h-8 rounded-full bg-[#123C2A] text-[#F7F5EE] border border-[#8A6A3D]/40 text-xs font-bold font-sans flex items-center justify-center select-none shadow-xs"
                aria-hidden="true"
              >
                {initials}
              </div>
              <div className="hidden sm:flex flex-col text-left ml-1">
                <span className="text-xs font-bold text-[#102A43] leading-none truncate max-w-[130px]">
                  {userName}
                </span>
                <span
                  className={`text-[8px] font-mono font-bold uppercase tracking-wider px-1 py-0.2 rounded-[1px] mt-1 inline-block ${roleInfo.badgeClass}`}
                >
                  {roleInfo.label}
                </span>
              </div>
              <ChevronDown size={14} className="text-stone-400" aria-hidden="true" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 rounded-xl shadow-lg z-50 overflow-hidden animate-fadeIn text-xs">
                <div className="p-3 bg-stone-50 border-b border-stone-100">
                  <p className="font-bold text-stone-900 truncate">{userName}</p>
                  <p className="text-[10px] uppercase font-mono text-forest-700 font-semibold mt-0.5">{roleInfo.label}</p>
                </div>
                <div className="p-1.5 space-y-0.5">
                  <Link
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-stone-700 hover:bg-forest-50 hover:text-forest-900 rounded-lg transition-colors"
                  >
                    <Settings size={14} className="text-forest-600" />
                    <span>Settings & Jurisdiction</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-red-700 hover:bg-red-50 rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <LogOut size={14} className="text-red-600" />
                    <span>Sign Out & Lock Desk</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
