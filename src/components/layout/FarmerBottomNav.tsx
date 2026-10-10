import { NavLink } from 'react-router-dom'
import { Home, Calendar, BarChart3, User, Folder, Map, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface MobileBottomNavProps {
  unreadAlertCount?: number
}

// Bovine / Cow Icon for Livestock Tab (matches reference design)
function BovineOutlineIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 8C3 6 4 3 6 3C8 3 8 5 9 7" />
      <path d="M20 8C21 6 20 3 18 3C16 3 16 5 15 7" />
      <rect x="7" y="7" width="10" height="11" rx="2" />
      <circle cx="10" cy="11" r="1" fill="currentColor" />
      <circle cx="14" cy="11" r="1" fill="currentColor" />
      <ellipse cx="12" cy="15" rx="2.5" ry="1.5" />
    </svg>
  )
}

interface NavItemDef {
  label: string
  href: string
  icon: (active: boolean) => React.ReactNode
}

export function MobileBottomNav({ unreadAlertCount: _unreadAlertCount = 0 }: MobileBottomNavProps) {
  const { role } = useAuth()

  // 1. Farmer Navigation Items (matches reference image: Dashboard, My Animals, Vaccination, Reports, Profile)
  const farmerItems: NavItemDef[] = [
    {
      label: 'Dashboard',
      href: '/farmer/dashboard',
      icon: () => <Home size={19} />,
    },
    {
      label: 'My Animals',
      href: '/farmer/animals',
      icon: () => <BovineOutlineIcon className="w-5 h-5" />,
    },
    {
      label: 'Vaccination',
      href: '/farmer/vaccinations',
      icon: () => <Calendar size={19} />,
    },
    {
      label: 'Reports',
      href: '/farmer/reports',
      icon: () => <BarChart3 size={19} />,
    },
    {
      label: 'Profile',
      href: '/settings',
      icon: () => <User size={19} />,
    },
  ]

  // 2. Veterinarian Navigation Items
  const vetItems: NavItemDef[] = [
    {
      label: 'Dashboard',
      href: '/vet/command-center',
      icon: () => <Home size={19} />,
    },
    {
      label: 'Cases',
      href: '/vet/cases',
      icon: () => <Folder size={19} />,
    },
    {
      label: 'Animals',
      href: '/vet/animals',
      icon: () => <BovineOutlineIcon className="w-5 h-5" />,
    },
    {
      label: 'Reports',
      href: '/vet/reports',
      icon: () => <BarChart3 size={19} />,
    },
    {
      label: 'Profile',
      href: '/settings',
      icon: () => <User size={19} />,
    },
  ]

  // 3. Administrator Navigation Items
  const adminItems: NavItemDef[] = [
    {
      label: 'Dashboard',
      href: '/admin/dashboard',
      icon: () => <Home size={19} />,
    },
    {
      label: 'GIS Map',
      href: '/admin/surveillance-map',
      icon: () => <Map size={19} />,
    },
    {
      label: 'Outbreaks',
      href: '/admin/outbreaks',
      icon: () => <ShieldAlert size={19} />,
    },
    {
      label: 'Analytics',
      href: '/admin/analytics',
      icon: () => <BarChart3 size={19} />,
    },
    {
      label: 'Profile',
      href: '/settings',
      icon: () => <User size={19} />,
    },
  ]

  const items = role === 'veterinarian' ? vetItems : role === 'admin' ? adminItems : farmerItems

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 lg:hidden shadow-lg safe-bottom"
    >
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center h-full transition-all select-none ${
                isActive ? 'text-[#1B5E3C]' : 'text-stone-500 hover:text-stone-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`px-3.5 py-1 rounded-full transition-all flex items-center justify-center ${
                    isActive ? 'bg-[#EBF5EE] text-[#1B5E3C]' : ''
                  }`}
                >
                  {item.icon(isActive)}
                </div>
                <span
                  className={`text-[10px] mt-0.5 tracking-tight font-sans transition-colors ${
                    isActive ? 'font-bold text-[#1B5E3C]' : 'font-medium text-stone-500'
                  }`}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

// Backward-compatible alias
export const FarmerBottomNav = MobileBottomNav
