import { useState, useRef, useEffect, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { FarmerBottomNav } from '@/components/layout/FarmerBottomNav'
import { DashboardIntroHero } from '@/components/dashboard/DashboardIntro'
import { useAuth } from '@/hooks/useAuth'

function getHeroConfig(pathname: string, userRole?: string | null) {
  if (pathname.startsWith('/farmer')) {
    return {
      role: 'farmer' as const,
      roleBadge: 'किसान डिजिटल स्वास्थ्य कमान · Grassroots Livestock Triage',
      roleTitle: 'Farmer Livestock Health Command',
    }
  }
  if (pathname.startsWith('/vet')) {
    return {
      role: 'veterinarian' as const,
      roleBadge: 'पशु चिकित्सा नैदानिक कमान केंद्र · Veterinary Clinical Command',
      roleTitle: 'Veterinary Command Center',
    }
  }
  if (pathname.startsWith('/admin')) {
    return {
      role: 'admin' as const,
      roleBadge: 'राज्य पशु रोग निगरानी प्रकोष्ठ · State Epidemiological Surveillance',
      roleTitle: 'State Livestock Health Intelligence',
    }
  }
  return {
    role: (userRole || 'shared') as 'farmer' | 'veterinarian' | 'admin' | 'shared',
    roleBadge: 'राष्ट्रीय पशु स्वास्थ्य निगरानी कमान · National Command Center',
    roleTitle: 'National Livestock Health Command',
  }
}

/**
 * AppLayout — The main institutional application shell.
 * Supports:
 * 1. Main Landing Dashboards (/farmer/dashboard, /vet/command-center, /admin/dashboard, /dashboard):
 *    - Mobile (Portrait): Complete uncropped landscape image (no extra text) -> Header -> Dashboard content
 *    - Desktop: Full-width edge-to-edge landscape hero with scroll-driven glass reveal & sticky sidebar docking
 * 2. All Other Routes (/farmer/animals, /vet/cases, /admin/analytics, etc.):
 *    - Standard fixed shell with immediate Header and Sidebar, zero intro overhead
 */
export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [headerHeight, setHeaderHeight] = useState(86) // Baseline fallback (matches rendered Header)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const { role } = useAuth()

  // Identify whether current route is a main landing dashboard
  const isMainDashboard = [
    '/farmer/dashboard',
    '/vet/command-center',
    '/vet/dashboard',
    '/admin/dashboard',
    '/dashboard',
  ].includes(location.pathname)

  // Dynamically measure actual Header height to prevent desktop sidebar clipping
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight
        if (height > 0) {
          setHeaderHeight(height)
        }
      }
    }

    updateHeaderHeight()

    const ro = new ResizeObserver(() => {
      updateHeaderHeight()
    })

    if (headerRef.current) {
      ro.observe(headerRef.current)
    }

    window.addEventListener('resize', updateHeaderHeight)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updateHeaderHeight)
    }
  }, [isMainDashboard, location.pathname, role])

  // Reset scroll container on route transition
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
    setScrollProgress(0)
    setSidebarOpen(false)
  }, [location.pathname])

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const st = container.scrollTop
    // Normalized 0 to 1 progress over first 400px of scroll for desktop parallax & glass dynamics
    const progress = Math.min(1, Math.max(0, st / 400))
    setScrollProgress(progress)
  }, [])

  const handleExploreClick = () => {
    const el = document.getElementById('dashboard-anchor')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const heroConfig = getHeroConfig(location.pathname, role)

  // ─── 1. Main Landing Dashboard Layout (Responsive Mobile & Desktop) ──────
  if (isMainDashboard) {
    return (
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        id="main-scroll-container"
        className="h-screen h-[100dvh] w-full overflow-y-auto overflow-x-hidden bg-[#F3F5F1] relative scroll-smooth"
        tabIndex={-1}
      >
        {/* Intro Section: Complete uncropped image on mobile portrait; cinematic hero on desktop */}
        <DashboardIntroHero
          role={heroConfig.role}
          roleBadge={heroConfig.roleBadge}
          roleTitle={heroConfig.roleTitle}
          scrollProgress={scrollProgress}
          onExploreClick={handleExploreClick}
        />

        {/* Dashboard Anchor & Shell: Starts directly below the image */}
        <div id="dashboard-anchor" className="w-full relative min-h-screen flex flex-col bg-[#F3F5F1]">
          {/* Top Header - Sticky at top of viewport when reached */}
          <div ref={headerRef} className="sticky top-0 z-30 w-full shadow-xs bg-white">
            <Header
              onMenuOpen={() => setSidebarOpen(true)}
              notificationCount={2}
            />
          </div>

          {/* Main Body: Desktop Sticky Sidebar + Flowing Dashboard Content */}
          <div
            className="flex flex-1 w-full relative"
            style={{ minHeight: `calc(100vh - ${headerHeight}px)` }}
          >
            {/* Desktop Sticky Sidebar - Offset exactly by actual measured header height */}
            <div
              className="hidden lg:block shrink-0 sticky z-20"
              style={{
                top: `${headerHeight}px`,
                height: `calc(100vh - ${headerHeight}px)`,
              }}
            >
              <Sidebar
                isOpen={false}
                onClose={() => {}}
              />
            </div>

            {/* Dynamic Dashboard Module Canvas */}
            <main
              className="flex-1 min-w-0 flex flex-col bg-[#F3F5F1]"
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

              <div className="flex-1 pb-20 lg:pb-6">
                <Outlet />
              </div>

              {/* Institutional Status & Telemetry Footer Area */}
              <footer className="bg-white border-t border-stone-300 py-1.5 px-3 sm:px-4 text-[10px] font-mono text-stone-600 flex flex-col sm:flex-row sm:items-center justify-between gap-1 select-none z-10 shrink-0 mb-16 lg:mb-0">
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
        </div>

        {/* Mobile Drawer Sidebar */}
        <div className="lg:hidden">
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        {/* Mobile Bottom Navigation Bar (Active on Mobile for all roles) */}
        <FarmerBottomNav />
      </div>
    )
  }

  // ─── 2. Standard Shell for All Other Internal Routes (Zero Intro, Fixed Frame) ─
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
          <div className="flex-1 pb-20 lg:pb-6">
            <Outlet />
          </div>

          {/* Institutional Status & Telemetry Footer Area */}
          <footer className="bg-white border-t border-stone-300 py-1.5 px-3 sm:px-4 text-[10px] font-mono text-stone-600 flex flex-col sm:flex-row sm:items-center justify-between gap-1 select-none z-10 shrink-0 mb-16 lg:mb-0">
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

      {/* Mobile Bottom Navigation Bar */}
      <FarmerBottomNav />
    </div>
  )
}
