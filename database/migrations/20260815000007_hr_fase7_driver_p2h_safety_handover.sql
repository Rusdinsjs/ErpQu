
-- ============================================================
-- MIGRATION: 20260815000007 - HR Fase 7: Driver Assignments, P2H Inspection, Safety & Handover
-- ============================================================

-- 1. DRIVER & OPERATOR VEHICLE ASSIGNMENTS
CREATE TABLE IF NOT EXISTS hr_driver_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    return_date DATE,
    start_odometer NUMERIC(12,2) DEFAULT 0.0,
    end_odometer NUMERIC(12,2),
    sim_sio_verified BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'returned'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_driver_assign_emp ON hr_driver_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_driver_assign_asset ON hr_driver_assignments(asset_id);
CREATE INDEX IF NOT EXISTS idx_hr_driver_assign_status ON hr_driver_assignments(status);

-- 2. DAILY PRE-TRIP INSPECTION (P2H - PEMERIKSAAN HARIAN KENDARAAN)
CREATE TABLE IF NOT EXISTS hr_p2h_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES hr_driver_assignments(id) ON DELETE SET NULL,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    odometer_reading NUMERIC(12,2) DEFAULT 0.0,
    hour_meter_reading NUMERIC(12,2) DEFAULT 0.0,
    
    -- Checklist Items (True = Baik/OK, False = Ada Kendala/Defect)
    oil_coolant_ok BOOLEAN NOT NULL DEFAULT TRUE,
    brakes_ok BOOLEAN NOT NULL DEFAULT TRUE,
    tires_ok BOOLEAN NOT NULL DEFAULT TRUE,
    lights_horn_ok BOOLEAN NOT NULL DEFAULT TRUE,
    safety_gear_ok BOOLEAN NOT NULL DEFAULT TRUE,
    
    overall_status VARCHAR(30) NOT NULL DEFAULT 'fit_to_operate', -- 'fit_to_operate', 'needs_minor_repair', 'grounded_unsafe'
    notes_defect TEXT,
    inspector_signature VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_p2h_emp ON hr_p2h_inspections(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_p2h_asset ON hr_p2h_inspections(asset_id);
CREATE INDEX IF NOT EXISTS idx_hr_p2h_status ON hr_p2h_inspections(overall_status);

-- 3. DRIVER SAFETY VIOLATIONS & INCIDENTS LOG
CREATE TABLE IF NOT EXISTS hr_driver_safety_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
    violation_type VARCHAR(50) NOT NULL, -- 'overspeeding', 'fatigue_sleep', 'reckless_driving', 'collision', 'sop_k3_breach'
    severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    location_site VARCHAR(150) NOT NULL DEFAULT 'Main Hauling Road / Site Area',
    speed_kmh NUMERIC(5,2),
    damage_cost_estimate NUMERIC(15,2) DEFAULT 0.0,
    description TEXT NOT NULL,
    disciplinary_action_id UUID REFERENCES hr_disciplinary_actions(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'action_taken', -- 'investigating', 'action_taken', 'closed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_safety_emp ON hr_driver_safety_incidents(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_safety_date ON hr_driver_safety_incidents(incident_date);

-- 4. VEHICLE HANDOVER (BERITA ACARA SERAH TERIMA UNIT)
CREATE TABLE IF NOT EXISTS hr_vehicle_handovers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    from_employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    to_employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    handover_date DATE NOT NULL DEFAULT CURRENT_DATE,
    odometer NUMERIC(12,2) NOT NULL DEFAULT 0.0,
    fuel_level_fraction VARCHAR(10) NOT NULL DEFAULT '1/1', -- '1/4', '1/2', '3/4', '1/1'
    body_condition VARCHAR(50) NOT NULL DEFAULT 'Bersih & Normal',
    toolkit_complete BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'completed', -- 'completed', 'disputed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_handover_asset ON hr_vehicle_handovers(asset_id);

-- 5. Seed Initial Data
INSERT INTO hr_driver_assignments (
    id, employee_id, asset_id, assigned_date, start_odometer, sim_sio_verified, status, notes
) VALUES (
    '60000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000004', -- Ahmad Fauzi
    (SELECT id FROM assets LIMIT 1),
    '2026-08-01',
    12450.0,
    TRUE,
    'active',
    'Penugasan unit operasional utama tambang'
) ON CONFLICT DO NOTHING;

INSERT INTO hr_p2h_inspections (
    assignment_id, employee_id, asset_id, inspection_date, odometer_reading, hour_meter_reading,
    oil_coolant_ok, brakes_ok, tires_ok, lights_horn_ok, safety_gear_ok, overall_status, inspector_signature
) VALUES (
    '60000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000004',
    (SELECT id FROM assets LIMIT 1),
    CURRENT_DATE,
    12550.0,
    1840.5,
    TRUE, TRUE, TRUE, TRUE, TRUE,
    'fit_to_operate',
    'Ahmad Fauzi (Operator)'
) ON CONFLICT DO NOTHING;

INSERT INTO hr_driver_safety_incidents (
    employee_id, asset_id, incident_date, violation_type, severity, location_site, speed_kmh, description, status
) VALUES (
    'e0000000-0000-0000-0000-000000000004',
    (SELECT id FROM assets LIMIT 1),
    CURRENT_DATE - INTERVAL '2 days',
    'overspeeding',
    'medium',
    'Jalur Hauling Km 14',
    72.5,
    'Terdeteksi GPS Telemetri melaju 72.5 km/jam di zona batas maksimal 50 km/jam.',
    'action_taken'
) ON CONFLICT DO NOTHING;
