// ============================================================
// PASHURAKSHA (पशुरक्षा) — CENTRALIZED LANGUAGE FOUNDATION (i18n)
// Prepared for bilingual English/Hindi and future regional languages
// ============================================================

export type SupportedLanguage = 'en' | 'hi'

export const translations = {
  en: {
    // Platform Branding
    appName: 'PashuRaksha',
    tagline: 'Detect Early. Prevent Outbreaks. Protect Livestock.',
    helplineText: 'EMERGENCY HELPLINE: 1962 (TOLL-FREE)',

    // Navigation & Shell
    dashboard: 'Dashboard',
    myAnimals: 'My Livestock',
    reportHealth: 'Report Health Issue',
    reportMortality: 'Report Mortality',
    vaccinations: 'Vaccinations',
    treatments: 'Treatments',
    alerts: 'Alerts',
    cases: 'Track Cases',
    settings: 'Settings',

    // Dashboard
    greetingMorning: 'Good morning',
    greetingSubtext: 'Monitor your livestock health and report problems early.',
    myLivestock: 'My Livestock',
    healthy: 'Healthy',
    underObservation: 'Under Observation',
    highRisk: 'High Risk',
    vaccinationsDue: 'Vaccinations Due',
    noAnimalsYet: 'No livestock registered yet.',
    addFirstAnimal: 'Add Your First Animal',
    addAnimal: 'Register Animal',
    recentActivity: 'Recent Health Activity',

    // Health States
    statusHealthy: 'Healthy',
    statusObservation: 'Under Observation',
    statusHighRisk: 'High Risk',
    statusCritical: 'Critical',

    // Action buttons
    submitReport: 'Submit Health Report',
    saving: 'Saving...',
    successAnimalAdded: 'Animal registered successfully.',
    successReportSubmitted: 'Health report submitted successfully.',
    reportSentForReview: 'Your report has been sent for veterinary review.',
    mortalitySubmitted: 'Mortality report submitted. Veterinary verification may be required.',
    cancel: 'Cancel',
    viewProfile: 'View Health Profile',

    // Form labels
    animalType: 'Animal Type',
    breed: 'Breed',
    gender: 'Gender',
    dateOfBirth: 'Date of Birth',
    ageYears: 'Age (Years)',
    color: 'Color / Identification Marks',
    weightKg: 'Weight (kg)',
    village: 'Village',
    district: 'District',
    selectSymptoms: 'Select Clinical Symptoms',
    severity: 'Severity',
    description: 'Detailed Description',
    uploadPhoto: 'Attach Photograph (Optional)',
    location: 'GPS Location Coordinates',
  },
  hi: {
    // Platform Branding
    appName: 'पशुरक्षा',
    tagline: 'शीघ्र पहचानें। प्रकोप रोकें। पशुधन बचाएं।',
    helplineText: 'आपातकालीन हेल्पलाइन: 1962 (टोल-फ्री)',

    // Navigation & Shell
    dashboard: 'डैशबोर्ड',
    myAnimals: 'मेरे पशु',
    reportHealth: 'बीमारी रिपोर्ट करें',
    reportMortality: 'मृत्यु दर्ज करें',
    vaccinations: 'टीकाकरण',
    treatments: 'उपचार रिकॉर्ड',
    alerts: 'सतर्कता संदेश',
    cases: 'मामले ट्रैक करें',
    settings: 'सेटिंग्स',

    // Dashboard
    greetingMorning: 'शुभ प्रभात',
    greetingSubtext: 'अपने पशुओं के स्वास्थ्य की निगरानी करें और समस्याओं की शीघ्र रिपोर्ट करें।',
    myLivestock: 'कुल पशुधन',
    healthy: 'स्वस्थ',
    underObservation: 'निगरानी में',
    highRisk: 'उच्च जोखिम',
    vaccinationsDue: 'टीकाकरण देय',
    noAnimalsYet: 'अभी तक कोई पशु पंजीकृत नहीं है।',
    addFirstAnimal: 'पहला पशु पंजीकृत करें',
    addAnimal: 'पशु पंजीकृत करें',
    recentActivity: 'हालिया स्वास्थ्य गतिविधि',

    // Health States
    statusHealthy: 'स्वस्थ',
    statusObservation: 'निगरानी में',
    statusHighRisk: 'उच्च जोखिम',
    statusCritical: 'अति गंभीर',

    // Action buttons
    submitReport: 'स्वास्थ्य रिपोर्ट जमा करें',
    saving: 'सहेज रहे हैं...',
    successAnimalAdded: 'पशु सफलतापूर्वक पंजीकृत किया गया।',
    successReportSubmitted: 'स्वास्थ्य रिपोर्ट सफलतापूर्वक जमा की गई।',
    reportSentForReview: 'आपकी रिपोर्ट पशु चिकित्सा समीक्षा के लिए भेज दी गई है।',
    mortalitySubmitted: 'मृत्यु रिपोर्ट जमा की गई। पशु चिकित्सक सत्यापन आवश्यक हो सकता है।',
    cancel: 'रद्द करें',
    viewProfile: 'स्वास्थ्य प्रोफाइल देखें',

    // Form labels
    animalType: 'पशु का प्रकार',
    breed: 'नस्ल',
    gender: 'लिंग',
    dateOfBirth: 'जन्म तिथि',
    ageYears: 'आयु (वर्ष)',
    color: 'रंग / पहचान चिह्न',
    weightKg: 'वजन (किग्रा)',
    village: 'गाँव',
    district: 'जिला',
    selectSymptoms: 'लक्षण चुनें',
    severity: 'गंभीरता',
    description: 'विस्तृत विवरण',
    uploadPhoto: 'तस्वीर संलग्न करें (वैकल्पिक)',
    location: 'जीपीएस स्थान निर्देशांक',
  },
} as const

export type TranslationKey = keyof typeof translations.en

let currentLang: SupportedLanguage = 'en'

export function setLanguage(lang: SupportedLanguage) {
  currentLang = lang
}

export function getLanguage(): SupportedLanguage {
  return currentLang
}

export function t(key: TranslationKey): string {
  return translations[currentLang][key] ?? translations.en[key] ?? key
}
