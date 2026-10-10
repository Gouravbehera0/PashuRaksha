import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'

// Layouts
import { AppLayout } from '@/layouts/AppLayout'

// Route guards
import { ProtectedRoute, RoleRoute, PublicRoute } from '@/routes/Guards'

// Auth pages
import { LoginPage } from '@/pages/auth/LoginPage'

// Shared dashboard
import { DashboardPage } from '@/pages/DashboardPage'

// Farmer pages
import { FarmerDashboardPage } from '@/pages/farmer/FarmerDashboardPage'
import { FarmerAnimalsPage } from '@/pages/farmer/FarmerAnimalsPage'
import { AddAnimalPage } from '@/pages/farmer/AddAnimalPage'
import { AnimalHealthProfilePage } from '@/pages/farmer/AnimalHealthProfilePage'
import { ReportHealthPage } from '@/pages/farmer/ReportHealthPage'
import { ReportMortalityPage } from '@/pages/farmer/ReportMortalityPage'
import { FarmerCasesPage } from '@/pages/farmer/FarmerCasesPage'
import { FarmerVaccinationsPage } from '@/pages/farmer/FarmerVaccinationsPage'
import { FarmerTreatmentsPage } from '@/pages/farmer/FarmerTreatmentsPage'
import { FarmerAlertsPage } from '@/pages/farmer/FarmerAlertsPage'
import { FarmerReportsPage } from '@/pages/farmer/FarmerReportsPage'
import { FarmerDevicesPage } from '@/pages/farmer/FarmerDevicesPage'
import { FarmerDeviceDetailPage } from '@/pages/farmer/FarmerDeviceDetailPage'

// Veterinarian pages
import { VetCommandCenterPage } from '@/pages/veterinarian/VetCommandCenterPage'
import { VetCasesPage } from '@/pages/veterinarian/VetCasesPage'
import { VetCaseDetailPage } from '@/pages/veterinarian/VetCaseDetailPage'
import { VetAnimalsPage } from '@/pages/veterinarian/VetAnimalsPage'
import { VetAnimalDetailPage } from '@/pages/veterinarian/VetAnimalDetailPage'
import { VetFarmersPage } from '@/pages/veterinarian/VetFarmersPage'
import { VetFarmerDetailPage } from '@/pages/veterinarian/VetFarmerDetailPage'
import { VetLabPage } from '@/pages/veterinarian/VetLabPage'
import { VetTreatmentsPage } from '@/pages/veterinarian/VetTreatmentsPage'
import { VetAlertsPage } from '@/pages/veterinarian/VetAlertsPage'
import { VetOutbreaksPage } from '@/pages/veterinarian/VetOutbreaksPage'
import { VetReportsPage } from '@/pages/veterinarian/VetReportsPage'
import { VetSurveillanceMapPage } from '@/pages/veterinarian/VetSurveillanceMapPage'
import { VetIoTMonitoringPage } from '@/pages/veterinarian/VetIoTMonitoringPage'

// Admin pages
import { AdminIoTInfrastructurePage } from '@/pages/admin/AdminIoTInfrastructurePage'
import {
  AdminDashboardPage,
  AdminSurveillanceMapPage,
  AdminOutbreaksPage,
  AdminVaccinationPage,
  AdminUsersPage,
  AdminAnalyticsPage,
  AdminReportsPage,
  AreaHealthProfilePage,
  AdminSystemPage,
  AdminPilotValidationPage,
} from '@/pages/admin/AdminPages'

// Misc pages
import { SettingsPage, NotFoundPage } from '@/pages/misc/MiscPages'

const router = createBrowserRouter([
  // ─── Public routes (unauthenticated) ──────────────────────────
  {
    element: <PublicRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
    ],
  },

  // ─── Protected routes (authenticated) ─────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // Default dashboard (all roles)
          { path: '/dashboard', element: <DashboardPage /> },

          // Settings
          { path: '/settings', element: <SettingsPage /> },

          // ─── Farmer routes ───────────────────────────────────
          {
            element: <RoleRoute allowedRoles={['farmer']} />,
            children: [
              { path: '/farmer/dashboard', element: <FarmerDashboardPage /> },
              { path: '/farmer/animals', element: <FarmerAnimalsPage /> },
              { path: '/farmer/animals/add', element: <AddAnimalPage /> },
              { path: '/farmer/animals/:id', element: <AnimalHealthProfilePage /> },
              { path: '/farmer/report-health', element: <ReportHealthPage /> },
              { path: '/farmer/report', element: <Navigate to="/farmer/report-health" replace /> },
              { path: '/farmer/report-mortality', element: <ReportMortalityPage /> },
              { path: '/farmer/cases', element: <FarmerCasesPage /> },
              { path: '/farmer/vaccinations', element: <FarmerVaccinationsPage /> },
              { path: '/farmer/treatments', element: <FarmerTreatmentsPage /> },
              { path: '/farmer/devices', element: <FarmerDevicesPage /> },
              { path: '/farmer/devices/:id', element: <FarmerDeviceDetailPage /> },
              { path: '/farmer/iot', element: <Navigate to="/farmer/devices" replace /> },
              { path: '/farmer/reports', element: <FarmerReportsPage /> },
              { path: '/farmer/history', element: <FarmerCasesPage /> },
              { path: '/farmer/alerts', element: <FarmerAlertsPage /> },
              { path: '/farmer/health-issues', element: <Navigate to="/farmer/report-health" replace /> },
              { path: '/farmer/profile', element: <Navigate to="/settings" replace /> },
              { path: '/farmer/settings', element: <Navigate to="/settings" replace /> },
            ],
          },

          // ─── Veterinarian routes ─────────────────────────────
          {
            element: <RoleRoute allowedRoles={['veterinarian']} />,
            children: [
              { path: '/vet/command-center', element: <VetCommandCenterPage /> },
              { path: '/vet/dashboard', element: <Navigate to="/vet/command-center" replace /> },
              { path: '/vet/cases', element: <VetCasesPage /> },
              { path: '/vet/cases/:id', element: <VetCaseDetailPage /> },
              { path: '/vet/animals', element: <VetAnimalsPage /> },
              { path: '/vet/animals/:id', element: <VetAnimalDetailPage /> },
              { path: '/vet/animal-health', element: <Navigate to="/vet/animals" replace /> },
              { path: '/vet/farmers', element: <VetFarmersPage /> },
              { path: '/vet/farmers/:id', element: <VetFarmerDetailPage /> },
              { path: '/vet/lab', element: <VetLabPage /> },
              { path: '/vet/lab-referrals', element: <Navigate to="/vet/lab" replace /> },
              { path: '/vet/treatments', element: <VetTreatmentsPage /> },
              { path: '/vet/alerts', element: <VetAlertsPage /> },
              { path: '/vet/iot', element: <VetIoTMonitoringPage /> },
              { path: '/vet/devices', element: <Navigate to="/vet/iot" replace /> },
              { path: '/vet/outbreaks', element: <VetOutbreaksPage /> },
              { path: '/vet/surveillance-map', element: <VetSurveillanceMapPage /> },
              { path: '/vet/map', element: <Navigate to="/vet/surveillance-map" replace /> },
              { path: '/vet/reports', element: <VetReportsPage /> },
            ],
          },

          // ─── Admin routes ────────────────────────────────────
          {
            element: <RoleRoute allowedRoles={['admin']} />,
            children: [
              { path: '/admin/dashboard', element: <AdminDashboardPage /> },
              { path: '/admin/surveillance-map', element: <AdminSurveillanceMapPage /> },
              { path: '/admin/risk-map', element: <Navigate to="/admin/surveillance-map" replace /> },
              { path: '/admin/map', element: <Navigate to="/admin/surveillance-map" replace /> },
              { path: '/admin/outbreaks', element: <AdminOutbreaksPage /> },
              { path: '/admin/alerts', element: <Navigate to="/admin/outbreaks" replace /> },
              { path: '/admin/vaccination', element: <AdminVaccinationPage /> },
              { path: '/admin/iot', element: <AdminIoTInfrastructurePage /> },
              { path: '/admin/devices', element: <Navigate to="/admin/iot" replace /> },
              { path: '/admin/areas/:id', element: <AreaHealthProfilePage forcedType="district" /> },
              { path: '/admin/villages/:id', element: <AreaHealthProfilePage forcedType="village" /> },
              { path: '/admin/users', element: <AdminUsersPage /> },
              { path: '/admin/animals', element: <Navigate to="/admin/dashboard" replace /> },
              { path: '/admin/cases', element: <Navigate to="/admin/dashboard" replace /> },
              { path: '/admin/analytics', element: <AdminAnalyticsPage /> },
              { path: '/admin/reports', element: <AdminReportsPage /> },
              { path: '/admin/system', element: <AdminSystemPage /> },
              { path: '/admin/pilot', element: <AdminPilotValidationPage /> },
              { path: '/admin/validation', element: <Navigate to="/admin/pilot" replace /> },
              { path: '/admin/settings', element: <Navigate to="/admin/system" replace /> },
            ],
          },
        ],
      },
    ],
  },

  // ─── Root redirect ─────────────────────────────────────────────
  { path: '/', element: <Navigate to="/dashboard" replace /> },

  // ─── 404 ───────────────────────────────────────────────────────
  { path: '*', element: <NotFoundPage /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
