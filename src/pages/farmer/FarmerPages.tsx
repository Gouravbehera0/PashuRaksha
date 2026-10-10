import { PlaceholderPage } from '@/components/ui/PlaceholderPage'

export function FarmerAnimalsPage() {
  return (
    <div className="p-3 sm:p-5 lg:p-6 max-w-6xl mx-auto">
      <PlaceholderPage
        title="पंजीकृत पशु &middot; Registered Livestock Inventory"
        description="View and manage your registered livestock linked to 12-digit INAPH ear-tags. Record individual health milestones, lactation cycles, and vital statistics."
        badge="Farmer &mdash; Livestock Registry"
      />
    </div>
  )
}

export function FarmerReportPage() {
  return (
    <div className="p-3 sm:p-5 lg:p-6 max-w-6xl mx-auto">
      <PlaceholderPage
        title="पशु स्वास्थ्य समस्या दर्ज करें &middot; Report Animal Health Concern"
        description="Structured triage submission interface for farmers. Upload clinical photographs of lesions/symptoms, record body temperature, and request Mobile Veterinary Unit (MVU) dispatch."
        badge="Farmer &mdash; Clinical Triage"
      />
    </div>
  )
}

export function FarmerVaccinationsPage() {
  return (
    <div className="p-3 sm:p-5 lg:p-6 max-w-6xl mx-auto">
      <PlaceholderPage
        title="टीकाकरण सारणी &middot; National Livestock Vaccination Schedule"
        description="Government-mandated vaccination cycles for Foot &amp; Mouth Disease (FMD), Haemorrhagic Septicaemia (HS), and Black Quarter (BQ). Automated SMS reminders."
        badge="Farmer &mdash; Vaccinations"
      />
    </div>
  )
}

export function FarmerTreatmentsPage() {
  return (
    <div className="p-3 sm:p-5 lg:p-6 max-w-6xl mx-auto">
      <PlaceholderPage
        title="उपचार एवं दवाएं &middot; Prescribed Veterinary Treatments"
        description="Access verified clinical prescriptions issued by licensed veterinarians, dosage instructions, and withdrawal period advisories."
        badge="Farmer &mdash; Treatments"
      />
    </div>
  )
}

export function FarmerHistoryPage() {
  return (
    <div className="p-3 sm:p-5 lg:p-6 max-w-6xl mx-auto">
      <PlaceholderPage
        title="स्वास्थ्य इतिहास &middot; Complete Animal Health History"
        description="Permanent digital health passport for each registered animal. Essential for veterinary consultations, insurance claims, and livestock sales."
        badge="Farmer &mdash; Health History"
      />
    </div>
  )
}

export function FarmerAlertsPage() {
  return (
    <div className="p-3 sm:p-5 lg:p-6 max-w-6xl mx-auto">
      <PlaceholderPage
        title="क्षेत्रीय सतर्कता &middot; Village Biosecurity &amp; Outbreak Alerts"
        description="Official alerts from the District Veterinary Office regarding disease outbreaks in surrounding blocks, quarantine cordons, and emergency vaccination camps."
        badge="Farmer &mdash; Biosecurity Alerts"
      />
    </div>
  )
}
