/**
 * PASHURAKSHA (पशुरक्षा) — LIVESTOCK HEALTH SURVEILLANCE PLATFORM
 * Walking Cow Animated Loading Screen Component
 * "Detect Early. Prevent Outbreaks. Protect Livestock."
 */

interface WalkingCowLoadingProps {
  message?: string
  subMessage?: string
  fullScreen?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function WalkingCowLoading({
  message = 'Loading PashuRaksha...',
  subMessage = 'Detect Early. Prevent Outbreaks. Protect Livestock.',
  fullScreen = true,
  size = 'md'
}: WalkingCowLoadingProps) {
  const scale = size === 'sm' ? 0.55 : size === 'lg' ? 0.95 : 0.72

  return (
    <div
      className={`
        flex flex-col items-center justify-center select-none
        ${fullScreen ? 'min-h-screen w-full bg-[#F3F5F1] fixed inset-0 z-50' : 'p-6 w-full'}
      `}
      role="status"
      aria-label="Loading..."
    >
      <style>{`
        /* ─── Cow Walking Cycle Animations ─── */
        @keyframes cow-body-walk {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-2.5px) rotate(-0.5deg); }
          50% { transform: translateY(0.5px) rotate(0.3deg); }
          75% { transform: translateY(-2px) rotate(-0.3deg); }
        }

        @keyframes cow-head-bob {
          0%, 100% { transform: rotate(0deg) translateY(0px); }
          30% { transform: rotate(-2deg) translateY(-1px); }
          70% { transform: rotate(2.5deg) translateY(1.5px); }
        }

        @keyframes cow-tail-swish {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(18deg); }
        }

        @keyframes cow-ear-twitch {
          0%, 85%, 100% { transform: rotate(0deg); }
          90% { transform: rotate(-8deg); }
          95% { transform: rotate(6deg); }
        }

        /* Diagonal gait: Front-Left & Back-Right move in sync; Front-Right & Back-Left alternate */
        @keyframes leg-front-left {
          0% { transform: rotate(-18deg); }
          25% { transform: rotate(0deg) translateY(-2px); }
          50% { transform: rotate(18deg); }
          75% { transform: rotate(2deg); }
          100% { transform: rotate(-18deg); }
        }

        @keyframes leg-front-right {
          0% { transform: rotate(18deg); }
          25% { transform: rotate(2deg); }
          50% { transform: rotate(-18deg); }
          75% { transform: rotate(0deg) translateY(-2px); }
          100% { transform: rotate(18deg); }
        }

        @keyframes leg-back-left {
          0% { transform: rotate(16deg); }
          25% { transform: rotate(2deg); }
          50% { transform: rotate(-16deg); }
          75% { transform: rotate(0deg) translateY(-2px); }
          100% { transform: rotate(16deg); }
        }

        @keyframes leg-back-right {
          0% { transform: rotate(-16deg); }
          25% { transform: rotate(0deg) translateY(-2px); }
          50% { transform: rotate(16deg); }
          75% { transform: rotate(2deg); }
          100% { transform: rotate(-16deg); }
        }

        @keyframes cow-shadow-pulse {
          0%, 50%, 100% { transform: scaleX(1); opacity: 0.25; }
          25%, 75% { transform: scaleX(0.92); opacity: 0.18; }
        }

        @keyframes terrain-slide {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 48; }
        }

        .anim-cow-body { animation: cow-body-walk 0.9s ease-in-out infinite; }
        .anim-cow-head { animation: cow-head-bob 0.9s ease-in-out infinite; transform-origin: 52px 38px; }
        .anim-cow-tail { animation: cow-tail-swish 0.9s ease-in-out infinite; transform-origin: 154px 44px; }
        .anim-cow-ear { animation: cow-ear-twitch 3s ease-in-out infinite; transform-origin: 39px 28px; }
        .anim-leg-fl { animation: leg-front-left 0.9s ease-in-out infinite; transform-origin: 60px 64px; }
        .anim-leg-fr { animation: leg-front-right 0.9s ease-in-out infinite; transform-origin: 66px 62px; }
        .anim-leg-bl { animation: leg-back-left 0.9s ease-in-out infinite; transform-origin: 140px 62px; }
        .anim-leg-br { animation: leg-back-right 0.9s ease-in-out infinite; transform-origin: 146px 60px; }
        .anim-cow-shadow { animation: cow-shadow-pulse 0.9s ease-in-out infinite; transform-origin: 105px 114px; }
        .anim-terrain { animation: terrain-slide 1.2s linear infinite; }
      `}</style>

      {/* ─── Animated SVG Canvas ─── */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: `${260 * scale}px`, height: `${160 * scale}px` }}
      >
        <svg
          viewBox="0 0 210 130"
          className="w-full h-full overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Soft Shadow Gradient */}
            <radialGradient id="shadowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#102A43" stopOpacity="0.4" />
              <stop offset="70%" stopColor="#102A43" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#102A43" stopOpacity="0" />
            </radialGradient>

            {/* Indian Zebu / Cow Coat Gradient */}
            <linearGradient id="cowCoat" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="75%" stopColor="#F9F7F1" />
              <stop offset="100%" stopColor="#EDE8DA" />
            </linearGradient>

            {/* Far Legs Shading Gradient */}
            <linearGradient id="cowFarLeg" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D9D4C5" />
              <stop offset="100%" stopColor="#C4BEAC" />
            </linearGradient>

            {/* Spot Color */}
            <linearGradient id="patchColor" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1B5E3C" />
              <stop offset="100%" stopColor="#123C2A" />
            </linearGradient>

            {/* Muzzle Gradient */}
            <linearGradient id="muzzleGrad" x1="0%" y1="0%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#F8C8BA" />
              <stop offset="100%" stopColor="#EAA897" />
            </linearGradient>

            {/* Horns Gradient */}
            <linearGradient id="hornGrad" x1="0%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#C29B38" />
              <stop offset="50%" stopColor="#8A6A3D" />
              <stop offset="100%" stopColor="#3E2C12" />
            </linearGradient>
          </defs>

          {/* 1. Ground Shadow (Pulsing with steps) */}
          <ellipse
            cx="105"
            cy="114"
            rx="58"
            ry="6.5"
            fill="url(#shadowGrad)"
            className="anim-cow-shadow"
          />

          {/* 2. Scrolling Ground Track (Dashed line that slides backwards) */}
          <line
            x1="20"
            y1="115"
            x2="190"
            y2="115"
            stroke="#1B5E3C"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="8 16"
            strokeOpacity="0.35"
            className="anim-terrain"
          />
          {/* Subtle grass tufts */}
          <path
            d="M32 114L34 110M35 114L38 109M172 114L174 110M175 114L178 109"
            stroke="#1B5E3C"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeOpacity="0.4"
          />

          {/* 3. FAR LEGS (Drawn behind body for depth) */}
          {/* Far Front Leg (Right Leg) */}
          <g className="anim-leg-fr">
            {/* Upper Leg */}
            <path
              d="M66 62L69 86L67 107H60L62 86L64 62Z"
              fill="url(#cowFarLeg)"
            />
            {/* Hoof */}
            <path
              d="M59.5 107H67.5L68 112H59L59.5 107Z"
              fill="#2C2416"
            />
          </g>

          {/* Far Back Leg (Right Leg) */}
          <g className="anim-leg-br">
            {/* Upper & Lower Leg */}
            <path
              d="M144 58L150 84L148 107H141L143 84L138 58Z"
              fill="url(#cowFarLeg)"
            />
            {/* Hoof */}
            <path
              d="M140.5 107H148.5L149 112H140L140.5 107Z"
              fill="#2C2416"
            />
          </g>

          {/* 4. MAIN COW BODY (Animated Bobbing) */}
          <g className="anim-cow-body">
            {/* Udder */}
            <path
              d="M124 74C124 78 128 82 133 82C138 82 142 78 142 74Z"
              fill="#F5BDB0"
            />
            {/* Teats */}
            <rect x="127" y="81" width="1.8" height="3" rx="0.9" fill="#E8A697" />
            <rect x="133" y="82" width="1.8" height="3.2" rx="0.9" fill="#E8A697" />
            <rect x="138" y="81" width="1.8" height="3" rx="0.9" fill="#E8A697" />

            {/* Torso & Characteristic Indigenous Hump (Zebu trait) */}
            <path
              d="
                M 56 46
                C 56 40, 60 30, 68 28
                C 74 26, 78 33, 85 36
                C 105 35, 135 36, 148 42
                C 158 48, 160 62, 156 74
                C 152 79, 142 81, 130 80
                C 110 80, 88 83, 72 79
                C 58 76, 54 62, 56 46
                Z
              "
              fill="url(#cowCoat)"
              stroke="#D6D0BE"
              strokeWidth="1.2"
            />

            {/* Elegant Signature PashuRaksha Forest Green Spots / Patches */}
            {/* Spot 1: On Flank & Hip */}
            <path
              d="M125 44C135 44 148 48 148 58C148 68 138 74 128 72C122 70 120 62 122 54C123 48 120 45 125 44Z"
              fill="url(#patchColor)"
            />
            {/* Spot 2: On Shoulder & Hump */}
            <path
              d="M66 32C72 32 76 38 78 44C80 50 74 58 68 56C62 54 60 46 62 38C63 34 64 32 66 32Z"
              fill="url(#patchColor)"
            />
            {/* Spot 3: Small Accent Dot */}
            <circle cx="102" cy="52" r="5.5" fill="url(#patchColor)" />

            {/* Tail */}
            <g className="anim-cow-tail">
              <path
                d="M154 44 C162 52, 166 66, 163 80"
                stroke="#D6D0BE"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              {/* Tail Tuft */}
              <path
                d="M163 78C166 82 168 88 166 93C163 94 160 90 161 84Z"
                fill="#123C2A"
              />
            </g>

            {/* Dewlap (Skin fold under neck - prominent in Indian breeds) */}
            <path
              d="M48 54C46 62 50 70 54 74C52 68 50 60 52 54Z"
              fill="#E8E3D3"
            />

            {/* 5. COW HEAD (Animated Bobbing) */}
            <g className="anim-cow-head">
              {/* Head Profile */}
              <path
                d="
                  M 52 40
                  C 50 32, 44 26, 36 28
                  C 28 30, 22 38, 18 46
                  C 16 50, 18 56, 24 58
                  C 30 60, 38 58, 44 54
                  C 48 50, 52 46, 52 40
                  Z
                "
                fill="url(#cowCoat)"
                stroke="#D6D0BE"
                strokeWidth="1.2"
              />

              {/* Head Patch over forehead */}
              <path
                d="M38 28C44 28 48 34 46 42C44 46 38 48 34 44C32 40 34 32 38 28Z"
                fill="url(#patchColor)"
              />

              {/* Horns (Gentle curved bovine horns) */}
              {/* Left/Near Horn */}
              <path
                d="M38 28C38 20 42 12 45 9C44 14 43 20 41 28Z"
                fill="url(#hornGrad)"
              />
              {/* Right/Far Horn */}
              <path
                d="M44 27C45 19 49 13 52 11C50 16 48 21 46 27Z"
                fill="url(#hornGrad)"
                opacity="0.85"
              />

              {/* Ear (With subtle twitch) */}
              <g className="anim-cow-ear">
                <path
                  d="M43 32C52 30 56 36 53 41C48 42 44 38 43 32Z"
                  fill="url(#cowCoat)"
                  stroke="#D6D0BE"
                  strokeWidth="0.8"
                />
                {/* Inner ear pink */}
                <path
                  d="M45 33C50 32 53 36 51 39C48 40 46 37 45 33Z"
                  fill="#F5BDB0"
                />
              </g>

              {/* Muzzle / Snout */}
              <path
                d="M17 46C15 48 15 54 18 56C22 58 26 58 27 54C28 50 25 46 20 46H17Z"
                fill="url(#muzzleGrad)"
              />
              {/* Nostril */}
              <ellipse cx="20" cy="52" rx="1.5" ry="2" fill="#5A3A31" />
              {/* Mouth gentle smile line */}
              <path
                d="M19 55C22 56 24 55 25 54"
                stroke="#8C4E3F"
                strokeWidth="0.8"
                strokeLinecap="round"
                fill="none"
              />

              {/* Eye (Gentle, friendly bovine eye) */}
              <ellipse cx="30" cy="38" rx="2.5" ry="3.5" fill="#1C1B1A" />
              {/* Eye sparkle / reflection */}
              <circle cx="29" cy="36.5" r="1" fill="#FFFFFF" />
              {/* Eyelash / brow */}
              <path
                d="M27 34C29 33 32 34 34 35"
                stroke="#8A6A3D"
                strokeWidth="0.9"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          </g>

          {/* 6. NEAR LEGS (Foreground Legs) */}
          {/* Near Front Leg (Left Leg) */}
          <g className="anim-leg-fl">
            {/* Shoulder & Leg */}
            <path
              d="M58 64L62 86L60 109H53L55 86L53 64Z"
              fill="url(#cowCoat)"
              stroke="#D6D0BE"
              strokeWidth="1"
            />
            {/* Hoof */}
            <path
              d="M52.5 109H60.5L61 114H52L52.5 109Z"
              fill="#2C2416"
            />
          </g>

          {/* Near Back Leg (Left Leg) */}
          <g className="anim-leg-bl">
            {/* Hip & Leg */}
            <path
              d="M136 60L143 84L141 109H134L136 84L130 60Z"
              fill="url(#cowCoat)"
              stroke="#D6D0BE"
              strokeWidth="1"
            />
            {/* Hoof */}
            <path
              d="M133.5 109H141.5L142 114H133L133.5 109Z"
              fill="#2C2416"
            />
          </g>
        </svg>
      </div>

      {/* ─── Loading Text & Status Messaging ─── */}
      <div className="mt-2 text-center space-y-1 max-w-sm px-4">
        {/* Brand Moniker */}
        <div className="flex items-center justify-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-[#1B5E3C] animate-ping" />
          <span className="text-[11px] font-mono font-bold tracking-widest text-[#123C2A] uppercase">
            PASHURAKSHA &bull; पशुरक्षा
          </span>
          <span className="w-1 h-1 rounded-full bg-[#1B5E3C] animate-ping" />
        </div>

        {/* Primary Message */}
        <h3 className="text-sm sm:text-base font-bold text-[#102A43] tracking-tight">
          {message}
        </h3>

        {/* Subtitle / Tagline */}
        <p className="text-xs text-gray-600 font-medium leading-relaxed">
          {subMessage}
        </p>

        {/* Three Animated Bouncing Dots */}
        <div className="pt-1.5 flex items-center justify-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#1B5E3C] animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-[#1B5E3C] animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-[#1B5E3C] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
