import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types'
import { WalkingCowLoading } from '@/components/ui/WalkingCowLoading'

// === ProtectedRoute — Requires authentication ===
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <WalkingCowLoading
        message="Loading PashuRaksha Portal..."
        subMessage="सुरक्षित पशु • समृद्ध किसान &mdash; Initializing sovereign livestock surveillance session"
      />
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

// === RoleRoute — Requires specific role ===
interface RoleRouteProps {
  allowedRoles: UserRole[]
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { role, isLoading, dashboardPath } = useAuth()

  if (isLoading) {
    return (
      <WalkingCowLoading
        message="Verifying Access Credentials..."
        subMessage="Validating veterinary licensure & role permissions"
      />
    )
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={dashboardPath} replace />
  }

  return <Outlet />
}

// === PublicRoute — Redirects authenticated users to dashboard ===
export function PublicRoute() {
  const { isAuthenticated, isLoading, dashboardPath } = useAuth()

  if (isLoading) {
    return (
      <WalkingCowLoading
        message="Connecting to PashuRaksha..."
        subMessage="Detect Early. Prevent Outbreaks. Protect Livestock."
      />
    )
  }

  if (isAuthenticated) {
    return <Navigate to={dashboardPath} replace />
  }

  return <Outlet />
}
