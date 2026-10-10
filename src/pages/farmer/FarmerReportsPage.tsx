// ============================================================
// PASHURAKSHA (पशुरक्षा) — FARMER LIVESTOCK HEALTH DOSSIER & REPORTS
// Route: /farmer/reports
// Standard: Smallholder Herd Health Dossier & Vaccination History
// "Detect Early. Prevent Outbreaks. Protect Livestock."
// ============================================================

import { useAuth } from '@/hooks/useAuth'
import { ReportingDashboard } from '@/components/reports/ReportingDashboard'

export function FarmerReportsPage() {
  const { user } = useAuth()

  return (
    <div className="p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto">
      <ReportingDashboard
        userRole="farmer"
        currentUserId={user?.id || 'demo-farmer'}
        defaultCategory="farmer-herd-dossier"
      />
    </div>
  )
}
