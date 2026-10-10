import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Heart, ShieldAlert, Syringe, Bell } from 'lucide-react'

interface FarmerBottomNavProps {
  unreadAlertCount?: number
}

/**
 * Mobile Bottom Navigation for Farmers
 * Fixed bottom bar with prominent emergency triage action button.
 * Accessible touch targets (>= 48px), high contrast.
 */
export function FarmerBottomNav({ unreadAlertCount = 0 }: FarmerBottomNavProps) {
  return (
    <nav
      aria-label="Farmer Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#123C2A] text-white border-t border-[#1B5E3C] lg:hidden shadow-lg safe-bottom"
    >
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {/* 1. Dashboard */}
        <NavLink
          to="/farmer/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center h-full transition-colors ${
              isActive ? 'text-[#F7F5EE] font-bold' : 'text-white/70 hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1 rounded ${isActive ? 'bg-white/15' : ''}`}>
                <LayoutDashboard size={18} />
              </div>
              <span className="text-[10px] font-sans mt-0.5 tracking-tight">गृह / Home</span>
            </>
          )}
        </NavLink>

        {/* 2. Registered Livestock */}
        <NavLink
          to="/farmer/animals"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center h-full transition-colors ${
              isActive ? 'text-[#F7F5EE] font-bold' : 'text-white/70 hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1 rounded ${isActive ? 'bg-white/15' : ''}`}>
                <Heart size={18} />
              </div>
              <span className="text-[10px] font-sans mt-0.5 tracking-tight">पशु / Animals</span>
            </>
          )}
        </NavLink>

        {/* 3. Emergency Report (Prominent Center Button) */}
        <div className="flex flex-col items-center justify-center -mt-4">
          <NavLink
            to="/farmer/report-health"
            className="flex flex-col items-center justify-center w-13 h-13 rounded-full bg-[#C62828] hover:bg-[#A81D1D] active:bg-[#7B1818] text-white shadow-md border-2 border-white transition-transform active:scale-95 cursor-pointer"
            aria-label="Report Disease Emergency"
          >
            <ShieldAlert size={22} className="animate-pulse" />
          </NavLink>
          <span className="text-[9px] font-bold text-red-200 mt-1 uppercase font-mono tracking-tighter">
            रिपोर्ट / REPORT
          </span>
        </div>

        {/* 4. Vaccinations */}
        <NavLink
          to="/farmer/vaccinations"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center h-full transition-colors ${
              isActive ? 'text-[#F7F5EE] font-bold' : 'text-white/70 hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1 rounded ${isActive ? 'bg-white/15' : ''}`}>
                <Syringe size={18} />
              </div>
              <span className="text-[10px] font-sans mt-0.5 tracking-tight">टीका / Vaccine</span>
            </>
          )}
        </NavLink>

        {/* 5. Alerts */}
        <NavLink
          to="/farmer/alerts"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center h-full transition-colors relative ${
              isActive ? 'text-[#F7F5EE] font-bold' : 'text-white/70 hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1 rounded relative ${isActive ? 'bg-white/15' : ''}`}>
                <Bell size={18} />
                {unreadAlertCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C62828] text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
                    {unreadAlertCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-sans mt-0.5 tracking-tight">अलर्ट / Alerts</span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  )
}
