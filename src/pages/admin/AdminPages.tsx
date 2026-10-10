import { PlaceholderPage } from '@/components/ui/PlaceholderPage'

export { AdminDashboardPage } from './AdminDashboardPage'
export { AdminSurveillanceMapPage } from './AdminSurveillanceMapPage'
export { AdminRiskMapPage } from './AdminRiskMapPage'
export { AdminOutbreaksPage } from './AdminOutbreaksPage'
export { AdminVaccinationPage } from './AdminVaccinationPage'
export { AdminAnalyticsPage } from './AdminAnalyticsPage'
export { AdminReportsPage } from './AdminReportsPage'
export { AreaHealthProfilePage } from './AreaHealthProfilePage'
export { AdminPilotValidationPage } from './AdminPilotValidationPage'

export function AdminUsersPage() {
  return (
    <div className="p-3 sm:p-5 lg:p-6 max-w-6xl mx-auto">
      <PlaceholderPage
        title="Veterinary Cadre & Field Personnel Directory"
        description="Licensure verification against Veterinary Council of India (VCI) records, district veterinary officer (DVO) appointments, and role-based access control."
        badge="Admin &mdash; Users"
      />
    </div>
  )
}

export function AdminSystemPage() {
  return (
    <div className="p-3 sm:p-5 lg:p-6 max-w-6xl mx-auto">
      <PlaceholderPage
        title="System Security & Platform Governance"
        description="Audit logging, data encryption verification, external API gateway status (INAPH / Bharat Pashudhan), and role authorization matrices."
        badge="Admin &mdash; System"
      />
    </div>
  )
}
