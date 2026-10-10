// ============================================================
// PASHURAKSHA (पशुरक्षा) — MODEL REGISTRY & AI INTEGRATION INTERFACE
// Stage 10: Advanced AI & Disease Intelligence
// Standard: Full Model Lineage & Non-Fabricated Verification Architecture
// "Detect Early. Prevent Outbreaks. Protect Livestock."
// ============================================================

import type { MLModelDefinition } from './intelligenceTypes'
import type { ExtractedCaseFeatures } from './featureEngineering'

const MODEL_CATALOG: Map<string, MLModelDefinition> = new Map([
  [
    'pashuraksha-rule-engine-v1',
    {
      modelId: 'pashuraksha-rule-engine-v1',
      modelName: 'PashuRaksha Deterministic Health Risk Engine',
      version: '1.0.0-prod',
      intendedTask: 'Transparent 0–100 Clinical Risk Scoring, Syndromic Signal Matching & Severity Weighting',
      status: 'ACTIVE_RULE_BASED',
      algorithmType: 'deterministic_scoring',
      inputFeaturesRequired: [
        'symptoms[]',
        'reported_severity',
        'affected_animal_count',
        'nearby_cases_count',
        'mortality_link',
      ],
      dataSourceRequirements: 'Standard veterinary case reports and district biosecurity registry.',
      trainingStatus: 'Non-Parametric / Rule-Engine (Empirically Calibrated by Veterinary Subject Matter Experts)',
      validationState: 'Validated Deterministic',
      clinicalSafetyNotice:
        'Deterministic mathematical scoring based on Department of Animal Husbandry guidelines. Does NOT output definitive pathology diagnoses.',
    },
  ],
  [
    'pashuraksha-stat-anomaly-v1',
    {
      modelId: 'pashuraksha-stat-anomaly-v1',
      modelName: 'PashuRaksha Spatio-Temporal Anomaly Detector',
      version: '1.0.0-prod',
      intendedTask: 'Rolling 7-day vs. 30-day Statistical Outlier, Mortality Surge & Hyper-Concentration Detection',
      status: 'ACTIVE_STATISTICAL',
      algorithmType: 'spatiotemporal_statistical',
      inputFeaturesRequired: [
        'case_timestamps[]',
        'village_coordinates',
        'district_case_counts',
        'mortality_reports[]',
      ],
      dataSourceRequirements: 'Minimum 3 cases per village within 7-day window to prevent false-positive alarms.',
      trainingStatus: 'Empirical Moving-Average Ratio & Standard Deviation Thresholding',
      validationState: 'Validated Statistical',
      clinicalSafetyNotice:
        'Statistical outlier identification tool. A volume surge indicates reporting variation or localized spread, but is not confirmed proof of an epidemic outbreak without DVO certification.',
    },
  ],
  [
    'pashuraksha-future-ml-interface',
    {
      modelId: 'pashuraksha-future-ml-interface',
      modelName: 'Future Supervised Disease Classification Model Interface (Scaffold)',
      version: '0.1.0-scaffold',
      intendedTask: 'Future Multiclass Differential Etiological Prediction (Pending Validated Training Corpus)',
      status: 'UNTRAINED_SCAFFOLD',
      algorithmType: 'supervised_ml_interface',
      inputFeaturesRequired: [
        'normalized_symptoms[]',
        'species',
        'age_group',
        'lactation_stage',
        'core_temperature',
        'pcr_elisa_lab_confirmations',
      ],
      dataSourceRequirements:
        'Requires authorized multi-district dataset of >=10,000 ground-truth PCR/ELISA laboratory-confirmed pathology cases.',
      trainingStatus: 'Untrained — No verified ground-truth veterinary pathology corpus ingested in current platform instance.',
      validationState: 'Incomplete (No Confirmed Veterinary Clinical Training Dataset)',
      clinicalSafetyNotice:
        'CRITICAL CLINICAL SAFETY GUARD: This interface is strictly an architectural placeholder. PashuRaksha does not fabricate fake ML weights or fictitious diagnostic predictions.',
    },
  ],
])

export interface ModelPredictionOutput {
  modelId: string
  modelVersion: string
  predictionTask: string
  algorithmType: string
  outputSummary: string
  confidenceScore?: number // Only provided if real trained probabilistic model exists
  isClinicalDiagnosis: boolean // Always false for decision support
  limitations: string[]
  inferenceTimestamp: string
}

/**
 * Returns all registered intelligence engines and future model scaffolds
 */
export function getRegisteredModels(): MLModelDefinition[] {
  return Array.from(MODEL_CATALOG.values())
}

/**
 * Retrieves a single model definition by ID
 */
export function getModelDefinition(modelId: string): MLModelDefinition | null {
  return MODEL_CATALOG.get(modelId) || null
}

/**
 * Safely executes inference or returns explicit limitations if an untrained scaffold is queried
 */
export function executeModelInference(
  modelId: string,
  features: ExtractedCaseFeatures
): ModelPredictionOutput {
  const modelDef = MODEL_CATALOG.get(modelId)

  if (!modelDef) {
    throw new Error(`[ModelRegistry] Model with ID "${modelId}" is not registered.`)
  }

  if (modelDef.status === 'UNTRAINED_SCAFFOLD') {
    return {
      modelId,
      modelVersion: modelDef.version,
      predictionTask: modelDef.intendedTask,
      algorithmType: modelDef.algorithmType,
      outputSummary: 'INFERENCE_DISABLED: Supervised machine-learning model is untrained due to absence of verified laboratory-labeled training corpus.',
      isClinicalDiagnosis: false,
      limitations: [
        'Clinical model validation remains incomplete for automated machine learning.',
        'Platform continues operating with certified Stage 4 deterministic risk scoring and Stage 10 syndromic pattern matching.',
        'No artificial model accuracy or fabricated probabilities are generated.',
      ],
      inferenceTimestamp: new Date().toISOString(),
    }
  }

  // Active rule-based inference descriptor
  return {
    modelId,
    modelVersion: modelDef.version,
    predictionTask: modelDef.intendedTask,
    algorithmType: modelDef.algorithmType,
    outputSummary: `Evaluated ${features.normalizedSymptoms.length} normalized signs across ${features.species} in ${features.village}. Risk tier: ${features.symptomSeverity}.`,
    isClinicalDiagnosis: false,
    limitations: [
      'Non-parametric expert heuristic rule evaluation.',
      'Decision-support alert only; definitive pathology requires clinical auscultation and laboratory assay.',
    ],
    inferenceTimestamp: new Date().toISOString(),
  }
}
