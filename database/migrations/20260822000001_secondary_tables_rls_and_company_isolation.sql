-- Migration: 20260822000001_secondary_tables_rls_and_company_isolation.sql
-- Purpose: Extend strict PostgreSQL Row Level Security (RLS), FORCE ROW LEVEL SECURITY,
-- Foreign Keys, and company_id backfill to secondary EAM, Work Order, Outbox, and Upload tables.

DO $$
DECLARE
    default_cmp_id UUID;
    t text;
    secondary_tables text[] := ARRAY[
        'work_order_parts',
        'asset_custody_histories',
        'asset_depreciation_schedules',
        'asset_transfers',
        'asset_impairments',
        'asset_disposals',
        'uploads'
    ];
BEGIN
    -- 1. Get default company ID for safe backfill
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'companies') THEN
        SELECT id INTO default_cmp_id FROM companies WHERE status = 'ACTIVE' LIMIT 1;
        IF default_cmp_id IS NULL THEN
            SELECT id INTO default_cmp_id FROM companies LIMIT 1;
        END IF;
    END IF;

    FOREACH t IN ARRAY secondary_tables LOOP
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            -- Add company_id column if not exists
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS company_id UUID', t);
            
            -- Backfill company_id from default_cmp_id
            IF default_cmp_id IS NOT NULL THEN
                EXECUTE format('UPDATE public.%I SET company_id = $1 WHERE company_id IS NULL', t) USING default_cmp_id;
            END IF;

            -- Create index
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_company_id ON public.%I(company_id)', t, t);

            -- Enable and Force Row Level Security (Fail-Closed)
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
            EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);

            -- Strict tenant isolation policy
            EXECUTE format('DROP POLICY IF EXISTS %I_strict_tenant_isolation_policy ON public.%I', t, t);
            EXECUTE format('CREATE POLICY %I_strict_tenant_isolation_policy ON public.%I
                FOR ALL
                USING (
                    company_id = NULLIF(current_setting(''app.current_company_id'', true), '''')::uuid
                    OR current_setting(''app.is_super_tenant'', true) = ''true''
                )
                WITH CHECK (
                    company_id = NULLIF(current_setting(''app.current_company_id'', true), '''')::uuid
                    OR current_setting(''app.is_super_tenant'', true) = ''true''
                )', t, t);

            -- Add foreign key constraint
            IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'companies') THEN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'fk_' || t || '_company_id' 
                    AND table_name = t
                ) THEN
                    BEGIN
                        EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT fk_%I_company_id FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE RESTRICT', t, t);
                    EXCEPTION WHEN OTHERS THEN
                        -- Ignore if foreign key conflict exists during initial migration
                    END;
                END IF;
            END IF;
        END IF;
    END LOOP;
END $$;
