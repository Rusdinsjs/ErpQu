-- Migration: 20260822000004_remaining_tables_rls.sql
-- Purpose: Apply strict RLS to remaining business tables in hr schema and public.departments (Point A5).

DO $$
DECLARE
    t record;
    target_tables text[][] := ARRAY[
        ['hr', 'employees'],
        ['hr', 'attendance_logs'],
        ['hr', 'leave_requests'],
        ['public', 'departments']
    ];
    default_company_id uuid;
BEGIN
    -- Resolve default company for backfilling
    SELECT id INTO default_company_id 
    FROM public.companies 
    WHERE code = 'ERP-QU' OR name = 'ERP-QU' 
    LIMIT 1;

    IF default_company_id IS NULL THEN
        SELECT id INTO default_company_id 
        FROM public.companies 
        WHERE status = 'ACTIVE' 
        LIMIT 1;
    END IF;

    FOR i IN 1..array_length(target_tables, 1) LOOP
        DECLARE
            schema_n text := target_tables[i][1];
            table_n text := target_tables[i][2];
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = schema_n AND tablename = table_n) THEN
                
                -- 1. Ensure company_id exists
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = schema_n AND table_name = table_n AND column_name = 'company_id') THEN
                    EXECUTE format('ALTER TABLE %I.%I ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE RESTRICT', schema_n, table_n);
                END IF;

                -- 2. Backfill NULLs
                IF default_company_id IS NOT NULL THEN
                    EXECUTE format('UPDATE %I.%I SET company_id = %L WHERE company_id IS NULL', schema_n, table_n, default_company_id);
                END IF;

                -- 3. Enforce NOT NULL (skip if no default company and table is not empty)
                BEGIN
                    EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN company_id SET NOT NULL', schema_n, table_n);
                EXCEPTION WHEN not_null_violation THEN
                    RAISE WARNING 'Could not enforce NOT NULL on %.% because of existing NULLs and no default company', schema_n, table_n;
                END;

                -- 4. Enable RLS
                EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', schema_n, table_n);

                -- 5. Drop any existing lenient policies
                EXECUTE format('DROP POLICY IF EXISTS %I_tenant_policy ON %I.%I', table_n, schema_n, table_n);
                EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_%I ON %I.%I', table_n, schema_n, table_n);
                EXECUTE format('DROP POLICY IF EXISTS rls_policy_%I ON %I.%I', table_n, schema_n, table_n);
                EXECUTE format('DROP POLICY IF EXISTS %I_strict_tenant_isolation_policy ON %I.%I', table_n, schema_n, table_n);

                -- 6. Create Strict RLS Policy
                EXECUTE format('CREATE POLICY %I_strict_tenant_isolation_policy ON %I.%I
                    FOR ALL
                    USING (
                        company_id = NULLIF(current_setting(''app.current_company_id'', true), '''')::uuid
                        OR current_setting(''app.is_super_tenant'', true) = ''true''
                    )
                    WITH CHECK (
                        company_id = NULLIF(current_setting(''app.current_company_id'', true), '''')::uuid
                        OR current_setting(''app.is_super_tenant'', true) = ''true''
                    )', table_n, schema_n, table_n);
            END IF;
        END;
    END LOOP;
END $$;
