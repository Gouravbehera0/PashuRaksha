# PashuRaksha (पशुरक्षा)

> **"Detect Early. Prevent Outbreaks. Protect Livestock."**  
> *Digital Livestock Health Surveillance & Early Warning System*

---

## 📌 Overview

**PashuRaksha** is a government-scale digital livestock health surveillance and outbreak early-warning platform connecting **farmers**, **veterinarians**, and **health administrators** across rural India.

> [!NOTE]  
> **STAGE 1 FOUNDATION ONLY**: This repository contains the complete production-ready architectural foundation, authentication layout, role-based routing, GIS mapping foundation, and visual design system. The AI disease prediction models, epidemiological clustering, and live backend schemas are scheduled for subsequent stages.

---

## 🏛️ Brand & Visual Identity

PashuRaksha is designed with a high-integrity institutional aesthetic inspired by:
- High-tech Indian Government digital infrastructure
- Veterinary healthcare & clinical monitoring
- GIS Command Center operations
- Rural agricultural resilience

### Color System Design Tokens

| Token | Hex | Role |
|-------|-----|------|
| **Primary Forest Green** | `#123C2A` | Core brand identity & sidebar shell |
| **Government Green** | `#1B5E3C` | Institutional authority, primary buttons, accents |
| **Agriculture Green** | `#2E7D32` | Livestock health, successful states |
| **Earth Brown** | `#8A6A3D` | Rural context, borders, subtle accents |
| **Warm Ivory** | `#F7F5EE` | Surfaces, card backgrounds, elevated sections |
| **Main Background** | `#F3F5F1` | Primary platform canvas background |
| **Dark Navy** | `#102A43` | Headings, utility strips, primary typography |
| **Danger / High Risk** | `#C62828` | Critical outbreak alerts & urgent cases |
| **Warning / Medium Risk**| `#E0A11A` | Overdue vaccinations & monitoring warnings |
| **Success / Low Risk** | `#2E7D32` | Healthy livestock & resolved cases |

---

## 👥 Product Architecture & Roles

The platform enforces strict role-based separation:

### 1. Farmer (`/farmer/*`)
- **Dashboard**: Herd overview & urgent reporting CTA
- **My Animals**: Animal registry (tag number, species, age, status)
- **Report Health Issue**: High-contrast, large touch-target incident reporting
- **Vaccinations**: Due dates, schedules, FMD/HS/BQ coverage
- **Treatments**: Prescribed medications & dosage schedules
- **Health History**: Comprehensive animal clinical records
- **Alerts**: Local village quarantine notices & notifications

### 2. Veterinarian (`/vet/*`)
- **Command Center**: Active cases, triage queue, jurisdiction map
- **Cases**: Clinical diagnosis workflows & status updates
- **Animal Health**: Diagnostic records & animal health files
- **Outbreak Monitoring**: Local geographic cluster surveillance
- **Lab Referrals**: Sample tracking & diagnostic lab integration
- **Treatments**: Protocol formulation & prescription management
- **Reports**: Block/district clinical epidemiological reports

### 3. Administrator (`/admin/*`)
- **National Dashboard**: Country-wide surveillance metrics
- **Risk Map**: Multi-tier GIS map with outbreak zones and heatmaps
- **Outbreak Monitoring**: Cluster detection & spread analytics
- **Users**: Farmer registration, vet credential verification
- **Analytics**: Trend indicators, disease incidence, coverage rates
- **Reports**: National disease surveillance bulletins
- **System**: Audit logs, security rules, integration status

---

## 🛠️ Tech Stack (Stage 1)

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 with custom design tokens
- **Routing**: React Router v7 with role guards and protected routes
- **Maps**: Leaflet + OpenStreetMap + React Leaflet (GIS foundation)
- **Icons**: Lucide React
- **Backend / Auth**: Supabase JS (Client + Auth + Session services)
- **Charts**: Recharts

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- npm (v9+)

### 2. Environment Variables
Create `.env.local` from the provided `.env.example`:
```bash
cp .env.example .env.local
```
Fill in your Supabase project parameters:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Installation & Local Development
```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Check TypeScript types
npm run typecheck

# Build for production
npm run build
```

---

## 🧪 Stage 1 Prototype Evaluation

The application includes an **interactive role inspection tool** directly on the Login screen and in the Sidebar footer:
- Click **Farmer** to preview the Farmer Portal with the prominent **"🚨 Report Animal Health Issue"** mobile CTA.
- Click **Veterinarian** to preview the Clinical Command Center.
- Click **Admin** to inspect National Risk Map and Administrative Analytics.
- Access **National Command Center** (`/dashboard`) for the multi-metric live monitoring shell with interactive Leaflet GIS map.

---

## 📄 License & Disclaimer

*PashuRaksha is a digital livestock-health surveillance and early-warning platform designed to detect disease patterns early, prevent outbreaks, and protect livestock.*
