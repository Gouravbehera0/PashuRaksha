// === PashuRaksha Official Emblem & Wordmark (SVG) ===
// Concept: Institutional Shield + Bovine Silhouette + Agricultural Laurel + Radar Telemetry
// Authoritative government digital-infrastructure visual identity

interface LogoMarkProps {
  size?: number
  className?: string
}

export function LogoMark({ size = 40, className = '' }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="PashuRaksha Emblem"
      role="img"
    >
      {/* Outer Institutional Shield Contour */}
      <path
        d="M24 3L6 10.5V23C6 34.2 13.7 44.5 24 47C34.3 44.5 42 34.2 42 23V10.5L24 3Z"
        fill="#123C2A"
      />
      {/* Inner Accent Inset Border */}
      <path
        d="M24 5.5L8.5 12V23C8.5 32.8 15.1 41.8 24 44.2C32.9 41.8 39.5 32.8 39.5 23V12L24 5.5Z"
        stroke="#8A6A3D"
        strokeWidth="1.2"
        fill="#1B5E3C"
        strokeOpacity="0.75"
      />

      {/* Surveillance / Telemetry Crest Pulse */}
      <path
        d="M20 9C21.2 8.3 22.6 8 24 8C25.4 8 26.8 8.3 28 9"
        stroke="#F7F5EE"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />
      <circle cx="24" cy="11.5" r="1.5" fill="#F7F5EE" />

      {/* Stylized Bovine / Cattle Geometry (Dignified Profile) */}
      {/* Crescent Horns */}
      <path
        d="M14 17C15.5 13 18.5 12 21 15C19 16.5 17 19.5 16.5 22.5"
        stroke="#F7F5EE"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M34 17C32.5 13 29.5 12 27 15C29 16.5 31 19.5 31.5 22.5"
        stroke="#F7F5EE"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Head Crest & Muzzle Silhouette */}
      <path
        d="M18.5 20C18.5 18 20.5 16.5 24 16.5C27.5 16.5 29.5 18 29.5 20C29.5 23 28 27.5 26.5 30C25.5 31.5 24.8 32 24 32C23.2 32 22.5 31.5 21.5 30C20 27.5 18.5 23 18.5 20Z"
        fill="#F7F5EE"
      />
      {/* Cattle Muzzle Accent */}
      <path
        d="M21 28.5C21.8 28.2 22.8 28 24 28C25.2 28 26.2 28.2 27 28.5C26.5 30.2 25.5 31.2 24 31.2C22.5 31.2 21.5 30.2 21 28.5Z"
        fill="#123C2A"
      />

      {/* Agricultural Sheaf Base (Twin Leaves) */}
      <path
        d="M17 38.5C19 35 22 34 24 35.5C22 36.5 20 39.5 17 38.5Z"
        fill="#2E7D32"
        stroke="#F7F5EE"
        strokeWidth="0.5"
      />
      <path
        d="M31 38.5C29 35 26 34 24 35.5C26 36.5 28 39.5 31 38.5Z"
        fill="#2E7D32"
        stroke="#F7F5EE"
        strokeWidth="0.5"
      />
      <circle cx="24" cy="37" r="1.2" fill="#8A6A3D" />
    </svg>
  )
}

// === Full Logo (Emblem + Institutional Wordmark) ===

interface LogoProps {
  variant?: 'default' | 'white' | 'compact'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const logoSizes = {
  sm: { mark: 30, title: 'text-sm tracking-widest', subtitle: 'text-[9px] tracking-wider' },
  md: { mark: 38, title: 'text-base tracking-widest', subtitle: 'text-[10px] tracking-wider' },
  lg: { mark: 52, title: 'text-2xl tracking-widest', subtitle: 'text-xs tracking-wider' },
}

export function Logo({ variant = 'default', size = 'md', className = '' }: LogoProps) {
  const sizes = logoSizes[size]
  const titleColor = variant === 'white' ? 'text-white' : 'text-[#102A43]'
  const subtitleColor = variant === 'white' ? 'text-[#F7F5EE]/80' : 'text-[#1B5E3C]'

  return (
    <div className={`flex items-center gap-3 ${className}`} aria-label="PashuRaksha Platform">
      <LogoMark size={sizes.mark} className="shrink-0 drop-shadow-sm" />
      <div className="flex flex-col leading-tight select-none">
        <span className={`font-extrabold uppercase font-sans ${sizes.title} ${titleColor}`}>
          PashuRaksha
        </span>
        {variant !== 'compact' && (
          <span className={`${sizes.subtitle} ${subtitleColor} font-semibold uppercase font-sans`}>
            Livestock Health Intelligence Platform
          </span>
        )}
      </div>
    </div>
  )
}
