// ============================================================
// PASHURAKSHA (पशुरक्षा) — ADMIN GIS SURVEILLANCE COMMAND PAGE
// Route: /admin/surveillance-map
// Standard: National Livestock Biosecurity & GIS Command Desk
// "Detect Early. Prevent Outbreaks. Protect Livestock."
// ============================================================

import { GisCommandCenter } from '@/components/gis/GisCommandCenter'

export function AdminSurveillanceMapPage() {
  return (
    <div className="h-[calc(100vh-4rem)] w-full overflow-hidden flex flex-col">
      <GisCommandCenter userRole="admin" />
    </div>
  )
}
