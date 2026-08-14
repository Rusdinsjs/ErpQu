
-- ============================================================
-- MIGRATION: 20260815000005 - HR Fase 5: Loans, Expense Claims & KPI Appraisal
-- ============================================================

-- 1. LOAN TYPES
CREATE TABLE IF NOT EXISTS hr_loan_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) UNIQUE NOT NULL,
    description TEXT,
    max_amount NUMERIC(15,2) NOT NULL DEFAULT 50000000,
    max_tenure_months INT NOT NULL DEFAULT 24,
    interest_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.0, -- Bunga 0% (Kesejahteraan Karyawan)
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Standard Indonesian Loan / Kasbon Types
INSERT INTO hr_loan_types (name, code, description, max_amount, max_tenure_months) VALUES
    ('Kasbon Bulanan (Cash Advance)', 'KASBON', 'Pinjaman kasbon jangka pendek potong gaji bulan berjalan', 5000000, 3),
    ('Pinjaman Darurat & Medis', 'PINJAMAN_EMERGENCY', 'Bantuan pinjaman kebutuhan darurat/kesehatan keluarga', 15000000, 12),
    ('Pinjaman Pendidikan Anak', 'PINJAMAN_PENDIDIKAN', 'Bantuan biaya tahun ajaran baru sekolah/kuliah', 20000000, 12),
    ('Pinjaman Kepemilikan Kendaraan', 'PINJAMAN_KENDARAAN', 'Pinjaman DP motor/mobil operasional karyawan', 35000000, 24)
ON CONFLICT (code) DO NOTHING;

-- 2. EMPLOYEE LOANS
CREATE TABLE IF NOT EXISTS hr_employee_loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    loan_type_id UUID NOT NULL REFERENCES hr_loan_types(id) ON DELETE RESTRICT,
    loan_amount NUMERIC(15,2) NOT NULL,
    monthly_installment NUMERIC(15,2) NOT NULL,
    tenure_months INT NOT NULL,
    start_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'disbursed', 'rejected', 'closed'
    total_paid NUMERIC(15,2) NOT NULL DEFAULT 0.0,
    remaining_balance NUMERIC(15,2) NOT NULL,
    reason TEXT NOT NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    disbursed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_loans_emp ON hr_employee_loans(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_loans_status ON hr_employee_loans(status);

-- 3. LOAN REPAYMENT SCHEDULES (AMORTIZATION)
CREATE TABLE IF NOT EXISTS hr_loan_repayment_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID NOT NULL REFERENCES hr_employee_loans(id) ON DELETE CASCADE,
    installment_no INT NOT NULL,
    due_date DATE NOT NULL,
    installment_amount NUMERIC(15,2) NOT NULL,
    paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0.0,
    status VARCHAR(20) NOT NULL DEFAULT 'unpaid', -- 'unpaid', 'paid', 'payroll_deducted'
    payroll_entry_id UUID REFERENCES hr_payroll_entries(id) ON DELETE SET NULL,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_loan_installment UNIQUE (loan_id, installment_no)
);

CREATE INDEX IF NOT EXISTS idx_hr_repay_loan ON hr_loan_repayment_schedules(loan_id);
CREATE INDEX IF NOT EXISTS idx_hr_repay_due ON hr_loan_repayment_schedules(due_date, status);

-- 4. EXPENSE CLAIM TYPES (REIMBURSEMENT)
CREATE TABLE IF NOT EXISTS hr_expense_claim_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) UNIQUE NOT NULL,
    description TEXT,
    max_amount_per_claim NUMERIC(15,2),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Standard Reimbursement Types
INSERT INTO hr_expense_claim_types (name, code, description, max_amount_per_claim) VALUES
    ('BBM & Transport Operasional', 'TRANSPORT_BBM', 'Klaim bensin, tol, dan parkir dinas luar', 2000000),
    ('Kesehatan & Kacamata', 'MEDICAL', 'Klaim rawat jalan, resep obat, atau frame kacamata', 5000000),
    ('Perjalanan Dinas (Tiket & Hotel)', 'DINAS_LUAR', 'Klaim tiket transportasi dan akomodasi perjalanan dinas', 10000000),
    ('Uang Makan Lembur & Representasi', 'MEAL_REPRESENTASI', 'Konsumsi lembur malam atau meeting dengan klien', 1500000)
ON CONFLICT (code) DO NOTHING;

-- 5. EXPENSE CLAIMS (REIMBURSEMENTS)
CREATE TABLE IF NOT EXISTS hr_expense_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    claim_type_id UUID NOT NULL REFERENCES hr_expense_claim_types(id) ON DELETE RESTRICT,
    claim_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(15,2) NOT NULL,
    description TEXT NOT NULL,
    receipt_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'paid', 'included_in_payroll'
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    payment_method VARCHAR(30) DEFAULT 'payroll_transfer', -- 'payroll_transfer' or 'bank_transfer'
    payment_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_claim_emp ON hr_expense_claims(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_claim_status ON hr_expense_claims(status);

-- 6. PERFORMANCE APPRAISAL & KPI
CREATE TABLE IF NOT EXISTS hr_appraisal_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(150) NOT NULL,
    code VARCHAR(30) UNIQUE NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO hr_appraisal_templates (id, title, code, description) VALUES
    ('20000000-0000-0000-0000-000000000001', 'Standar Penilaian Kinerja Karyawan Operasional & Staff', 'KPI-STAFF', 'Template KPI pencapaian target, disiplin kehadiran, dan inisiatif kerja'),
    ('20000000-0000-0000-0000-000000000002', 'Standar Penilaian Kinerja Manajerial & Supervisor', 'KPI-MGR', 'Template KPI kepemimpinan, pencapaian target divisi, dan pengelolaan anggaran')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS hr_appraisal_template_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES hr_appraisal_templates(id) ON DELETE CASCADE,
    kpi_criteria VARCHAR(200) NOT NULL,
    weight_percentage INT NOT NULL, -- Total per template = 100%
    target_description TEXT
);

INSERT INTO hr_appraisal_template_items (template_id, kpi_criteria, weight_percentage, target_description) VALUES
    ('20000000-0000-0000-0000-000000000001', 'Pencapaian Target Kerja Individu (Output & Akurasi)', 40, 'Menyelesaikan 100% tugas operasional tepat waktu tanpa cacat'),
    ('20000000-0000-0000-0000-000000000001', 'Kedisiplinan Kehadiran & Kepatuhan SOP', 30, 'Tingkat kehadiran >98% dan patuh pada seluruh SOP keselamatan kerja'),
    ('20000000-0000-0000-0000-000000000001', 'Kerjasama Tim & Inisiatif Solutif', 30, 'Aktif berkolaborasi antar divisi dan memberikan solusi kendala lapangan'),
    ('20000000-0000-0000-0000-000000000002', 'Pencapaian KPI Target Divisi / Departemen', 40, 'Target KPI revenue/maintenance tercapai >95%'),
    ('20000000-0000-0000-0000-000000000002', 'Kepemimpinan & Pengembangan Anggota Tim', 30, 'Efektivitas delegasi tugas dan coaching tim kerja'),
    ('20000000-0000-0000-0000-000000000002', 'Efisiensi Operasional & Pengendalian Biaya', 30, 'Menjaga kepatuhan anggaran Opex tanpa pemborosan')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS hr_employee_appraisals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES hr_appraisal_templates(id) ON DELETE RESTRICT,
    cycle_title VARCHAR(150) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    evaluator_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    self_score NUMERIC(5,2) DEFAULT 0.0,
    manager_score NUMERIC(5,2) DEFAULT 0.0,
    final_score NUMERIC(5,2) DEFAULT 0.0,
    final_rating VARCHAR(5), -- 'A' (Sangat Baik >=90), 'B' (Baik >=80), 'C' (Cukup >=70), 'D' (Kurang <70)
    feedback TEXT,
    recommendation TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'completed', -- 'draft', 'self_review', 'manager_review', 'completed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_appraisal_emp ON hr_employee_appraisals(employee_id);

-- 7. Seed Demo Active Loan & Expense Claim & Appraisal
INSERT INTO hr_employee_loans (
    id, employee_id, loan_type_id, loan_amount, monthly_installment, tenure_months, start_date, status, total_paid, remaining_balance, reason, approved_at, disbursed_at
) VALUES (
    '30000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000004', -- Ahmad Fauzi
    (SELECT id FROM hr_loan_types WHERE code = 'KASBON' LIMIT 1),
    3000000, 1000000, 3, '2026-08-01', 'disbursed', 0, 3000000, 'Kebutuhan mendesak perbaikan tempat tinggal', NOW(), NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO hr_loan_repayment_schedules (loan_id, installment_no, due_date, installment_amount, status) VALUES
    ('30000000-0000-0000-0000-000000000001', 1, '2026-08-31', 1000000, 'unpaid'),
    ('30000000-0000-0000-0000-000000000001', 2, '2026-09-30', 1000000, 'unpaid'),
    ('30000000-0000-0000-0000-000000000001', 3, '2026-10-31', 1000000, 'unpaid')
ON CONFLICT (loan_id, installment_no) DO NOTHING;

INSERT INTO hr_expense_claims (
    employee_id, claim_type_id, claim_date, total_amount, description, status, approved_at
) VALUES (
    'e0000000-0000-0000-0000-000000000004', -- Ahmad Fauzi
    (SELECT id FROM hr_expense_claim_types WHERE code = 'TRANSPORT_BBM' LIMIT 1),
    '2026-08-10',
    250000,
    'Penggantian bensin motor inspeksi unit lapangan Cilegon',
    'approved',
    NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO hr_employee_appraisals (
    employee_id, template_id, cycle_title, start_date, end_date, self_score, manager_score, final_score, final_rating, feedback, recommendation, status
) VALUES (
    'e0000000-0000-0000-0000-000000000004', -- Ahmad Fauzi
    '20000000-0000-0000-0000-000000000001',
    'Evaluasi Kinerja Semester I - 2026',
    '2026-01-01',
    '2026-06-30',
    90.0,
    94.0,
    92.0,
    'A',
    'Performa kerja teknis sangat memuaskan dan selalu sigap menangani kendala armada.',
    'Direkomendasikan untuk kenaikan grade berkala.',
    'completed'
) ON CONFLICT DO NOTHING;
