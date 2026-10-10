-- ============================================================
-- PASHURAKSHA (पशुरक्षा) — STAGE 3 DATABASE SCHEMA & MIGRATIONS
-- Module: Veterinary Intelligence & Case Management Module
-- Standard: PostgreSQL 15+ / Supabase
-- ============================================================

-- ============================================================
-- 1. VETERINARY CASES TABLE
-- Connects field triage submissions with clinical veterinary workflow
-- ============================================================
CREATE TABLE IF NOT EXISTS public.veterinary_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number TEXT NOT NULL UNIQUE,
    report_id UUID REFERENCES public.symptom_reports(id) ON DELETE SET NULL,
    animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_vet_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_vet_name TEXT DEFAULT 'Dr. Priya Sharma (Veterinary Officer)',
    status TEXT NOT NULL CHECK (status IN (
        'Reported',
        'Under Review',
        'Veterinary Review',
        'Sample Required',
        'Lab Pending',
        'Treatment',
        'Monitoring',
        'Resolved',
        'Rejected'
    )) DEFAULT 'Reported',
    priority TEXT NOT NULL CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')) DEFAULT 'MEDIUM',
    symptoms TEXT[] NOT NULL DEFAULT '{}',
    reported_severity TEXT CHECK (reported_severity IN ('Mild', 'Moderate', 'Severe')) DEFAULT 'Moderate',
    description TEXT,
    village TEXT,
    district TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolution_summary TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vet_cases_case_number ON public.veterinary_cases(case_number);
CREATE INDEX IF NOT EXISTS idx_vet_cases_animal_id ON public.veterinary_cases(animal_id);
CREATE INDEX IF NOT EXISTS idx_vet_cases_owner_id ON public.veterinary_cases(owner_id);
CREATE INDEX IF NOT EXISTS idx_vet_cases_assigned_vet ON public.veterinary_cases(assigned_vet_id);
CREATE INDEX IF NOT EXISTS idx_vet_cases_status ON public.veterinary_cases(status);
CREATE INDEX IF NOT EXISTS idx_vet_cases_priority ON public.veterinary_cases(priority);
CREATE INDEX IF NOT EXISTS idx_vet_cases_created_at ON public.veterinary_cases(created_at);
CREATE INDEX IF NOT EXISTS idx_vet_cases_village ON public.veterinary_cases(village);
CREATE INDEX IF NOT EXISTS idx_vet_cases_district ON public.veterinary_cases(district);

-- ============================================================
-- 2. CASE EXAMINATIONS TABLE
-- Structured clinical vital observations by licensed veterinarians
-- ============================================================
CREATE TABLE IF NOT EXISTS public.case_examinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES public.veterinary_cases(id) ON DELETE CASCADE,
    veterinarian_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    veterinarian_name TEXT NOT NULL,
    temperature NUMERIC(4, 1),
    temperature_unit TEXT CHECK (temperature_unit IN ('F', 'C')) DEFAULT 'F',
    observed_symptoms TEXT[] NOT NULL DEFAULT '{}',
    physical_observations TEXT,
    behaviour TEXT CHECK (behaviour IN ('Alert', 'Dull', 'Depressed', 'Excited', 'Recumbent')),
    appetite TEXT CHECK (appetite IN ('Normal', 'Reduced', 'Anorexic/Off-feed')),
    hydration TEXT CHECK (hydration IN ('Normal', 'Mild Dehydration', 'Severe Dehydration')),
    respiratory_condition TEXT CHECK (respiratory_condition IN ('Normal', 'Dyspnea/Rapid', 'Wheezing/Cough', 'Stridor')),
    mucous_membrane TEXT CHECK (mucous_membrane IN ('Normal Pink', 'Congested/Red', 'Pale', 'Icteric/Yellow')),
    other_observations TEXT,
    examined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_examinations_case_id ON public.case_examinations(case_id);

-- ============================================================
-- 3. CASE NOTES TABLE
-- Chronological clinical, lab, and administrative notes by veterinarians
-- ============================================================
CREATE TABLE IF NOT EXISTS public.case_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES public.veterinary_cases(id) ON DELETE CASCADE,
    veterinarian_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    veterinarian_name TEXT NOT NULL,
    note_type TEXT NOT NULL CHECK (note_type IN (
        'General Observation',
        'Clinical Observation',
        'Follow-up',
        'Treatment',
        'Lab',
        'Administrative'
    )),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_notes_case_id ON public.case_notes(case_id);
CREATE INDEX IF NOT EXISTS idx_case_notes_type ON public.case_notes(note_type);

-- ============================================================
-- 4. SAMPLE REQUESTS TABLE
-- Diagnostic sample collection requests with chain of custody
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sample_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sample_number TEXT NOT NULL UNIQUE,
    case_id UUID NOT NULL REFERENCES public.veterinary_cases(id) ON DELETE CASCADE,
    animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
    sample_type TEXT NOT NULL CHECK (sample_type IN (
        'Blood',
        'Swab',
        'Fecal',
        'Urine',
        'Tissue',
        'Milk',
        'Other'
    )),
    collection_instructions TEXT,
    priority TEXT NOT NULL CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')) DEFAULT 'HIGH',
    requested_by TEXT NOT NULL,
    requested_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN (
        'Requested',
        'Collected',
        'Sent to Lab',
        'Received',
        'Testing',
        'Result Available'
    )) DEFAULT 'Requested',
    notes TEXT,
    collected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sample_requests_case_id ON public.sample_requests(case_id);
CREATE INDEX IF NOT EXISTS idx_sample_requests_status ON public.sample_requests(status);

-- ============================================================
-- 5. LAB REFERRALS TABLE
-- Chain of custody referrals to regional disease diagnostic labs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lab_referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referral_number TEXT NOT NULL UNIQUE,
    case_id UUID NOT NULL REFERENCES public.veterinary_cases(id) ON DELETE CASCADE,
    sample_id UUID NOT NULL REFERENCES public.sample_requests(id) ON DELETE CASCADE,
    lab_name TEXT NOT NULL,
    test_requested TEXT NOT NULL,
    requested_by TEXT NOT NULL,
    referral_date DATE NOT NULL DEFAULT CURRENT_DATE,
    priority TEXT NOT NULL CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')) DEFAULT 'HIGH',
    status TEXT NOT NULL CHECK (status IN (
        'Referred',
        'Sample Dispatched',
        'Received by Lab',
        'Testing Ongoing',
        'Result Uploaded',
        'Completed'
    )) DEFAULT 'Referred',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lab_referrals_case_id ON public.lab_referrals(case_id);
CREATE INDEX IF NOT EXISTS idx_lab_referrals_sample_id ON public.lab_referrals(sample_id);

-- ============================================================
-- 6. LAB RESULTS TABLE
-- Official laboratory assay results interpreted by clinical veterinarian
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lab_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referral_id UUID NOT NULL REFERENCES public.lab_referrals(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES public.veterinary_cases(id) ON DELETE CASCADE,
    lab_name TEXT NOT NULL,
    test_name TEXT NOT NULL,
    result_status TEXT NOT NULL CHECK (result_status IN ('Pending', 'Negative', 'Positive', 'Inconclusive')) DEFAULT 'Pending',
    result_summary TEXT,
    pathogen_identified TEXT,
    result_date DATE DEFAULT CURRENT_DATE,
    attachment_url TEXT,
    veterinarian_interpretation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lab_results_case_id ON public.lab_results(case_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_referral_id ON public.lab_results(referral_id);

-- ============================================================
-- 7. AUDIT LOGS TABLE
-- Complete government compliance audit trail
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN (
        'Case Created',
        'Case Assigned',
        'Status Changed',
        'Priority Changed',
        'Note Added',
        'Examination Recorded',
        'Sample Requested',
        'Lab Referral Created',
        'Lab Result Interpreted',
        'Treatment Prescribed',
        'Case Resolved'
    )),
    case_id UUID REFERENCES public.veterinary_cases(id) ON DELETE SET NULL,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_case_id ON public.audit_logs(case_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES — STAGE 3
-- ============================================================

ALTER TABLE public.veterinary_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sample_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Veterinary Cases:
-- Veterinarians and Admins can view and update all surveillance cases
CREATE POLICY "Vets and Admins can view all cases"
    ON public.veterinary_cases FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role IN ('veterinarian', 'admin')
        )
    );

-- Farmers can view cases concerning their own livestock
CREATE POLICY "Farmers can view own livestock cases"
    ON public.veterinary_cases FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Vets and Admins can update cases"
    ON public.veterinary_cases FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role IN ('veterinarian', 'admin')
        )
    );

CREATE POLICY "Vets and Admins can insert cases"
    ON public.veterinary_cases FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role IN ('veterinarian', 'admin')
        )
    );

-- 2. Case Notes:
-- INTERNAL ONLY — Farmers CANNOT read or alter internal vet case notes!
CREATE POLICY "Vets and Admins can view case notes"
    ON public.case_notes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role IN ('veterinarian', 'admin')
        )
    );

CREATE POLICY "Vets and Admins can insert case notes"
    ON public.case_notes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role IN ('veterinarian', 'admin')
        )
    );

-- 3. Case Examinations:
CREATE POLICY "Vets and Admins can view examinations"
    ON public.case_examinations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role IN ('veterinarian', 'admin')
        )
    );

CREATE POLICY "Vets and Admins can insert examinations"
    ON public.case_examinations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role IN ('veterinarian', 'admin')
        )
    );

-- 4. Sample Requests & Lab Referrals:
CREATE POLICY "Vets and Admins can view and manage samples"
    ON public.sample_requests FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role IN ('veterinarian', 'admin')
        )
    );

CREATE POLICY "Vets and Admins can view and manage lab referrals"
    ON public.lab_referrals FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role IN ('veterinarian', 'admin')
        )
    );

CREATE POLICY "Vets and Admins can view and manage lab results"
    ON public.lab_results FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role IN ('veterinarian', 'admin')
        )
    );

-- 5. Audit Logs:
CREATE POLICY "Vets and Admins can create and update treatments"
    ON public.treatments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role IN ('veterinarian', 'admin')
        )
    );

CREATE POLICY "Vets and Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role IN ('veterinarian', 'admin')
        )
    );

CREATE POLICY "Authenticated users can append audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger for veterinary_cases updated_at
CREATE TRIGGER trg_veterinary_cases_updated_at
    BEFORE UPDATE ON public.veterinary_cases
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_sample_requests_updated_at
    BEFORE UPDATE ON public.sample_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_lab_referrals_updated_at
    BEFORE UPDATE ON public.lab_referrals
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
