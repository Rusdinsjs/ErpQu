-- Migration: 20260820000003_auth_sessions_and_refresh_tokens.sql
-- Description: Create tables for refresh tokens, distributed user sessions, and tenant storage quotas (Fase 22 Governance)

CREATE TABLE IF NOT EXISTS public.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    replaced_by_token VARCHAR(255),
    device_fingerprint VARCHAR(255),
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON public.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON public.refresh_tokens(token_hash);

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_token_hash VARCHAR(255) NOT NULL,
    device_fingerprint VARCHAR(255),
    ip_address VARCHAR(50),
    user_agent TEXT,
    last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);

CREATE TABLE IF NOT EXISTS public.tenant_storage_quotas (
    tenant_id UUID PRIMARY KEY,
    max_storage_bytes BIGINT NOT NULL DEFAULT 10737418240, -- Default 10 GB
    used_storage_bytes BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for user sessions and refresh tokens
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Grant permissions to erpqu_app runtime role
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erpqu_app') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.refresh_tokens TO erpqu_app;
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_sessions TO erpqu_app;
        GRANT SELECT, INSERT, UPDATE ON public.tenant_storage_quotas TO erpqu_app;
    END IF;
END $$;
