-- Migration: 20260820000001_strict_tenant_company_rls_isolation.sql
-- Purpose: Enforce strict PostgreSQL Row Level Security (RLS) and FORCE ROW LEVEL SECURITY
-- on all tenant and company owned business tables (Fase 17 Isolation Governance)

DO $$
DECLARE
    t text;
    tenant_tables text[] := ARRAY[
        'assets',
        'sales_invoices',
        'purchase_bills',
        'purchase_orders',
        'expenses',
        'journal_entries',
        'general_ledger_entries',
        'payment_entries',
        'stock_entries',
        'stock_ledger_entries',
        'work_orders',
        'payroll_entries',
        'clients',
        'vendors',
        'uploads'
    ];
BEGIN
    FOREACH t IN ARRAY tenant_tables LOOP
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            -- 1. Ensure company_id column exists
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS company_id UUID', t);
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_company_id ON public.%I(company_id)', t, t);

            -- 2. Enable & Force Row Level Security (Fail-Closed)
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
            EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);

            -- 3. Create or replace strict tenant isolation policy
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
        END IF;
    END LOOP;
END $$;
