import { useState, type ReactNode } from 'react'
import { ArrowDown, ChevronDown, ShieldCheck, Sparkles } from 'lucide-react'
import landscapeHeroUrl from '@/assets/landscape-hero.png'

export interface DashboardIntroHeroProps {
  role: 'farmer' | 'veterinarian' | 'admin' | 'shared'
  roleBadge?: string
  roleTitle?: string
  scrollProgress?: number // 0 (top) to 1 (scrolled threshold)
  onExploreClick?: () => void
}

export function DashboardIntroHero({
  role,
  roleBadge,
  roleTitle,
  scrollProgress = 0,
  onExploreClick,
}: DashboardIntroHeroProps) {
  const [imageLoaded, setImageLoaded] = useState(false)

  const defaultBadge =
    role === 'farmer'
      ? 'किसान डिजिटल स्वास्थ्य कमान · Grassroots Livestock Triage'
      : role === 'veterinarian'
      ? 'पशु चिकित्सा नैदानिक कमान केंद्र · Veterinary Clinical Command'
      : role === 'admin'
      ? 'राज्य पशु रोग निगरानी प्रकोष्ठ · State Epidemiological Surveillance'
      : 'राष्ट्रीय पशु स्वास्थ्य निगरानी प्रणाली · National Command Center'

  const activeBadge = roleBadge || defaultBadge

  // Desktop scroll interpolation values
  const clampedP = Math.min(1, Math.max(0, scrollProgress))
  const titleOpacity = Math.max(0, 1 - clampedP * 1.8)
  const titleTranslateY = -clampedP * 55
  const cueOpacity = Math.max(0, 1 - clampedP * 3.2)
  const glassOpacity = Math.min(0.92, clampedP * 1.5)
  const glassBlur = clampedP * 18
  const imgScale = 1.0 + clampedP * 0.04

  return (
    <>
      {/* ─── 1. MOBILE VIEW (Android & iOS Portrait) ───────────────────────────
          - Displays the complete, uncropped original landscape image.
          - Preserves natural 2048x768 (2.667:1) aspect ratio without cropping.
          - No extra heading, subtitles, promotional text, CTA buttons, or glass overlays.
          - Normal document flow: dashboard starts directly below the image.
      ──────────────────────────────────────────────────────────────────────── */}
      <div
        className="block lg:hidden w-full bg-[#0E2E20] overflow-hidden select-none shrink-0"
        aria-label="पशुरक्षा - Sovereign Livestock Surveillance"
      >
        <img
          src="/landscape-hero.png"
          alt="पशुरक्षा - Sovereign Livestock Surveillance"
          className="w-full h-auto block object-contain mx-auto"
          style={{
            aspectRatio: '2048 / 768',
            maxHeight: '48vh',
          }}
          loading="eager"
          decoding="async"
          onError={(e) => {
            const target = e.currentTarget
            if (target.src !== landscapeHeroUrl) {
              target.src = landscapeHeroUrl
            }
          }}
        />
      </div>

      {/* ─── 2. DESKTOP VIEW (Screens >= lg) ──────────────────────────────────
          - Retains the immersive full-viewport cinematic introductory hero.
          - Parallax image scale, dynamic frosted-glass bloom/dissolve.
          - Large Devanagari "पशुरक्षा" typography, transparent top navigation bar,
            and bottom scroll cue indicator intact.
      ──────────────────────────────────────────────────────────────────────── */}
      <header
        className="hidden lg:flex relative w-full h-screen min-h-[620px] max-h-[1100px] overflow-hidden select-none shrink-0 flex-col justify-between bg-[#0B1E13]"
        aria-label="PashuRaksha Sovereign Landscape Overview"
      >
        {/* Panoramic Landscape Illustration (Edge-to-Edge Desktop Cover) */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <img
            src="/landscape-hero.png"
            alt="PashuRaksha Sovereign Livestock Surveillance Pastoral Landscape"
            className={`w-full h-full object-cover object-center pointer-events-none select-none transition-opacity duration-500 ease-out ${
              imageLoaded ? 'opacity-100' : 'opacity-90'
            }`}
            style={{
              transform: `scale(${imgScale.toFixed(4)})`,
              transformOrigin: 'center center',
            }}
            loading="eager"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              const target = e.currentTarget
              if (target.src !== landscapeHeroUrl) {
                target.src = landscapeHeroUrl
              }
            }}
          />

          {/* Cinematic Vignette Overlays for Maximum Contrast */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(11, 30, 19, 0.55) 0%, rgba(0, 0, 0, 0.15) 35%, rgba(0, 0, 0, 0.25) 70%, rgba(11, 30, 19, 0.75) 100%)',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, transparent 35%, rgba(11, 30, 19, 0.35) 100%)',
            }}
          />
        </div>

        {/* Frosted Glass Transition Layer (Dynamic blur as user scrolls on desktop) */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-75"
          style={{
            opacity: glassOpacity.toFixed(3),
            backdropFilter: `blur(${glassBlur.toFixed(1)}px)`,
            WebkitBackdropFilter: `blur(${glassBlur.toFixed(1)}px)`,
            background:
              'linear-gradient(180deg, rgba(247, 245, 238, 0.15) 0%, rgba(243, 245, 241, 0.55) 50%, rgba(243, 245, 241, 0.95) 100%)',
          }}
          aria-hidden="true"
        />

        {/* Transparent Top Navigation Bar */}
        <nav
          className="relative z-20 w-full px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-3 text-white"
          aria-label="Landscape Intro Navigation"
        >
          {/* Left: Sovereign Authority Declaration */}
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8BC34A] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#8BC34A]" />
            </span>
            <span className="font-mono text-[11px] tracking-widest uppercase font-bold text-white/95 drop-shadow-md">
              SOVEREIGN LIVESTOCK SURVEILLANCE &middot; NADRS-II
            </span>
          </div>

          {/* Center: Context Role Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/35 border border-white/25 backdrop-blur-md text-xs font-medium text-white shadow-sm">
            <ShieldCheck size={14} className="text-[#8BC34A] shrink-0" />
            <span className="truncate max-w-md">{activeBadge}</span>
          </div>

          {/* Right: Smooth Explore Button */}
          <button
            type="button"
            onClick={onExploreClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#123C2A]/90 hover:bg-[#123C2A] text-white text-xs font-bold border border-white/25 backdrop-blur-md transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
            aria-label="Explore Dashboard"
          >
            <span>Explore Dashboard</span>
            <ArrowDown size={14} className="animate-pulse" />
          </button>
        </nav>

        {/* Large Luminous Hindi Brand Typography (Center of Sky & Mountains) */}
        <div
          className="relative z-20 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto my-auto pointer-events-none transition-transform duration-75"
          style={{
            opacity: titleOpacity.toFixed(3),
            transform: `translate3d(0, ${titleTranslateY.toFixed(1)}px, 0)`,
          }}
        >
          {/* Mission Purpose Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 border border-white/30 backdrop-blur-md text-white text-[11px] sm:text-xs font-mono tracking-widest uppercase mb-3 sm:mb-4 shadow-sm">
            <Sparkles size={13} className="text-[#F7F5EE]" />
            <span>डिजिटल पशु स्वास्थ्य निगरानी एवं पूर्व चेतावनी</span>
          </div>

          {/* Hero Hindi Brand Name */}
          <h1
            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight text-white select-none leading-none drop-shadow-2xl"
            style={{
              textShadow:
                '0 4px 30px rgba(0, 0, 0, 0.65), 0 2px 4px rgba(0, 0, 0, 0.8), 0 0 60px rgba(255, 255, 255, 0.25)',
              fontFamily: "'Noto Sans Devanagari', 'Mukta', 'Hind', sans-serif",
              letterSpacing: '0.04em',
            }}
          >
            पशुरक्षा
          </h1>

          {/* Hindi Tagline */}
          <p
            className="mt-3 sm:mt-4 text-base sm:text-xl lg:text-2xl font-bold text-[#F7F5EE] tracking-wide max-w-2xl font-sans"
            style={{ textShadow: '0 2px 14px rgba(0, 0, 0, 0.8)' }}
          >
            समय पर पहचानें। प्रकोप रोकें। पशुधन बचाएं।
          </p>

          {/* English Tagline */}
          <p
            className="mt-1 text-xs sm:text-sm font-medium text-white/95 font-mono tracking-wider max-w-xl"
            style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)' }}
          >
            Detect Early &bull; Prevent Outbreaks &bull; Protect Livestock
          </p>

          {/* Role Specific Command Subtitle */}
          {roleTitle && (
            <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1 rounded-[2px] bg-[#123C2A]/85 border border-white/25 text-[#F7F5EE] text-xs font-mono font-bold tracking-widest uppercase backdrop-blur-xs shadow-md">
              <span>{roleTitle}</span>
            </div>
          )}
        </div>

        {/* Subtle Bottom Scroll Indicator */}
        <div
          className="relative z-20 pb-7 sm:pb-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-opacity duration-150"
          onClick={onExploreClick}
          style={{
            opacity: cueOpacity.toFixed(3),
            pointerEvents: cueOpacity > 0.05 ? 'auto' : 'none',
          }}
        >
          <div className="px-4 py-2 rounded-full bg-black/40 hover:bg-black/60 border border-white/30 backdrop-blur-md text-white text-xs font-medium flex items-center gap-2 shadow-lg transition-all group hover:scale-105 active:scale-95">
            <span>नीचे स्क्रॉल करें &middot; Scroll down to enter dashboard</span>
            <ChevronDown
              size={15}
              className="text-[#8BC34A] animate-bounce group-hover:translate-y-0.5 transition-transform"
            />
          </div>
          <div className="w-1.5 h-5 rounded-full bg-white/35 overflow-hidden">
            <div className="w-full h-2 rounded-full bg-white animate-pulse" />
          </div>
        </div>
      </header>
    </>
  )
}

/**
 * Transparent pass-through wrapper for dashboard pages that mount children.
 * Ensures backward-compatibility with FarmerDashboardPage, VetCommandCenterPage,
 * AdminDashboardPage, and DashboardPage without conflicting overlays or negative margins.
 */
export function DashboardIntro({ children }: { children: ReactNode; [key: string]: any }) {
  return <>{children}</>
}
