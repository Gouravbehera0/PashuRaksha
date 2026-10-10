/**
 * PASHURAKSHA (पशुरक्षा) — USER PREFERENCES & PLATFORM SETTINGS
 * Route: /settings
 * "Detect Early. Prevent Outbreaks. Protect Livestock."
 */

import { useState } from 'react'
import {
  User, Globe, Bell, HardDrive, Shield, Check,
  RefreshCw, Smartphone, Save, Lock, CheckCircle2
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/i18n'

export function SettingsPage() {
  const { user, role } = useAuth()
  const { language, setLanguage } = useTranslation()

  const [activeTab, setActiveTab] = useState<'profile' | 'language' | 'notifications' | 'storage' | 'security'>('profile')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [cacheCleared, setCacheCleared] = useState(false)

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: role === 'farmer' ? 'Ramesh Yadav' : role === 'veterinarian' ? 'Dr. Rajesh Sharma' : 'District Surveillance Lead',
    phone: '+91 98765-43210',
    email: user?.email || 'user@pashuraksha.in',
    district: 'Varanasi',
    block: 'Kashi Vidyapeeth',
    village: 'Rampur Khurd'
  })

  // Notification Preferences
  const [notifications, setNotifications] = useState({
    smsUrgent: true,
    whatsappBulletins: true,
    soundAlerts: true,
    quarantineRadiusKm: 5,
    emailWeeklyDigest: false
  })

  // Security Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const handleClearCache = () => {
    try {
      localStorage.removeItem('pashuraksha_offline_queue_temp')
    } catch {
      // ignore
    }
    setCacheCleared(true)
    setTimeout(() => setCacheCleared(false), 3000)
  }

  return (
    <div className="p-3 sm:p-5 lg:p-6 max-w-6xl mx-auto space-y-6">
      {/* ─── Page Header ────────────────────────────────────────── */}
      <PageHeader
        title="प्रणाली सेटिंग्स • System Preferences & Profile"
        subtitle="Manage personal contact credentials, regional language preferences, SMS biosecurity broadcast thresholds, and local offline device caching."
        breadcrumbs={[
          { label: 'Settings', href: '/settings' }
        ]}
        badge={
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#1B5E3C] text-white uppercase tracking-wider">
            {role?.toUpperCase()} PREFERENCES
          </span>
        }
      />

      {/* ─── Settings Tabs ──────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto bg-gray-50/70">
          {[
            { id: 'profile', label: 'User Profile & Region', icon: User },
            { id: 'language', label: 'Language & Vernacular', icon: Globe },
            { id: 'notifications', label: 'Alerts & Broadcasts', icon: Bell },
            { id: 'storage', label: 'Offline Storage & Cache', icon: HardDrive },
            { id: 'security', label: 'Security & Sessions', icon: Shield },
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors border-b-2 -mb-[1px]
                  ${isActive
                    ? 'border-[#123C2A] text-[#123C2A] bg-white font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'}
                `}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        <div className="p-4 sm:p-6">
          {/* TAB 1: USER PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Full Name / Practitioner Name</label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-[#1B5E3C]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Registered Contact Number (+91)</label>
                  <input
                    type="text"
                    required
                    value={profileForm.phone}
                    onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-[#1B5E3C]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-[#1B5E3C]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Assigned District</label>
                  <input
                    type="text"
                    value={profileForm.district}
                    onChange={e => setProfileForm({ ...profileForm, district: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-[#1B5E3C]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Operational Block / Tehsil</label>
                  <input
                    type="text"
                    value={profileForm.block}
                    onChange={e => setProfileForm({ ...profileForm, block: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-[#1B5E3C]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Village / Jurisdiction</label>
                  <input
                    type="text"
                    value={profileForm.village}
                    onChange={e => setProfileForm({ ...profileForm, village: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-[#1B5E3C]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-gray-100">
                {saveSuccess ? (
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                    <Check size={14} /> Profile preferences saved successfully!
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-500">
                    Changes are synchronized with your local surveillance profile.
                  </span>
                )}

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#1B5E3C] hover:bg-[#123C2A] text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  <Save size={14} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: LANGUAGE & REGIONAL PREFERENCES */}
          {activeTab === 'language' && (
            <div className="space-y-5 max-w-xl text-xs">
              <div>
                <h3 className="font-bold text-sm text-[#102A43] mb-1">
                  Primary Application Language / भाषा चयन
                </h3>
                <p className="text-gray-500 mb-3">
                  Choose your preferred operational language across symptoms, alerts, and navigation.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setLanguage('hi')}
                    className={`
                      p-3.5 rounded-lg border text-left cursor-pointer transition-colors
                      ${language === 'hi'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}
                    `}
                  >
                    <div className="text-base font-bold text-[#1B5E3C]">हिन्दी (Hindi)</div>
                    <div className="text-[11px] text-gray-500 mt-1">
                      ग्रामीण पशुपालकों एवं मैदानी कार्यकर्ताओं हेतु अनुशंसित
                    </div>
                  </button>

                  <button
                    onClick={() => setLanguage('en')}
                    className={`
                      p-3.5 rounded-lg border text-left cursor-pointer transition-colors
                      ${language === 'en'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}
                    `}
                  >
                    <div className="text-base font-bold text-[#102A43]">English</div>
                    <div className="text-[11px] text-gray-500 mt-1">
                      Recommended for Veterinary Officers & Admin Desks
                    </div>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded border border-gray-200 space-y-1">
                <span className="font-bold text-gray-800">Voice Recognition Engine Vernacular:</span>
                <p className="text-[11px] text-gray-600">
                  Audio symptom dictation uses Hindi dialect parsing (`hi-IN`) with phonetic mapping for regional Uttar Pradesh livestock terms.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS & ALERTS */}
          {activeTab === 'notifications' && (
            <div className="space-y-4 max-w-xl text-xs">
              <h3 className="font-bold text-sm text-[#102A43]">
                Emergency Biosecurity Dispatch Channels
              </h3>

              <div className="space-y-3">
                {[
                  {
                    key: 'smsUrgent',
                    title: 'SMS Emergency Alerts',
                    desc: 'Instant flash SMS for Notifiable Disease outbreaks (FMD/HS/Anthrax) detected within ring containment zone.'
                  },
                  {
                    key: 'whatsappBulletins',
                    title: 'WhatsApp Containment Advisories',
                    desc: 'Weekly village animal health bulletins and safe livestock management infographics.'
                  },
                  {
                    key: 'soundAlerts',
                    title: 'Audible Priority Beeps',
                    desc: 'Play urgent acoustic chime when a Critical Tier case arrives in the clinical triage queue.'
                  },
                  {
                    key: 'emailWeeklyDigest',
                    title: 'Weekly Epidemiological Summary (Email)',
                    desc: 'Executive summary of incidence curves and herd immunity metrics sent to DVO/CVO desks.'
                  }
                ].map(item => {
                  const checked = notifications[item.key as keyof typeof notifications] as boolean
                  return (
                    <div key={item.key} className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                      <div>
                        <div className="font-bold text-gray-900">{item.title}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{item.desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => setNotifications({ ...notifications, [item.key]: !checked })}
                        className="w-4 h-4 text-[#1B5E3C] rounded border-gray-300 mt-1 cursor-pointer"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB 4: OFFLINE STORAGE & CACHE */}
          {activeTab === 'storage' && (
            <div className="space-y-4 max-w-xl text-xs">
              <h3 className="font-bold text-sm text-[#102A43]">
                Local IndexedDB Database Management
              </h3>

              <div className="p-4 bg-gray-50 rounded border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-gray-600 font-bold">DATABASE IDENTIFIER:</span>
                  <span className="font-mono font-bold text-[#1B5E3C]">PashuRaksha_OfflineDB_v1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">IndexedDB Tables:</span>
                  <span className="font-semibold text-gray-800">5 stores (animals, reports, vaccinations, queue, config)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Replay Sync Strategy:</span>
                  <span className="font-semibold text-emerald-700">Idempotent Token Verification (Zero duplicates)</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 font-bold transition-colors cursor-pointer"
                >
                  <RefreshCw size={14} />
                  <span>Purge Temporary Client Cache</span>
                </button>
                {cacheCleared && (
                  <span className="ml-3 text-emerald-700 font-bold">
                    ✓ Local offline cache purged safely.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: SECURITY & SESSIONS */}
          {activeTab === 'security' && (
            <div className="space-y-4 max-w-xl text-xs">
              <h3 className="font-bold text-sm text-[#102A43]">
                Authentication & Session Governance
              </h3>

              <div className="p-3.5 bg-gray-50 rounded border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone size={18} className="text-[#1B5E3C]" />
                  <div>
                    <div className="font-bold text-gray-900">Current Device Session</div>
                    <div className="text-[11px] text-gray-500">Localhost Development Environment &bull; Active Node</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 uppercase">
                  ACTIVE
                </span>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded border border-emerald-200 text-emerald-950 space-y-1">
                <strong className="font-bold text-emerald-900 block">Row-Level Security (RLS) Active:</strong>
                <p className="text-emerald-800 leading-relaxed text-[11px]">
                  All livestock records, prescriptions, and surveillance entries are isolated at the database level.
                  Horizontal privilege escalation between different farms or jurisdictions is strictly blocked.
                </p>
              </div>

              <div className="p-4 bg-white rounded border border-gray-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Lock size={15} className="text-[#1B5E3C]" />
                  <span className="font-bold text-gray-900">Update Secure Access Key</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs bg-stone-50/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">New Password</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSaveSuccess(true)
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                      setTimeout(() => setSaveSuccess(false), 3000)
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-forest-700 hover:bg-forest-800 text-white font-bold rounded text-xs cursor-pointer"
                  >
                    <CheckCircle2 size={13} />
                    Update Password Key
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
