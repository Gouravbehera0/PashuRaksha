import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2, ShieldCheck, Phone, CheckCircle2 } from 'lucide-react'
import { Logo, LogoMark } from '@/components/ui/Logo'
import { signIn, getDashboardPath, getUserRole } from '@/services/auth'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { loginAsPreviewRole } = useAuth()

  const handlePreviewRole = (selectedRole: UserRole) => {
    loginAsPreviewRole(selectedRole)
    navigate(getDashboardPath(selectedRole), { replace: true })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Please enter your registered credentials.')
      return
    }
    setError(null)
    setIsLoading(true)

    const result = await signIn({ email: email.trim(), password })
    setIsLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    if (result.user) {
      const role = await getUserRole(result.user.id)
      const path = role ? getDashboardPath(role) : '/dashboard'
      navigate(path, { replace: true })
    }
  }

  return (
    <div className="h-full min-h-screen overflow-y-auto flex flex-col lg:flex-row bg-[#F3F5F1]">
      {/* Left Panel: Institutional Authority & Strategic Mission */}
      <div className="relative lg:w-[54%] bg-[#123C2A] text-white flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-hidden border-r border-[#1B5E3C]">
        {/* Subtle Topographical GIS Grid Background */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#F7F5EE 1px, transparent 1px), radial-gradient(#F7F5EE 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
            backgroundPosition: '0 0, 16px 16px',
          }}
          aria-hidden="true"
        />

        {/* Top Header & Emblem */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <Logo variant="white" size="md" />
            <span className="hidden sm:inline-block font-mono text-[9px] uppercase tracking-widest text-[#F7F5EE]/70 border border-white/20 px-2 py-0.5 rounded-[1px] bg-white/5">
              DIGITAL HEALTH PLATFORM
            </span>
          </div>

          {/* National Mission Statement */}
          <div className="max-w-lg mt-6 lg:mt-12">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#1B5E3C] border border-[#2E7D32]/50 rounded-[2px] text-[10px] font-mono tracking-widest uppercase text-[#F7F5EE] mb-4">
              <ShieldCheck size={12} className="text-[#8BC34A]" />
              <span>DIGITAL LIVESTOCK SURVEILLANCE INFRASTRUCTURE</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
              Detect Early.
              <br />
              <span className="text-[#F7F5EE] border-b-2 border-b-[#8A6A3D]">Prevent Outbreaks.</span>
              <br />
              Protect Livestock.
            </h1>

            <p className="mt-4 text-sm sm:text-base text-white/80 leading-relaxed font-sans">
              A serious, multi-tier digital surveillance network interconnecting rural livestock farmers, clinical veterinarians, and state epidemiology authorities for early outbreak suppression.
            </p>
          </div>
        </div>

        {/* Operational Architecture Highlights */}
        <div className="relative z-10 my-8 space-y-3.5 max-w-lg border-y border-white/10 py-6">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-[2px] bg-[#1B5E3C] text-white flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
              1
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Village-Level Active Triage</p>
              <p className="text-[11px] text-white/70">Farmers and field officers report clinical abnormalities with zero friction.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-[2px] bg-[#1B5E3C] text-white flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
              2
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Veterinary Clinical Intervention</p>
              <p className="text-[11px] text-white/70">Registered veterinary doctors verify symptoms, dispatch MVUs, and prescribe ring vaccination.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-[2px] bg-[#1B5E3C] text-white flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
              3
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Epidemiological GIS Early Warning</p>
              <p className="text-[11px] text-white/70">Automated spatial clustering maps outbreak containment zones across district borders.</p>
            </div>
          </div>
        </div>

        {/* Footer Authority Declaration */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono text-white/60">
          <span>COMPLIANT WITH NADRS-II SURVEILLANCE PROTOCOLS</span>
          <span>STAGE 1 ARCHITECTURAL FOUNDATION</span>
        </div>
      </div>

      {/* Right Panel: Institutional Login & Prototype Inspection Console */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 lg:px-14 py-10">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Emblem */}
          <div className="lg:hidden mb-6 flex items-center justify-between">
            <LogoMark size={44} />
            <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-2 py-0.5 border border-stone-200">
              STAGE 1 PROTOTYPE
            </span>
          </div>

          {/* Form Header */}
          <div className="border-b border-stone-300 pb-4 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-stone-100 text-stone-700 px-1.5 py-0.5 border border-stone-300">
                OFFICIAL LOGIN &middot; सुरक्षित प्रवेश
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#102A43] tracking-tight font-sans">
              Portal Authentication
            </h2>
            <p className="text-xs text-stone-600 mt-1">
              Enter authorized credentials to access national livestock health systems.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 font-sans" noValidate>
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3 bg-[#FFF8F7] border border-[#C62828]/50 rounded-[2px] text-[#7B1818] text-xs font-sans"
              >
                <AlertCircle size={15} className="mt-0.5 shrink-0 text-[#C62828]" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                Official Email / Mobile Identifier
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@pashuraksha.in or +91 Mobile"
                  disabled={isLoading}
                  className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded-[2px] text-xs font-sans
                    focus:outline-none focus:ring-2 focus:ring-[#1B5E3C] focus:border-[#1B5E3C]
                    disabled:bg-stone-50 disabled:text-stone-400 bg-white text-[#102A43]"
                  aria-required="true"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Secure Password
                </label>
                <a
                  href="#"
                  className="text-[11px] text-[#1B5E3C] font-semibold hover:underline"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter authorized password"
                  disabled={isLoading}
                  className="w-full pl-9 pr-9 py-2.5 border border-stone-300 rounded-[2px] text-xs font-sans
                    focus:outline-none focus:ring-2 focus:ring-[#1B5E3C] focus:border-[#1B5E3C]
                    disabled:bg-stone-50 disabled:text-stone-400 bg-white text-[#102A43]"
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4
                bg-[#1B5E3C] hover:bg-[#123C2A] active:bg-[#0E2E20]
                text-white font-bold text-xs uppercase tracking-wider rounded-[2px]
                transition-colors min-h-[46px] cursor-pointer shadow-xs
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B5E3C]"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                  AUTHENTICATING...
                </>
              ) : (
                'SECURE SIGN IN &middot; प्रवेश करें'
              )}
            </button>
          </form>

          {/* Interactive Role Inspection Console */}
          <div className="mt-8 p-4 bg-[#F7F5EE] border border-stone-300 rounded-[2px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#123C2A]">
                PORTAL ACCESS: ROLE PREVIEWS
              </span>
              <span className="text-[9px] font-mono bg-[#EBF5EE] text-[#1B5E3C] px-1.5 py-0.2 rounded-[1px] font-bold">
                INSTANT SWITCH
              </span>
            </div>
            <p className="text-xs text-stone-600 mb-3 leading-relaxed">
              Explore the role-segregated portals and visual command center without setting up a remote database:
            </p>

            <div className="grid grid-cols-3 gap-2 font-mono">
              <button
                type="button"
                onClick={() => handlePreviewRole('farmer')}
                className="px-2 py-2.5 bg-white border border-[#2E7D32]/40 hover:border-[#2E7D32] hover:bg-green-50 text-[#123C2A] text-xs font-bold rounded-[2px] text-center transition-colors cursor-pointer shadow-2xs"
              >
                FARMER
              </button>
              <button
                type="button"
                onClick={() => handlePreviewRole('veterinarian')}
                className="px-2 py-2.5 bg-white border border-[#102A43]/40 hover:border-[#102A43] hover:bg-blue-50 text-[#102A43] text-xs font-bold rounded-[2px] text-center transition-colors cursor-pointer shadow-2xs"
              >
                VET OFFICER
              </button>
              <button
                type="button"
                onClick={() => handlePreviewRole('admin')}
                className="px-2 py-2.5 bg-white border border-[#8A6A3D]/40 hover:border-[#8A6A3D] hover:bg-stone-50 text-[#102A43] text-xs font-bold rounded-[2px] text-center transition-colors cursor-pointer shadow-2xs"
              >
                ADMIN
              </button>
            </div>

            <div className="mt-3 pt-2 border-t border-stone-200 flex items-center justify-between text-[10px] font-mono text-stone-500">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={11} className="text-[#1B5E3C]" />
                Supabase Auth Ready (.env.local)
              </span>
              <span>ENC: 256-BIT</span>
            </div>
          </div>

          {/* National Animal Helpline Banner */}
          <div className="mt-6 flex items-center justify-between p-3 bg-stone-100 border border-stone-200 rounded-[2px] text-xs font-mono text-stone-700">
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-[#1B5E3C]" />
              <span>ANIMAL HUSBANDRY HELPLINE: <strong>1962</strong></span>
            </div>
            <span className="text-[10px] text-stone-500">TOLL FREE</span>
          </div>
        </div>
      </div>
    </div>
  )
}
