-- ============================================================
-- PASHURAKSHA (पशुरक्षा) — STAGE 2 DATABASE SCHEMA & MIGRATIONS
-- Module: Farmer Livestock Health Module
-- Standard: PostgreSQL 15+ / Supabase
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    role TEXT NOT NULL CHECK (role IN ('farmer', 'veterinarian', 'admin')) DEFAULT 'farmer',
    village TEXT,
    district TEXT,
    state TEXT,
    address TEXT,
    profile_image TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_id UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ============================================================
-- 2. ANIMALS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.animals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    animal_tag TEXT NOT NULL UNIQUE,
    animal_type TEXT NOT NULL CHECK (animal_type IN ('Cow', 'Buffalo', 'Goat', 'Sheep', 'Poultry', 'Other')),
    breed TEXT,
    gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female')),
    date_of_birth DATE,
    age NUMERIC,
    color TEXT,
    weight NUMERIC,
    location TEXT,
    village TEXT,
    district TEXT,
    photo_url TEXT,
    health_status TEXT NOT NULL CHECK (health_status IN ('Healthy', 'Under Observation', 'High Risk', 'Critical')) DEFAULT 'Healthy',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_animals_owner_id ON public.animals(owner_id);
CREATE INDEX IF NOT EXISTS idx_animals_health_status ON public.animals(health_status);
CREATE INDEX IF NOT EXISTS idx_animals_animal_tag ON public.animals(animal_tag);

-- ============================================================
-- 3. SYMPTOM REPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.symptom_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symptoms TEXT[] NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('Mild', 'Moderate', 'Severe')),
    description TEXT,
    photo_url TEXT,
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    status TEXT NOT NULL CHECK (status IN ('Reported', 'Under Review', 'Veterinary Review', 'Resolved')) DEFAULT 'Reported',
    risk_score NUMERIC, -- Kept null in Stage 2 (no fake AI)
    risk_level TEXT,    -- Kept null in Stage 2 (no fake AI)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_symptom_reports_owner_id ON public.symptom_reports(owner_id);
CREATE INDEX IF NOT EXISTS idx_symptom_reports_animal_id ON public.symptom_reports(animal_id);
CREATE INDEX IF NOT EXISTS idx_symptom_reports_status ON public.symptom_reports(status);

-- ============================================================
-- 4. MORTALITY REPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mortality_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cause_description TEXT,
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    photo_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('Reported', 'Under Review', 'Verified')) DEFAULT 'Reported',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mortality_reports_owner_id ON public.mortality_reports(owner_id);
CREATE INDEX IF NOT EXISTS idx_mortality_reports_animal_id ON public.mortality_reports(animal_id);

-- ============================================================
-- 5. VACCINATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vaccinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vaccine_name TEXT NOT NULL,
    vaccination_date DATE NOT NULL,
    next_due_date DATE,
    administered_by TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vaccinations_owner_id ON public.vaccinations(owner_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_animal_id ON public.vaccinations(animal_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_next_due_date ON public.vaccinations(next_due_date);

-- ============================================================
-- 6. TREATMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.treatments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    condition TEXT NOT NULL,
    medicine TEXT NOT NULL,
    dosage TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    veterinarian_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_treatments_owner_id ON public.treatments(owner_id);
CREATE INDEX IF NOT EXISTS idx_treatments_animal_id ON public.treatments(animal_id);

-- ============================================================
-- 7. ALERTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('Health', 'Vaccination', 'Veterinary', 'Outbreak', 'System')),
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'danger', 'critical')) DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON public.alerts(is_read);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: Farmers can ONLY access their own records!
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mortality_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile (cannot change role)"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id AND
        role = (SELECT role FROM public.profiles WHERE user_id = auth.uid())
    );

-- 2. Animals Policies
CREATE POLICY "Farmers can view own animals"
    ON public.animals FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Farmers can insert own animals"
    ON public.animals FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Farmers can update own animals"
    ON public.animals FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Farmers can delete own animals"
    ON public.animals FOR DELETE
    USING (auth.uid() = owner_id);

-- 3. Symptom Reports Policies
CREATE POLICY "Farmers can view own symptom reports"
    ON public.symptom_reports FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Farmers can insert own symptom reports"
    ON public.symptom_reports FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Farmers can update own symptom reports"
    ON public.symptom_reports FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- 4. Mortality Reports Policies
CREATE POLICY "Farmers can view own mortality reports"
    ON public.mortality_reports FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Farmers can insert own mortality reports"
    ON public.mortality_reports FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- 5. Vaccinations Policies
CREATE POLICY "Farmers can view own vaccinations"
    ON public.vaccinations FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Farmers can insert own vaccinations"
    ON public.vaccinations FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- 6. Treatments Policies
CREATE POLICY "Farmers can view own treatments"
    ON public.treatments FOR SELECT
    USING (auth.uid() = owner_id);

-- Treatments cannot be created/altered by farmers directly (vets only in Stage 3)

-- 7. Alerts Policies
CREATE POLICY "Users can view own alerts"
    ON public.alerts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alert read status"
    ON public.alerts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- HELPER FUNCTIONS & TRIGGERS
-- ============================================================

-- Function to generate human-readable animal tag (e.g. PR-COW-001)
CREATE OR REPLACE FUNCTION public.generate_animal_tag(type_name TEXT)
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    seq_val INT;
    tag TEXT;
BEGIN
    CASE UPPER(type_name)
        WHEN 'COW' THEN prefix := 'PR-COW';
        WHEN 'BUFFALO' THEN prefix := 'PR-BUF';
        WHEN 'GOAT' THEN prefix := 'PR-GOT';
        WHEN 'SHEEP' THEN prefix := 'PR-SHP';
        WHEN 'POULTRY' THEN prefix := 'PR-PLT';
        ELSE prefix := 'PR-ANM';
    END CASE;

    SELECT COALESCE(COUNT(*), 0) + 1 INTO seq_val
    FROM public.animals
    WHERE animal_type = type_name;

    tag := prefix || '-' || LPAD(seq_val::TEXT, 3, '0');
    RETURN tag;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_animals_updated_at
    BEFORE UPDATE ON public.animals
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_symptom_reports_updated_at
    BEFORE UPDATE ON public.symptom_reports
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_vaccinations_updated_at
    BEFORE UPDATE ON public.vaccinations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_treatments_updated_at
    BEFORE UPDATE ON public.treatments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
