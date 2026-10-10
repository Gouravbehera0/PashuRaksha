import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldAlert,
  RefreshCw
} from 'lucide-react'
import { OutbreakSurveillanceMap } from '@/components/maps/OutbreakSurveillanceMap'
import { getOutbreakClusters, runOutbreakDetectionPipeline } from '@/services/risk/outbreakEngine'
import { getVetCases } from '@/services/vetService'
import type { OutbreakCluster } from '@/services/risk/riskTypes'
import type { VeterinaryCase } from '@/types'

export function AdminRiskMapPage() {
  const [clusters, setClusters] = useState<OutbreakCluster[]>([])
  const [cases, setCases] = useState<VeterinaryCase[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Varanasi')

  const loadData = async () => {
    try {
      setLoading(true)
      const [clusterList, caseList] = await Promise.all([
        getOutbreakClusters(),
        getVetCases(),
      ])
      setClusters(clusterList)
      setCases(caseList)
      if (clusterList.length > 0 && !selectedClusterId) {
        setSelectedClusterId(clusterList[0].id)
      }
    } catch (err) {
      console.error('[AdminRiskMap] Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      const updated = await runOutbreakDetectionPipeline()
      setClusters(updated)
    } catch (err) {
      console.error('[AdminRiskMap] Refresh failed:', err)
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center font-mono text-xs text-stone-500">
        <RefreshCw className="animate-spin inline mr-2 text-[#1B5E3C]" size={16} />
        INITIALIZING GIS SURVEILLANCE FEED...
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-4 max-w-7xl mx-auto font-sans">
      {/* 1. Header Bar */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs border-l-4 border-l-[#102A43] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#102A43] text-[#F7F5EE] px-2 py-0.5 rounded-[1px]">
              GIS SURVEILLANCE COMMAND
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              NATIONAL EPIDEMIOLOGICAL GEO-SPATIAL DESK
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#102A43]">
            National Multi-Tier Epidemiological Risk Map &middot; राष्ट्रीय स्थानिक जोखिम मानचित्र
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            Geospatial case clustering &bull; 5km biosecurity buffer cordon &bull; veterinary dispensary network
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 bg-[#1B5E3C] hover:bg-[#123C2A] text-white text-xs font-mono font-bold rounded-[2px] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'UPDATING...' : 'REFRESH GIS FEEDS'}</span>
          </button>
        </div>
      </div>

      {/* 2. District Filter Bar & High-Level Counters */}
      <div className="bg-[#FAF9F5] border border-stone-300 p-3 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-stone-500 font-bold uppercase text-[11px]">GEOGRAPHIC CADRE:</span>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="bg-white border border-stone-300 px-2 py-1 text-xs rounded-[1px] font-mono focus:outline-[#102A43]"
          >
            <option value="Varanasi">Uttar Pradesh &mdash; Varanasi District (Active)</option>
            <option value="Mirzapur">Uttar Pradesh &mdash; Mirzapur District</option>
            <option value="Prayagraj">Uttar Pradesh &mdash; Prayagraj District</option>
            <option value="Chandauli">Uttar Pradesh &mdash; Chandauli District</option>
          </select>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <div>
            <span className="text-stone-500">DETECTED CLUSTERS: </span>
            <strong className="text-[#C62828] font-bold">{clusters.length}</strong>
          </div>
          <div>
            <span className="text-stone-500">ACTIVE CASES: </span>
            <strong className="text-[#102A43] font-bold">{cases.length}</strong>
          </div>
          <div>
            <span className="text-stone-500">DISPENSARIES: </span>
            <strong className="text-[#1B5E3C] font-bold">3</strong>
          </div>
        </div>
      </div>

      {/* 3. Main Grid: Map (8 cols) + Cluster Inspector Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map Canvas (8 cols) */}
        <div className="lg:col-span-8">
          <OutbreakSurveillanceMap
            clusters={clusters}
            cases={cases}
            selectedClusterId={selectedClusterId || undefined}
            onSelectCluster={(c) => setSelectedClusterId(c.id)}
            height="580px"
          />
        </div>

        {/* Cluster Inspector Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-stone-300 rounded-[2px] shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#102A43] flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-[#C62828]" />
                EPICENTER CLUSTER ROSTER
              </span>
              <span className="text-[10px] font-mono text-stone-500">
                ACTIVE ZONES
              </span>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {clusters.map((cluster) => {
                const isSelected = cluster.id === selectedClusterId
                const isCritical = cluster.risk_level === 'CRITICAL' || cluster.cluster_score >= 75

                return (
                  <div
                    key={cluster.id}
                    onClick={() => setSelectedClusterId(cluster.id)}
                    className={`p-3 rounded-[2px] border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#F7F5EE] border-[#102A43] ring-1 ring-[#102A43] border-l-4 border-l-[#C62828]'
                        : 'bg-white border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-xs text-[#102A43]">
                          {cluster.cluster_code}
                        </span>
                        <h4 className="font-bold text-xs text-stone-900 leading-snug mt-0.5">
                          {cluster.cluster_name}
                        </h4>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded text-white shrink-0 ${
                          isCritical ? 'bg-[#C62828]' : 'bg-[#D97706]'
                        }`}
                      >
                        {cluster.cluster_score}/100
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-600 mt-2 space-y-0.5 font-mono">
                      <div>&bull; Epicenter: <strong>{cluster.radius_km} km radius</strong></div>
                      <div>&bull; Villages: <strong>{cluster.affected_villages.join(', ')}</strong></div>
                      <div>&bull; Linked Cases: <strong>{cluster.case_count} cases</strong></div>
                      <div>&bull; Status: <strong className="text-[#102A43]">{cluster.status}</strong></div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-stone-200 flex items-center justify-between text-xs font-mono">
                      <span className="text-[10px] text-stone-400">
                        {cluster.reviewed_by ? 'Investigated' : 'Pending Review'}
                      </span>
                      <Link
                        to="/vet/outbreaks"
                        className="text-[#1B5E3C] hover:underline font-bold text-[11px]"
                      >
                        ACTION DESK &rarr;
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
