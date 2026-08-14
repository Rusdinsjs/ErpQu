
-- ============================================================
-- MIGRATION: 20260815000004 - HR Fase 4: Indonesian Payroll, BPJS & PPh 21 TER
-- ============================================================

-- 1. SALARY COMPONENTS
CREATE TABLE IF NOT EXISTS hr_salary_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) UNIQUE NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL, -- 'earning' or 'deduction'
    is_taxable BOOLEAN NOT NULL DEFAULT TRUE,
    depends_on_payment_days BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Standard Indonesian Salary Components
INSERT INTO hr_salary_components (name, code, description, type, is_taxable, depends_on_payment_days) VALUES
    ('Gaji Pokok', 'BASIC', 'Gaji pokok bulanan karyawan', 'earning', TRUE, TRUE),
    ('Tunjangan Jabatan', 'TUNJ_JABATAN', 'Tunjangan fungsional/struktural jabatan', 'earning', TRUE, FALSE),
    ('Tunjangan Transportasi', 'TUNJ_TRANSPORT', 'Tunjangan kehadiran & transportasi', 'earning', TRUE, TRUE),
    ('Tunjangan Uang Makan', 'TUNJ_MAKAN', 'Tunjangan makan harian kerja', 'earning', TRUE, TRUE),
    ('Upah Lembur (SPKL)', 'LEMBUR', 'Akumulasi upah lembur resmi Depnaker', 'earning', TRUE, FALSE),
    ('Insentif & Bonus', 'BONUS', 'Bonus performa atau insentif proyek', 'earning', TRUE, FALSE),
    ('Iuran BPJS Kesehatan (1%)', 'POT_BPJS_KES', 'Potongan BPJS Kesehatan pekerja (1%)', 'deduction', FALSE, FALSE),
    ('Iuran BPJS JHT (2%)', 'POT_BPJS_JHT', 'Potongan Jaminan Hari Tua pekerja (2%)', 'deduction', FALSE, FALSE),
    ('Iuran BPJS JP (1%)', 'POT_BPJS_JP', 'Potongan Jaminan Pensiun pekerja (1%)', 'deduction', FALSE, FALSE),
    ('Potongan Pajak PPh 21 (TER)', 'POT_PPH21', 'Potongan Pajak Penghasilan Pasal 21 Bulanan', 'deduction', FALSE, FALSE),
    ('Potongan Kasbon / Pinjaman', 'POT_KASBON', 'Cicilan pengembalian kasbon/pinjaman', 'deduction', FALSE, FALSE),
    ('Potongan Absensi / Unpaid Leave', 'POT_ABSENSI', 'Pemotongan gaji atas ketidakhadiran tanpa upah', 'deduction', FALSE, FALSE)
ON CONFLICT (code) DO NOTHING;

-- 2. SALARY STRUCTURES
CREATE TABLE IF NOT EXISTS hr_salary_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) UNIQUE NOT NULL,
    description TEXT,
    payroll_frequency VARCHAR(20) NOT NULL DEFAULT 'monthly',
    currency VARCHAR(10) NOT NULL DEFAULT 'IDR',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Standard Salary Structures
INSERT INTO hr_salary_structures (id, name, code, description) VALUES
    ('10000000-0000-0000-0000-000000000001', 'Struktur Gaji Standar Staff & Operasional (G1-G3)', 'STR-STAFF', 'Struktur gaji pokok + tunjangan transport dan makan'),
    ('10000000-0000-0000-0000-000000000002', 'Struktur Gaji Manajerial & Eksekutif (G4-G7)', 'STR-MGR', 'Struktur gaji pokok + tunjangan jabatan + tunjangan operasional')
ON CONFLICT (code) DO NOTHING;

-- 3. SALARY STRUCTURE ASSIGNMENTS (PER EMPLOYEE)
CREATE TABLE IF NOT EXISTS hr_salary_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    salary_structure_id UUID NOT NULL REFERENCES hr_salary_structures(id) ON DELETE RESTRICT,
    from_date DATE NOT NULL,
    base_salary NUMERIC(15,2) NOT NULL,
    tunjangan_jabatan NUMERIC(15,2) NOT NULL DEFAULT 0.0,
    tunjangan_transport NUMERIC(15,2) NOT NULL DEFAULT 0.0,
    tunjangan_makan NUMERIC(15,2) NOT NULL DEFAULT 0.0,
    ptkp_status VARCHAR(10) NOT NULL DEFAULT 'TK/0', -- TK/0, TK/1, TK/2, TK/3, K/0, K/1, K/2, K/3
    has_npwp BOOLEAN NOT NULL DEFAULT TRUE,
    npwp_number VARCHAR(30),
    bpjs_kes_number VARCHAR(30),
    bpjs_tk_number VARCHAR(30),
    bank_name VARCHAR(50) DEFAULT 'Bank Mandiri',
    bank_account VARCHAR(50) DEFAULT '123-456-7890',
    bank_account_holder VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_emp_salary_assignment UNIQUE (employee_id, from_date)
);

CREATE INDEX IF NOT EXISTS idx_hr_sal_assign_emp ON hr_salary_assignments(employee_id);

-- 4. PAYROLL ENTRIES (BATCH PAYROLL RUN)
CREATE TABLE IF NOT EXISTS hr_payroll_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    posting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'calculated', 'submitted', 'cancelled'
    total_gross_pay NUMERIC(15,2) NOT NULL DEFAULT 0.0,
    total_deductions NUMERIC(15,2) NOT NULL DEFAULT 0.0,
    total_net_pay NUMERIC(15,2) NOT NULL DEFAULT 0.0,
    total_employees INT NOT NULL DEFAULT 0,
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SALARY SLIPS
CREATE TABLE IF NOT EXISTS hr_salary_slips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_entry_id UUID REFERENCES hr_payroll_entries(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    posting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Earnings
    base_salary NUMERIC(15,2) NOT NULL,
    tunjangan_jabatan NUMERIC(15,2) NOT NULL DEFAULT 0.0,
    tunjangan_transport NUMERIC(15,2) NOT NULL DEFAULT 0.0,
    tunjangan_makan NUMERIC(15,2) NOT NULL DEFAULT 0.0,
    overtime_hours NUMERIC(5,2) NOT NULL DEFAULT 0.0,
    overtime_pay NUMERIC(15,2) NOT NULL DEFAULT 0.0,
    other_earnings NUMERIC(15,2) NOT NULL DEFAULT 0.0,
    gross_pay NUMERIC(15,2) NOT NULL DEFAULT 0.0,
    
    -- BPJS & Taxes (Employee & Company Contributions)
    bpjs_kes_employee NUMERIC(15,2) NOT NULL DEFAULT 0.0,
    bpjs_kes_company NUMERIC(15,2) NOT NULL DEFAULT 0.0,
    bpjs_jht_employee NUMERIC(15,2) NOT NULL DEFAULT 0.0,
    bpjs_jht_company NUMERIC(15,2) NOT NULL DEFAULT 0.0,
    bpjs_jp_employee NUMERIC(15,2) NOT NULL DEFAULT 0.0,
    bpjs_jp_company NUMERIC(15,2) NOT NULL DEFAULT 0.0,
    bpjs_jkk_company NUMERIC(15,2) NOT NULL DEFAULT 0.0,
    bpjs_jkm_company NUMERIC(15,2) NOT NULL DEFAULT 0.0,
    
    -- PPh 21 TER
    ptkp_status VARCHAR(10) NOT NULL DEFAULT 'TK/0',
    pph21_ter_category VARCHAR(5) NOT NULL DEFAULT 'A', -- A, B, or C
    pph21_ter_rate NUMERIC(5,4) NOT NULL DEFAULT 0.0,
    pph21_amount NUMERIC(15,2) NOT NULL DEFAULT 0.0,
    
    -- Deductions & Net Pay
    kasbon_deduction NUMERIC(15,2) NOT NULL DEFAULT 0.0,
    unpaid_leave_deduction NUMERIC(15,2) NOT NULL DEFAULT 0.0,
    total_deductions NUMERIC(15,2) NOT NULL DEFAULT 0.0,
    net_pay NUMERIC(15,2) NOT NULL DEFAULT 0.0,
    
    -- Status & Bank Details
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'submitted', 'paid'
    bank_name VARCHAR(50),
    bank_account VARCHAR(50),
    bank_account_holder VARCHAR(100),
    payment_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_slip_emp_period UNIQUE (employee_id, start_date, end_date)
);

CREATE INDEX IF NOT EXISTS idx_hr_slip_emp ON hr_salary_slips(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_slip_entry ON hr_salary_slips(payroll_entry_id);
CREATE INDEX IF NOT EXISTS idx_hr_slip_dates ON hr_salary_slips(start_date, end_date);

-- 6. Seed Salary Assignments for All 10 Demo Employees
INSERT INTO hr_salary_assignments (
    employee_id, salary_structure_id, from_date, base_salary, tunjangan_jabatan, tunjangan_transport, tunjangan_makan, ptkp_status, npwp_number, bank_name, bank_account, bank_account_holder
)
VALUES
    ('e0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '2026-01-01', 15000000, 3500000, 1000000, 1000000, 'K/1', '01.234.567.8-011.000', 'Bank Mandiri', '123-00-1122334', 'Admin User'),
    ('e0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '2026-01-01', 12000000, 2500000, 800000, 800000, 'K/2', '01.234.567.8-012.000', 'BCA', '542-019-8811', 'Budi Santoso'),
    ('e0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', '2026-01-01', 11000000, 2000000, 800000, 800000, 'K/1', '01.234.567.8-013.000', 'BNI', '023-456-7891', 'Siti Rahmawati'),
    ('e0000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '2026-01-01', 8500000, 1000000, 600000, 600000, 'TK/0', '01.234.567.8-014.000', 'Bank Mandiri', '123-00-4455667', 'Ahmad Fauzi'),
    ('e0000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '2026-01-01', 8000000, 1000000, 600000, 600000, 'K/0', '01.234.567.8-015.000', 'BCA', '542-019-9922', 'Dewi Lestari'),
    ('e0000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', '2026-01-01', 7500000, 750000, 500000, 500000, 'TK/0', '01.234.567.8-016.000', 'BRI', '112-233-4455', 'Eko Prasetyo'),
    ('e0000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', '2026-01-01', 7000000, 500000, 500000, 500000, 'K/1', '01.234.567.8-017.000', 'Bank Mandiri', '123-00-7788990', 'Rina Wulandari'),
    ('e0000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001', '2026-01-01', 6500000, 500000, 500000, 500000, 'TK/0', '01.234.567.8-018.000', 'BCA', '542-019-3344', 'Hendra Wijaya'),
    ('e0000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', '2026-01-01', 6000000, 300000, 400000, 400000, 'TK/1', '01.234.567.8-019.000', 'BNI', '023-456-1122', 'Maya Putri'),
    ('e0000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001', '2026-01-01', 6000000, 300000, 400000, 400000, 'K/0', '01.234.567.8-020.000', 'Bank Mandiri', '123-00-9900112', 'Doni Kusuma')
ON CONFLICT (employee_id, from_date) DO NOTHING;
