import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Pill, RefreshCw,
  Tag, Shield, ArrowRight
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getTreatments } from '@/services/treatmentService'
import type { Treatment } from '@/types'

export function FarmerTreatmentsPage() {
  const { user } = useAuth()
  const ownerId = user?.id || 'demo-farmer'

  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await getTreatments(ownerId)
      setTreatments(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [ownerId])

  const todayStr = new Date().toISOString().split('T')[0]

  const filtered = treatments.filter((t) => {
    if (filter === 'active') {
      return !t.end_date || t.end_date >= todayStr
    }
    if (filter === 'completed') {
      return t.end_date && t.end_date < todayStr
    }
    return true
  })

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-5 max-w-5xl mx-auto">
      {/* 1. Header */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs border-l-4 border-l-[#1B5E3C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#1B5E3C] text-white px-2 py-0.5 rounded-[1px]">
              VETERINARY PRESCRIPTIONS
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              OFFICIAL CLINICAL DESK
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#102A43] font-sans">
            उपचार एवं दवाएं &middot; Prescribed Veterinary Treatments
          </h1>
          <p className="text-xs text-stone-600 mt-0.5 font-sans">
            Verified veterinary prescriptions issued by licensed veterinarians with dosage schedules and withholding periods.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="p-2 border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 rounded-[2px] transition-colors cursor-pointer self-start sm:self-auto"
          title="Refresh Treatments"
          aria-label="Refresh Treatments"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* 2. Statutory Antibiotic Stewardship Notice */}
      <div className="bg-stone-100 border border-stone-300 p-3.5 rounded-[2px] shadow-xs flex items-start gap-3">
        <Shield size={18} className="text-[#102A43] shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-bold text-[#102A43] font-sans">
            Veterinary Prescription Statutory Notice &middot; आवश्यक निर्देश:
          </p>
          <p className="text-stone-700 mt-0.5">
            Administer medicines strictly as prescribed by your Veterinary Officer. Never reduce the course duration prematurely to prevent antimicrobial resistance (AMR). Observe milk withholding periods where advised.
          </p>
        </div>
      </div>

      {/* 3. Filter Tabs */}
      <div className="flex items-center gap-2 font-mono text-xs">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-[2px] font-bold border transition-colors cursor-pointer ${
            filter === 'all'
              ? 'bg-[#102A43] text-white border-[#102A43]'
              : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
          }`}
        >
          All Prescriptions ({treatments.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('active')}
          className={`px-3 py-1.5 rounded-[2px] font-bold border transition-colors cursor-pointer ${
            filter === 'active'
              ? 'bg-[#2E7D32] text-white border-[#2E7D32]'
              : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
          }`}
        >
          Active Regimens ({treatments.filter((t) => !t.end_date || t.end_date >= todayStr).length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('completed')}
          className={`px-3 py-1.5 rounded-[2px] font-bold border transition-colors cursor-pointer ${
            filter === 'completed'
              ? 'bg-stone-600 text-white border-stone-600'
              : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
          }`}
        >
          Completed Courses
        </button>
      </div>

      {/* 4. Treatment Cards */}
      {loading ? (
        <div className="p-8 text-center text-xs text-stone-500 bg-white border border-stone-300">
          Loading treatment records...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-stone-300 p-8 rounded-[2px] text-center space-y-2">
          <Pill size={24} className="text-stone-400 mx-auto" />
          <h3 className="text-sm font-bold text-[#102A43]">No Treatment Records Found</h3>
          <p className="text-xs text-stone-500">
            No clinical prescriptions matching this filter have been logged.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((trt) => {
            const isActive = !trt.end_date || trt.end_date >= todayStr

            return (
              <div
                key={trt.id}
                className="bg-white border border-stone-300 rounded-[2px] p-4 shadow-xs space-y-3"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Tag size={13} className="text-[#1B5E3C]" />
                    <span className="font-mono font-bold text-xs text-[#102A43]">
                      {trt.animal?.animal_tag || 'Animal'}
                    </span>
                    <span className="text-[10px] font-mono bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded">
                      {trt.animal?.animal_type || 'Livestock'} ({trt.animal?.breed || 'Indigenous'})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-[1px] border ${
                      isActive
                        ? 'bg-[#EBF5EE] text-[#1B5E3C] border-[#2E7D32]/30'
                        : 'bg-stone-100 text-stone-600 border-stone-200'
                    }`}>
                      {isActive ? 'ACTIVE COURSE' : 'COURSE COMPLETED'}
                    </span>
                    <span className="text-[10px] font-mono text-stone-500">
                      {trt.start_date} &rarr; {trt.end_date || 'Ongoing'}
                    </span>
                  </div>
                </div>

                {/* Condition & Medicine */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-stone-500 block text-[11px] font-mono uppercase">
                      DIAGNOSED CLINICAL CONDITION:
                    </span>
                    <p className="font-bold text-[#102A43] mt-0.5 font-sans">
                      {trt.condition}
                    </p>
                  </div>

                  <div>
                    <span className="text-stone-500 block text-[11px] font-mono uppercase">
                      PRESCRIBED MEDICINES:
                    </span>
                    <p className="font-bold text-[#1B5E3C] mt-0.5 font-sans">
                      {trt.medicine}
                    </p>
                  </div>

                  {trt.dosage && (
                    <div className="md:col-span-2">
                      <span className="text-stone-500 block text-[11px] font-mono uppercase">
                        DOSAGE &amp; FREQUENCY:
                      </span>
                      <p className="font-mono font-semibold text-stone-800 mt-0.5">
                        {trt.dosage}
                      </p>
                    </div>
                  )}

                  {trt.notes && (
                    <div className="md:col-span-2 bg-stone-50 p-2.5 rounded-[2px] border border-stone-200">
                      <span className="text-stone-600 font-bold block text-[11px]">
                        Care Instructions &amp; Dietary Restrictions:
                      </span>
                      <p className="text-stone-700 mt-0.5">
                        {trt.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                  <div className="text-stone-500">
                    Prescribing Doctor: <strong className="text-stone-800">{trt.veterinarian_name || 'Veterinary Officer'}</strong>
                  </div>
                  <Link
                    to={`/farmer/animals/${trt.animal_id}`}
                    className="text-[#1B5E3C] hover:underline font-bold flex items-center gap-1 self-start sm:self-auto"
                  >
                    <span>ANIMAL PASSPORT</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
