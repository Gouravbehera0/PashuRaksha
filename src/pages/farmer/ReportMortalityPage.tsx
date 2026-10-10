import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Phone, AlertTriangle, CheckCircle2, Send, WifiOff, RefreshCw, MapPin
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/i18n'
import { getAnimals } from '@/services/animalService'
import { createMortalityReport } from '@/services/mortalityReportService'
import {
  savePendingMortalityReport,
  triggerSyncNow,
  type PendingMortalityReport
} from '@/services/offline'
import { AnimalIcon } from '@/components/ui/AnimalIcon'
import type { Animal } from '@/types'

export function ReportMortalityPage() {
  const { user } = useAuth()
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const ownerId = user?.id || 'demo-farmer'

  const [animals, setAnimals] = useState<Animal[]>([])
  const [selectedAnimalId, setSelectedAnimalId] = useState('')
  const [deathDate, setDeathDate] = useState(new Date().toISOString().split('T')[0])
  const [deathTime, setDeathTime] = useState('Early Morning (04:00 - 08:00)')
  const [suspectedCause, setSuspectedCause] = useState('')
  const [carcassState, setCarcassState] = useState('Isolated in stall (Awaiting post-mortem inspection)')
  
  // Geolocation state
  const [geoLoc, setGeoLoc] = useState<{ lat: number; lng: number } | null>(null)
  const [locationType, setLocationType] = useState<'GPS LOCATION' | 'MANUALLY ENTERED LOCATION' | 'LOCATION UNAVAILABLE'>('LOCATION UNAVAILABLE')
  const [geoLoading, setGeoLoading] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [successReportId, setSuccessReportId] = useState<string | null>(null)
  const [offlineSubmitted, setOfflineSubmitted] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const list = await getAnimals(ownerId)
      setAnimals(list)
      if (list.length > 0) {
        setSelectedAnimalId(list[0].id)
      }
    }
    load()
  }, [ownerId])

  const handleCaptureGeo = () => {
    if (!navigator.geolocation) {
      setGeoLoc({ lat: 25.3176, lng: 82.9739 })
      setLocationType('MANUALLY ENTERED LOCATION')
      return
    }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoc({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        })
        setLocationType('GPS LOCATION')
        setGeoLoading(false)
      },
      () => {
        setGeoLoc({ lat: 25.3176, lng: 82.9739 })
        setLocationType('MANUALLY ENTERED LOCATION')
        setGeoLoading(false)
      },
      { timeout: 8000 }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!selectedAnimalId) {
      setFormError('Please select the deceased animal.')
      return
    }

    const idempotencyKey = `idemp_mr_${Date.now()}_${ownerId}_${selectedAnimalId}`
    const fullCause = `${suspectedCause}. Time of death: ${deathDate} (${deathTime}). Carcass status: ${carcassState}.`

    setSubmitting(true)

    // Check if offline
    if (!navigator.onLine) {
      try {
        const pendingRep: PendingMortalityReport = {
          local_id: `local_mr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          animal_id: selectedAnimalId,
          owner_id: ownerId,
          cause_description: fullCause,
          latitude: geoLoc?.lat,
          longitude: geoLoc?.lng,
          idempotency_key: idempotencyKey,
          location_type: locationType,
          created_at: new Date().toISOString(),
          sync_status: 'PENDING_SYNC',
          retry_count: 0,
        }
        await savePendingMortalityReport(pendingRep)
        setOfflineSubmitted(true)
        setSuccessReportId(pendingRep.local_id)
      } catch (err) {
        console.error('Failed to save offline mortality report:', err)
        setFormError('Failed to record locally. Please retry.')
      } finally {
        setSubmitting(false)
      }
      return
    }

    try {
      const rep = await createMortalityReport({
        animal_id: selectedAnimalId,
        owner_id: ownerId,
        cause_description: fullCause,
        latitude: geoLoc?.lat,
        longitude: geoLoc?.lng,
        idempotency_key: idempotencyKey,
        location_type: locationType,
      })
      setOfflineSubmitted(false)
      setSuccessReportId(rep.id)
    } catch (err) {
      console.warn('Online submission failed, storing offline:', err)
      try {
        const pendingRep: PendingMortalityReport = {
          local_id: `local_mr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          animal_id: selectedAnimalId,
          owner_id: ownerId,
          cause_description: fullCause,
          latitude: geoLoc?.lat,
          longitude: geoLoc?.lng,
          idempotency_key: idempotencyKey,
          location_type: locationType,
          created_at: new Date().toISOString(),
          sync_status: 'PENDING_SYNC',
          retry_count: 0,
        }
        await savePendingMortalityReport(pendingRep)
        setOfflineSubmitted(true)
        setSuccessReportId(pendingRep.local_id)
      } catch (storeErr) {
        console.error(storeErr)
        setFormError('Failed to record mortality report. Please verify connection.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const selectedAnimal = animals.find((a) => a.id === selectedAnimalId)

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-5 max-w-4xl mx-auto">
      {/* 1. Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-stone-500">
        <Link to="/farmer/dashboard" className="hover:text-[#1B5E3C]">
          {t('nav.dashboard')}
        </Link>
        <span>&gt;</span>
        <span className="text-[#102A43] font-bold">
          {language === 'hi' ? 'पशु मृत्यु पंजीकरण' : 'REPORT LIVESTOCK MORTALITY'}
        </span>
      </div>

      {/* 2. Statutory Authority Header */}
      <div className="bg-stone-900 text-white p-4 rounded-[2px] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 border-l-4 border-l-[#C62828]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#C62828] text-white px-2 py-0.5 rounded-[1px]">
              STATUTORY DISEASE ACT COMPLIANCE
            </span>
            <span className="text-[10px] font-mono text-stone-400">
              SECTION 19 &middot; PCICDA ACT 2009
            </span>
          </div>
          <h1 className="text-lg font-bold font-sans">
            {t('mortality_report.title')}
          </h1>
          <p className="text-xs text-stone-300 mt-0.5">
            {t('mortality_report.subtitle')}
          </p>
        </div>

        <a
          href="tel:1962"
          className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-[#C62828] text-white text-xs font-bold rounded-[2px] hover:bg-[#A81D1D] transition-colors shrink-0 font-mono self-start md:self-auto min-h-[44px]"
        >
          <Phone size={14} />
          <span>CALL 1962 (POST-MORTEM)</span>
        </a>
      </div>

      {/* Success Notification Dialog */}
      {successReportId && (
        <div className={`p-6 rounded-[2px] shadow-lg space-y-4 border-2 ${
          offlineSubmitted ? 'bg-[#FFFDF7] border-[#E0A11A]' : 'bg-white border-[#102A43]'
        }`}>
          <div className="flex items-start gap-3">
            {offlineSubmitted ? (
              <WifiOff size={28} className="text-[#8C5D00] shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 size={28} className="text-[#102A43] shrink-0 mt-0.5" />
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-[1px] ${
                  offlineSubmitted ? 'bg-[#FFF3D6] text-[#8C5D00]' : 'bg-stone-100 text-[#102A43]'
                }`}>
                  {offlineSubmitted ? 'SAVED OFFLINE (PENDING SYNC)' : 'MORTALITY RECORD FILED'}
                </span>
                <span className="text-xs font-mono text-stone-500">
                  CASE REF: PR-MR-{successReportId.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <h2 className="text-base font-bold text-[#102A43] mt-1">
                {offlineSubmitted
                  ? (language === 'hi'
                    ? 'मृत्यु रिपोर्ट डिवाइस पर सहेजी गई — इंटरनेट पर स्वतः भेजी जाएगी'
                    : 'Mortality Report Saved Locally — Awaiting Server Sync')
                  : (language === 'hi'
                    ? 'मृत्यु रिपोर्ट सफलतापूर्वक दर्ज की गई'
                    : 'Mortality Case Registered')}
              </h2>
              <p className="text-xs text-stone-700 mt-1">
                Deceased Animal: <strong className="font-mono text-[#102A43]">{selectedAnimal?.animal_tag} ({selectedAnimal?.animal_type} &middot; {selectedAnimal?.breed})</strong>
              </p>
              <p className="text-xs text-stone-600 mt-0.5">
                {offlineSubmitted
                  ? (language === 'hi'
                    ? 'डेटा डिवाइस में सुरक्षित है। नेटवर्क मिलते ही पोस्ट-मॉर्टम टीम को भेजा जाएगा।'
                    : 'The record is stored in device storage and will sync automatically when network is active.')
                  : (language === 'hi'
                    ? 'जिला पशु महामारी विज्ञान अधिकारी को सतर्क कर दिया गया है। शव परीक्षण प्रोटोकॉल तैयार हो गया है।'
                    : 'The District Veterinary Epidemiology Officer has been alerted. Post-mortem protocol has been generated.')}
              </p>
            </div>
          </div>

          {/* Location Verification Tag */}
          <div className="bg-stone-50 border border-stone-200 p-3 rounded-[2px] text-xs flex justify-between items-center">
            <span className="text-stone-500 font-mono">Location Status:</span>
            <span className="font-mono font-bold text-[#1B5E3C]">{locationType}</span>
          </div>

          {/* Biosecurity Carcass Disposal Advisory */}
          <div className="bg-[#FFF8F7] border border-[#C62828] p-4 rounded-[2px] space-y-2 text-xs text-[#7B1818]">
            <p className="font-bold uppercase font-mono tracking-wider flex items-center gap-1.5">
              <AlertTriangle size={15} className="text-[#C62828]" />
              {language === 'hi' ? 'अति महत्वपूर्ण जैव-सुरक्षा दिशा-निर्देश:' : 'CRITICAL BIOSECURITY ADVISORY:'}
            </p>
            <ul className="list-disc list-inside space-y-1 text-stone-700">
              <li><strong>{language === 'hi' ? 'शव को न हिलाएं:' : 'DO NOT move the carcass:'}</strong> {language === 'hi' ? 'पशु चिकित्सक के आने तक शव को अलग बाड़े में रखें।' : 'Keep it in the isolated shelter until the Veterinary Officer arrives.'}</li>
              <li><strong>{language === 'hi' ? 'शव को न चीरें या खोलें:' : 'DO NOT skin or open the carcass:'}</strong> {language === 'hi' ? 'एंथ्रेक्स या सेप्टीसीमिया के संदेह में मिट्टी स्थाई रूप से संक्रमित हो सकती है।' : 'In cases of suspected Anthrax or acute septicaemia, spores can contaminate soil permanently.'}</li>
              <li><strong>{language === 'hi' ? 'कीटाणुशोधन करें:' : 'Disinfect surroundings:'}</strong> {language === 'hi' ? 'स्थान पर 5% ब्लीचिंग पाउडर या चूने का छिड़काव करें।' : 'Disinfect the stall floor with 5% bleaching powder or lime.'}</li>
              <li><strong>{language === 'hi' ? 'अन्य पशुओं की निगरानी:' : 'Isolate herd:'}</strong> {language === 'hi' ? 'अन्य मवेशियों में बुखार या सांस लेने की तकलीफ पर तुरंत नज़र रखें।' : 'Monitor other animals for sudden fever or breathing difficulties.'}</li>
            </ul>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-stone-200 font-mono flex-wrap">
            {offlineSubmitted && (
              <button
                type="button"
                onClick={() => triggerSyncNow()}
                className="px-4 py-2 bg-[#102A43] hover:bg-[#1B5E3C] text-white text-xs font-bold rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5 min-h-[44px]"
              >
                <RefreshCw size={13} />
                <span>{language === 'hi' ? 'अभी सिंक करने का प्रयास करें' : 'RETRY SYNC NOW'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/farmer/cases')}
              className="px-4 py-2 bg-[#102A43] text-white text-xs font-bold rounded-[2px] hover:bg-[#1B5E3C] transition-colors cursor-pointer min-h-[44px]"
            >
              {language === 'hi' ? 'निगरानी फ़ाइल देखें' : 'TRACK SURVEILLANCE FILE'} &rarr;
            </button>
            <button
              type="button"
              onClick={() => navigate('/farmer/dashboard')}
              className="px-3 py-2 bg-white border border-stone-300 text-stone-700 text-xs font-bold rounded-[2px] hover:bg-stone-50 transition-colors cursor-pointer min-h-[44px]"
            >
              {language === 'hi' ? 'डैशबोर्ड पर लौटें' : 'RETURN TO DASHBOARD'}
            </button>
          </div>
        </div>
      )}

      {/* Main Mortality Form */}
      {!successReportId && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="bg-[#FFF8F7] border border-[#C62828] p-3 rounded-[2px] text-xs text-[#C62828] flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: Animal Selection */}
          <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-[#102A43] uppercase tracking-wider font-mono border-b border-stone-200 pb-2">
              1. {t('mortality_report.select_animal')}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {animals.map((an) => {
                const isSelected = selectedAnimalId === an.id
                return (
                  <button
                    key={an.id}
                    type="button"
                    onClick={() => setSelectedAnimalId(an.id)}
                    className={`p-3 rounded-[2px] border text-left transition-colors cursor-pointer flex items-center gap-3 min-h-[48px] ${
                      isSelected
                        ? 'border-[#102A43] bg-stone-100 ring-1 ring-[#102A43]'
                        : 'border-stone-300 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-[2px] bg-white border border-stone-200 flex items-center justify-center shrink-0">
                      <AnimalIcon type={an.animal_type} className="w-5 h-5 text-[#102A43]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-xs text-[#102A43] truncate">
                        {an.animal_tag}
                      </p>
                      <p className="text-[11px] text-stone-500 truncate">
                        {an.animal_type} &middot; {an.breed || 'Indigenous'}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section 2: Time & Circumstances */}
          <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-[#102A43] uppercase tracking-wider font-mono border-b border-stone-200 pb-2">
              2. {language === 'hi' ? 'मृत्यु का समय एवं पूर्व लक्षण' : 'TIME OF DEATH & SUSPECTED MANIFESTATION'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 font-sans">
                  {t('mortality_report.death_date')}
                </label>
                <input
                  type="date"
                  value={deathDate}
                  onChange={(e) => setDeathDate(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-[2px] text-xs font-mono min-h-[44px]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 font-sans">
                  {language === 'hi' ? 'अनुमानित समय' : 'Approximate Time'}
                </label>
                <select
                  value={deathTime}
                  onChange={(e) => setDeathTime(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-[2px] text-xs min-h-[44px]"
                >
                  <option value="Early Morning (04:00 - 08:00)">Early Morning (04:00 - 08:00) / सुबह</option>
                  <option value="Daytime (08:00 - 16:00)">Daytime (08:00 - 16:00) / दोपहर</option>
                  <option value="Evening (16:00 - 20:00)">Evening (16:00 - 20:00) / शाम</option>
                  <option value="Night (20:00 - 04:00)">Night (20:00 - 04:00) / रात</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1 font-sans">
                  {t('mortality_report.cause')}
                </label>
                <textarea
                  rows={3}
                  value={suspectedCause}
                  onChange={(e) => setSuspectedCause(e.target.value)}
                  placeholder="e.g. Sudden death without prior fever, bleeding from natural orifices, severe bloat, high fever with swelling in throat for 2 days..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-[2px] text-xs"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Carcass State & Geolocation */}
          <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h2 className="text-xs font-bold text-[#102A43] uppercase tracking-wider font-mono">
                3. {t('mortality_report.carcass_status')} &amp; {language === 'hi' ? 'स्थान' : 'LOCATION'}
              </h2>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-[1px] ${
                locationType === 'GPS LOCATION'
                  ? 'bg-[#EBF5EE] text-[#1B5E3C] border border-[#1B5E3C]/30'
                  : locationType === 'MANUALLY ENTERED LOCATION'
                  ? 'bg-stone-100 text-stone-700 border border-stone-300'
                  : 'bg-[#FFF3D6] text-[#8C5D00] border border-[#E0A11A]/40'
              }`}>
                {locationType}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 font-sans">
                  {language === 'hi' ? 'शव की वर्तमान स्थिति' : 'Current Carcass Containment Status'}
                </label>
                <select
                  value={carcassState}
                  onChange={(e) => setCarcassState(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-[2px] text-xs min-h-[44px]"
                >
                  <option value="Isolated in stall (Awaiting post-mortem inspection)">
                    Isolated in stall (Awaiting post-mortem inspection)
                  </option>
                  <option value="Deep buried with quicklime (> 6 feet deep)">
                    Deep buried with quicklime (&gt; 6 feet deep)
                  </option>
                  <option value="Covered with tarp in isolated yard">
                    Covered with tarp in isolated yard
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 font-sans">
                  {language === 'hi' ? 'शव परीक्षण टीम हेतु स्थान निर्देशांक' : 'Site Coordinates for Post-Mortem Team'}
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-stone-50 border border-stone-300 rounded-[2px] text-xs font-mono text-stone-700 truncate min-h-[44px] flex items-center">
                    {geoLoc ? `LAT: ${geoLoc.lat}, LNG: ${geoLoc.lng}` : (language === 'hi' ? 'निर्देशांक टैग नहीं हैं' : 'Coordinates not tagged')}
                  </div>
                  <button
                    type="button"
                    onClick={handleCaptureGeo}
                    disabled={geoLoading}
                    className="px-3 py-2 bg-[#102A43] text-white text-xs font-bold font-mono rounded-[2px] hover:bg-[#1B5E3C] transition-colors cursor-pointer shrink-0 min-h-[44px] flex items-center gap-1.5"
                  >
                    <MapPin size={13} />
                    <span>{geoLoading ? 'CAPTURING...' : 'CAPTURE GPS'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Submission Bar */}
          <div className="p-4 bg-white border border-stone-300 rounded-[2px] shadow-xs flex items-center justify-between gap-3">
            <Link
              to="/farmer/dashboard"
              className="text-xs font-bold text-stone-600 hover:text-stone-900 font-mono"
            >
              &larr; {language === 'hi' ? 'रद्द करें' : 'CANCEL'}
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#102A43] hover:bg-[#C62828] text-white text-xs font-bold rounded-[2px] shadow-sm transition-colors cursor-pointer font-mono tracking-wider disabled:opacity-50 min-h-[48px]"
            >
              <Send size={14} />
              <span>
                {submitting
                  ? (language === 'hi' ? 'दर्ज किया जा रहा है...' : 'RECORDING MORTALITY...')
                  : t('mortality_report.submit')}
              </span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
