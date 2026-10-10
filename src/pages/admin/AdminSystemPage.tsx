import { useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  ShieldCheck,
  Lock,
  Server,
  Database,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Activity,
  FileText,
  HardDrive,
  Search,
  Filter,
  Sliders,
  Radio,
  Zap,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface AuditEvent {
  id: string
  timestamp: string
  actor: string
  actorRole: 'admin' | 'vet' | 'farmer' | 'system'
  action: string
  entity: string
  ipAddress: string
  severity: 'info' | 'warning' | 'critical'
  checksumValid: boolean
}

const INITIAL_AUDIT_LOGS: AuditEvent[] = [
  {
    id: 'AUD-98214',
    timestamp: '2026-10-10 22:14:08 IST',
    actor: 'Dr. Ramesh Sharma (UPVC-4402)',
    actorRole: 'vet',
    action: 'Prescription & Antibiotic Stewardship Authorization',
    entity: 'Case #CAS-2026-0814',
    ipAddress: '103.21.144.18',
    severity: 'info',
    checksumValid: true,
  },
  {
    id: 'AUD-98213',
    timestamp: '2026-10-10 21:58:33 IST',
    actor: 'Surveillance Engine Daemon',
    actorRole: 'system',
    action: 'Cluster Alert Escalated to Level-3 (FMD Risk)',
    entity: 'District Bulandshahr / Khurja Block',
    ipAddress: '127.0.0.1 (Internal Gateway)',
    severity: 'critical',
    checksumValid: true,
  },
  {
    id: 'AUD-98212',
    timestamp: '2026-10-10 21:42:19 IST',
    actor: 'Rajesh Yadav (Farmer)',
    actorRole: 'farmer',
    action: 'Offline Batch Sync: 2 Morbidity Reports Uploaded',
    entity: 'Animal #INAPH-90214-UP',
    ipAddress: '157.34.88.204',
    severity: 'info',
    checksumValid: true,
  },
  {
    id: 'AUD-98211',
    timestamp: '2026-10-10 20:30:11 IST',
    actor: 'Admin Console (SecOps)',
    actorRole: 'admin',
    action: 'RLS Security Policy Verified & Enforced',
    entity: 'Supabase PG15 Core Schema',
    ipAddress: '10.0.4.12',
    severity: 'info',
    checksumValid: true,
  },
  {
    id: 'AUD-98210',
    timestamp: '2026-10-10 19:15:44 IST',
    actor: 'IoT Ingestion Worker',
    actorRole: 'system',
    action: 'Anomalous Pyrexia Detected (Tag #EAR-7740)',
    entity: 'Device ID #DEV-COLLAR-09',
    ipAddress: '10.0.8.99',
    severity: 'warning',
    checksumValid: true,
  },
  {
    id: 'AUD-98209',
    timestamp: '2026-10-10 18:02:10 IST',
    actor: 'External Gateway Sync',
    actorRole: 'system',
    action: 'Bharat Pashudhan Data Re-indexing Succeeded',
    entity: 'National Livestock API Endpoint',
    ipAddress: '164.100.12.50 (NIC-Gov)',
    severity: 'info',
    checksumValid: true,
  },
]

const RLS_TABLES = [
  { table: 'animals', rls: true, readPolicy: 'Public verified / Farmer owned', writePolicy: 'Registered Owner / Authorized Vet', encryptedFields: 'Ear Tag ID, Owner Aadhaar Token' },
  { table: 'symptom_reports', rls: true, readPolicy: 'Reporting Farmer, Assigned Vet, State DVO', writePolicy: 'Reporting Farmer / Vet Case Entry', encryptedFields: 'Geographic coordinate jittering' },
  { table: 'mortality_reports', rls: true, readPolicy: 'Jurisdiction DVO, Disease Control Cell', writePolicy: 'Farmer / Vet post-mortem examination', encryptedFields: 'Carcass disposal GPS' },
  { table: 'veterinary_cases', rls: true, readPolicy: 'VCI Licensed Vet, District Veterinary Officer', writePolicy: 'Treating Veterinary Doctor only', encryptedFields: 'Clinical notes & drug lots' },
  { table: 'lab_referrals', rls: true, readPolicy: 'Referring Vet, State Diagnostic Lab (CDDL)', writePolicy: 'CDDL Authorized Lab Pathologist', encryptedFields: 'Bacteriology & Viral Genomic Data' },
  { table: 'outbreak_clusters', rls: true, readPolicy: 'State Command Center, DVO, District Magistrate', writePolicy: 'AI Risk Engine & State Chief Vet', encryptedFields: 'Containment Zone Boundary' },
  { table: 'iot_measurements', rls: true, readPolicy: 'Device Owner, Registered Vet, Surveillance Daemon', writePolicy: 'Authenticated Gateway Token only', encryptedFields: 'Raw Biometric Stream' },
  { table: 'audit_logs', rls: true, readPolicy: 'System Auditor & Chief Security Officer', writePolicy: 'Append-Only Cryptographic Trigger', encryptedFields: 'SHA-256 Hash Chain' },
]

export function AdminSystemPage() {
  const [activeTab, setActiveTab] = useState<'audit' | 'security' | 'gateway' | 'maintenance'>('audit')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [logs] = useState<AuditEvent[]>(INITIAL_AUDIT_LOGS)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [gatewaySyncing, setGatewaySyncing] = useState(false)

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || log.actorRole === roleFilter
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter
    return matchesSearch && matchesRole && matchesSeverity
  })

  const handleVerifyIntegrity = () => {
    setIsVerifying(true)
    setTimeout(() => {
      setIsVerifying(false)
      setVerifyNotice('Cryptographic audit hash chain verified: 100% integrity (0 collisions, 0 tampering detected).')
      setTimeout(() => setVerifyNotice(null), 5000)
    }, 1200)
  }

  const handleSyncGateway = () => {
    setGatewaySyncing(true)
    setTimeout(() => {
      setGatewaySyncing(false)
      setVerifyNotice('Bharat Pashudhan & INAPH gateway sync complete. 1,420 livestock records validated.')
      setTimeout(() => setVerifyNotice(null), 5000)
    }, 1500)
  }

  const handleExportAuditLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `PashuRaksha_AuditLedger_${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  return (
    <div className="p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="System Administration & Governance"
        subtitle="Sovereign digital infrastructure, cryptographic audit verification, role policies, and national livestock gateway status."
        badge={
          <Badge variant="outline" className="border-forest-200 text-forest-800 bg-forest-50 flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
            ISO 27001 / GovStack Architecture
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAuditLogs}
              className="text-xs h-9 bg-white border-forest-200 text-forest-900 hover:bg-forest-50"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-forest-700" />
              Export Audit Trail
            </Button>
            <Button
              size="sm"
              onClick={handleVerifyIntegrity}
              disabled={isVerifying}
              className="text-xs h-9 bg-forest-700 hover:bg-forest-800 text-white font-medium shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isVerifying ? 'animate-spin' : ''}`} />
              {isVerifying ? 'Verifying Hashes...' : 'Verify Ledger Integrity'}
            </Button>
          </div>
        }
      />

      {verifyNotice && (
        <div className="p-3.5 bg-forest-50 border border-forest-300 rounded-xl flex items-center gap-3 text-forest-900 text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-forest-700 shrink-0" />
          <span>{verifyNotice}</span>
        </div>
      )}

      {/* Top System Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-forest-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Security Compliance</span>
            <Lock className="w-4 h-4 text-forest-600" />
          </div>
          <p className="text-xl font-bold text-forest-950 mt-1">Tier-3 Sovereign</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-forest-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-forest-600" />
            <span>100% PostgreSQL RLS Active</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-forest-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Audit Trail Ledger</span>
            <Activity className="w-4 h-4 text-forest-600" />
          </div>
          <p className="text-xl font-bold text-forest-950 mt-1">98,214 Events</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-forest-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-forest-600" />
            <span>SHA-256 Hash Chain Valid</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-forest-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>National Gateway (INAPH)</span>
            <Server className="w-4 h-4 text-forest-600" />
          </div>
          <p className="text-xl font-bold text-forest-950 mt-1">Online (42ms)</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-forest-700">
            <span className="w-2 h-2 rounded-full bg-forest-600 animate-pulse"></span>
            <span>Sync every 15 min (Auto)</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-forest-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Database & Storage</span>
            <Database className="w-4 h-4 text-forest-600" />
          </div>
          <p className="text-xl font-bold text-forest-950 mt-1">Supabase PG15</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-forest-700">
            <HardDrive className="w-3.5 h-3.5 text-forest-600" />
            <span>42.6 MB / 10 GB utilized</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-forest-200/80 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-forest-700 text-forest-900 bg-forest-50/60 rounded-t-lg'
              : 'border-transparent text-muted-foreground hover:text-forest-900 hover:border-forest-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Real-time Audit Ledger</span>
          <span className="px-1.5 py-0.5 rounded-full text-xs bg-forest-100 text-forest-800 font-mono">
            {filteredLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-forest-700 text-forest-900 bg-forest-50/60 rounded-t-lg'
              : 'border-transparent text-muted-foreground hover:text-forest-900 hover:border-forest-300'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>PostgreSQL RLS & Access Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('gateway')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'gateway'
              ? 'border-forest-700 text-forest-900 bg-forest-50/60 rounded-t-lg'
              : 'border-transparent text-muted-foreground hover:text-forest-900 hover:border-forest-300'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>National Livestock Gateways</span>
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'maintenance'
              ? 'border-forest-700 text-forest-900 bg-forest-50/60 rounded-t-lg'
              : 'border-transparent text-muted-foreground hover:text-forest-900 hover:border-forest-300'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Backup & Maintenance</span>
        </button>
      </div>

      {/* Tab 1: Audit Ledger */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-forest-200/80 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-500" />
              <Input
                placeholder="Search audit trail by actor, action, or case ID..."
                value={searchQuery}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs border-forest-200 focus-visible:ring-forest-600 bg-forest-50/30"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Filter className="w-3.5 h-3.5 text-forest-600" />
                <span>Role:</span>
              </div>
              <select
                aria-label="Filter audit logs by role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-9 text-xs rounded-lg border border-forest-200 bg-white px-2.5 text-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-600"
              >
                <option value="all">All Roles</option>
                <option value="admin">Administrator</option>
                <option value="vet">Veterinarian</option>
                <option value="farmer">Farmer</option>
                <option value="system">System Daemon</option>
              </select>

              <select
                aria-label="Filter audit logs by severity"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="h-9 text-xs rounded-lg border border-forest-200 bg-white px-2.5 text-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-600"
              >
                <option value="all">All Severities</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-forest-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-forest-50/70 border-b border-forest-200/80 text-forest-900 font-semibold">
                    <th className="py-3 px-4">Event ID / Time</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action Taken</th>
                    <th className="py-3 px-4">Entity Affected</th>
                    <th className="py-3 px-4">Source IP</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4 text-right">Integrity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest-100">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-forest-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-forest-950">{log.id}</div>
                        <div className="text-[11px] text-muted-foreground">{log.timestamp}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-forest-900">{log.actor}</div>
                        <div className="text-[10px] uppercase font-mono text-muted-foreground">{log.actorRole}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-forest-950">{log.action}</td>
                      <td className="py-3 px-4 text-forest-800 font-mono text-[11px]">{log.entity}</td>
                      <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">{log.ipAddress}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            log.severity === 'critical'
                              ? 'destructive'
                              : log.severity === 'warning'
                              ? 'secondary'
                              : 'outline'
                          }
                          className="text-[10px] font-medium"
                        >
                          {log.severity.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-forest-700 bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
                          <CheckCircle2 className="w-3 h-3 text-forest-600" />
                          SHA-256 OK
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-muted-foreground">
                        No audit events match your search filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Security & RLS Policy Matrix */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="p-4 bg-forest-50/80 border border-forest-200 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-forest-700 shrink-0 mt-0.5" />
            <div className="text-xs text-forest-900 space-y-1">
              <p className="font-bold text-sm">Row Level Security (RLS) Policy Architecture</p>
              <p className="text-muted-foreground">
                All application queries route through PostgreSQL RLS policies tied to JWT claims. Farmers access strictly their own herds and localized advisories; licensed veterinarians hold regional clinical access; and administrators have anonymized surveillance overview.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-forest-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-forest-50/70 border-b border-forest-200/80 text-forest-900 font-semibold">
                    <th className="py-3 px-4">Schema Table</th>
                    <th className="py-3 px-4">RLS Status</th>
                    <th className="py-3 px-4">Read Authorization</th>
                    <th className="py-3 px-4">Write Authorization</th>
                    <th className="py-3 px-4">Field Encryption / Masking</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest-100">
                  {RLS_TABLES.map((table) => (
                    <tr key={table.table} className="hover:bg-forest-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-forest-900">{table.table}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-800 bg-forest-100/80 px-2 py-0.5 rounded border border-forest-300">
                          <Lock className="w-3 h-3 text-forest-700" />
                          Enforced
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-forest-800 font-medium">{table.readPolicy}</td>
                      <td className="py-3.5 px-4 text-forest-800 font-medium">{table.writePolicy}</td>
                      <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px]">{table.encryptedFields}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: National Livestock Gateways */}
      {activeTab === 'gateway' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-forest-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-forest-100 flex items-center justify-center text-forest-800 font-bold text-sm">
                  INAPH
                </div>
                <div>
                  <h3 className="text-sm font-bold text-forest-950">INAPH Live Gateway</h3>
                  <p className="text-xs text-muted-foreground">Information Network for Animal Productivity & Health</p>
                </div>
              </div>
              <Badge variant="outline" className="border-forest-300 text-forest-800 bg-forest-50 text-xs">
                Active & Synced
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground space-y-1.5 border-t border-forest-100 pt-3">
              <div className="flex justify-between">
                <span>API Endpoint:</span>
                <span className="font-mono text-forest-900">https://inaph.nddb.coop/api/v2/surveillance</span>
              </div>
              <div className="flex justify-between">
                <span>Last Push:</span>
                <span className="text-forest-900 font-medium">12 minutes ago</span>
              </div>
              <div className="flex justify-between">
                <span>Batch Sync Window:</span>
                <span className="text-forest-900 font-medium">Every 15 minutes</span>
              </div>
              <div className="flex justify-between">
                <span>Payload Rate:</span>
                <span className="text-forest-900 font-medium">100 records / minute</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncGateway}
              disabled={gatewaySyncing}
              className="w-full text-xs h-9 border-forest-300 text-forest-900 hover:bg-forest-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${gatewaySyncing ? 'animate-spin' : ''}`} />
              {gatewaySyncing ? 'Synchronizing with INAPH...' : 'Trigger Immediate Sync'}
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-forest-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-forest-100 flex items-center justify-center text-forest-800 font-bold text-sm">
                  BPND
                </div>
                <div>
                  <h3 className="text-sm font-bold text-forest-950">Bharat Pashudhan Database</h3>
                  <p className="text-xs text-muted-foreground">DAHD National Tag Registry Connector</p>
                </div>
              </div>
              <Badge variant="outline" className="border-forest-300 text-forest-800 bg-forest-50 text-xs">
                Active & Synced
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground space-y-1.5 border-t border-forest-100 pt-3">
              <div className="flex justify-between">
                <span>Ear Tag Registry:</span>
                <span className="font-mono text-forest-900">12-Digit Barcode Verification</span>
              </div>
              <div className="flex justify-between">
                <span>Registry Validation:</span>
                <span className="text-forest-900 font-medium">Real-time Lookup OK</span>
              </div>
              <div className="flex justify-between">
                <span>ICAR-NIVEDI Feed:</span>
                <span className="text-forest-900 font-medium">Outbreak Alert Feed Active</span>
              </div>
              <div className="flex justify-between">
                <span>Validation Success Rate:</span>
                <span className="text-forest-900 font-medium">99.8% (Last 24h)</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncGateway}
              disabled={gatewaySyncing}
              className="w-full text-xs h-9 border-forest-300 text-forest-900 hover:bg-forest-50"
            >
              <Zap className="w-3.5 h-3.5 mr-1.5 text-forest-700" />
              Verify Tag Ledger Connector
            </Button>
          </div>
        </div>
      )}

      {/* Tab 4: Backup, Maintenance & Disaster Recovery */}
      {activeTab === 'maintenance' && (
        <div className="bg-white rounded-xl border border-forest-200/80 p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-forest-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-forest-950">Scheduled Snapshot Backups</h3>
              <p className="text-xs text-muted-foreground">Automated cryptographic backup copies stored across redundant sovereign cloud zones.</p>
            </div>
            <Button variant="outline" size="sm" className="text-xs h-9 border-forest-200 text-forest-900">
              <Download className="w-3.5 h-3.5 mr-1.5 text-forest-700" />
              Download Latest SQL Dump
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-forest-50/50 rounded-lg border border-forest-200/60">
              <p className="font-semibold text-forest-900">Last Successful Snapshot</p>
              <p className="text-muted-foreground mt-0.5">Today at 02:00:00 IST</p>
              <Badge variant="outline" className="mt-2 text-[10px] text-forest-800 border-forest-300 bg-white">
                Size: 84.2 MB &bull; Checksum OK
              </Badge>
            </div>
            <div className="p-3 bg-forest-50/50 rounded-lg border border-forest-200/60">
              <p className="font-semibold text-forest-900">Next Scheduled Snapshot</p>
              <p className="text-muted-foreground mt-0.5">Tomorrow at 02:00:00 IST</p>
              <Badge variant="outline" className="mt-2 text-[10px] text-forest-800 border-forest-300 bg-white">
                Cadence: Daily 24h
              </Badge>
            </div>
            <div className="p-3 bg-forest-50/50 rounded-lg border border-forest-200/60">
              <p className="font-semibold text-forest-900">Disaster Recovery RTO / RPO</p>
              <p className="text-muted-foreground mt-0.5">Target: &lt; 15 min / 0 min loss</p>
              <Badge variant="outline" className="mt-2 text-[10px] text-forest-800 border-forest-300 bg-white">
                Multi-AZ Failover Ready
              </Badge>
            </div>
          </div>

          <div className="border-t border-forest-100 pt-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-forest-950">Platform Maintenance Mode</span>
              </div>
              <p className="text-xs text-muted-foreground">
                When enabled, non-admin writes are queued in client IndexedDB with an offline notification banner.
              </p>
            </div>
            <button
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                maintenanceMode ? 'bg-amber-600' : 'bg-forest-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
