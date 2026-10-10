// ============================================================
// PASHURAKSHA (पशुरक्षा) — VET GIS SURVEILLANCE COMMAND PAGE
// Route: /vet/surveillance-map
// Standard: Field Veterinary Epidemiological Triage & Ring Containment
// "Detect Early. Prevent Outbreaks. Protect Livestock."
// ============================================================

import { GisCommandCenter } from '@/components/gis/GisCommandCenter'

export function VetSurveillanceMapPage() {
  return (
    <div className="h-[calc(100vh-4rem)] w-full overflow-hidden flex flex-col">
      <GisCommandCenter userRole="veterinarian" />
    </div>
  )
}
