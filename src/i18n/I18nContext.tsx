import React, { createContext, useContext, useState } from 'react'
import { translations, type SupportedLanguage } from './translations'

interface I18nContextType {
  language: SupportedLanguage
  setLanguage: (lang: SupportedLanguage) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const STORAGE_KEY = 'pashuraksha_language'

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'hi' || saved === 'en') return saved
    } catch {
      // fallback
    }
    return 'en'
  })

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang)
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // localstorage unavailable
    }
  }

  // Dot notation translation lookup: e.g. "farmer.my_livestock"
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.')
    let current: any = translations[language]

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k]
      } else {
        // Fallback to English if missing in Hindi
        let fallback: any = translations.en
        for (const fk of keys) {
          if (fallback && typeof fallback === 'object' && fk in fallback) {
            fallback = fallback[fk]
          } else {
            return key
          }
        }
        current = fallback
        break
      }
    }

    if (typeof current !== 'string') {
      return key
    }

    let result = current
    if (params) {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal))
      })
    }

    return result
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider')
  }
  return context
}
