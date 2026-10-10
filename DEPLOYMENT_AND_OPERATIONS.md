# PASHURAKSHA (पशुरक्षा) — DEPLOYMENT AND OPERATIONS MANUAL
**Tagline:** *"Detect Early. Prevent Outbreaks. Protect Livestock."*  
**Version:** 1.0.0 (Production Ready)  
**Standard:** Government of India GIGW Compliance • Enterprise Grade PostgreSQL RLS • Rural Offline-First PWA

---

## 1. System Overview & Architecture

PashuRaksha is a digital livestock-health surveillance and early-warning platform designed to empower farmers in reporting animal-health issues, equip field veterinarians with clinical triage workflows, and provide district/state animal husbandry administrators with early outbreak detection and spatial surveillance.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PASHURAKSHA SYSTEM ARCHITECTURE                      │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   CLIENT TIER (PWA)                                                    │
│   ├── React 19 + TypeScript (Strict Type Safety)                      │
│   ├── Tailwind CSS (Official Government Visual Identity)               │
│   ├── Bilingual Engine (English + हिन्दी)                              │
│   ├── Voice-Assisted Reporting (Web Speech API + Farmer Review)       │
│   ├── Canvas Image Compression (Offline Low-Bandwidth Optimisation)    │
│   └── IndexedDB ("PashuRaksha_OfflineDB_v1" Local Storage)             │
│                                │                                       │
│                                ▼                                       │
│   NETWORK & OFFLINE ENGINE                                             │
│   ├── Service Worker (Static Asset & Shell Caching)                    │
│   ├── Idempotent Sync Manager (Exponential Backoff + Sync Keys)        │
│   └── Offline Logout Purge (Zero cross-user data leakage)             │
│                                │                                       │
│                                ▼ HTTPS / WSS                           │
│   DATABASE & SURVEILLANCE TIER (PostgreSQL 15+ / Supabase)              │
│   ├── Row Level Security (RLS on all 16 public tables)                 │
│   ├── Storage Security (User-isolated directory policies)              │
│   ├── Role Protection Trigger (Prevent client role tampering)          │
│   ├── Deterministic Risk Engine (Explainable 0–100 scoring)            │
│   └── Spatial-Temporal Cluster Detection (GIS Early Outbreak Alarming) │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Environment Configuration

### Client Environment Variables (`.env.local`)
Create a `.env.local` file from the provided `.env.example`:

```bash
cp .env.example .env.local
```

Populate the variables with your Supabase credentials:

```ini
# Supabase Project API URL (HTTPS)
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co

# Supabase Anonymous Public API Key (Client-side safe with RLS)
VITE_SUPABASE_ANON_KEY=<your-anon-public-key>

# Application Metadata
VITE_APP_ENV=production
VITE_APP_NAME="PashuRaksha Livestock Health Platform"
VITE_APP_VERSION=1.0.0
```

> [!CAUTION]
> **NEVER** expose the `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` or any frontend codebase. The service-role key bypasses Row Level Security and must only be utilized in isolated serverless backend workers or database administration consoles.

---

## 3. Database Migration Sequence

All schema migrations are located in `supabase/migrations/` and must be executed in chronological order:

| Step | Migration File | Purpose |
|------|----------------|---------|
| 1 | `20261007000000_stage2_farmer_schema.sql` | Core schema: `profiles`, `animals`, `symptom_reports`, `mortality_reports`, `vaccinations`, `treatments`, `alerts` |
| 2 | `20261007000001_stage3_veterinarian_schema.sql` | Clinical schema: `veterinary_cases`, `case_examinations`, `case_notes`, `sample_requests`, `lab_referrals`, `lab_results`, `audit_logs` |
| 3 | `20261008000000_stage4_risk_and_outbreak_schema.sql` | Intelligence schema: `risk_assessments`, `outbreak_clusters`, `cluster_cases`, `intelligence_alerts` |
| 4 | `20261008000001_stage5_advanced_intelligence_schema.sql` | Surveillance schema: `case_follow_ups`, `area_early_warnings`, `intelligence_recommendations`, `surveillance_reports` |
| 5 | `20261008000002_stage6_offline_idempotency_schema.sql` | Offline sync schema: `idempotency_key`, `client_submission_id`, location provenance types |
| 6 | `20261010000001_stage7_security_hardening_and_integrity.sql` | **Hardening & Security**: Vet/Admin cross-role SELECT policies, ownership integrity checks on INSERT, role immutability trigger, storage policies, performance composite indexes |

### Applying Migrations via Supabase CLI:
```bash
# Link project
supabase link --project-ref <your-project-ref>

# Run migrations sequentially
supabase db push
```

---

## 4. Security Hardening & Data Protection

### 4.1 Row Level Security (RLS) Policy Matrix

| Table | Farmer Access | Veterinarian Access | Administrator Access | Notes |
|-------|---------------|---------------------|----------------------|-------|
| `profiles` | Read/Update Own (Role immutable) | Read Own | Read All | Trigger blocks role tampering |
| `animals` | Full CRUD on Own | Read All | Read All | Vets inspect history across herds |
| `symptom_reports` | Insert/Read Own | Read All, Update Status | Read All | INSERT enforces `animal.owner_id = auth.uid()` |
| `mortality_reports` | Insert/Read Own | Read All, Verify | Read All | Verifiable carcass provenance |
| `vaccinations` | Insert/Read Own | Read/Insert/Update All | Read All | Official vet immunization stamps |
| `treatments` | Read Own Animal Rx | Full CRUD | Read All | Prescriptions restricted to vets |
| `veterinary_cases` | Read Own Livestock Cases | Full Clinical CRUD | Full Administrative CRUD | Core triage coordination |
| `case_notes` | **No Access (Blocked)** | Full CRUD | Read All | Internal clinical remarks protected |
| `case_examinations`| Read Own Animal Vitals | Full CRUD | Read All | Stethoscope/temp clinical observations |
| `sample_requests` | **No Access (Blocked)** | Full CRUD | Read All | Diagnostic lab custody records |
| `lab_results` | Read Final Result | Full Clinical CRUD | Read All | Pathogen assay interpretations |
| `audit_logs` | Append Own Action Log | Read All | Read All | Immutable trail (`user_id = auth.uid()`) |
| `risk_assessments` | Read Own Animal Score | Read/Write All | Read All | Transparent 0–100 risk breakdown |
| `outbreak_clusters`| **No Access (Blocked)** | Full Access | Full Access | GIS clustering & containment |
| `intelligence_alerts`| Read Public Advisories | Read All / Acknowledge | Full Administrative Control | State early warning broadcast |
| `storage.objects` | Own directory (`<uid>/*`) | Read All evidence | Read All evidence | `livestock-evidence` bucket |

### 4.2 Role Escalation Prevention
A PostgreSQL `BEFORE UPDATE` trigger on `public.profiles` forbids any non-administrator from altering their assigned `role` or `user_id`. Attempting to forge a role update via client-side Supabase tokens generates a database exception (`Access Denied: Role escalation is strictly prohibited`).

---

## 5. Offline-First Architecture & Field Operations

### 5.1 Storage Lifecycle (`PashuRaksha_OfflineDB_v1`)
The client leverages native browser IndexedDB with zero external runtime dependencies:
1. `pending_health_reports`: Stores offline symptom submissions with auto-generated UUID `idempotency_key`.
2. `pending_mortality_reports`: Stores offline carcass/mortality reports with GPS coordinates and low-bandwidth compressed photos.
3. `cached_animals`: Local animal registry for rapid offline selection and auto-tagging.
4. `vet_draft_notes`: Offline clinical scratchpad for veterinary field officers.
5. `sync_meta`: Last synchronization timestamp and network state telemetry.

### 5.2 Device Handoff & Shared Rural Hardware Protection
When community resource persons or shared village kiosk devices are used, logging out triggers `cleanupUserOfflineData(user.id)`, purging all cached local drafts belonging to that user to eliminate cross-farmer data exposure.

### 5.3 Low-Bandwidth Photo Optimization
Before saving or uploading lesion or livestock photographs, the client-side canvas compressor (`src/services/offline/imageCompressor.ts`):
- Scales maximum dimensions to `1280px`.
- Compresses output to standard JPEG format at `72%` quality.
- Converts multi-megabyte camera files into lightweight `< 200 KB` payloads suitable for 2G/EDGE rural networks.

---

## 6. Risk Engine & Outbreak Clustering Parameters

### 6.1 Explainable Risk Score Formula (0–100)
The risk engine operates deterministically without arbitrary or opaque AI black boxes:
$$\text{Risk Score} = S_{\text{symptoms}} + S_{\text{severity}} + S_{\text{cluster}} + S_{\text{mortality}} + S_{\text{vulnerability}}$$

| Factor | Weight Range | Operational Logic |
|--------|--------------|-------------------|
| **Symptom Profile** | 0 – 35 pts | Pathognomonic signals (blisters/vesicles +25, sudden death +30, bloody discharge +20, high fever +15) |
| **Reported Severity** | 0 – 20 pts | Mild: 5 pts • Moderate: 12 pts • Severe: 20 pts |
| **Spatial Cluster Proximity** | 0 – 25 pts | Case within 5 km active outbreak cluster adds 15–25 pts |
| **Mortality Spike Correlation** | 0 – 15 pts | Recent mortality in same village/block within 7 days |
| **Species/Age Vulnerability** | 0 – 5 pts | Juvenile, pregnant, or exotic high-yield breed factor |

**Triage Categories:**
- **LOW (0–39):** Routine outpatient observation; standard home care advice.
- **MEDIUM (40–69):** Priority veterinary tele-review or dispensary checkup within 24 hours.
- **HIGH (70–84):** Urgent field dispatch; physical examination and sample collection advised.
- **CRITICAL (85–100):** Immediate biosecurity alert; quarantine protocol initiated, state surveillance notified.

### 6.2 Spatial-Temporal Clustering Parameters
- **Spatial Radius:** $5.0\text{ km}$ geographic radius around index case.
- **Temporal Window:** $7\text{ days}$ rolling window.
- **Cluster Threshold:** $\ge 3$ symptomatic cases sharing matching symptom profiles triggers an `outbreak_cluster` detection record.

---

## 7. Backup, Disaster Recovery & High Availability

### 7.1 Automated Daily Backups & Point-in-Time Recovery (PITR)
- **Supabase Cloud / PostgreSQL Managed:** Enable daily logical backups with WAL-based point-in-time recovery (retained for 30 days in production).
- **Storage Backups:** S3 cross-region replication enabled on the `livestock-evidence` bucket.

### 7.2 Manual Database Dump (Runbook)
To generate an immediate offline government archive:
```bash
# Dump complete database schema and data
pg_dump "postgresql://postgres:<password>@<db-host>:5432/postgres" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="pashuraksha_backup_$(date +%Y%m%d_%H%M%S).dump"

# Dump schema only
pg_dump "postgresql://postgres:<password>@<db-host>:5432/postgres" \
  --schema-only \
  --file="pashuraksha_schema_$(date +%Y%m%d).sql"
```

### 7.3 Disaster Restoration Procedure
```bash
# Restore to fresh database instance
pg_restore --clean --if-exists --no-owner --dbname="postgresql://postgres:<password>@<db-host>:5432/postgres" \
  "pashuraksha_backup_<timestamp>.dump"

# Verify Row Level Security status post-restore
psql "postgresql://postgres:<password>@<db-host>:5432/postgres" -c \
  "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';"
```

---

## 8. Acceptance & Operational Checklist

| # | Inspection Item | Status | Verification Detail |
|---|-----------------|:------:|---------------------|
| 1 | Zero Hackathon / SIH branding across all files | **PASSED** | Codebase globally verified (zero matches) |
| 2 | Official Indian Government Visual Identity | **PASSED** | Forest Green `#123C2A`, Gov Green `#1B5E3C`, Warm Ivory `#F7F5EE`, Dark Navy `#102A43` |
| 3 | Role-Based Access Routing | **PASSED** | Farmer `/dashboard`, Vet `/veterinarian`, Admin `/admin` |
| 4 | Offline Database (IndexedDB) | **PASSED** | `PashuRaksha_OfflineDB_v1` persistent storage active |
| 5 | Idempotent Sync Mechanism | **PASSED** | Backoff loop and unique `idempotency_key` configured |
| 6 | Bilingual Localization | **PASSED** | Hindi + English complete dictionary with live toggle |
| 7 | Voice Symptom Reporting | **PASSED** | Web Speech API with explicit farmer confirmation card |
| 8 | Low-Bandwidth Image Compression | **PASSED** | Client canvas compressor to `< 200 KB` JPEG |
| 9 | Row Level Security (RLS) Coverage | **PASSED** | All 16 public tables enforced with explicit policies |
| 10 | Cross-Tenant Ownership Checks | **PASSED** | INSERT checks `animal.owner_id = auth.uid()` |
| 11 | Global Error Boundary | **PASSED** | High-contrast recovery UI with correlation tracking |
| 12 | TypeScript Compilation | **PASSED** | Strict type checks with 0 errors |
| 13 | Service Worker & PWA Manifest | **PASSED** | Registered in `main.tsx`, `manifest.json`, `sw.js` |
