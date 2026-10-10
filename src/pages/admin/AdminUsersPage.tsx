/**
 * PASHURAKSHA (पशुरक्षा) — VETERINARY CADRE & PERSONNEL DIRECTORY
 * Route: /admin/users
 * "Detect Early. Prevent Outbreaks. Protect Livestock."
 */

import { useState } from 'react'
import {
  UserCheck, MapPin, Search, Filter,
  Phone, Plus, CheckCircle2, Award, Briefcase, FileBadge
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'

interface VetPersonnel {
  id: string
  name: string
  vciRegistrationNumber: string
  qualification: string
  cadreRole: 'Veterinary Officer' | 'Mobile Unit Lead' | 'Surveillance Officer' | 'Para-Veterinarian'
  district: string
  block: string
  facilityName: string
  assignedMvuVehicle?: string
  contactNumber: string
  activeCasesCount: number
  status: 'ACTIVE_DUTY' | 'ON_FIELD_VISIT' | 'OFFLINE'
  verifiedByVci: boolean
}

const DEFAULT_CADRE_LIST: VetPersonnel[] = [
  {
    id: 'VO-VAR-001',
    name: 'Dr. Rajesh Sharma',
    vciRegistrationNumber: 'UPVC-2014-8842',
    qualification: 'B.V.Sc & A.H. (IVRI Bareilly)',
    cadreRole: 'Veterinary Officer',
    district: 'Varanasi',
    block: 'Kashi Vidyapeeth',
    facilityName: 'Kashi Vidyapeeth Veterinary Hospital',
    contactNumber: '+91 94150-12842',
    activeCasesCount: 4,
    status: 'ACTIVE_DUTY',
    verifiedByVci: true
  },
  {
    id: 'VO-VAR-002',
    name: 'Dr. Sunita Verma',
    vciRegistrationNumber: 'UPVC-2018-9120',
    qualification: 'M.V.Sc (Veterinary Medicine, BHU)',
    cadreRole: 'Mobile Unit Lead',
    district: 'Varanasi',
    block: 'Harhua',
    facilityName: 'Harhua Mobile Veterinary Unit (MVU-04)',
    assignedMvuVehicle: 'UP-65-BV-4412',
    contactNumber: '+91 94150-39120',
    activeCasesCount: 6,
    status: 'ON_FIELD_VISIT',
    verifiedByVci: true
  },
  {
    id: 'VO-VAR-003',
    name: 'Dr. Manoj Tiwari',
    vciRegistrationNumber: 'UPVC-2016-7731',
    qualification: 'B.V.Sc & A.H.',
    cadreRole: 'Veterinary Officer',
    district: 'Varanasi',
    block: 'Chiraigaon',
    facilityName: 'Chiraigaon Government Veterinary Hospital',
    contactNumber: '+91 94500-27731',
    activeCasesCount: 2,
    status: 'ACTIVE_DUTY',
    verifiedByVci: true
  },
  {
    id: 'VO-VAR-004',
    name: 'Dr. Neha Srivastava',
    vciRegistrationNumber: 'UPVC-2020-1045',
    qualification: 'M.V.Sc (Veterinary Epidemiology)',
    cadreRole: 'Surveillance Officer',
    district: 'Varanasi',
    block: 'Headquarters',
    facilityName: 'District Disease Investigation Lab (ADIL)',
    contactNumber: '+91 94500-11045',
    activeCasesCount: 8,
    status: 'ACTIVE_DUTY',
    verifiedByVci: true
  },
  {
    id: 'PV-VAR-005',
    name: 'Anil Kumar Singh',
    vciRegistrationNumber: 'LSS-UP-2019-332',
    qualification: 'Diploma in Veterinary Pharmacy / LSS',
    cadreRole: 'Para-Veterinarian',
    district: 'Varanasi',
    block: 'Kashi Vidyapeeth',
    facilityName: 'Rampur Khurd Sub-Centre',
    contactNumber: '+91 98380-45332',
    activeCasesCount: 1,
    status: 'ACTIVE_DUTY',
    verifiedByVci: true
  }
]

export function AdminUsersPage() {
  const [personnelList, setPersonnelList] = useState<VetPersonnel[]>(DEFAULT_CADRE_LIST)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBlock, setSelectedBlock] = useState('ALL')
  const [selectedRole, setSelectedRole] = useState('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newOfficerForm, setNewOfficerForm] = useState({
    name: '',
    vciRegistrationNumber: '',
    qualification: 'B.V.Sc & A.H.',
    cadreRole: 'Veterinary Officer' as VetPersonnel['cadreRole'],
    district: 'Varanasi',
    block: 'Kashi Vidyapeeth',
    facilityName: '',
    contactNumber: ''
  })

  const filteredPersonnel = personnelList.filter(p => {
    if (selectedBlock !== 'ALL' && p.block !== selectedBlock) return false
    if (selectedRole !== 'ALL' && p.cadreRole !== selectedRole) return false
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      return (
        p.name.toLowerCase().includes(q) ||
        p.vciRegistrationNumber.toLowerCase().includes(q) ||
        p.facilityName.toLowerCase().includes(q)
      )
    }
    return true
  })

  const handleAddOfficer = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOfficerForm.name || !newOfficerForm.vciRegistrationNumber) return

    const created: VetPersonnel = {
      id: `VO-VAR-${String(personnelList.length + 1).padStart(3, '0')}`,
      name: newOfficerForm.name,
      vciRegistrationNumber: newOfficerForm.vciRegistrationNumber,
      qualification: newOfficerForm.qualification,
      cadreRole: newOfficerForm.cadreRole,
      district: newOfficerForm.district,
      block: newOfficerForm.block,
      facilityName: newOfficerForm.facilityName || `${newOfficerForm.block} Veterinary Center`,
      contactNumber: newOfficerForm.contactNumber || '+91 94150-XXXXX',
      activeCasesCount: 0,
      status: 'ACTIVE_DUTY',
      verifiedByVci: true
    }

    setPersonnelList([created, ...personnelList])
    setShowAddModal(false)
    setNewOfficerForm({
      name: '',
      vciRegistrationNumber: '',
      qualification: 'B.V.Sc & A.H.',
      cadreRole: 'Veterinary Officer',
      district: 'Varanasi',
      block: 'Kashi Vidyapeeth',
      facilityName: '',
      contactNumber: ''
    })
  }

  return (
    <div className="p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* ─── Page Header ────────────────────────────────────────── */}
      <PageHeader
        title="पशुचिकित्सा कैडर एवं फील्ड कार्मिक निर्देशिका"
        subtitle="Veterinary Council of India (VCI) licensure verification, Mobile Veterinary Unit deployments, and jurisdiction authority mapping across district blocks."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Veterinary Workforce', href: '/admin/users' }
        ]}
        actions={
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded bg-[#1B5E3C] hover:bg-[#123C2A] text-white font-bold text-xs shadow-xs cursor-pointer tracking-wider uppercase"
          >
            <Plus size={14} />
            <span>+ Add Veterinary Officer</span>
          </button>
        }
      />

      {/* ─── Top Cadre Metric Cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Total Registered Cadre
            </span>
            <div className="text-2xl font-black text-[#123C2A] mt-1">
              {personnelList.length} Officers
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
              <CheckCircle2 size={12} />
              100% VCI Licensure Verified
            </div>
          </div>
          <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#1B5E3C]">
            <Award size={22} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Mobile Units (MVUs)
            </span>
            <div className="text-2xl font-black text-gray-900 mt-1">
              1 Active Unit
            </div>
            <div className="text-[11px] text-gray-600 font-medium mt-0.5">
              Harhua Jurisdiction (UP-65-BV-4412)
            </div>
          </div>
          <div className="w-11 h-11 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
            <Briefcase size={22} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Active On Field Duty
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {personnelList.filter(p => p.status === 'ACTIVE_DUTY' || p.status === 'ON_FIELD_VISIT').length} On Duty
            </div>
            <div className="text-[11px] text-gray-600 font-medium mt-0.5">
              Coverage across 3 blocks
            </div>
          </div>
          <div className="w-11 h-11 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <UserCheck size={22} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Active Clinical Cases
            </span>
            <div className="text-2xl font-black text-[#102A43] mt-1">
              {personnelList.reduce((acc, p) => acc + p.activeCasesCount, 0)} Cases
            </div>
            <div className="text-[11px] text-gray-600 font-medium mt-0.5">
              Under Active Field Investigation
            </div>
          </div>
          <div className="w-11 h-11 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
            <FileBadge size={22} />
          </div>
        </div>
      </div>

      {/* ─── Search & Filter Toolbar ────────────────────────────── */}
      <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs w-full sm:w-auto">
          <div className="relative min-w-[240px]">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, VCI number, facility..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-[#1B5E3C]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-semibold flex items-center gap-1">
              <Filter size={12} /> Block:
            </span>
            <select
              value={selectedBlock}
              onChange={e => setSelectedBlock(e.target.value)}
              className="px-2 py-1.5 border border-gray-300 rounded text-xs bg-white"
            >
              <option value="ALL">All Blocks</option>
              <option value="Kashi Vidyapeeth">Kashi Vidyapeeth</option>
              <option value="Harhua">Harhua</option>
              <option value="Chiraigaon">Chiraigaon</option>
              <option value="Headquarters">Headquarters</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-semibold">Role:</span>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              className="px-2 py-1.5 border border-gray-300 rounded text-xs bg-white"
            >
              <option value="ALL">All Roles</option>
              <option value="Veterinary Officer">Veterinary Officer</option>
              <option value="Mobile Unit Lead">Mobile Unit Lead</option>
              <option value="Surveillance Officer">Surveillance Officer</option>
              <option value="Para-Veterinarian">Para-Veterinarian</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-mono text-gray-500">
          Showing {filteredPersonnel.length} of {personnelList.length} officers
        </div>
      </div>

      {/* ─── Personnel Table ─────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
        {filteredPersonnel.length === 0 ? (
          <EmptyState
            title="No Veterinary Officers Found"
            description="No officers matched your current search criteria. Try clearing search filters."
            action={{
              label: 'Clear Filters',
              onClick: () => { setSearchTerm(''); setSelectedBlock('ALL'); setSelectedRole('ALL') }
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                  <th className="py-3 px-3.5">Officer & Qualification</th>
                  <th className="py-3 px-3">VCI Registration</th>
                  <th className="py-3 px-3">Cadre Role</th>
                  <th className="py-3 px-3">Facility / Jurisdiction</th>
                  <th className="py-3 px-3">Active Cases</th>
                  <th className="py-3 px-3">Duty Status</th>
                  <th className="py-3 px-3.5 text-right">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {filteredPersonnel.map(person => (
                  <tr key={person.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-gray-900 text-sm">
                        {person.name}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {person.qualification}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-emerald-800">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                        <span>{person.vciRegistrationNumber}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200 uppercase">
                        {person.cadreRole}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-gray-700">
                      <div className="font-semibold text-gray-900">
                        {person.facilityName}
                      </div>
                      <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-gray-400" />
                        <span>{person.block}, {person.district}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-gray-800">
                      {person.activeCasesCount} active
                    </td>

                    <td className="py-3 px-3">
                      <span className={`
                        px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase
                        ${person.status === 'ACTIVE_DUTY' ? 'bg-emerald-100 text-emerald-800' : person.status === 'ON_FIELD_VISIT' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'}
                      `}>
                        {person.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-3.5 text-right font-mono text-gray-600">
                      <div className="inline-flex items-center gap-1.5 text-gray-700 font-semibold">
                        <Phone size={12} className="text-gray-400" />
                        <span>{person.contactNumber}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Modal: Add Veterinary Officer ──────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900">
                Register Licensed Veterinary Officer
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddOfficer} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Doctor / Officer Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ramesh Chandra"
                  value={newOfficerForm.name}
                  onChange={e => setNewOfficerForm({ ...newOfficerForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-[#1B5E3C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">VCI Registration Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UPVC-2022-XXXX"
                    value={newOfficerForm.vciRegistrationNumber}
                    onChange={e => setNewOfficerForm({ ...newOfficerForm, vciRegistrationNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Cadre Role</label>
                  <select
                    value={newOfficerForm.cadreRole}
                    onChange={e => setNewOfficerForm({ ...newOfficerForm, cadreRole: e.target.value as VetPersonnel['cadreRole'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs"
                  >
                    <option value="Veterinary Officer">Veterinary Officer</option>
                    <option value="Mobile Unit Lead">Mobile Unit Lead</option>
                    <option value="Surveillance Officer">Surveillance Officer</option>
                    <option value="Para-Veterinarian">Para-Veterinarian</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Assigned Block</label>
                  <select
                    value={newOfficerForm.block}
                    onChange={e => setNewOfficerForm({ ...newOfficerForm, block: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs"
                  >
                    <option value="Kashi Vidyapeeth">Kashi Vidyapeeth</option>
                    <option value="Harhua">Harhua</option>
                    <option value="Chiraigaon">Chiraigaon</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Contact Phone (+91)</label>
                  <input
                    type="text"
                    placeholder="+91 94150-XXXXX"
                    value={newOfficerForm.contactNumber}
                    onChange={e => setNewOfficerForm({ ...newOfficerForm, contactNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Hospital / Field Centre Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rohaniya Veterinary Hospital"
                  value={newOfficerForm.facilityName}
                  onChange={e => setNewOfficerForm({ ...newOfficerForm, facilityName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#1B5E3C] text-white font-bold hover:bg-[#123C2A] cursor-pointer"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
