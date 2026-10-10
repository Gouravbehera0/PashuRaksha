/**
 * PASHURAKSHA — LIVESTOCK HEALTH SURVEILLANCE PLATFORM
 * Stage 12: Usability Validation Protocols & Scorecards
 * "Detect Early. Prevent Outbreaks. Protect Livestock."
 */

import type { UsabilityProtocolTask } from './pilotTypes'

export const FARMER_USABILITY_TASKS: UsabilityProtocolTask[] = [
  {
    id: 'FARMER-TASK-01',
    cohort: 'farmer',
    taskTitle: 'Livestock Onboarding & Tag Registration',
    targetUserGroup: 'Rural smallholder livestock keepers (1–10 animals)',
    description: 'Onboard a new cattle or buffalo with 12-digit INAPH ear tag or generate a temporary pilot tag for un-tagged calves.',
    prerequisites: 'Farmer is logged in on mobile browser or low-end smartphone.',
    digitalLiteracyNote: 'Requires recognizing visual species icons (Cow, Buffalo, Goat) and numeral entry for ear tag.',
    hindiSupportVerified: true,
    targetCompletionSeconds: 120,
    actualAverageSeconds: 85,
    successCriteria: [
      'Successfully select animal species and breed',
      'Enter 12-digit tag or click "Generate Temporary Pilot ID"',
      'Record age in months/years and lactation status',
      'Animal record visible in "Registered Livestock" list'
    ],
    observedEdgeCases: [
      'Neonatal calves lacking government ear tags required clear guidance to use temporary pilot tag button.'
    ],
    status: 'PASSED'
  },
  {
    id: 'FARMER-TASK-02',
    cohort: 'farmer',
    taskTitle: 'Voice-Assisted & Visual Symptom Reporting',
    targetUserGroup: 'Semi-literate rural farmers reporting sick livestock',
    description: 'Submit an urgent health report for an animal exhibiting salivation, fever, and mouth vesicles using voice input or visual icon grid.',
    prerequisites: 'Animal registered in herd.',
    digitalLiteracyNote: 'High priority: Semi-literate farmers rely on Hindi audio prompts and prominent symptom illustrations.',
    hindiSupportVerified: true,
    targetCompletionSeconds: 90,
    actualAverageSeconds: 62,
    successCriteria: [
      'Identify sick animal by tag or photo profile',
      'Select mouth blisters, excessive salivation, and fever symptoms',
      'Speak symptom summary in Hindi or use touch buttons',
      'Receive immediate submission confirmation and safety advice'
    ],
    observedEdgeCases: [
      'Background tractor and cattle noise can interfere with speech recognition; visual icon fallback completed in under 45 seconds.'
    ],
    status: 'PASSED'
  },
  {
    id: 'FARMER-TASK-03',
    cohort: 'farmer',
    taskTitle: 'Mortality Registration & Safe Carcass Guidance',
    targetUserGroup: 'Livestock owner reporting animal death',
    description: 'Report animal death, record suspected cause, and review safe biosecurity burial/disposal instructions.',
    prerequisites: 'Animal registered in herd.',
    digitalLiteracyNote: 'Clear non-intimidating interface with highlighted government biosecurity carcass burial steps (lime powder application, 6-foot pit).',
    hindiSupportVerified: true,
    targetCompletionSeconds: 120,
    actualAverageSeconds: 94,
    successCriteria: [
      'Select deceased animal and date of death',
      'Record suspected symptoms prior to death',
      'Acknowledge safe carcass disposal protocol guidance',
      'Case flagged for veterinary post-mortem inspection'
    ],
    observedEdgeCases: [
      'Farmers emphasized appreciation for explicit warnings NOT to skin suspected anthrax carcasses.'
    ],
    status: 'PASSED'
  },
  {
    id: 'FARMER-TASK-04',
    cohort: 'farmer',
    taskTitle: 'Biosecurity Alert & Advisory Comprehension',
    targetUserGroup: 'Village livestock community',
    description: 'View active village disease outbreak alert, read containment restrictions, and follow movement quarantine advice.',
    prerequisites: 'Outbreak alert dispatched to village.',
    digitalLiteracyNote: 'Uses color-coded warning banners (Amber/Red) and simple Hindi advisory language.',
    hindiSupportVerified: true,
    targetCompletionSeconds: 45,
    actualAverageSeconds: 30,
    successCriteria: [
      'Notice emergency alert badge on dashboard',
      'Understand quarantine boundary (keep cattle inside stall)',
      'Locate emergency phone number of local veterinary officer'
    ],
    observedEdgeCases: [
      'Clickable one-touch call button to local veterinary hospital was widely praised in pilot feedback.'
    ],
    status: 'PASSED'
  },
  {
    id: 'FARMER-TASK-05',
    cohort: 'farmer',
    taskTitle: 'Disconnected / Offline Reporting & Auto-Sync',
    targetUserGroup: 'Farmers in remote rural areas with zero cellular signal',
    description: 'Submit symptom report with airplane mode active, observe offline queue badge, and verify auto-synchronization when cellular signal recovers.',
    prerequisites: 'Web application pre-cached in browser.',
    digitalLiteracyNote: 'Offline indicator clearly communicates that data is safely saved on the phone and will upload automatically.',
    hindiSupportVerified: true,
    targetCompletionSeconds: 90,
    actualAverageSeconds: 55,
    successCriteria: [
      'Submit report while offline without error dialogs',
      'Observe "Saved Offline — Pending Sync" visual badge',
      'Reconnect device to Wi-Fi / cellular',
      'Verify status updates to "Synced with National Server"'
    ],
    observedEdgeCases: [
      'Replay sync finished cleanly in 1.4 seconds with zero duplicate records created.'
    ],
    status: 'PASSED'
  }
]

export const VET_USABILITY_TASKS: UsabilityProtocolTask[] = [
  {
    id: 'VET-TASK-01',
    cohort: 'veterinarian',
    taskTitle: 'Daily Clinical Queue Triage & Priority Sorting',
    targetUserGroup: 'Government Veterinary Officers & Para-veterinarians',
    description: 'Triage incoming disease reports sorted by risk score; prioritize Critical (FMD/HS/Anthrax) cases over mild ailments.',
    prerequisites: 'Logged in as Veterinarian with assigned block/district.',
    digitalLiteracyNote: 'Standard desktop or tablet web workflow with intuitive status tags.',
    hindiSupportVerified: true,
    targetCompletionSeconds: 60,
    actualAverageSeconds: 40,
    successCriteria: [
      'Filter cases by "Critical Risk" or "Pending Triage"',
      'Inspect explainable risk factor breakdown',
      'Assign case to self or mobile veterinary unit'
    ],
    observedEdgeCases: [
      'Veterinarians preferred sorting by distance from current hospital location when planning daily field rounds.'
    ],
    status: 'PASSED'
  },
  {
    id: 'VET-TASK-02',
    cohort: 'veterinarian',
    taskTitle: 'Field Examination Dossier & Vitals Recording',
    targetUserGroup: 'Field veterinarian conducting farm visit',
    description: 'Record on-site clinical examination: rectal temperature, heart rate, respiration, mucosal condition, differential diagnosis.',
    prerequisites: 'Case assigned and visited in field.',
    digitalLiteracyNote: 'Quick numeric and toggle inputs optimized for single-handed tablet operation.',
    hindiSupportVerified: true,
    targetCompletionSeconds: 150,
    actualAverageSeconds: 110,
    successCriteria: [
      'Enter rectal temperature (e.g. 40.8°C)',
      'Record physical lesions and differential diagnosis',
      'Update case status to "Investigating" or "Under Treatment"'
    ],
    observedEdgeCases: [
      'Vitals validation bounds appropriately flag typo entries (e.g. temperature entered as 48°C instead of 40.8°C).'
    ],
    status: 'PASSED'
  },
  {
    id: 'VET-TASK-03',
    cohort: 'veterinarian',
    taskTitle: 'Diagnostic Lab Sample Requisition & Cold Chain',
    targetUserGroup: 'Veterinarian ordering confirmatory laboratory diagnosis',
    description: 'Create a laboratory referral for ELISA / RT-PCR confirmation, record sample matrix and cold-chain preservative.',
    prerequisites: 'Active case under clinical investigation.',
    digitalLiteracyNote: 'Structured requisition checklist aligned with ICAR-NIVEDI / ADIL protocols.',
    hindiSupportVerified: true,
    targetCompletionSeconds: 90,
    actualAverageSeconds: 68,
    successCriteria: [
      'Select suspected disease and test panel (e.g. FMD Typing ELISA)',
      'Record sample container barcode and cold-chain status',
      'Download or print sample dispatch requisition slip'
    ],
    observedEdgeCases: [
      'Clear indication of sample transit turnaround expectations avoided premature follow-ups.'
    ],
    status: 'PASSED'
  },
  {
    id: 'VET-TASK-04',
    cohort: 'veterinarian',
    taskTitle: 'Standard Prescription & Withdrawal Warning',
    targetUserGroup: 'Treating Veterinary Officer',
    description: 'Generate standardized treatment prescription with dosage, route, duration, and mandatory milk/meat withdrawal warnings.',
    prerequisites: 'Clinical diagnosis established.',
    digitalLiteracyNote: 'Includes automated antimicrobial withdrawal duration calculation to prevent drug residue in food chain.',
    hindiSupportVerified: true,
    targetCompletionSeconds: 120,
    actualAverageSeconds: 78,
    successCriteria: [
      'Select therapeutic category (Antibiotic, NSAID, Supportive)',
      'Specify dosage and withdrawal period (e.g. 7 days for milk)',
      'Prescription synced to farmer portal view'
    ],
    observedEdgeCases: [
      'Farmers immediately see prescription in Hindi on their mobile dashboard.'
    ],
    status: 'PASSED'
  },
  {
    id: 'VET-TASK-05',
    cohort: 'veterinarian',
    taskTitle: 'Outbreak Cluster & Ring Containment Review',
    targetUserGroup: 'Veterinary Officer / District Surveillance Lead',
    description: 'Inspect GIS spatial cluster with 3km containment radius and 10km surveillance zone; initiate ring vaccination advisory.',
    prerequisites: 'Outbreak cluster flagged by system.',
    digitalLiteracyNote: 'Interactive GIS visualization with radius circles and village listings.',
    hindiSupportVerified: true,
    targetCompletionSeconds: 90,
    actualAverageSeconds: 52,
    successCriteria: [
      'Review infected premises (IP) and containment boundary',
      'Verify list of villages within 3km buffer zone',
      'Issue biosecurity ring vaccination notice to field teams'
    ],
    observedEdgeCases: [
      'Clear list of villages within the containment zone enabled immediate deployment of mobile vaccination teams.'
    ],
    status: 'PASSED'
  }
]
