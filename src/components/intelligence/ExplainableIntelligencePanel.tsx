// ============================================================
// PASHURAKSHA (पशुरक्षा) — EXPLAINABLE DISEASE INTELLIGENCE PANEL
// Stage 10: Advanced AI & Disease Intelligence
// Standard: Transparent Decision Support (Zero Fabricated Diagnoses)
// "Detect Early. Prevent Outbreaks. Protect Livestock."
// ============================================================

import React, { useState, useEffect } from 'react'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Scale,
  Sliders,
  Sparkles,
  HelpCircle
} from 'lucide-react'
import type {
  CaseIntelligenceDossier,
  CasePrioritizationLabel
} from '@/lib/intelligence/intelligenceTypes'
import {
  getCaseIntelligenceDossier,
  recordCasePriorityOverride,
  listIntelligenceModels,
  getModelEvaluationReport
} from '@/lib/intelligence'

interface ExplainableIntelligencePanelProps {
  caseId: string
  userRole?: 'veterinarian' | 'admin' | 'farmer'
  veterinarianName?: string
  onPriorityOverridden?: (newPriority: CasePrioritizationLabel) => void
}

export const ExplainableIntelligencePanel: React.FC<ExplainableIntelligencePanelProps> = ({
  caseId,
  userRole = 'veterinarian',
  veterinarianName = 'Dr. Priya Sharma (Veterinary Officer)',
  onPriorityOverridden,
}) => {
  const [dossier, setDossier] = useState<CaseIntelligenceDossier | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFactorDetails, setShowFactorDetails] = useState(true)
  const [showModelModal, setShowModelModal] = useState(false)
  const [showOverrideModal, setShowOverrideModal] = useState(false)

  // Override form
  const [selectedPriority, setSelectedPriority] = useState<CasePrioritizationLabel>('URGENT REVIEW')
  const [overrideReason, setOverrideReason] = useState('')
  const [savingOverride, setSavingOverride] = useState(false)

  const loadDossier = async () => {
    try {
      setLoading(true)
      const data = await getCaseIntelligenceDossier(caseId)
      setDossier(data)
      if (data) {
        setSelectedPriority(data.prioritization.recommendedPriority)
      }
    } catch (err) {
      console.error('[ExplainableIntelligencePanel] Failed to load dossier:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDossier()
  }, [caseId])

  const handleApplyOverride = () => {
    if (!dossier || !overrideReason.trim()) return
    setSavingOverride(true)
    try {
      recordCasePriorityOverride(
        dossier.caseId,
        dossier.prioritization.recommendedPriority,
        selectedPriority,
        overrideReason.trim(),
        veterinarianName
      )
      loadDossier()
      setShowOverrideModal(false)
      setOverrideReason('')
      if (onPriorityOverridden) {
        onPriorityOverridden(selectedPriority)
      }
    } finally {
      setSavingOverride(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs text-xs font-mono text-stone-500 flex items-center justify-center gap-2">
        <RefreshCw size={14} className="animate-spin text-[#1B5E3C]" />
        SYNTHESIZING DISEASE INTELLIGENCE DOSSIER...
      </div>
    )
  }

  if (!dossier) {
    return null
  }

  const prio = dossier.prioritization
  const pat = dossier.patternAnalysis

  // Priority color styling
  const priorityTheme =
    prio.recommendedPriority === 'CRITICAL REVIEW'
      ? { bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-900', badge: 'bg-[#C62828] text-white' }
      : prio.recommendedPriority === 'URGENT REVIEW'
      ? { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-900', badge: 'bg-[#E0A11A] text-stone-900' }
      : prio.recommendedPriority === 'PRIORITY REVIEW'
      ? { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-900', badge: 'bg-[#102A43] text-white' }
      : { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-900', badge: 'bg-[#1B5E3C] text-white' }

  return (
    <div className="bg-white border border-stone-300 rounded-[2px] shadow-xs space-y-4 font-sans overflow-hidden">
      {/* Header Bar */}
      <div className="bg-[#0E2E20] text-white px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1B5E3C]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono uppercase tracking-widest bg-[#1B5E3C] text-white px-2 py-0.5 rounded-[1px] font-bold">
            EXPLAINABLE DISEASE INTELLIGENCE &middot; रोग विश्लेषण
          </span>
          <span className="text-[10px] font-mono text-emerald-300">
            {pat.analysisVersion}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowModelModal(true)}
            className="text-[11px] font-mono text-emerald-100 hover:text-white underline cursor-pointer flex items-center gap-1"
            title="Inspect Model Lineage and Validation Status"
          >
            <HelpCircle size={12} />
            Model Lineage &amp; Safety Notice
          </button>
          <button
            type="button"
            onClick={loadDossier}
            className="p-1 hover:bg-white/10 rounded text-emerald-200 hover:text-white transition-colors cursor-pointer"
            title="Refresh Intelligence Calculation"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Top Triage & Risk Summary Strip */}
        <div className={`p-4 rounded-[2px] border ${priorityTheme.border} ${priorityTheme.bg} flex flex-col md:flex-row md:items-center justify-between gap-3`}>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-[1px] shadow-xs ${priorityTheme.badge}`}>
                TRIAGE RECOMMENDATION: {prio.recommendedPriority}
              </span>
              {prio.status === 'Overridden' && (
                <span className="text-[10px] font-mono bg-purple-100 text-purple-900 border border-purple-300 px-1.5 py-0.5 rounded-[1px] font-semibold">
                  CLINICAL OVERRIDE ACTIVE
                </span>
              )}
              <span className="text-[10px] font-mono text-stone-600">
                Composite Score: <strong>{prio.compositeScore}/100</strong>
              </span>
            </div>

            <div className="text-xs font-semibold text-stone-800 mt-1 flex items-center gap-1.5">
              <Activity size={14} className="text-[#1B5E3C]" />
              <span>Syndromic Pattern: <strong>{pat.patternName}</strong></span>
              <span className="text-stone-400">&bull;</span>
              <span className="text-stone-600">Deterministic Risk: <strong>{dossier.riskLevel} ({dossier.riskScore}/100)</strong></span>
            </div>

            <p className="text-xs text-stone-700 mt-1">
              {dossier.recommendedAction}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {userRole === 'veterinarian' && (
              <button
                type="button"
                onClick={() => setShowOverrideModal(true)}
                className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-semibold rounded-[2px] shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sliders size={13} />
                Override Priority
              </button>
            )}
          </div>
        </div>

        {/* Priority Override Audit Notice if present */}
        {prio.override && (
          <div className="p-3 bg-purple-50/70 border border-purple-200 text-purple-950 text-xs rounded-[2px] space-y-1">
            <div className="font-semibold flex items-center gap-1.5 font-mono text-[11px]">
              <Scale size={13} className="text-purple-700" />
              PRIORITY OVERRIDE REGISTERED BY: {prio.override.overriddenBy}
            </div>
            <p className="text-[11px] text-purple-900">
              <strong>Clinical Justification:</strong> {prio.override.reason}
            </p>
            <div className="text-[10px] font-mono text-purple-600">
              Updated at: {new Date(prio.override.overriddenAt).toLocaleString('en-IN')} (Adjusted from {prio.override.previousPriority} &rarr; {prio.override.newPriority})
            </div>
          </div>
        )}

        {/* Active Outbreak Cordon / Anomaly Signals Notice */}
        {(dossier.associatedClusterCode || dossier.associatedAnomalies.length > 0) && (
          <div className="p-3.5 bg-amber-50/80 border border-amber-300 text-amber-950 rounded-[2px] text-xs space-y-2">
            <div className="font-bold font-mono text-[11px] uppercase flex items-center gap-1.5 text-amber-900">
              <AlertTriangle size={14} className="text-amber-700" />
              Spatio-Temporal Anomaly &amp; Containment Signals
            </div>

            {dossier.associatedClusterCode && (
              <p className="text-[11px]">
                <strong>Active Outbreak Containment:</strong> Animal is tethered within the active containment buffer of Cluster <strong>{dossier.associatedClusterCode}</strong>.
              </p>
            )}

            {dossier.associatedAnomalies.map((anom) => (
              <div key={anom.id} className="text-[11px] bg-white/70 p-2 border border-amber-200 rounded-[1px]">
                <span className="font-bold text-amber-900 font-mono text-[10px] uppercase block">
                  [{anom.signalType}] {anom.title}
                </span>
                <span className="text-stone-700 mt-0.5 block">
                  {anom.description} (Severity: {anom.severity}, Status: {anom.status})
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Contributing Factors & Influence Breakdown */}
        <div className="border border-stone-200 rounded-[2px] bg-stone-50/60 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Scale size={14} className="text-[#102A43]" />
              <h4 className="text-xs font-mono font-bold uppercase text-[#102A43]">
                Transparent Prioritization Factor Breakdown
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setShowFactorDetails(!showFactorDetails)}
              className="text-stone-500 hover:text-stone-800 text-xs font-mono flex items-center gap-1 cursor-pointer"
            >
              {showFactorDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {showFactorDetails && (
            <div className="space-y-2.5 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {prio.factors.map((f, idx) => (
                  <div key={idx} className="bg-white p-2.5 border border-stone-200 rounded-[1px] text-xs">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="font-semibold text-stone-700">{f.name}</span>
                      <span className="font-bold text-[#1B5E3C]">+{f.scoreContribution} pts</span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1 line-clamp-2">
                      {f.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Contributing reasons list */}
              <div className="text-[11px] text-stone-600 bg-white p-2.5 border border-stone-200 rounded-[1px]">
                <span className="font-mono font-bold text-stone-700 uppercase block mb-1">
                  Primary Observed Drivers:
                </span>
                <ul className="list-disc list-inside space-y-0.5">
                  {prio.contributingReasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Clinical Pattern & Recommended Protocol */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-[2px] space-y-1.5">
            <div className="font-mono text-[11px] font-bold text-stone-800 uppercase flex items-center gap-1.5">
              <Sparkles size={13} className="text-[#1B5E3C]" />
              Observed Clinical Indicators
            </div>
            <ul className="list-disc list-inside space-y-1 text-stone-600 text-[11px]">
              {pat.clinicalIndicators.map((ind, i) => (
                <li key={i}>{ind}</li>
              ))}
            </ul>
          </div>

          <div className="p-3 bg-stone-50 border border-stone-200 rounded-[2px] space-y-1.5">
            <div className="font-mono text-[11px] font-bold text-stone-800 uppercase flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-[#102A43]" />
              Recommended Field Actions
            </div>
            <ul className="list-disc list-inside space-y-1 text-stone-700 text-[11px]">
              {pat.recommendedClinicalActions.map((act, i) => (
                <li key={i}>{act}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Data Limitations Disclosure */}
        <div className="p-3 bg-stone-100 border border-stone-300 rounded-[2px] text-[11px] text-stone-600 space-y-1">
          <div className="font-mono font-bold uppercase text-stone-700 flex items-center gap-1">
            <Info size={12} className="text-[#102A43]" />
            Regulatory &amp; Data Limitations Notice:
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-stone-600 text-[10px]">
            {dossier.dataLimitations.map((lim, idx) => (
              <li key={idx}>{lim}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Priority Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 bg-[#102A43]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-400 p-5 rounded-[2px] shadow-lg max-w-md w-full space-y-4">
            <div className="border-b border-stone-200 pb-2">
              <h3 className="font-bold text-sm text-[#102A43] font-mono uppercase">
                Override Workflow Triage Priority
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Adjust clinical review priority for Case #{dossier.caseNumber}. Every override is stamped in the permanent audit ledger.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-mono font-semibold uppercase text-stone-700 mb-1">
                  Adjusted Priority Tier
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as CasePrioritizationLabel)}
                  className="w-full p-2 border border-stone-300 rounded-[2px] bg-stone-50 font-mono text-xs focus:outline-none focus:border-[#102A43]"
                >
                  <option value="CRITICAL REVIEW">CRITICAL REVIEW (Immediate dispatch)</option>
                  <option value="URGENT REVIEW">URGENT REVIEW (Within 12 hours)</option>
                  <option value="PRIORITY REVIEW">PRIORITY REVIEW (Standard scheduled rounds)</option>
                  <option value="ROUTINE">ROUTINE (Advisory surveillance)</option>
                </select>
              </div>

              <div>
                <label className="block font-mono font-semibold uppercase text-stone-700 mb-1">
                  Clinical Justification / Reason *
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="State clinical observation, lab report correlation, or field emergency rationale..."
                  rows={3}
                  className="w-full p-2 border border-stone-300 rounded-[2px] text-xs focus:outline-none focus:border-[#102A43]"
                />
              </div>

              <div className="text-[11px] text-stone-500 font-mono">
                Attending Officer: <strong>{veterinarianName}</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 border border-stone-300 rounded-[2px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingOverride || !overrideReason.trim()}
                onClick={handleApplyOverride}
                className="px-3.5 py-1.5 text-xs bg-[#123C2A] text-white hover:bg-[#1B5E3C] font-semibold rounded-[2px] disabled:opacity-50 cursor-pointer"
              >
                {savingOverride ? 'Logging Override...' : 'Apply & Sign Override'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Model Lineage & Validation Modal */}
      {showModelModal && (
        <div className="fixed inset-0 z-50 bg-[#102A43]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-400 p-5 rounded-[2px] shadow-lg max-w-2xl w-full space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="border-b border-stone-200 pb-2 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#102A43] font-mono uppercase">
                  PashuRaksha Model Registry &amp; Validation Status
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Full transparent documentation of mathematical scoring engines and future ML interfaces.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModelModal(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {listIntelligenceModels().map((m) => {
                const evalReport = getModelEvaluationReport(m.modelId)
                return (
                  <div key={m.modelId} className="p-3 border border-stone-300 rounded-[2px] bg-stone-50 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="font-bold text-[#102A43] font-mono text-xs">
                        {m.modelName} ({m.version})
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-[1px] font-bold ${
                        m.status === 'ACTIVE_RULE_BASED'
                          ? 'bg-green-100 text-green-900 border border-green-300'
                          : m.status === 'ACTIVE_STATISTICAL'
                          ? 'bg-blue-100 text-blue-900 border border-blue-300'
                          : 'bg-stone-200 text-stone-800 border border-stone-400'
                      }`}>
                        STATUS: {m.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-600">
                      <strong>Intended Task:</strong> {m.intendedTask}
                    </p>

                    <div className="text-[11px] bg-white p-2 border border-stone-200 rounded-[1px] space-y-1">
                      <div><strong>Validation State:</strong> {m.validationState}</div>
                      <div><strong>Clinical Safety Notice:</strong> {m.clinicalSafetyNotice}</div>
                    </div>

                    {evalReport.confusionMatrix && (
                      <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px] text-center bg-stone-100 p-2 rounded-[1px]">
                        <div>Sensitivity: <strong>{evalReport.sensitivityRecall}</strong></div>
                        <div>Specificity: <strong>{evalReport.specificity}</strong></div>
                        <div>Precision: <strong>{evalReport.precision}</strong></div>
                        <div>F1-Score: <strong>{evalReport.f1Score}</strong></div>
                      </div>
                    )}

                    {!evalReport.isClinicalValidationComplete && (
                      <div className="p-2 bg-amber-50 border border-amber-300 text-amber-900 text-[10px] rounded-[1px]">
                        <strong>Clinical Validation Disclaimer:</strong> {evalReport.limitationsSummary}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setShowModelModal(false)}
                className="px-4 py-1.5 text-xs bg-[#102A43] text-white rounded-[2px] font-mono font-bold cursor-pointer hover:bg-[#1B5E3C]"
              >
                CLOSE REGISTRY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
