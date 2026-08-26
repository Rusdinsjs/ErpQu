
-- 1. MASTER LEAVE TYPES
CREATE TABLE IF NOT EXISTS hr_leave_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) UNIQUE NOT NULL,
    description TEXT,
    max_days_allowed INT NOT NULL DEFAULT 12,
    applicable_after_working_days INT NOT NULL DEFAULT 0,
    is_carry_forward BOOLEAN NOT NULL DEFAULT FALSE,
    max_carry_forward_days INT NOT NULL DEFAULT 0,
    is_encashable BOOLEAN NOT NULL DEFAULT FALSE,
    is_earned_leave BOOLEAN NOT NULL DEFAULT FALSE,
    is_unpaid BOOLEAN NOT NULL DEFAULT FALSE,
    allow_half_day BOOLEAN NOT NULL DEFAULT TRUE,
    color VARCHAR(20) DEFAULT '#10B981',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_leave_types_active ON hr_leave_types(is_active);

-- Seed Standard Indonesian Leave Types
INSERT INTO hr_leave_types (name, code, description, max_days_allowed, is_carry_forward, max_carry_forward_days, is_encashable, is_unpaid, allow_half_day, color) VALUES
    ('Cuti Tahunan', 'ANNUAL', 'Hak cuti tahunan karyawan (12 hari kerja per tahun)', 12, TRUE, 6, TRUE, FALSE, TRUE, '#10B981'),
    ('Cuti Sakit', 'SICK', 'Izin sakit dengan surat keterangan dokter (SKD)', 14, FALSE, 0, FALSE, FALSE, TRUE, '#EF4444'),
    ('Cuti Melahirkan', 'MATERNITY', 'Cuti melahirkan untuk karyawati (3 bulan / 90 hari)', 90, FALSE, 0, FALSE, FALSE, FALSE, '#EC4899'),
    ('Cuti Istri Melahirkan', 'PATERNITY', 'Cuti pendampingan persalinan istri (2 hari kerja)', 2, FALSE, 0, FALSE, FALSE, FALSE, '#8B5CF6'),
    ('Cuti Menikah', 'MARRIAGE', 'Cuti pernikahan karyawan yang bersangkutan (3 hari kerja)', 3, FALSE, 0, FALSE, FALSE, FALSE, '#F59E0B'),
    ('Cuti Anggota Keluarga Meninggal', 'BEREAVEMENT', 'Cuti duka cita anggota keluarga inti meninggal dunia (2 hari)', 2, FALSE, 0, FALSE, FALSE, FALSE, '#6B7280'),
    ('Cuti Tanpa Upah (Unpaid Leave)', 'UNPAID', 'Izin tidak masuk kerja di luar hak cuti berbayar', 30, FALSE, 0, FALSE, TRUE, TRUE, '#9CA3AF')
ON CONFLICT (code) DO NOTHING;

-- 2. HOLIDAY LISTS & HOLIDAYS
CREATE TABLE IF NOT EXISTS hr_holiday_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    holiday_list_id UUID NOT NULL REFERENCES hr_holiday_lists(id) ON DELETE CASCADE,
    holiday_date DATE NOT NULL,
    description VARCHAR(255) NOT NULL,
    is_weekly_off BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_holiday_list_date UNIQUE (holiday_list_id, holiday_date)
);

CREATE INDEX IF NOT EXISTS idx_hr_holidays_date ON hr_holidays(holiday_date);

-- Seed Default 2026 Indonesian Holiday List
INSERT INTO hr_holiday_lists (id, name, from_date, to_date, is_default) VALUES
    ('00000000-0000-0000-0000-000000000081', 'Hari Libur Nasional Indonesia 2026', '2026-01-01', '2026-12-31', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hr_holidays (holiday_list_id, holiday_date, description, is_weekly_off) VALUES
    ('00000000-0000-0000-0000-000000000081', '2026-01-01', 'Tahun Baru 2026 Masehi', FALSE),
    ('00000000-0000-0000-0000-000000000081', '2026-01-16', 'Isra Miraj Nabi Muhammad SAW', FALSE),
    ('00000000-0000-0000-0000-000000000081', '2026-02-17', 'Tahun Baru Imlek 2577 Kongzili', FALSE),
    ('00000000-0000-0000-0000-000000000081', '2026-03-20', 'Hari Suci Nyepi Tahun Baru Saka 1948', FALSE),
    ('00000000-0000-0000-0000-000000000081', '2026-03-21', 'Hari Raya Idul Fitri 1447 Hijriah (Hari Pertama)', FALSE),
    ('00000000-0000-0000-0000-000000000081', '2026-03-22', 'Hari Raya Idul Fitri 1447 Hijriah (Hari Kedua)', FALSE),
    ('00000000-0000-0000-0000-000000000081', '2026-04-03', 'Wafat Yesus Kristus', FALSE),
    ('00000000-0000-0000-0000-000000000081', '2026-05-01', 'Hari Buruh Internasional', FALSE),
    ('00000000-0000-0000-0000-000000000081', '2026-05-14', 'Kenaikan Yesus Kristus', FALSE),
    ('00000000-0000-0000-0000-000000000081', '2026-05-27', 'Hari Raya Idul Adha 1447 Hijriah', FALSE),
    ('00000000-0000-0000-0000-000000000081', '2026-05-31', 'Hari Raya Waisak 2570 BE', FALSE),
    ('00000000-0000-0000-0000-000000000081', '2026-06-01', 'Hari Lahir Pancasila', FALSE),
    ('00000000-0000-0000-0000-000000000081', '2026-06-16', 'Tahun Baru Islam 1448 Hijriah', FALSE),
    ('00000000-0000-0000-0000-000000000081', '2026-08-17', 'Hari Kemerdekaan Republik Indonesia', FALSE),
    ('00000000-0000-0000-0000-000000000081', '2026-08-25', 'Maulid Nabi Muhammad SAW', FALSE),
    ('00000000-0000-0000-0000-000000000081', '2026-12-25', 'Hari Raya Natal', FALSE)
ON CONFLICT DO NOTHING;

-- 3. LEAVE BLOCK LISTS (BLACKOUT DATES)
CREATE TABLE IF NOT EXISTS hr_leave_block_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    applies_to_all_departments BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_leave_block_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block_list_id UUID NOT NULL REFERENCES hr_leave_block_lists(id) ON DELETE CASCADE,
    block_date DATE NOT NULL,
    reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_block_list_date UNIQUE (block_list_id, block_date)
);

-- 4. LEAVE ALLOCATIONS
CREATE TABLE IF NOT EXISTS hr_leave_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES hr_leave_types(id) ON DELETE RESTRICT,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    total_leaves_allocated NUMERIC(4,1) NOT NULL,
    carry_forwarded_leaves NUMERIC(4,1) NOT NULL DEFAULT 0.0,
    unused_leaves NUMERIC(4,1) NOT NULL DEFAULT 0.0,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_emp_leave_type_period UNIQUE (employee_id, leave_type_id, from_date, to_date)
);

CREATE INDEX IF NOT EXISTS idx_hr_alloc_emp ON hr_leave_allocations(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_alloc_type ON hr_leave_allocations(leave_type_id);

-- 5. LEAVE APPLICATIONS
CREATE TABLE IF NOT EXISTS hr_leave_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES hr_leave_types(id) ON DELETE RESTRICT,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    total_leave_days NUMERIC(4,1) NOT NULL,
    is_half_day BOOLEAN NOT NULL DEFAULT FALSE,
    half_day_date DATE,
    reason TEXT NOT NULL,
    attachment_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    posting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_app_emp ON hr_leave_applications(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_app_status ON hr_leave_applications(status);
CREATE INDEX IF NOT EXISTS idx_hr_app_dates ON hr_leave_applications(from_date, to_date);

-- 6. LEAVE ENCASHMENTS
CREATE TABLE IF NOT EXISTS hr_leave_encashments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES hr_leave_types(id) ON DELETE RESTRICT,
    encashment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    leave_balance NUMERIC(4,1) NOT NULL,
    encashable_days NUMERIC(4,1) NOT NULL,
    encashed_amount NUMERIC(15,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Sample Allocations for Demo Employees (2026 Period)
INSERT INTO hr_leave_allocations (
    employee_id, leave_type_id, from_date, to_date, total_leaves_allocated, carry_forwarded_leaves, unused_leaves
)
SELECT
    e.id,
    lt.id,
    '2026-01-01',
    '2026-12-31',
    lt.max_days_allowed,
    0.0,
    lt.max_days_allowed
FROM employees e
CROSS JOIN hr_leave_types lt
WHERE lt.code = 'ANNUAL'
ON CONFLICT DO NOTHING;
