import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Phone,
  CheckCircle2,
  UserPlus,
  KeyRound,
  User,
  MapPin,
  Building2,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { Logo, LogoMark } from '@/components/ui/Logo'
import { signIn, getDashboardPath, getUserRole } from '@/services/auth'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types'

export function LoginPage() {
  const navigate = useNavigate()
  const { loginAsPreviewRole } = useAuth()

  // Tabs: 'signin' | 'register' | 'forgot' | 'preview'
  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'forgot' | 'preview'>('signin')

  // Sign In State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Registration State
  const [regRole, setRegRole] = useState<'farmer' | 'veterinarian'>('farmer')
  const [regName, setRegName] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regDistrict, setRegDistrict] = useState('Bulandshahr')
  const [regState, setRegState] = useState('Uttar Pradesh')
  const [regIdentifier, setRegIdentifier] = useState('') // Aadhaar or VCI
  const [regPassword, setRegPassword] = useState('')
  const [regLoading, setRegLoading] = useState(false)

  // Forgot Password State
  const [forgotInput, setForgotInput] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [enteredOtp, setEnteredOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  const handlePreviewRole = (selectedRole: UserRole) => {
    loginAsPreviewRole(selectedRole)
    navigate(getDashboardPath(selectedRole), { replace: true })
  }

  const handleSignIn = async (e: React.FormEvent) => {
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

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (!regName.trim() || !regPhone.trim() || !regPassword.trim()) {
      setError('Please fill in all required registration fields.')
      return
    }

    setError(null)
    setRegLoading(true)

    setTimeout(() => {
      setRegLoading(false)
      loginAsPreviewRole(regRole)
      navigate(getDashboardPath(regRole), { replace: true })
    }, 1200)
  }

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotInput.trim()) {
      setError('Please enter your registered mobile number or official email.')
      return
    }
    setError(null)
    setForgotLoading(true)
    setTimeout(() => {
      setForgotLoading(false)
      setOtpSent(true)
      setSuccessMessage(`OTP sent successfully to ${forgotInput}. Simulated Verification Code: 4821`)
    }, 1000)
  }

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!enteredOtp || enteredOtp !== '4821') {
      setError('Invalid OTP code. Please enter 4821.')
      return
    }
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setForgotLoading(true)
    setTimeout(() => {
      setForgotLoading(false)
      setOtpSent(false)
      setActiveTab('signin')
      setSuccessMessage('Password reset successfully. Please sign in with your new password.')
    }, 1000)
  }

  return (
    <div className="h-full min-h-screen overflow-y-auto flex flex-col lg:flex-row bg-[#F3F5F1]">
      {/* Left Panel: Institutional Authority & Strategic Mission */}
      <div className="relative lg:w-[50%] bg-[#123C2A] text-white flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-hidden border-r border-[#1B5E3C]">
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

        {/* Top Header & Sovereign Emblem */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <Logo variant="white" size="md" />
            <span className="hidden sm:inline-block font-mono text-[9px] uppercase tracking-widest text-[#F7F5EE]/80 border border-white/20 px-2.5 py-0.5 rounded-[1px] bg-white/10">
              NATIONAL SURVEILLANCE PLATFORM
            </span>
          </div>

          {/* National Mission Statement */}
          <div className="max-w-lg mt-6 lg:mt-10">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#1B5E3C] border border-[#2E7D32]/50 rounded-[2px] text-[10px] font-mono tracking-widest uppercase text-[#F7F5EE] mb-4">
              <ShieldCheck size={12} className="text-[#8BC34A]" />
              <span>SOVEREIGN DIGITAL HEALTH INFRASTRUCTURE</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
              Detect Early.
              <br />
              <span className="text-[#F7F5EE] border-b-2 border-b-[#8A6A3D]">Prevent Outbreaks.</span>
              <br />
              Protect Livestock.
            </h1>

            <p className="mt-4 text-sm sm:text-base text-white/85 leading-relaxed font-sans">
              A unified, multi-tier digital disease surveillance network interconnecting rural livestock farmers, clinical veterinary officers, and state epidemiology authorities for early outbreak suppression.
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
              <p className="text-[11px] text-white/70">Farmers and field officers report clinical abnormalities with offline voice & vernacular support.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-[2px] bg-[#1B5E3C] text-white flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
              2
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Veterinary Clinical Intervention</p>
              <p className="text-[11px] text-white/70">VCI licensed doctors verify cases, dispatch MVUs, and manage ring-vaccination cordons.</p>
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
          <span>TIER-3 SOVEREIGN DATA RESIDENCY</span>
        </div>
      </div>

      {/* Right Panel: Authentication Console with 4 Tabs */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 lg:px-14 py-8">
        <div className="w-full max-w-lg mx-auto">
          {/* Mobile Emblem */}
          <div className="lg:hidden mb-6 flex items-center justify-between">
            <LogoMark size={44} />
            <span className="text-[10px] font-mono text-stone-600 bg-stone-100 px-2 py-0.5 border border-stone-200">
              PASHURAKSHA SOVEREIGN
            </span>
          </div>

          {/* Tab Navigation Switcher */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-stone-200/80 rounded-lg mb-6 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin')
                setError(null)
                setSuccessMessage(null)
              }}
              className={`py-2 px-1 rounded-md transition-all text-center ${
                activeTab === 'signin'
                  ? 'bg-white text-forest-900 font-bold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register')
                setError(null)
                setSuccessMessage(null)
              }}
              className={`py-2 px-1 rounded-md transition-all text-center ${
                activeTab === 'register'
                  ? 'bg-white text-forest-900 font-bold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('forgot')
                setError(null)
                setSuccessMessage(null)
              }}
              className={`py-2 px-1 rounded-md transition-all text-center ${
                activeTab === 'forgot'
                  ? 'bg-white text-forest-900 font-bold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Reset Key
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('preview')
                setError(null)
                setSuccessMessage(null)
              }}
              className={`py-2 px-1 rounded-md transition-all text-center ${
                activeTab === 'preview'
                  ? 'bg-white text-forest-900 font-bold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Role Test
            </button>
          </div>

          {/* Form Header */}
          <div className="border-b border-stone-300 pb-3 mb-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-forest-50 text-forest-800 px-2 py-0.5 border border-forest-200 rounded">
                {activeTab === 'signin' && 'OFFICIAL LOGIN · सुरक्षित प्रवेश'}
                {activeTab === 'register' && 'SELF REGISTRATION · नया पंजीकरण'}
                {activeTab === 'forgot' && 'SECURITY CREDENTIAL RECOVERY · पासवर्ड रीसेट'}
                {activeTab === 'preview' && 'INSTANT EVALUATION SANDBOX · त्वरित भूमिका'}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#102A43] tracking-tight font-sans">
              {activeTab === 'signin' && 'Portal Authentication'}
              {activeTab === 'register' && 'Register Official Account'}
              {activeTab === 'forgot' && 'Reset Secure Password'}
              {activeTab === 'preview' && 'Instant Sandbox Access'}
            </h2>
            <p className="text-xs text-stone-600 mt-1">
              {activeTab === 'signin' && 'Enter authorized credentials to access national livestock health systems.'}
              {activeTab === 'register' && 'Create a verified Farmer or Veterinary Officer profile on PashuRaksha.'}
              {activeTab === 'forgot' && 'Authenticate via verified mobile OTP to reset platform access keys.'}
              {activeTab === 'preview' && 'Select an authority role below to evaluate live platform modules immediately.'}
            </p>
          </div>

          {/* Global Alert Messages */}
          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs font-sans"
            >
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="mb-4 flex items-start gap-2.5 p-3 bg-forest-50 border border-forest-300 rounded-lg text-forest-900 text-xs font-sans"
            >
              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-forest-700" aria-hidden="true" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4 font-sans" noValidate>
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
                    className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded-md text-xs font-sans
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
                  <button
                    type="button"
                    onClick={() => setActiveTab('forgot')}
                    className="text-[11px] text-[#1B5E3C] font-semibold hover:underline"
                  >
                    Forgot Password?
                  </button>
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
                    className="w-full pl-9 pr-9 py-2.5 border border-stone-300 rounded-md text-xs font-sans
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
                  text-white font-bold text-xs uppercase tracking-wider rounded-md
                  transition-colors min-h-[46px] cursor-pointer shadow-xs
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B5E3C]"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                    AUTHENTICATING...
                  </>
                ) : (
                  'SECURE SIGN IN · प्रवेश करें'
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-stone-500">Don't have an official account? </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-xs font-bold text-forest-700 hover:underline"
                >
                  Register here
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5 font-sans" noValidate>
              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                  Designation / Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('farmer')}
                    className={`py-2 px-3 text-xs font-bold rounded border text-center transition-colors ${
                      regRole === 'farmer'
                        ? 'border-forest-700 bg-forest-50 text-forest-900 shadow-xs'
                        : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    Livestock Farmer (किसान)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('veterinarian')}
                    className={`py-2 px-3 text-xs font-bold rounded border text-center transition-colors ${
                      regRole === 'veterinarian'
                        ? 'border-forest-700 bg-forest-50 text-forest-900 shadow-xs'
                        : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    Veterinary Officer (पशु चिकित्सक)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder={regRole === 'farmer' ? 'e.g. Ramesh Kumar' : 'e.g. Dr. Priya Singh'}
                    className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded text-xs focus:ring-2 focus:ring-forest-700 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                    Mobile (+91)
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded text-xs focus:ring-2 focus:ring-forest-700 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                    {regRole === 'farmer' ? 'Aadhaar / Voter ID Token' : 'VCI Licensure No.'}
                  </label>
                  <div className="relative">
                    <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={regIdentifier}
                      onChange={(e) => setRegIdentifier(e.target.value)}
                      placeholder={regRole === 'farmer' ? 'XXXX-XXXX-XXXX' : 'UPVC-2026-XXXX'}
                      className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded text-xs focus:ring-2 focus:ring-forest-700 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                    District
                  </label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={regDistrict}
                      onChange={(e) => setRegDistrict(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded text-xs focus:ring-2 focus:ring-forest-700 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={regState}
                    onChange={(e) => setRegState(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded text-xs focus:ring-2 focus:ring-forest-700 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                  Create Password
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded text-xs focus:ring-2 focus:ring-forest-700 bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4
                  bg-[#1B5E3C] hover:bg-[#123C2A] text-white font-bold text-xs uppercase tracking-wider rounded
                  transition-colors min-h-[42px] cursor-pointer shadow-xs"
              >
                {regLoading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    REGISTERING ON SOVEREIGN REGISTRY...
                  </>
                ) : (
                  <>
                    <UserPlus size={15} />
                    COMPLETE REGISTRATION & ENTER
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <span className="text-xs text-stone-500">Already registered? </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('signin')}
                  className="text-xs font-bold text-forest-700 hover:underline"
                >
                  Sign in to existing account
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {activeTab === 'forgot' && (
            <div className="space-y-4 font-sans">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                      Registered Mobile Number or Email
                    </label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        value={forgotInput}
                        onChange={(e) => setForgotInput(e.target.value)}
                        placeholder="e.g. 9876543210 or officer@pashuraksha.in"
                        className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded text-xs bg-white focus:ring-2 focus:ring-forest-700"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider rounded transition-colors min-h-[42px]"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        SENDING SECURE OTP...
                      </>
                    ) : (
                      <>
                        <KeyRound size={15} />
                        TRANSMIT RECOVERY OTP
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                      Enter 4-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value)}
                      placeholder="Use 4821"
                      className="w-full tracking-widest text-center py-2.5 border border-forest-300 rounded font-mono text-base font-bold bg-forest-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                      New Security Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new strong password"
                      className="w-full px-3 py-2 border border-stone-300 rounded text-xs bg-white focus:ring-2 focus:ring-forest-700"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider rounded transition-colors min-h-[42px]"
                  >
                    {forgotLoading ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        UPDATE PASSWORD & RETURN TO LOGIN
                      </>
                    )}
                  </button>
                </form>
              )}

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signin')
                    setOtpSent(false)
                  }}
                  className="text-xs font-bold text-forest-700 hover:underline"
                >
                  &larr; Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: ROLE PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-4 font-sans">
              <div className="p-3 bg-forest-50/80 border border-forest-200 rounded-lg text-xs text-forest-900">
                <p className="font-semibold flex items-center gap-1.5 mb-1">
                  <Sparkles size={14} className="text-forest-700" />
                  Instant Evaluator Access
                </p>
                <p className="text-stone-600">
                  Click any role button below to instantly load that role's real-time modules, permission boundaries, and clinical surveillance interfaces without credentials.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                <button
                  type="button"
                  onClick={() => handlePreviewRole('farmer')}
                  className="p-3 bg-white border border-forest-200 hover:border-forest-600 hover:bg-forest-50/50 rounded-lg text-left transition-all flex items-center justify-between group shadow-2xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-forest-950 uppercase tracking-wider">Farmer (किसान)</span>
                      <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.2 rounded font-mono">Grassroots</span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">Herd management, vernacular symptom reporting, mortality registration, IoT devices.</p>
                  </div>
                  <ArrowRight size={16} className="text-forest-600 group-hover:translate-x-1 transition-transform shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => handlePreviewRole('veterinarian')}
                  className="p-3 bg-white border border-forest-200 hover:border-forest-600 hover:bg-forest-50/50 rounded-lg text-left transition-all flex items-center justify-between group shadow-2xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-forest-950 uppercase tracking-wider">Veterinary Officer (पशु चिकित्सक)</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-mono">Clinical</span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">Clinical triage queue, disease investigation, lab referrals, prescription registry, GIS map.</p>
                  </div>
                  <ArrowRight size={16} className="text-forest-600 group-hover:translate-x-1 transition-transform shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => handlePreviewRole('admin')}
                  className="p-3 bg-white border border-forest-200 hover:border-forest-600 hover:bg-forest-50/50 rounded-lg text-left transition-all flex items-center justify-between group shadow-2xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-forest-950 uppercase tracking-wider">State Administrator / DVO</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-mono">Governance</span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">GIS surveillance command center, DBSCAN outbreak clusters, analytics, VCI registry, audit logs.</p>
                  </div>
                  <ArrowRight size={16} className="text-forest-600 group-hover:translate-x-1 transition-transform shrink-0" />
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('signin')}
                  className="text-xs font-bold text-forest-700 hover:underline"
                >
                  &larr; Return to Official Sign In
                </button>
              </div>
            </div>
          )}

          {/* National Animal Husbandry Helpline Banner */}
          <div className="mt-6 flex items-center justify-between p-3 bg-stone-100 border border-stone-200 rounded text-xs font-mono text-stone-700">
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-[#1B5E3C]" />
              <span>ANIMAL HUSBANDRY HELPLINE: <strong>1962</strong></span>
            </div>
            <span className="text-[10px] text-stone-500 font-bold">TOLL FREE</span>
          </div>
        </div>
      </div>
    </div>
  )
}
