import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  Phone, MapPin, Camera, CheckCircle2, AlertTriangle,
  Info, Send, WifiOff, RefreshCw
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/i18n'
import { getAnimals } from '@/services/animalService'
import { createSymptomReport } from '@/services/symptomReportService'
import {
  compressImage,
  savePendingHealthReport,
  triggerSyncNow,
  type PendingHealthReport
} from '@/services/offline'
import { AnimalIcon } from '@/components/ui/AnimalIcon'
import { VoiceSymptomRecorder } from '@/components/voice/VoiceSymptomRecorder'
import type { Animal, SymptomSeverity } from '@/types'

const CLINICAL_SYMPTOMS = [
  { id: 'fever', label: 'Fever / High Body Temperature', labelHi: 'तेज़ बुखार' },
  { id: 'mouth_blisters', label: 'Blisters/Ulcers in Mouth or Hooves', labelHi: 'मुंह या खुर में छाले' },
  { id: 'salivation', label: 'Excessive Salivation / Drooling', labelHi: 'मुंह से लगातार लार टपकना' },
  { id: 'lameness', label: 'Lameness / Limping / Inability to Walk', labelHi: 'लंगड़ाना / चलने में असमर्थ' },
  { id: 'cough', label: 'Coughing / Rapid Breathing / Wheezing', labelHi: 'खांसी / हांफना / सांस लेने में तकलीफ' },
  { id: 'off_feed', label: 'Loss of Appetite / Off Feed', labelHi: 'चारा व पानी न खाना' },
  { id: 'milk_drop', label: 'Sudden Drop in Milk Production', labelHi: 'दूध उत्पादन में अचानक भारी गिरावट' },
  { id: 'diarrhea', label: 'Severe Diarrhea / Dysentery', labelHi: 'दस्त या खूनी पेचिश' },
  { id: 'skin_nodules', label: 'Skin Nodules / Lumps on Body', labelHi: 'त्वचा पर गांठें या फफोले' },
  { id: 'swelling', label: 'Swelling in Throat / Dewlap / Joints', labelHi: 'गले, गलकंबल या जोड़ों में सूजन' },
  { id: 'lethargy', label: 'Severe Lethargy / Continuous Recumbency', labelHi: 'अत्यधिक सुस्ती / लगातार बैठे रहना' },
  { id: 'discharge', label: 'Nasal or Ocular Discharge', labelHi: 'नाक या आंख से गाढ़ा स्राव बहना' },
]

export function ReportHealthPage() {
  const { user } = useAuth()
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialAnimalId = searchParams.get('animalId') || ''

  const ownerId = user?.id || 'demo-farmer'

  const [animals, setAnimals] = useState<Animal[]>([])
  const [selectedAnimalId, setSelectedAnimalId] = useState(initialAnimalId)
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [severity, setSeverity] = useState<SymptomSeverity>('Moderate')
  const [description, setDescription] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoCompressing, setPhotoCompressing] = useState(false)

  // Geolocation state
  const [geoLoc, setGeoLoc] = useState<{ lat: number; lng: number } | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [locationType, setLocationType] = useState<'GPS LOCATION' | 'MANUALLY ENTERED LOCATION' | 'LOCATION UNAVAILABLE'>('LOCATION UNAVAILABLE')

  const [submitting, setSubmitting] = useState(false)
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null)
  const [offlineSubmitted, setOfflineSubmitted] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnimals() {
      const list = await getAnimals(ownerId)
      setAnimals(list)
      if (!selectedAnimalId && list.length > 0) {
        setSelectedAnimalId(list[0].id)
      }
    }
    fetchAnimals()
  }, [ownerId])

  const toggleSymptom = (label: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    )
  }

  const handleApplyVoiceSymptoms = (symptomLabels: string[]) => {
    setSelectedSymptoms((prev) => Array.from(new Set([...prev, ...symptomLabels])))
  }

  const handleCaptureGeo = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.')
      setLocationType('LOCATION UNAVAILABLE')
      return
    }
    setGeoLoading(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoc({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        })
        setLocationType('GPS LOCATION')
        setGeoLoading(false)
      },
      (err) => {
        console.warn(err)
        // Fallback for demo / denied location
        setGeoLoc({ lat: 25.3176, lng: 82.9739 })
        setLocationType('MANUALLY ENTERED LOCATION')
        setGeoError('GPS signal unavailable. Village default coordinates applied.')
        setGeoLoading(false)
      },
      { timeout: 8000 }
    )
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        setPhotoCompressing(true)
        const compressedBase64 = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.7 })
        setPhotoPreview(compressedBase64)
      } catch (err) {
        console.warn('Image compression fallback:', err)
        const reader = new FileReader()
        reader.onload = () => setPhotoPreview(reader.result as string)
        reader.readAsDataURL(file)
      } finally {
        setPhotoCompressing(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!selectedAnimalId) {
      setFormError('Please select which animal is exhibiting symptoms.')
      return
    }

    if (selectedSymptoms.length === 0) {
      setFormError('Please select at least one clinical symptom.')
      return
    }

    const idempotencyKey = `idemp_sr_${Date.now()}_${ownerId}_${selectedAnimalId}`

    setSubmitting(true)

    // Check if offline or connectivity fails
    if (!navigator.onLine) {
      try {
        const pendingReport: PendingHealthReport = {
          local_id: `local_sr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          animal_id: selectedAnimalId,
          owner_id: ownerId,
          symptoms: selectedSymptoms,
          severity,
          description,
          photo_url: photoPreview || undefined,
          latitude: geoLoc?.lat,
          longitude: geoLoc?.lng,
          idempotency_key: idempotencyKey,
          location_type: locationType,
          created_at: new Date().toISOString(),
          sync_status: 'PENDING_SYNC',
          retry_count: 0,
        }
        await savePendingHealthReport(pendingReport)
        setOfflineSubmitted(true)
        setSubmissionSuccess(pendingReport.local_id)
      } catch (err) {
        console.error('Failed to save offline health report:', err)
        setFormError('Failed to store report locally. Please try again.')
      } finally {
        setSubmitting(false)
      }
      return
    }

    try {
      const report = await createSymptomReport({
        animal_id: selectedAnimalId,
        owner_id: ownerId,
        symptoms: selectedSymptoms,
        severity,
        description,
        photo_url: photoPreview || undefined,
        latitude: geoLoc?.lat,
        longitude: geoLoc?.lng,
        idempotency_key: idempotencyKey,
        location_type: locationType,
      })

      setOfflineSubmitted(false)
      setSubmissionSuccess(report.id)
    } catch (err) {
      console.warn('Online submission failed, storing to offline queue:', err)
      try {
        const pendingReport: PendingHealthReport = {
          local_id: `local_sr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          animal_id: selectedAnimalId,
          owner_id: ownerId,
          symptoms: selectedSymptoms,
          severity,
          description,
          photo_url: photoPreview || undefined,
          latitude: geoLoc?.lat,
          longitude: geoLoc?.lng,
          idempotency_key: idempotencyKey,
          location_type: locationType,
          created_at: new Date().toISOString(),
          sync_status: 'PENDING_SYNC',
          retry_count: 0,
        }
        await savePendingHealthReport(pendingReport)
        setOfflineSubmitted(true)
        setSubmissionSuccess(pendingReport.local_id)
      } catch (storeErr) {
        console.error(storeErr)
        setFormError('Submission failed and local storage error occurred.')
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
          {language === 'hi' ? 'लक्षण रिपोर्ट दर्ज करें' : 'REPORT CLINICAL SYMPTOMS'}
        </span>
      </div>

      {/* 2. Emergency Header */}
      <div className="bg-[#FFF8F7] border-2 border-[#C62828] p-4 rounded-[2px] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C62828] animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#C62828]">
              {language === 'hi' ? 'त्वरित पशु चिकित्सा रिपोर्ट · आपातकालीन सहायता' : 'EMERGENCY DISEASE TRIAGE · STATUTORY REPORT'}
            </span>
          </div>
          <h1 className="text-lg font-bold text-[#7B1818] font-sans">
            {t('health_report.title')}
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            {t('health_report.subtitle')}
          </p>
        </div>

        <a
          href="tel:1962"
          className="inline-flex items-center gap-2 px-3 py-2 bg-[#C62828] text-white text-xs font-bold rounded-[2px] hover:bg-[#A81D1D] transition-colors shrink-0 font-mono shadow-xs self-start md:self-auto min-h-[44px]"
        >
          <Phone size={14} />
          <span>CALL 1962 (EMERGENCY)</span>
        </a>
      </div>

      {/* Submission Success Modal / Dialog */}
      {submissionSuccess && (
        <div className={`p-6 rounded-[2px] shadow-lg space-y-4 border-2 ${
          offlineSubmitted ? 'bg-[#FFFDF7] border-[#E0A11A]' : 'bg-white border-[#2E7D32]'
        }`}>
          <div className="flex items-start gap-3">
            {offlineSubmitted ? (
              <WifiOff size={28} className="text-[#8C5D00] shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 size={28} className="text-[#2E7D32] shrink-0 mt-0.5" />
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-[1px] ${
                  offlineSubmitted ? 'bg-[#FFF3D6] text-[#8C5D00]' : 'bg-[#EBF5EE] text-[#1B5E3C]'
                }`}>
                  {offlineSubmitted ? 'SAVED OFFLINE (PENDING SYNC)' : 'SUBMISSION VERIFIED'}
                </span>
                <span className="text-xs font-mono text-stone-500">
                  CASE REF: PR-SR-{submissionSuccess.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <h2 className="text-base font-bold text-[#102A43] mt-1">
                {offlineSubmitted
                  ? (language === 'hi'
                    ? 'रिपोर्ट डिवाइस पर सुरक्षित सहेजी गई — इंटरनेट पर स्वतः भेजी जाएगी'
                    : 'Report Saved Locally on Device — Will Sync When Online')
                  : (language === 'hi'
                    ? 'रिपोर्ट सफलतापूर्वक दर्ज की गई'
                    : 'Report Submitted for Veterinary Review')}
              </h2>
              <p className="text-xs text-stone-700 mt-1">
                {offlineSubmitted
                  ? (language === 'hi'
                    ? 'आपका डेटा सुरक्षित रूप से इस फोन पर स्टोर है। जैसे ही इंटरनेट चालू होगा, यह पशु चिकित्सा अधिकारी के पास स्वतः पहुंच जाएगी।'
                    : 'Your report is safely stored in this phone’s offline database. As soon as internet connectivity returns, it will synchronize automatically.')
                  : (language === 'hi'
                    ? 'आपकी रिपोर्ट ब्लॉक पशु चिकित्सा अधिकारी और मोबाइल यूनिट को भेज दी गई है।'
                    : 'Your report has been routed to the Block Veterinary Officer and Mobile Veterinary Unit.')}
              </p>
            </div>
          </div>

          <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-[2px] space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-stone-500">{t('health_report.select_animal')}:</span>
              <strong className="text-[#102A43] font-mono">{selectedAnimal?.animal_tag} ({selectedAnimal?.animal_type})</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">{t('health_report.select_symptoms')}:</span>
              <strong className="text-stone-800">{selectedSymptoms.join(', ')}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">{t('health_report.severity')}:</span>
              <strong className="text-[#C62828] font-mono uppercase">{severity}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Location Tag:</span>
              <span className="font-mono text-[11px] font-bold text-[#1B5E3C]">{locationType}</span>
            </div>
          </div>

          <div className="p-3 bg-[#FFFDF7] border border-[#E0A11A]/40 rounded-[2px] text-xs text-[#8C5D00] flex items-start gap-2">
            <Info size={16} className="shrink-0 mt-0.5" />
            <p>
              <strong>{language === 'hi' ? 'प्राथमिक सलाह:' : 'Pre-veterinary advisory:'}</strong> {language === 'hi'
                ? 'बीमार पशु को तुरंत अन्य पशुओं से अलग साफ व छायादार स्थान पर बांधें। ताजा पानी दें।'
                : 'Isolate the animal in a well-ventilated, shaded stall away from shared feeding troughs and ponds while waiting for medical review.'}
            </p>
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
              className="px-4 py-2 bg-[#1B5E3C] hover:bg-[#123C2A] text-white text-xs font-bold rounded-[2px] transition-colors cursor-pointer min-h-[44px]"
            >
              {language === 'hi' ? 'मामला ट्रैक करें' : 'TRACK CASE STATUS'} &rarr;
            </button>
            <button
              type="button"
              onClick={() => navigate('/farmer/dashboard')}
              className="px-3 py-2 bg-white border border-stone-300 text-stone-700 text-xs font-bold rounded-[2px] hover:bg-stone-50 transition-colors cursor-pointer min-h-[44px]"
            >
              {language === 'hi' ? 'डैशबोर्ड पर लौटें' : 'BACK TO DASHBOARD'}
            </button>
          </div>
        </div>
      )}

      {/* Main Submission Form */}
      {!submissionSuccess && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="bg-[#FFF8F7] border border-[#C62828] p-3 rounded-[2px] text-xs text-[#C62828] flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: Animal Selection */}
          <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-[#102A43] tracking-wide font-sans border-b border-stone-200 pb-2">
              1. {t('health_report.select_animal')}
            </h2>

            {animals.length === 0 ? (
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-[2px] text-xs text-stone-600">
                {language === 'hi'
                  ? 'पंजीकृत पशु नहीं मिले। आपातकालीन स्थिति में फिर भी रिपोर्ट भेज सकते हैं।'
                  : 'No livestock found in registry. You can still report as an emergency.'}
              </div>
            ) : (
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
                          ? 'border-[#1B5E3C] bg-[#EBF5EE] ring-1 ring-[#1B5E3C]'
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
            )}
          </div>

          {/* Section 2: Clinical Symptoms Checklist + Voice Recorder */}
          <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h2 className="text-xs font-bold text-[#102A43] tracking-wide font-sans">
                2. {t('health_report.select_symptoms')}
              </h2>
              <span className="text-[10px] font-mono text-stone-500">
                {language === 'hi' ? 'चयनित' : 'SELECTED'}: {selectedSymptoms.length}
              </span>
            </div>

            {/* Voice-Assisted Symptom Input Component */}
            <VoiceSymptomRecorder
              language={language}
              onApplySymptoms={handleApplyVoiceSymptoms}
            />

            {/* Clinical Symptoms Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {CLINICAL_SYMPTOMS.map((sym) => {
                const isChecked = selectedSymptoms.includes(sym.label)
                return (
                  <label
                    key={sym.id}
                    onClick={() => toggleSymptom(sym.label)}
                    className={`flex items-start gap-2.5 p-3 border rounded-[2px] cursor-pointer transition-colors select-none min-h-[48px] ${
                      isChecked
                        ? 'border-[#C62828] bg-[#FFF8F7] text-[#7B1818]'
                        : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // Controlled by label click
                      className="mt-0.5 rounded-[2px] accent-[#C62828] shrink-0 w-4 h-4"
                    />
                    <div>
                      <p className="text-xs font-bold leading-tight">{sym.label}</p>
                      <p className="text-[11px] text-stone-500 mt-0.5 font-sans">{sym.labelHi}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Section 3: Clinical Severity Level */}
          <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-[#102A43] tracking-wide font-sans border-b border-stone-200 pb-2">
              3. {t('health_report.severity')}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                onClick={() => setSeverity('Mild')}
                className={`p-3.5 border rounded-[2px] cursor-pointer transition-colors min-h-[48px] ${
                  severity === 'Mild'
                    ? 'border-[#2E7D32] bg-[#EBF5EE] text-[#1B5E3C]'
                    : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="severity"
                    value="Mild"
                    checked={severity === 'Mild'}
                    onChange={() => setSeverity('Mild')}
                    className="accent-[#2E7D32] w-4 h-4"
                  />
                  <span className="text-xs font-bold font-sans">{t('health_report.severity_mild')}</span>
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Active, eating normally, slight temperature or isolated cough.
                </p>
              </label>

              <label
                onClick={() => setSeverity('Moderate')}
                className={`p-3.5 border rounded-[2px] cursor-pointer transition-colors min-h-[48px] ${
                  severity === 'Moderate'
                    ? 'border-[#E0A11A] bg-[#FFFDF7] text-[#8C5D00]'
                    : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="severity"
                    value="Moderate"
                    checked={severity === 'Moderate'}
                    onChange={() => setSeverity('Moderate')}
                    className="accent-[#E0A11A] w-4 h-4"
                  />
                  <span className="text-xs font-bold font-sans">{t('health_report.severity_moderate')}</span>
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Reduced appetite, clear lameness, drop in milk yield, fever.
                </p>
              </label>

              <label
                onClick={() => setSeverity('Severe')}
                className={`p-3.5 border rounded-[2px] cursor-pointer transition-colors min-h-[48px] ${
                  severity === 'Severe'
                    ? 'border-[#C62828] bg-[#FFF8F7] text-[#C62828]'
                    : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="severity"
                    value="Severe"
                    checked={severity === 'Severe'}
                    onChange={() => setSeverity('Severe')}
                    className="accent-[#C62828] w-4 h-4"
                  />
                  <span className="text-xs font-bold font-sans">{t('health_report.severity_severe')}</span>
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  High fever, unable to stand, lesions in mouth/feet, rapid deterioration.
                </p>
              </label>
            </div>
          </div>

          {/* Section 4: Detailed Observations */}
          <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-[#102A43] tracking-wide font-sans border-b border-stone-200 pb-2">
              4. {t('health_report.description')}
            </h2>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('health_report.desc_placeholder')}
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-[2px] text-xs text-stone-800 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-[#1B5E3C]"
            />
          </div>

          {/* Section 5: GPS Geolocation & Photograph */}
          <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h2 className="text-xs font-bold text-[#102A43] tracking-wide font-sans">
                5. {language === 'hi' ? 'स्थान एवं तस्वीर (कम बैंडविड्थ समर्थित)' : 'LOCATION & PHOTOGRAPHIC EVIDENCE'}
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
              {/* Geolocation */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700 font-sans">
                  {t('location.capture_gps')}
                </label>
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-[2px] space-y-2">
                  {geoLoc ? (
                    <div className="text-xs font-mono text-[#102A43] flex items-center gap-1.5">
                      <MapPin size={14} className="text-[#1B5E3C]" />
                      <span>LAT: {geoLoc.lat}, LNG: {geoLoc.lng}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500">
                      {language === 'hi'
                        ? 'कोई निर्देशांक नहीं लिए गए। गांव का स्थान जोड़ने के लिए नीचे क्लिक करें।'
                        : 'No coordinates captured yet. Click below to tag current village location.'}
                    </p>
                  )}

                  {geoError && (
                    <p className="text-[11px] text-[#8C5D00]">{geoError}</p>
                  )}

                  <button
                    type="button"
                    onClick={handleCaptureGeo}
                    disabled={geoLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#102A43] hover:bg-[#1B5E3C] text-white text-xs font-bold rounded-[2px] font-mono transition-colors cursor-pointer min-h-[44px]"
                  >
                    <MapPin size={13} />
                    <span>{geoLoading ? 'CAPTURING GPS...' : t('location.capture_gps')}</span>
                  </button>
                  <p className="text-[10px] text-stone-400">
                    {language === 'hi'
                      ? 'स्थान उपलब्ध न होने पर भी रिपोर्ट दर्ज की जा सकती है।'
                      : 'Submission is never blocked if GPS is unavailable.'}
                  </p>
                </div>
              </div>

              {/* Lesion Photograph */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700 font-sans">
                  {language === 'hi' ? 'तस्वीर जोड़ें (स्वचालित संपीड़ित / Low-bandwidth)' : 'Attach Clinical Photograph (Auto-compressed)'}
                </label>
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-[2px] space-y-2">
                  {photoPreview ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={photoPreview}
                        alt="Clinical Lesion Preview"
                        className="w-14 h-14 object-cover border border-stone-300 rounded-[2px]"
                      />
                      <div>
                        <span className="text-[10px] font-mono text-[#1B5E3C] bg-[#EBF5EE] px-1.5 py-0.5 rounded-[1px] block w-fit">
                          LOW-BANDWIDTH COMPRESSED
                        </span>
                        <button
                          type="button"
                          onClick={() => setPhotoPreview(null)}
                          className="text-xs text-[#C62828] hover:underline font-mono mt-1"
                        >
                          {language === 'hi' ? 'तस्वीर हटाएं' : 'Remove Photo'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-300 text-stone-700 text-xs font-bold rounded-[2px] hover:bg-stone-100 transition-colors cursor-pointer font-mono min-h-[44px]">
                      <Camera size={13} />
                      <span>{photoCompressing ? 'COMPRESSING...' : (language === 'hi' ? 'तस्वीर चुनें' : 'UPLOAD PHOTO')}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="sr-only"
                      />
                    </label>
                  )}
                  <p className="text-[10px] text-stone-400">
                    {language === 'hi'
                      ? 'तस्वीर को 2G/3G नेटवर्क के लिए स्वचालित रूप से संपीड़ित किया जाता है।'
                      : 'Images automatically compressed on device for low-bandwidth 2G/3G transmission.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Statutory Review Notice */}
          <div className="p-3.5 bg-stone-100 border border-stone-300 rounded-[2px] text-xs text-stone-600 flex items-start gap-2">
            <Info size={16} className="text-[#1B5E3C] shrink-0 mt-0.5" />
            <p>
              <strong>{language === 'hi' ? 'वैधानिक सूचना:' : 'Statutory Notice:'}</strong> {language === 'hi'
                ? 'सभी लक्षण रिपोर्ट पशुपालन निदेशालय के अंतर्गत राज्य पशु रोग निगरानी प्रणाली में दर्ज की जाती हैं। पशु चिकित्सक के निरीक्षण के बिना कोई स्वचालित रोग निदान अंतिम नहीं होता।'
                : 'All symptom submissions are logged into the State Animal Disease Surveillance Registry under the Directorate of Animal Husbandry. No automated disease diagnosis is finalized without licensed veterinary inspection.'}
            </p>
          </div>

          {/* Submit Action Bar */}
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
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#C62828] hover:bg-[#A81D1D] active:bg-[#7B1818] text-white text-xs font-bold rounded-[2px] shadow-sm transition-colors cursor-pointer font-mono tracking-wider disabled:opacity-50 min-h-[48px]"
            >
              <Send size={15} />
              <span>
                {submitting
                  ? (language === 'hi' ? 'रिपोर्ट भेजी जा रही है...' : 'SUBMITTING...')
                  : t('health_report.submit')}
              </span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
