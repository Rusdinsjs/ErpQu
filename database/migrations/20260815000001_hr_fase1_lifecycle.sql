-- MIGRATION: 20260815000001 - HR Fase 1: Employee Lifecycle
-- Diselaraskan: employees, departments, users (existing tables)

-- 1. MASTER JABATAN (HR_DESIGNATIONS)
CREATE TABLE IF NOT EXISTS hr_designations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) UNIQUE,
    description TEXT,
    grade VARCHAR(20),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    is_manager BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hr_designations_dept ON hr_designations(department_id);
CREATE INDEX IF NOT EXISTS idx_hr_designations_active ON hr_designations(is_active);

-- 2. TIPE KEPEGAWAIAN (HR_EMPLOYMENT_TYPES)
CREATE TABLE IF NOT EXISTS hr_employment_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) UNIQUE NOT NULL,
    description TEXT,
    max_contract_years INT,
    is_eligible_bpjs BOOLEAN NOT NULL DEFAULT TRUE,
    is_eligible_pph21 BOOLEAN NOT NULL DEFAULT TRUE,
    is_eligible_leave BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO hr_employment_types (name, code, description, max_contract_years, is_eligible_bpjs, is_eligible_leave) VALUES
    ('Perjanjian Kerja Waktu Tertentu', 'pkwt', 'Karyawan kontrak dengan batas waktu tertentu', 2, TRUE, TRUE),
    ('Perjanjian Kerja Waktu Tidak Tertentu', 'pkwtt', 'Karyawan tetap tanpa batas waktu', NULL, TRUE, TRUE),
    ('Karyawan Magang', 'magang', 'Mahasiswa/fresh graduate dalam program magang', NULL, FALSE, FALSE),
    ('Karyawan Outsourcing', 'outsourcing', 'Karyawan melalui perusahaan penyedia jasa', NULL, FALSE, FALSE),
    ('Masa Percobaan (Probation)', 'probation', 'Karyawan baru dalam masa percobaan 3 bulan', NULL, FALSE, TRUE)
ON CONFLICT (code) DO NOTHING;

-- 3. EXTEND EMPLOYEES TABLE
ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS designation_id UUID REFERENCES hr_designations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS employment_type_id UUID REFERENCES hr_employment_types(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS grade VARCHAR(20),
    ADD COLUMN IF NOT EXISTS probation_end_date DATE,
    ADD COLUMN IF NOT EXISTS confirmation_date DATE,
    ADD COLUMN IF NOT EXISTS photo_url TEXT;
CREATE INDEX IF NOT EXISTS idx_employees_designation ON employees(designation_id);
CREATE INDEX IF NOT EXISTS idx_employees_employment_type ON employees(employment_type_id);

-- 4. HR EMPLOYEE LIFECYCLE (Riwayat Karir)
CREATE TABLE IF NOT EXISTS hr_employee_lifecycle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    effective_date DATE NOT NULL,
    notes TEXT,
    from_designation_id UUID REFERENCES hr_designations(id) ON DELETE SET NULL,
    to_designation_id UUID REFERENCES hr_designations(id) ON DELETE SET NULL,
    from_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    to_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    from_position VARCHAR(100),
    to_position VARCHAR(100),
    from_salary NUMERIC(15,2),
    to_salary NUMERIC(15,2),
    warning_level VARCHAR(10),
    warning_expiry_date DATE,
    warning_reason TEXT,
    last_working_date DATE,
    exit_reason TEXT,
    exit_interview_notes TEXT,
    document_url TEXT,
    document_number VARCHAR(100),
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hr_lifecycle_employee ON hr_employee_lifecycle(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_lifecycle_event_type ON hr_employee_lifecycle(event_type);
CREATE INDEX IF NOT EXISTS idx_hr_lifecycle_effective_date ON hr_employee_lifecycle(effective_date);

-- 5. HR EMPLOYEE DOCUMENTS
CREATE TABLE IF NOT EXISTS hr_employee_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_name VARCHAR(200),
    document_number VARCHAR(100),
    document_url TEXT NOT NULL,
    file_name TEXT,
    file_size BIGINT,
    mime_type VARCHAR(100),
    expiry_date DATE,
    notes TEXT,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hr_documents_employee ON hr_employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_documents_type ON hr_employee_documents(document_type);

-- 6. HR EMPLOYEE EDUCATION
CREATE TABLE IF NOT EXISTS hr_employee_education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    level VARCHAR(50) NOT NULL,
    institution_name VARCHAR(200) NOT NULL,
    major VARCHAR(150),
    graduation_year INT,
    gpa NUMERIC(3,2),
    is_highest BOOLEAN NOT NULL DEFAULT FALSE,
    attachment_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hr_education_employee ON hr_employee_education(employee_id);

-- 7. TRIGGERS
DROP TRIGGER IF EXISTS trigger_hr_designations_updated_at ON hr_designations;
CREATE TRIGGER trigger_hr_designations_updated_at BEFORE UPDATE ON hr_designations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS trigger_hr_employment_types_updated_at ON hr_employment_types;
CREATE TRIGGER trigger_hr_employment_types_updated_at BEFORE UPDATE ON hr_employment_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS trigger_hr_lifecycle_updated_at ON hr_employee_lifecycle;
CREATE TRIGGER trigger_hr_lifecycle_updated_at BEFORE UPDATE ON hr_employee_lifecycle FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS trigger_hr_documents_updated_at ON hr_employee_documents;
CREATE TRIGGER trigger_hr_documents_updated_at BEFORE UPDATE ON hr_employee_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
