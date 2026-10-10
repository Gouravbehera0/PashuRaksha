-- ============================================================
-- PASHURAKSHA (पशुरक्षा) — STAGE 6 DATABASE SCHEMA & MIGRATIONS
-- Module: Rural Accessibility, Offline Idempotency & Sync Keys
-- Standard: PostgreSQL 15+ / Supabase
-- ============================================================

-- Add idempotency_key to symptom_reports to prevent duplicate submissions on retry
ALTER TABLE public.symptom_reports
ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_symptom_reports_idempotency_key
ON public.symptom_reports(idempotency_key);

-- Add idempotency_key to mortality_reports
ALTER TABLE public.mortality_reports
ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_mortality_reports_idempotency_key
ON public.mortality_reports(idempotency_key);

-- Add client_submission_id to veterinary_cases
ALTER TABLE public.veterinary_cases
ADD COLUMN IF NOT EXISTS client_submission_id TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_veterinary_cases_client_submission_id
ON public.veterinary_cases(client_submission_id);

-- Add location_verification_type to track GPS vs Manual vs Unavailable
ALTER TABLE public.symptom_reports
ADD COLUMN IF NOT EXISTS location_type TEXT DEFAULT 'GPS LOCATION'
CHECK (location_type IN ('GPS LOCATION', 'MANUALLY ENTERED LOCATION', 'LOCATION UNAVAILABLE'));

ALTER TABLE public.mortality_reports
ADD COLUMN IF NOT EXISTS location_type TEXT DEFAULT 'GPS LOCATION'
CHECK (location_type IN ('GPS LOCATION', 'MANUALLY ENTERED LOCATION', 'LOCATION UNAVAILABLE'));
