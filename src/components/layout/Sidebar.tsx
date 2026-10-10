import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Heart, Folder, Map, Syringe, Pill, FileBarChart,
  Bell, Settings, LogOut, X, ChevronRight, Users,
  BarChart3, Shield, Activity, Radio, Cpu, ClipboardCheck
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/i18n'
import type { UserRole } from '@/types'

interface SidebarNavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: number
  section?: string
}

function getFarmerNavItems(language: string): SidebarNavItem[] {
  const isHi = language === 'hi'
  return [
    { label: isHi ? 'डैशबोर्ड एवं सारांश' : 'Farm Overview', href: '/farmer/dashboard', icon: <LayoutDashboard size={17} />, section: isHi ? 'ग्राम निगरानी' : 'FIELD SURVEILLANCE' },
    { label: isHi ? 'पंजीकृत पशु' : 'Registered Livestock', href: '/farmer/animals', icon: <Heart size={17} /> },
    { label: isHi ? 'स्मार्ट IoT डिवाइस' : 'Smart IoT Devices', href: '/farmer/devices', icon: <Cpu size={17} /> },
    { label: isHi ? 'लक्षण रिपोर्ट दर्ज करें' : 'Report Health Issue', href: '/farmer/report-health', icon: <Activity size={17} /> },
    { label: isHi ? 'मृत्यु पंजीकरण' : 'Report Mortality', href: '/farmer/report-mortality', icon: <Shield size={17} /> },
    { label: isHi ? 'स्वास्थ्य मामले ट्रैक करें' : 'Track Health Cases', href: '/farmer/cases', icon: <Folder size={17} /> },
    { label: isHi ? 'टीकाकरण अनुसूची' : 'Vaccination Schedule', href: '/farmer/vaccinations', icon: <Syringe size={17} />, section: isHi ? 'निवारक स्वास्थ्य' : 'PREVENTIVE CARE' },
    { label: isHi ? 'उपचार एवं दवाएं' : 'Prescribed Treatments', href: '/farmer/treatments', icon: <Pill size={17} /> },
    { label: isHi ? 'स्वास्थ्य रिपोर्ट एवं डोजियर' : 'Herd Health Reports', href: '/farmer/reports', icon: <FileBarChart size={17} /> },
    { label: isHi ? 'सतर्कता संदेश' : 'Containment Alerts', href: '/farmer/alerts', icon: <Bell size={17} />, badge: 2, section: isHi ? 'सामुदायिक सूचना' : 'COMMUNITY ADVISORY' },
  ]
}

const vetNavItems: SidebarNavItem[] = [
  { label: 'Clinical Command Center', href: '/vet/command-center', icon: <LayoutDashboard size={17} />, section: 'CLINICAL TRIAGE' },
  { label: 'Case Management Log', href: '/vet/cases', icon: <Folder size={17} />, badge: 3 },
  { label: 'Animal Health Records', href: '/vet/animals', icon: <Heart size={17} /> },
  { label: 'Livestock Owners & Herds', href: '/vet/farmers', icon: <Users size={17} /> },
  { label: 'Outbreak Surveillance Desk', href: '/vet/outbreaks', icon: <Shield size={17} />, badge: 2, section: 'EPIDEMIOLOGY & CONTAINMENT' },
  { label: 'GIS Surveillance Map', href: '/vet/surveillance-map', icon: <Map size={17} /> },
  { label: 'Smart IoT Surveillance', href: '/vet/iot', icon: <Radio size={17} /> },
  { label: 'Biosecurity Alerts', href: '/vet/alerts', icon: <Bell size={17} /> },
  { label: 'Diagnostic Lab Desk', href: '/vet/lab', icon: <FileBarChart size={17} />, section: 'DIAGNOSTICS & PROTOCOLS' },
  { label: 'Treatment Protocols', href: '/vet/treatments', icon: <Pill size={17} /> },
  { label: 'District Health Reports', href: '/vet/reports', icon: <BarChart3 size={17} />, section: 'STATUTORY REPORTING' },
]

const adminNavItems: SidebarNavItem[] = [
  { label: 'National Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={17} />, section: 'NATIONAL SURVEILLANCE' },
  { label: 'GIS Surveillance Center', href: '/admin/surveillance-map', icon: <Map size={17} /> },
  { label: 'Outbreak Early Warning', href: '/admin/outbreaks', icon: <Shield size={17} />, badge: 3 },
  { label: 'Vaccination Coverage', href: '/admin/vaccination', icon: <Syringe size={17} /> },
  { label: 'Epidemiological Analytics', href: '/admin/analytics', icon: <BarChart3 size={17} /> },
  { label: 'Statutory Disease Reports', href: '/admin/reports', icon: <FileBarChart size={17} /> },
  { label: 'IoT Infrastructure & Fleet', href: '/admin/iot', icon: <Cpu size={17} />, section: 'HARDWARE & IOT SURVEILLANCE' },
  { label: 'Veterinary Workforce', href: '/admin/users', icon: <Users size={17} />, section: 'ADMINISTRATION & CADRE' },
  { label: 'Pilot & Field Validation', href: '/admin/pilot', icon: <ClipboardCheck size={17} />, section: 'FIELD PILOT & VALIDATION' },
  { label: 'System Configuration', href: '/admin/system', icon: <Settings size={17} />, section: 'SECURITY & AUDIT' },
]

const defaultNavItems: SidebarNavItem[] = [
  { label: 'National Command Center', href: '/dashboard', icon: <LayoutDashboard size={17} /> },
]

function getNavItems(role: UserRole | null, language: string): SidebarNavItem[] {
  switch (role) {
    case 'farmer': return getFarmerNavItems(language)
    case 'veterinarian': return vetNavItems
    case 'admin': return adminNavItems
    default: return defaultNavItems
  }
}

function getPortalTitle(role: UserRole | null, language: string): string {
  switch (role) {
    case 'farmer': return language === 'hi' ? 'पशुपालक सेवा पोर्टल' : 'LIVESTOCK OWNER PORTAL'
    case 'veterinarian': return 'VETERINARY CLINICAL DESK'
    case 'admin': return 'NATIONAL SURVEILLANCE DESK'
    default: return 'NATIONAL COMMAND CONSOLE'
  }
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { role, user, signOut, loginAsPreviewRole } = useAuth()
  const { language } = useTranslation()
  const navigate = useNavigate()
  const navItems = getNavItems(role, language)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#102A43]/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Shell */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-[#123C2A] text-white z-50 flex flex-col border-r border-[#1B5E3C]
          transform transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0 lg:shrink-0 lg:h-full lg:w-64 lg:z-20 lg:flex
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        aria-label="Portal System Navigation"
      >
        {/* Sidebar Brand Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-[#0E2E20]">
          <Link to="/dashboard" onClick={onClose} className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
            <Logo variant="white" size="sm" />
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-white/70 hover:text-white p-1 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-white cursor-pointer"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Portal Classification Strip */}
        <div className="px-4 py-2 border-b border-white/10 bg-[#102A43]/50 flex items-center justify-between">
          <span className="text-[9px] font-mono font-bold tracking-widest text-[#F7F5EE] uppercase">
            {getPortalTitle(role, language)}
          </span>
          <span className="flex items-center gap-1 text-[8px] font-mono text-white/50">
            <Radio size={8} className="text-green-400 animate-pulse" />
            LIVE
          </span>
        </div>

        {/* Navigation Modules */}
        <nav className="flex-1 overflow-y-auto py-2.5 px-2 font-sans" aria-label="Portal Modules">
          <ul className="space-y-1" role="list">
            {navItems.map((item) => (
              <li key={item.href}>
                {item.section && (
                  <div className="px-3 pt-3 pb-1 text-[9px] font-mono font-bold uppercase tracking-wider text-white/40">
                    {item.section}
                  </div>
                )}
                <NavLink
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) => [
                    'flex items-center gap-2.5 px-3 py-2 rounded-[2px] text-xs font-semibold tracking-wide',
                    'transition-colors duration-150 group relative',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60',
                    isActive
                      ? 'bg-white/15 text-[#F7F5EE] border-l-3 border-l-[#F7F5EE]'
                      : 'text-white/75 hover:text-white hover:bg-white/5 border-l-3 border-l-transparent',
                  ].join(' ')}
                >
                  {({ isActive }) => (
                    <>
                      <span className={`${isActive ? 'text-[#F7F5EE]' : 'text-white/60 group-hover:text-white'} shrink-0`}>
                        {item.icon}
                      </span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className="bg-[#C62828] text-white text-[9px] font-bold font-mono px-1.5 py-0.2 rounded-[2px] min-w-[16px] text-center"
                          aria-label={`${item.badge} notifications`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight size={12} className="text-[#8A6A3D]" aria-hidden="true" />}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="border-t border-white/10 p-3 space-y-2 bg-[#0E2E20]/60">
          {/* Quick link to Command Center */}
          <NavLink
            to="/dashboard"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-1.5 rounded-[2px] text-xs font-semibold text-white/75 hover:text-white hover:bg-white/5 transition-colors ${
                isActive ? 'bg-white/15 text-white' : ''
              }`
            }
          >
            <LayoutDashboard size={15} />
            <span>National Command Center</span>
          </NavLink>

          {/* Quick link to Settings */}
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-1.5 rounded-[2px] text-xs font-semibold text-white/75 hover:text-white hover:bg-white/5 transition-colors ${
                isActive ? 'bg-white/15 text-white' : ''
              }`
            }
          >
            <Settings size={15} />
            <span>Settings & Profile</span>
          </NavLink>

          {/* Interactive Role Switcher */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-[9px] font-mono text-white/50 px-1 mb-1">
              <span>ACTIVE ROLE SWITCH</span>
              <span className="text-[#8BC34A] font-bold uppercase">{role ?? 'Demo'}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => { loginAsPreviewRole('farmer'); navigate('/farmer/dashboard'); onClose(); }}
                className={`py-1 text-[9px] font-bold uppercase tracking-wider rounded-[2px] text-center transition-colors cursor-pointer border ${
                  role === 'farmer'
                    ? 'bg-[#2E7D32] text-white border-green-500'
                    : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/15'
                }`}
                title="Switch to Farmer Portal"
              >
                Farmer
              </button>
              <button
                type="button"
                onClick={() => { loginAsPreviewRole('veterinarian'); navigate('/vet/command-center'); onClose(); }}
                className={`py-1 text-[9px] font-bold uppercase tracking-wider rounded-[2px] text-center transition-colors cursor-pointer border ${
                  role === 'veterinarian'
                    ? 'bg-[#102A43] text-white border-blue-400'
                    : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/15'
                }`}
                title="Switch to Veterinarian Portal"
              >
                Vet
              </button>
              <button
                type="button"
                onClick={() => { loginAsPreviewRole('admin'); navigate('/admin/dashboard'); onClose(); }}
                className={`py-1 text-[9px] font-bold uppercase tracking-wider rounded-[2px] text-center transition-colors cursor-pointer border ${
                  role === 'admin'
                    ? 'bg-[#102A43] text-[#F7F5EE] border-[#8A6A3D]'
                    : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/15'
                }`}
                title="Switch to National Administrator"
              >
                Admin
              </button>
            </div>
          </div>

          {/* Telemetry Status Strip */}
          <div className="pt-1.5 px-1 border-t border-white/5 flex items-center justify-between text-[8px] font-mono text-white/40">
            <span>NODE: DELHI-CENTRAL-01</span>
            <span className="text-green-400">ENC-256</span>
          </div>

          {/* User Session Identifier */}
          <div className="px-1 py-0.5 text-[10px] font-mono text-white/50 truncate">
            ID: {user?.email ?? user?.phone ?? 'AUTHENTICATED'}
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[2px] text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60"
            aria-label="Sign out"
          >
            <LogOut size={14} />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>
    </>
  )
}

// === Hamburger Toggle for Mobile ===
interface SidebarToggleProps {
  onOpen: () => void
}

export function SidebarToggle({ onOpen }: SidebarToggleProps) {
  return (
    <button
      onClick={onOpen}
      className="lg:hidden p-1.5 rounded-[2px] text-[#102A43] hover:bg-stone-100 transition-colors border border-stone-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1B5E3C] cursor-pointer"
      aria-label="Open portal navigation"
      aria-expanded={false}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
      </svg>
    </button>
  )
}
