-- Migration: 20260910120000_allow_null_company_id_uploads_rls.sql
-- Purpose: Update Row Level Security (RLS) on public.uploads to permit global/pre-company assets (company logos, user avatars) where company_id IS NULL.

DROP POLICY IF EXISTS uploads_strict_tenant_isolation_policy ON public.uploads;

CREATE POLICY uploads_strict_tenant_isolation_policy ON public.uploads
    FOR ALL
    USING (
        company_id IS NULL
        OR company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
        OR current_setting('app.is_super_tenant', true) = 'true'
    )
    WITH CHECK (
        company_id IS NULL
        OR company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
        OR current_setting('app.is_super_tenant', true) = 'true'
    );
