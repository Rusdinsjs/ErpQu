
-- ============================================================
-- MIGRATION: 20260815000006 - HR Fase 6: Recruitment (ATS), Training & Disciplinary Actions
-- ============================================================

-- 1. JOB OPENINGS (LOWONGAN PEKERJAAN)
CREATE TABLE IF NOT EXISTS hr_job_openings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(150) NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    designation_id UUID REFERENCES hr_designations(id) ON DELETE SET NULL,
    employment_type VARCHAR(50) NOT NULL DEFAULT 'Permanent', -- 'Permanent', 'Contract', 'Internship'
    openings_count INT NOT NULL DEFAULT 1,
    min_experience_years INT NOT NULL DEFAULT 1,
    salary_min NUMERIC(15,2) DEFAULT 0.0,
    salary_max NUMERIC(15,2) DEFAULT 0.0,
    location VARCHAR(100) DEFAULT 'Site / Head Office',
    description TEXT NOT NULL,
    requirements TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'closed'
    posted_date DATE NOT NULL DEFAULT CURRENT_DATE,
    closing_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_job_status ON hr_job_openings(status);

-- 2. JOB APPLICANTS & ATS PIPELINE
CREATE TABLE IF NOT EXISTS hr_job_applicants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_opening_id UUID NOT NULL REFERENCES hr_job_openings(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    resume_url TEXT,
    portfolio_url TEXT,
    stage VARCHAR(30) NOT NULL DEFAULT 'applied', -- 'applied', 'screening', 'interview_hr', 'technical_test', 'interview_user', 'offering', 'hired', 'rejected'
    rating INT DEFAULT 3, -- 1 to 5 stars
    notes TEXT,
    rejection_reason TEXT,
    converted_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_applicant_job ON hr_job_applicants(job_opening_id);
CREATE INDEX IF NOT EXISTS idx_hr_applicant_stage ON hr_job_applicants(stage);

-- 3. TRAINING PROGRAMS (PROGRAM PELATIHAN & KOMPETENSI)
CREATE TABLE IF NOT EXISTS hr_training_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(150) NOT NULL,
    code VARCHAR(30) UNIQUE NOT NULL,
    description TEXT,
    trainer_type VARCHAR(20) NOT NULL DEFAULT 'internal', -- 'internal', 'external'
    duration_hours INT NOT NULL DEFAULT 8,
    is_mandatory BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TRAINING EVENTS (JADWAL EVENT PELATIHAN)
CREATE TABLE IF NOT EXISTS hr_training_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES hr_training_programs(id) ON DELETE RESTRICT,
    title VARCHAR(150) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location VARCHAR(150) NOT NULL DEFAULT 'Ruang Training Kantor Pusat / Onsite',
    trainer_name VARCHAR(100) NOT NULL,
    total_cost NUMERIC(15,2) DEFAULT 0.0,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'ongoing', 'completed', 'cancelled'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TRAINING PARTICIPANTS (PESERTA PELATIHAN)
CREATE TABLE IF NOT EXISTS hr_training_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES hr_training_events(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    attendance_status VARCHAR(20) NOT NULL DEFAULT 'registered', -- 'registered', 'attended', 'absent'
    score NUMERIC(5,2),
    certificate_issued BOOLEAN NOT NULL DEFAULT FALSE,
    certificate_no VARCHAR(100),
    valid_until DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_event_emp UNIQUE (event_id, employee_id)
);

-- 6. EMPLOYEE CERTIFICATIONS (SERTIFIKASI & LISENSI KARYAWAN)
CREATE TABLE IF NOT EXISTS hr_employee_certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    certificate_name VARCHAR(150) NOT NULL,
    certificate_no VARCHAR(100) NOT NULL,
    issuing_body VARCHAR(150) NOT NULL, -- e.g. 'BNSP / Kementerian ESDM / Kemnaker'
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    document_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'expiring_soon', 'expired'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_cert_emp ON hr_employee_certifications(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_cert_expiry ON hr_employee_certifications(expiry_date);

-- 7. DISCIPLINARY ACTIONS (SURAT PERINGATAN SP1/SP2/SP3 & TEGURAN)
CREATE TABLE IF NOT EXISTS hr_disciplinary_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    action_type VARCHAR(20) NOT NULL, -- 'teguran', 'sp1', 'sp2', 'sp3'
    infraction_category VARCHAR(100) NOT NULL, -- 'Indisipliner Kehadiran', 'Pelanggaran SOP K3', 'Kelalaian Operasional', 'Ketidaksopanan / Etika'
    incident_date DATE NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE NOT NULL, -- Standar Depnaker 6 bulan
    reason_details TEXT NOT NULL,
    action_plan TEXT,
    issued_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'expired', 'revoked'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_sp_emp ON hr_disciplinary_actions(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_sp_status ON hr_disciplinary_actions(status);

-- 8. Seed Initial Data
INSERT INTO hr_job_openings (
    id, title, employment_type, openings_count, min_experience_years, salary_min, salary_max, description, requirements, status, closing_date
) VALUES (
    '40000000-0000-0000-0000-000000000001',
    'Senior Heavy Equipment Mechanic (Alat Berat)',
    'Permanent',
    2,
    3,
    9000000,
    14000000,
    'Bertanggung jawab atas pemeliharaan berkala, troubleshooting hidrolik, dan overhaul excavator/bulldozer.',
    'Pengalaman min 3 tahun alat berat Komatsu/CAT, memiliki sertifikasi SIO/K3 mekanik.',
    'open',
    CURRENT_DATE + INTERVAL '30 days'
), (
    '40000000-0000-0000-0000-000000000002',
    'Safety Officer (HSE Supervisor)',
    'Permanent',
    1,
    2,
    8000000,
    12000000,
    'Mengawasi kepatuhan keselamatan kerja (K3), inspeksi APD, investigasi insiden lapangan, dan audit SMK3.',
    'Memiliki sertifikasi Ahli K3 Umum Kemnaker atau Pengawas Operasional Pertama (POP).',
    'open',
    CURRENT_DATE + INTERVAL '45 days'
) ON CONFLICT DO NOTHING;

INSERT INTO hr_job_applicants (
    job_opening_id, full_name, email, phone, stage, rating, notes
) VALUES (
    '40000000-0000-0000-0000-000000000001',
    'Budi Pratama, A.Md',
    'budi.pratama@candidate.id',
    '081298765432',
    'interview_user',
    5,
    'Sangat menguasai sistem hidrolik dan mesin diesel alat berat, rekam jejak kerja prima.'
), (
    '40000000-0000-0000-0000-000000000002',
    'Rahmat Hidayat, S.T',
    'rahmat.hse@candidate.id',
    '081377889900',
    'screening',
    4,
    'Memiliki sertifikat Ahli K3 Umum dan pengalaman proyek tambang 3 tahun.'
) ON CONFLICT DO NOTHING;

INSERT INTO hr_training_programs (
    id, title, code, description, trainer_type, duration_hours, is_mandatory
) VALUES (
    '50000000-0000-0000-0000-000000000001',
    'Pelatihan K3 & Keselamatan Operasional Tambang',
    'TRN-K3-001',
    'Standar keselamatan kerja di area operasional tambang & pemeliharaan unit',
    'internal',
    16,
    TRUE
), (
    '50000000-0000-0000-0000-000000000002',
    'Sertifikasi Pengawas Operasional Pertama (POP)',
    'TRN-POP-002',
    'Sertifikasi kompetensi pengawas operasional pertambangan standar ESDM / BNSP',
    'external',
    24,
    FALSE
) ON CONFLICT (code) DO NOTHING;

INSERT INTO hr_training_events (
    id, program_id, title, start_date, end_date, trainer_name, total_cost, status
) VALUES (
    '51000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    'Pelatihan K3 & Safety Operation Batch III - 2026',
    CURRENT_DATE + INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '9 days',
    'Ir. Hendra Gunawan, M.T (HSE Lead)',
    5000000,
    'scheduled'
) ON CONFLICT DO NOTHING;

INSERT INTO hr_employee_certifications (
    employee_id, certificate_name, certificate_no, issuing_body, issue_date, expiry_date, status
) VALUES (
    'e0000000-0000-0000-0000-000000000004', -- Ahmad Fauzi
    'Surat Izin Operator (SIO) Excavator & Bulldozer Kelas 1',
    'SIO/KEMNAKER/2024/09871',
    'Kementerian Ketenagakerjaan RI',
    '2024-05-10',
    '2027-05-10',
    'active'
) ON CONFLICT DO NOTHING;

INSERT INTO hr_disciplinary_actions (
    employee_id, action_type, infraction_category, incident_date, issue_date, valid_until, reason_details, status
) VALUES (
    'e0000000-0000-0000-0000-000000000004', -- Ahmad Fauzi
    'teguran',
    'Indisipliner Kehadiran',
    '2026-07-20',
    '2026-07-21',
    '2027-01-21',
    'Keterlambatan masuk shift kerja pagi tanpa konfirmasi atasan selama 3 hari berturut-turut.',
    'active'
) ON CONFLICT DO NOTHING;
