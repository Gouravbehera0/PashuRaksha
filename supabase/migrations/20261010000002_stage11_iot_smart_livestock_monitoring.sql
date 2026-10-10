-- ============================================================
-- PASHURAKSHA (पशुरक्षा) — STAGE 11 DATABASE MIGRATION
-- Module: IoT & Smart Livestock Health Monitoring System
-- Standard: PostgreSQL 15+ / Supabase RLS / NADRS-II Compatible
-- "Detect Early. Prevent Outbreaks. Protect Livestock."
-- ============================================================

-- ── 1. IOT DEVICES TABLE ──
CREATE TABLE IF NOT EXISTS public.iot_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_eui VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    device_type VARCHAR(64) NOT NULL, -- SMART_EAR_TAG, RUMEN_BOLUS, SMART_COLLAR, LEG_PEDOMETER, ENVIRONMENTAL_SENSOR, HANDHELD_CLINICAL_SCANNER
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    firmware_version VARCHAR(50),
    hardware_version VARCHAR(50),
    battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, OFFLINE, MAINTENANCE, UNREGISTERED
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    owner_id VARCHAR(100) NOT NULL, -- references profiles.user_id or auth.uid()
    assigned_animal_id VARCHAR(100), -- references animals.id
    assigned_animal_tag VARCHAR(100),
    installation_date TIMESTAMPTZ DEFAULT NOW(),
    last_communication_at TIMESTAMPTZ,
    last_measurement_at TIMESTAMPTZ,
    calibration_notes TEXT,
    device_secret_hash VARCHAR(256),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. ANIMAL DEVICE ASSIGNMENTS (AUDIT & REASSIGNMENT HISTORY) ──
CREATE TABLE IF NOT EXISTS public.animal_device_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES public.iot_devices(id) ON DELETE CASCADE,
    animal_id VARCHAR(100) NOT NULL,
    animal_tag VARCHAR(100) NOT NULL,
    owner_id VARCHAR(100) NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unassigned_at TIMESTAMPTZ,
    assignment_reason TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. SENSOR MEASUREMENTS TABLE (HIGH-FREQUENCY TELEMETRY) ──
CREATE TABLE IF NOT EXISTS public.sensor_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES public.iot_devices(id) ON DELETE CASCADE,
    device_eui VARCHAR(64) NOT NULL,
    animal_id VARCHAR(100),
    animal_tag VARCHAR(100),
    owner_id VARCHAR(100),
    measurement_type VARCHAR(64) NOT NULL, -- BODY_TEMPERATURE, ACTIVITY_LEVEL, HEART_RATE, RUMINATION_TIME, AMBIENT_TEMPERATURE, AMBIENT_HUMIDITY, HEAT_INDEX_THI, BATTERY_LEVEL, GPS_LOCATION
    value NUMERIC(10, 2) NOT NULL,
    unit VARCHAR(32) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    quality_status VARCHAR(32) NOT NULL DEFAULT 'VALID', -- VALID, OUT_OF_RANGE, SUSPECT_SPIKE, STALE, INVALID_CHECKSUM, DEMO_DATA
    is_late BOOLEAN NOT NULL DEFAULT FALSE,
    is_flagged_for_review BOOLEAN NOT NULL DEFAULT FALSE,
    flag_reason TEXT,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    idempotency_key VARCHAR(128),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ── 4. SENSOR ALERTS TABLE (CLINICAL TRIAGE & ANOMALIES) ──
CREATE TABLE IF NOT EXISTS public.sensor_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_category VARCHAR(64) NOT NULL, -- HEALTH_MEASUREMENT_REVIEW, REPEATED_ABNORMAL_READINGS, DEVICE_OFFLINE, SENSOR_DATA_INVALID, BATTERY_LOW, DEVICE_MAINTENANCE_REQUIRED
    severity VARCHAR(32) NOT NULL DEFAULT 'MEDIUM', -- CRITICAL, HIGH, MEDIUM, LOW
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, ACKNOWLEDGED, INVESTIGATING, LINKED_TO_CASE, RESOLVED, DISMISSED
    animal_id VARCHAR(100),
    animal_tag VARCHAR(100),
    device_id UUID NOT NULL REFERENCES public.iot_devices(id) ON DELETE CASCADE,
    device_eui VARCHAR(64) NOT NULL,
    triggering_measurement_id UUID REFERENCES public.sensor_measurements(id) ON DELETE SET NULL,
    triggering_value NUMERIC(10, 2),
    triggering_unit VARCHAR(32),
    threshold_rule VARCHAR(128) NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    clinical_note TEXT,
    recommended_action TEXT NOT NULL,
    acknowledged_by VARCHAR(100),
    acknowledged_at TIMESTAMPTZ,
    linked_vet_case_id VARCHAR(100),
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. DEVICE AUDIT EVENTS TABLE ──
CREATE TABLE IF NOT EXISTS public.device_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES public.iot_devices(id) ON DELETE CASCADE,
    device_eui VARCHAR(64) NOT NULL,
    event_type VARCHAR(64) NOT NULL, -- REGISTERED, ASSIGNED, UNASSIGNED, STATUS_CHANGE, BATTERY_CRITICAL, FIRMWARE_UPDATE, INGESTION_ERROR
    severity VARCHAR(32) NOT NULL DEFAULT 'INFO', -- INFO, WARNING, ERROR
    details TEXT NOT NULL,
    actor_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. PERFORMANCE & TIME-SERIES INDEXES ──
CREATE INDEX IF NOT EXISTS idx_iot_devices_owner ON public.iot_devices(owner_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_status ON public.iot_devices(status);
CREATE INDEX IF NOT EXISTS idx_iot_devices_animal ON public.iot_devices(assigned_animal_id);
CREATE INDEX IF NOT EXISTS idx_device_assignments_animal ON public.animal_device_assignments(animal_id);
CREATE INDEX IF NOT EXISTS idx_device_assignments_active ON public.animal_device_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_sensor_meas_device_time ON public.sensor_measurements(device_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_meas_animal_time ON public.sensor_measurements(animal_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_meas_idempotency ON public.sensor_measurements(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sensor_alerts_device ON public.sensor_alerts(device_id);
CREATE INDEX IF NOT EXISTS idx_sensor_alerts_status ON public.sensor_alerts(status);
CREATE INDEX IF NOT EXISTS idx_sensor_alerts_animal ON public.sensor_alerts(animal_id);

-- ── 7. ROW LEVEL SECURITY (RLS) POLICIES ──

ALTER TABLE public.iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_device_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_events ENABLE ROW LEVEL SECURITY;

-- Policy: Farmers can only view and manage their own devices
DROP POLICY IF EXISTS "Farmers view own iot devices" ON public.iot_devices;
CREATE POLICY "Farmers view own iot devices"
    ON public.iot_devices FOR SELECT
    TO authenticated
    USING (
        owner_id = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role IN ('veterinarian', 'admin')
        )
    );

DROP POLICY IF EXISTS "Farmers manage own iot devices" ON public.iot_devices;
CREATE POLICY "Farmers manage own iot devices"
    ON public.iot_devices FOR ALL
    TO authenticated
    USING (
        owner_id = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role IN ('veterinarian', 'admin')
        )
    );

-- Policy: Device assignments access
DROP POLICY IF EXISTS "Farmers view own device assignments" ON public.animal_device_assignments;
CREATE POLICY "Farmers view own device assignments"
    ON public.animal_device_assignments FOR SELECT
    TO authenticated
    USING (
        owner_id = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role IN ('veterinarian', 'admin')
        )
    );

-- Policy: Measurements access
DROP POLICY IF EXISTS "Users view permitted sensor measurements" ON public.sensor_measurements;
CREATE POLICY "Users view permitted sensor measurements"
    ON public.sensor_measurements FOR SELECT
    TO authenticated
    USING (
        owner_id = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role IN ('veterinarian', 'admin')
        )
    );

-- Policy: Alerts access
DROP POLICY IF EXISTS "Users view permitted sensor alerts" ON public.sensor_alerts;
CREATE POLICY "Users view permitted sensor alerts"
    ON public.sensor_alerts FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.iot_devices
            WHERE id = sensor_alerts.device_id AND (
                owner_id = auth.uid()::text
                OR EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE user_id = auth.uid() AND role IN ('veterinarian', 'admin')
                )
            )
        )
    );

DROP POLICY IF EXISTS "Vets and Admins update sensor alerts" ON public.sensor_alerts;
CREATE POLICY "Vets and Admins update sensor alerts"
    ON public.sensor_alerts FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role IN ('veterinarian', 'admin')
        )
    );
