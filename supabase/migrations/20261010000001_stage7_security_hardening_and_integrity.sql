-- ============================================================
-- PASHURAKSHA (पशुरक्षा) — STAGE 7 DATABASE MIGRATIONS
-- Module: Security Hardening, RLS Isolation, Data Integrity & Performance
-- Standard: PostgreSQL 15+ / Supabase
-- "Detect Early. Prevent Outbreaks. Protect Livestock."
-- ============================================================

-- ============================================================
-- 1. CROSS-ROLE ACCESS POLICIES FOR VETERINARIANS & ADMINS
-- Ensures clinical officers and state administrators can query
-- farmer animal records and clinical triage submissions.
-- ============================================================

-- Animals: Vets and Admins need read access to all registered livestock
DROP POLICY IF EXISTS "Vets and Admins can view all animals" ON public.animals;
CREATE POLICY "Vets and Admins can view all animals"
    ON public.animals FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role IN ('veterinarian', 'admin')
        )
    );

-- Symptom Reports: Vets and Admins need full read and status update access
DROP POLICY IF EXISTS "Vets and Admins can view all symptom reports" ON public.symptom_reports;
CREATE POLICY "Vets and Admins can view all symptom reports"
    ON public.symptom_reports FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role IN ('veterinarian', 'admin')
        )
    );

DROP POLICY IF EXISTS "Vets and Admins can update symptom reports" ON public.symptom_reports;
CREATE POLICY "Vets and Admins can update symptom reports"
    ON public.symptom_reports FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role IN ('veterinarian', 'admin')
        )
    );

-- Mortality Reports: Vets and Admins need read and verification update access
DROP POLICY IF EXISTS "Vets and Admins can view all mortality reports" ON public.mortality_reports;
CREATE POLICY "Vets and Admins can view all mortality reports"
    ON public.mortality_reports FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role IN ('veterinarian', 'admin')
        )
    );

DROP POLICY IF EXISTS "Vets and Admins can update mortality reports" ON public.mortality_reports;
CREATE POLICY "Vets and Admins can update mortality reports"
    ON public.mortality_reports FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role IN ('veterinarian', 'admin')
        )
    );

-- Vaccinations: Vets and Admins can view, record, and update vaccination logs
DROP POLICY IF EXISTS "Vets and Admins can view all vaccinations" ON public.vaccinations;
CREATE POLICY "Vets and Admins can view all vaccinations"
    ON public.vaccinations FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role IN ('veterinarian', 'admin')
        )
    );

DROP POLICY IF EXISTS "Vets and Admins can insert vaccinations" ON public.vaccinations;
CREATE POLICY "Vets and Admins can insert vaccinations"
    ON public.vaccinations FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role IN ('veterinarian', 'admin')
        )
    );

DROP POLICY IF EXISTS "Vets and Admins can update vaccinations" ON public.vaccinations;
CREATE POLICY "Vets and Admins can update vaccinations"
    ON public.vaccinations FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role IN ('veterinarian', 'admin')
        )
    );

-- ============================================================
-- 2. DATA OWNERSHIP & INTEGRITY ON INSERT POLICIES
-- Prevents authenticated users from spoofing animal ownership
-- ============================================================

-- Enforce that symptom report animal_id strictly belongs to the reporting user
DROP POLICY IF EXISTS "Farmers can insert own symptom reports" ON public.symptom_reports;
CREATE POLICY "Farmers can insert own symptom reports"
    ON public.symptom_reports FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = owner_id AND
        EXISTS (
            SELECT 1 FROM public.animals
            WHERE id = animal_id AND owner_id = auth.uid()
        )
    );

-- Enforce that mortality report animal_id strictly belongs to the reporting user
DROP POLICY IF EXISTS "Farmers can insert own mortality reports" ON public.mortality_reports;
CREATE POLICY "Farmers can insert own mortality reports"
    ON public.mortality_reports FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = owner_id AND
        EXISTS (
            SELECT 1 FROM public.animals
            WHERE id = animal_id AND owner_id = auth.uid()
        )
    );

-- Enforce that vaccination record animal_id strictly belongs to the owner (for farmer self-entries)
DROP POLICY IF EXISTS "Farmers can insert own vaccinations" ON public.vaccinations;
CREATE POLICY "Farmers can insert own vaccinations"
    ON public.vaccinations FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = owner_id AND
        EXISTS (
            SELECT 1 FROM public.animals
            WHERE id = animal_id AND owner_id = auth.uid()
        )
    );

-- ============================================================
-- 3. PROFILES SECURITY & PRIVILEGE ESCALATION PREVENTION
-- Hardens profile updates so that users cannot elevate their own role
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent non-admin clients from changing their own role or user_id
    IF (OLD.role IS DISTINCT FROM NEW.role) THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        ) AND current_user NOT IN ('supabase_admin', 'postgres', 'service_role') THEN
            RAISE EXCEPTION 'Access Denied: Role escalation is strictly prohibited.';
        END IF;
    END IF;

    IF (OLD.user_id IS DISTINCT FROM NEW.user_id) THEN
        RAISE EXCEPTION 'Access Denied: user_id cannot be changed.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_profile_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_role_escalation
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_profile_role_escalation();

-- ============================================================
-- 4. AUDIT LOG SPOOFING PREVENTION
-- Enforces that audit_logs.user_id strictly matches auth.uid()
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can append audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can append audit logs"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        user_id = auth.uid()::text
    );

-- ============================================================
-- 5. SUPABASE STORAGE SECURITY FOR LIVESTOCK EVIDENCE
-- Bucket: livestock-evidence
-- Strict directory segregation by user UUID
-- ============================================================

-- Ensure storage bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('livestock-evidence', 'livestock-evidence', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Upload policy: Users can only upload into their own folder: livestock-evidence/<user_id>/...
DROP POLICY IF EXISTS "Users can upload their own evidence" ON storage.objects;
CREATE POLICY "Users can upload their own evidence"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'livestock-evidence' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Read policy: Users read their own folder; Vets and Admins read all folders in livestock-evidence
DROP POLICY IF EXISTS "Users can read own evidence, Vets and Admins read all" ON storage.objects;
CREATE POLICY "Users can read own evidence, Vets and Admins read all"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'livestock-evidence' AND (
            (storage.foldername(name))[1] = auth.uid()::text OR
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE user_id = auth.uid() AND role IN ('veterinarian', 'admin')
            )
        )
    );

-- Delete policy: Users can delete only files within their own folder
DROP POLICY IF EXISTS "Users can delete their own evidence" ON storage.objects;
CREATE POLICY "Users can delete their own evidence"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'livestock-evidence' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- ============================================================
-- 6. COMPOSITE PERFORMANCE INDEXES
-- Optimizes high-throughput clinical and surveillance queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_vet_cases_owner_status
    ON public.veterinary_cases(owner_id, status);

CREATE INDEX IF NOT EXISTS idx_vet_cases_vet_status
    ON public.veterinary_cases(assigned_vet_id, status);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_case_score_desc
    ON public.risk_assessments(case_id, risk_score DESC);

CREATE INDEX IF NOT EXISTS idx_outbreak_clusters_status_risk
    ON public.outbreak_clusters(status, risk_level);

CREATE INDEX IF NOT EXISTS idx_intelligence_alerts_status_severity
    ON public.intelligence_alerts(status, severity);

CREATE INDEX IF NOT EXISTS idx_symptom_reports_owner_created_desc
    ON public.symptom_reports(owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mortality_reports_owner_created_desc
    ON public.mortality_reports(owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vaccinations_owner_animal
    ON public.vaccinations(owner_id, animal_id);

CREATE INDEX IF NOT EXISTS idx_treatments_owner_animal
    ON public.treatments(owner_id, animal_id);
