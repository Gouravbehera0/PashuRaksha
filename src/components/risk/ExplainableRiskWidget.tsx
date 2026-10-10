import React, { useState, useEffect } from 'react'
import {
  Activity,
  RefreshCw,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Flame,
  FileText
} from 'lucide-react'
import type { VeterinaryCase } from '@/types'
import type { RiskAssessment, RiskLevel } from '@/services/risk/riskTypes'
import {
  calculateCaseRisk,
  getRiskAssessmentByCaseId,
  saveRiskAssessment
} from '@/services/risk/riskEngine'
import { getVetCases } from '@/services/vetService'

interface ExplainableRiskWidgetProps {
  vetCase: VeterinaryCase
  onRecalculate?: (updated: RiskAssessment) => void
}

export const ExplainableRiskWidget: React.FC<ExplainableRiskWidgetProps> = ({
  vetCase,
  onRecalculate
}) => {
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)
  const [showDetails, setShowDetails] = useState(true)

  const loadAssessment = async () => {
    try {
      setLoading(true)
      const existing = await getRiskAssessmentByCaseId(vetCase.id)
      if (existing) {
        setAssessment(existing)
      } else {
        // Compute dynamically
        const allCases = await getVetCases()
        const computed = calculateCaseRisk(vetCase, allCases)
        await saveRiskAssessment(computed)
        setAssessment(computed)
      }
    } catch (err) {
      console.error('[RiskWidget] Failed to load assessment:', err)
      const computed = calculateCaseRisk(vetCase)
      setAssessment(computed)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAssessment()
  }, [vetCase.id])

  const handleRecalculate = async () => {
    try {
      setRecalculating(true)
      const allCases = await getVetCases()
      const recomputed = calculateCaseRisk(vetCase, allCases)
      await saveRiskAssessment(recomputed)
      setAssessment(recomputed)
      if (onRecalculate) {
        onRecalculate(recomputed)
      }
    } catch (err) {
      console.error('[RiskWidget] Recalculation failed:', err)
    } finally {
      setRecalculating(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs flex items-center justify-center gap-2 font-mono text-xs text-stone-500 py-8">
        <RefreshCw className="animate-spin text-[#1B5E3C]" size={16} />
        <span>EVALUATING LIVESTOCK HEALTH RISK METRICS...</span>
      </div>
    )
  }

  if (!assessment) return null

  // Risk styling helpers
  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'CRITICAL':
        return {
          bg: 'bg-[#C62828]',
          badgeBg: 'bg-[#FDF0EE]',
          badgeText: 'text-[#C62828]',
          badgeBorder: 'border-[#C62828]/40',
          gaugeBar: 'bg-[#C62828]',
          cardBorder: 'border-l-[#C62828]'
        }
      case 'HIGH':
        return {
          bg: 'bg-[#D97706]',
          badgeBg: 'bg-[#FEF8EC]',
          badgeText: 'text-[#D97706]',
          badgeBorder: 'border-[#D97706]/40',
          gaugeBar: 'bg-[#D97706]',
          cardBorder: 'border-l-[#D97706]'
        }
      case 'MEDIUM':
        return {
          bg: 'bg-[#E0A11A]',
          badgeBg: 'bg-[#FFFBEB]',
          badgeText: 'text-[#92400E]',
          badgeBorder: 'border-[#E0A11A]/40',
          gaugeBar: 'bg-[#E0A11A]',
          cardBorder: 'border-l-[#E0A11A]'
        }
      case 'LOW':
      default:
        return {
          bg: 'bg-[#2E7D32]',
          badgeBg: 'bg-[#EBF5EE]',
          badgeText: 'text-[#1B5E3C]',
          badgeBorder: 'border-[#2E7D32]/40',
          gaugeBar: 'bg-[#2E7D32]',
          cardBorder: 'border-l-[#2E7D32]'
        }
    }
  }

  const colors = getRiskColor(assessment.risk_level)

  return (
    <div className={`bg-white border border-stone-300 rounded-[2px] shadow-xs border-l-4 ${colors.cardBorder} overflow-hidden font-sans`}>
      {/* Top Header Strip */}
      <div className="bg-[#FAF9F5] border-b border-stone-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#102A43] text-[#F7F5EE] px-2 py-0.5 rounded-[1px]">
            HEALTH RISK ENGINE
          </span>
          <span className="text-[10px] font-mono text-stone-500">
            ENGINE VER: {assessment.engine_version} &middot; CALC: {new Date(assessment.calculated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRecalculate}
            disabled={recalculating}
            className="px-2.5 py-1 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 text-[11px] font-mono font-bold rounded-[2px] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Recalculate risk against current epidemiological database"
          >
            <RefreshCw size={12} className={recalculating ? 'animate-spin text-[#1B5E3C]' : 'text-stone-500'} />
            <span>{recalculating ? 'CALCULATING...' : 'RE-CALCULATE'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="p-1 hover:bg-stone-200/60 rounded-[2px] text-stone-600 transition-colors"
            title={showDetails ? 'Collapse details' : 'Expand details'}
          >
            {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Main Risk Summary Banner */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Score Gauge / Meter (Cols 1-4) */}
          <div className="lg:col-span-4 bg-[#F7F5EE] border border-stone-300/80 p-4 rounded-[2px] flex items-center gap-4">
            <div className="relative flex flex-col items-center justify-center w-20 h-20 rounded-full border-4 border-stone-300/60 shrink-0 bg-white shadow-inner">
              <span className="font-mono font-black text-2xl text-[#102A43] leading-none">
                {assessment.risk_score}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400 mt-0.5">
                / 100
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-[1px] border uppercase tracking-wider ${colors.badgeBg} ${colors.badgeText} ${colors.badgeBorder}`}>
                  {assessment.risk_level} RISK
                </span>
              </div>
              <p className="text-xs font-semibold text-[#102A43]">
                Composite Clinical Health Risk
              </p>
              <div className="w-full bg-stone-200 h-2 rounded-[1px] overflow-hidden mt-2">
                <div
                  className={`h-full ${colors.gaugeBar} transition-all duration-500`}
                  style={{ width: `${assessment.risk_score}%` }}
                />
              </div>
            </div>
          </div>

          {/* Clinical Action Recommendation (Cols 5-12) */}
          <div className="lg:col-span-8 space-y-2">
            <div className="flex items-start gap-2 bg-[#EBF5EE] border border-[#2E7D32]/30 p-3 rounded-[2px]">
              <Activity className="w-5 h-5 text-[#1B5E3C] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1B5E3C]">
                  RECOMMENDED CLINICAL / FIELD ACTION
                </h4>
                <p className="text-xs text-stone-800 mt-0.5 leading-relaxed font-sans">
                  {assessment.recommended_action}
                </p>
              </div>
            </div>

            {/* Statutory Disclaimer Pill */}
            <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-mono bg-stone-100 px-2 py-1 rounded-[1px] border border-stone-200">
              <Info size={12} className="text-stone-400 shrink-0" />
              <span>
                DECISION-SUPPORT NOTICE: Explainable early warning score only. Not an automated diagnosis. Clinical evaluation by registered veterinarian required.
              </span>
            </div>
          </div>
        </div>

        {/* Explainable Factor Breakdown (Expandable) */}
        {showDetails && (
          <div className="mt-5 pt-4 border-t border-stone-200 space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#102A43] flex items-center gap-1.5">
              <FileText size={14} className="text-[#1B5E3C]" />
              EXPLAINABLE RISK FACTOR BREAKDOWN (0&ndash;100 WEIGHTED SCORE)
            </h4>

            {/* 5-Factor Weighted Subscore Meters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Factor 1: Symptom Severity (Max 30) */}
              <div className="bg-[#FAF9F5] border border-stone-200 p-2.5 rounded-[1px]">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-stone-700">Symptom Severity</span>
                  <span className="font-mono font-bold text-[#102A43]">{assessment.symptom_score}/30</span>
                </div>
                <div className="w-full bg-stone-200 h-1.5 rounded-xs overflow-hidden">
                  <div
                    className="bg-[#1B5E3C] h-full"
                    style={{ width: `${(assessment.symptom_score / 30) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-stone-500 font-sans block mt-1">Weighted clinical signs</span>
              </div>

              {/* Factor 2: Symptom Combination (Max 20) */}
              <div className="bg-[#FAF9F5] border border-stone-200 p-2.5 rounded-[1px]">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-stone-700">Syndromic Pair</span>
                  <span className="font-mono font-bold text-[#102A43]">{assessment.severity_score}/20</span>
                </div>
                <div className="w-full bg-stone-200 h-1.5 rounded-xs overflow-hidden">
                  <div
                    className="bg-[#2E7D32] h-full"
                    style={{ width: `${(assessment.severity_score / 20) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-stone-500 font-sans block mt-1">Syndromic patterns</span>
              </div>

              {/* Factor 3: Affected Animals / Herd (Max 20) */}
              <div className="bg-[#FAF9F5] border border-stone-200 p-2.5 rounded-[1px]">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-stone-700">Herd Impact</span>
                  <span className="font-mono font-bold text-[#102A43]">{assessment.affected_animal_score}/20</span>
                </div>
                <div className="w-full bg-stone-200 h-1.5 rounded-xs overflow-hidden">
                  <div
                    className="bg-[#D97706] h-full"
                    style={{ width: `${(assessment.affected_animal_score / 20) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-stone-500 font-sans block mt-1">Spread within herd</span>
              </div>

              {/* Factor 4: Spatio-temporal Cases (Max 15) */}
              <div className="bg-[#FAF9F5] border border-stone-200 p-2.5 rounded-[1px]">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-stone-700">Nearby Cases</span>
                  <span className="font-mono font-bold text-[#102A43]">{assessment.cluster_score}/15</span>
                </div>
                <div className="w-full bg-stone-200 h-1.5 rounded-xs overflow-hidden">
                  <div
                    className="bg-[#E0A11A] h-full"
                    style={{ width: `${(assessment.cluster_score / 15) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-stone-500 font-sans block mt-1">5km 7-day proximity</span>
              </div>

              {/* Factor 5: Mortality Signal (Max 15) */}
              <div className="bg-[#FAF9F5] border border-stone-200 p-2.5 rounded-[1px]">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-stone-700">Mortality Signal</span>
                  <span className="font-mono font-bold text-[#102A43]">{assessment.mortality_score}/15</span>
                </div>
                <div className="w-full bg-stone-200 h-1.5 rounded-xs overflow-hidden">
                  <div
                    className="bg-[#C62828] h-full"
                    style={{ width: `${(assessment.mortality_score / 15) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-stone-500 font-sans block mt-1">Death reports in stall</span>
              </div>
            </div>

            {/* Explainable Reasons / Evidence List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Evidence Signals */}
              <div className="space-y-2">
                <h5 className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-[#1B5E3C]" />
                  DETECTED CLINICAL EVIDENCE REASONS
                </h5>
                <ul className="space-y-1.5 text-xs text-stone-700 font-sans">
                  {assessment.reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-[#F3F5F1] p-2 rounded-[2px] border border-stone-200">
                      <span className="font-mono font-bold text-[#1B5E3C] text-[10px] mt-0.5">#{idx + 1}</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                  {assessment.reasons.length === 0 && (
                    <li className="text-stone-500 text-xs italic">No high-risk reasons detected.</li>
                  )}
                </ul>
              </div>

              {/* Individual Contribution Item Weights */}
              <div className="space-y-2">
                <h5 className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1">
                  <Flame size={13} className="text-[#D97706]" />
                  CONTRIBUTING SIGNAL WEIGHTS
                </h5>
                <div className="space-y-1.5">
                  {assessment.contributions?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-white border border-stone-200 px-2.5 py-1.5 rounded-[1px] text-xs"
                    >
                      <div>
                        <span className="font-semibold text-stone-800">{item.name}</span>
                        {item.description && (
                          <span className="text-[10px] text-stone-500 block">{item.description}</span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-[#102A43] bg-stone-100 px-1.5 py-0.5 rounded-[1px] text-[11px]">
                        +{item.points} pts
                      </span>
                    </div>
                  ))}
                  {(!assessment.contributions || assessment.contributions.length === 0) && (
                    <span className="text-stone-500 text-xs italic">No individual factor contributions available.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
