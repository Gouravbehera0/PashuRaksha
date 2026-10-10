import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { FarmerBottomNav } from '@/components/layout/FarmerBottomNav'
import { useAuth } from '@/hooks/useAuth'

/**
 * AppLayout — The main institutional application shell.
 * Structure:
 *   Top: GIGW Utility strip
 *         ↓
 *   Main Header: Emblem + Navigation + Profile
 *         ↓
 *   Sidebar + Content Area
 *         ↓
 *   Footer/Status Area: System telemetry & security indicators
 *         ↓
 *   Mobile Bottom Nav (For Farmers)
 */
export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { role } = useAuth()

  return (
    <div className="h-screen h-[100dvh] w-full flex flex-col overflow-hidden bg-[#F3F5F1]">
      {/* Top Header System — Stable & Fixed at Top */}
      <Header
        onMenuOpen={() => setSidebarOpen(true)}
        notificationCount={2}
      />

      {/* Main Body: Fixed Left Sidebar + Scrollable Main Content */}
      <div className="flex flex-1 min-h-0 min-w-0 relative overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main
          className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden flex flex-col bg-[#F3F5F1]"
          id="main-content"
          tabIndex={-1}
          aria-label="Main content"
        >
          {/* Skip-to-content accessibility target */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 bg-[#1B5E3C] text-white px-3 py-1.5 rounded-[2px] z-50 text-xs font-mono font-bold uppercase tracking-wider"
          >
            Skip to Main Content
          </a>

          {/* Dynamic Module Canvas */}
          <div className={`flex-1 ${role === 'farmer' ? 'pb-20 lg:pb-6' : 'pb-6'}`}>
            <Outlet />
          </div>

          {/* Institutional Status & Telemetry Footer Area */}
          <footer className={`bg-white border-t border-stone-300 py-1.5 px-3 sm:px-4 text-[10px] font-mono text-stone-600 flex flex-col sm:flex-row sm:items-center justify-between gap-1 select-none z-10 shrink-0 ${role === 'farmer' ? 'mb-16 lg:mb-0' : ''}`}>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="font-bold text-[#123C2A]">PASHURAKSHA</span>
              <span className="text-stone-300">|</span>
              <span>NODE: CENTRAL-SURVEILLANCE-01</span>
              <span className="text-stone-300 hidden md:inline">|</span>
              <span className="text-stone-500 hidden md:inline">PROTOCOL: NADRS-II COMPLIANT</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto">
              <span className="flex items-center gap-1.5 text-[#1B5E3C] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] animate-pulse" aria-hidden="true" />
                SURVEILLANCE TELEMETRY ONLINE
              </span>
              <span className="text-stone-300">|</span>
              <span className="text-stone-500">DIGITAL LIVESTOCK INFRASTRUCTURE</span>
            </div>
          </footer>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Farmers) */}
      {role === 'farmer' && <FarmerBottomNav />}
    </div>
  )
}
