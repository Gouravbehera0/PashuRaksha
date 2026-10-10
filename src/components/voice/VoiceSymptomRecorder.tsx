import React, { useState, useEffect, useRef } from 'react'
import {
  Mic,
  MicOff,
  Sparkles,
  Check,
  Volume2
} from 'lucide-react'
import { useTranslation } from '@/i18n'

interface SymptomRule {
  id: string
  labelEn: string
  labelHi: string
  keywordsEn: string[]
  keywordsHi: string[]
}

const SYMPTOM_KEYWORD_RULES: SymptomRule[] = [
  {
    id: 'fever',
    labelEn: 'Fever / High Body Temperature',
    labelHi: 'तेज़ बुखार / गर्म शरीर',
    keywordsEn: ['fever', 'temperature', 'hot', 'warm', 'pyrexia', 'shivering'],
    keywordsHi: ['बुखार', 'गरम', 'तप', 'तापमान', 'कांपना']
  },
  {
    id: 'off_feed',
    labelEn: 'Loss of Appetite / Off Feed',
    labelHi: 'चारा-पानी न खाना / भूख न लगना',
    keywordsEn: ['not eating', 'off feed', 'loss of appetite', 'no appetite', 'refusing feed', 'anorexia'],
    keywordsHi: ['खाना नहीं', 'चारा नहीं', 'चारा छोड़', 'भूख नहीं', 'पानी नहीं पी', 'दाना नहीं']
  },
  {
    id: 'mouth_blisters',
    labelEn: 'Blisters/Ulcers in Mouth or Hooves',
    labelHi: 'मुंह या खुर में छाले / घाव',
    keywordsEn: ['blister', 'ulcer', 'wound', 'mouth sore', 'tongue', 'hoof sore'],
    keywordsHi: ['छाले', 'घाव', 'मुंह में छाले', 'खुर में छाले', 'जीभ पर छाले']
  },
  {
    id: 'salivation',
    labelEn: 'Excessive Salivation / Drooling',
    labelHi: 'मुंह से लार टपकना',
    keywordsEn: ['saliva', 'drool', 'froth', 'foam', 'slaver'],
    keywordsHi: ['लार', 'झाग', 'मुंह से पानी', 'लार गिरना', 'राल']
  },
  {
    id: 'lameness',
    labelEn: 'Lameness / Limping / Inability to Walk',
    labelHi: 'लंगड़ाना / चलने में असमर्थ',
    keywordsEn: ['limping', 'lame', 'cannot walk', 'unable to stand', 'leg pain'],
    keywordsHi: ['लंगड़ा', 'चल नहीं', 'खड़ा नहीं', 'पैर में दर्द', 'लचक']
  },
  {
    id: 'cough',
    labelEn: 'Coughing / Rapid Breathing / Wheezing',
    labelHi: 'खांसी / तेज सांस / हांफना',
    keywordsEn: ['cough', 'coughing', 'rapid breathing', 'wheezing', 'panting', 'breath'],
    keywordsHi: ['खांसी', 'सांस', 'हांफ', 'घरघराहट', 'दम फूलना']
  },
  {
    id: 'milk_drop',
    labelEn: 'Sudden Drop in Milk Production',
    labelHi: 'दूध में अचानक भारी गिरावट',
    keywordsEn: ['milk drop', 'less milk', 'milk reduced', 'no milk'],
    keywordsHi: ['दूध कम', 'दूध घट', 'दूध सूख', 'दूध नहीं']
  },
  {
    id: 'diarrhea',
    labelEn: 'Severe Diarrhea / Dysentery',
    labelHi: 'दस्त या खूनी पेचिश',
    keywordsEn: ['diarrhea', 'loose dung', 'dysentery', 'watery stool'],
    keywordsHi: ['दस्त', 'पेचिश', 'पतला गोबर', 'खून आना']
  },
  {
    id: 'skin_nodules',
    labelEn: 'Skin Nodules / Lumps on Body',
    labelHi: 'त्वचा पर गांठें या फफोले',
    keywordsEn: ['nodule', 'lump', 'skin bump', 'pustule', 'rash'],
    keywordsHi: ['गांठ', 'फफोले', 'त्वचा पर दाने', 'गिल्टी']
  },
  {
    id: 'swelling',
    labelEn: 'Swelling in Throat / Dewlap / Joints',
    labelHi: 'गले या जोड़ों में सूजन',
    keywordsEn: ['swelling', 'swollen', 'throat swelling', 'joint', 'dewlap'],
    keywordsHi: ['सूजन', 'गला फूला', 'गलकंबल', 'जोड़ों में सूजन']
  },
  {
    id: 'lethargy',
    labelEn: 'Severe Lethargy / Continuous Recumbency',
    labelHi: 'अत्यधिक सुस्ती / लगातार बैठे रहना',
    keywordsEn: ['lethargic', 'dull', 'depressed', 'sitting continuously', 'weak'],
    keywordsHi: ['सुस्त', 'बैठी है', 'उठ नहीं रही', 'कमजोर', 'बेजान']
  },
  {
    id: 'discharge',
    labelEn: 'Nasal or Ocular Discharge',
    labelHi: 'नाक या आंख से स्राव',
    keywordsEn: ['discharge', 'runny nose', 'mucus', 'eye water'],
    keywordsHi: ['नाक बहना', 'आंख से पानी', 'गाढ़ा स्राव', 'छींक']
  }
]

interface VoiceSymptomRecorderProps {
  onAppendDescription?: (text: string) => void
  onConfirmSymptoms?: (symptomLabels: string[]) => void
  onApplySymptoms?: (symptomLabels: string[]) => void
  currentDescription?: string
  language?: string
}

export const VoiceSymptomRecorder: React.FC<VoiceSymptomRecorderProps> = ({
  onAppendDescription,
  onConfirmSymptoms,
  onApplySymptoms,
  currentDescription: _currentDescription = '',
  language: propLanguage,
}) => {
  const { language: contextLanguage, t } = useTranslation()
  const language = propLanguage || contextLanguage
  const [isSupported, setIsSupported] = useState<boolean>(true)
  const [isListening, setIsListening] = useState<boolean>(false)
  const [transcript, setTranscript] = useState<string>('')
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<'hi-IN' | 'en-IN'>(
    language === 'hi' ? 'hi-IN' : 'en-IN'
  )
  const [suggestedSymptoms, setSuggestedSymptoms] = useState<SymptomRule[]>([])
  const [checkedSymptomIds, setCheckedSymptomIds] = useState<string[]>([])
  const recognitionRef = useRef<any>(null)

  // Check speech recognition support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) {
        setIsSupported(false)
      }
    }
  }, [])

  // Sync selected recognition language with app language if not manually toggled
  useEffect(() => {
    setSelectedLanguageCode(language === 'hi' ? 'hi-IN' : 'en-IN')
  }, [language])

  // Extract symptom suggestions whenever transcript updates
  useEffect(() => {
    if (!transcript.trim()) {
      setSuggestedSymptoms([])
      setCheckedSymptomIds([])
      return
    }

    const lower = transcript.toLowerCase()
    const matches: SymptomRule[] = []

    SYMPTOM_KEYWORD_RULES.forEach((rule) => {
      const hasEn = rule.keywordsEn.some((kw) => lower.includes(kw))
      const hasHi = rule.keywordsHi.some((kw) => lower.includes(kw))
      if (hasEn || hasHi) {
        matches.push(rule)
      }
    })

    setSuggestedSymptoms(matches)
    // Pre-check all detected suggestions by default so farmer can easily confirm
    setCheckedSymptomIds(matches.map((m) => m.id))
  }, [transcript])

  const toggleListening = () => {
    if (!isSupported) return

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsListening(false)
      return
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition

      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = selectedLanguageCode

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: any) => {
        let finalTranscript = ''
        for (let i = 0; i < event.results.length; i++) {
          finalTranscript += event.results[i][0].transcript + ' '
        }
        setTranscript(finalTranscript.trim())
      }

      recognition.onerror = (event: any) => {
        console.warn('[VoiceRecorder] Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    } catch (err) {
      console.error('[VoiceRecorder] Failed to start recognition:', err)
      setIsListening(false)
    }
  }

  const handleApplyToForm = () => {
    if (transcript.trim() && onAppendDescription) {
      const updated = _currentDescription
        ? `${_currentDescription}\n${transcript.trim()}`
        : transcript.trim()
      onAppendDescription(updated)
    }

    // Apply checked symptoms (use English labels to match database schema)
    if (checkedSymptomIds.length > 0) {
      const chosen = suggestedSymptoms
        .filter((s) => checkedSymptomIds.includes(s.id))
        .map((s) => s.labelEn)
      if (onConfirmSymptoms) onConfirmSymptoms(chosen)
      if (onApplySymptoms) onApplySymptoms(chosen)
    }

    setTranscript('')
    setSuggestedSymptoms([])
    setCheckedSymptomIds([])
  }

  const handleToggleCheck = (id: string) => {
    setCheckedSymptomIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  if (!isSupported) {
    return (
      <div className="bg-stone-50 border border-stone-200 p-3 rounded-[2px] text-xs text-stone-600 flex items-start gap-2 font-sans">
        <Volume2 size={15} className="text-stone-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-stone-700 block">
            {t('voice.unsupported')}
          </span>
          <span className="text-[11px] text-stone-500">
            Manual symptom checkboxes and keyboard entry are fully available below.
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#FAF9F5] border border-stone-300 p-3 sm:p-4 rounded-[2px] shadow-xs space-y-3 font-sans">
      {/* Top Bar: Mic action + Language switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleListening}
            className={`px-3.5 py-2 rounded-[2px] font-mono font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
              isListening
                ? 'bg-[#C62828] text-white animate-pulse'
                : 'bg-[#102A43] hover:bg-[#1B5E3C] text-white'
            }`}
            aria-pressed={isListening}
            aria-label={isListening ? t('voice.stop_listening') : t('voice.speak_button')}
          >
            {isListening ? <MicOff size={15} /> : <Mic size={15} />}
            <span>
              {isListening ? t('voice.stop_listening') : t('voice.speak_button')}
            </span>
          </button>

          {isListening && (
            <span className="text-xs font-mono text-[#C62828] font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#C62828] animate-ping" />
              {t('voice.listening')}
            </span>
          )}
        </div>

        {/* Speech Language Switcher (Hindi / English speech engine) */}
        <div className="flex items-center gap-1 text-[11px] font-mono">
          <span className="text-stone-500 mr-1">Voice Language:</span>
          <button
            type="button"
            onClick={() => setSelectedLanguageCode('hi-IN')}
            className={`px-2 py-0.5 rounded-[1px] border cursor-pointer font-bold ${
              selectedLanguageCode === 'hi-IN'
                ? 'bg-[#123C2A] text-white border-[#123C2A]'
                : 'bg-white text-stone-600 border-stone-300'
            }`}
          >
            हिन्दी (hi-IN)
          </button>
          <button
            type="button"
            onClick={() => setSelectedLanguageCode('en-IN')}
            className={`px-2 py-0.5 rounded-[1px] border cursor-pointer font-bold ${
              selectedLanguageCode === 'en-IN'
                ? 'bg-[#123C2A] text-white border-[#123C2A]'
                : 'bg-white text-stone-600 border-stone-300'
            }`}
          >
            English (en-IN)
          </button>
        </div>
      </div>

      {/* Recognized Speech Box */}
      {transcript && (
        <div className="space-y-2">
          <label className="block text-[11px] font-mono font-bold uppercase text-stone-600">
            Recognized Speech (You can edit text before applying):
          </label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={2}
            className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded-[2px] font-sans text-stone-800 focus:outline-none focus:border-[#102A43]"
          />
        </div>
      )}

      {/* Voice-to-Structured Symptom Suggestions */}
      {suggestedSymptoms.length > 0 && (
        <div className="p-3 bg-white border border-amber-300 rounded-[2px] space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#102A43]">
            <Sparkles size={14} className="text-amber-600" />
            <span>{t('voice.suggestions_title')} ({suggestedSymptoms.length})</span>
          </div>
          <p className="text-[11px] text-stone-600">
            {t('voice.suggestions_desc')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
            {suggestedSymptoms.map((symptom) => {
              const isChecked = checkedSymptomIds.includes(symptom.id)
              return (
                <label
                  key={symptom.id}
                  className={`flex items-center gap-2 p-2 rounded-[2px] border text-xs cursor-pointer select-none transition-colors ${
                    isChecked
                      ? 'bg-[#EBF5EE] border-[#1B5E3C] text-[#123C2A] font-semibold'
                      : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleCheck(symptom.id)}
                    className="w-4 h-4 text-[#1B5E3C] rounded-[2px] cursor-pointer"
                  />
                  <span>
                    {language === 'hi' ? symptom.labelHi : symptom.labelEn}
                  </span>
                </label>
              )
            })}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-200">
            <button
              type="button"
              onClick={() => {
                setTranscript('')
                setSuggestedSymptoms([])
                setCheckedSymptomIds([])
              }}
              className="px-2.5 py-1 text-[11px] font-mono text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              {t('voice.clear_voice')}
            </button>
            <button
              type="button"
              onClick={handleApplyToForm}
              className="px-3.5 py-1.5 bg-[#1B5E3C] hover:bg-[#123C2A] text-white text-xs font-mono font-bold rounded-[2px] flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Check size={13} />
              <span>{t('voice.apply_suggestions')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
