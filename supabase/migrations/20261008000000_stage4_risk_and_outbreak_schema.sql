-- ============================================================
-- PASHURAKSHA (पशुरक्षा) — STAGE 4 DATABASE SCHEMA & MIGRATIONS
-- Module: Health Risk Engine + Early Outbreak Detection
-- Standard: PostgreSQL 15+ / Supabase
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. RISK ASSESSMENTS TABLE
-- Stores transparent, explainable 0–100 risk evaluations for health cases
-- ============================================================
CREATE TABLE IF NOT EXISTS public.risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES public.veterinary_cases(id) ON DELETE CASCADE,
    animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    symptom_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    severity_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    cluster_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    mortality_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    affected_animal_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    factors JSONB NOT NULL DEFAULT '{}'::jsonb,
    reasons TEXT[] NOT NULL DEFAULT '{}',
    recommended_action TEXT NOT NULL DEFAULT 'Veterinary review recommended',
    engine_version TEXT NOT NULL DEFAULT 'risk-engine-v1',
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_case_id ON public.risk_assessments(case_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_animal_id ON public.risk_assessments(animal_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_risk_level ON public.risk_assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_risk_score ON public.risk_assessments(risk_score);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_calculated_at ON public.risk_assessments(calculated_at);

-- ============================================================
-- 2. OUTBREAK CLUSTERS TABLE
-- Spatio-temporal clusters of livestock health signals
-- ============================================================
CREATE TABLE IF NOT EXISTS public.outbreak_clusters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cluster_code TEXT NOT NULL UNIQUE,
    cluster_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN (
        'Detected',
        'Under Investigation',
        'Escalated',
        'Monitoring',
        'Dismissed',
        'Confirmed'
    )) DEFAULT 'Detected',
    risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) DEFAULT 'HIGH',
    cluster_score INTEGER NOT NULL CHECK (cluster_score >= 0 AND cluster_score <= 100),
    case_count INTEGER NOT NULL DEFAULT 1,
    affected_animal_count INTEGER NOT NULL DEFAULT 1,
    affected_village_count INTEGER NOT NULL DEFAULT 1,
    common_symptoms TEXT[] NOT NULL DEFAULT '{}',
    center_latitude NUMERIC(10, 7) NOT NULL,
    center_longitude NUMERIC(10, 7) NOT NULL,
    radius_km NUMERIC(5, 2) NOT NULL DEFAULT 5.0,
    affected_villages TEXT[] NOT NULL DEFAULT '{}',
    first_case_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_case_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    investigation_notes TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outbreak_clusters_status ON public.outbreak_clusters(status);
CREATE INDEX IF NOT EXISTS idx_outbreak_clusters_risk_level ON public.outbreak_clusters(risk_level);
CREATE INDEX IF NOT EXISTS idx_outbreak_clusters_cluster_score ON public.outbreak_clusters(cluster_score);
CREATE INDEX IF NOT EXISTS idx_outbreak_clusters_lat_lon ON public.outbreak_clusters(center_latitude, center_longitude);
CREATE INDEX IF NOT EXISTS idx_outbreak_clusters_created_at ON public.outbreak_clusters(created_at);

-- ============================================================
-- 3. CLUSTER CASES LINK TABLE
-- Connects individual veterinary cases to detected clusters
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cluster_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cluster_id UUID NOT NULL REFERENCES public.outbreak_clusters(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES public.veterinary_cases(id) ON DELETE CASCADE,
    distance_to_center_km NUMERIC(5, 2) DEFAULT 0,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_cluster_case UNIQUE (cluster_id, case_id)
);

CREATE INDEX IF NOT EXISTS idx_cluster_cases_cluster_id ON public.cluster_cases(cluster_id);
CREATE INDEX IF NOT EXISTS idx_cluster_cases_case_id ON public.cluster_cases(case_id);

-- ============================================================
-- 4. INTELLIGENCE ALERTS TABLE
-- Early outbreak notifications and high-risk alerts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.intelligence_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN (
        'POSSIBLE_OUTBREAK',
        'ELEVATED_CLUSTER',
        'HIGH_RISK_CASE',
        'MORTALITY_SPIKE',
        'LAB_CONFIRMATION'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    cluster_id UUID REFERENCES public.outbreak_clusters(id) ON DELETE SET NULL,
    case_id UUID REFERENCES public.veterinary_cases(id) ON DELETE SET NULL,
    target_role TEXT NOT NULL CHECK (target_role IN ('veterinarian', 'admin', 'all')) DEFAULT 'veterinarian',
    target_district TEXT,
    target_village TEXT,
    message TEXT NOT NULL,
    recommended_action TEXT,
    status TEXT NOT NULL CHECK (status IN ('Active', 'Acknowledged', 'Dismissed')) DEFAULT 'Active',
    acknowledged_by TEXT,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_alerts_status ON public.intelligence_alerts(status);
CREATE INDEX IF NOT EXISTS idx_intelligence_alerts_severity ON public.intelligence_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_intelligence_alerts_alert_type ON public.intelligence_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_intelligence_alerts_target_role ON public.intelligence_alerts(target_role);
CREATE INDEX IF NOT EXISTS idx_intelligence_alerts_created_at ON public.intelligence_alerts(created_at);

-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict role separation maintaining clinical authority & privacy
-- ============================================================
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbreak_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cluster_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_alerts ENABLE ROW LEVEL SECURITY;

-- Risk assessments: Farmers can only see risk assessments for their own livestock
CREATE POLICY "Farmers can read their own animal risk assessments"
    ON public.risk_assessments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.animals a
            WHERE a.id = risk_assessments.animal_id AND a.owner_id = auth.uid()
        )
    );

-- Veterinarians & Admins can read all risk assessments
CREATE POLICY "Vets and Admins can read all risk assessments"
    ON public.risk_assessments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('veterinarian', 'admin')
        )
    );

-- Vets and Admins can create and update risk assessments
CREATE POLICY "Vets and Admins can write risk assessments"
    ON public.risk_assessments FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('veterinarian', 'admin')
        )
    );

-- Outbreak clusters: Vets and Admins full access
CREATE POLICY "Vets and Admins access outbreak clusters"
    ON public.outbreak_clusters FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('veterinarian', 'admin')
        )
    );

-- Cluster cases: Vets and Admins full access
CREATE POLICY "Vets and Admins access cluster cases"
    ON public.cluster_cases FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('veterinarian', 'admin')
        )
    );

-- Intelligence alerts: Vets and Admins access
CREATE POLICY "Vets and Admins access intelligence alerts"
    ON public.intelligence_alerts FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('veterinarian', 'admin')
        )
    );

-- Audit log trigger for automatic updated_at timestamp on clusters
CREATE OR REPLACE FUNCTION public.handle_outbreak_cluster_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_outbreak_cluster_updated ON public.outbreak_clusters;
CREATE TRIGGER trg_outbreak_cluster_updated
    BEFORE UPDATE ON public.outbreak_clusters
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_outbreak_cluster_updated();
