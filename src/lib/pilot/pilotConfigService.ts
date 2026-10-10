/**
 * PASHURAKSHA — LIVESTOCK HEALTH SURVEILLANCE PLATFORM
 * Stage 12: Pilot Configuration Service
 * "Detect Early. Prevent Outbreaks. Protect Livestock."
 */

import type { PilotConfiguration, PilotFeatureFlags, PilotPhase } from './pilotTypes'

const PILOT_CONFIG_STORAGE_KEY = 'pashuraksha_pilot_config_v1'

export const DEFAULT_PILOT_CONFIG: PilotConfiguration = {
  id: 'PILOT-UP-VARANASI-2026',
  name: 'Varanasi District Livestock Surveillance Controlled Pilot',
  codeName: 'Project PashuRaksha Field Phase I',
  targetGeography: {
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    blocks: ['Kashi Vidyapeeth', 'Harhua', 'Chiraigaon'],
    villages: ['Rampur Khurd', 'Shivpur', 'Chiraigaon Khurd', 'Badalalpur', 'Lohta'],
    primaryCentroid: {
      latitude: 25.3176,
      longitude: 82.9739,
      districtName: 'Varanasi District Centroid'
    }
  },
  startDate: '2026-10-15',
  endDate: '2026-12-15',
  phase: 'controlled_pilot',
  participants: [
    {
      id: 'PF-001',
      name: 'Ramesh Yadav',
      role: 'farmer',
      villageOrBlock: 'Rampur Khurd (Kashi Vidyapeeth)',
      contactMasked: '+91 98765-XXXX1',
      isTestPersona: true,
      assignedAnimalCount: 6
    },
    {
      id: 'PF-002',
      name: 'Sita Devi',
      role: 'farmer',
      villageOrBlock: 'Shivpur (Harhua)',
      contactMasked: '+91 98765-XXXX2',
      isTestPersona: true,
      assignedAnimalCount: 4
    },
    {
      id: 'PF-003',
      name: 'Harish Patel',
      role: 'farmer',
      villageOrBlock: 'Chiraigaon Khurd',
      contactMasked: '+91 98765-XXXX3',
      isTestPersona: true,
      assignedAnimalCount: 8
    },
    {
      id: 'PV-001',
      name: 'Dr. Rajesh Sharma',
      role: 'veterinarian',
      villageOrBlock: 'Kashi Vidyapeeth Veterinary Hospital',
      contactMasked: '+91 94150-XXXX4',
      isTestPersona: true,
      qualification: 'B.V.Sc & A.H., Reg: UPVC-2014-8842'
    },
    {
      id: 'PV-002',
      name: 'Dr. Sunita Verma',
      role: 'veterinarian',
      villageOrBlock: 'Harhua Mobile Veterinary Unit',
      contactMasked: '+91 94150-XXXX5',
      isTestPersona: true,
      qualification: 'M.V.Sc (Veterinary Medicine), Reg: UPVC-2018-9120'
    },
    {
      id: 'PA-001',
      name: 'Dr. A.K. Srivastava',
      role: 'admin',
      villageOrBlock: 'Office of Chief Veterinary Officer (CVO), Varanasi',
      contactMasked: '+91 94500-XXXX9',
      isTestPersona: true,
      qualification: 'CVO & District Surveillance Nodal Officer'
    }
  ],
  flags: {
    offlineVoiceReporting: true,
    iotSimulatorStream: true,
    emergencyAutoEscalation: true,
    privacyCentroidMasking: true,
    strictAuditLogging: true,
    networkThrottleSimulation: false,
    syntheticDataIsolation: true
  },
  isolationTag: 'PILOT_VARANASI_OCT2026',
  maxConcurrentHousholds: 150,
  targetSpecies: ['Cattle (Bovine)', 'Buffalo (Bubalus)', 'Goat (Caprine)', 'Sheep (Ovine)']
}

class PilotConfigService {
  private config: PilotConfiguration

  constructor() {
    this.config = this.loadConfig()
  }

  private loadConfig(): PilotConfiguration {
    try {
      const stored = localStorage.getItem(PILOT_CONFIG_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          ...DEFAULT_PILOT_CONFIG,
          ...parsed,
          targetGeography: {
            ...DEFAULT_PILOT_CONFIG.targetGeography,
            ...(parsed.targetGeography || {})
          },
          flags: {
            ...DEFAULT_PILOT_CONFIG.flags,
            ...(parsed.flags || {})
          }
        }
      }
    } catch {
      // Fallback to default
    }
    return DEFAULT_PILOT_CONFIG
  }

  public getConfig(): PilotConfiguration {
    return { ...this.config }
  }

  public updateFlags(newFlags: Partial<PilotFeatureFlags>): PilotConfiguration {
    this.config = {
      ...this.config,
      flags: {
        ...this.config.flags,
        ...newFlags
      }
    }
    this.saveConfig()
    return this.getConfig()
  }

  public setPhase(phase: PilotPhase): PilotConfiguration {
    this.config = {
      ...this.config,
      phase
    }
    this.saveConfig()
    return this.getConfig()
  }

  public updateGeography(geography: Partial<typeof DEFAULT_PILOT_CONFIG.targetGeography>): PilotConfiguration {
    this.config = {
      ...this.config,
      targetGeography: {
        ...this.config.targetGeography,
        ...geography
      }
    }
    this.saveConfig()
    return this.getConfig()
  }

  public resetToDefault(): PilotConfiguration {
    this.config = { ...DEFAULT_PILOT_CONFIG }
    this.saveConfig()
    return this.getConfig()
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(PILOT_CONFIG_STORAGE_KEY, JSON.stringify(this.config))
    } catch (e) {
      console.warn('Could not persist pilot configuration to localStorage', e)
    }
  }

  /**
   * Helper to verify if an incoming record belongs to the pilot dataset
   */
  public isPilotRecord(record: { is_pilot?: boolean; pilot_tag?: string }): boolean {
    return Boolean(record.is_pilot || (record.pilot_tag && record.pilot_tag.includes(this.config.isolationTag)))
  }
}

export const pilotConfigService = new PilotConfigService()
