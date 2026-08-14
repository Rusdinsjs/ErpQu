-- ============================================================
-- MIGRATION: 20260815000002 - HR Fase 2: Shift, Attendance & Overtime
-- ============================================================
-- Diselaraskan dengan tabel yang sudah ada:
--   employees, locations, attendance_records, users
-- ============================================================

-- ============================================================
-- 1. MASTER SHIFT (HR_SHIFT_TYPES)
-- ============================================================
CREATE TABLE IF NOT EXISTS hr_shift_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) UNIQUE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    late_tolerance_minutes INT NOT NULL DEFAULT 15,
    early_exit_tolerance_minutes INT NOT NULL DEFAULT 0,
    break_start_time TIME,
    break_end_time TIME,
    is_night_shift BOOLEAN NOT NULL DEFAULT FALSE,
    color VARCHAR(20) DEFAULT '#3B82F6',
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_shifts_active ON hr_shift_types(is_active);

-- Seed default shifts
INSERT INTO hr_shift_types (name, code, start_time, end_time, late_tolerance_minutes, color, description)
VALUES
    ('Shift Normal (Office)', 'OFFICE', '08:00:00', '17:00:00', 15, '#3B82F6', 'Jam kerja kantor standar Senin - Jumat'),
    ('Shift 1 (Pagi)', 'SHIFT-1', '06:00:00', '14:00:00', 10, '#10B981', 'Shift operasional pagi'),
    ('Shift 2 (Siang)', 'SHIFT-2', '14:00:00', '22:00:00', 10, '#F59E0B', 'Shift operasional siang-sore'),
    ('Shift 3 (Malam)', 'SHIFT-3', '22:00:00', '06:00:00', 10, '#8B5CF6', 'Shift operasional malam (overnight)')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 2. PENUGASAN SHIFT (HR_SHIFT_ASSIGNMENTS)
-- ============================================================
CREATE TABLE IF NOT EXISTS hr_shift_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    shift_type_id UUID NOT NULL REFERENCES hr_shift_types(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_shift_assign_emp ON hr_shift_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_shift_assign_dates ON hr_shift_assignments(start_date, end_date);

-- ============================================================
-- 3. PERMOHONAN KOREKSI ABSEN / DINAS LUAR (HR_ATTENDANCE_REQUESTS)
-- ============================================================
CREATE TABLE IF NOT EXISTS hr_attendance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    request_type VARCHAR(30) NOT NULL,
    attendance_date DATE NOT NULL,
    requested_check_in TIMESTAMPTZ,
    requested_check_out TIMESTAMPTZ,
    reason TEXT NOT NULL,
    attachment_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_att_req_emp ON hr_attendance_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_att_req_status ON hr_attendance_requests(status);
CREATE INDEX IF NOT EXISTS idx_hr_att_req_date ON hr_attendance_requests(attendance_date);

-- ============================================================
-- 4. SPKL / SURAT PERINTAH KERJA LEMBUR (HR_OVERTIME_REQUESTS)
-- ============================================================
CREATE TABLE IF NOT EXISTS hr_overtime_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    overtime_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    planned_hours NUMERIC(4,2) NOT NULL,
    actual_hours NUMERIC(4,2),
    reason TEXT NOT NULL,
    task_description TEXT,
    is_holiday BOOLEAN NOT NULL DEFAULT FALSE,
    
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    rate_multiplier NUMERIC(4,2),
    hourly_rate NUMERIC(15,2),
    calculated_overtime_pay NUMERIC(15,2),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_overtime_emp ON hr_overtime_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_overtime_status ON hr_overtime_requests(status);
CREATE INDEX IF NOT EXISTS idx_hr_overtime_date ON hr_overtime_requests(overtime_date);

-- ============================================================
-- 5. EXTEND ATTENDANCE_RECORDS TABLE
-- ============================================================
ALTER TABLE attendance_records
    ADD COLUMN IF NOT EXISTS shift_type_id UUID REFERENCES hr_shift_types(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS late_minutes INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS early_exit_minutes INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS work_hours NUMERIC(4,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS overtime_hours NUMERIC(4,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS attendance_status VARCHAR(30) DEFAULT 'present';

CREATE INDEX IF NOT EXISTS idx_attendance_records_shift ON attendance_records(shift_type_id);
