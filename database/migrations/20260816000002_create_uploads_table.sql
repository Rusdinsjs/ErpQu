-- Migration: Create uploads table for File IDOR & Access Control (QSEC-006)

CREATE TABLE IF NOT EXISTS public.uploads (
    id UUID PRIMARY KEY,
    file_path VARCHAR(500) NOT NULL UNIQUE,
    original_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size INT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES public.users(id),
    company_id UUID,
    role_level_required INT NOT NULL DEFAULT 5,
    entity_type VARCHAR(100),
    entity_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uploads_uploaded_by ON public.uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_uploads_company_id ON public.uploads(company_id);
CREATE INDEX IF NOT EXISTS idx_uploads_file_path ON public.uploads(file_path);
