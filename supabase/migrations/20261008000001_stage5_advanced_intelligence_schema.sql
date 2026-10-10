-- ============================================================
-- PASHURAKSHA (पशुरक्षा) — STAGE 5 DATABASE SCHEMA & MIGRATIONS
-- Module: Advanced Intelligence + Surveillance + Predictive Analytics
-- Standard: PostgreSQL 15+ / Supabase
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. CASE FOLLOW-UPS TABLE
-- Veterinary follow-up scheduling, clinical review, and status tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS public.case_follow_ups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES public.veterinary_cases(id) ON DELETE CASCADE,
    assigned_veterinarian_id UUID,
    assigned_veterinarian_name TEXT,
    follow_up_date DATE NOT NULL,
    notes TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Due Today', 'Overdue', 'Completed')) DEFAULT 'Pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_follow_ups_case_id ON public.case_follow_ups(case_id);
CREATE INDEX IF NOT EXISTS idx_case_follow_ups_status ON public.case_follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_case_follow_ups_date ON public.case_follow_ups(follow_up_date);

-- ============================================================
-- 2. AREA EARLY WARNINGS TABLE
-- Transparent 0–100 Early Warning Scores & Directional Trends
-- ============================================================
CREATE TABLE IF NOT EXISTS public.area_early_warnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_name TEXT NOT NULL,
    area_type TEXT NOT NULL CHECK (area_type IN ('district', 'village')),
    early_warning_score INTEGER NOT NULL CHECK (early_warning_score >= 0 AND early_warning_score <= 100),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'ELEVATED')),
    trend TEXT NOT NULL CHECK (trend IN ('INCREASING', 'STABLE', 'DECREASING')),
    factors JSONB NOT NULL DEFAULT '{}'::jsonb,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    engine_version TEXT NOT NULL DEFAULT 'v1.0-deterministic'
);

CREATE INDEX IF NOT EXISTS idx_area_early_warnings_area_name ON public.area_early_warnings(area_name);
CREATE INDEX IF NOT EXISTS idx_area_early_warnings_score ON public.area_early_warnings(early_warning_score);
CREATE INDEX IF NOT EXISTS idx_area_early_warnings_calculated ON public.area_early_warnings(calculated_at);

-- ============================================================
-- 3. INTELLIGENCE RECOMMENDATIONS TABLE
-- Decision-support recommendations with explainable bullet points
-- ============================================================
CREATE TABLE IF NOT EXISTS public.intelligence_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_name TEXT NOT NULL,
    recommendation_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reasons TEXT[] NOT NULL DEFAULT '{}',
    priority TEXT NOT NULL CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'ROUTINE')) DEFAULT 'HIGH',
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'ACTIONED', 'DISMISSED')) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intel_recs_status ON public.intelligence_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_intel_recs_priority ON public.intelligence_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_intel_recs_area ON public.intelligence_recommendations(area_name);

-- ============================================================
-- 4. SURVEILLANCE REPORTS TABLE
-- Statutory, epidemiological, and biosecurity reports
-- ============================================================
CREATE TABLE IF NOT EXISTS public.surveillance_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type TEXT NOT NULL CHECK (report_type IN (
        'Health Surveillance Report',
        'Outbreak Report',
        'Vaccination Report',
        'Mortality Report',
        'Veterinary Activity Report',
        'District Health Report'
    )),
    title TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    recommendations TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_surveillance_reports_type ON public.surveillance_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_surveillance_reports_created ON public.surveillance_reports(created_at);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE public.case_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.area_early_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveillance_reports ENABLE ROW LEVEL SECURITY;

-- Read policies
CREATE POLICY "Public read for authenticated users on case follow-ups"
    ON public.case_follow_ups FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Veterinarians and Admins can manage case follow-ups"
    ON public.case_follow_ups FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_id = auth.uid()
            AND role IN ('veterinarian', 'admin')
        )
    );

CREATE POLICY "Public read on area early warnings"
    ON public.area_early_warnings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage area early warnings"
    ON public.area_early_warnings FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Public read on intelligence recommendations"
    ON public.intelligence_recommendations FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Veterinarians and Admins can update recommendations"
    ON public.intelligence_recommendations FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_id = auth.uid()
            AND role IN ('veterinarian', 'admin')
        )
    );

CREATE POLICY "Public read on surveillance reports"
    ON public.surveillance_reports FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins and Veterinarians can create surveillance reports"
    ON public.surveillance_reports FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_id = auth.uid()
            AND role IN ('veterinarian', 'admin')
        )
    );
