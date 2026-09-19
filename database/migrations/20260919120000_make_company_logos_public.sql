-- Migration: 20260919120000_make_company_logos_public.sql
-- Purpose: Permit reading of public branding assets (company logos, system logos, avatars) across all tenants and unauthenticated contexts.

DROP POLICY IF EXISTS uploads_strict_tenant_isolation_policy ON public.uploads;

CREATE POLICY uploads_strict_tenant_isolation_policy ON public.uploads
    FOR ALL
    USING (
        company_id IS NULL
        OR entity_type IN ('company_logo', 'logo', 'avatar', 'branding')
        OR company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
        OR current_setting('app.is_super_tenant', true) = 'true'
    )
    WITH CHECK (
        company_id IS NULL
        OR entity_type IN ('company_logo', 'logo', 'avatar', 'branding')
        OR company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
        OR current_setting('app.is_super_tenant', true) = 'true'
    );

-- Mark existing uploads referenced in companies or settings as company_logo with NULL company_id and role_level_required = 5
UPDATE public.uploads
SET entity_type = 'company_logo', company_id = NULL, role_level_required = 5
WHERE file_path IN (
    SELECT regexp_replace(logo_url, '^/api/', '') FROM public.companies WHERE logo_url IS NOT NULL
) OR file_path IN (
    SELECT ltrim(logo_url, '/') FROM public.companies WHERE logo_url IS NOT NULL
) OR file_path IN (
    SELECT regexp_replace(trim(both '"' from value::text), '^/api/', '') FROM public.settings WHERE key = 'company_logo' AND value IS NOT NULL AND value::text <> 'null'
) OR file_path IN (
    SELECT ltrim(trim(both '"' from value::text), '/') FROM public.settings WHERE key = 'company_logo' AND value IS NOT NULL AND value::text <> 'null'
);
